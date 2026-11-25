"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardShell } from "@/src/components/dt-sidebar";
import { BedDouble, ClipboardList, Tags, User, BarChart3, MessageSquare, Camera, Wallet, X } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { ROOMS } from "@/src/lib/njangui-data";
import { useAuth } from "@/src/lib/auth-context";
import { toast } from "sonner";
import { useLang } from "@/src/lib/lang";
import { useRouter } from "next/navigation";
import { DtMessenger } from "@/src/components/dt-messenger";

type ReservationStatus = "confirmed" | "pending" | "expired";

type Reservation = {
  ref: string;
  tourist: string;
  room: string;
  dates: string;
  month: number; // 1-12, sert au graphique du revenu
  amount: number;
  status: ReservationStatus;
};

type Room = { type: string; capacity: number; price: number; count: number };

const RESERVATIONS: Reservation[] = [
  { ref: "RES-H001", tourist: "Aïcha Nkomo", room: "Suite Junior", dates: "10–13 juin", month: 6, amount: 255000, status: "confirmed" },
  { ref: "RES-H002", tourist: "Jean-Marc Beti", room: "Chambre Standard", dates: "15–17 juin", month: 6, amount: 70000, status: "pending" },
  { ref: "RES-H003", tourist: "Sandrine Kameni", room: "Chambre Supérieure", dates: "20–25 juin", month: 6, amount: 275000, status: "confirmed" },
  { ref: "RES-H004", tourist: "Paul Etoundi", room: "Chambre Standard", dates: "2–4 mai", month: 5, amount: 70000, status: "expired" },
  { ref: "RES-H005", tourist: "Carine Mbella", room: "Suite Présidentielle", dates: "12–15 mai", month: 5, amount: 450000, status: "confirmed" },
  { ref: "RES-H006", tourist: "Habib Oumarou", room: "Chambre Supérieure", dates: "18–20 avril", month: 4, amount: 110000, status: "confirmed" },
  { ref: "RES-H007", tourist: "Linda Fotso", room: "Suite Junior", dates: "5–8 avril", month: 4, amount: 255000, status: "expired" },
];

const STATUS_STYLE: Record<ReservationStatus, string> = {
  confirmed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  expired: "bg-red-100 text-red-700",
};

const STATUS_KEY: Record<ReservationStatus, string> = {
  confirmed: "status_confirmed",
  pending: "status_pending",
  expired: "status_expired",
};

const EMPTY_FORM = { type: "", capacity: "", price: "", count: "" };

export default function HotelDashboard() {
  const [active, setActive] = useState("overview");
  const { user, updateProfile } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [rooms, setRooms] = useState<Room[]>(ROOMS.map((r) => ({ ...r })));
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [roomForm, setRoomForm] = useState(EMPTY_FORM);
  const [statusFilter, setStatusFilter] = useState<"all" | ReservationStatus>("all");
  const router = useRouter();
  const { t, lang } = useLang();
  const items = [
    { key: "overview", label: t("sidebar_overview_hotel"), icon: BarChart3 },
    { key: "revenue", label: t("sidebar_revenue_hotel"), icon: Wallet },
    { key: "rooms", label: t("sidebar_rooms"), icon: BedDouble },
    { key: "reservations", label: t("sidebar_hotel_reservations"), icon: ClipboardList },
    { key: "pricing", label: t("sidebar_pricing"), icon: Tags },
    { key: "messages", label: t("sidebar_messages"), icon: MessageSquare },
    { key: "profile", label: t("sidebar_profile_hotel"), icon: User },
  ];

  useEffect(() => {
    if (!user || user.role !== "hotel") {
      router.replace("/auth");
      return;
    }
    setCompanyName(user.companyName ?? "");
    setPhone(user.phone);
    setCity(user.city ?? "");
  }, [user, router]);

  // Ferme la fenêtre de modification avec la touche Échap
  useEffect(() => {
    if (!roomModalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeRoomModal(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [roomModalOpen]);

  // ── Chiffres calculés à partir des réservations ──
  const stats = useMemo(() => {
    const sum = (s: ReservationStatus) =>
      RESERVATIONS.filter((r) => r.status === s).reduce((acc, r) => acc + r.amount, 0);
    const count = (s: ReservationStatus) => RESERVATIONS.filter((r) => r.status === s).length;

    const byMonth = new Map<number, number>();
    const byRoom = new Map<string, number>();
    RESERVATIONS.filter((r) => r.status === "confirmed").forEach((r) => {
      byMonth.set(r.month, (byMonth.get(r.month) ?? 0) + r.amount);
      byRoom.set(r.room, (byRoom.get(r.room) ?? 0) + r.amount);
    });

    return {
      confirmedAmount: sum("confirmed"),
      pendingAmount: sum("pending"),
      expiredAmount: sum("expired"),
      confirmedCount: count("confirmed"),
      pendingCount: count("pending"),
      expiredCount: count("expired"),
      months: Array.from(byMonth.entries()).sort((a, b) => a[0] - b[0]),
      rooms: Array.from(byRoom.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, []);

  const totalUnits = rooms.reduce((acc, r) => acc + r.count, 0);
  const monthLabel = (m: number) =>
    new Date(2026, m - 1, 1).toLocaleString(lang === "fr" ? "fr-FR" : "en-GB", { month: "short" });
  const filteredReservations = RESERVATIONS.filter((r) => statusFilter === "all" || r.status === statusFilter);

  // ── Modification / ajout d'un type de chambre ──
  const openAddRoom = () => {
    setEditingIndex(null);
    setRoomForm(EMPTY_FORM);
    setRoomModalOpen(true);
  };

  const openEditRoom = (index: number) => {
    const r = rooms[index];
    setEditingIndex(index);
    setRoomForm({ type: r.type, capacity: String(r.capacity), price: String(r.price), count: String(r.count) });
    setRoomModalOpen(true);
  };

  function closeRoomModal() {
    setRoomModalOpen(false);
    setEditingIndex(null);
  }

  const handleSaveRoom = () => {
    const capacity = Number(roomForm.capacity);
    const price = Number(roomForm.price);
    const count = Number(roomForm.count);
    const valid =
      roomForm.type.trim() !== "" &&
      Number.isInteger(capacity) && capacity >= 1 &&
      Number.isFinite(price) && price >= 0 &&
      Number.isInteger(count) && count >= 0;
    if (!valid) {
      toast.error(t("room_form_invalid"));
      return;
    }
    const next: Room = { type: roomForm.type.trim(), capacity, price, count };
    if (editingIndex === null) {
      setRooms((prev) => [...prev, next]);
      toast.success(t("type_added"));
    } else {
      setRooms((prev) => prev.map((r, i) => (i === editingIndex ? next : r)));
      toast.success(t("room_updated"));
    }
    closeRoomModal();
  };

  const handleSave = () => {
    const updated = updateProfile({ companyName, phone, city });
    if (updated) { toast.success(t("profile_updated_hotel")); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("agency", user?.companyName ?? user?.firstName ?? "hotel");
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

  const statusBadge = (s: ReservationStatus) => (
    <Badge className={STATUS_STYLE[s]}>{t(STATUS_KEY[s])}</Badge>
  );

  const maxMonth = Math.max(1, ...stats.months.map(([, v]) => v));
  const maxRoom = Math.max(1, ...stats.rooms.map(([, v]) => v));
  const totalRes = RESERVATIONS.length;

  return (
    <DashboardShell
      title={`Espace Hôtelier — ${user?.companyName ?? user?.firstName ?? "Hôtel"}`}
      items={items}
      active={active}
      onChange={setActive}
    >
      {/* ── TABLEAU DE BORD ── */}
      {active === "overview" && (
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-[#9A3412] to-[#EA580C] rounded-2xl p-6 text-white">
            <p className="text-white/60 text-sm">{t("hotel_badge")}</p>
            <h2 className="text-2xl font-bold mt-1">{user?.companyName}</h2>
            <p className="text-white/70 text-sm mt-1">{user?.city ?? "Cameroun"}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t("hotel_total_rooms"), val: String(totalUnits), color: "text-green-600" },
              { label: t("hotel_confirmed_count"), val: String(stats.confirmedCount), color: "text-[#EA580C]" },
              { label: t("hotel_pending_count"), val: String(stats.pendingCount), color: "text-yellow-600" },
              { label: t("net_revenue_hotel"), val: stats.confirmedAmount.toLocaleString(), color: "text-purple-600" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-5">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</div>
                  <div className={`text-2xl font-bold ${s.color} mt-1`}>{s.val}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold text-foreground">{t("hotel_status_split")}</h3>
                {(["confirmed", "pending", "expired"] as ReservationStatus[]).map((s) => {
                  const n = s === "confirmed" ? stats.confirmedCount : s === "pending" ? stats.pendingCount : stats.expiredCount;
                  const bar = s === "confirmed" ? "bg-green-500" : s === "pending" ? "bg-yellow-500" : "bg-red-500";
                  return (
                    <div key={s}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{t(STATUS_KEY[s])}</span>
                        <span className="font-semibold">{n}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${bar}`} style={{ width: `${(n / totalRes) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="font-bold text-foreground mb-3">{t("hotel_latest_reservations")}</h3>
                <ul>
                  {RESERVATIONS.slice(0, 4).map((r) => (
                    <li key={r.ref} className="flex items-center justify-between gap-3 py-2 border-b last:border-0">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{r.tourist}</div>
                        <div className="text-xs text-muted-foreground truncate">{r.room} · {r.dates}</div>
                      </div>
                      {statusBadge(r.status)}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── REVENU ── */}
      {active === "revenue" && (
        <div className="space-y-5">
          <h3 className="font-bold text-foreground text-lg">{t("hotel_revenue_heading")}</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: t("revenue_confirmed"), val: stats.confirmedAmount, color: "text-green-600" },
              { label: t("revenue_pending"), val: stats.pendingAmount, color: "text-yellow-600" },
              { label: t("revenue_lost"), val: stats.expiredAmount, color: "text-red-600" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-5">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</div>
                  <div className={`text-2xl font-bold ${s.color} mt-1`}>
                    {s.val.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">FCFA</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5">
                <h4 className="font-bold mb-4">{t("revenue_monthly")}</h4>
                {stats.months.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("revenue_no_data")}</p>
                ) : (
                  <div className="flex items-end gap-4 h-48">
                    {stats.months.map(([m, v]) => (
                      <div key={m} className="flex-1 flex flex-col items-center justify-end h-full">
                        <span className="text-xs font-semibold mb-1">{v.toLocaleString()}</span>
                        <div className="w-full rounded-t-md bg-[#EA580C]" style={{ height: `${(v / maxMonth) * 75}%` }} />
                        <span className="text-xs text-muted-foreground mt-2 capitalize">{monthLabel(m)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-4">
                <h4 className="font-bold">{t("revenue_by_room")}</h4>
                {stats.rooms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("revenue_no_data")}</p>
                ) : (
                  stats.rooms.map(([room, v]) => (
                    <div key={room}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{room}</span>
                        <span className="font-semibold">{v.toLocaleString()} FCFA</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-[#EA580C]" style={{ width: `${(v / maxRoom) * 100}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── CHAMBRES ── */}
      {active === "rooms" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((r, i) => (
            <Card key={`${r.type}-${i}`}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-foreground">{r.type}</h3>
                  <Badge className="bg-[#EA580C]/10 text-[#EA580C]">{r.count} {t("units_label")}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{t("capacity_label")} {r.capacity} {t("capacity_pers")}</p>
                <div className="text-2xl font-bold text-[#EA580C] mt-2">
                  {r.price.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">{t("per_night")}</span>
                </div>
                <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => openEditRoom(i)}>
                  {t("edit_btn_hotel")}
                </Button>
              </CardContent>
            </Card>
          ))}
          <Card className="border-dashed border-2 flex items-center justify-center min-h-[180px]">
            <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={openAddRoom}>
              {t("add_type_btn")}
            </Button>
          </Card>
        </div>
      )}

      {roomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeRoomModal}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={editingIndex === null ? t("room_modal_add_title") : t("room_modal_edit_title")}
            className="w-full max-w-md rounded-xl bg-background border shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="font-bold text-foreground">
                {editingIndex === null ? t("room_modal_add_title") : t("room_modal_edit_title")}
              </h4>
              <Button size="icon" variant="ghost" aria-label={t("room_modal_close")} onClick={closeRoomModal}>
                <X size={16} />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <Label htmlFor="room-type">{t("room_name_field")}</Label>
                <Input id="room-type" autoFocus value={roomForm.type} onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="room-capacity">{t("room_capacity_field")}</Label>
                  <Input id="room-capacity" type="number" min={1} value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="room-count">{t("room_count_field")}</Label>
                  <Input id="room-count" type="number" min={0} value={roomForm.count} onChange={(e) => setRoomForm({ ...roomForm, count: e.target.value })} />
                </div>
              </div>
              <div>
                <Label htmlFor="room-price">{t("room_price_field")}</Label>
                <Input id="room-price" type="number" min={0} step={1000} value={roomForm.price} onChange={(e) => setRoomForm({ ...roomForm, price: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <Button variant="outline" onClick={closeRoomModal}>{t("room_modal_cancel")}</Button>
              <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={handleSaveRoom}>{t("save_btn_hotel")}</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── RÉSERVATIONS ── */}
      {active === "reservations" && (
        <Card>
          <CardContent className="p-0">
            <div className="p-5 border-b space-y-3">
              <h3 className="font-bold text-foreground">{t("incoming_reservations_heading")}</h3>
              <div className="flex flex-wrap gap-2">
                {(["all", "confirmed", "pending", "expired"] as const).map((f) => (
                  <Button
                    key={f}
                    size="sm"
                    variant={statusFilter === f ? "default" : "outline"}
                    className={statusFilter === f ? "bg-[#EA580C] hover:bg-[#C2410C]" : ""}
                    aria-pressed={statusFilter === f}
                    onClick={() => setStatusFilter(f)}
                  >
                    {f === "all" ? t("hotel_filter_all") : t(STATUS_KEY[f])}
                  </Button>
                ))}
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table_ref_hotel")}</TableHead>
                  <TableHead>{t("table_tourist_hotel")}</TableHead>
                  <TableHead>{t("table_room")}</TableHead>
                  <TableHead>{t("table_dates_hotel")}</TableHead>
                  <TableHead>{t("table_amount_hotel")}</TableHead>
                  <TableHead>{t("table_status_hotel")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                      {t("hotel_no_reservations")}
                    </TableCell>
                  </TableRow>
                )}
                {filteredReservations.map((r) => (
                  <TableRow key={r.ref}>
                    <TableCell className="font-mono text-xs">{r.ref}</TableCell>
                    <TableCell className="font-semibold">{r.tourist}</TableCell>
                    <TableCell>{r.room}</TableCell>
                    <TableCell>{r.dates}</TableCell>
                    <TableCell className={`font-bold ${r.status === "expired" ? "line-through text-muted-foreground" : ""}`}>
                      {r.amount.toLocaleString()} FCFA
                    </TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── TARIFS ── */}
      {active === "pricing" && (
        <div className="space-y-4">
          <h3 className="font-bold text-foreground text-lg">{t("current_pricing_heading")}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5">
                <h4 className="font-bold mb-3">{t("pricing_current")}</h4>
                {rooms.map((r, i) => (
                  <div key={`${r.type}-${i}`} className="flex justify-between items-center py-2 border-b last:border-0">
                    <span className="text-sm">{r.type}</span>
                    <span className="font-bold text-[#EA580C]">{r.price.toLocaleString()} FCFA/nuit</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h4 className="font-bold mb-3">{t("seasonal_adjustments")}</h4>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                    <div className="text-sm font-semibold text-red-700">{t("seasonal_high")}</div>
                    <div className="text-2xl font-bold text-red-700">+30%</div>
                  </div>
                  <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                    <div className="text-sm font-semibold text-orange-700">{t("seasonal_low")}</div>
                    <div className="text-2xl font-bold text-orange-700">-15%</div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => toast.success(t("prices_updated"))}>
                    {t("edit_adjustments")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
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
            <div className="flex items-center gap-4 mb-2">
              <label className="relative shrink-0 cursor-pointer" title={t("profile_photo_hint")}>
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="h-16 w-16 rounded-full object-cover border-2 border-[#EA580C]/20" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-[#EA580C]/10 flex items-center justify-center text-[#EA580C] text-xl font-bold">
                    {(user?.companyName?.[0] ?? user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "")}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#EA580C] text-white ring-2 ring-background">
                  <Camera size={13} />
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
              <div>
                <h3 className="font-bold text-foreground text-lg">{t("profile_hotel_heading")}</h3>
                <p className="text-xs text-muted-foreground">
                  {uploadingAvatar ? t("modal_offer_uploading") : t("profile_photo_hint")}
                </p>
              </div>
            </div>
            <div><Label>{t("hotel_name_label")}</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
            <div><Label>{t("email_field")}</Label><Input defaultValue={user?.email} disabled className="opacity-60" /></div>
            <div><Label>{t("phone_field")}</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div><Label>{t("city_label")}</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
            <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={handleSave}>{t("save_btn_hotel")}</Button>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  );
}
