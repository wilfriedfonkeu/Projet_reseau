// ============================================================
// Njangui — Répertoire de contacts et conversations (messagerie)
// ============================================================

import { DEMO_ACCOUNTS, getUserById, isAccountActive, type DtUser } from "@/src/lib/auth-store";
import {
  AGENCIES,
  getAllGuides,
  getAllMessages,
  getAllPartners,
  getReservationsByAgency,
  markMessagesRead,
  type GuideData,
  type MessageData,
  type PartnerData,
} from "@/src/lib/njangui-data";

export type ContactCategory = "admin" | "agency" | "partner" | "guide" | "tourist" | "hotel" | "travel_agency";

export interface MessageContact {
  id: string; // identifiant utilisé comme receiverId dans les messages
  name: string;
  category: ContactCategory;
  subtitle?: string;
  avatar?: string;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Tous les comptes actifs connus (localStorage + comptes de démonstration). */
export function listUsers(options?: { includeInactive?: boolean }): DtUser[] {
  let stored: DtUser[] = [];
  if (typeof window !== "undefined") {
    try {
      stored = JSON.parse(window.localStorage.getItem("dt_users_db") ?? "[]") as DtUser[];
      if (!Array.isArray(stored)) stored = [];
    } catch {
      stored = [];
    }
  }
  const ids = new Set(stored.map((u) => u.id));
  const users = [...stored, ...DEMO_ACCOUNTS.filter((u) => !ids.has(u.id))].map((u) => ({
    ...u,
    accountStatus: u.accountStatus ?? "active",
  }));
  return options?.includeInactive ? users : users.filter((u) => isAccountActive(u));
}

export function findUserById(id: string, options?: { includeInactive?: boolean }): DtUser | undefined {
  if (!id) return undefined;
  const stored = typeof window !== "undefined" ? getUserById(id) : undefined;
  const user = stored ?? DEMO_ACCOUNTS.find((u) => u.id === id);
  if (!user) return undefined;
  const normalized = { ...user, accountStatus: user.accountStatus ?? "active" } as DtUser;
  if (!options?.includeInactive && !isAccountActive(normalized)) return undefined;
  return normalized;
}

function isUserIdActive(id?: string): boolean {
  if (!id) return true;
  return !!findUserById(id, { includeInactive: false });
}

function resolvePartnerUser(partner: PartnerData): DtUser | undefined {
  if (partner.userId) return findUserById(partner.userId);
  const name = normalize(partner.name);
  const contact = normalize(partner.contact);
  return listUsers().find((u) => {
    if (u.role !== "hotel" && u.role !== "agence-voyages") return false;
    const company = normalize(u.companyName ?? "");
    const person = normalize(`${u.firstName} ${u.lastName}`);
    const emailLocal = normalize((u.email ?? "").split("@")[0]);
    return (
      (company.length > 3 && (company === name || name.includes(company) || company.includes(name))) ||
      (contact.length > 3 && contact === person) ||
      (emailLocal.length > 3 && emailLocal === name)
    );
  });
}

function resolveGuideUser(guide: GuideData): DtUser | undefined {
  if (guide.userId) return findUserById(guide.userId);
  const name = normalize(guide.name);
  return listUsers().find((u) => u.role === "guide" && normalize(`${u.firstName} ${u.lastName}`) === name);
}

/** Ramène un ancien identifiant (ag1, partner_par3, guide_g1...) au compte utilisateur réel. */
export function canonicalUserId(id: string): string {
  const agency = AGENCIES.find((a) => a.id === id);
  if (agency?.userId) return agency.userId;

  const partner = getAllPartners().find((p) => `partner_${p.id}` === id);
  if (partner) {
    const user = resolvePartnerUser(partner);
    if (user) return user.id;
  }

  const guide = getAllGuides().find((g) => `guide_${g.id}` === id);
  if (guide) {
    const user = resolveGuideUser(guide);
    if (user) return user.id;
  }

  return id;
}

/** Identifiants sous lesquels un utilisateur peut recevoir des messages. */
export function getAliasesForUserId(id: string): string[] {
  const canonical = canonicalUserId(id);
  const aliases = new Set<string>([id, canonical]);
  const user = findUserById(canonical);
  if (!user) return [...aliases];

  const agency = AGENCIES.find((a) => a.userId === user.id || a.id === user.id);
  if (agency) {
    aliases.add(agency.id);
    if (agency.userId) aliases.add(agency.userId);
  }

  getAllPartners().forEach((p) => {
    const linked = resolvePartnerUser(p);
    if (linked?.id === user.id) {
      aliases.add(`partner_${p.id}`);
      if (p.userId) aliases.add(p.userId);
    }
  });

  getAllGuides().forEach((g) => {
    if (g.userId && !isUserIdActive(g.userId)) return;
    const linked = resolveGuideUser(g);
    if (linked?.id === user.id) {
      aliases.add(`guide_${g.id}`);
      if (g.userId) aliases.add(g.userId);
    }
  });

  return [...aliases];
}

/** Contacts proposés à une agence touristique, regroupés par catégorie. */
export function getAgencyContacts(agencyId: string): MessageContact[] {
  const contacts: MessageContact[] = [];
  const push = (contact?: MessageContact) => {
    if (contact && !contacts.some((c) => c.id === contact.id)) contacts.push(contact);
  };

  const admin = listUsers().find((u) => u.role === "admin");
  if (admin) {
    push({
      id: admin.id,
      name: `${admin.firstName} ${admin.lastName}`.trim() || "Admin Njangui",
      category: "admin",
      subtitle: "Njangui",
      avatar: admin.avatar,
    });
  }

  getAllPartners()
    .filter((p) => p.agencyId === agencyId)
    .forEach((p) => {
      if (p.userId && !isUserIdActive(p.userId)) return;
      const user = resolvePartnerUser(p);
      if (p.userId && !user) return;
      push({
        id: user?.id ?? `partner_${p.id}`,
        name: p.name,
        category: "partner",
        subtitle: p.city || undefined,
        avatar: user?.avatar,
      });
    });

  getAllGuides()
    .filter((g) => g.agencyId === agencyId)
    .forEach((g) => {
      if (g.userId && !isUserIdActive(g.userId)) return;
      const user = resolveGuideUser(g);
      if (g.userId && !user) return;
      push({
        id: user?.id ?? `guide_${g.id}`,
        name: g.name,
        category: "guide",
        subtitle: g.specialty,
        avatar: g.photo || g.image || user?.avatar,
      });
    });

  getReservationsByAgency(agencyId).forEach((r) => {
    if (!r.userId) return;
    const user = findUserById(r.userId);
    push({
      id: r.userId,
      name: user ? `${user.firstName} ${user.lastName}`.trim() : r.userId,
      category: "tourist",
      subtitle: `${r.packName} · ${r.ref}`,
      avatar: user?.avatar,
    });
  });

  return contacts;
}

/** Identifiant de messagerie à utiliser pour contacter un partenaire. */
export function getPartnerContactId(partner: PartnerData): string {
  return resolvePartnerUser(partner)?.id ?? `partner_${partner.id}`;
}

/** Identifiant de messagerie à utiliser pour contacter un guide. */
export function getGuideContactId(guide: GuideData): string {
  return resolveGuideUser(guide)?.id ?? `guide_${guide.id}`;
}

/** Identifiant de messagerie à utiliser pour contacter un touriste. */
export function getTouristContactId(userId: string): string {
  return userId;
}

/** Annuaire complet pour les touristes : agences touristiques, agences de voyages, hôteliers, guides. */
export function getTouristDirectoryContacts(): MessageContact[] {
  const contacts: MessageContact[] = [];
  const push = (contact?: MessageContact) => {
    if (contact && !contacts.some((c) => c.id === contact.id)) contacts.push(contact);
  };

  // Agences touristiques
  AGENCIES.forEach((a) => {
    if (a.userId && !isUserIdActive(a.userId)) return;
    push({
      id: a.userId ?? a.id,
      name: a.name,
      category: "agency",
      subtitle: a.city,
      avatar: a.logo,
    });
  });

  // Hôteliers et agences de voyages inscrits
  listUsers()
    .filter((u) => u.role === "hotel" || u.role === "agence-voyages")
    .forEach((u) => {
      push({
        id: u.id,
        name: u.companyName || `${u.firstName} ${u.lastName}`.trim(),
        category: u.role === "hotel" ? "hotel" : "travel_agency",
        subtitle: u.city,
        avatar: u.avatar,
      });
    });

  // Guides inscrits
  getAllGuides().forEach((g) => {
    if (g.userId && !isUserIdActive(g.userId)) return;
    const user = resolveGuideUser(g);
    push({
      id: user?.id ?? `guide_${g.id}`,
      name: g.name,
      category: "guide",
      subtitle: g.specialty ? `${g.specialty}${g.city ? ` · ${g.city}` : ""}` : g.city,
      avatar: g.photo || g.image || user?.avatar,
    });
  });

  return contacts;
}

/** Annuaire complet pour les guides : admin, agences touristiques, agences de voyages, hôteliers, touristes. */
export function getGuideDirectoryContacts(): MessageContact[] {
  const contacts: MessageContact[] = [];
  const push = (contact?: MessageContact) => {
    if (contact && !contacts.some((c) => c.id === contact.id)) contacts.push(contact);
  };

  // Administration
  listUsers()
    .filter((u) => u.role === "admin")
    .forEach((u) => {
      push({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim() || "Admin Njangui",
        category: "admin",
        subtitle: "Njangui",
        avatar: u.avatar,
      });
    });

  // Agences touristiques
  AGENCIES.forEach((a) => {
    if (a.userId && !isUserIdActive(a.userId)) return;
    push({
      id: a.userId ?? a.id,
      name: a.name,
      category: "agency",
      subtitle: a.city,
      avatar: a.logo,
    });
  });

  // Agences de voyages et hôteliers inscrits
  listUsers()
    .filter((u) => u.role === "hotel" || u.role === "agence-voyages")
    .forEach((u) => {
      push({
        id: u.id,
        name: u.companyName || `${u.firstName} ${u.lastName}`.trim(),
        category: u.role === "hotel" ? "hotel" : "travel_agency",
        subtitle: u.city,
        avatar: u.avatar,
      });
    });

  // Touristes inscrits
  listUsers()
    .filter((u) => u.role === "tourist")
    .forEach((u) => {
      push({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim() || u.id,
        category: "tourist",
        subtitle: u.city,
        avatar: u.avatar,
      });
    });

  return contacts;
}

/** Annuaire complet pour les hôteliers : admin, agences touristiques, agences de voyages, guides, touristes. */
export function getHotelDirectoryContacts(): MessageContact[] {
  const contacts: MessageContact[] = [];
  const push = (contact?: MessageContact) => {
    if (contact && !contacts.some((c) => c.id === contact.id)) contacts.push(contact);
  };

  // Administration
  listUsers()
    .filter((u) => u.role === "admin")
    .forEach((u) => {
      push({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim() || "Admin Njangui",
        category: "admin",
        subtitle: "Njangui",
        avatar: u.avatar,
      });
    });

  // Agences touristiques
  AGENCIES.forEach((a) => {
    if (a.userId && !isUserIdActive(a.userId)) return;
    push({
      id: a.userId ?? a.id,
      name: a.name,
      category: "agency",
      subtitle: a.city,
      avatar: a.logo,
    });
  });

  // Agences de voyages inscrites
  listUsers()
    .filter((u) => u.role === "agence-voyages")
    .forEach((u) => {
      push({
        id: u.id,
        name: u.companyName || `${u.firstName} ${u.lastName}`.trim(),
        category: "travel_agency",
        subtitle: u.city,
        avatar: u.avatar,
      });
    });

  // Guides inscrits
  getAllGuides().forEach((g) => {
    if (g.userId && !isUserIdActive(g.userId)) return;
    const user = resolveGuideUser(g);
    push({
      id: user?.id ?? `guide_${g.id}`,
      name: g.name,
      category: "guide",
      subtitle: g.specialty ? `${g.specialty}${g.city ? ` · ${g.city}` : ""}` : g.city,
      avatar: g.photo || g.image || user?.avatar,
    });
  });

  // Touristes inscrits
  listUsers()
    .filter((u) => u.role === "tourist")
    .forEach((u) => {
      push({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim() || u.id,
        category: "tourist",
        subtitle: u.city,
        avatar: u.avatar,
      });
    });

  return contacts;
}

/** Annuaire complet pour les agences de voyages : admin, agences touristiques, guides, hôteliers, touristes. */
export function getTravelAgencyDirectoryContacts(): MessageContact[] {
  const contacts: MessageContact[] = [];
  const push = (contact?: MessageContact) => {
    if (contact && !contacts.some((c) => c.id === contact.id)) contacts.push(contact);
  };

  // Administration
  listUsers()
    .filter((u) => u.role === "admin")
    .forEach((u) => {
      push({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim() || "Admin Njangui",
        category: "admin",
        subtitle: "Njangui",
        avatar: u.avatar,
      });
    });

  // Agences touristiques
  AGENCIES.forEach((a) => {
    if (a.userId && !isUserIdActive(a.userId)) return;
    push({
      id: a.userId ?? a.id,
      name: a.name,
      category: "agency",
      subtitle: a.city,
      avatar: a.logo,
    });
  });

  // Guides inscrits
  getAllGuides().forEach((g) => {
    if (g.userId && !isUserIdActive(g.userId)) return;
    const user = resolveGuideUser(g);
    push({
      id: user?.id ?? `guide_${g.id}`,
      name: g.name,
      category: "guide",
      subtitle: g.specialty ? `${g.specialty}${g.city ? ` · ${g.city}` : ""}` : g.city,
      avatar: g.photo || g.image || user?.avatar,
    });
  });

  // Hôteliers inscrits
  listUsers()
    .filter((u) => u.role === "hotel")
    .forEach((u) => {
      push({
        id: u.id,
        name: u.companyName || `${u.firstName} ${u.lastName}`.trim(),
        category: "hotel",
        subtitle: u.city,
        avatar: u.avatar,
      });
    });

  // Touristes inscrits
  listUsers()
    .filter((u) => u.role === "tourist")
    .forEach((u) => {
      push({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim() || u.id,
        category: "tourist",
        subtitle: u.city,
        avatar: u.avatar,
      });
    });

  return contacts;
}

/** Annuaire complet pour l'admin : agences touristiques, agences de voyages, hôteliers, guides, touristes. */
export function getAdminDirectoryContacts(): MessageContact[] {
  const contacts: MessageContact[] = [];
  const push = (contact?: MessageContact) => {
    if (contact && !contacts.some((c) => c.id === contact.id)) contacts.push(contact);
  };

  // Agences touristiques
  AGENCIES.forEach((a) => {
    if (a.userId && !isUserIdActive(a.userId)) return;
    push({
      id: a.userId ?? a.id,
      name: a.name,
      category: "agency",
      subtitle: a.city,
      avatar: a.logo,
    });
  });

  // Agences de voyages et hôteliers inscrits
  listUsers()
    .filter((u) => u.role === "hotel" || u.role === "agence-voyages")
    .forEach((u) => {
      push({
        id: u.id,
        name: u.companyName || `${u.firstName} ${u.lastName}`.trim(),
        category: u.role === "hotel" ? "hotel" : "travel_agency",
        subtitle: u.city,
        avatar: u.avatar,
      });
    });

  // Guides inscrits
  getAllGuides().forEach((g) => {
    if (g.userId && !isUserIdActive(g.userId)) return;
    const user = resolveGuideUser(g);
    push({
      id: user?.id ?? `guide_${g.id}`,
      name: g.name,
      category: "guide",
      subtitle: g.specialty ? `${g.specialty}${g.city ? ` · ${g.city}` : ""}` : g.city,
      avatar: g.photo || g.image || user?.avatar,
    });
  });

  // Touristes inscrits
  listUsers()
    .filter((u) => u.role === "tourist")
    .forEach((u) => {
      push({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim() || u.id,
        category: "tourist",
        subtitle: u.city,
        avatar: u.avatar,
      });
    });

  return contacts;
}

/** Annuaire complet pour les agences touristiques : admin, agences de voyages, hôteliers, guides, touristes. */
export function getTouristAgencyDirectoryContacts(): MessageContact[] {
  const contacts: MessageContact[] = [];
  const push = (contact?: MessageContact) => {
    if (contact && !contacts.some((c) => c.id === contact.id)) contacts.push(contact);
  };

  // Administration
  listUsers()
    .filter((u) => u.role === "admin")
    .forEach((u) => {
      push({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim() || "Admin Njangui",
        category: "admin",
        subtitle: "Njangui",
        avatar: u.avatar,
      });
    });

  // Agences de voyages et hôteliers inscrits
  listUsers()
    .filter((u) => u.role === "hotel" || u.role === "agence-voyages")
    .forEach((u) => {
      push({
        id: u.id,
        name: u.companyName || `${u.firstName} ${u.lastName}`.trim(),
        category: u.role === "hotel" ? "hotel" : "travel_agency",
        subtitle: u.city,
        avatar: u.avatar,
      });
    });

  // Guides inscrits
  getAllGuides().forEach((g) => {
    if (g.userId && !isUserIdActive(g.userId)) return;
    const user = resolveGuideUser(g);
    push({
      id: user?.id ?? `guide_${g.id}`,
      name: g.name,
      category: "guide",
      subtitle: g.specialty ? `${g.specialty}${g.city ? ` · ${g.city}` : ""}` : g.city,
      avatar: g.photo || g.image || user?.avatar,
    });
  });

  // Touristes inscrits
  listUsers()
    .filter((u) => u.role === "tourist")
    .forEach((u) => {
      push({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim() || u.id,
        category: "tourist",
        subtitle: u.city,
        avatar: u.avatar,
      });
    });

  return contacts;
}

/** Retrouve les informations d'affichage d'un correspondant à partir de son identifiant. */
export function getContactById(id: string): MessageContact | undefined {
  const canonical = canonicalUserId(id);

  const agencyEntity = AGENCIES.find(
    (a) => a.id === id || a.id === canonical || a.userId === id || a.userId === canonical
  );
  if (agencyEntity) {
    if (agencyEntity.userId && !isUserIdActive(agencyEntity.userId)) return undefined;
    return {
      id: agencyEntity.userId ?? agencyEntity.id,
      name: agencyEntity.name,
      category: "agency",
      subtitle: agencyEntity.city,
      avatar: agencyEntity.logo,
    };
  }

  const guideEntity = getAllGuides().find(
    (g) => `guide_${g.id}` === id || `guide_${g.id}` === canonical || g.userId === id || g.userId === canonical
  );
  if (guideEntity) {
    if (guideEntity.userId && !isUserIdActive(guideEntity.userId)) return undefined;
    const linked = resolveGuideUser(guideEntity);
    if (linked && !isAccountActive(linked)) return undefined;
    return {
      id: linked?.id ?? `guide_${guideEntity.id}`,
      name: guideEntity.name,
      category: "guide",
      subtitle: guideEntity.specialty ? `${guideEntity.specialty}${guideEntity.city ? ` · ${guideEntity.city}` : ""}` : guideEntity.city,
      avatar: guideEntity.photo || guideEntity.image || linked?.avatar,
    };
  }

  for (const agency of AGENCIES) {
    const found = getAgencyContacts(agency.id).find(
      (c) => c.id === id || c.id === canonical || canonicalUserId(c.id) === canonical
    );
    if (found) return found;
  }

  const user = findUserById(id) ?? findUserById(canonical);
  if (user) {
    const agency = AGENCIES.find((a) => a.userId === user.id);
    if (agency) {
      return {
        id: user.id,
        name: agency.name,
        category: "agency",
        subtitle: agency.city,
        avatar: agency.logo ?? user.avatar,
      };
    }
    const category: ContactCategory =
      user.role === "hotel" ? "hotel"
      : user.role === "agence-voyages" ? "travel_agency"
      : user.role === "guide" ? "guide"
      : user.role === "tourist" ? "tourist"
      : user.role === "admin" ? "admin"
      : "partner";
    return {
      id: user.id,
      name: user.companyName || `${user.firstName} ${user.lastName}`.trim() || user.id,
      category,
      subtitle: user.city,
      avatar: user.avatar,
    };
  }

  return undefined;
}

export interface Conversation {
  withUserId: string;
  packId?: string;
  lastMessage: MessageData;
}

/** Conversations visibles par un utilisateur, en tenant compte des identifiants historiques. */
export function getConversationsForUser(user: DtUser): Conversation[] {
  const aliases = new Set(getAliasesForUserId(user.id));
  const convMap = new Map<string, Conversation>();

  for (const message of getAllMessages()) {
    const senderIsMe = aliases.has(message.senderId);
    const receiverIsMe = aliases.has(message.receiverId);
    if (senderIsMe === receiverIsMe) continue;

    const rawOtherId = senderIsMe ? message.receiverId : message.senderId;
    const otherId = canonicalUserId(rawOtherId);
    const key = message.packId ? `${otherId}_${message.packId}` : otherId;
    const existing = convMap.get(key);
    if (!existing || message.createdAt > existing.lastMessage.createdAt) {
      convMap.set(key, { withUserId: otherId, packId: message.packId, lastMessage: message });
    }
  }

  return Array.from(convMap.values()).sort((a, b) =>
    b.lastMessage.createdAt.localeCompare(a.lastMessage.createdAt)
  );
}

/** Messages d'une conversation, quels que soient les alias utilisés par les participants. */
export function getMessagesForConversation(user: DtUser, otherId: string, packId?: string): MessageData[] {
  const selfAliases = new Set(getAliasesForUserId(user.id));
  const otherAliases = new Set(getAliasesForUserId(otherId));

  return getAllMessages()
    .filter((m) => {
      const crosses =
        (selfAliases.has(m.senderId) && otherAliases.has(m.receiverId)) ||
        (otherAliases.has(m.senderId) && selfAliases.has(m.receiverId));
      if (!crosses) return false;
      return packId ? m.packId === packId : true;
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Marque une conversation comme lue, y compris lorsque les identifiants diffèrent. */
export async function markConversationRead(user: DtUser, otherId: string): Promise<void> {
  for (const selfAlias of getAliasesForUserId(user.id)) {
    for (const otherAlias of getAliasesForUserId(otherId)) {
      await markMessagesRead(selfAlias, otherAlias);
    }
  }
}
