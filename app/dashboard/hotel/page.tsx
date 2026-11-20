"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/src/components/dt-sidebar";
import { BedDouble, ClipboardList, Tags, User, BarChart3, MessageSquare, Camera } from "lucide-react";
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

export default function HotelDashboard() {
  const [active, setActive] = useState("overview");
  const { user, updateProfile } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const router = useRouter();
  const { t } = useLang();
  const items = [
    { key: "overview", label: t("sidebar_overview_hotel"), icon: BarChart3 },
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

  return (
    <DashboardShell
      title={`Espace Hôtelier — ${user?.companyName ?? user?.firstName ?? "Hôtel"}`}
      items={items}
      active={active}
      onChange={setActive}
    >
      {/* ── OVERVIEW ── */}
      {active === "overview" && (
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-[#9A3412] to-[#EA580C] rounded-2xl p-6 text-white">
            <p className="text-white/60 text-sm">{t("hotel_badge")}</p>
            <h2 className="text-2xl font-bold mt-1">{user?.companyName}</h2>
            <p className="text-white/70 text-sm mt-1">{user?.city ?? "Cameroun"}</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: t("available_rooms"), val: "18", color: "text-green-600" },
              { label: t("reservations_this_month"), val: "34", color: "text-[#EA580C]" },
              { label: t("net_revenue_hotel"), val: "4.2M", color: "text-purple-600" },
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

      {/* ── CHAMBRES ── */}
      {active === "rooms" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROOMS.map((r) => (
            <Card key={r.type}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-foreground">{r.type}</h3>
                  <Badge className="bg-[#EA580C]/10 text-[#EA580C]">{r.count} {t("units_label")}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{t("capacity_label")} {r.capacity} {t("capacity_pers")}</p>
                <div className="text-2xl font-bold text-[#EA580C] mt-2">
                  {r.price.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">{t("per_night")}</span>
                </div>
                <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => toast.info(`Modifier : ${r.type}`)}>
                  {t("edit_btn_hotel")}
                </Button>
              </CardContent>
            </Card>
          ))}
          <Card className="border-dashed border-2 flex items-center justify-center min-h-[180px]">
            <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={() => toast.success(t("type_added"))}>
              {t("add_type_btn")}
            </Button>
          </Card>
        </div>
      )}

      {/* ── RÉSERVATIONS ── */}
      {active === "reservations" && (
        <Card>
          <CardContent className="p-0">
            <div className="p-5 border-b">
              <h3 className="font-bold text-foreground">{t("incoming_reservations_heading")}</h3>
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
                {[
                  { ref: "RES-H001", tourist: "Aïcha Nkomo", room: "Suite Junior", dates: "10–13 juin", amount: 255000, status: "Confirmée" },
                  { ref: "RES-H002", tourist: "Jean-Marc Beti", room: "Chambre Standard", dates: "15–17 juin", amount: 70000, status: "En attente" },
                  { ref: "RES-H003", tourist: "Sandrine Kameni", room: "Chambre Supérieure", dates: "20–25 juin", amount: 275000, status: "Confirmée" },
                ].map((r) => (
                  <TableRow key={r.ref}>
                    <TableCell className="font-mono text-xs">{r.ref}</TableCell>
                    <TableCell className="font-semibold">{r.tourist}</TableCell>
                    <TableCell>{r.room}</TableCell>
                    <TableCell>{r.dates}</TableCell>
                    <TableCell className="font-bold">{r.amount.toLocaleString()} FCFA</TableCell>
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

      {/* ── TARIFS ── */}
      {active === "pricing" && (
        <div className="space-y-4">
          <h3 className="font-bold text-foreground text-lg">{t("current_pricing_heading")}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5">
                <h4 className="font-bold mb-3">{t("pricing_current")}</h4>
                {ROOMS.map((r) => (
                  <div key={r.type} className="flex justify-between items-center py-2 border-b last:border-0">
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
