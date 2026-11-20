"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/src/components/dt-sidebar";
import Link from "next/link";
import { LayoutDashboard, Megaphone, Wallet, Users, CreditCard, Settings, CheckCircle2, AlertCircle, Building2, X, MessageSquare, Hotel, Bus, Star, UserPlus, Trash2, ExternalLink, Handshake, FileText, Plus, Pencil, MoreHorizontal, Search, SlidersHorizontal, Check, Ban, Camera, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Badge } from "@/src/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/src/components/ui/dropdown-menu";
import { COMMISSION_RATE, AGENCIES, PACKS, HOTELS_NEARBY, saveCustomOffer, removeCustomOffer, hidePack, unhidePack, isPackHidden, getAllPacks, loadCustomOffers, getReservationsByAgency, loadSavedReservations, setReservationStatus, deleteReservation, loadGuides, getAllGuides, updateCustomOffer, loadPartners, getPartnersByAgency, savePartner, updatePartner, removePartner, getReservationRevenue, getSubscriptionPlans, loadSubscriptionPlans, DEFAULT_SUBSCRIPTION_PLANS, type PartnerData, type PartnerType, type PartnerStatus, type ReservationData, type GuideData, type SubscriptionPlan } from "@/src/lib/njangui-data";
import { useOffersLoader } from "@/src/hooks/use-offers-loader";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { DtMessenger } from "@/src/components/dt-messenger";
import { useAuth } from "@/src/lib/auth-context";
import { getUsersByRoles, getUserById, type DtUser } from "@/src/lib/auth-store";
import { toast } from "sonner";
import { useLang } from "@/src/lib/lang";
import { getGuideContactId, getPartnerContactId, getTouristContactId } from "@/src/lib/messaging-contacts";

const EMPTY_PARTNER_FORM = {
  name: "", type: "hotelier" as PartnerType, city: "", contact: "", email: "", phone: "", status: "Actif" as PartnerStatus,
  userId: "",
  commissionRate: "10", paymentDelay: "15", durationMonths: "12", startDate: "", notes: "",
  roomPrice: "", roomType: "", tripPrice: "", tripLabel: "",
};

const EMPTY_GUIDE_FORM = {
  name: "", specialty: "", bio: "", city: "", idType: "cni" as "cni" | "passport",
  idNumber: "", idFileUrl: "", photo: "", paymentMethod: "", commission: "", price: "",
  userId: "", sourceGuideId: "",
};

// Recherche insensible aux accents et à la casse (« Hôtel » trouve « hotel »).
const normalizeSearch = (value: string) =>
  value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

type FilterOption = { key: string; label: string };
type FilterGroup = { label: string; options: FilterOption[]; value: string; onChange: (value: string) => void };

function activeFilterCount(...values: string[]) {
  return values.filter((v) => v !== "" && v !== "all").length;
}

function FilterBar({
  t, search, onSearch, placeholder, groups = [], onReset, activeCount = 0, className = "",
}: {
  t: (key: string) => string;
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  groups?: FilterGroup[];
  onReset?: () => void;
  activeCount?: number;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2 border-b px-4 py-3 ${className}`}>
      <div className="relative min-w-[180px] flex-1">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="h-9 rounded-full border-transparent bg-muted/50 pl-9 pr-3 text-sm focus-visible:border-input focus-visible:bg-background"
        />
      </div>
      {groups.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-full">
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">{t("filters_title")}</span>
              {activeCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EA580C] px-1 text-[10px] font-bold text-white">
                  {activeCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {groups.map((group, index) => (
              <Fragment key={group.label}>
                {index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                {group.options.map((option) => (
                  <DropdownMenuItem key={option.key} onSelect={() => group.onChange(option.key)}>
                    <Check size={14} className={group.value === option.key ? "text-[#EA580C]" : "opacity-0"} />
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {activeCount > 0 && (
        <Button variant="ghost" size="sm" className="h-9 gap-1.5 rounded-full text-muted-foreground" onClick={onReset}>
          <X size={14} /> <span className="hidden sm:inline">{t("clear_filters")}</span>
        </Button>
      )}
    </div>
  );
}

export default function AgencyDashboard() {
  const offersReady = useOffersLoader();
  const [active, setActive] = useState("overview");
  const { user: authUser, updateProfile } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [agencyCity, setAgencyCity] = useState("");
  const [agencyPhone, setAgencyPhone] = useState("");
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [offerForm, setOfferForm] = useState({
    name: "", category: "Détente", duration: "", desc: "", image: "", city: "",
    guideIds: [] as string[], hotelPartnerIds: [] as string[], transportPartnerIds: [] as string[],
    agencyMargin: "0", places: "1",
  });
  const [selectingFor, setSelectingFor] = useState<"hotelier" | "transport" | "guide" | null>(null);
  const [detailClient, setDetailClient] = useState<ReservationData | null>(null);
  const [agencyGuides, setAgencyGuides] = useState<GuideData[]>([]);
  const [showAddGuide, setShowAddGuide] = useState(false);
  const [guideForm, setGuideForm] = useState({ ...EMPTY_GUIDE_FORM });
  const [showGuidePicker, setShowGuidePicker] = useState(false);
  const [guidePickerSearch, setGuidePickerSearch] = useState("");
  const [registeredGuides, setRegisteredGuides] = useState<GuideData[]>([]);
  const [partners, setPartners] = useState<PartnerData[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>(getSubscriptionPlans());
  const [partnerFilter, setPartnerFilter] = useState<"all" | PartnerType>("all");
  const [partnerStatusFilter, setPartnerStatusFilter] = useState<"all" | PartnerStatus>("all");
  const [partnerSearch, setPartnerSearch] = useState("");
  const [publicationSearch, setPublicationSearch] = useState("");
  const [publicationStatus, setPublicationStatus] = useState<"all" | "online" | "hidden">("all");
  const [revenueSearch, setRevenueSearch] = useState("");
  const [revenueGroupBy, setRevenueGroupBy] = useState<"recent" | "name" | "date">("recent");
  const [revenueDateGranularity, setRevenueDateGranularity] = useState<"day" | "month" | "year">("day");
  const [guideSearch, setGuideSearch] = useState("");
  const [guideCityFilter, setGuideCityFilter] = useState("all");
  const [clientSearch, setClientSearch] = useState("");
  const [clientStatus, setClientStatus] = useState<"all" | ReservationData["status"]>("all");
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [clausesOnly, setClausesOnly] = useState(false);
  const [partnerForm, setPartnerForm] = useState({ ...EMPTY_PARTNER_FORM });
  const [showPartnerPicker, setShowPartnerPicker] = useState(false);
  const [partnerPickerSearch, setPartnerPickerSearch] = useState("");
  const [partnerPickerType, setPartnerPickerType] = useState<"all" | "hotel" | "agence-voyages">("all");
  const [registeredPartners, setRegisteredPartners] = useState<DtUser[]>([]);
  const [messageTarget, setMessageTarget] = useState<{ id: string; nonce: number } | null>(null);
  const router = useRouter();
  const { t, lang } = useLang();

  const items = [
    { key: "overview", label: t("sidebar_overview"), icon: LayoutDashboard },
    { key: "publications", label: t("sidebar_publications"), icon: Megaphone },
    { key: "partners", label: t("sidebar_partners"), icon: Handshake },
    { key: "guides", label: t("sidebar_guides"), icon: Users },
    { key: "revenue", label: t("sidebar_revenue"), icon: Wallet },
    { key: "clients", label: t("sidebar_clients"), icon: Users },
    { key: "messages", label: t("sidebar_messages"), icon: MessageSquare },
    { key: "subscription", label: t("sidebar_subscription"), icon: CreditCard },
    { key: "profile", label: t("sidebar_profile_agency"), icon: Settings },
  ];

  const agency = AGENCIES.find(a => a.name === authUser?.companyName);
  const agencyId = agency?.id ?? "ag1";

  useEffect(() => {
    if (!authUser || authUser.role !== "agency") {
      router.replace("/auth");
      return;
    }
    setCompanyName(authUser.companyName ?? authUser.firstName);
    setAgencyCity(authUser.city ?? "");
    setAgencyPhone(authUser.phone);
    Promise.all([loadSavedReservations(), loadGuides(), loadPartners(), loadSubscriptionPlans()]).then(() => {
      setAgencyGuides(getAllGuides().filter(g => g.agencyId === agencyId));
      setRegisteredGuides(getAllGuides());
      setPartners(getPartnersByAgency(agencyId));
      setSubscriptionPlans([...getSubscriptionPlans()]);
    });
  }, [authUser, router, agencyId, offersReady]);

  // Comptes réellement inscrits sur Njangui (hôteliers + agences de voyages)
  useEffect(() => {
    setRegisteredPartners(getUsersByRoles(["hotel", "agence-voyages"]));
  }, []);

  // Liens directs : ouvre la section Message ou la sélection demandée depuis « Nouvelle offre »
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("dm")) {
      setActive("messages");
      return;
    }
    const select = params.get("select");
    if (select === "hotelier" || select === "transport" || select === "guide") {
      setSelectingFor(select);
      if (select === "guide") {
        setActive("guides");
      } else {
        setPartnerFilter(select === "hotelier" ? "hotelier" : "agence-voyages");
        setActive("partners");
      }
      return;
    }
    const tab = params.get("tab");
    if (tab === "publications" || tab === "partners" || tab === "guides") {
      setActive(tab);
    }
  }, []);

  const messageHref = (contactId: string) => `/dashboard/agency?dm=${encodeURIComponent(contactId)}`;

  // Depuis « Nouvelle offre » : ouvre la page dédiée où se font les choix multiples
  const chooseFor = (kind: "hotelier" | "transport" | "guide") => {
    setShowOfferModal(false);
    setSelectingFor(kind);
    if (kind === "guide") {
      setActive("guides");
      window.history.replaceState(null, "", "/dashboard/agency?tab=guides&select=guide");
    } else {
      setPartnerFilter(kind === "hotelier" ? "hotelier" : "agence-voyages");
      setActive("partners");
      window.history.replaceState(null, "", `/dashboard/agency?tab=partners&select=${kind}`);
    }
  };

  const finishSelection = () => {
    setSelectingFor(null);
    setActive("publications");
    window.history.replaceState(null, "", "/dashboard/agency?tab=publications");
    setShowOfferModal(true);
  };

  const togglePartnerSelection = (p: PartnerData) => {
    if (p.type === "hotelier") {
      setOfferForm(f => ({
        ...f,
        hotelPartnerIds: f.hotelPartnerIds.includes(p.id)
          ? f.hotelPartnerIds.filter(id => id !== p.id)
          : [...f.hotelPartnerIds, p.id],
      }));
    } else {
      setOfferForm(f => ({
        ...f,
        transportPartnerIds: f.transportPartnerIds.includes(p.id)
          ? f.transportPartnerIds.filter(id => id !== p.id)
          : [...f.transportPartnerIds, p.id],
      }));
    }
  };

  const toggleGuideSelection = (g: GuideData) => {
    setOfferForm(f => ({
      ...f,
      guideIds: f.guideIds.includes(g.id)
        ? f.guideIds.filter(id => id !== g.id)
        : [...f.guideIds, g.id],
    }));
  };

  const handleNav = (key: string) => {
    setActive(key);
    setSelectingFor(null);
    if (window.location.search) window.history.replaceState(null, "", "/dashboard/agency");
  };

  const openContact = (contactId: string) => {
    setMessageTarget({ id: contactId, nonce: Date.now() });
    setActive("messages");
    window.history.replaceState(null, "", messageHref(contactId));
  };

  const agencyOffers = getAllPacks().filter(p => p.agencyId === agencyId);
  const filteredOffers = agencyOffers.filter((p) => {
    const q = publicationSearch.trim().toLowerCase();
    const matchSearch = !q || [p.name, p.category, (p as any).location, p.duration].some(v => String(v ?? "").toLowerCase().includes(q));
    const matchStatus = publicationStatus === "all" || (publicationStatus === "online" ? !isPackHidden(p.id) : isPackHidden(p.id));
    return matchSearch && matchStatus;
  });
  const filteredPartners = partners.filter((p) => {
    const q = partnerSearch.trim().toLowerCase();
    const matchSearch = !q || [p.name, p.city, p.contact, p.email, p.phone].some(v => String(v ?? "").toLowerCase().includes(q));
    const matchSelection = !selectingFor || (selectingFor === "hotelier" ? p.type === "hotelier" : p.type === "agence-voyages");
    return (partnerFilter === "all" || p.type === partnerFilter)
      && (partnerStatusFilter === "all" || p.status === partnerStatusFilter)
      && matchSelection
      && matchSearch;
  });
  const filteredGuides = agencyGuides.filter((g) => {
    const q = guideSearch.trim().toLowerCase();
    const matchSearch = !q || [g.name, g.specialty, g.city, g.paymentMethod].some(v => String(v ?? "").toLowerCase().includes(q));
    return matchSearch && (guideCityFilter === "all" || g.city === guideCityFilter);
  });
  const guideCityOptions: FilterOption[] = [
    { key: "all", label: t("filter_all") },
    ...Array.from(new Set(agencyGuides.map((g) => g.city).filter(Boolean))).map((city) => ({ key: String(city), label: String(city) })),
  ];
  const hotelPartners = partners.filter(p => p.type === "hotelier");
  const transportPartners = partners.filter(p => p.type === "agence-voyages");

  // Prix de l'offre calculé depuis les contrats des partenaires sélectionnés + la part de l'agence
  const days = Math.max(parseInt(offerForm.duration, 10) || 1, 1);
  const places = Math.max(parseInt(offerForm.places, 10) || 1, 1);
  const selectedHotels = hotelPartners.filter(p => offerForm.hotelPartnerIds.includes(p.id));
  const selectedTransports = transportPartners.filter(p => offerForm.transportPartnerIds.includes(p.id));
  const selectedGuides = agencyGuides.filter(g => offerForm.guideIds.includes(g.id));
  const roomCost = selectedHotels.reduce((sum, p) => sum + (p.contract?.roomPrice ?? 0) * days, 0);
  const tripCost = selectedTransports.reduce((sum, p) => sum + (p.contract?.tripPrice ?? 0) * places, 0);
  const guideCost = selectedGuides.reduce((sum, g) => sum + (g.price ?? 0) * days, 0);
  const agencyMargin = Number(offerForm.agencyMargin) || 0;
  const priceBreakdown = {
    days, places, roomCost, tripCost, guideCost, agencyMargin,
    total: roomCost + tripCost + guideCost + agencyMargin,
  };

  const openAddPartner = () => {
    setEditingPartnerId(null);
    setClausesOnly(false);
    setPartnerForm({ ...EMPTY_PARTNER_FORM });
    setShowPartnerPicker(false);
    setPartnerPickerSearch("");
    setPartnerPickerType("all");
    setShowPartnerModal(true);
  };

  const openEditPartner = (p: PartnerData, clauses = false) => {
    setEditingPartnerId(p.id);
    setClausesOnly(clauses);
    setPartnerForm({
      name: p.name, type: p.type, city: p.city ?? "", contact: p.contact ?? "", email: p.email ?? "", phone: p.phone ?? "", status: p.status,
      userId: p.userId ?? "",
      commissionRate: String(p.contract?.commissionRate ?? 0),
      paymentDelay: String(p.contract?.paymentDelay ?? 0),
      durationMonths: String(p.contract?.durationMonths ?? 0),
      startDate: p.contract?.startDate ?? "",
      notes: p.contract?.notes ?? "",
      roomPrice: String(p.contract?.roomPrice ?? ""),
      roomType: p.contract?.roomType ?? "",
      tripPrice: String(p.contract?.tripPrice ?? ""),
      tripLabel: p.contract?.tripLabel ?? "",
    });
    setShowPartnerPicker(false);
    setPartnerPickerSearch("");
    setPartnerPickerType("all");
    setShowPartnerModal(true);
  };

  // Remplit le formulaire à partir d'un compte inscrit sur Njangui.
  const selectRegisteredPartner = (u: DtUser) => {
    const type: PartnerType = u.role === "hotel" ? "hotelier" : "agence-voyages";
    setPartnerForm(f => ({
      ...f,
      name: u.companyName || `${u.firstName} ${u.lastName}`.trim(),
      type,
      city: u.city ?? f.city,
      contact: `${u.firstName} ${u.lastName}`.trim(),
      email: u.email,
      phone: u.phone ?? f.phone,
      userId: u.id,
    }));
    setShowPartnerPicker(false);
    setPartnerPickerSearch("");
  };

  // Recherche instantanée parmi les comptes inscrits (nom, type, ville, e-mail, téléphone).
  const partnerPickerQuery = normalizeSearch(partnerPickerSearch);
  const filteredRegisteredPartners = registeredPartners.filter(u => {
    if (partnerPickerType !== "all" && u.role !== partnerPickerType) return false;
    if (!partnerPickerQuery) return true;
    return normalizeSearch([
      u.companyName ?? "",
      `${u.firstName} ${u.lastName}`,
      u.email ?? "",
      u.city ?? "",
      u.phone ?? "",
    ].join(" ")).includes(partnerPickerQuery);
  });

  const openAddGuide = () => {
    setGuideForm({ ...EMPTY_GUIDE_FORM });
    setShowGuidePicker(false);
    setGuidePickerSearch("");
    setShowAddGuide(true);
  };

  // Remplit le formulaire à partir d'un guide inscrit sur Njangui.
  const selectRegisteredGuide = (g: GuideData) => {
    setGuideForm(f => ({
      ...f,
      name: g.name,
      specialty: g.specialty,
      bio: g.bio ?? "",
      city: g.city,
      photo: g.photo || g.image || "",
      paymentMethod: g.paymentMethod ?? "",
      commission: g.commission != null ? String(g.commission) : "",
      price: g.price != null ? String(g.price) : "",
      userId: g.userId ?? "",
      sourceGuideId: g.id,
    }));
    setShowGuidePicker(false);
    setGuidePickerSearch("");
  };

  // Recherche instantanée parmi les guides inscrits (nom, spécialité, ville, bio).
  const guidePickerQuery = normalizeSearch(guidePickerSearch);
  const filteredRegisteredGuides = registeredGuides.filter(g => {
    if (!guidePickerQuery) return true;
    return normalizeSearch([g.name, g.specialty, g.city, g.bio, g.paymentMethod ?? ""].join(" ")).includes(guidePickerQuery);
  });

  const handleSavePartner = async () => {
    if (!partnerForm.name.trim()) {
      toast.error(t("fill_all_fields_error"));
      return;
    }
    const contract = {
      commissionRate: Number(partnerForm.commissionRate) || 0,
      paymentDelay: Number(partnerForm.paymentDelay) || 0,
      durationMonths: Number(partnerForm.durationMonths) || 0,
      startDate: partnerForm.startDate,
      notes: partnerForm.notes,
      roomPrice: Number(partnerForm.roomPrice) || 0,
      roomType: partnerForm.roomType,
      tripPrice: Number(partnerForm.tripPrice) || 0,
      tripLabel: partnerForm.tripLabel,
    };
    if (editingPartnerId) {
      const updates: Partial<PartnerData> = clausesOnly
        ? { contract }
        : {
            name: partnerForm.name.trim(), type: partnerForm.type, city: partnerForm.city,
            contact: partnerForm.contact, email: partnerForm.email, phone: partnerForm.phone,
            status: partnerForm.status, userId: partnerForm.userId || undefined, contract,
          };
      await updatePartner(editingPartnerId, updates);
      toast.success(clausesOnly ? t("clauses_updated") : t("partner_updated"));
    } else {
      await savePartner({
        id: `par_${Date.now()}`, agencyId,
        name: partnerForm.name.trim(), type: partnerForm.type, city: partnerForm.city,
        contact: partnerForm.contact, email: partnerForm.email, phone: partnerForm.phone,
        status: partnerForm.status, userId: partnerForm.userId || undefined, contract,
        createdAt: new Date().toISOString().slice(0, 10),
      });
      toast.success(t("partner_added"));
    }
    setPartners(getPartnersByAgency(agencyId));
    setShowPartnerModal(false);
    setShowPartnerPicker(false);
    setEditingPartnerId(null);
    setClausesOnly(false);
    setPartnerForm({ ...EMPTY_PARTNER_FORM });
  };

  // Photo de profil exacte du partenaire : compte lié, puis correspondance par nom.
  const getPartnerAvatar = (p: PartnerData): string | undefined => {
    const linked = p.userId ? getUserById(p.userId) : undefined;
    if (linked?.avatar) return linked.avatar;
    const name = normalizeSearch(p.name);
    const account = registeredPartners.find(u =>
      normalizeSearch(u.companyName || `${u.firstName} ${u.lastName}`) === name
    );
    if (account?.avatar) return account.avatar;
    if (p.type === "hotelier") {
      return HOTELS_NEARBY.find(h => normalizeSearch(h.name) === name)?.image;
    }
    return AGENCIES.find(a => normalizeSearch(a.name) === name)?.logo;
  };

  const handleRemovePartner = async (p: PartnerData) => {
    if (!window.confirm(t("confirm_remove_partner"))) return;
    await removePartner(p.id);
    setPartners(getPartnersByAgency(agencyId));
    toast.warning(t("partner_removed"));
  };

  const handleRemoveGuide = async (g: GuideData) => {
    if (!window.confirm(t("confirm_remove_guide"))) return;
    try {
      await fetch("/api/guides", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: g.id }),
      });
      await loadGuides();
      setAgencyGuides(getAllGuides().filter(gg => gg.agencyId === agencyId));
      toast.success(t("guide_removed"));
    } catch { toast.error(t("error_occurred")); }
  };

  const handleCancelReservation = async (r: ReservationData) => {
    if (!window.confirm(t("confirm_cancel_reservation"))) return;
    await setReservationStatus(r, "Annulée");
    toast.success(t("reservation_cancelled"));
  };

  const handleDeleteReservation = async (r: ReservationData) => {
    if (!window.confirm(t("confirm_delete_reservation"))) return;
    await deleteReservation(r.ref);
    toast.warning(t("reservation_deleted"));
  };

  const agencyReservations = getReservationsByAgency(agencyId);
  // Seules les réservations confirmées produisent du revenu.
  const revenueReservations = agencyReservations.filter(r => r.status === "Confirmée");

  // Revenus de l'agence sur chaque offre réservée (commissions partenaires + part de l'agence)
  const reservationRevenues = revenueReservations.map(r => ({ reservation: r, revenue: getReservationRevenue(r) }));
  const sumRevenues = (items: typeof reservationRevenues) => items.reduce((acc, { revenue: rev }) => ({
    hotel: acc.hotel + rev.hotel.commission,
    transport: acc.transport + rev.transport.commission,
    guide: acc.guide + rev.guide.commission,
    margin: acc.margin + rev.agencyMargin,
    total: acc.total + rev.total,
  }), { hotel: 0, transport: 0, guide: 0, margin: 0, total: 0 });

  const filteredRevenues = reservationRevenues.filter(({ reservation: r, revenue }) => {
    const q = revenueSearch.trim().toLowerCase();
    const matchSearch = !q || [r.packName, r.ref, r.dates, revenue.hotel.name, revenue.transport.name, revenue.guide.name]
      .some(v => String(v ?? "").toLowerCase().includes(q));
    return matchSearch;
  });
  const filteredRevenueTotals = sumRevenues(filteredRevenues);

  // Statistiques du tableau de bord : uniquement les réservations confirmées de l'agence,
  // avec exactement le même calcul de revenu que dans « Mes revenus ».
  const dashboardTotals = sumRevenues(reservationRevenues);
  const dashboardGross = dashboardTotals.total;
  const dashboardCommission = Math.round(dashboardGross * COMMISSION_RATE);
  const dashboardNet = dashboardGross - dashboardCommission;

  // Évolution mensuelle réelle (en millions de FCFA pour l'unité du graphique).
  const dashboardMonthlyRevenue = (() => {
    const buckets = new Map<string, { brut: number; net: number }>();
    for (const { reservation: r, revenue } of reservationRevenues) {
      const key = (r.createdAt || "").slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(key)) continue;
      if (!buckets.has(key)) buckets.set(key, { brut: 0, net: 0 });
      const bucket = buckets.get(key)!;
      bucket.brut += revenue.total;
      bucket.net += revenue.total * (1 - COMMISSION_RATE);
    }
    const monthNames = lang === "fr"
      ? ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return Array.from(buckets, ([key, value]) => ({
      key,
      mois: `${monthNames[Number(key.slice(5, 7)) - 1] ?? key.slice(5)} ${key.slice(0, 4)}`,
      brut: Math.round(value.brut),
      net: Math.round(value.net),
    })).sort((a, b) => a.key.localeCompare(b.key));
  })();

  const revenueGroupOptions: FilterOption[] = [
    { key: "recent", label: t("group_recent") },
    { key: "name", label: t("group_name") },
    { key: "date", label: t("group_date") },
  ];
  const revenuePeriodOptions: FilterOption[] = [
    { key: "day", label: t("group_day") },
    { key: "month", label: t("group_month") },
    { key: "year", label: t("group_year") },
  ];

  // Regroupement des réservations selon le critère choisi.
  const revenueGroups = (() => {
    const sorted = [...filteredRevenues].sort((a, b) =>
      b.reservation.createdAt.localeCompare(a.reservation.createdAt) || b.reservation.ref.localeCompare(a.reservation.ref)
    );
    if (revenueGroupBy === "recent") return [{ key: "all", label: "", items: sorted }];

    const buckets = new Map<string, { label: string; items: typeof sorted }>();
    for (const item of sorted) {
      let key: string;
      let label: string;
      if (revenueGroupBy === "name") {
        key = item.reservation.packName || "—";
        label = key;
      } else {
        const raw = item.reservation.createdAt || "";
        key = raw.slice(0, revenueDateGranularity === "day" ? 10 : revenueDateGranularity === "month" ? 7 : 4) || "—";
        if (revenueDateGranularity === "year") {
          label = key;
        } else {
          const date = new Date(key.length === 7 ? `${key}-01T00:00:00` : `${key}T00:00:00`);
          label = new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US",
            revenueDateGranularity === "month"
              ? { month: "long", year: "numeric" }
              : { day: "numeric", month: "long", year: "numeric" }
          ).format(date);
        }
      }
      if (!buckets.has(key)) buckets.set(key, { label, items: [] });
      buckets.get(key)!.items.push(item);
    }
    return Array.from(buckets, ([key, value]) => ({ key, label: value.label, items: value.items }));
  })();

  const filteredClients = agencyReservations.filter((r) => {
    const q = clientSearch.trim().toLowerCase();
    const tourist = getUserById(r.userId);
    const matchSearch = !q || [r.packName, r.ref, r.dates, r.userId, tourist?.email,
      tourist ? `${tourist.firstName} ${tourist.lastName}` : r.userId]
      .some(v => String(v ?? "").toLowerCase().includes(q));
    return matchSearch && (clientStatus === "all" || r.status === clientStatus);
  });

  const statusFilterOptions: FilterOption[] = [
    { key: "all", label: t("filter_all") },
    { key: "Confirmée", label: t("status_confirmed") },
    { key: "En attente", label: t("status_pending") },
    { key: "Terminée", label: t("status_completed") },
    { key: "Annulée", label: t("status_cancelled") },
  ];
  const publicationFilterOptions: FilterOption[] = [
    { key: "all", label: t("filter_all") },
    { key: "online", label: t("online_badge") },
    { key: "hidden", label: t("unpublished_badge") },
  ];
  const partnerStatusOptions: FilterOption[] = [
    { key: "all", label: t("filter_all") },
    { key: "Actif", label: t("partner_status_active") },
    { key: "En attente", label: t("partner_status_pending") },
    { key: "Suspendu", label: t("partner_status_suspended") },
  ];
  const partnerTypeOptions: FilterOption[] = [
    { key: "all", label: t("all_partners") },
    { key: "hotelier", label: t("hoteliers_filter") },
    { key: "agence-voyages", label: t("travel_agencies_filter") },
  ];

  const tenant = {
    name: authUser?.companyName ?? authUser?.firstName ?? "Mon Agence",
    city: authUser?.city ?? "Cameroun",
    subscribed: Boolean(authUser?.plan),
    plan: authUser?.plan ?? "semester",
    usedPubs: agencyOffers.length,
    mailVerified: authUser?.verified ?? false,
  };

  const plan =
    subscriptionPlans.find((p) => p.id === tenant.plan) ??
    DEFAULT_SUBSCRIPTION_PLANS.find((p) => p.id === tenant.plan) ??
    subscriptionPlans[0] ??
    DEFAULT_SUBSCRIPTION_PLANS[0];

  const handleCreateOffer = async () => {
    if (!offerForm.name || !offerForm.duration || priceBreakdown.total <= 0) {
      toast.error(t("fill_all_fields_error"));
      return;
    }
    const cityCoords: Record<string, { lat: number; lng: number }> = {
      "Douala": { lat: 4.0511, lng: 9.7679 },
      "Yaoundé": { lat: 3.8667, lng: 11.5167 },
      "Kribi": { lat: 2.9395, lng: 9.9104 },
      "Limbe": { lat: 4.0178, lng: 9.2063 },
      "Bafoussam": { lat: 5.4772, lng: 10.4178 },
      "Maroua": { lat: 10.5953, lng: 14.3247 },
      "Buea": { lat: 4.1581, lng: 9.2625 },
      "Nkongsamba": { lat: 4.9570, lng: 9.9408 },
      "Foumban": { lat: 5.7266, lng: 10.8994 },
      "Garoua": { lat: 9.3014, lng: 13.3977 },
    };
    const coords = cityCoords[offerForm.city] || { lat: 4.05, lng: 9.7 };
    const pricing = {
      price: priceBreakdown.total,
      guideIds: offerForm.guideIds,
      hotelPartnerIds: offerForm.hotelPartnerIds,
      transportPartnerIds: offerForm.transportPartnerIds,
      // Champs historiques conservés pour les anciennes offres / revenus
      hotelPartnerId: offerForm.hotelPartnerIds[0] ?? "",
      transportPartnerId: offerForm.transportPartnerIds[0] ?? "",
      places: places,
      agencyMargin: agencyMargin,
    };
    if (editingOfferId) {
      await updateCustomOffer(editingOfferId, {
        name: offerForm.name,
        category: offerForm.category,
        duration: offerForm.duration,
        desc: offerForm.desc || "Nouvelle offre",
        image: offerForm.image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
        location: offerForm.city || "Cameroun",
        lat: coords.lat,
        lng: coords.lng,
        ...pricing,
      } as any);
      toast.success(`\u00AB ${offerForm.name} \u00BB ${t("offer_updated")}`);
    } else {
      const newOffer = {
        id: `off_${Date.now()}`,
        location: offerForm.city || "Cameroun",
        lat: coords.lat,
        lng: coords.lng,
        name: offerForm.name,
        category: offerForm.category,
        duration: offerForm.duration,
        desc: offerForm.desc || "Nouvelle offre",
        image: offerForm.image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
        agencyId,
        ...pricing,
      };
      await saveCustomOffer(newOffer as any);
      toast.success(`\u00AB ${newOffer.name} \u00BB ${t("offer_published")}`);
    }
    setEditingOfferId(null);
    setOfferForm({ name: "", category: "Détente", duration: "", desc: "", image: "", city: "", guideIds: [], hotelPartnerIds: [], transportPartnerIds: [], agencyMargin: "0", places: "1" });
    setShowOfferModal(false);
  };

  const openEditOffer = (p: any) => {
    setEditingOfferId(p.id);
    const extra = p as any;
    setOfferForm({
      name: p.name,
      category: p.category,
      duration: p.duration,
      desc: p.desc,
      image: p.image,
      city: p.location,
      guideIds: extra.guideIds ?? [],
      hotelPartnerIds: extra.hotelPartnerIds ?? (extra.hotelPartnerId ? [extra.hotelPartnerId] : []),
      transportPartnerIds: extra.transportPartnerIds ?? (extra.transportPartnerId ? [extra.transportPartnerId] : []),
      places: String(extra.places ?? 1),
      // Anciennes offres sans part enregistrée : on conserve leur prix initial
      agencyMargin: String(extra.agencyMargin ?? p.price),
    });
    setShowOfferModal(true);
  };

  const handleTogglePublish = async (id: string) => {
    if (isPackHidden(id)) {
      await unhidePack(id);
      toast.success(t("offer_republished"));
    } else {
      await hidePack(id);
      toast.warning(t("offer_unpublished"));
    }
  };

  const handleDeleteOffer = async (id: string) => {
    const isBuiltIn = PACKS.some(p => p.id === id);
    if (isBuiltIn) {
      await hidePack(id);
    } else {
      await removeCustomOffer(id);
    }
    toast.warning(t("publication_removed"));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("agency", authUser?.companyName ?? "agence");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        updateProfile({ avatar: data.url });
        toast.success(t("profile_photo_updated"));
      } else {
        toast.error(t("error_occurred"));
      }
    } catch {
      toast.error(t("error_occurred"));
    }
    setUploadingAvatar(false);
    e.target.value = "";
  };

  return (
    <DashboardShell title={`Espace agence — ${tenant.name}`} items={items} active={active} onChange={handleNav}>
      {/* Bandeau statut */}
      <div className="mb-6">
        {!tenant.mailVerified && (
          <Card className="border-amber-300 bg-amber-50 mb-3"><CardContent className="p-4 flex items-center gap-3 text-amber-800">
            <AlertCircle size={20} /> {t("verify_email_banner")}
          </CardContent></Card>
        )}
        {!tenant.subscribed ? (
          <Card className="border-[#EA580C] bg-[#EA580C]/5"><CardContent className="p-5 flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-[#EA580C]" />
              <div>
                <div className="font-bold text-foreground">{t("subscription_required")}</div>
                <div className="text-sm text-muted-foreground">{t("subscription_required_desc")}</div>
              </div>
            </div>
            <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={() => setActive("subscription")}>{t("choose_plan_btn")}</Button>
          </CardContent></Card>
        ) : (
          <Card className="border-[#EA580C]/30 bg-card"><CardContent className="p-4 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="text-[#EA580C]" size={18} />
              <span className="font-semibold">{t("subscription_active")} {plan.label}</span>
              <Badge className="bg-[#EA580C] text-white">{tenant.usedPubs}/{plan.publications} {t("publications_badge")}</Badge>
            </div>
            <Button size="sm" variant="outline" onClick={() => setActive("subscription")}>{t("manage_subscription_btn")}</Button>
          </CardContent></Card>
        )}
      </div>

      {active === "overview" && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t("total_revenue_label"), value: `${dashboardGross.toLocaleString()} ${t("fcfa")}` },
              { label: `${t("commission_label")} (${(COMMISSION_RATE * 100).toFixed(0)}%)`, value: `-${dashboardCommission.toLocaleString()} ${t("fcfa")}` },
              { label: t("net_revenue_label"), value: `${dashboardNet.toLocaleString()} ${t("fcfa")}` },
              { label: t("reservations_count"), value: String(revenueReservations.length) },
            ].map((k) => (
              <Card key={k.label}><CardContent className="p-5">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{k.label}</div>
                <div className="text-2xl font-bold text-foreground mt-1">{k.value}</div>
              </CardContent></Card>
            ))}
          </div>
          <Card><CardContent className="p-5">
            <h3 className="font-bold mb-3 text-foreground">{t("brut_vs_net_chart")}</h3>
            {dashboardMonthlyRevenue.length === 0 ? (
              <p className="py-16 text-center text-sm italic text-muted-foreground">{t("no_reservations_yet")}</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={dashboardMonthlyRevenue}>
                  <XAxis dataKey="mois" /><YAxis /><Tooltip /><Legend />
                  <Line type="monotone" dataKey="brut" stroke="#EA580C" strokeWidth={3} name={t("brut_label")} />
                  <Line type="monotone" dataKey="net" stroke="#F97316" strokeWidth={3} strokeDasharray="4 4" name={t("net_label")} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent></Card>
        </div>
      )}

      {active === "publications" && (
        <Card><CardContent className="p-0">
          <div className="p-4 flex justify-between items-center border-b">
            <div>
              <h3 className="font-bold text-foreground">{t("my_publications_heading")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t("quota_desc")} {plan.label}.</p>
            </div>
            <Button
              className="bg-[#EA580C] hover:bg-[#C2410C]"
              disabled={!tenant.subscribed || agencyOffers.length >= plan.publications}
              onClick={() => setShowOfferModal(true)}
            >{t("new_offer_btn")}</Button>
          </div>
          <FilterBar
            t={t}
            search={publicationSearch}
            onSearch={setPublicationSearch}
            placeholder={t("filter_publications_placeholder")}
            groups={[{ label: t("table_status"), options: publicationFilterOptions, value: publicationStatus, onChange: (v) => setPublicationStatus(v as typeof publicationStatus) }]}
            onReset={() => { setPublicationSearch(""); setPublicationStatus("all"); }}
            activeCount={activeFilterCount(publicationSearch, publicationStatus)}
          />
          {filteredOffers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {agencyOffers.length === 0 ? t("no_publications") : t("filter_no_results")}
            </div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>{t("table_title")}</TableHead><TableHead>{t("table_price")}</TableHead><TableHead>{t("table_duration")}</TableHead><TableHead>{t("table_category")}</TableHead><TableHead>{t("table_status")}</TableHead><TableHead className="text-right">{t("table_actions")}</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredOffers.map((p) => {
                  const hidden = isPackHidden(p.id);
                  return (
                    <TableRow key={p.id} className={hidden ? "opacity-50" : ""}>
                      <TableCell className="font-semibold">{p.name}</TableCell>
                      <TableCell>{p.price.toLocaleString()} {t("fcfa")}</TableCell>
                      <TableCell>{p.duration}</TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell>
                        <Badge className={hidden ? "bg-muted text-muted-foreground" : "bg-green-100 text-green-700"}>
                          {hidden ? t("unpublished_badge") : t("online_badge")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" title={t("table_actions")} aria-label={t("table_actions")}>
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => openEditOffer(p)}>
                              <Pencil /> {t("edit_btn")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleTogglePublish(p.id)}>
                              {hidden ? <CheckCircle2 /> : <X />}
                              {hidden ? t("publish_btn") : t("unpublish_btn")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-700" onSelect={() => handleDeleteOffer(p.id)}>
                              <Trash2 /> {t("remove_btn")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent></Card>
      )}

      {active === "partners" && (
        <div className="space-y-4">
          {(selectingFor === "hotelier" || selectingFor === "transport") && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <CheckCircle2 size={16} className="text-[#EA580C]" />
                <span className="font-semibold text-[#EA580C]">
                  {selectingFor === "hotelier" ? t("choose_hotelier_title") : t("choose_transport_title")}
                </span>
                <span className="text-muted-foreground">{t("choose_selection_hint")}</span>
              </div>
              <Button size="sm" className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={finishSelection}>
                {t("finish_selection_btn")}
              </Button>
            </div>
          )}
          <Card><CardContent className="p-0">
            <div className="p-4 border-b flex flex-wrap gap-3 justify-between items-center">
              <div>
                <h3 className="font-bold text-foreground text-lg">{t("partners_page_heading")}</h3>
              </div>
              <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={openAddPartner}>
                <Plus size={16} className="mr-1" /> {t("add_partner_btn")}
              </Button>
            </div>
            <FilterBar
              t={t}
              search={partnerSearch}
              onSearch={setPartnerSearch}
              placeholder={t("filter_partners_placeholder")}
              groups={[
                { label: t("table_type"), options: partnerTypeOptions, value: partnerFilter, onChange: (v) => setPartnerFilter(v as "all" | PartnerType) },
                { label: t("table_status"), options: partnerStatusOptions, value: partnerStatusFilter, onChange: (v) => setPartnerStatusFilter(v as typeof partnerStatusFilter) },
              ]}
              onReset={() => { setPartnerSearch(""); setPartnerFilter("all"); setPartnerStatusFilter("all"); }}
              activeCount={activeFilterCount(partnerSearch, partnerFilter, partnerStatusFilter)}
            />
            {filteredPartners.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {partners.length === 0 ? t("no_partners_yet") : t("filter_no_results")}
              </div>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  {(selectingFor === "hotelier" || selectingFor === "transport") && <TableHead className="w-10" />}
                  <TableHead>{t("table_partner")}</TableHead>
                  <TableHead>{t("table_type")}</TableHead>
                  <TableHead>{t("table_partner_contact")}</TableHead>
                  <TableHead>{t("table_status")}</TableHead>
                  <TableHead>{t("table_commission_rate")}</TableHead>
                  <TableHead className="text-right">{t("table_actions")}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filteredPartners.map(p => (
                      <TableRow key={p.id}>
                        {(selectingFor === "hotelier" || selectingFor === "transport") && (
                          <TableCell>
                            <input
                              type="checkbox"
                              aria-label={p.name}
                              checked={(selectingFor === "hotelier" ? offerForm.hotelPartnerIds : offerForm.transportPartnerIds).includes(p.id)}
                              onChange={() => togglePartnerSelection(p)}
                              className="h-4 w-4 accent-[#EA580C]"
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {(() => {
                              const avatar = getPartnerAvatar(p);
                              return avatar ? (
                                <img src={avatar} alt={p.name} className="h-10 w-10 shrink-0 rounded-full object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-orange-100 text-[#EA580C] flex items-center justify-center shrink-0">
                                  {p.type === "hotelier" ? <Hotel size={18} /> : <Bus size={18} />}
                                </div>
                              );
                            })()}
                            <div>
                              <div className="font-semibold">{p.name}</div>
                              <div className="text-xs text-muted-foreground">{p.city || "—"}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{p.type === "hotelier" ? t("partner_type_hotelier") : t("partner_type_travel")}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div>{p.contact || "—"}</div><div>{p.phone || p.email || ""}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={p.status === "Actif" ? "bg-green-100 text-green-700" : p.status === "En attente" ? "bg-yellow-100 text-yellow-700" : "bg-muted text-muted-foreground"}>
                            {p.status === "Actif" ? t("partner_status_active") : p.status === "En attente" ? t("partner_status_pending") : t("partner_status_suspended")}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-[#EA580C]">
                          {p.contract?.commissionRate ?? 0}%
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" title={t("table_actions")} aria-label={t("table_actions")}>
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => togglePartnerSelection(p)}>
                                <CheckCircle2 />
                                {(p.type === "hotelier" ? offerForm.hotelPartnerIds : offerForm.transportPartnerIds).includes(p.id)
                                  ? t("unchoose_partner_action")
                                  : t("choose_partner_action")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => openContact(getPartnerContactId(p))}>
                                <MessageSquare /> {t("contact_action_btn")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => openEditPartner(p, true)}>
                                <FileText /> {t("edit_clauses_btn")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => openEditPartner(p)}>
                                <Pencil /> {t("edit_btn")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600 focus:text-red-700" onSelect={() => handleRemovePartner(p)}>
                                <Trash2 /> {t("remove_btn")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </div>
      )}

      {active === "guides" && (
        <div className="space-y-4">
          {selectingFor === "guide" && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <CheckCircle2 size={16} className="text-[#EA580C]" />
                <span className="font-semibold text-[#EA580C]">{t("choose_guide_title")}</span>
                <span className="text-muted-foreground">{t("choose_selection_hint")}</span>
              </div>
              <Button size="sm" className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={finishSelection}>
                {t("finish_selection_btn")}
              </Button>
            </div>
          )}
          <Card><CardContent className="p-0">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold text-foreground">{t("guides_heading")}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t("guides_desc")}</p>
              </div>
              <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={openAddGuide}>
                <UserPlus size={16} className="mr-1" /> {t("add_guide_btn")}
              </Button>
            </div>
            <FilterBar
              t={t}
              search={guideSearch}
              onSearch={setGuideSearch}
              placeholder={t("filter_guides_placeholder")}
              groups={[{ label: t("table_partner_city"), options: guideCityOptions, value: guideCityFilter, onChange: setGuideCityFilter }]}
              onReset={() => { setGuideSearch(""); setGuideCityFilter("all"); }}
              activeCount={activeFilterCount(guideSearch, guideCityFilter)}
            />
            {filteredGuides.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {agencyGuides.length === 0 ? t("no_guides") : t("filter_no_results")}
              </div>
            ) : (
              <Table>
                  <TableHeader><TableRow>
                  {selectingFor === "guide" && <TableHead className="w-10" />}
                  <TableHead>{t("table_guide_name")}</TableHead>
                  <TableHead>{t("table_guide_specialty")}</TableHead>
                  <TableHead>{t("guide_payment_label")}</TableHead>
                  <TableHead>{t("guide_commission_label")}</TableHead>
                  <TableHead>{t("guide_price_label")}</TableHead>
                  <TableHead className="text-right">{t("table_actions")}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filteredGuides.map(g => (
                    <TableRow key={g.id}>
                      {selectingFor === "guide" && (
                        <TableCell>
                          <input
                            type="checkbox"
                            aria-label={g.name}
                            checked={offerForm.guideIds.includes(g.id)}
                            onChange={() => toggleGuideSelection(g)}
                            className="h-4 w-4 accent-[#EA580C]"
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-orange-100">
                            <img src={g.photo || g.image} alt={g.name} className="w-full h-full object-cover" />
                          </div>
                          <span>{g.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{g.specialty}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{g.paymentMethod || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{g.commission != null ? `${g.commission}%` : "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{g.price != null ? `${g.price.toLocaleString()} ${t("fcfa")}/${t("day_short")}` : "-"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" title={t("table_actions")} aria-label={t("table_actions")}>
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => toggleGuideSelection(g)}>
                              <CheckCircle2 />
                              {offerForm.guideIds.includes(g.id) ? t("unchoose_partner_action") : t("choose_partner_action")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => openContact(getGuideContactId(g))}>
                              <MessageSquare /> {t("contact_action_btn")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-700" onSelect={() => handleRemoveGuide(g)}>
                              <Trash2 /> {t("remove_btn")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </div>
      )}

      {active === "revenue" && (
        <Card><CardContent className="p-6 space-y-4">
          <div>
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Wallet size={18} className="text-[#EA580C]" /> {t("revenue_heading")}
            </h3>
            <p className="text-xs text-[#EA580C] mt-1">{t("revenue_confirmed_only")}</p>
          </div>
          <FilterBar
            t={t}
            className="-mx-6"
            search={revenueSearch}
            onSearch={setRevenueSearch}
            placeholder={t("filter_revenue_placeholder")}
            groups={[
              { label: t("group_by"), options: revenueGroupOptions, value: revenueGroupBy, onChange: (v) => setRevenueGroupBy(v as typeof revenueGroupBy) },
              ...(revenueGroupBy === "date"
                ? [{ label: t("group_period"), options: revenuePeriodOptions, value: revenueDateGranularity, onChange: (v: string) => setRevenueDateGranularity(v as typeof revenueDateGranularity) }]
                : []),
            ]}
            onReset={() => { setRevenueSearch(""); setRevenueGroupBy("recent"); setRevenueDateGranularity("day"); }}
            activeCount={activeFilterCount(revenueSearch, revenueGroupBy === "recent" ? "" : revenueGroupBy)}
          />
          {filteredRevenues.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              {reservationRevenues.length === 0 ? t("no_reservations_yet") : t("filter_no_results")}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>{t("revenue_col_offer")}</TableHead>
                    <TableHead>{t("revenue_col_hotel")}</TableHead>
                    <TableHead>{t("revenue_col_transport")}</TableHead>
                    <TableHead>{t("revenue_col_guide")}</TableHead>
                    <TableHead className="text-right">{t("revenue_col_margin")}</TableHead>
                    <TableHead className="text-right">{t("revenue_col_total")}</TableHead>
                  </TableRow></TableHeader>
                  {revenueGroups.map((group) => (
                    <TableBody key={group.key}>
                      {group.label && (
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableCell colSpan={6} className="py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {group.label}
                          </TableCell>
                        </TableRow>
                      )}
                      {group.items.map(({ reservation: r, revenue: rev }) => (
                        <TableRow key={r.ref}>
                          <TableCell className="align-top">
                            <div className="font-semibold">{r.packName}</div>
                            <div className="font-mono text-xs text-muted-foreground">{r.ref}</div>
                            <div className="text-xs text-muted-foreground">{r.dates} · {r.participants} {t("table_participants").toLowerCase()} · {r.days} {t("table_days").toLowerCase()}</div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="text-sm font-medium">{rev.hotel.name}</div>
                            <div className="text-xs text-muted-foreground">{rev.hotel.base.toLocaleString()} {t("fcfa")} × {rev.hotel.rate}%</div>
                            <div className="text-sm font-bold text-[#EA580C]">+{rev.hotel.commission.toLocaleString()} {t("fcfa")}</div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="text-sm font-medium">{rev.transport.name}</div>
                            <div className="text-xs text-muted-foreground">{rev.transport.base.toLocaleString()} {t("fcfa")} × {rev.transport.rate}%</div>
                            <div className="text-sm font-bold text-[#EA580C]">+{rev.transport.commission.toLocaleString()} {t("fcfa")}</div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="text-sm font-medium">{rev.guide.name}</div>
                            <div className="text-xs text-muted-foreground">{rev.guide.base.toLocaleString()} {t("fcfa")} × {rev.guide.rate}%</div>
                            <div className="text-sm font-bold text-[#EA580C]">+{rev.guide.commission.toLocaleString()} {t("fcfa")}</div>
                          </TableCell>
                          <TableCell className="align-top text-right font-semibold">+{rev.agencyMargin.toLocaleString()} {t("fcfa")}</TableCell>
                          <TableCell className="align-top text-right font-bold text-[#EA580C]">{rev.total.toLocaleString()} {t("fcfa")}</TableCell>
                      </TableRow>
                      ))}
                    </TableBody>
                  ))}
                  <tfoot>
                    <TableRow className="border-t-2 bg-orange-50/60 font-bold">
                      <TableCell>{t("revenue_total_label")}</TableCell>
                      <TableCell className="text-right">{filteredRevenueTotals.hotel.toLocaleString()} {t("fcfa")}</TableCell>
                      <TableCell className="text-right">{filteredRevenueTotals.transport.toLocaleString()} {t("fcfa")}</TableCell>
                      <TableCell className="text-right">{filteredRevenueTotals.guide.toLocaleString()} {t("fcfa")}</TableCell>
                      <TableCell className="text-right">{filteredRevenueTotals.margin.toLocaleString()} {t("fcfa")}</TableCell>
                      <TableCell className="text-right text-[#EA580C]">{filteredRevenueTotals.total.toLocaleString()} {t("fcfa")}</TableCell>
                    </TableRow>
                  </tfoot>
                </Table>
              </div>
              <Button variant="outline" onClick={() => toast.success(t("pdf_generated"))}>{t("export_pdf_btn")}</Button>
            </>
          )}
        </CardContent></Card>
      )}

      {active === "clients" && (
        <div className="space-y-4">
          <Card><CardContent className="p-0">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-foreground">{t("clients_heading")}</h3>
            </div>
            <FilterBar
              t={t}
              search={clientSearch}
              onSearch={setClientSearch}
              placeholder={t("filter_clients_placeholder")}
              groups={[{ label: t("table_status"), options: statusFilterOptions, value: clientStatus, onChange: (v) => setClientStatus(v as typeof clientStatus) }]}
              onReset={() => { setClientSearch(""); setClientStatus("all"); }}
              activeCount={activeFilterCount(clientSearch, clientStatus)}
            />
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {agencyReservations.length === 0 ? t("no_clients") : t("filter_no_results")}
              </div>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>{t("table_tourist")}</TableHead>
                  <TableHead>{t("table_contact")}</TableHead>
                  <TableHead>{t("table_pack_client")}</TableHead>
                  <TableHead>{t("table_dates_client")}</TableHead>
                  <TableHead>{t("table_participants_client")}</TableHead>
                  <TableHead>{t("table_status_client")}</TableHead>
                  <TableHead className="text-right">{t("table_total_client")}</TableHead>
                  <TableHead className="text-right">{t("table_actions")}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filteredClients.map((r) => {
                    const tourist = getUserById(r.userId);
                    return (
                      <TableRow key={r.ref} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailClient(r)}>
                        <TableCell>
                          <div className="font-semibold">{tourist ? `${tourist.firstName} ${tourist.lastName}` : r.userId}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">{tourist?.email}</div>
                          <div className="text-xs text-muted-foreground">{tourist?.phone}</div>
                        </TableCell>
                        <TableCell className="font-semibold">{r.packName}</TableCell>
                        <TableCell>{r.dates}</TableCell>
                        <TableCell>{r.participants}</TableCell>
                        <TableCell>
                          <Badge className={
                            r.status === "Confirmée" ? "bg-green-100 text-green-700" :
                            r.status === "En attente" ? "bg-yellow-100 text-yellow-700" :
                            r.status === "Terminée" ? "bg-muted text-muted-foreground" :
                            "bg-red-100 text-red-700"
                          }>{r.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold">{r.totalPrice.toLocaleString()} {t("fcfa")}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" title={t("table_actions")} aria-label={t("table_actions")}>
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onSelect={() => openContact(getTouristContactId(r.userId))}>
                                <MessageSquare /> {t("contact_action_btn")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setDetailClient(r)}>
                                <FileText /> {t("view_details")}
                              </DropdownMenuItem>
                              {r.status !== "Annulée" && (
                                <DropdownMenuItem onSelect={() => handleCancelReservation(r)}>
                                  <Ban /> {t("cancel_reservation")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600 focus:text-red-700" onSelect={() => handleDeleteReservation(r)}>
                                <Trash2 /> {t("delete_reservation")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </div>
      )}

      {active === "messages" && (
        <div className="h-[600px]">
          <DtMessenger
            agencyId={agencyId}
            initialContactId={messageTarget?.id}
            contactNonce={messageTarget?.nonce}
          />
        </div>
      )}

      {active === "subscription" && (
        <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">{t("subscription_plans_heading")}</h3>
              <p className="text-sm text-muted-foreground">{t("subscription_plans_desc")}</p>
          <div className="grid md:grid-cols-3 gap-4">
            {subscriptionPlans.filter((p) => p.published !== false).map((p) => {
              const isActive = tenant.subscribed && p.id === tenant.plan;
              return (
                <Card key={p.id} className={`relative ${p.popular ? "border-2 border-[#EA580C] shadow-xl" : ""}`}>
                  {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#EA580C] text-white text-xs font-bold px-3 py-1 rounded-full">{t("recommended")}</div>}
                  <CardContent className="p-6 text-center">
                    <h4 className="font-bold text-lg text-foreground">{p.label}</h4>
                    <div className="mt-3">
                      <span className="text-3xl font-bold text-[#EA580C]">{p.price.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground"> {t("fcfa")} / {p.period}</span>
                    </div>
                    {p.save && <Badge className="bg-[#EA580C]/10 text-[#EA580C] mt-2">{t("save_label")} {p.save}</Badge>}
                    <ul className="text-sm text-left mt-4 space-y-2">
                      <li className="flex gap-2"><CheckCircle2 size={16} className="text-[#EA580C] shrink-0" /> {p.publications} {t("publications_count")}</li>
                      <li className="flex gap-2"><CheckCircle2 size={16} className="text-[#EA580C] shrink-0" /> {t("dedicated_interface")}</li>
                      <li className="flex gap-2"><CheckCircle2 size={16} className="text-[#EA580C] shrink-0" /> {t("realtime_stats_label")}</li>
                      <li className="flex gap-2"><CheckCircle2 size={16} className="text-[#EA580C] shrink-0" /> {t("priority_support")}</li>
                    </ul>
                    <Button
                      className={`w-full mt-5 ${isActive ? "bg-muted text-muted-foreground" : "bg-[#EA580C] hover:bg-[#C2410C] text-white"}`}
                      disabled={isActive}
                      onClick={() => toast.success(`${t("subscription_activated")} ${p.label}`)}
                    >{isActive ? t("current_plan_btn") : t("subscribe_btn")}</Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {active === "profile" && (
        <Card><CardContent className="p-6 max-w-2xl space-y-3">
          <div className="flex items-center gap-4 mb-2">
            <label className="relative shrink-0 cursor-pointer" title={t("profile_photo_hint")}>
              {authUser?.avatar || agency?.logo ? (
                <img
                  src={authUser?.avatar || agency?.logo}
                  alt={tenant.name}
                  className="h-16 w-16 rounded-full object-cover border-2 border-[#EA580C]/20"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-[#EA580C]/10 text-[#EA580C] flex items-center justify-center"><Building2 size={26} /></div>
              )}
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#EA580C] text-white ring-2 ring-background">
                <Camera size={13} />
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
            </label>
            <div>
              <h3 className="font-bold text-foreground">{t("profile_public_heading")}</h3>
              <p className="text-xs text-muted-foreground">
                {uploadingAvatar ? t("modal_offer_uploading") : t("profile_photo_hint")}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("agency_name_label")}</Label><Input defaultValue={tenant.name} /></div>
            <div><Label>{t("city_label")}</Label><Input defaultValue={tenant.city} /></div>
          </div>
          <div><Label>{t("email_label_pro")}</Label><Input defaultValue={authUser?.email ?? ""} /></div>
          <div><Label>{t("phone_label")}</Label><Input defaultValue={authUser?.phone ?? ""} /></div>
          <div><Label>{t("public_desc_label")}</Label><Textarea rows={3} defaultValue={agency?.desc ?? ""} /></div>
          <div><Label>{t("iban_label")}</Label><Input placeholder={t("iban_placeholder")} /></div>
          <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={() => toast.success(t("profile_updated_toast"))}>{t("save_btn")}</Button>
          <Button variant="outline" className="ml-2" onClick={() => router.push("/")}>{t("view_public_page_btn")}</Button>
        </CardContent></Card>
      )}
      {/* Modal Détail client */}
      {detailClient && (() => {
        const tourist = getUserById(detailClient.userId);
        const pack = getAllPacks().find(p => p.id === detailClient.packId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetailClient(null)}>
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <CardContent className="p-0">
                <div className="relative">
                  <img src={pack?.image ?? "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80"} alt={detailClient.packName} className="w-full h-44 object-cover rounded-t-xl" />
                  <button onClick={() => setDetailClient(null)} className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60"><X size={18} /></button>
                  <div className="absolute bottom-3 left-3">
                    <Badge className={
                      detailClient.status === "Confirmée" ? "bg-green-100 text-green-700" :
                      detailClient.status === "En attente" ? "bg-yellow-100 text-yellow-700" :
                      detailClient.status === "Terminée" ? "bg-muted text-muted-foreground" :
                      "bg-red-100 text-red-700"
                    }>{detailClient.status}</Badge>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{detailClient.packName}</h2>
                    <p className="text-sm text-muted-foreground">{t("modal_client_ref")} {detailClient.ref}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users size={16} className="text-[#EA580C]" />
                      <span><span className="font-semibold">{t("modal_client_tourist")}</span><br />{tourist ? `${tourist.firstName} ${tourist.lastName}` : detailClient.userId}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 size={16} className="text-[#EA580C]" />
                      <span><span className="font-semibold">{t("modal_client_contact")}</span><br />{tourist?.email ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 size={16} className="text-[#EA580C]" />
                      <span><span className="font-semibold">{t("modal_client_phone")}</span><br />{tourist?.phone ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 size={16} className="text-[#EA580C]" />
                      <span><span className="font-semibold">{t("modal_client_city")}</span><br />{tourist?.city ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Wallet size={16} className="text-[#EA580C]" />
                      <span><span className="font-semibold">{t("modal_client_dates")}</span><br />{detailClient.dates}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Wallet size={16} className="text-[#EA580C]" />
                      <span><span className="font-semibold">{t("modal_client_total")}</span><br />{detailClient.totalPrice.toLocaleString()} {t("fcfa")}</span>
                    </div>
                    {detailClient.hotelName && (
                      <div className="flex items-center gap-2 text-sm">
                        <Hotel size={16} className="text-[#EA580C]" />
                        <span><span className="font-semibold">{t("accommodation_heading")}</span><br /><span>{detailClient.hotelName}</span>{(() => { const h = HOTELS_NEARBY.find(hx => detailClient.hotelName && hx.name.toLowerCase() === detailClient.hotelName.toLowerCase()); return h ? <Link href={`/hotel/${h.id}`} className="inline ml-1"><ExternalLink size={12} className="text-muted-foreground hover:text-[#EA580C]" /></Link> : null; })()}{detailClient.hotelPrice ? ` · ${detailClient.hotelPrice.toLocaleString()} ${t("fcfa")}` : ""}</span>
                      </div>
                    )}
                    {detailClient.transportLabel && (
                      <div className="flex items-center gap-2 text-sm">
                        <Bus size={16} className="text-[#EA580C]" />
                        <span><span className="font-semibold">{t("transport_heading")}</span><br />{detailClient.transportLabel}{detailClient.transportPrice ? ` · ${detailClient.transportPrice.toLocaleString()} ${t("fcfa")}` : ""}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setDetailClient(null)}>{t("modal_close_btn")}</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Modal Ajouter guide */}
      {showAddGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2" onClick={() => setShowAddGuide(false)}>
          <Card className="w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-foreground">{t("add_guide_modal_title")}</h3>
                <button onClick={() => setShowAddGuide(false)} className="p-1 rounded hover:bg-accent"><X size={20} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>{t("guide_name_label")}</Label>
                  <button
                    type="button"
                    onClick={() => setShowGuidePicker(v => !v)}
                    className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm"
                  >
                    <Search size={15} className="shrink-0 text-muted-foreground" />
                    <span className={guideForm.name ? "truncate text-foreground" : "truncate text-muted-foreground"}>
                      {guideForm.name || t("guide_name_placeholder")}
                    </span>
                    <ChevronDown size={15} className={`ml-auto shrink-0 text-muted-foreground transition-transform ${showGuidePicker ? "rotate-180" : ""}`} />
                  </button>
                  <p className="mt-1 text-xs text-muted-foreground">{t("guide_picker_hint")}</p>
                  {showGuidePicker && (
                    <div className="mt-2 overflow-hidden rounded-xl border bg-background shadow-sm">
                      <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2">
                        <Search size={15} className="shrink-0 text-muted-foreground" />
                        <input
                          autoFocus
                          value={guidePickerSearch}
                          onChange={e => setGuidePickerSearch(e.target.value)}
                          placeholder={t("guide_picker_search_placeholder")}
                          className="h-7 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                        />
                        {guidePickerSearch && (
                          <button
                            type="button"
                            title={t("clear_filters")}
                            onClick={() => setGuidePickerSearch("")}
                            className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <div className="max-h-56 space-y-1 overflow-y-auto p-1">
                        {registeredGuides.length === 0 ? (
                          <p className="px-3 py-6 text-center text-sm italic text-muted-foreground">{t("guide_picker_empty")}</p>
                        ) : filteredRegisteredGuides.length === 0 ? (
                          <p className="px-3 py-6 text-center text-sm italic text-muted-foreground">{t("guide_picker_no_results")}</p>
                        ) : filteredRegisteredGuides.map(g => {
                          const isSelected = guideForm.sourceGuideId === g.id;
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => selectRegisteredGuide(g)}
                              className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-accent ${isSelected ? "bg-accent" : ""}`}
                            >
                              <img src={g.photo || g.image} alt={g.name} className="h-9 w-9 shrink-0 rounded-full object-cover" />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-foreground">{g.name}</span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {g.specialty}
                                  {g.city ? ` · ${g.city}` : ""}
                                </span>
                              </span>
                              {isSelected && <Check size={15} className="shrink-0 text-[#EA580C]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Label>{t("guide_specialty_label")}</Label>
                  <Input value={guideForm.specialty} onChange={e => setGuideForm(f => ({ ...f, specialty: e.target.value }))} placeholder={t("guide_specialty_placeholder")} />
                </div>
                <div>
                  <Label>{t("guide_city_label")}</Label>
                  <Input value={guideForm.city} onChange={e => setGuideForm(f => ({ ...f, city: e.target.value }))} placeholder={t("guide_city_placeholder")} />
                </div>
                <div>
                  <Label>{t("guide_bio_label")}</Label>
                  <Textarea rows={2} value={guideForm.bio} onChange={e => setGuideForm(f => ({ ...f, bio: e.target.value }))} placeholder={t("guide_bio_placeholder")} />
                </div>
                <div>
                  <Label>{t("guide_photo_label")}</Label>
                  <Input value={guideForm.photo} onChange={e => setGuideForm(f => ({ ...f, photo: e.target.value }))} placeholder={t("guide_photo_placeholder")} />
                </div>
                <div>
                  <Label>{t("guide_id_document_label")}</Label>
                  <div className="flex gap-2 mt-1">
                    <select value={guideForm.idType} onChange={e => setGuideForm(f => ({ ...f, idType: e.target.value as "cni" | "passport" }))} className="flex h-10 w-1/3 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="cni">{t("guide_id_type_cni")}</option>
                      <option value="passport">{t("guide_id_type_passport")}</option>
                    </select>
                    <Input value={guideForm.idNumber} onChange={e => setGuideForm(f => ({ ...f, idNumber: e.target.value }))} placeholder={t("guide_id_number_placeholder")} className="w-2/3" />
                  </div>
                </div>
                <div>
                  <Label>{t("guide_id_file_label")}</Label>
                  <Input value={guideForm.idFileUrl} onChange={e => setGuideForm(f => ({ ...f, idFileUrl: e.target.value }))} placeholder={t("guide_id_file_placeholder")} />
                </div>
                <div>
                  <Label>{t("guide_payment_label")}</Label>
                  <Input value={guideForm.paymentMethod} onChange={e => setGuideForm(f => ({ ...f, paymentMethod: e.target.value }))} placeholder={t("guide_payment_placeholder")} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t("guide_commission_label")}</Label>
                    <Input type="number" min="0" max="100" value={guideForm.commission} onChange={e => setGuideForm(f => ({ ...f, commission: e.target.value }))} placeholder={t("guide_commission_placeholder")} />
                  </div>
                  <div>
                    <Label>{t("guide_price_label")}</Label>
                    <Input type="number" min="0" value={guideForm.price} onChange={e => setGuideForm(f => ({ ...f, price: e.target.value }))} placeholder={t("guide_price_placeholder")} />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1 bg-[#EA580C] hover:bg-[#C2410C]" onClick={async () => {
                    if (!guideForm.name || !guideForm.specialty) {
                      toast.error(t("fill_all_fields_error"));
                      return;
                    }
                    const idDoc = guideForm.idNumber ? {
                      type: guideForm.idType,
                      number: guideForm.idNumber,
                      fileUrl: guideForm.idFileUrl || "",
                    } : null;
                    // Un guide déjà rattaché à l'agence est mis à jour au lieu d'être dupliqué.
                    const existing = guideForm.sourceGuideId
                      ? registeredGuides.find(g => g.id === guideForm.sourceGuideId && g.agencyId === agencyId)
                      : undefined;
                    const payload = {
                      ...(existing ? { id: existing.id } : {}),
                      name: guideForm.name,
                      specialty: guideForm.specialty,
                      bio: guideForm.bio || "Guide expérimenté",
                      promise: existing?.promise ?? "Accompagnement personnalisé",
                      image: guideForm.photo || existing?.image || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
                      photo: guideForm.photo || "",
                      city: guideForm.city || authUser?.city || "Cameroun",
                      agencyId,
                      idDocument: idDoc,
                      paymentMethod: guideForm.paymentMethod || "",
                      commission: guideForm.commission ? parseInt(guideForm.commission) : 0,
                      price: guideForm.price ? parseInt(guideForm.price) : 0,
                      userId: guideForm.userId || undefined,
                    };
                    try {
                      const res = await fetch("/api/guides", {
                        method: existing ? "PUT" : "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                      });
                      if (!res.ok) throw new Error("Guide save failed");
                      await loadGuides();
                      setAgencyGuides(getAllGuides().filter(gg => gg.agencyId === agencyId));
                      setRegisteredGuides(getAllGuides());
                      setGuideForm({ ...EMPTY_GUIDE_FORM });
                      setShowGuidePicker(false);
                      setGuidePickerSearch("");
                      setShowAddGuide(false);
                      toast.success(t("guide_added"));
                    } catch { toast.error(t("error_occurred")); }
                  }}>{t("save_btn")}</Button>
                  <Button variant="outline" onClick={() => setShowAddGuide(false)}>{t("cancel_btn")}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Nouvelle offre */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-foreground">{editingOfferId ? t("modal_offer_edit_title") : t("modal_offer_title")}</h3>
                <button onClick={() => setShowOfferModal(false)} className="p-1 rounded hover:bg-accent"><X size={20} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>{t("modal_offer_name_label")}</Label>
                  <Input value={offerForm.name} onChange={e => setOfferForm(f => ({ ...f, name: e.target.value }))} placeholder={t("modal_offer_name_placeholder")} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t("modal_offer_category_label")}</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={offerForm.category} onChange={e => setOfferForm(f => ({ ...f, category: e.target.value }))}
                    >
                      <option value="Détente">Détente</option>
                      <option value="Aventure">Aventure</option>
                      <option value="Luxe">Luxe</option>
                      <option value="Culturel">Culturel</option>
                    </select>
                  </div>
                  <div>
                    <Label>{t("modal_offer_duration_label")}</Label>
                    <Input value={offerForm.duration} onChange={e => setOfferForm(f => ({ ...f, duration: e.target.value }))} placeholder={t("modal_offer_duration_placeholder")} />
                  </div>
                </div>
                <div>
                  <Label>{t("modal_offer_city_label")}</Label>
                  <Input value={offerForm.city} onChange={e => setOfferForm(f => ({ ...f, city: e.target.value }))} placeholder={t("modal_offer_city_placeholder")} />
                </div>

                {/* Sélection des partenaires et calcul automatique du prix */}
                <div className="pt-3 border-t space-y-3">
                  <h4 className="font-bold text-foreground flex items-center gap-2"><Handshake size={16} className="text-[#EA580C]" /> {t("offer_partners_heading")}</h4>
                  <p className="text-xs text-muted-foreground">{t("selected_only_hint")}</p>
                  <div className="grid gap-2">
                    <button type="button" onClick={() => chooseFor("hotelier")} className="flex items-center justify-between gap-3 rounded-lg border border-orange-200 bg-orange-50/60 px-3 py-2.5 text-left text-sm hover:bg-orange-50">
                      <span className="font-semibold text-foreground">{t("choose_hotelier_link")}</span>
                      <span className="flex shrink-0 items-center gap-2 text-xs font-semibold text-[#EA580C]">
                        {offerForm.hotelPartnerIds.length > 0 && <span className="rounded-full bg-[#EA580C] px-1.5 py-0.5 text-[10px] font-bold text-white">{offerForm.hotelPartnerIds.length}</span>}
                        <ExternalLink size={14} />
                      </span>
                    </button>
                    <button type="button" onClick={() => chooseFor("transport")} className="flex items-center justify-between gap-3 rounded-lg border border-orange-200 bg-orange-50/60 px-3 py-2.5 text-left text-sm hover:bg-orange-50">
                      <span className="font-semibold text-foreground">{t("choose_transport_link")}</span>
                      <span className="flex shrink-0 items-center gap-2 text-xs font-semibold text-[#EA580C]">
                        {offerForm.transportPartnerIds.length > 0 && <span className="rounded-full bg-[#EA580C] px-1.5 py-0.5 text-[10px] font-bold text-white">{offerForm.transportPartnerIds.length}</span>}
                        <ExternalLink size={14} />
                      </span>
                    </button>
                    <button type="button" onClick={() => chooseFor("guide")} className="flex items-center justify-between gap-3 rounded-lg border border-orange-200 bg-orange-50/60 px-3 py-2.5 text-left text-sm hover:bg-orange-50">
                      <span className="font-semibold text-foreground">{t("choose_guide_link")}</span>
                      <span className="flex shrink-0 items-center gap-2 text-xs font-semibold text-[#EA580C]">
                        {offerForm.guideIds.length > 0 && <span className="rounded-full bg-[#EA580C] px-1.5 py-0.5 text-[10px] font-bold text-white">{offerForm.guideIds.length}</span>}
                        <ExternalLink size={14} />
                      </span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{t("modal_offer_places_label")}</Label>
                      <Input type="number" min="1" value={offerForm.places} onChange={e => setOfferForm(f => ({ ...f, places: e.target.value }))} />
                    </div>
                    <div>
                      <Label>{t("modal_offer_margin_label")}</Label>
                      <Input type="number" min="0" value={offerForm.agencyMargin} onChange={e => setOfferForm(f => ({ ...f, agencyMargin: e.target.value }))} />
                    </div>
                  </div>
                  <div className="rounded-lg bg-orange-50 p-3 space-y-1 text-sm">
                    <div className="flex justify-between gap-2">
                      <span>{t("breakdown_room")} ({days} {t("night_short")})</span>
                      <span className="font-semibold whitespace-nowrap">{roomCost.toLocaleString()} {t("fcfa")}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>{t("breakdown_trip")} ({places} {t("seat_short")})</span>
                      <span className="font-semibold whitespace-nowrap">{tripCost.toLocaleString()} {t("fcfa")}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>{t("breakdown_guide")} ({selectedGuides.length} × {days} {t("day_short")})</span>
                      <span className="font-semibold whitespace-nowrap">{guideCost.toLocaleString()} {t("fcfa")}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>{t("breakdown_margin")}</span>
                      <span className="font-semibold whitespace-nowrap">+{agencyMargin.toLocaleString()} {t("fcfa")}</span>
                    </div>
                    <div className="flex justify-between gap-2 border-t border-orange-200 pt-1 font-bold text-[#EA580C]">
                      <span>{t("breakdown_total")}</span>
                      <span className="whitespace-nowrap">{priceBreakdown.total.toLocaleString()} {t("fcfa")}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">{t("auto_price_hint")}</p>
                  </div>
                </div>
                <div>
                  <Label>{t("modal_offer_desc_label")}</Label>
                  <Textarea rows={3} value={offerForm.desc} onChange={e => setOfferForm(f => ({ ...f, desc: e.target.value }))} placeholder={t("modal_offer_desc_placeholder")} />
                </div>
                <div>
                  <Label>{t("modal_offer_image_label")}</Label>
                  <Input type="file" accept="image/*" disabled={uploading} onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    const fd = new FormData();
                    fd.append("file", file);
                    fd.append("agency", authUser?.companyName ?? "agence");
                    try {
                      const res = await fetch("/api/upload", { method: "POST", body: fd });
                      const data = await res.json();
                      if (data.url) setOfferForm(f => ({ ...f, image: data.url }));
                    } catch { toast.error(t("modal_offer_upload_failed")); }
                    setUploading(false);
                  }} />
                  {uploading && <p className="text-xs text-muted-foreground mt-1">{t("modal_offer_uploading")}</p>}
                  {offerForm.image && !uploading && (
                    <img src={offerForm.image} alt="Aperçu" className="mt-2 h-24 w-full object-cover rounded-md border" />
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1 bg-[#EA580C] hover:bg-[#C2410C]" onClick={handleCreateOffer}>{editingOfferId ? t("modal_offer_save_btn") : t("modal_offer_publish_btn")}</Button>
                  <Button variant="outline" onClick={() => setShowOfferModal(false)}>{t("modal_offer_cancel_btn")}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Ajouter / éditer partenaire & fiche récapitulative des clauses */}
      {showPartnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPartnerModal(false)}>
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-foreground">
                  {clausesOnly ? t("clauses_recap_title") : editingPartnerId ? t("edit_partner_modal_title") : t("add_partner_modal_title")}
                </h3>
                <button onClick={() => setShowPartnerModal(false)} className="p-1 rounded hover:bg-accent"><X size={20} /></button>
              </div>

              {clausesOnly ? (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">{t("clauses_readonly_hint")}</p>

                  <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
                    <div className="flex items-start justify-between gap-3 border-b bg-orange-50/60 px-5 py-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#EA580C]">
                          <FileText size={14} /> {t("clauses_recap_title")}
                        </div>
                        <h4 className="mt-1 truncate text-lg font-bold text-foreground">{partnerForm.name}</h4>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {partnerForm.type === "hotelier" ? t("partner_type_hotelier") : t("partner_type_travel")}
                          {partnerForm.city ? ` · ${partnerForm.city}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                        {partnerForm.status === "Actif"
                          ? t("partner_status_active")
                          : partnerForm.status === "En attente"
                            ? t("partner_status_pending")
                            : t("partner_status_suspended")}
                      </span>
                    </div>

                    <div className="space-y-5 px-5 py-4">
                      <section>
                        <h5 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#EA580C]">{t("clauses_recap_partner_section")}</h5>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                          <div>
                            <dt className="text-xs text-muted-foreground">{t("partner_type_label")}</dt>
                            <dd className="font-medium">{partnerForm.type === "hotelier" ? t("partner_type_hotelier") : t("partner_type_travel")}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">{t("city_label")}</dt>
                            <dd className="font-medium">{partnerForm.city || "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">{t("partner_contact_label")}</dt>
                            <dd className="font-medium">{partnerForm.contact || "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">{t("phone_label")}</dt>
                            <dd className="font-medium">{partnerForm.phone || "—"}</dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="text-xs text-muted-foreground">{t("email_label_pro")}</dt>
                            <dd className="font-medium">{partnerForm.email || "—"}</dd>
                          </div>
                        </dl>
                      </section>

                      <section className="border-t pt-4">
                        <h5 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#EA580C]">{t("clauses_recap_contract_section")}</h5>
                        <dl className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <dt className="text-xs text-muted-foreground">{t("contract_commission_label")}</dt>
                            <dd className="font-semibold">{partnerForm.commissionRate || "0"} %</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">{t("contract_payment_delay_label")}</dt>
                            <dd className="font-semibold">{partnerForm.paymentDelay || "0"}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">{t("contract_duration_label")}</dt>
                            <dd className="font-semibold">{partnerForm.durationMonths || "0"}</dd>
                          </div>
                          <div className="col-span-3">
                            <dt className="text-xs text-muted-foreground">{t("contract_start_date_label")}</dt>
                            <dd className="font-medium">{partnerForm.startDate || "—"}</dd>
                          </div>
                        </dl>
                      </section>

                      <section className="border-t pt-4">
                        <h5 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#EA580C]">{t("clauses_recap_pricing_section")}</h5>
                        <dl className="grid grid-cols-2 gap-3 text-sm">
                          {partnerForm.type === "hotelier" ? (
                            <>
                              <div>
                                <dt className="text-xs text-muted-foreground">{t("partner_room_price_label")}</dt>
                                <dd className="font-semibold">{Number(partnerForm.roomPrice || 0).toLocaleString()} {t("fcfa")}</dd>
                              </div>
                              <div>
                                <dt className="text-xs text-muted-foreground">{t("partner_room_type_label")}</dt>
                                <dd className="font-medium">{partnerForm.roomType || "—"}</dd>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <dt className="text-xs text-muted-foreground">{t("partner_trip_price_label")}</dt>
                                <dd className="font-semibold">{Number(partnerForm.tripPrice || 0).toLocaleString()} {t("fcfa")}</dd>
                              </div>
                              <div>
                                <dt className="text-xs text-muted-foreground">{t("partner_trip_label_label")}</dt>
                                <dd className="font-medium">{partnerForm.tripLabel || "—"}</dd>
                              </div>
                            </>
                          )}
                        </dl>
                      </section>

                      <section className="border-t pt-4">
                        <h5 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#EA580C]">{t("contract_notes_label")}</h5>
                        <p className="whitespace-pre-wrap rounded-md bg-muted/40 px-3 py-2 text-sm leading-relaxed text-foreground">
                          {partnerForm.notes || t("clauses_recap_no_notes")}
                        </p>
                      </section>
                    </div>
                  </div>

                  <Button className="w-full bg-[#EA580C] hover:bg-[#C2410C]" onClick={() => setShowPartnerModal(false)}>{t("modal_close")}</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label>{t("partner_name_label")}</Label>
                    <button
                      type="button"
                      onClick={() => setShowPartnerPicker(v => !v)}
                      className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm"
                    >
                      <Search size={15} className="shrink-0 text-muted-foreground" />
                      <span className={partnerForm.name ? "truncate text-foreground" : "truncate text-muted-foreground"}>
                        {partnerForm.name || t("partner_name_placeholder")}
                      </span>
                      <ChevronDown size={15} className={`ml-auto shrink-0 text-muted-foreground transition-transform ${showPartnerPicker ? "rotate-180" : ""}`} />
                    </button>
                    <p className="mt-1 text-xs text-muted-foreground">{t("partner_picker_hint")}</p>
                    {showPartnerPicker && (
                      <div className="mt-2 overflow-hidden rounded-xl border bg-background shadow-sm">
                        <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2">
                          <Search size={15} className="shrink-0 text-muted-foreground" />
                          <input
                            autoFocus
                            value={partnerPickerSearch}
                            onChange={e => setPartnerPickerSearch(e.target.value)}
                            placeholder={t("partner_picker_search_placeholder")}
                            className="h-7 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                          />
                          {partnerPickerSearch && (
                            <button
                              type="button"
                              title={t("clear_filters")}
                              onClick={() => setPartnerPickerSearch("")}
                              className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        <div className="flex gap-1 border-b px-2 py-1.5">
                          {([
                            { key: "all", label: t("all_partners") },
                            { key: "hotel", label: t("partner_type_hotelier") },
                            { key: "agence-voyages", label: t("partner_type_travel") },
                          ] as const).map(tab => (
                            <button
                              key={tab.key}
                              type="button"
                              onClick={() => setPartnerPickerType(tab.key)}
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                                partnerPickerType === tab.key
                                  ? "bg-[#EA580C] text-white"
                                  : "bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground"
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                        <div className="max-h-56 space-y-1 overflow-y-auto p-1">
                          {registeredPartners.length === 0 ? (
                            <p className="px-3 py-6 text-center text-sm italic text-muted-foreground">{t("partner_picker_empty")}</p>
                          ) : filteredRegisteredPartners.length === 0 ? (
                            <p className="px-3 py-6 text-center text-sm italic text-muted-foreground">{t("partner_picker_no_results")}</p>
                          ) : filteredRegisteredPartners.map(u => {
                            const displayName = u.companyName || `${u.firstName} ${u.lastName}`.trim();
                            const isSelected = partnerForm.userId === u.id;
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => selectRegisteredPartner(u)}
                                className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-accent ${isSelected ? "bg-accent" : ""}`}
                              >
                                {u.avatar ? (
                                  <img src={u.avatar} alt={displayName} className="h-9 w-9 shrink-0 rounded-full object-cover" />
                                ) : (
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EA580C]/10 text-xs font-bold text-[#EA580C]">
                                    {(u.firstName[0] ?? "") + (u.lastName[0] ?? "")}
                                  </div>
                                )}
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-semibold text-foreground">{displayName}</span>
                                  <span className="block truncate text-xs text-muted-foreground">
                                    {u.role === "hotel" ? t("partner_type_hotelier") : t("partner_type_travel")}
                                    {u.city ? ` · ${u.city}` : ""}
                                    {u.email ? ` · ${u.email}` : ""}
                                  </span>
                                </span>
                                {isSelected && <Check size={15} className="shrink-0 text-[#EA580C]" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{t("partner_type_label")}</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={partnerForm.type}
                        onChange={e => setPartnerForm(f => ({ ...f, type: e.target.value as PartnerType }))}
                      >
                        <option value="hotelier">{t("partner_type_hotelier")}</option>
                        <option value="agence-voyages">{t("partner_type_travel")}</option>
                      </select>
                    </div>
                    <div>
                      <Label>{t("city_label")}</Label>
                      <Input value={partnerForm.city} onChange={e => setPartnerForm(f => ({ ...f, city: e.target.value }))} placeholder={t("partner_city_placeholder")} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{t("partner_contact_label")}</Label>
                      <Input value={partnerForm.contact} onChange={e => setPartnerForm(f => ({ ...f, contact: e.target.value }))} placeholder={t("partner_contact_placeholder")} />
                    </div>
                    <div>
                      <Label>{t("phone_label")}</Label>
                      <Input value={partnerForm.phone} onChange={e => setPartnerForm(f => ({ ...f, phone: e.target.value }))} placeholder={t("partner_phone_placeholder")} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{t("email_label_pro")}</Label>
                      <Input type="email" value={partnerForm.email} onChange={e => setPartnerForm(f => ({ ...f, email: e.target.value }))} placeholder={t("partner_email_placeholder")} />
                    </div>
                    <div>
                      <Label>{t("partner_status_label")}</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={partnerForm.status}
                        onChange={e => setPartnerForm(f => ({ ...f, status: e.target.value as PartnerStatus }))}
                      >
                        <option value="Actif">{t("partner_status_active")}</option>
                        <option value="En attente">{t("partner_status_pending")}</option>
                        <option value="Suspendu">{t("partner_status_suspended")}</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <h4 className="font-bold text-foreground mb-2 flex items-center gap-2"><FileText size={16} className="text-[#EA580C]" /> {t("contract_clauses_heading")}</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>{t("contract_commission_label")}</Label>
                        <Input type="number" min="0" max="100" value={partnerForm.commissionRate} onChange={e => setPartnerForm(f => ({ ...f, commissionRate: e.target.value }))} placeholder="10" />
                      </div>
                      <div>
                        <Label>{t("contract_payment_delay_label")}</Label>
                        <Input type="number" min="0" value={partnerForm.paymentDelay} onChange={e => setPartnerForm(f => ({ ...f, paymentDelay: e.target.value }))} placeholder="15" />
                      </div>
                      <div>
                        <Label>{t("contract_duration_label")}</Label>
                        <Input type="number" min="0" value={partnerForm.durationMonths} onChange={e => setPartnerForm(f => ({ ...f, durationMonths: e.target.value }))} placeholder="12" />
                      </div>
                    </div>
                    {partnerForm.type === "hotelier" ? (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <Label>{t("partner_room_price_label")}</Label>
                          <Input type="number" min="0" value={partnerForm.roomPrice} onChange={e => setPartnerForm(f => ({ ...f, roomPrice: e.target.value }))} placeholder="55000" />
                        </div>
                        <div>
                          <Label>{t("partner_room_type_label")}</Label>
                          <Input value={partnerForm.roomType} onChange={e => setPartnerForm(f => ({ ...f, roomType: e.target.value }))} placeholder={t("partner_room_type_placeholder")} />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <Label>{t("partner_trip_price_label")}</Label>
                          <Input type="number" min="0" value={partnerForm.tripPrice} onChange={e => setPartnerForm(f => ({ ...f, tripPrice: e.target.value }))} placeholder="5000" />
                        </div>
                        <div>
                          <Label>{t("partner_trip_label_label")}</Label>
                          <Input value={partnerForm.tripLabel} onChange={e => setPartnerForm(f => ({ ...f, tripLabel: e.target.value }))} placeholder={t("partner_trip_label_placeholder")} />
                        </div>
                      </div>
                    )}
                    <div className="mt-3">
                      <Label>{t("contract_start_date_label")}</Label>
                      <Input type="date" value={partnerForm.startDate} onChange={e => setPartnerForm(f => ({ ...f, startDate: e.target.value }))} />
                    </div>
                    <div className="mt-3">
                      <Label>{t("contract_notes_label")}</Label>
                      <Textarea rows={3} value={partnerForm.notes} onChange={e => setPartnerForm(f => ({ ...f, notes: e.target.value }))} placeholder={t("contract_notes_placeholder")} />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button className="flex-1 bg-[#EA580C] hover:bg-[#C2410C]" onClick={handleSavePartner}>{t("save_btn")}</Button>
                    <Button variant="outline" onClick={() => setShowPartnerModal(false)}>{t("cancel_btn")}</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}
