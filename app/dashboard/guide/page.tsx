"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/src/components/dt-sidebar";
import { Map, CalendarCheck, Star, User, BarChart3, MessageSquare } from "lucide-react";
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

export default function GuideDashboard() {
  const [active, setActive] = useState("overview");
  const { user, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [specialty, setSpecialty] = useState(user?.specialty ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const router = useRouter();
  const { t } = useLang();
  const items = [
    { key: "overview", label: t("sidebar_overview_guide"), icon: BarChart3 },
    { key: "visits", label: t("sidebar_visits"), icon: CalendarCheck },
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
  }, [user, router]);

  const handleSave = () => {
    const updated = updateProfile({ firstName, lastName, phone, specialty, city });
    if (updated) { toast.success(t("profile_updated_guide")); }
  };

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
              { label: t("circuits_proposed"), val: "3", color: "text-[#EA580C]" },
              { label: t("visits_this_month"), val: "16", color: "text-green-600" },
              { label: t("avg_rating"), val: "4.8 ⭐", color: "text-amber-600" },
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
          {visits.map((v, i) => (
            <Card key={i}>
              <CardContent className="p-5 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="font-bold text-[#9A3412]">{v.circuit}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{v.date}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold text-[#EA580C]">
                    {v.inscrits}/{v.max} {t("registered_attendees")}
                  </div>
                  <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#EA580C] rounded-full"
                      style={{ width: `${(v.inscrits / v.max) * 100}%` }}
                    />
                  </div>
                  <Badge className={v.status === "Confirmée" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                    {v.status}
                  </Badge>
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
          {[
            { tourist: "Aïcha Nkomo", circuit: "Chutes de la Lobé", rating: 5, comment: "Paul est un guide exceptionnel, très passionné et pédagogue !" },
            { tourist: "Jean-Marc Beti", circuit: "Forêt tropicale", rating: 4, comment: "Très bonne expérience, paysages magnifiques. Je recommande." },
            { tourist: "Sandrine Kameni", circuit: "Marché local", rating: 5, comment: "Découverte culturelle enrichissante, excellent guide." },
          ].map((r, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-[#9A3412]">{r.tourist}</div>
                    <div className="text-xs text-muted-foreground">{r.circuit}</div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((n) => (
                      <Star key={n} size={14} className={n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2 italic">"{r.comment}"</p>
              </CardContent>
            </Card>
          ))}
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
            <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={handleSave}>{t("save_changes_btn")}</Button>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  );
}
