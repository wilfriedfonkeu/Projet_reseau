"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/src/components/dt-sidebar";
import { LayoutDashboard, Package, Users, DollarSign, UserPlus, Bell, MessageSquare, Settings, Sun, Moon, Globe } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { KPIS, REVENUE_DATA, PARTNERS, getAllPacks, hidePack, unhidePack, isPackHidden } from "@/src/lib/njangui-data";
import { useOffersLoader } from "@/src/hooks/use-offers-loader";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from "recharts";
import { useAuth } from "@/src/lib/auth-context";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DtMessenger } from "@/src/components/dt-messenger";
import { useLang } from "@/src/lib/lang";

const itemDefs = [
  { key: "overview", labelKey: "sidebar_overview_admin", icon: LayoutDashboard },
  { key: "packs", labelKey: "sidebar_packs_admin", icon: Package },
  { key: "partners", labelKey: "sidebar_partners_admin", icon: Users },
  { key: "finance", labelKey: "sidebar_finance_admin", icon: DollarSign },
  { key: "manual", labelKey: "sidebar_manual_admin", icon: UserPlus },
  { key: "notifications", labelKey: "sidebar_notif_admin", icon: Bell },
  { key: "messages", labelKey: "sidebar_messages", icon: MessageSquare },
  { key: "settings", labelKey: "sidebar_settings_admin", icon: Settings },
];

export default function AdminDashboard() {
  useOffersLoader();
  const [active, setActive] = useState("overview");
  const { user } = useAuth();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const { t, lang, setLang } = useLang();

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.replace("/auth");
    }
    setIsDark(document.documentElement.classList.contains("dark"));
  }, [user, router]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const items = itemDefs.map((d) => ({ ...d, label: t(d.labelKey) }));
  const allPacks = getAllPacks();
  const [, forceUpdate] = useState(0);
  return (
    <DashboardShell title={t("admin_title")} items={items} active={active} onChange={setActive}>
      {active === "overview" && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {KPIS.map((k) => (
              <Card key={k.label}><CardContent className="p-5">
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
                <LineChart data={REVENUE_DATA}>
                  <XAxis dataKey="mois" /><YAxis /><Tooltip />
                  <Line type="monotone" dataKey="revenus" stroke="#EA580C" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <h3 className="font-bold mb-3">{t("chart_reservations")}</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={REVENUE_DATA}>
                  <XAxis dataKey="mois" /><YAxis /><Tooltip />
                  <Bar dataKey="revenus" fill="#EA580C" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent></Card>
          </div>
        </div>
      )}

      {active === "packs" && (
        <Card><CardContent className="p-0">
          <div className="p-4 flex justify-between items-center border-b">
            <h3 className="font-bold">{t("packs_heading")} ({allPacks.length})</h3>
            <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={() => toast.success(t("pack_created"))}>{t("new_pack_btn")}</Button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>{t("table_name")}</TableHead><TableHead>{t("table_category_admin")}</TableHead><TableHead>{t("table_price_admin")}</TableHead><TableHead>{t("table_duration_admin")}</TableHead><TableHead className="text-right">{t("table_actions_admin")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {allPacks.map((p) => {
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
              })}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}

      {active === "partners" && (
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>{t("partners_table_name")}</TableHead><TableHead>{t("partners_table_type")}</TableHead><TableHead>{t("partners_table_city")}</TableHead><TableHead>{t("partners_table_status")}</TableHead><TableHead className="text-right">{t("partners_table_action")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {PARTNERS.map((p) => (
                <TableRow key={p.name}>
                  <TableCell className="font-semibold">{p.name}</TableCell>
                  <TableCell>{p.type}</TableCell>
                  <TableCell>{p.city}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${p.status === "Actif" ? "bg-green-500" : "bg-red-500"}`} />
                      {p.status === "Actif" ? t("partner_active") : p.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => toast.success(`${p.name} ${t("partner_toggled")}`)}>
                      {p.status === "Actif" ? t("deactivate_btn") : t("activate_btn")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}

      {active === "finance" && (
        <Card><CardContent className="p-5">
          <h3 className="font-bold mb-3">{t("finance_heading")}</h3>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-[#EA580C]/10"><div className="text-xs text-muted-foreground">{t("finance_revenue")}</div><div className="text-xl font-bold text-[#EA580C]">62.4M {t("fcfa")}</div></div>
            <div className="p-4 rounded-lg bg-[#EA580C]/10"><div className="text-xs text-muted-foreground">{t("finance_commissions")}</div><div className="text-xl font-bold text-[#EA580C]">8.1M {t("fcfa")}</div></div>
            <div className="p-4 rounded-lg bg-[#EA580C]/20"><div className="text-xs text-muted-foreground">{t("finance_to_pay")}</div><div className="text-xl font-bold">3.6M {t("fcfa")}</div></div>
          </div>
          <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={() => toast.success(t("pdf_generated_admin"))}>{t("edit_pdf_btn")}</Button>
        </CardContent></Card>
      )}

      {active === "manual" && (
        <Card><CardContent className="p-6 max-w-xl space-y-3">
          <h3 className="font-bold mb-2">{t("manual_heading")}</h3>
          <div className="grid grid-cols-2 gap-3"><div><Label>{t("manual_first_name")}</Label><Input /></div><div><Label>{t("manual_last_name")}</Label><Input /></div></div>
          <div><Label>{t("manual_phone")}</Label><Input /></div>
          <div><Label>{t("manual_pack")}</Label><Input placeholder={t("manual_pack_placeholder")} /></div>
          <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={() => toast.success(t("manual_registered"))}>{t("manual_register_btn")}</Button>
        </CardContent></Card>
      )}

      {active === "notifications" && (
        <div className="space-y-3">
          {[
            { msg: t("notif_item1"), level: "warn" },
            { msg: t("notif_item2"), level: "error" },
            { msg: t("notif_item3"), level: "info" },
          ].map((n, i) => (
            <Card key={i}><CardContent className="p-4 flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full ${n.level === "error" ? "bg-red-500" : n.level === "warn" ? "bg-yellow-500" : "bg-orange-500"}`} />
              <span>{n.msg}</span>
            </CardContent></Card>
          ))}
        </div>
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
