// ============================================================
// Njangui — Système d'authentification (localStorage)
// ============================================================

export type UserRole = "tourist" | "agency" | "hotel" | "agence-voyages" | "guide" | "admin";

export interface DtUser {
  id: string;
  email: string;
  password: string; // En prod: hashé. Ici démo seulement.
  role: UserRole;
  firstName: string;
  lastName: string;
  phone: string;
  avatar?: string;
  // Champs spécifiques selon le rôle
  companyName?: string;   // agence, hôtel, transport
  city?: string;
  specialty?: string;     // guide
  languages?: string[];   // guide
  guideId?: string;       // guide touristique
  plan?: string;          // agence
  verified?: boolean;
  createdAt: string;
}

// ─── Comptes de démonstration pré-créés ────────────────────────────────────
export const DEMO_ACCOUNTS: DtUser[] = [
  // ── TOURISTES ────────────────────────────────────────────────
  {
    id: "usr_001",
    email: "aicha@njangui.cm",
    password: "password123",
    role: "tourist",
    firstName: "Aïcha",
    lastName: "Nkomo",
    phone: "+237 6 99 00 00 01",
    avatar: "https://i.pravatar.cc/80?img=5",
    city: "Douala",
    verified: true,
    createdAt: "2025-11-10",
  },
  {
    id: "usr_002",
    email: "jean@njangui.cm",
    password: "password123",
    role: "tourist",
    firstName: "Jean-Marc",
    lastName: "Beti",
    phone: "+237 6 77 11 22 33",
    avatar: "https://i.pravatar.cc/80?img=6",
    city: "Yaoundé",
    verified: true,
    createdAt: "2025-12-05",
  },
  {
    id: "usr_003",
    email: "sandrine@njangui.cm",
    password: "password123",
    role: "tourist",
    firstName: "Sandrine",
    lastName: "Kameni",
    phone: "+237 6 55 44 33 22",
    avatar: "https://i.pravatar.cc/80?img=7",
    city: "Bafoussam",
    verified: true,
    createdAt: "2026-01-15",
  },

  // ── GUIDES TOURISTIQUES ──────────────────────────────────────
  {
    id: "usr_010",
    email: "guide.mboma@njangui.cm",
    password: "password123",
    role: "guide",
    firstName: "Paul",
    lastName: "Mboma",
    phone: "+237 6 88 00 11 22",
    avatar: "https://i.pravatar.cc/80?img=12",
    city: "Kribi",
    specialty: "Eco-tourisme & Randonnée",
    languages: ["Français", "Anglais", "Bassa"],
    guideId: "g11",
    verified: true,
    createdAt: "2025-10-01",
  },
  {
    id: "usr_011",
    email: "guide.fouda@njangui.cm",
    password: "password123",
    role: "guide",
    firstName: "Marie",
    lastName: "Fouda",
    phone: "+237 6 66 77 88 99",
    avatar: "https://i.pravatar.cc/80?img=9",
    city: "Yaoundé",
    specialty: "Patrimoine culturel & Histoire",
    languages: ["Français", "Anglais", "Ewondo"],
    guideId: "g4",
    verified: true,
    createdAt: "2025-09-20",
  },

  // ── AGENCES TOURISTIQUES (Tenants) ───────────────────────────
  {
    id: "usr_020",
    email: "evasion@njangui.cm",
    password: "password123",
    role: "agency",
    firstName: "Directeur",
    lastName: "Évasion Cameroun",
    phone: "+237 6 99 00 00 00",
    avatar: "https://i.pravatar.cc/80?img=1",
    companyName: "Évasion Cameroun",
    city: "Douala",
    plan: "semester",
    verified: true,
    createdAt: "2025-08-15",
  },
  {
    id: "usr_021",
    email: "montaventure@njangui.cm",
    password: "password123",
    role: "agency",
    firstName: "Gérant",
    lastName: "Mont Aventure",
    phone: "+237 6 88 99 00 11",
    avatar: "https://i.pravatar.cc/80?img=2",
    companyName: "Mont Aventure",
    city: "Yaoundé",
    plan: "yearly",
    verified: true,
    createdAt: "2025-07-01",
  },
  {
    id: "usr_022",
    email: "afriquesauvage@njangui.cm",
    password: "password123",
    role: "agency",
    firstName: "Responsable",
    lastName: "Afrique Sauvage",
    phone: "+237 6 77 00 11 22",
    avatar: "https://i.pravatar.cc/80?img=4",
    companyName: "Afrique Sauvage",
    city: "Garoua",
    plan: "monthly",
    verified: true,
    createdAt: "2026-01-10",
  },

  // ── HÔTELIERS (Tenants) ──────────────────────────────────────
  {
    id: "usr_030",
    email: "lafalaise@njangui.cm",
    password: "password123",
    role: "hotel",
    firstName: "Manager",
    lastName: "La Falaise",
    phone: "+237 6 55 00 11 22",
    avatar: "https://i.pravatar.cc/80?img=15",
    companyName: "Hôtel La Falaise",
    city: "Douala",
    verified: true,
    createdAt: "2025-09-10",
  },
  {
    id: "usr_031",
    email: "kribibeach@njangui.cm",
    password: "password123",
    role: "hotel",
    firstName: "Directrice",
    lastName: "Kribi Beach",
    phone: "+237 6 44 55 66 77",
    avatar: "https://i.pravatar.cc/80?img=16",
    companyName: "Kribi Beach Hotel",
    city: "Kribi",
    verified: true,
    createdAt: "2025-11-01",
  },

  // ── AGENCES DE VOYAGES (Tenants) ───────────────────────────
  {
    id: "usr_040",
    email: "transcam@njangui.cm",
    password: "password123",
    role: "agence-voyages",
    firstName: "Directeur",
    lastName: "Trans-Cameroun",
    phone: "+237 6 33 44 55 66",
    avatar: "https://i.pravatar.cc/80?img=20",
    companyName: "Trans-Cameroun",
    city: "Bafoussam",
    verified: true,
    createdAt: "2025-10-15",
  },
  {
    id: "usr_041",
    email: "starvoyages@njangui.cm",
    password: "password123",
    role: "agence-voyages",
    firstName: "Manager",
    lastName: "Star Voyages",
    phone: "+237 6 22 33 44 55",
    avatar: "https://i.pravatar.cc/80?img=21",
    companyName: "Star Voyages",
    city: "Yaoundé",
    verified: true,
    createdAt: "2025-08-20",
  },

  // ── ADMIN NJANGUI ──────────────────────────────────────────
  {
    id: "usr_099",
    email: "admin@njangui.cm",
    password: "admin123",
    role: "admin",
    firstName: "Super",
    lastName: "Admin",
    phone: "+237 6 00 00 00 00",
    avatar: "https://i.pravatar.cc/80?img=33",
    verified: true,
    createdAt: "2025-01-01",
  },
];

const STORAGE_KEY = "dt_current_user";
const USERS_KEY = "dt_users_db";

const AUTH_EVENT = "dt-auth-change";

function notifyAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_EVENT));
  }
}

// ─── Initialise la base de données utilisateurs si vide ───────────────────
function initUsersDb() {
  if (typeof window === "undefined") return;
  const existing = localStorage.getItem(USERS_KEY);
  if (!existing) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEMO_ACCOUNTS));
  } else {
    let users: DtUser[] = JSON.parse(existing);
    // Migration: remplacer les anciens emails @dreamtour.cm par @njangui.cm
    let migrated = false;
    users = users.map(u => {
      if (u.email.endsWith("@dreamtour.cm")) {
        migrated = true;
        return { ...u, email: u.email.replace("@dreamtour.cm", "@njangui.cm") };
      }
      return u;
    });
    // Merge: ajouter les comptes démo manquants sans écraser les inscriptions
    const ids = new Set(users.map((u) => u.id));
    const toAdd = DEMO_ACCOUNTS.filter((d) => !ids.has(d.id));
    if (toAdd.length > 0 || migrated) {
      localStorage.setItem(USERS_KEY, JSON.stringify([...users, ...toAdd]));
    }
  }
}

// ─── Récupère tous les utilisateurs ───────────────────────────────────────
function getUsers(): DtUser[] {
  if (typeof window === "undefined") return [];
  initUsersDb();
  return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]");
}

// ─── Connexion ─────────────────────────────────────────────────────────────
export function login(email: string, password: string): { user: DtUser | null; error: string | null } {
  const users = getUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!user) {
    return { user: null, error: "Email ou mot de passe incorrect." };
  }
  // Migration des rôles obsolètes
  if (!ROLE_REDIRECT[user.role as UserRole]) {
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      users[idx].role = "agence-voyages" as UserRole;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
    user.role = "agence-voyages" as UserRole;
  }
  // Migration email si nécessaire
  if (user.email.endsWith("@dreamtour.cm")) {
    user.email = user.email.replace("@dreamtour.cm", "@njangui.cm");
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      users[idx].email = user.email;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  }
  // Stocker sans le mot de passe
  const safeUser = { ...user };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
  notifyAuthChange();
  return { user: safeUser, error: null };
}

// ─── Inscription ───────────────────────────────────────────────────────────
export function register(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  companyName?: string;
}): { user: DtUser | null; error: string | null } {
  const users = getUsers();
  if (users.find((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
    return { user: null, error: "Cet email est déjà utilisé." };
  }
  const newUser: DtUser = {
    id: `usr_${Date.now()}`,
    email: data.email,
    password: data.password,
    role: data.role,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    companyName: data.companyName,
    verified: false,
    plan: data.role === "agency" ? undefined : undefined,
    createdAt: new Date().toISOString().split("T")[0],
  };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
  notifyAuthChange();
  return { user: newUser, error: null };
}

// ─── Récupérer l'utilisateur courant ──────────────────────────────────────
export function getCurrentUser(): DtUser | null {
  if (typeof window === "undefined") return null;
  initUsersDb();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const user = JSON.parse(raw) as DtUser;
  if (!ROLE_REDIRECT[user.role]) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
  // Migration email de session si nécessaire
  if (user.email.endsWith("@dreamtour.cm")) {
    user.email = user.email.replace("@dreamtour.cm", "@njangui.cm");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }
  return user;
}

// ─── Déconnexion ───────────────────────────────────────────────────────────
export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
  notifyAuthChange();
}

// ─── Mettre à jour son profil ─────────────────────────────────────────────
export function updateProfile(updates: Partial<DtUser>): DtUser | null {
  const current = getCurrentUser();
  if (!current) return null;
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === current.id);
  if (idx === -1) return null;
  const updated = { ...users[idx], ...updates };
  users[idx] = updated;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  notifyAuthChange();
  return updated;
}

// ─── Récupérer tous les utilisateurs ───────────────────────────────────────
export function getAllUsers(): DtUser[] {
  return getUsers();
}

export function getUserById(id: string): DtUser | undefined {
  return getUsers().find(u => u.id === id);
}

// ─── Redirection selon le rôle ────────────────────────────────────────────
export const ROLE_REDIRECT: Record<UserRole, string> = {
  tourist: "/dashboard/tourist",
  agency: "/dashboard/agency",
  hotel: "/dashboard/hotel",
  "agence-voyages": "/dashboard/agence-voyages",
  guide: "/dashboard/guide",
  admin: "/dashboard/admin",
};
