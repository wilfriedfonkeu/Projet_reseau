"use client";

import { useMemo, useState, useEffect } from "react";
import { DashboardShell } from "@/src/components/dt-sidebar";
import { LayoutDashboard, Package, Users, DollarSign, Bell, MessageSquare, Settings, Sun, Moon, Globe, User, Camera, CreditCard, Plus, Pencil, Trash2, X, MoreHorizontal, Eye, EyeOff, Search, Download } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/src/components/ui/dropdown-menu";
import { getAllPacks, hidePack, unhidePack, isPackHidden, loadSubscriptionPlans, getSubscriptionPlans, saveSubscriptionPlan, updateSubscriptionPlan, removeSubscriptionPlan, loadSavedReservations, getAllReservations, type SubscriptionPlan } from "@/src/lib/njangui-data";
import { useOffersLoader } from "@/src/hooks/use-offers-loader";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from "recharts";
import { useAuth } from "@/src/lib/auth-context";
import { getAllUsers, isAccountActive, setUserAccountStatus, type DtUser, type UserRole } from "@/src/lib/auth-store";
import { loadSavedMessages, getAllMessages } from "@/src/lib/njangui-data";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DtMessenger } from "@/src/components/dt-messenger";
import { useLang } from "@/src/lib/lang";

const itemDefs = [
  { key: "overview", labelKey: "sidebar_overview_admin", icon: LayoutDashboard },
  { key: "packs", labelKey: "sidebar_packs_admin", icon: Package },
  { key: "partners", labelKey: "sidebar_partners_admin", icon: Users },
  { key: "subscriptions", labelKey: "sidebar_subscriptions_admin", icon: CreditCard },
  { key: "finance", labelKey: "sidebar_finance_admin", icon: DollarSign },
  { key: "notifications", labelKey: "sidebar_notif_admin", icon: Bell },
  { key: "messages", labelKey: "sidebar_messages", icon: MessageSquare },
  { key: "profile", labelKey: "sidebar_profile", icon: User },
  { key: "settings", labelKey: "sidebar_settings_admin", icon: Settings },
];

const PARTNER_ROLES: UserRole[] = ["agency", "hotel", "agence-voyages", "guide"];

export default function AdminDashboard() {
  useOffersLoader();
  const [active, setActive] = useState("overview");
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const { t, lang, setLang } = useLang();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [packSearch, setPackSearch] = useState("");
  const [packCategory, setPackCategory] = useState("all");
  const [partnerSearch, setPartnerSearch] = useState("");
  const [partnerTypeFilter, setPartnerTypeFilter] = useState("all");
  const [partnerStatusFilter, setPartnerStatusFilter] = useState("all");
  const [partnerCityFilter, setPartnerCityFilter] = useState("all");
  const emptyPlanForm = { label: "", price: "", period: "", publications: "", popular: false, save: "", published: true };
  const [plans, setPlans] = useState<SubscriptionPlan[]>(getSubscriptionPlans());
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState(emptyPlanForm);
  const [partnerUsers, setPartnerUsers] = useState<DtUser[]>([]);
  const [reservations, setReservations] = useState(getAllReservations());
  const [messages, setMessages] = useState(getAllMessages());

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.replace("/auth");
      return;
    }
    setIsDark(document.documentElement.classList.contains("dark"));
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setPhone(user.phone ?? "");
  }, [user, router]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    loadSubscriptionPlans().then(() => setPlans([...getSubscriptionPlans()]));
    setPartnerUsers(getAllUsers().filter((u) => PARTNER_ROLES.includes(u.role)));
    Promise.all([loadSavedReservations(), loadSavedMessages()]).then(() => {
      setReservations(getAllReservations());
      setMessages(getAllMessages());
    });
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("agency", "admin");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        updateProfile({ avatar: data.url });
        toast.success(t("profile_photo_updated"));
      } else {
        toast.error(t("modal_offer_upload_failed"));
      }
    } catch {
      toast.error(t("modal_offer_upload_failed"));
    }
    setUploadingAvatar(false);
    e.target.value = "";
  };

  const handleSaveProfile = () => {
    const updated = updateProfile({ firstName, lastName, phone });
    if (updated) toast.success(t("profile_updated"));
  };

  const openCreatePlan = () => {
    setEditingPlanId(null);
    setPlanForm(emptyPlanForm);
    setPlanModalOpen(true);
  };

  const openEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlanId(plan.id);
    setPlanForm({
      label: plan.label,
      price: String(plan.price),
      period: plan.period,
      publications: String(plan.publications),
      popular: plan.popular,
      save: plan.save ?? "",
      published: plan.published !== false,
    });
    setPlanModalOpen(true);
  };

  const handleSavePlan = async () => {
    const price = Number(planForm.price);
    const publications = Number(planForm.publications);
    if (!planForm.label.trim() || !planForm.period.trim() || !Number.isFinite(price) || price < 0 || !Number.isFinite(publications) || publications < 0) {
      toast.error(t("fill_all_fields_error"));
      return;
    }
    const payload: SubscriptionPlan = {
      id: editingPlanId ?? `plan_${Date.now()}`,
      label: planForm.label.trim(),
      price,
      period: planForm.period.trim(),
      publications,
      popular: planForm.popular,
      save: planForm.save.trim() ? planForm.save.trim() : null,
      published: planForm.published,
    };
    if (editingPlanId) {
      await updateSubscriptionPlan(editingPlanId, payload);
      toast.success(t("subscription_plan_updated"));
    } else {
      await saveSubscriptionPlan(payload);
      toast.success(t("subscription_plan_saved"));
    }
    await loadSubscriptionPlans();
    setPlans([...getSubscriptionPlans()]);
    setPlanModalOpen(false);
    setEditingPlanId(null);
    setPlanForm(emptyPlanForm);
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm(t("confirm_delete_plan"))) return;
    await removeSubscriptionPlan(id);
    await loadSubscriptionPlans();
    setPlans([...getSubscriptionPlans()]);
    toast.success(t("subscription_plan_deleted"));
  };

  const handleTogglePlanPublished = async (plan: SubscriptionPlan) => {
    const nextPublished = !(plan.published !== false);
    await updateSubscriptionPlan(plan.id, { published: nextPublished });
    await loadSubscriptionPlans();
    setPlans([...getSubscriptionPlans()]);
    toast.success(nextPublished ? t("subscription_plan_published_toast") : t("subscription_plan_unpublished_toast"));
  };

  const handleTogglePartnerStatus = (partner: DtUser) => {
    const nextStatus = isAccountActive(partner) ? "suspended" : "active";
    const updated = setUserAccountStatus(partner.id, nextStatus);
    if (!updated) return;
    setPartnerUsers((prev) => prev.map((p) => (p.id === partner.id ? updated : p)));
    const name = partner.companyName || `${partner.firstName} ${partner.lastName}`.trim() || partner.email;
    toast.success(
      nextStatus === "suspended"
        ? `${name} — ${t("partner_status_suspended")}`
        : `${name} — ${t("partner_active")}`
    );
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const items = itemDefs.map((d) => ({ ...d, label: t(d.labelKey) }));
  const allPacks = getAllPacks();
  const packCategories = useMemo(
    () => Array.from(new Set(allPacks.map((p: any) => String(p.category ?? "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [allPacks]
  );
  const filteredPacks = useMemo(() => {
    const normalize = (value: string) =>
      value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const q = normalize(packSearch);
    return allPacks.filter((p: any) => {
      const matchCategory = packCategory === "all" || p.category === packCategory;
      if (!matchCategory) return false;
      if (!q) return true;
      return normalize(
        `${p.name ?? ""} ${p.category ?? ""} ${p.duration ?? ""} ${p.city ?? ""} ${p.destination ?? ""} ${p.price ?? ""}`
      ).includes(q);
    });
  }, [allPacks, packSearch, packCategory]);

  const filteredPartnerUsers = useMemo(() => {
    const normalize = (value: string) =>
      value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const q = normalize(partnerSearch);
    return partnerUsers.filter((p) => {
      if (partnerTypeFilter !== "all" && p.role !== partnerTypeFilter) return false;
      if (partnerStatusFilter !== "all" && (isAccountActive(p) ? "active" : "suspended") !== partnerStatusFilter) return false;
      if (partnerCityFilter !== "all" && (p.city || "") !== partnerCityFilter) return false;
      if (!q) return true;
      const displayName =
        p.role === "guide"
          ? `${p.firstName} ${p.lastName}`.trim()
          : p.companyName || `${p.firstName} ${p.lastName}`.trim();
      return normalize(`${displayName} ${p.email ?? ""} ${p.city ?? ""} ${p.role ?? ""}`).includes(q);
    });
  }, [partnerUsers, partnerSearch, partnerTypeFilter, partnerStatusFilter, partnerCityFilter]);
  const partnerCities = Array.from(new Set(partnerUsers.map((p) => p.city).filter(Boolean))).sort();
  const activeReservations = reservations.filter((r) => r.status === "Confirmée" || r.status === "Terminée");
  const revenue = activeReservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
  const commissions = Math.round(revenue * 0.1);
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthReservationsList = reservations.filter((r) => {
    const date = new Date(r.createdAt);
    return date >= currentMonthStart && date <= now;
  });
  const previousMonthReservations = reservations.filter((r) => {
    const date = new Date(r.createdAt);
    return date >= previousMonthStart && date < currentMonthStart;
  });
  const monthReservations = monthReservationsList.length;
  const compareMonths = (current: number, previous: number) => {
    if (previous === 0) return current ? (lang === "en" ? "New this month" : "Nouveau ce mois-ci") : (lang === "en" ? "No change" : "Stable");
    const change = Math.round(((current - previous) / previous) * 100);
    return `${change > 0 ? "+" : ""}${change}% ${lang === "en" ? "vs last month" : "vs mois dernier"}`;
  };
  const monthRevenue = monthReservationsList
    .filter((r) => r.status === "Confirmée" || r.status === "Terminée")
    .reduce((sum, r) => sum + (r.totalPrice || 0), 0);
  const previousMonthRevenue = previousMonthReservations
    .filter((r) => r.status === "Confirmée" || r.status === "Terminée")
    .reduce((sum, r) => sum + (r.totalPrice || 0), 0);
  const kpis = [
    { label: lang === "en" ? "Active partners" : "Partenaires actifs", value: String(partnerUsers.filter(isAccountActive).length), trend: `${partnerUsers.length} ${lang === "en" ? "total" : "au total"}`, target: "partners" },
    { label: lang === "en" ? "Registered tourists" : "Touristes inscrits", value: String(getAllUsers().filter((u) => u.role === "tourist").length), trend: lang === "en" ? "Current accounts" : "Comptes enregistrés", target: "partners" },
    { label: lang === "en" ? "Bookings this month" : "Réservations ce mois", value: String(monthReservations), trend: compareMonths(monthReservations, previousMonthReservations.length), target: "finance" },
    { label: lang === "en" ? "Booking volume (FCFA)" : "Volume des réservations (FCFA)", value: revenue.toLocaleString(), trend: `${lang === "en" ? "This month" : "Ce mois-ci"} : ${monthRevenue.toLocaleString()} FCFA · ${compareMonths(monthRevenue, previousMonthRevenue)}`, target: "finance" },
  ];
  const monthData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(); date.setMonth(date.getMonth() - 5 + i);
    const items = activeReservations.filter((r) => { const d = new Date(r.createdAt); return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear(); });
    return { mois: date.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { month: "short" }), revenus: items.reduce((s, r) => s + r.totalPrice, 0) / 1000000, reservations: items.length };
  });
  const notifications = [
    ...reservations.filter((r) => r.status === "En attente").map((r) => ({ id: `booking-${r.ref}`, msg: `${lang === "en" ? "Booking awaiting confirmation" : "Réservation en attente de confirmation"} : ${r.packName} (${r.ref})`, level: "warn" })),
    ...partnerUsers.filter((p) => !p.verified).map((p) => ({ id: `partner-${p.id}`, msg: `${lang === "en" ? "Partner awaiting verification" : "Partenaire à vérifier"} : ${p.companyName || `${p.firstName} ${p.lastName}`}`, level: "info" })),
    ...messages.filter((m) => !m.read).map((m) => ({ id: `message-${m.id}`, msg: `${lang === "en" ? "Unread message" : "Message non lu"} : ${m.text}`, level: "info" })),
  ];
  const downloadFinanceCsv = () => {
    const rows = [["Référence", "Offre", "Statut", "Date", "Montant FCFA"], ...activeReservations.map((r) => [r.ref, r.packName, r.status, r.createdAt, String(r.totalPrice)])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "suivi-financier.csv"; link.click(); URL.revokeObjectURL(url);
  };
  const [, forceUpdate] = useState(0);
  return (
    <DashboardShell title={t("admin_title")} items={items} active={active} onChange={setActive}>
      {active === "overview" && (
        <div className="space-y-6">
          <Card><CardContent className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><h3 className="font-bold">{lang === "en" ? "Needs your attention" : "À traiter en priorité"}</h3><p className="text-sm text-muted-foreground mt-1">{lang === "en" ? "Open pending bookings, partner reviews and unread messages." : "Accédez aux réservations en attente, partenaires à vérifier et messages non lus."}</p></div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setActive("notifications")}>{lang === "en" ? "Alerts" : "Alertes"}<Badge className="ml-2 bg-[#EA580C]">{notifications.length}</Badge></Button>
                <Button variant="outline" onClick={() => setActive("partners")}>{lang === "en" ? "Review partners" : "Vérifier les partenaires"}<Badge className="ml-2">{partnerUsers.filter((p) => !p.verified).length}</Badge></Button>
                <Button variant="outline" onClick={() => setActive("messages")}>{lang === "en" ? "Unread messages" : "Messages non lus"}<Badge className="ml-2">{messages.filter((m) => !m.read).length}</Badge></Button>
              </div>
            </div>
          </CardContent></Card>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((k) => (
              <Card key={k.label} role="button" tabIndex={0} onClick={() => setActive(k.target)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActive(k.target); } }} className="cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]">
                <CardContent className="p-5">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{k.label}</div>
                <div className="text-2xl font-bold mt-1">{k.value}</div>
                <div className="text-xs text-[#EA580C] font-semibold mt-1">{k.trend}</div>
              </CardContent></Card>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Card><CardContent className="p-5">
              <h3 className="font-bold mb-3">{t("chart_revenue")}</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={monthData}>
                  <XAxis dataKey="mois" /><YAxis /><Tooltip />
                  <Line type="monotone" dataKey="revenus" stroke="#EA580C" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <h3 className="font-bold mb-3">{t("chart_reservations")}</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthData}>
                  <XAxis dataKey="mois" /><YAxis /><Tooltip />
                  <Bar dataKey="reservations" fill="#EA580C" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent></Card>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Card><CardContent className="p-5">
              <div className="flex items-center justify-between mb-3"><h3 className="font-bold">{lang === "en" ? "Recent bookings" : "Réservations récentes"}</h3><Button variant="ghost" size="sm" onClick={() => setActive("finance")}>{lang === "en" ? "View all" : "Tout voir"}</Button></div>
              <div className="space-y-3">
                {[...reservations].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map((r) => (
                  <div key={r.ref} className="flex items-center justify-between gap-3 border-b last:border-0 pb-2 last:pb-0">
                    <div className="min-w-0"><div className="font-medium truncate">{r.packName}</div><div className="text-xs text-muted-foreground">{r.ref} · {new Date(r.createdAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")}</div></div>
                    <div className="text-right shrink-0"><div className="text-sm font-semibold">{r.totalPrice.toLocaleString()} FCFA</div><Badge variant="secondary">{r.status}</Badge></div>
                  </div>
                ))}
                {reservations.length === 0 && <p className="text-sm text-muted-foreground">{lang === "en" ? "No bookings yet." : "Aucune réservation pour le moment."}</p>}
              </div>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <div className="flex items-center justify-between mb-3"><h3 className="font-bold">{lang === "en" ? "Commission estimate" : "Estimation des commissions"}</h3><DollarSign size={18} className="text-[#EA580C]" /></div>
              <div className="text-2xl font-bold">{commissions.toLocaleString()} FCFA</div>
              <p className="text-sm text-muted-foreground mt-1">{lang === "en" ? "Estimated at 10% of confirmed and completed booking volume." : "Estimée à 10 % du volume des réservations confirmées et terminées."}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setActive("finance")}>{lang === "en" ? "Open finance" : "Ouvrir les finances"}</Button>
            </CardContent></Card>
          </div>
        </div>
      )}

      {active === "packs" && (
        <Card><CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b">
            <h3 className="font-bold">
              {t("packs_heading")} ({filteredPacks.length}
              {packSearch || packCategory !== "all" ? ` / ${allPacks.length}` : ""})
            </h3>
            <div className="flex items-center gap-2 w-full sm:w-auto sm:min-w-[420px]">
              <div className="relative flex-1 min-w-0">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={packSearch}
                  onChange={(e) => setPackSearch(e.target.value)}
                  placeholder={t("packs_search_placeholder")}
                  className="pl-9 pr-8 h-9 w-full"
                />
                {packSearch && (
                  <button
                    type="button"
                    onClick={() => setPackSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label={t("clear_filters")}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <Select value={packCategory} onValueChange={setPackCategory}>
                <SelectTrigger className="h-9 w-[150px] sm:w-[170px] shrink-0">
                  <SelectValue placeholder={t("all_categories")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all_categories")}</SelectItem>
                  {packCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>{t("table_name")}</TableHead><TableHead>{t("table_category_admin")}</TableHead><TableHead>{t("table_price_admin")}</TableHead><TableHead>{t("table_duration_admin")}</TableHead><TableHead className="text-right">{t("table_actions_admin")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredPacks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {t("packs_search_empty")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPacks.map((p: any) => {
                const hidden = isPackHidden(p.id);
                return (
                  <TableRow key={p.id} className={hidden ? "opacity-50" : ""}>
                    <TableCell className="font-semibold">{p.name}</TableCell>
                    <TableCell><Badge>{p.category}</Badge></TableCell>
                    <TableCell>{p.price.toLocaleString()} {t("fcfa")}</TableCell>
                    <TableCell>{p.duration}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {hidden ? (
                        <Button size="sm" variant="ghost" onClick={async () => { await unhidePack(p.id); forceUpdate((n) => n + 1); toast.success(`« ${p.name} » ${t("pack_restored")}`); }}>{t("restore_btn")}</Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={async () => { await hidePack(p.id); forceUpdate((n) => n + 1); toast.warning(`« ${p.name} » ${t("pack_deleted")}`); }}>{t("delete_btn")}</Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
              )}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}

      {active === "partners" && (
        <Card><CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b">
            <h3 className="font-bold">
              {t("sidebar_partners_admin")} ({filteredPartnerUsers.length}
              {partnerSearch || partnerTypeFilter !== "all" || partnerStatusFilter !== "all" || partnerCityFilter !== "all" ? ` / ${partnerUsers.length}` : ""})
            </h3>
            <div className="flex items-center gap-2 w-full sm:w-auto sm:min-w-[420px]">
              <div className="relative flex-1 min-w-0">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={partnerSearch}
                  onChange={(e) => setPartnerSearch(e.target.value)}
                  placeholder={lang === "en" ? "Search a partner..." : "Rechercher un partenaire..."}
                  className="pl-9 pr-8 h-9 w-full"
                />
                {partnerSearch && (
                  <button
                    type="button"
                    onClick={() => setPartnerSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label={t("clear_filters")}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <Select value={partnerTypeFilter} onValueChange={setPartnerTypeFilter}>
                <SelectTrigger className="h-9 w-[150px] sm:w-[170px] shrink-0">
                  <SelectValue placeholder={lang === "en" ? "All types" : "Tous types"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{lang === "en" ? "All types" : "Tous types"}</SelectItem>
                  <SelectItem value="agency">{lang === "en" ? "Tourist agency" : "Agence touristique"}</SelectItem>
                  <SelectItem value="hotel">{t("partner_type_hotelier")}</SelectItem>
                  <SelectItem value="agence-voyages">{t("partner_type_travel")}</SelectItem>
                  <SelectItem value="guide">{lang === "en" ? "Tour guide" : "Guide touristique"}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={partnerStatusFilter} onValueChange={setPartnerStatusFilter}>
                <SelectTrigger className="h-9 w-[130px] shrink-0"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">{lang === "en" ? "All statuses" : "Tous statuts"}</SelectItem><SelectItem value="active">{t("partner_active")}</SelectItem><SelectItem value="suspended">{t("partner_status_suspended")}</SelectItem></SelectContent>
              </Select>
              <Select value={partnerCityFilter} onValueChange={setPartnerCityFilter}>
                <SelectTrigger className="h-9 w-[130px] shrink-0"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">{lang === "en" ? "All cities" : "Toutes les villes"}</SelectItem>{partnerCities.map((city) => <SelectItem key={city} value={city!}>{city}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>{t("partners_table_name")}</TableHead><TableHead>{t("partners_table_type")}</TableHead><TableHead>{t("partners_table_city")}</TableHead><TableHead>{t("partners_table_status")}</TableHead><TableHead className="text-right">{t("partners_table_action")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredPartnerUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    —
                  </TableCell>
                </TableRow>
              ) : (
                filteredPartnerUsers.map((p) => {
                  const active = isAccountActive(p);
                  const roleLabel =
                    p.role === "agency"
                      ? (lang === "en" ? "Tourist agency" : "Agence touristique")
                      : p.role === "hotel"
                        ? t("partner_type_hotelier")
                        : p.role === "agence-voyages"
                          ? t("partner_type_travel")
                          : (lang === "en" ? "Tour guide" : "Guide touristique");
                  const displayName =
                    p.role === "guide"
                      ? `${p.firstName} ${p.lastName}`.trim() || p.email
                      : p.companyName || `${p.firstName} ${p.lastName}`.trim() || p.email;
                  return (
                    <TableRow key={p.id} className={!active ? "opacity-60" : ""}>
                      <TableCell className="font-semibold">{displayName}</TableCell>
                      <TableCell>{roleLabel}</TableCell>
                      <TableCell>{p.city || "—"}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${active ? "bg-green-500" : "bg-red-500"}`} />
                          {active ? t("partner_active") : t("partner_status_suspended")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={active ? "outline" : "default"}
                          className={!active ? "bg-[#EA580C] hover:bg-[#C2410C]" : ""}
                          onClick={() => handleTogglePartnerStatus(p)}
                        >
                          {active ? t("deactivate_btn") : t("activate_btn")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}

      {active === "subscriptions" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-lg text-foreground">{t("admin_subscriptions_heading")}</h3>
                  {t("admin_subscriptions_desc") && (
                    <p className="text-sm text-muted-foreground mt-1">{t("admin_subscriptions_desc")}</p>
                  )}
                </div>
                <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={openCreatePlan}>
                  <Plus size={16} className="mr-1" /> {t("add_subscription_plan")}
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("plan_label_field")}</TableHead>
                    <TableHead>{t("plan_price_field")}</TableHead>
                    <TableHead>{t("plan_period_field")}</TableHead>
                    <TableHead>{t("plan_publications_field")}</TableHead>
                    <TableHead>{t("plan_save_field")}</TableHead>
                    <TableHead>{t("partners_table_status")}</TableHead>
                    <TableHead className="text-right">{t("table_actions_admin")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((p) => {
                    const isPublished = p.published !== false;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-semibold">
                          <div className="flex items-center gap-2">
                            {p.label}
                            {p.popular && <Badge className="bg-[#EA580C]/10 text-[#EA580C]">{t("recommended")}</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>{p.price.toLocaleString()} {t("fcfa")}</TableCell>
                        <TableCell>{p.period}</TableCell>
                        <TableCell>{p.publications}</TableCell>
                        <TableCell>{p.save || "—"}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${isPublished ? "bg-green-500" : "bg-red-500"}`} />
                            {isPublished ? t("plan_status_published") : t("plan_status_unpublished")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8">
                                <MoreHorizontal size={16} />
                                <span className="sr-only">{t("table_actions_admin")}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => handleTogglePlanPublished(p)}>
                                {isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                                {isPublished ? t("unpublish_plan_btn") : t("publish_plan_btn")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => openEditPlan(p)}>
                                <Pencil size={14} />
                                {t("edit_btn")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600 focus:text-red-700" onSelect={() => handleDeletePlan(p.id)}>
                                <Trash2 size={14} />
                                {t("delete_btn")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {planModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-lg rounded-xl bg-background border shadow-xl">
                <div className="flex items-center justify-between p-4 border-b">
                  <h4 className="font-bold text-foreground">
                    {editingPlanId ? t("edit_subscription_plan") : t("add_subscription_plan")}
                  </h4>
                  <Button size="icon" variant="ghost" onClick={() => { setPlanModalOpen(false); setEditingPlanId(null); }}>
                    <X size={16} />
                  </Button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <Label>{t("plan_label_field")}</Label>
                    <Input value={planForm.label} onChange={(e) => setPlanForm({ ...planForm, label: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{t("plan_price_field")}</Label>
                      <Input type="number" min={0} value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} />
                    </div>
                    <div>
                      <Label>{t("plan_publications_field")}</Label>
                      <Input type="number" min={0} value={planForm.publications} onChange={(e) => setPlanForm({ ...planForm, publications: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>{t("plan_period_field")}</Label>
                    <Input value={planForm.period} onChange={(e) => setPlanForm({ ...planForm, period: e.target.value })} />
                  </div>
                  <div>
                    <Label>{t("plan_save_field")}</Label>
                    <Input value={planForm.save} placeholder={t("plan_save_placeholder")} onChange={(e) => setPlanForm({ ...planForm, save: e.target.value })} />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={planForm.popular}
                      onChange={(e) => setPlanForm({ ...planForm, popular: e.target.checked })}
                    />
                    {t("plan_popular_field")}
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={planForm.published}
                      onChange={(e) => setPlanForm({ ...planForm, published: e.target.checked })}
                    />
                    {t("plan_published_field")}
                  </label>
                </div>
                <div className="flex justify-end gap-2 p-4 border-t">
                  <Button variant="outline" onClick={() => { setPlanModalOpen(false); setEditingPlanId(null); }}>
                    {t("cancel_btn")}
                  </Button>
                  <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={handleSavePlan}>
                    {t("save_btn")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {active === "finance" && (
        <Card><CardContent className="p-5">
          <h3 className="font-bold mb-3">{t("finance_heading")}</h3>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-[#EA580C]/10"><div className="text-xs text-muted-foreground">{t("finance_revenue")}</div><div className="text-xl font-bold text-[#EA580C]">{revenue.toLocaleString()} {t("fcfa")}</div></div>
            <div className="p-4 rounded-lg bg-[#EA580C]/10"><div className="text-xs text-muted-foreground">{t("finance_commissions")}</div><div className="text-xl font-bold text-[#EA580C]">{commissions.toLocaleString()} {t("fcfa")}</div></div>
            <div className="p-4 rounded-lg bg-[#EA580C]/20"><div className="text-xs text-muted-foreground">{t("finance_to_pay")}</div><div className="text-xl font-bold">{(revenue - commissions).toLocaleString()} {t("fcfa")}</div></div>
          </div>
          <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={downloadFinanceCsv}><Download size={16} className="mr-2" />{lang === "en" ? "Export financial report (CSV)" : "Exporter le rapport financier (CSV)"}</Button>
        </CardContent></Card>
      )}

      {active === "notifications" && (
        <div className="space-y-3">
          {notifications.length === 0 ? <Card><CardContent className="p-6 text-center text-muted-foreground">{lang === "en" ? "No notifications at this time." : "Aucune notification pour le moment."}</CardContent></Card> : notifications.map((n) => (
            <Card key={n.id}><CardContent className="p-4 flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full ${n.level === "error" ? "bg-red-500" : n.level === "warn" ? "bg-yellow-500" : "bg-orange-500"}`} />
              <span>{n.msg}</span>
            </CardContent></Card>
          ))}
        </div>
      )}

      {active === "profile" && (
        <Card>
          <CardContent className="p-6 space-y-4 max-w-xl">
            <div className="flex items-center gap-4 mb-2">
              <label className="relative shrink-0 cursor-pointer" title={t("profile_photo_hint")}>
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="h-16 w-16 rounded-full object-cover border-2 border-[#EA580C]/20" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-[#EA580C]/10 flex items-center justify-center text-[#EA580C] text-xl font-bold">
                    {(user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "")}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#EA580C] text-white ring-2 ring-background">
                  <Camera size={13} />
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
              <div>
                <h3 className="font-bold text-foreground text-lg">{t("profile_admin_heading")}</h3>
                <p className="text-xs text-muted-foreground">
                  {uploadingAvatar ? t("modal_offer_uploading") : t("profile_photo_hint")}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t("first_name_field")}</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
              <div><Label>{t("last_name_field")}</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
            </div>
            <div><Label>{t("email_field")}</Label><Input defaultValue={user?.email} disabled className="opacity-60" /></div>
            <div><Label>{t("phone_field")}</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={handleSaveProfile}>{t("save_changes_btn")}</Button>
          </CardContent>
        </Card>
      )}

      {active === "settings" && (
        <Card>
          <CardContent className="p-6 max-w-xl space-y-6">
            <h3 className="font-bold text-foreground text-lg">{t("settings_heading")}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {isDark ? <Moon size={20} className="text-[#EA580C]" /> : <Sun size={20} className="text-[#EA580C]" />}
                  <div>
                    <div className="font-semibold text-foreground">{isDark ? t("dark_mode_setting") : t("light_mode_setting")}</div>
                    <div className="text-xs text-muted-foreground">{t("change_appearance")}</div>
                  </div>
                </div>
                <Button variant="outline" onClick={toggleTheme}>
                  {isDark ? t("switch_to_light") : t("switch_to_dark")}
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe size={20} className="text-[#EA580C]" />
                  <div>
                    <div className="font-semibold text-foreground">{t("language_label")}</div>
                    <div className="text-xs text-muted-foreground">{t("current_language")} {t("lang_name")}</div>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setLang(lang === "fr" ? "en" : "fr")}>
                  {lang === "fr" ? t("switch_to_en") : t("switch_to_fr")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── MESSAGES ── */}
      {active === "messages" && (
        <div className="h-[600px]">
          <DtMessenger />
        </div>
      )}
    </DashboardShell>
  );
}
