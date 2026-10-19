"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/src/components/dt-sidebar";
import Link from "next/link";
import { LayoutDashboard, Megaphone, Wallet, Users, CreditCard, Settings, CheckCircle2, AlertCircle, Building2, X, MessageSquare, Hotel, Bus, Star, UserPlus, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Badge } from "@/src/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { AGENCY_REVENUE, COMMISSION_RATE, SUBSCRIPTION_PLANS, AGENCIES, PACKS, HOTELS_NEARBY, saveCustomOffer, removeCustomOffer, hidePack, unhidePack, isPackHidden, getAllPacks, loadCustomOffers, getReservationsByAgency, loadSavedReservations, loadGuides, getAllGuides, updateCustomOffer, type ReservationData, type GuideData } from "@/src/lib/njangui-data";
import { useOffersLoader } from "@/src/hooks/use-offers-loader";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { DtMessenger } from "@/src/components/dt-messenger";
import { useAuth } from "@/src/lib/auth-context";
import { getUserById } from "@/src/lib/auth-store";
import { toast } from "sonner";
import { useLang } from "@/src/lib/lang";

export default function AgencyDashboard() {
  const offersReady = useOffersLoader();
  const [active, setActive] = useState("overview");
  const { user: authUser } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [agencyCity, setAgencyCity] = useState("");
  const [agencyPhone, setAgencyPhone] = useState("");
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [offerForm, setOfferForm] = useState({ name: "", category: "Détente", price: "", duration: "", desc: "", image: "", city: "", guideIds: [] as string[] });
  const [detailClient, setDetailClient] = useState<ReservationData | null>(null);
  const [agencyGuides, setAgencyGuides] = useState<GuideData[]>([]);
  const [showAddGuide, setShowAddGuide] = useState(false);
  const [guideForm, setGuideForm] = useState({ name: "", specialty: "", bio: "", city: "", idType: "cni" as "cni" | "passport", idNumber: "", idFileUrl: "", photo: "", paymentMethod: "", commission: "" });
  const router = useRouter();
  const { t } = useLang();

  const items = [
    { key: "overview", label: t("sidebar_overview"), icon: LayoutDashboard },
    { key: "publications", label: t("sidebar_publications"), icon: Megaphone },
    { key: "guides", label: t("sidebar_guides"), icon: Users },
    { key: "revenue", label: t("sidebar_revenue"), icon: Wallet },
    { key: "clients", label: t("sidebar_clients"), icon: Users },
    { key: "messages", label: t("sidebar_messages"), icon: MessageSquare },
    { key: "subscription", label: t("sidebar_subscription"), icon: CreditCard },
    { key: "profile", label: t("sidebar_profile_agency"), icon: Settings },
  ];

  useEffect(() => {
    if (!authUser || authUser.role !== "agency") {
      router.replace("/auth");
      return;
    }
    setCompanyName(authUser.companyName ?? authUser.firstName);
    setAgencyCity(authUser.city ?? "");
    setAgencyPhone(authUser.phone);
    loadSavedReservations();
    loadGuides().then(() => setAgencyGuides(getAllGuides().filter(g => g.agencyId === agencyId)));
  }, [authUser, router]);

  const agency = AGENCIES.find(a => a.name === authUser?.companyName);
  const agencyId = agency?.id ?? "ag1";
  const agencyOffers = getAllPacks().filter(p => p.agencyId === agencyId);

  const agencyReservations = getReservationsByAgency(agencyId);

  const tenant = {
    name: authUser?.companyName ?? authUser?.firstName ?? "Mon Agence",
    city: authUser?.city ?? "Cameroun",
    subscribed: true,
    plan: authUser?.plan ?? "semester",
    usedPubs: agencyOffers.length,
    mailVerified: authUser?.verified ?? false,
  };

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === tenant.plan)!;

  const handleCreateOffer = async () => {
    if (!offerForm.name || !offerForm.price || !offerForm.duration) {
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
    if (editingOfferId) {
      await updateCustomOffer(editingOfferId, {
        name: offerForm.name,
        category: offerForm.category,
        price: parseInt(offerForm.price),
        duration: offerForm.duration,
        desc: offerForm.desc || "Nouvelle offre",
        image: offerForm.image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
        location: offerForm.city || "Cameroun",
        lat: coords.lat,
        lng: coords.lng,
        guideIds: offerForm.guideIds,
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
        price: parseInt(offerForm.price),
        duration: offerForm.duration,
        desc: offerForm.desc || "Nouvelle offre",
        image: offerForm.image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
        agencyId,
        guideIds: offerForm.guideIds,
      };
      await saveCustomOffer(newOffer as any);
      toast.success(`\u00AB ${newOffer.name} \u00BB ${t("offer_published")}`);
    }
    setEditingOfferId(null);
    setOfferForm({ name: "", category: "Détente", price: "", duration: "", desc: "", image: "", city: "", guideIds: [] });
    setShowOfferModal(false);
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

  return (
    <DashboardShell title={`Espace agence — ${tenant.name}`} items={items} active={active} onChange={setActive}>
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
            {(() => {
              const totalAgencyRevenue = agencyReservations.reduce((s, r) => s + r.totalPrice - (r.hotelPrice ?? 0) - (r.transportPrice ?? 0), 0);
              const totalCom = Math.round(totalAgencyRevenue * COMMISSION_RATE);
              const totalNet = totalAgencyRevenue - totalCom;
              return [
                { label: t("total_revenue_label"), value: `${totalAgencyRevenue.toLocaleString()} ${t("fcfa")}` },
                { label: `${t("commission_label")} (${(COMMISSION_RATE * 100).toFixed(0)}%)`, value: `-${totalCom.toLocaleString()} ${t("fcfa")}` },
                { label: t("net_revenue_label"), value: `${totalNet.toLocaleString()} ${t("fcfa")}` },
                { label: t("reservations_count"), value: String(agencyReservations.length) },
              ].map((k) => (
                <Card key={k.label}><CardContent className="p-5">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">{k.label}</div>
                  <div className="text-2xl font-bold text-foreground mt-1">{k.value}</div>
                </CardContent></Card>
              ));
            })()}
          </div>
          <Card><CardContent className="p-5">
            <h3 className="font-bold mb-3 text-foreground">{t("brut_vs_net_chart")}</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={AGENCY_REVENUE}>
                <XAxis dataKey="mois" /><YAxis /><Tooltip /><Legend />
                <Line type="monotone" dataKey="brut" stroke="#EA580C" strokeWidth={3} name={t("brut_label")} />
                <Line type="monotone" dataKey="net" stroke="#F97316" strokeWidth={3} strokeDasharray="4 4" name={t("net_label")} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent></Card>
        </div>
      )}

      {active === "publications" && (
        <Card><CardContent className="p-0">
          <div className="p-4 flex justify-between items-center border-b">
            <div>
              <h3 className="font-bold text-foreground">{t("my_publications_heading")} ({agencyOffers.length}/{plan.publications})</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t("quota_desc")} {plan.label}.</p>
            </div>
            <Button
              className="bg-[#EA580C] hover:bg-[#C2410C]"
              disabled={!tenant.subscribed || agencyOffers.length >= plan.publications}
              onClick={() => setShowOfferModal(true)}
            >{t("new_offer_btn")}</Button>
          </div>
          {agencyOffers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">{t("no_publications")}</div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>{t("table_title")}</TableHead><TableHead>{t("table_price")}</TableHead><TableHead>{t("table_duration")}</TableHead><TableHead>{t("table_category")}</TableHead><TableHead>{t("table_status")}</TableHead><TableHead className="text-right">{t("table_actions")}</TableHead></TableRow></TableHeader>
              <TableBody>
                {agencyOffers.map((p) => {
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
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => {
                          setEditingOfferId(p.id);
                          setOfferForm({
                            name: p.name,
                            category: p.category,
                            price: String(p.price),
                            duration: p.duration,
                            desc: p.desc,
                            image: p.image,
                            city: p.location,
                            guideIds: (p as any).guideIds ?? [],
                          });
                          setShowOfferModal(true);
                        }}>{t("edit_btn")}</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleTogglePublish(p.id)}>
                          {hidden ? t("publish_btn") : t("unpublish_btn")}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDeleteOffer(p.id)}>{t("remove_btn")}</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent></Card>
      )}

      {active === "affiliations" && (
        <Card><CardContent className="p-0">
          <div className="p-4 border-b">
            <h3 className="font-bold text-foreground">{t("partners_heading")}</h3>
            <p className="text-sm text-muted-foreground">{t("partners_desc")}</p>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>{t("table_partner")}</TableHead><TableHead>{t("table_type")}</TableHead><TableHead>{t("table_offer")}</TableHead><TableHead>{t("table_status")}</TableHead><TableHead className="text-right">{t("table_actions")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {[
                { name: "Hôtel La Falaise", type: "Hébergement", offer: "Pack Douala Business", status: "Actif" },
                { name: "Guide Mboma", type: "Guide local", offer: "Chutes de la Lobé", status: "En attente" },
                { name: "Star Voyages", type: "Transport", offer: "Mont Cameroun", status: "Actif" },
              ].map((p, i) => (
                <TableRow key={i}>
                  <TableCell className="font-semibold">{p.name}</TableCell>
                  <TableCell>{p.type}</TableCell>
                  <TableCell>{p.offer}</TableCell>
                  <TableCell>
                    <Badge className={p.status === "Actif" ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {p.status === "En attente" && <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => toast.success(`${p.name} ${t("affiliation_accepted")}`)}>{t("accept_btn")}</Button>}
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => toast.warning(t("affiliation_cancelled"))}>{t("break_btn")}</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}

      {active === "guides" && (
        <div className="space-y-4">
          <Card><CardContent className="p-0">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold text-foreground">{t("guides_heading")} ({agencyGuides.length})</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t("guides_desc")}</p>
              </div>
              <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={() => setShowAddGuide(true)}>
                <UserPlus size={16} className="mr-1" /> {t("add_guide_btn")}
              </Button>
            </div>
            {agencyGuides.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">{t("no_guides")}</div>
            ) : (
              <Table>
                  <TableHeader><TableRow>
                  <TableHead>{t("table_guide_name")}</TableHead>
                  <TableHead>{t("table_guide_specialty")}</TableHead>
                  <TableHead>{t("guide_payment_label")}</TableHead>
                  <TableHead>{t("guide_commission_label")}</TableHead>
                  <TableHead className="text-right">{t("table_actions")}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {agencyGuides.map(g => (
                    <TableRow key={g.id}>
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
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={async () => {
                          const ok = window.confirm(t("confirm_remove_guide"));
                          if (!ok) return;
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
                        }}>
                          <Trash2 size={14} />
                        </Button>
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
          <h3 className="font-bold text-foreground">{t("revenue_heading")}</h3>
          <p className="text-sm text-muted-foreground">
            À chaque paiement effectué par un touriste, Njangui retient automatiquement
            <span className="font-bold text-[#EA580C]"> {(COMMISSION_RATE * 100).toFixed(0)}% </span>
            qui est versé sur le compte de l'hébergeur. Le solde net est crédité sur votre compte bancaire.
          </p>
          {agencyReservations.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">{t("no_reservations_yet")}</p>
          ) : (
          <Table>
            <TableHeader><TableRow><TableHead>{t("table_ref")}</TableHead><TableHead>{t("table_price_offer")}</TableHead><TableHead>{t("table_participants")}</TableHead><TableHead>{t("table_days")}</TableHead><TableHead className="text-right">{t("table_pack_amount")}</TableHead><TableHead className="text-right">{t("table_hotel_transport")}</TableHead><TableHead className="text-right">{t("table_brut")}</TableHead><TableHead className="text-right">{t("table_commission")}</TableHead><TableHead className="text-right">{t("table_net")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {agencyReservations.map((r) => {
                const hotelTp = (r.hotelPrice ?? 0) + (r.transportPrice ?? 0);
                const agencyRev = r.totalPrice - hotelTp;
                const com = Math.round(agencyRev * COMMISSION_RATE);
                return (
                  <TableRow key={r.ref}>
                    <TableCell className="font-mono text-xs">{r.ref}</TableCell>
                    <TableCell className="font-semibold">{r.packName}</TableCell>
                    <TableCell>{r.participants}</TableCell>
                    <TableCell>{r.days}</TableCell>
                    <TableCell className="text-right">{agencyRev.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{hotelTp > 0 ? hotelTp.toLocaleString() : "—"}</TableCell>
                    <TableCell className="text-right">{agencyRev.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-[#EA580C]">-{com.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold">{(agencyRev - com).toLocaleString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          )}
          <Button variant="outline" onClick={() => toast.success(t("pdf_generated"))}>{t("export_pdf_btn")}</Button>
        </CardContent></Card>
      )}

      {active === "clients" && (
        <div className="space-y-4">
          <Card><CardContent className="p-0">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-foreground">{t("clients_heading")} ({agencyReservations.length})</h3>
            </div>
            {agencyReservations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">{t("no_clients")}</div>
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
                </TableRow></TableHeader>
                <TableBody>
                  {agencyReservations.map((r) => {
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
          <DtMessenger />
        </div>
      )}

      {active === "subscription" && (
        <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">{t("subscription_plans_heading")}</h3>
              <p className="text-sm text-muted-foreground">{t("subscription_plans_desc")}</p>
          <div className="grid md:grid-cols-3 gap-4">
            {SUBSCRIPTION_PLANS.map((p) => {
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
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-[#EA580C]/10 text-[#EA580C] flex items-center justify-center"><Building2 /></div>
            <h3 className="font-bold text-foreground">{t("profile_public_heading")}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("agency_name_label")}</Label><Input defaultValue={tenant.name} /></div>
            <div><Label>{t("city_label")}</Label><Input defaultValue={tenant.city} /></div>
          </div>
          <div><Label>{t("email_label_pro")}</Label><Input defaultValue="contact@evasion.cm" /></div>
          <div><Label>{t("phone_label")}</Label><Input defaultValue="+237 6 99 00 00 00" /></div>
          <div><Label>{t("public_desc_label")}</Label><Textarea rows={3} defaultValue="Spécialiste des séjours balnéaires sur la côte atlantique camerounaise." /></div>
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
                  <Input value={guideForm.name} onChange={e => setGuideForm(f => ({ ...f, name: e.target.value }))} placeholder={t("guide_name_placeholder")} />
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
                <div>
                  <Label>{t("guide_commission_label")}</Label>
                  <Input type="number" min="0" max="100" value={guideForm.commission} onChange={e => setGuideForm(f => ({ ...f, commission: e.target.value }))} placeholder={t("guide_commission_placeholder")} />
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
                    try {
                      const res = await fetch("/api/guides", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: guideForm.name,
                          specialty: guideForm.specialty,
                          bio: guideForm.bio || "Guide expérimenté",
                          promise: "Accompagnement personnalisé",
                          image: guideForm.photo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
                          photo: guideForm.photo || "",
                          city: guideForm.city || authUser?.city || "Cameroun",
                          agencyId,
                          idDocument: idDoc,
                          paymentMethod: guideForm.paymentMethod || "",
                          commission: guideForm.commission ? parseInt(guideForm.commission) : 0,
                        }),
                      });
                      const created = await res.json();
                      await loadGuides();
                      setAgencyGuides(getAllGuides().filter(gg => gg.agencyId === agencyId));
                      setGuideForm({ name: "", specialty: "", bio: "", city: "", idType: "cni", idNumber: "", idFileUrl: "", photo: "", paymentMethod: "", commission: "" });
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
                    <Label>{t("modal_offer_price_label")}</Label>
                    <Input type="number" value={offerForm.price} onChange={e => setOfferForm(f => ({ ...f, price: e.target.value }))} placeholder={t("modal_offer_price_placeholder")} />
                  </div>
                </div>
                <div>
                  <Label>{t("modal_offer_duration_label")}</Label>
                  <Input value={offerForm.duration} onChange={e => setOfferForm(f => ({ ...f, duration: e.target.value }))} placeholder={t("modal_offer_duration_placeholder")} />
                </div>
                <div>
                  <Label>{t("modal_offer_city_label")}</Label>
                  <Input value={offerForm.city} onChange={e => setOfferForm(f => ({ ...f, city: e.target.value }))} placeholder={t("modal_offer_city_placeholder")} />
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
                {agencyGuides.length > 0 && (
                  <div>
                    <Label>{t("assign_guides_label")}</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1 max-h-32 overflow-y-auto border rounded-md p-2">
                      {agencyGuides.map(g => (
                        <label key={g.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={offerForm.guideIds.includes(g.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setOfferForm(f => ({ ...f, guideIds: [...f.guideIds, g.id] }));
                              } else {
                                setOfferForm(f => ({ ...f, guideIds: f.guideIds.filter(id => id !== g.id) }));
                              }
                            }}
                            className="accent-[#EA580C]"
                          />
                          <span className="truncate">{g.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1 bg-[#EA580C] hover:bg-[#C2410C]" onClick={handleCreateOffer}>{editingOfferId ? t("modal_offer_save_btn") : t("modal_offer_publish_btn")}</Button>
                  <Button variant="outline" onClick={() => setShowOfferModal(false)}>{t("modal_offer_cancel_btn")}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}
