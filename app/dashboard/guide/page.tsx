"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/src/components/dt-sidebar";
import { Map, CalendarCheck, Star, User, BarChart3, MessageSquare, Wallet, Download } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Badge } from "@/src/components/ui/badge";
import { useAuth } from "@/src/lib/auth-context";
import { toast } from "sonner";
import { useLang } from "@/src/lib/lang";
import { useRouter } from "next/navigation";
import { DtMessenger } from "@/src/components/dt-messenger";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getAllReservations, getAllPacks, getAllGuides, loadSavedReservations, loadSavedReviews, getAllReviews, loadGuides, updateReservationStatus, type ReservationData, type ReviewData } from "@/src/lib/njangui-data";

export default function GuideDashboard() {
  const [active, setActive] = useState("overview");
  const { user, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [specialty, setSpecialty] = useState(user?.specialty ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [guideReservations, setGuideReservations] = useState<ReservationData[]>([]);
  const [guideReviews, setGuideReviews] = useState<ReviewData[]>([]);
  const [guideName, setGuideName] = useState("");
  const [revenueFilter, setRevenueFilter] = useState<"all" | "month" | "week">("all");
  const [languagesText, setLanguagesText] = useState((user?.languages ?? []).join(", "));
  const [revenuePeriod, setRevenuePeriod] = useState<"all" | "month">("all");
  const router = useRouter();
  const { t } = useLang();
  const items = [
    { key: "overview", label: t("sidebar_overview_guide"), icon: BarChart3 },
    { key: "visits", label: t("sidebar_visits"), icon: CalendarCheck },
    { key: "revenue", label: t("sidebar_revenue"), icon: Wallet },
    { key: "reviews", label: t("sidebar_evaluations"), icon: Star },
    { key: "messages", label: t("sidebar_messages"), icon: MessageSquare },
    { key: "profile", label: t("sidebar_profile_guide"), icon: User },
  ];

  useEffect(() => {
    if (!user || user.role !== "guide") {
      router.replace("/auth");
      return;
    }
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhone(user.phone);
    setSpecialty(user.specialty ?? "");
    setCity(user.city ?? "");
    setLanguagesText((user.languages ?? []).join(", "));

    const refreshGuideData = () => {
      Promise.all([loadSavedReservations(true), loadSavedReviews(true), loadGuides()]).then(() => {
        const guideId = user.guideId ?? (user.email.includes("mboma") ? "g11" : user.email.includes("fouda") ? "g4" : "");
        const guide = getAllGuides().find(g => g.id === guideId);
        const resolvedName = guide?.name ?? `${user.firstName} ${user.lastName}`;
        setGuideName(resolvedName);

        const reservations = getAllReservations().filter(r =>
          r.guideId === guideId || r.guideName?.toLowerCase() === resolvedName.toLowerCase()
        );
        setGuideReservations(reservations);

        const bookedKeys = new Set(reservations.map(r => `${r.userId}:${r.packId}`));
        const reviews = getAllReviews().filter(r =>
          r.guideId === guideId || (r.guideId === undefined && bookedKeys.has(`${r.userId}:${r.packId}`))
        );
        setGuideReviews(reviews);
      });
    };

    refreshGuideData();
    const interval = window.setInterval(refreshGuideData, 5000);
    return () => window.clearInterval(interval);
  }, [user, router]);

  const handleSave = () => {
    const languages = languagesText.split(",").map(v => v.trim()).filter(Boolean);
    const updated = updateProfile({ firstName, lastName, phone, specialty, city, languages });
    if (updated) { toast.success(t("profile_updated_guide")); }
  };

  const averageRating = guideReviews.length
    ? guideReviews.reduce((sum, review) => sum + review.rating, 0) / guideReviews.length
    : 0;
  const guideRevenue = guideReservations
    .filter(r => r.status !== "Annulée")
    .reduce((sum, r) => sum + Math.round(r.totalPrice * 0.15), 0);

  const visits = [
    { date: "10 juin 2026 — 09h", circuit: "Chutes de la Lobé", inscrits: 8, max: 12, status: "Confirmée" },
    { date: "13 juin 2026 — 14h", circuit: "Marché de Kribi", inscrits: 5, max: 10, status: "Confirmée" },
    { date: "20 juin 2026 — 10h", circuit: "Forêt sacrée de Grand Batanga", inscrits: 3, max: 8, status: "En attente" },
  ];

  const circuits = [
    { name: "Découverte des chutes de la Lobé", duration: "4h", price: 15000, quota: 12, status: "Actif" },
    { name: "Tour du marché et cuisine locale", duration: "3h", price: 10000, quota: 10, status: "Actif" },
    { name: "Randonnée forêt tropicale", duration: "6h", price: 25000, quota: 8, status: "Brouillon" },
  ];

  const filteredReservations = revenueFilter === "month"
    ? guideReservations.filter(r => r.createdAt.slice(0, 7) === new Date().toISOString().slice(0, 7))
    : revenueFilter === "week"
      ? guideReservations.filter(r => new Date(r.createdAt) >= new Date(new Date().setDate(new Date().getDate() - 7)))
      : guideReservations;

  const chartData = filteredReservations.map(r => {
    const amount = r.status === "Annulée" ? 0 : Math.round(r.totalPrice * 0.15);
    return { date: r.createdAt, montant: amount };
  });

  const periodReservations = revenuePeriod === "month"
    ? guideReservations.filter(r => r.createdAt.slice(0, 7) === new Date().toISOString().slice(0, 7))
    : guideReservations;
  const periodRevenue = periodReservations
    .filter(r => r.status !== "Annulée")
    .reduce((sum, r) => sum + Math.round(r.totalPrice * 0.15), 0);
  const revenueChartData = periodReservations.reduce<{ month: string; revenus: number }[]>((groups, r) => {
    const month = r.createdAt.slice(0, 7);
    const amount = r.status === "Annulée" ? 0 : Math.round(r.totalPrice * 0.15);
    const found = groups.find(g => g.month === month);
    if (found) found.revenus += amount;
    else groups.push({ month, revenus: amount });
    return groups;
  }, []).sort((a, b) => a.month.localeCompare(b.month));

  return (
    <DashboardShell
      title={`Espace Guide — ${user?.firstName ?? ""} ${user?.lastName ?? ""}`}
      items={items}
      active={active}
      onChange={setActive}
    >
      {/* ── OVERVIEW ── */}
      {active === "overview" && (
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-[#9A3412] to-[#EA580C] rounded-2xl p-6 text-white">
            <p className="text-white/60 text-sm">{t("guide_badge")}</p>
            <h2 className="text-2xl font-bold mt-1">{user?.firstName} {user?.lastName}</h2>
            <p className="text-white/70 text-sm mt-1">{user?.specialty ?? t("specialty_unknown")} — {user?.city ?? "Cameroun"}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: t("circuits_proposed"), val: String(new Set(guideReservations.map(r => r.packId)).size), color: "text-[#EA580C]" },
              { label: t("visits_this_month"), val: String(guideReservations.filter(r => r.status === "Confirmée" || r.status === "Terminée").length), color: "text-green-600" },
              { label: t("avg_rating"), val: `${averageRating ? averageRating.toFixed(1) : "—"} ⭐ (${guideReviews.length})`, color: "text-amber-600" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-6">
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                  <div className={`text-2xl font-bold ${s.color} mt-1`}>{s.val}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-5">
              <h3 className="font-bold text-[#9A3412] mb-3">{t("spoken_languages")}</h3>
              <div className="flex flex-wrap gap-2">
                {(user?.languages ?? ["Français", "Anglais"]).map((l) => (
                  <Badge key={l} className="bg-[#EA580C]/10 text-[#EA580C]">{l}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── VISITES ── */}
      {active === "visits" && (
        <div className="space-y-3">
          <h3 className="font-bold text-[#9A3412] text-lg">{t("visits_heading")}</h3>
          {guideReservations.length === 0 ? (
            <Card><CardContent className="p-5 text-sm text-muted-foreground">Aucune visite planifiée pour le moment.</CardContent></Card>
          ) : guideReservations.map((r) => (
            <Card key={r.ref}>
              <CardContent className="p-5 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="font-bold text-[#9A3412]">{r.packName}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{r.dates} • {r.ref}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold text-[#EA580C]">{r.participants} participants</div>
                  <Badge className={r.status === "Confirmée" ? "bg-green-100 text-green-700" : r.status === "Annulée" ? "bg-red-100 text-red-700" : r.status === "Terminée" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}>{r.status}</Badge>
                  {r.status === "En attente" && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={async () => { await updateReservationStatus(r.ref, "Confirmée"); setGuideReservations(prev => prev.map(v => v.ref === r.ref ? { ...v, status: "Confirmée" } : v)); toast.success("Visite confirmée"); }}>Confirmer</Button>
                  )}
                  {r.status === "Confirmée" && (
                    <Button size="sm" variant="outline" onClick={async () => { await updateReservationStatus(r.ref, "Terminée"); setGuideReservations(prev => prev.map(v => v.ref === r.ref ? { ...v, status: "Terminée" } : v)); toast.success("Visite terminée"); }}>Terminer</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── ÉVALUATIONS ── */}
      {active === "reviews" && (
        <div className="space-y-4">
          <h3 className="font-bold text-[#9A3412] text-lg">{t("reviews_received_heading")}</h3>
          {guideReviews.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              {t("no_reviews_yet")}
            </div>
          )}
          {guideReviews.map((r) => {
            const pack = getAllPacks().find(p => p.id === r.packId);
            return (
              <Card key={r.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-[#9A3412]">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{pack?.name ?? r.packId}</div>
                    </div>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((n) => (
                        <Star key={n} size={14} className={n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 italic">"{r.text}"</p>
                  <p className="text-xs text-muted-foreground mt-2">Publié le {r.createdAt}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── MESSAGES ── */}
      {active === "messages" && (
        <div className="h-[600px]">
          <DtMessenger />
        </div>
      )}

      {/* ── PROFIL ── */}
      {active === "profile" && (
        <Card>
          <CardContent className="p-6 space-y-4 max-w-xl">
            <h3 className="font-bold text-[#9A3412] text-lg">{t("profile_guide_heading")}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t("first_name_field")}</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
              <div><Label>{t("last_name_field")}</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
            </div>
            <div><Label>{t("email_field")}</Label><Input defaultValue={user?.email} disabled className="opacity-60" /></div>
            <div><Label>{t("phone_field")}</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div><Label>{t("city_zone_label")}</Label><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t("city_zone_placeholder")} /></div>
            <div><Label>{t("specialty_label")}</Label><Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder={t("specialty_placeholder")} /></div>
            <div><Label>Langues parlées (séparées par des virgules)</Label><Input value={languagesText} onChange={(e) => setLanguagesText(e.target.value)} placeholder="Français, Anglais, Bassa" /></div>
            <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={handleSave}>{t("save_changes_btn")}</Button>
          </CardContent>
        </Card>
      )}

      {/* ── REVENUS ── */}
      {active === "revenue" && (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "Revenus estimés", value: `${guideRevenue.toLocaleString()} FCFA`, color: "text-[#EA580C]" },
              { label: "Réservations prises en charge", value: String(guideReservations.length), color: "text-green-600" },
              { label: "Participants accompagnés", value: String(guideReservations.reduce((sum, r) => sum + r.participants, 0)), color: "text-blue-600" },
            ].map(k => (
              <Card key={k.label}><CardContent className="p-5">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{k.label}</div>
                <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
              </CardContent></Card>
            ))}
          </div>
          <Card><CardContent className="p-5 space-y-4">
            <div>
              <h3 className="font-bold text-[#9A3412]">Détail des revenus</h3>
              <p className="text-sm text-muted-foreground mt-1">Estimation basée sur 15% du montant total de chaque réservation prise en charge.</p>
            </div>
            {guideReservations.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Aucun paiement enregistré pour le moment.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Référence</TableHead><TableHead>Offre</TableHead><TableHead>Date</TableHead><TableHead>Participants</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Montant estimé</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {guideReservations.map(r => {
                      const amount = r.status === "Annulée" ? 0 : Math.round(r.totalPrice * 0.15);
                      return (
                        <TableRow key={r.ref}><TableCell className="font-mono text-xs">{r.ref}</TableCell><TableCell className="font-semibold">{r.packName}</TableCell><TableCell>{r.dates}</TableCell><TableCell>{r.participants}</TableCell><TableCell>{r.status}</TableCell><TableCell className="text-right font-bold">{amount.toLocaleString()} FCFA</TableCell></TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            <Button variant="outline" onClick={() => {
              const header = ["Référence", "Offre", "Date", "Participants", "Statut", "Montant estimé"];
              const rows = guideReservations.map(r => [r.ref, r.packName, r.dates, String(r.participants), r.status, String(r.status === "Annulée" ? 0 : Math.round(r.totalPrice * 0.15))]);
              const csv = [header, ...rows].map(row => row.map(value => `"${value.replace(/"/g, '""')}"`).join(",")).join("\n");
              const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = `revenus-guide-${new Date().toISOString().slice(0, 10)}.csv`;
              anchor.click();
              URL.revokeObjectURL(url);
              toast.success("Export CSV téléchargé");
            }}>
              <Download size={16} /> Exporter
            </Button>
          </CardContent></Card>
          <Card>
            <CardContent className="p-5">
              <h3 className="font-bold text-[#9A3412] mb-4">Statistiques de revenus</h3>
              <div className="flex gap-2 mb-4">
                <Button variant={revenueFilter === "all" ? "default" : "outline"} onClick={() => setRevenueFilter("all")}>Tous les temps</Button>
                <Button variant={revenueFilter === "month" ? "default" : "outline"} onClick={() => setRevenueFilter("month")}>Ce mois-ci</Button>
                <Button variant={revenueFilter === "week" ? "default" : "outline"} onClick={() => setRevenueFilter("week")}>Cette semaine</Button>
              </div>
              <div className="h-60">
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="text-muted-foreground" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} FCFA`, "Montant"]} />
                    <Bar dataKey="montant" fill="#EA580C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <h3 className="font-bold text-[#9A3412] mb-4">Statistiques des revenus par mois</h3>
              <div className="flex gap-2 mb-4">
                <Button variant={revenuePeriod === "all" ? "default" : "outline"} onClick={() => setRevenuePeriod("all")}>Tous les temps</Button>
                <Button variant={revenuePeriod === "month" ? "default" : "outline"} onClick={() => setRevenuePeriod("month")}>Ce mois-ci</Button>
              </div>
              <div className="h-60">
                <ResponsiveContainer>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="text-muted-foreground" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} FCFA`, "Revenus"]} />
                    <Bar dataKey="revenus" fill="#9A3412" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}
