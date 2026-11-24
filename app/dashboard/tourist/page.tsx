"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/src/components/dt-sidebar";
import { DtMap } from "@/src/components/dt-map";
import { DtMessenger } from "@/src/components/dt-messenger";
import { Home, Calendar, MessageSquare, User, Star, Download, Map as MapIcon, FileText, X, MapPin, Clock, CheckCircle2, Building2, Wallet, Coins, Gift, CreditCard, Smartphone, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { RESERVATIONS, HOTELS_NEARBY, getAllPacks, AGENCIES, getReservationsByUser, loadSavedReservations, getReviewsByUser, getReviewsByPack, pushReview, loadSavedReviews, getTouristPoints, getWalletBalance, addMoneyToWallet, getWalletHistory, type ReviewData, type ReservationData, type PointsEntry, type WalletTransaction } from "@/src/lib/njangui-data";
import { useAuth } from "@/src/lib/auth-context";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLang } from "@/src/lib/lang";
import Link from "next/link";

const itemDefs = [
  { key: "home", labelKey: "sidebar_home", icon: Home },
  { key: "map", labelKey: "sidebar_map", icon: MapIcon },
  { key: "reservations", labelKey: "sidebar_reservations", icon: Calendar },
  { key: "invoices", labelKey: "sidebar_invoices", icon: FileText },
  { key: "wallet", labelKey: "sidebar_wallet", icon: Wallet },
  { key: "points", labelKey: "sidebar_points", icon: Gift },
  { key: "reviews", labelKey: "sidebar_reviews", icon: Star },
  { key: "messages", labelKey: "sidebar_messages", icon: MessageSquare },
  { key: "profile", labelKey: "sidebar_profile", icon: User },
];

function statusColor(s: string) {
  return {
    "Confirmée": "bg-green-100 text-green-700",
    "En attente": "bg-yellow-100 text-yellow-700",
    "Terminée": "bg-muted text-muted-foreground",
    "Annulée": "bg-red-100 text-red-700",
  }[s] ?? "";
}

export default function TouristDashboard() {
  const [active, setActive] = useState("home");
  const { user, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [stars, setStars] = useState<Record<string, number>>({ Hôtel: 0, Transport: 0, Guide: 0 });
  const [detailReservation, setDetailReservation] = useState<ReservationData | null>(null);
  const [myReviews, setMyReviews] = useState<ReviewData[]>([]);
  const [myReservations, setMyReservations] = useState<ReservationData[]>([]);
  const [reviewForm, setReviewForm] = useState<{ packId: string; rating: number; text: string } | null>(null);
  const [points, setPoints] = useState<PointsEntry[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletHistory, setWalletHistory] = useState<WalletTransaction[]>([]);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState(5000);
  const [depositMethod, setDepositMethod] = useState<"carte_bancaire" | "orange_money" | "mobile_money">("orange_money");
  const [showAgencyUpgrade, setShowAgencyUpgrade] = useState(false);
  const [agencyName, setAgencyName] = useState("");
  const router = useRouter();
  const { t } = useLang();
  const items = itemDefs.map((d) => ({ ...d, label: t(d.labelKey) }));

  const activeReservations = myReservations.filter(r => r.status === "Confirmée" || r.status === "En attente");
  const pastReservations = myReservations.filter(r => r.status === "Terminée");
  const activeCount = activeReservations.length;
  const pastCount = pastReservations.length;
  const reviewCount = myReviews.length.toString();
  const nextReservation = activeReservations[0] ?? null;
  const recentReservations = [...myReservations].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const packForReservation = (res: typeof myReservations[0]) => getAllPacks().find(p => p.id === res.packId);

  useEffect(() => {
    if (!user || user.role !== "tourist") {
      router.replace("/auth");
      return;
    }
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhone(user.phone);
    setCity(user.city ?? "");
    Promise.all([
      loadSavedReservations(),
      loadSavedReviews(),
    ]).then(() => {
      setMyReservations(getReservationsByUser(user.id));
      setMyReviews(getReviewsByUser(user.id));
      setPoints(getTouristPoints(user.id));
    });
    setWalletBalance(getWalletBalance(user.id));
    setWalletHistory(getWalletHistory(user.id));
  }, [user, router]);

  const handleSaveProfile = () => {
    const updated = updateProfile({ firstName, lastName, phone, city });
    if (updated) {
      toast.success(t("profile_updated"));
    }
  };

  return (
    <DashboardShell
      title={`${t("sidebar_overview")} — ${user?.firstName ?? ""}`}
      items={items}
      active={active}
      onChange={setActive}
    >
      {/* ── HOME ── */}
      {active === "home" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#9A3412] to-[#EA580C] rounded-2xl p-6 text-white">
            <p className="text-white/60 text-sm mb-1">{t("welcome_greeting")}</p>
            <h2 className="text-2xl font-bold">{user?.firstName} {user?.lastName}</h2>
            <p className="text-white/70 text-sm mt-1">{t("welcome_subtitle")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: t("active_reservations"), val: String(activeCount), color: "text-[#EA580C]" },
              { label: t("completed_trips"), val: String(pastCount), color: "text-green-600" },
              { label: t("reviews_given"), val: reviewCount, color: "text-amber-600" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-6">
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                  <div className={`text-3xl font-bold ${s.color} mt-1`}>{s.val}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          {recentReservations.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="font-bold text-foreground mb-3">{t("recent_reservations")}</h3>
                <div className="space-y-2">
                  {recentReservations.map((r) => {
                    const rpack = packForReservation(r);
                    return (
                      <div key={r.ref} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => setDetailReservation(r)}>
                        <img src={rpack?.image ?? "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=80&q=80"} className="w-14 h-10 rounded-lg object-cover shrink-0" alt={r.packName} />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-foreground truncate">{r.packName}</div>
                          <div className="text-xs text-muted-foreground">{r.dates}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 truncate">
                            {r.hotelName && <><span>{r.hotelName}</span>{(() => { const h = HOTELS_NEARBY.find(hx => r.hotelName && hx.name.toLowerCase() === r.hotelName.toLowerCase()); return h ? <Link href={`/hotel/${h.id}`} className="inline ml-0.5"><ExternalLink size={10} className="text-muted-foreground hover:text-[#EA580C]" /></Link> : null; })()}</>}
                            {r.hotelName && (r.transportLabel || r.transportAgency) && <span> • </span>}
                            {r.transportAgency && <span>{r.transportAgency}</span>}
                            {!r.transportAgency && r.transportLabel && <span>{r.transportLabel}</span>}
                          </div>
                          <div className="text-xs font-semibold text-[#EA580C]">{r.totalPrice.toLocaleString()} FCFA</div>
                        </div>
                        <Badge className={
                          r.status === "Confirmée" ? "bg-green-100 text-green-700" :
                          r.status === "En attente" ? "bg-yellow-100 text-yellow-700" :
                          r.status === "Terminée" ? "bg-muted text-muted-foreground" :
                          "bg-red-100 text-red-700"
                        }>{r.status}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          {/* ── UPGRADE TO AGENCY (HOME) ── */}
          <Card className="border-dashed border-[#EA580C]/40">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 size={24} className="text-[#EA580C]" />
                <div>
                  <h3 className="font-bold text-foreground">{t("upgrade_agency_title")}</h3>
                  <p className="text-sm text-muted-foreground">{t("upgrade_agency_desc")}</p>
                </div>
              </div>
              <Button className="bg-[#EA580C] hover:bg-[#C2410C] shrink-0" onClick={() => setActive("profile")}>
                {t("upgrade_agency_cta")}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── RESERVATIONS ── */}
      {active === "reservations" && (
        <Card>
          <CardContent className="p-0">
            <div className="p-5 border-b">
              <h3 className="font-bold text-foreground">{t("my_reservations_heading")}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{t("my_reservations_desc")}</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table_reference")}</TableHead>
                  <TableHead>{t("table_destination")}</TableHead>
                  <TableHead>{t("table_dates")}</TableHead>
                  <TableHead className="text-right">{t("table_amount")}</TableHead>
                  <TableHead>{t("table_status")}</TableHead>
                  <TableHead className="text-right">{t("table_actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {myReservations.map((r) => (
                  <TableRow key={r.ref}>
                    <TableCell className="font-mono text-xs">{r.ref}</TableCell>
                    <TableCell className="font-semibold">
                        {r.packName}
                        <div className="text-xs text-muted-foreground font-normal mt-0.5">
                          {r.hotelName && <><span>{r.hotelName}</span>{(() => { const h = HOTELS_NEARBY.find(hx => r.hotelName && hx.name.toLowerCase() === r.hotelName.toLowerCase()); return h ? <Link href={`/hotel/${h.id}`} className="inline ml-0.5"><ExternalLink size={10} className="text-muted-foreground hover:text-[#EA580C]" /></Link> : null; })()}</>}
                          {r.hotelName && r.transportAgency && <span> • </span>}
                          {r.transportAgency && <span>{r.transportAgency}</span>}
                          {!r.transportAgency && r.transportLabel && <span>{r.transportLabel}</span>}
                        </div>
                      </TableCell>
                    <TableCell>{r.dates}</TableCell>
                    <TableCell className="text-right font-bold">{r.totalPrice.toLocaleString()} {t("fcfa")}</TableCell>
                    <TableCell><Badge className={statusColor(r.status)}>{r.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => setDetailReservation(r)}>
                        {t("details_btn")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toast.success(t("ticket_downloaded"))}>
                        <Download size={14} className="mr-1" /> {t("ticket_btn")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── CARTE ── */}
      {active === "map" && (
        <div className="space-y-4">
          <h3 className="font-bold text-foreground text-lg">{t("map_heading")}</h3>
          <p className="text-sm text-muted-foreground">{t("map_desc_short")}</p>
          <div className="h-[500px] rounded-xl overflow-hidden border">
            <DtMap hotels={HOTELS_NEARBY} />
          </div>
        </div>
      )}

      {/* ── FACTURES ── */}
      {active === "invoices" && (
        <Card>
          <CardContent className="p-0">
            <div className="p-5 border-b">
              <h3 className="font-bold text-foreground">{t("invoices_heading")} ({myReservations.length})</h3>
              <p className="text-sm text-muted-foreground">{t("invoices_desc")}</p>
            </div>
            {myReservations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">{t("no_invoices")}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table_reference")}</TableHead>
                    <TableHead>{t("table_pack")}</TableHead>
                    <TableHead>{t("table_date")}</TableHead>
                    <TableHead>{t("table_amount")}</TableHead>
                    <TableHead>{t("table_status")}</TableHead>
                    <TableHead className="text-right">{t("table_download")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myReservations.map((r) => (
                    <TableRow key={r.ref}>
                      <TableCell className="font-mono text-xs">{r.ref}</TableCell>
                    <TableCell className="font-semibold">
                        {r.packName}
                        <div className="text-xs text-muted-foreground font-normal mt-0.5">
                          {r.hotelName && <><span>{r.hotelName}</span>{(() => { const h = HOTELS_NEARBY.find(hx => r.hotelName && hx.name.toLowerCase() === r.hotelName.toLowerCase()); return h ? <Link href={`/hotel/${h.id}`} className="inline ml-0.5"><ExternalLink size={10} className="text-muted-foreground hover:text-[#EA580C]" /></Link> : null; })()}</>}
                          {r.hotelName && (r.transportAgency || r.transportLabel) && <span> • </span>}
                          {r.transportAgency && <span>{r.transportAgency}</span>}
                          {!r.transportAgency && r.transportLabel && <span>{r.transportLabel}</span>}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(r.createdAt).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell className="font-bold">{r.totalPrice.toLocaleString()} {t("fcfa")}</TableCell>
                      <TableCell><Badge className={statusColor(r.status)}>{r.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => toast.success(`${t("invoice_downloaded")} ${r.ref}`)}>
                          <Download size={14} className="mr-1" /> {t("pdf_btn")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── PORTE MONNAIE ── */}
      {active === "wallet" && (
        <div className="space-y-5">
          {/* Solde */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Wallet className="text-[#EA580C]" size={24} />
                <div>
                  <h3 className="font-bold text-foreground text-lg">{t("wallet_heading")}</h3>
                  <p className="text-sm text-muted-foreground">{t("wallet_desc")}</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#9A3412] to-[#EA580C] rounded-2xl p-6 text-white mb-4">
                <p className="text-white/60 text-sm mb-1">{t("wallet_balance_label")}</p>
                <p className="text-4xl font-bold">{walletBalance.toLocaleString()} FCFA</p>
              </div>
              <Button className="w-full bg-[#EA580C] hover:bg-[#C2410C]" onClick={() => setShowDepositModal(true)}>
                {t("wallet_add_money")}
              </Button>
            </CardContent>
          </Card>
          {/* Historique */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-bold text-foreground mb-3">{t("wallet_history")}</h4>
              {walletHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("wallet_no_history")}</p>
              ) : (
                <div className="space-y-2">
                  {[...walletHistory].reverse().map((tx, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {tx.method === "carte_bancaire" ? <CreditCard size={18} className="text-blue-500" /> :
                         tx.method === "orange_money" ? <Smartphone size={18} className="text-orange-500" /> :
                         <Smartphone size={18} className="text-green-500" />}
                        <div>
                          <div className="font-semibold text-foreground text-sm">
                            {tx.method === "carte_bancaire" ? t("wallet_method_card") :
                             tx.method === "orange_money" ? t("wallet_method_om") :
                             t("wallet_method_momo")}
                          </div>
                          <div className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString("fr-FR")}</div>
                        </div>
                      </div>
                      <div className="text-green-600 font-bold">+{tx.amount.toLocaleString()} FCFA</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── MODAL DÉPÔT ── */}
      {showDepositModal && (() => {
        const handleDeposit = () => {
          if (!user) return;
          if (depositAmount < 500) { toast.error(t("wallet_min_amount")); return; }
          const result = addMoneyToWallet(user.id, depositAmount, depositMethod);
          if (result.error) { toast.error(result.error); return; }
          setWalletBalance(result.balance);
          setWalletHistory(getWalletHistory(user.id));
          setShowDepositModal(false);
          toast.success(t("wallet_deposit_success"));
        };
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDepositModal(false)}>
            <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
              <CardContent className="p-6 space-y-5">
                <h3 className="font-bold text-foreground text-lg">{t("wallet_deposit_title")}</h3>
                <div>
                  <Label className="mb-1.5 block">{t("wallet_amount_label")}</Label>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {[5000, 10000, 25000, 50000, 100000].map(a => (
                      <button key={a} type="button" onClick={() => setDepositAmount(a)}
                        className={`px-4 py-2 rounded-lg border text-sm font-semibold transition ${depositAmount === a ? "bg-[#EA580C] text-white border-[#EA580C]" : "bg-background text-foreground border-border hover:border-[#EA580C]"}`}
                      >{a.toLocaleString()} FCFA</button>
                    ))}
                  </div>
                  <Input type="number" value={depositAmount} onChange={e => setDepositAmount(Number(e.target.value))} min={500} className="w-full" />
                </div>
                <div>
                  <Label className="mb-1.5 block">{t("wallet_method_label")}</Label>
                  <div className="space-y-2">
                    {([
                      { value: "carte_bancaire" as const, icon: CreditCard, label: t("wallet_method_card"), color: "text-blue-500" },
                      { value: "orange_money" as const, icon: Smartphone, label: t("wallet_method_om"), color: "text-orange-500" },
                      { value: "mobile_money" as const, icon: Smartphone, label: t("wallet_method_momo"), color: "text-green-500" },
                    ]).map(m => (
                      <button key={m.value} type="button" onClick={() => setDepositMethod(m.value)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition ${depositMethod === m.value ? "border-[#EA580C] bg-[#EA580C]/5" : "border-border hover:border-[#EA580C]"}`}
                      >
                        <m.icon size={20} className={m.color} />
                        <span className="font-semibold text-foreground">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowDepositModal(false)}>{t("modal_cancel")}</Button>
                  <Button className="flex-1 bg-[#EA580C] hover:bg-[#C2410C]" onClick={handleDeposit}>{t("wallet_confirm_deposit")}</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* ── POINTS DE FIDÉLITÉ ── */}
      {active === "points" && (
        <div className="space-y-5">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Gift className="text-[#EA580C]" size={24} />
                <div>
                  <h3 className="font-bold text-foreground text-lg">{t("points_heading")}</h3>
                  <p className="text-sm text-muted-foreground">{t("points_desc")}</p>
                </div>
              </div>
              {points.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("points_empty")}</p>
              ) : (
                <div className="space-y-3">
                  {points.map((p) => (
                    <div key={p.agencyId} className="flex items-center justify-between p-4 border rounded-xl">
                      <div className="flex items-center gap-3">
                        <Coins className="text-amber-500" size={20} />
                        <div>
                          <div className="font-semibold text-foreground">{p.agencyName}</div>
                          <div className="text-xs text-muted-foreground">{t("points_per_agency")}</div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-[#EA580C]">{p.points}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h4 className="font-bold text-foreground mb-2">{t("points_info_title")}</h4>
              <p className="text-sm text-muted-foreground">{t("points_info_desc")}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── AVIS ── */}
      {active === "reviews" && (
        <div className="space-y-5">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-foreground mb-4">{t("my_reviews_heading")}</h3>
              {myReviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("no_reviews")}</p>
              ) : (
                <div className="space-y-3">
                  {myReviews.map((r) => {
                    const npack = getAllPacks().find(p => p.id === r.packId);
                    return (
                      <div key={r.id} className="p-4 border rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-foreground">{npack?.name ?? r.packId}</div>
                          <div className="flex gap-0.5">
                            {Array.from({ length: r.rating }).map((_, i) => (
                              <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground italic">"{r.text}"</p>
                        <p className="text-xs text-muted-foreground mt-2">{t("published_on")} {r.createdAt}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {pastReservations.filter(r => !myReviews.some(rev => rev.packId === r.packId)).length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-foreground mb-2">{t("trips_to_rate_heading")}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t("trips_to_rate_desc")}</p>
                <div className="space-y-2">
                  {pastReservations.filter(r => !myReviews.some(rev => rev.packId === r.packId)).map((r) => (
                    <div key={r.ref} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium text-foreground">{r.packName}</span>
                      <Button size="sm" variant="outline" onClick={() => setReviewForm({ packId: r.packId, rating: 5, text: "" })}>
                        <Star size={14} className="mr-1" /> {t("rate_btn")}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── MODAL AVIS ── */}
      {reviewForm && (() => {
        const npack = getAllPacks().find(p => p.id === reviewForm.packId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setReviewForm(null)}>
            <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-foreground text-lg">{t("modal_rate_title")} {npack?.name}</h3>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setReviewForm(prev => prev ? { ...prev, rating: n } : null)}>
                      <Star size={28} className={n <= reviewForm.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"} />
                    </button>
                  ))}
                </div>
                <textarea
                  className="w-full min-h-[100px] rounded-lg border border-border bg-background p-3 text-sm"
                  placeholder={t("modal_review_placeholder")}
                  value={reviewForm.text}
                  onChange={(e) => setReviewForm(prev => prev ? { ...prev, text: e.target.value } : null)}
                />
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setReviewForm(null)}>{t("modal_cancel")}</Button>
                  <Button
                    className="flex-1 bg-[#EA580C] hover:bg-[#C2410C]"
                    disabled={!reviewForm.text.trim()}
                    onClick={async () => {
                      if (!user) return;
                      const reservation = myReservations.find(r => r.packId === reviewForm.packId);
                      const rev: ReviewData = {
                        id: `rev_${Date.now()}`,
                        packId: reviewForm.packId,
                        userId: user.id,
                        name: `${user.firstName} ${user.lastName}`,
                        avatar: user.avatar,
                        rating: reviewForm.rating,
                        text: reviewForm.text,
                        createdAt: new Date().toISOString().split("T")[0],
                        guideId: reservation?.guideId,
                      };
                      await pushReview(rev);
                      setMyReviews(prev => [rev, ...prev]);
                      setReviewForm(null);
                      toast.success(t("review_thanks"));
                    }}
                  >
                    {t("modal_publish")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

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
            <div className="flex items-center gap-4 mb-2">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-[#EA580C]/20" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#EA580C]/10 flex items-center justify-center text-[#EA580C] text-xl font-bold">
                  {(user?.firstName[0] ?? "") + (user?.lastName[0] ?? "")}
                </div>
              )}
              <div>
                <div className="font-bold text-foreground text-lg">{user?.firstName} {user?.lastName}</div>
                <div className="text-sm text-muted-foreground">{user?.email}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t("first_name_field")}</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
              <div><Label>{t("last_name_field")}</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
            </div>
            <div><Label>{t("email_field")}</Label><Input defaultValue={user?.email} disabled className="opacity-60" /></div>
            <div><Label>{t("phone_field")}</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div><Label>{t("city_field")}</Label><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t("city_placeholder")} /></div>
            <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={handleSaveProfile}>{t("save_changes_btn")}</Button>
          </CardContent>
        </Card>
      )}

      {/* ── DEVENIR AGENCE ── */}
      {active === "profile" && (
        <Card className="mt-4">
          <CardContent className="p-6 space-y-4 max-w-xl">
            <div className="flex items-center gap-3">
              <Building2 size={24} className="text-[#EA580C]" />
              <div>
                <h3 className="font-bold text-foreground text-lg">{t("upgrade_agency_title")}</h3>
                <p className="text-sm text-muted-foreground">{t("upgrade_agency_desc")}</p>
              </div>
            </div>
            {!showAgencyUpgrade ? (
              <Button variant="outline" onClick={() => setShowAgencyUpgrade(true)}>
                {t("upgrade_agency_cta")}
              </Button>
            ) : (
              <div className="space-y-3 border-t pt-4">
                <div>
                  <Label>{t("upgrade_agency_name_label")}</Label>
                  <Input value={agencyName} onChange={e => setAgencyName(e.target.value)} placeholder={t("upgrade_agency_name_placeholder")} />
                </div>
                <div className="flex gap-3">
                  <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={() => {
                    if (!agencyName.trim()) { toast.error(t("fill_all_fields_error")); return; }
                    const updated = updateProfile({ role: "agency", companyName: agencyName.trim(), plan: "monthly", verified: true });
                    if (updated) {
                      toast.success(t("upgrade_agency_success"));
                      router.push("/dashboard/agency");
                    }
                  }}>
                    {t("upgrade_agency_confirm")}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowAgencyUpgrade(false); setAgencyName(""); }}>
                    {t("cancel_btn")}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── DÉTAIL RÉSERVATION ── */}
      {detailReservation && (() => {
        const pack = packForReservation(detailReservation);
        const agency = pack ? AGENCIES.find(a => a.id === pack.agencyId) : null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetailReservation(null)}>
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <CardContent className="p-0">
                <div className="relative">
                  <img src={pack?.image ?? "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80"} alt={detailReservation.packName} className="w-full h-52 object-cover rounded-t-xl" />
                  <button onClick={() => setDetailReservation(null)} className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60"><X size={18} /></button>
                  <div className="absolute bottom-3 left-3">
                    <Badge className={statusColor(detailReservation.status)}>{detailReservation.status}</Badge>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <span className="font-mono text-xs">{detailReservation.ref}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">{detailReservation.packName}</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {pack && <Badge className="bg-[#EA580C] text-white">{pack.category}</Badge>}
                      {pack && <Badge variant="outline"><Clock size={12} className="mr-1" />{pack.duration}</Badge>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={16} className="text-[#EA580C]" />
                      <span><span className="font-semibold">{t("modal_dates_label")}</span><br />{detailReservation.dates}</span>
                    </div>
                    {pack && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={16} className="text-[#EA580C]" />
                        <span><span className="font-semibold">{t("modal_city_label")}</span><br />{agency?.city ?? t("modal_cameroun")}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">{t("modal_description_label")}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{pack?.desc ?? t("modal_no_description")}</p>
                  </div>
                  {pack && (
                    <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-[#EA580C]">{pack.price.toLocaleString()} FCFA</div>
                      <div className="text-xs text-muted-foreground">{t("per_person")}</div>
                      {agency && (
                        <div className="ml-auto flex items-center gap-2 text-sm">
                          <Building2 size={16} className="text-[#EA580C]" />
                          <span>{agency.name}</span>
                        </div>
          )}
          {/* ── UPGRADE TO AGENCY (HOME) ── */}
          <Card className="border-dashed border-[#EA580C]/40">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 size={24} className="text-[#EA580C]" />
                <div>
                  <h3 className="font-bold text-foreground">{t("upgrade_agency_title")}</h3>
                  <p className="text-sm text-muted-foreground">{t("upgrade_agency_desc")}</p>
                </div>
              </div>
              <Button className="bg-[#EA580C] hover:bg-[#C2410C] shrink-0" onClick={() => setActive("profile")}>
                {t("upgrade_agency_cta")}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
                    {(detailReservation.hotelName || detailReservation.transportAgency || detailReservation.transportLabel) && (
                      <div className="space-y-3">
                        <h3 className="font-bold text-foreground text-sm">{t("extra_services_heading")}</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {detailReservation.hotelName && (
                            <div className="p-3 border rounded-lg">
                              <div className="text-xs text-muted-foreground mb-1">{t("summary_hotel")}</div>
                              <div className="font-semibold text-foreground flex items-center gap-1">
                                <span>{detailReservation.hotelName}</span>
                                {(() => { const h = HOTELS_NEARBY.find(hx => detailReservation.hotelName && hx.name.toLowerCase() === detailReservation.hotelName.toLowerCase()); return h ? <Link href={`/hotel/${h.id}`}><ExternalLink size={12} className="text-muted-foreground hover:text-[#EA580C]" /></Link> : null; })()}
                              </div>
                              {detailReservation.hotelPrice && (
                                <div className="text-sm text-[#EA580C] font-semibold">{detailReservation.hotelPrice.toLocaleString()} {t("fcfa")}</div>
                              )}
                            </div>
                          )}
                          {(detailReservation.transportAgency || detailReservation.transportLabel) && (
                            <div className="p-3 border rounded-lg">
                              <div className="text-xs text-muted-foreground mb-1">{t("summary_transport")}</div>
                              {detailReservation.transportAgency && (
                                <div className="font-semibold text-foreground">{detailReservation.transportAgency}</div>
                              )}
                              <div className="text-sm text-muted-foreground">{detailReservation.transportLabel}</div>
                              {detailReservation.transportPrice && (
                                <div className="text-sm text-[#EA580C] font-semibold">{detailReservation.transportPrice.toLocaleString()} {t("fcfa")}</div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between items-center p-3 bg-[#EA580C]/5 rounded-lg">
                          <span className="font-bold text-foreground">{t("total_label")}</span>
                          <span className="font-bold text-lg text-[#EA580C]">{detailReservation.totalPrice.toLocaleString()} {t("fcfa")}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" className="flex-1" onClick={() => setDetailReservation(null)}>{t("modal_close")}</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })()}
      </DashboardShell>
  );
}
