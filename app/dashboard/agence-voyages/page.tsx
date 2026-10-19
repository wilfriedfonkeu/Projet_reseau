"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/src/components/dt-sidebar";
import { Bus, CalendarRange, ClipboardList, User, BarChart3, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { FLEET, loadTrips, getAllTrips, saveTrip, type TripData } from "@/src/lib/njangui-data";
import { useAuth } from "@/src/lib/auth-context";
import { toast } from "sonner";
import { useLang } from "@/src/lib/lang";
import { useRouter } from "next/navigation";
import { DtMessenger } from "@/src/components/dt-messenger";

export default function TransportDashboard() {
  const [active, setActive] = useState("overview");
  const { user, updateProfile } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [trips, setTrips] = useState<TripData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newFrom, setNewFrom] = useState("");
  const [newTo, setNewTo] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newVehicle, setNewVehicle] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const router = useRouter();
  const { t } = useLang();
  const items = [
    { key: "overview", label: t("sidebar_overview_transport"), icon: BarChart3 },
    { key: "fleet", label: t("sidebar_fleet"), icon: Bus },
    { key: "planner", label: t("sidebar_planner"), icon: CalendarRange },
    { key: "reservations", label: t("sidebar_transport_reservations"), icon: ClipboardList },
    { key: "messages", label: t("sidebar_messages"), icon: MessageSquare },
    { key: "profile", label: t("sidebar_profile_transport"), icon: User },
  ];

  useEffect(() => {
    if (!user || user.role !== "agence-voyages") {
      router.replace("/auth");
      return;
    }
    setCompanyName(user.companyName ?? "");
    setPhone(user.phone);
    setCity(user.city ?? "");
    loadTrips().then(() => setTrips(getAllTrips()));
  }, [user, router]);

  const handleSave = () => {
    const updated = updateProfile({ companyName, phone, city });
    if (updated) { toast.success(t("profile_updated_transport")); }
  };

  const addTrip = async () => {
    if (!newFrom || !newTo || !newTime || !newVehicle || !newPrice) {
      return toast.error(t("fill_all_fields"));
    }
    const trip = { from: newFrom, to: newTo, time: newTime, vehicle: newVehicle, price: parseInt(newPrice) || 0, company: user?.companyName ?? "Agence de voyages" };
    await saveTrip(trip);
    setTrips(getAllTrips());
    setNewFrom(""); setNewTo(""); setNewTime(""); setNewVehicle(""); setNewPrice("");
    setShowForm(false);
    toast.success(t("trip_added"));
  };

  return (
    <DashboardShell
      title={`Espace Agence de voyages — ${user?.companyName ?? user?.firstName ?? ""}`}
      items={items}
      active={active}
      onChange={setActive}
    >
      {/* ── OVERVIEW ── */}
      {active === "overview" && (
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-[#9A3412] to-[#EA580C] rounded-2xl p-6 text-white">
            <p className="text-white/60 text-sm">{t("transport_badge")}</p>
            <h2 className="text-2xl font-bold mt-1">{user?.companyName}</h2>
            <p className="text-white/70 text-sm mt-1">{user?.city ?? "Cameroun"}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t("available_vehicles"), val: "3", color: "text-green-600" },
              { label: t("active_trips"), val: "4", color: "text-[#EA580C]" },
              { label: t("reservations_this_month_transport"), val: "87", color: "text-amber-600" },
              { label: t("net_revenue_transport"), val: "1.8M", color: "text-purple-600" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-5">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</div>
                  <div className={`text-2xl font-bold ${s.color} mt-1`}>{s.val}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── FLOTTE ── */}
      {active === "fleet" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-foreground text-lg">{t("fleet_heading")}</h3>
            <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={() => toast.success(t("vehicle_added"))}>
              {t("add_vehicle_btn")}
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FLEET.map((v) => (
              <Card key={v.id}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-foreground">{v.type}</h3>
                    <Badge className={v.status === "Disponible" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                      {v.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{t("capacity_label")} {v.capacity} {t("capacity_places")}</p>
                  <div className="text-xs text-muted-foreground mt-1 font-mono">ID : {v.id}</div>
                  <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => toast.info(`Modifier ${v.id}`)}>
                    {t("edit_btn_transport")}
                  </Button>
                </CardContent>
              </Card>
            ))}
            <Card className="border-dashed border-2 flex items-center justify-center min-h-[160px]">
              <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={() => toast.success("Nouveau véhicule ajouté")}>
                + Nouveau
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* ── TRAJETS ── */}
      {active === "planner" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="p-5 border-b flex justify-between items-center">
                <h3 className="font-bold text-foreground">{t("trips_planned_heading")} ({trips.length})</h3>
                <Button size="sm" className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={() => setShowForm(!showForm)}>
                  {showForm ? t("cancel_btn") : t("new_trip_btn_short")}
                </Button>
              </div>

              {showForm && (
                <div className="p-5 border-b bg-orange-50/50 space-y-3">
                  <h4 className="font-semibold text-sm text-[#EA580C]">{t("add_trip_heading")}</h4>
                  <div className="grid sm:grid-cols-5 gap-3">
                    <div><Label className="text-xs">{t("departure_label")}</Label><Input placeholder="Douala" value={newFrom} onChange={e => setNewFrom(e.target.value)} /></div>
                    <div><Label className="text-xs">{t("arrival_label")}</Label><Input placeholder="Kribi" value={newTo} onChange={e => setNewTo(e.target.value)} /></div>
                    <div><Label className="text-xs">{t("time_label")}</Label><Input placeholder="07h00" value={newTime} onChange={e => setNewTime(e.target.value)} /></div>
                    <div><Label className="text-xs">{t("vehicle_label")}</Label><Input placeholder="V-005" value={newVehicle} onChange={e => setNewVehicle(e.target.value)} /></div>
                    <div><Label className="text-xs">{t("price_per_seat_label")}</Label><Input type="number" placeholder="5000" value={newPrice} onChange={e => setNewPrice(e.target.value)} /></div>
                  </div>
                  <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={addTrip}>{t("publish_trip_btn")}</Button>
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Départ</TableHead>
                    <TableHead>Arrivée</TableHead>
                    <TableHead>Heure</TableHead>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Prix/place</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.map((t, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-semibold">{t.from}</TableCell>
                      <TableCell>{t.to}</TableCell>
                      <TableCell>{t.time}</TableCell>
                      <TableCell className="font-mono text-xs">{t.vehicle}</TableCell>
                      <TableCell className="text-[#EA580C] font-bold">{t.price.toLocaleString()} FCFA</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── RÉSERVATIONS ── */}
      {active === "reservations" && (
        <Card>
          <CardContent className="p-0">
            <div className="p-5 border-b">
              <h3 className="font-bold text-foreground">{t("passenger_reservations_heading")}</h3>
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
                {[
                  { ref: "TR-001", passenger: "Aïcha Nkomo", trip: "Douala → Kribi", date: "10 juin 2026", status: "Confirmée" },
                  { ref: "TR-002", passenger: "Jean-Marc Beti", trip: "Yaoundé → Bafoussam", date: "12 juin 2026", status: "En attente" },
                  { ref: "TR-003", passenger: "Sandrine Kameni", trip: "Douala → Limbe", date: "15 juin 2026", status: "Confirmée" },
                ].map((r) => (
                  <TableRow key={r.ref}>
                    <TableCell className="font-mono text-xs">{r.ref}</TableCell>
                    <TableCell className="font-semibold">{r.passenger}</TableCell>
                    <TableCell>{r.trip}</TableCell>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>
                      <Badge className={r.status === "Confirmée" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
            <h3 className="font-bold text-foreground text-lg">{t("profile_transport_heading")}</h3>
            <div><Label>{t("company_name_label_transport")}</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
            <div><Label>{t("email_field")}</Label><Input defaultValue={user?.email} disabled className="opacity-60" /></div>
            <div><Label>{t("phone_field")}</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div><Label>{t("city_label")}</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
            <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={handleSave}>{t("save_btn_transport")}</Button>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  );
}
