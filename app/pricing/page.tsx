"use client";

import { useRouter } from "next/navigation";
import { DtNavbar, DtFooter } from "@/src/components/dt-navbar";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { CheckCircle2, Building2, Mail, CreditCard, BarChart3 } from "lucide-react";
import { SUBSCRIPTION_PLANS, COMMISSION_RATE } from "@/src/lib/njangui-data";
import { toast } from "sonner";
import { useLang } from "@/src/lib/lang";

export default function PricingPage() {
  const router = useRouter();
  const { t } = useLang();

  return (
    <div style={{ fontFamily: "Nunito, sans-serif" }} className="bg-background">
      <DtNavbar />

      <section className="relative overflow-hidden text-white py-16">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=2000" alt="Voyage" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#9A3412]/50 via-[#9A3412]/40 to-[#EA580C]/50" />
        </div>
        <div className="relative max-w-4xl mx-auto px-5 text-center">
          <Badge className="bg-white text-[#EA580C] hover:bg-white mb-4">{t("partner_badge")}</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t("pricing_hero_title")} <em className="not-italic">Njangui</em>
          </h1>
          <p className="text-white/90 text-lg">
            {t("pricing_hero_desc")}
            {t("pricing_hero_commission")} {(COMMISSION_RATE * 100).toFixed(0)}% sur chaque paiement touriste.
          </p>
        </div>
      </section>

      {/* Étapes */}
      <section className="max-w-6xl mx-auto px-5 py-12">
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { icon: Building2, t: t("step1_title"), d: t("step1_desc") },
            { icon: Mail, t: t("step2_title"), d: t("step2_desc") },
            { icon: CreditCard, t: t("step3_title"), d: t("step3_desc") },
            { icon: BarChart3, t: t("step4_title"), d: t("step4_desc") },
          ].map((s) => (
            <Card key={s.t}><CardContent className="p-5 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#EA580C]/10 text-[#EA580C] flex items-center justify-center mb-3"><s.icon size={22} /></div>
              <div className="font-bold text-foreground">{s.t}</div>
              <p className="text-sm text-muted-foreground mt-1">{s.d}</p>
            </CardContent></Card>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section className="max-w-6xl mx-auto px-5 pb-16">
        <h2 className="text-3xl font-bold text-center mb-2 text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          {t("plans_title")} <span className="text-[#EA580C]">{t("plans_highlight")}</span>
        </h2>
        <p className="text-center text-muted-foreground mb-10">
          {t("plans_desc")}
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {SUBSCRIPTION_PLANS.map((p) => (
            <Card key={p.id} className={`relative ${p.popular ? "border-2 border-[#EA580C] shadow-2xl scale-[1.02]" : ""}`}>
              {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#EA580C] text-white text-xs font-bold px-3 py-1 rounded-full">{t("recommended")}</div>}
              <CardContent className="p-7 text-center">
                <h3 className="font-bold text-xl text-foreground">{p.label}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-[#EA580C]">{p.price.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground"> {t("fcfa")}</span>
                  <div className="text-xs text-muted-foreground">{t("per_label")} {p.period}</div>
                </div>
                {p.save && <Badge className="bg-[#EA580C]/10 text-[#EA580C] mt-3">{t("save_label")} {p.save}</Badge>}
                <ul className="text-sm text-left mt-5 space-y-2.5">
                  <li className="flex gap-2"><CheckCircle2 size={16} className="text-[#EA580C] shrink-0 mt-0.5" /> <strong>{p.publications}</strong> {t("publications_count")}</li>
                  <li className="flex gap-2"><CheckCircle2 size={16} className="text-[#EA580C] shrink-0 mt-0.5" /> {t("dedicated_page")}</li>
                  <li className="flex gap-2"><CheckCircle2 size={16} className="text-[#EA580C] shrink-0 mt-0.5" /> {t("realtime_stats")}</li>
                  <li className="flex gap-2"><CheckCircle2 size={16} className="text-[#EA580C] shrink-0 mt-0.5" /> {t("net_payout")}</li>
                  <li className="flex gap-2"><CheckCircle2 size={16} className="text-[#EA580C] shrink-0 mt-0.5" /> {p.popular ? t("support_priority") : t("support_standard")}</li>
                </ul>
                <Button
                  className="w-full mt-6 bg-[#EA580C] hover:bg-[#C2410C] text-white"
                  onClick={() => {
                    toast.success(`${t("plan_selected")}`, { description: t("register_agency_continue") });
                    setTimeout(() => router.push("/auth?tab=signup&role=agency"), 600);
                  }}
                >
                  {t("choose_plan")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          {t("commission_note")} {(COMMISSION_RATE * 100).toFixed(0)}% est retenue sur chaque paiement touriste effectué via votre agence et reversée à l'hébergeur Njangui.
        </p>
      </section>

      <DtFooter />
    </div>
  );
}
