"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/src/components/dt-sidebar";
import { Bus, CalendarRange, ClipboardList, User, BarChart3, MessageSquare, Plus, Trash2, CheckCircle2, AlertCircle, Camera } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import {
  loadTrips,
  getAllTrips,
  getSavedTrips,
  saveTrip,
  removeSavedTripById,
  loadVehicles,
  getAllVehicles,
  saveVehicle,
  updateVehicle,
  deleteVehicle,
  loadSavedReservations,
  getAllReservations,
  type TripData,
  type VehicleData,
  type ReservationData,
} from "@/src/lib/njangui-data";
import { useAuth } from "@/src/lib/auth-context";
import { getUserById } from "@/src/lib/auth-store";
import { toast } from "sonner";
import { useLang } from "@/src/lib/lang";
import { useRouter } from "next/navigation";
import { DtMessenger } from "@/src/components/dt-messenger";

const VEHICLE_STATUSES = ["Disponible", "En mission", "Maintenance", "Indisponible"];

function toDateKey(value: string): string {
  return (value ?? "").slice(0, 10);
}

export default function TransportDashboard() {
  const [active, setActive] = useState("overview");
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  const { t } = useLang();

  const company = user?.companyName ?? "";
  const today = new Date().toISOString().slice(0, 10);

  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [plate, setPlate] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [capacity, setCapacity] = useState("");

  const [showTripForm, setShowTripForm] = useState(false);
  const [newFrom, setNewFrom] = useState("");
  const [newTo, setNewTo] = useState("");
  const [newDate, setNewDate] = useState(today);
  const [newTime, setNewTime] = useState("");
  const [newVehicle, setNewVehicle] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const items = [
    { key: "overview", label: t("sidebar_overview_transport"), icon: BarChart3 },
    { key: "fleet", label: t("sidebar_fleet"), icon: Bus },
    { key: "planner", label: t("sidebar_planner"), icon: CalendarRange },
    { key: "reservations", label: t("sidebar_transport_reservations"), icon: ClipboardList },
    { key: "messages", label: t("sidebar_messages"), icon: MessageSquare },
    { key: "profile", label: t("sidebar_profile_transport"), icon: User },
  ];

  function refreshData() {
    setVehicles(getAllVehicles().filter((v) => v.company === company));
    setTrips(getAllTrips().filter((trip) => trip.company === company));
    setReservations(getAllReservations().filter((r) => r.transportAgency === company));
  }

  useEffect(() => {
    if (!user || user.role !== "agence-voyages") {
      router.replace("/auth");
      return;
    }
    let mounted = true;
    Promise.all([loadVehicles(), loadTrips(), loadSavedReservations()]).then(() => {
      if (!mounted) return;
      setCompanyName(user.companyName ?? "");
      setPhone(user.phone ?? "");
      setCity(user.city ?? "");
      refreshData();
      setLoading(false);
    });
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router, company]);

  const availableVehicles = vehicles.filter((v) => v.status === "Disponible");
  const upcomingTrips = trips.filter((trip) => toDateKey(trip.date) >= today);
  const expiredReservations = reservations.filter((r) => toDateKey(r.dates) < today);
  const transportRevenue = reservations.reduce(
    (sum, r) => sum + (Number(r.transportPrice) || 0),
    0,
  );
  const nextVehicleId = (() => {
    const max = vehicles.reduce((acc, v) => {
      const match = /^V-(\d+)$/.exec(v.id ?? "");
      return match ? Math.max(acc, Number(match[1])) : acc;
    }, 0);
    return `V-${String(max + 1).padStart(3, "0")}`;
  })();

  function tripStatus(trip: TripData) {
    const date = toDateKey(trip.date);
    if (date < today) return { label: t("trip_completed"), className: "bg-muted text-muted-foreground" };
    if (date === today) return { label: t("trip_ongoing"), className: "bg-orange-100 text-[#C2410C]" };
    return { label: t("trip_upcoming"), className: "bg-green-100 text-green-700" };
  }

  function passengerName(userId?: string) {
    if (!userId) return "—";
    const u = getUserById(userId);
    return u ? `${u.firstName} ${u.lastName}` : userId;
  }

  const handleSaveProfile = () => {
    const updated = updateProfile({ companyName, phone, city });
    if (updated) toast.success(t("profile_updated_transport"));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("agency", user?.companyName ?? user?.firstName ?? "agence-voyages");
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

  const handleAddVehicle = async () => {
    if (!plate.trim() || !vehicleType.trim() || !capacity || Number(capacity) <= 0) {
      return toast.error(t("fill_all_fields"));
    }
    const created = await saveVehicle({
      plate: plate.trim(),
      type: vehicleType.trim(),
      capacity: Number(capacity),
      company,
    });
    if (!created) return toast.error(t("vehicle_save_error"));
    refreshData();
    setPlate(""); setVehicleType(""); setCapacity("");
    setShowVehicleForm(false);
    toast.success(`${t("vehicle_added")} · ${created.id}`);
  };

  const handleVehicleStatus = async (id: string, status: string) => {
    const ok = await updateVehicle(id, { status });
    refreshData();
    toast[ok ? "success" : "error"](ok ? t("vehicle_status_updated") : t("vehicle_save_error"));
  };

  const handleDeleteVehicle = async (vehicle: VehicleData) => {
    const used = trips.some((trip) => trip.vehicle === vehicle.id && toDateKey(trip.date) >= today);
    if (used) return toast.error(t("vehicle_in_use"));
    if (!window.confirm(`${t("confirm_delete_vehicle")} ${vehicle.id} ?`)) return;
    const ok = await deleteVehicle(vehicle.id);
    refreshData();
    toast[ok ? "success" : "error"](ok ? t("vehicle_deleted") : t("vehicle_save_error"));
  };

  const handleAddTrip = async () => {
    if (!newFrom.trim() || !newTo.trim() || !newDate || !newTime.trim() || !newVehicle || !newPrice) {
      return toast.error(t("fill_all_fields"));
    }
    if (newFrom.trim().toLowerCase() === newTo.trim().toLowerCase()) {
      return toast.error(t("trip_same_cities"));
    }
    if (newDate < today) return toast.error(t("trip_date_past"));
    const vehicle = vehicles.find((v) => v.id === newVehicle);
    if (!vehicle || vehicle.company !== company) return toast.error(t("vehicle_required"));
    if (vehicle.status !== "Disponible") return toast.error(t("vehicle_not_available"));

    const trip: TripData = {
      id: `trip_${Date.now()}`,
      from: newFrom.trim(),
      to: newTo.trim(),
      date: newDate,
      time: newTime.trim(),
      vehicle: newVehicle,
      price: Number(newPrice) || 0,
      company,
      createdAt: new Date().toISOString(),
    };
    await saveTrip(trip);
    refreshData();
    setNewFrom(""); setNewTo(""); setNewDate(today); setNewTime(""); setNewVehicle(""); setNewPrice("");
    setShowTripForm(false);
    toast.success(t("trip_added"));
  };

  const handleDeleteTrip = async (id?: string) => {
    if (!id || !getSavedTrips().some((trip) => trip.id === id)) return;
    const ok = await removeSavedTripById(id);
    refreshData();
    toast[ok ? "success" : "error"](ok ? t("trip_deleted") : t("vehicle_save_error"));
  };

  return (
    <DashboardShell
      title={`${t("transport_badge")} — ${user?.companyName ?? user?.firstName ?? ""}`}
      items={items}
      active={active}
      onChange={setActive}
    >
      {active === "overview" && (
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-[#9A3412] to-[#EA580C] rounded-2xl p-6 text-white">
            <p className="text-white/60 text-sm">{t("transport_badge")}</p>
            <h2 className="text-2xl font-bold mt-1">{company || user?.firstName}</h2>
            <p className="text-white/70 text-sm mt-1">{user?.city ?? "Cameroun"} · {t("overview_updated")} {new Date().toLocaleDateString("fr-FR")}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t("fleet_total"), val: vehicles.length, color: "text-[#EA580C]", note: t("fleet_total_note") },
              { label: t("available_vehicles"), val: availableVehicles.length, color: "text-green-600", note: `${vehicles.length - availableVehicles.length} ${t("fleet_unavailable")}` },
              { label: t("upcoming_trips"), val: upcomingTrips.length, color: "text-amber-600", note: `${expiredReservations.length} ${t("reservation_expired")}` },
              { label: t("transport_revenue"), val: transportRevenue.toLocaleString(), color: "text-purple-600", note: t("fcfa") },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-5">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</div>
                  <div className={`text-2xl font-bold ${s.color} mt-1`}>{loading ? "…" : s.val}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{s.note}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5">
                <h3 className="font-bold mb-4">{t("fleet_distribution")}</h3>
                <div className="space-y-3">
                  {VEHICLE_STATUSES.map((status) => {
                    const count = vehicles.filter((v) => v.status === status).length;
                    const percent = vehicles.length ? Math.round((count / vehicles.length) * 100) : 0;
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-xs mb-1">
                          <span>{t(`vehicle_status_${status.toLowerCase().replace(/\s+/g, "_")}`)}</span>
                          <span className="font-semibold">{count} ({percent}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-[#EA580C] rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="font-bold mb-4">{t("overview_traceability")}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("fleet_total")}</span><span className="font-semibold">{vehicles.length}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("trips_planned_heading")}</span><span className="font-semibold">{trips.length}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("passenger_reservations_heading")}</span><span className="font-semibold">{reservations.length}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("reservation_expired")}</span><span className="font-semibold text-red-600">{expiredReservations.length}</span></div>
                  <p className="text-xs text-muted-foreground pt-2 border-t">{t("overview_coherence_note")}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {active === "fleet" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-foreground text-lg">{t("fleet_heading")}</h3>
              <p className="text-xs text-muted-foreground">{vehicles.length} {t("fleet_total_note")} · {availableVehicles.length} {t("available_vehicles").toLowerCase()}</p>
            </div>
            <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={() => setShowVehicleForm(!showVehicleForm)}>
              {showVehicleForm ? t("cancel_btn") : t("add_vehicle_btn")}
            </Button>
          </div>

          {showVehicleForm && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <h4 className="font-semibold text-sm text-[#EA580C]">{t("add_vehicle_heading")}</h4>
                <div className="grid sm:grid-cols-4 gap-3">
                  <div><Label className="text-xs">{t("plate_label")}</Label><Input placeholder="LT-123-AB" value={plate} onChange={(e) => setPlate(e.target.value)} /></div>
                  <div><Label className="text-xs">{t("vehicle_type_label")}</Label><Input placeholder="Bus 35 places" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} /></div>
                  <div><Label className="text-xs">{t("capacity_label")}</Label><Input type="number" min={1} placeholder="35" value={capacity} onChange={(e) => setCapacity(e.target.value)} /></div>
                  <div>
                    <Label className="text-xs">{t("vehicle_label")} ID</Label>
                    <Input value={nextVehicleId} disabled className="opacity-60 font-mono" />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">{t("vehicle_id_process")}</p>
                <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={handleAddVehicle}>
                  <Plus size={15} className="mr-1" /> {t("create_vehicle_btn")}
                </Button>
              </CardContent>
            </Card>
          )}

          {vehicles.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">{t("no_vehicles")}</CardContent></Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((v) => {
                const statusKey = `vehicle_status_${v.status.toLowerCase().replace(/\s+/g, "_")}`;
                return (
                  <Card key={v.id}>
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-foreground">{v.type}</h3>
                        <Badge className={v.status === "Disponible" ? "bg-green-100 text-green-700" : v.status === "Maintenance" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}>
                          {t(statusKey) !== statusKey ? t(statusKey) : v.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{t("capacity_label")} {v.capacity} {t("capacity_places")}</p>
                      <div className="text-xs text-muted-foreground mt-1 font-mono">{v.id} · {v.plate}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">{t("added_on")} {toDateKey(v.createdAt)}</div>
                      <div className="mt-3 flex gap-2">
                        <select
                          aria-label={t("status_label")}
                          className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-xs"
                          value={v.status}
                          onChange={(e) => handleVehicleStatus(v.id, e.target.value)}
                        >
                          {VEHICLE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <Button size="icon" variant="outline" className="text-red-600" onClick={() => handleDeleteVehicle(v)} aria-label={t("delete_btn")}>
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {active === "planner" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="p-5 border-b flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-foreground">{t("trips_planned_heading")} ({trips.length})</h3>
                  <p className="text-[11px] text-muted-foreground">{t("planner_traceability")}</p>
                </div>
                <Button size="sm" className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={() => setShowTripForm(!showTripForm)}>
                  {showTripForm ? t("cancel_btn") : t("new_trip_btn_short")}
                </Button>
              </div>

              {showTripForm && (
                <div className="p-5 border-b bg-orange-50/50 space-y-3">
                  <h4 className="font-semibold text-sm text-[#EA580C]">{t("add_trip_heading")}</h4>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div><Label className="text-xs">{t("departure_label")}</Label><Input placeholder="Douala" value={newFrom} onChange={(e) => setNewFrom(e.target.value)} /></div>
                    <div><Label className="text-xs">{t("arrival_label")}</Label><Input placeholder="Kribi" value={newTo} onChange={(e) => setNewTo(e.target.value)} /></div>
                    <div><Label className="text-xs">{t("date_label")}</Label><Input type="date" min={today} value={newDate} onChange={(e) => setNewDate(e.target.value)} /></div>
                    <div><Label className="text-xs">{t("time_label")}</Label><Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} /></div>
                    <div>
                      <Label className="text-xs">{t("vehicle_label")}</Label>
                      <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={newVehicle} onChange={(e) => setNewVehicle(e.target.value)}>
                        <option value="">—</option>
                        {availableVehicles.map((v) => <option key={v.id} value={v.id}>{v.id} · {v.type}</option>)}
                      </select>
                    </div>
                    <div><Label className="text-xs">{t("price_per_seat_label")}</Label><Input type="number" min={1} placeholder="5000" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} /></div>
                  </div>
                  {availableVehicles.length === 0 && <p className="text-xs text-red-600"><AlertCircle size={13} className="inline mr-1" />{t("vehicle_not_available")}</p>}
                  <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={handleAddTrip}>{t("publish_trip_btn")}</Button>
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("date_label")}</TableHead>
                    <TableHead>{t("departure_label")}</TableHead>
                    <TableHead>{t("arrival_label")}</TableHead>
                    <TableHead>{t("time_label")}</TableHead>
                    <TableHead>{t("vehicle_label")}</TableHead>
                    <TableHead>{t("price_per_seat_label")}</TableHead>
                    <TableHead>{t("table_status_transport")}</TableHead>
                    <TableHead className="text-right">{t("table_actions_admin")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">{t("no_trips")}</TableCell></TableRow>
                  ) : trips.map((trip, i) => {
                    const status = tripStatus(trip);
                    const isSaved = getSavedTrips().some((s) => s.id === trip.id);
                    return (
                      <TableRow key={trip.id ?? i} className={toDateKey(trip.date) < today ? "opacity-60" : ""}>
                        <TableCell className="font-mono text-xs">{toDateKey(trip.date)}</TableCell>
                        <TableCell className="font-semibold">{trip.from}</TableCell>
                        <TableCell>{trip.to}</TableCell>
                        <TableCell>{trip.time}</TableCell>
                        <TableCell className="font-mono text-xs">{trip.vehicle}</TableCell>
                        <TableCell className="text-[#EA580C] font-bold">{trip.price.toLocaleString()} {t("fcfa")}</TableCell>
                        <TableCell><Badge className={status.className}>{status.label}</Badge></TableCell>
                        <TableCell className="text-right">
                          {isSaved ? (
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDeleteTrip(trip.id)}>
                              <Trash2 size={14} />
                            </Button>
                          ) : <span className="text-[10px] text-muted-foreground">{t("demo_trip")}</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {active === "reservations" && (
        <Card>
          <CardContent className="p-0">
            <div className="p-5 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold text-foreground">{t("passenger_reservations_heading")}</h3>
                <p className="text-[11px] text-muted-foreground">
                  {reservations.length} {t("reservation_received")} · {expiredReservations.length} {t("reservation_expired")}
                </p>
              </div>
              <Badge className="bg-[#EA580C]/10 text-[#C2410C]">{transportRevenue.toLocaleString()} {t("fcfa")}</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table_ref_transport")}</TableHead>
                  <TableHead>{t("table_passenger")}</TableHead>
                  <TableHead>{t("table_trip")}</TableHead>
                  <TableHead>{t("table_date_transport")}</TableHead>
                  <TableHead>{t("table_status_transport")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">{t("no_reservations")}</TableCell></TableRow>
                ) : reservations.map((r) => {
                  const expired = toDateKey(r.dates) < today;
                  return (
                    <TableRow key={r.ref} className={expired ? "opacity-70" : ""}>
                      <TableCell className="font-mono text-xs">{r.ref}</TableCell>
                      <TableCell className="font-semibold">{passengerName(r.userId)}</TableCell>
                      <TableCell>{r.transportLabel ?? r.packName}</TableCell>
                      <TableCell>{toDateKey(r.dates)}</TableCell>
                      <TableCell>
                        {expired ? (
                          <div className="space-y-1">
                            <Badge className="bg-red-100 text-red-700">{t("reservation_expired")}</Badge>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1"><CheckCircle2 size={11} /> {t("trip_completed")}</div>
                          </div>
                        ) : (
                          <Badge className={r.status === "Confirmée" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>{r.status}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {active === "messages" && (
        <div className="h-[600px]">
          <DtMessenger />
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
                    {(user?.companyName?.[0] ?? user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "")}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#EA580C] text-white ring-2 ring-background">
                  <Camera size={13} />
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
              <div>
                <h3 className="font-bold text-foreground text-lg">{t("profile_transport_heading")}</h3>
                <p className="text-xs text-muted-foreground">
                  {uploadingAvatar ? t("modal_offer_uploading") : t("profile_photo_hint")}
                </p>
              </div>
            </div>
            <div><Label>{t("company_name_label_transport")}</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
            <div><Label>{t("email_field")}</Label><Input defaultValue={user?.email} disabled className="opacity-60" /></div>
            <div><Label>{t("phone_field")}</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div><Label>{t("city_label")}</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
            <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={handleSaveProfile}>{t("save_btn_transport")}</Button>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  );
}
