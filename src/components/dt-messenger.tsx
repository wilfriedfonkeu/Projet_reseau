"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getCurrentUser, type DtUser } from "@/src/lib/auth-store";
import { loadGuides, loadSavedMessages, sendMessage, type MessageData } from "@/src/lib/njangui-data";
import {
  canonicalUserId,
  getAdminDirectoryContacts,
  getAliasesForUserId,
  getContactById,
  getConversationsForUser,
  getGuideDirectoryContacts,
  getHotelDirectoryContacts,
  getMessagesForConversation,
  getTouristAgencyDirectoryContacts,
  getTouristDirectoryContacts,
  getTravelAgencyDirectoryContacts,
  markConversationRead,
  type ContactCategory,
  type Conversation,
  type MessageContact,
} from "@/src/lib/messaging-contacts";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent } from "@/src/components/ui/card";
import { ArrowLeft, Check, Filter, MessageCircle, Search, Send, Users, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { useLang } from "@/src/lib/lang";

interface DtMessengerProps {
  /** Fourni par le dashboard agence pour afficher le bouton « Contacts ». */
  agencyId?: string;
  /** Contact à ouvrir automatiquement (liens « Contacter » du dashboard). */
  initialContactId?: string | null;
  /** Change à chaque clic pour rouvrir même le même contact. */
  contactNonce?: number;
}

export function DtMessenger({ agencyId, initialContactId, contactNonce }: DtMessengerProps) {
  const { t } = useLang();
  const [user, setUser] = useState<DtUser | null>(null);
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<{ withUserId: string; packId?: string } | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [input, setInput] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);
  const [showContacts, setShowContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [contactCategoryFilter, setContactCategoryFilter] = useState<"all" | ContactCategory>("all");
  const [conversationSearch, setConversationSearch] = useState("");
  const [messagesReady, setMessagesReady] = useState(false);
  const [directoryTick, setDirectoryTick] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isTouristAgencyDirectory = !!agencyId;
  const isTouristDirectory = !!user && user.role === "tourist" && !agencyId;
  const isGuideDirectory = !!user && user.role === "guide" && !agencyId;
  const isHotelDirectory = !!user && user.role === "hotel" && !agencyId;
  const isTravelAgencyDirectory = !!user && user.role === "agence-voyages" && !agencyId;
  const isAdminDirectory = !!user && user.role === "admin" && !agencyId;
  const hasDirectory =
    isTouristAgencyDirectory ||
    isTouristDirectory ||
    isGuideDirectory ||
    isHotelDirectory ||
    isTravelAgencyDirectory ||
    isAdminDirectory;

  const contacts = useMemo(() => {
    if (agencyId) return getTouristAgencyDirectoryContacts();
    if (user?.role === "tourist") return getTouristDirectoryContacts();
    if (user?.role === "guide") return getGuideDirectoryContacts();
    if (user?.role === "hotel") return getHotelDirectoryContacts();
    if (user?.role === "agence-voyages") return getTravelAgencyDirectoryContacts();
    if (user?.role === "admin") return getAdminDirectoryContacts();
    return [];
  }, [agencyId, user?.role, directoryTick]);

  const directoryGroupDefs = useMemo((): { key: ContactCategory; label: string }[] => {
    if (isTouristAgencyDirectory) {
      return [
        { key: "admin", label: t("contact_category_admin") },
        { key: "travel_agency", label: t("contact_category_travel_agency") },
        { key: "hotel", label: t("contact_category_hotel") },
        { key: "guide", label: t("contact_category_guide") },
        { key: "tourist", label: t("contact_category_tourist") },
      ];
    }
    if (isTouristDirectory) {
      return [
        { key: "agency", label: t("contact_category_agency") },
        { key: "travel_agency", label: t("contact_category_travel_agency") },
        { key: "hotel", label: t("contact_category_hotel") },
        { key: "guide", label: t("contact_category_guide") },
      ];
    }
    if (isGuideDirectory) {
      return [
        { key: "admin", label: t("contact_category_admin") },
        { key: "agency", label: t("contact_category_agency") },
        { key: "travel_agency", label: t("contact_category_travel_agency") },
        { key: "hotel", label: t("contact_category_hotel") },
        { key: "tourist", label: t("contact_category_tourist") },
      ];
    }
    if (isHotelDirectory) {
      return [
        { key: "admin", label: t("contact_category_admin") },
        { key: "agency", label: t("contact_category_agency") },
        { key: "travel_agency", label: t("contact_category_travel_agency") },
        { key: "guide", label: t("contact_category_guide") },
        { key: "tourist", label: t("contact_category_tourist") },
      ];
    }
    if (isTravelAgencyDirectory) {
      return [
        { key: "admin", label: t("contact_category_admin") },
        { key: "agency", label: t("contact_category_agency") },
        { key: "guide", label: t("contact_category_guide") },
        { key: "hotel", label: t("contact_category_hotel") },
        { key: "tourist", label: t("contact_category_tourist") },
      ];
    }
    if (isAdminDirectory) {
      return [
        { key: "agency", label: t("contact_category_agency") },
        { key: "travel_agency", label: t("contact_category_travel_agency") },
        { key: "hotel", label: t("contact_category_hotel") },
        { key: "guide", label: t("contact_category_guide") },
        { key: "tourist", label: t("contact_category_tourist") },
      ];
    }
    return [
      { key: "partner", label: t("contact_category_partner") },
      { key: "guide", label: t("contact_category_guide") },
      { key: "admin", label: t("contact_category_admin") },
      { key: "tourist", label: t("contact_category_tourist") },
      { key: "agency", label: t("contact_category_agency") },
      { key: "hotel", label: t("contact_category_hotel") },
      { key: "travel_agency", label: t("contact_category_travel_agency") },
    ];
  }, [t, isTouristAgencyDirectory, isTouristDirectory, isGuideDirectory, isHotelDirectory, isTravelAgencyDirectory, isAdminDirectory]);

  const groupedContacts = useMemo(() => {
    const normalize = (value: string) =>
      value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const query = normalize(contactSearch);
    const filtered = contacts.filter((c) => {
      if (contactCategoryFilter !== "all" && c.category !== contactCategoryFilter) return false;
      return normalize(`${c.name} ${c.subtitle ?? ""}`).includes(query);
    });
    const groups = directoryGroupDefs
      .map((g) => ({ ...g, items: filtered.filter((c) => c.category === g.key) }))
      .filter((g) => g.items.length > 0);
    return groups;
  }, [contacts, contactSearch, contactCategoryFilter, directoryGroupDefs]);

  function selectContact(contactId: string, conversations: Conversation[]) {
    const canonical = canonicalUserId(contactId);
    const existing = conversations.find((c) => canonicalUserId(c.withUserId) === canonical);
    setSelectedConv(
      existing
        ? { withUserId: existing.withUserId, packId: existing.packId }
        : { withUserId: contactId }
    );
    setShowMobileList(false);
  }

  useEffect(() => {
    const u = getCurrentUser();
    Promise.all([loadSavedMessages(), loadGuides()]).then(() => {
      setUser(u);
      setMessagesReady(true);
      setDirectoryTick((t) => t + 1);
      if (!u) return;
      const conversations = getConversationsForUser(u);
      setConvs(conversations);

      // Chargement direct de /dashboard/agency?dm=<contactId>
      const directContact = new URLSearchParams(window.location.search).get("dm");
      if (directContact) selectContact(directContact, conversations);
    });
  }, []);

  // Clic sur « Contacter » depuis une liste du dashboard : le messenger est déjà monté.
  useEffect(() => {
    if (!messagesReady || !user || !initialContactId) return;
    const timer = window.setTimeout(() => {
      selectContact(initialContactId, getConversationsForUser(user));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialContactId, contactNonce, messagesReady, user]);

  useEffect(() => {
    if (selectedConv && user) {
      markConversationRead(user, selectedConv.withUserId).then(() => {
        setMessages(getMessagesForConversation(user, selectedConv.withUserId, selectedConv.packId));
        setConvs(getConversationsForUser(user));
      });
    }
  }, [selectedConv, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!user || !input.trim() || !selectedConv) return;
    const msg: MessageData = {
      id: `msg_${Date.now()}`,
      senderId: user.id,
      receiverId: selectedConv.withUserId,
      packId: selectedConv.packId,
      text: input.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    };
    await sendMessage(msg);
    setInput("");
    setMessages((prev) => [...prev, msg]);
    setConvs(getConversationsForUser(user));
  }

  function getOtherUserInfo(otherId: string) {
    const contact = getContactById(otherId);
    return {
      name: contact?.name ?? otherId,
      avatar: contact?.avatar ?? "",
      subtitle: contact?.subtitle,
    };
  }

  function openConversation(contact: MessageContact) {
    const existing = convs.find(
      (c) => canonicalUserId(c.withUserId) === canonicalUserId(contact.id)
    );
    setSelectedConv(
      existing
        ? { withUserId: existing.withUserId, packId: existing.packId }
        : { withUserId: contact.id }
    );
    setShowContacts(false);
    setShowMobileList(false);
    setInput("");
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  const filteredConvs = useMemo(() => {
    const normalize = (value: string) =>
      value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const q = normalize(conversationSearch);
    if (!q) return convs;
    return convs.filter((conv) => {
      const info = getOtherUserInfo(conv.withUserId);
      return normalize(
        `${info.name} ${info.subtitle ?? ""} ${conv.lastMessage.text} ${conv.packId ?? ""}`
      ).includes(q);
    });
  }, [convs, conversationSearch]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <MessageCircle size={48} className="mx-auto mb-3 opacity-40" />
          <p>Connectez-vous pour accéder à vos messages</p>
        </div>
      </div>
    );
  }

  const otherUser = selectedConv ? getOtherUserInfo(selectedConv.withUserId) : null;
  const selfAliases = getAliasesForUserId(user.id);

  return (
    <div className="flex h-[calc(100vh-12rem)] border rounded-xl overflow-hidden bg-card">
      {/* Conversation list */}
      <div className={`w-full sm:w-80 border-r shrink-0 flex flex-col ${showMobileList ? "block" : "hidden sm:flex"}`}>
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold text-lg">Messages</h2>
            {hasDirectory && (
              <Button size="sm" variant="outline" onClick={() => { setContactSearch(""); setContactCategoryFilter("all"); setShowContacts(true); }}>
                <Users size={14} className="mr-1" /> {t("contacts_btn")}
              </Button>
            )}
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={conversationSearch}
              onChange={(e) => setConversationSearch(e.target.value)}
              placeholder={t("conversation_search_placeholder")}
              className="pl-9 pr-8 h-9"
            />
            {conversationSearch && (
              <button
                type="button"
                onClick={() => setConversationSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label={t("clear_filters")}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {convs.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {t("no_conversations_yet")}
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {t("conversation_search_empty")}
            </div>
          ) : (
            filteredConvs.map((conv) => {
              const info = getOtherUserInfo(conv.withUserId);
              const isUnread = selfAliases.includes(conv.lastMessage.receiverId) &&
                !selfAliases.includes(conv.lastMessage.senderId) &&
                !conv.lastMessage.read;
              return (
                <button
                  key={`${conv.withUserId}_${conv.packId ?? ""}`}
                  onClick={() => { setSelectedConv({ withUserId: conv.withUserId, packId: conv.packId }); setShowMobileList(false); }}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${isUnread ? "bg-orange-50 font-bold" : ""} ${selectedConv?.withUserId === conv.withUserId ? "bg-muted" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EA580C]/10 flex items-center justify-center shrink-0 text-xs font-bold text-[#EA580C] overflow-hidden">
                      {info.avatar ? (
                        <img src={info.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        info.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm truncate ${isUnread ? "font-bold" : ""}`}>{info.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{conv.lastMessage.text}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(conv.lastMessage.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message thread */}
      <div className={`flex-1 flex flex-col ${showMobileList ? "hidden sm:flex" : "flex"}`}>
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle size={64} className="mx-auto mb-4 opacity-20" />
              <p>{t("select_conversation")}</p>
              {hasDirectory && <p className="text-xs mt-2">{t("contacts_hint")}</p>}
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setShowMobileList(true)}>
                <ArrowLeft size={18} />
              </Button>
              <div className="w-9 h-9 rounded-full bg-[#EA580C]/10 flex items-center justify-center shrink-0 text-xs font-bold text-[#EA580C] overflow-hidden">
                {otherUser?.avatar ? (
                  <img src={otherUser.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  otherUser?.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm truncate">{otherUser?.name}</div>
                {otherUser?.subtitle && <div className="text-[10px] text-muted-foreground truncate">{otherUser.subtitle}</div>}
                {selectedConv.packId && <div className="text-[10px] text-muted-foreground">{t("about_label")} {selectedConv.packId}</div>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">{t("contact_no_conversation")}</p>
              )}
              {messages.map((m) => {
                const isMe = selfAliases.includes(m.senderId);
                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${isMe ? "bg-[#EA580C] text-white rounded-br-sm" : "bg-muted rounded-bl-sm"}`}>
                      <div>{m.text}</div>
                      <div className={`text-[10px] mt-1 ${isMe ? "text-orange-200" : "text-muted-foreground"}`}>
                        {formatDate(m.createdAt)}
                        {isMe && <span className="ml-1">{m.read ? "✓✓" : "✓"}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                placeholder={t("message_placeholder_messenger")}
                className="flex-1"
              />
              <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
                <Send size={16} />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Contact picker */}
      {showContacts && hasDirectory && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowContacts(false)}>
          <Card className="w-full max-w-lg max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-0 flex flex-col max-h-[85vh]">
              <div className="flex items-start justify-between gap-3 border-b p-4">
                <div>
                  <h3 className="font-bold text-lg">{t("contacts_modal_title")}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isTouristAgencyDirectory
                      ? t("contacts_modal_desc_tourist_agency")
                      : isTouristDirectory
                      ? t("contacts_modal_desc_tourist")
                      : isGuideDirectory
                      ? t("contacts_modal_desc_guide")
                      : isHotelDirectory
                      ? t("contacts_modal_desc_hotel")
                      : isTravelAgencyDirectory
                      ? t("contacts_modal_desc_travel_agency")
                      : isAdminDirectory
                      ? t("contacts_modal_desc_admin")
                      : t("contacts_modal_desc")}
                  </p>
                </div>
                <button onClick={() => setShowContacts(false)} className="p-1 rounded hover:bg-accent">
                  <X size={18} />
                </button>
              </div>

              <div className="p-3 border-b">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      autoFocus
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      placeholder={t("contacts_search_placeholder")}
                      className="pl-9 pr-8"
                    />
                    {contactSearch && (
                      <button
                        type="button"
                        onClick={() => setContactSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                        aria-label={t("clear_filters")}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="shrink-0 gap-2">
                        <Filter size={14} />
                        <span className="max-w-[140px] truncate">
                          {contactCategoryFilter === "all"
                            ? t("contacts_filter_all")
                            : directoryGroupDefs.find((g) => g.key === contactCategoryFilter)?.label ?? t("contacts_filter_all")}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 z-[70]">
                      <DropdownMenuLabel>Catégorie</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => setContactCategoryFilter("all")} className="justify-between">
                        <span>{t("contacts_filter_all")}</span>
                        {contactCategoryFilter === "all" && <Check size={14} className="text-[#EA580C]" />}
                      </DropdownMenuItem>
                      {directoryGroupDefs.map((g) => (
                        <DropdownMenuItem
                          key={g.key}
                          onSelect={() => setContactCategoryFilter(g.key)}
                          className="justify-between"
                        >
                          <span>{g.label}</span>
                          {contactCategoryFilter === g.key && <Check size={14} className="text-[#EA580C]" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {groupedContacts.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">{t("contacts_empty")}</p>
                ) : (
                  groupedContacts.map((group) => (
                    <div key={group.key}>
                      <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#EA580C]">{group.label}</h4>
                      <div className="space-y-1">
                        {group.items.map((contact) => (
                          <button
                            key={contact.id}
                            onClick={() => openConversation(contact)}
                            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted/60 transition-colors"
                          >
                            <div className="w-9 h-9 rounded-full bg-[#EA580C]/10 text-[#EA580C] flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                              {contact.avatar ? (
                                <img src={contact.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                contact.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold truncate">{contact.name}</div>
                              {contact.subtitle && <div className="text-xs text-muted-foreground truncate">{contact.subtitle}</div>}
                            </div>
                            <Send size={14} className="text-muted-foreground shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
