"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { toast } from "sonner";
import { ArrowRight, Mail, Lock, User, Phone, Building2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { ROLE_REDIRECT, type UserRole, DEMO_ACCOUNTS } from "@/src/lib/auth-store";
import { useAuth } from "@/src/lib/auth-context";
import { useLang } from "@/src/lib/lang";

// Comptes de démo à afficher
const QUICK_LOGINS = [
  { labelKey: "quick_login_tourist", email: "aicha@njangui.cm", password: "password123" },
  { labelKey: "quick_login_guide", email: "guide.mboma@njangui.cm", password: "password123" },
  { labelKey: "quick_login_agency", email: "evasion@njangui.cm", password: "password123" },
  { labelKey: "quick_login_hotel", email: "lafalaise@njangui.cm", password: "password123" },
  { labelKey: "quick_login_travel", email: "transcam@njangui.cm", password: "password123" },
  { labelKey: "quick_login_admin", email: "admin@njangui.cm", password: "admin123" },
];

function AuthPageContent() {
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get("role") as UserRole | null;
  const agencySignup = requestedRole === "agency";
  const tab = searchParams.get("tab") ?? (agencySignup ? "signup" : null);
  const router = useRouter();
  const { t } = useLang();

  const [showPassword, setShowPassword] = useState(false);
  const { user, login, register } = useAuth();
  const [forgotPassword, setForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regRole, setRegRole] = useState<UserRole>(
    requestedRole && ROLE_REDIRECT[requestedRole] ? requestedRole : "tourist"
  );
  const [regCompany, setRegCompany] = useState("");

  const upgradingFromTourist = agencySignup && user?.role === "tourist";

  // Rediriger si déjà connecté
  useEffect(() => {
    if (!user || upgradingFromTourist) return;
    const to = ROLE_REDIRECT[user.role];
    if (to) router.replace(to);
  }, [user, upgradingFromTourist, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { user, error } = login(loginEmail, loginPassword);
    if (error || !user) {
      toast.error(error ?? t("login_error"));
      setIsLoading(false);
      return;
    }
    toast.success(`${t("welcome")}, ${user.firstName} !`);
    setTimeout(() => router.push(ROLE_REDIRECT[user.role]), 800);
  };

  const handleQuickLogin = (email: string, password: string) => {
    setLoginEmail(email);
    setLoginPassword(password);
    setIsLoading(true);
    const { user, error } = login(email, password);
    if (error || !user) {
      toast.error(error ?? t("login_error"));
      setIsLoading(false);
      return;
    }
    toast.success(`${t("welcome")} ${user.firstName} ${user.lastName}`);
    setTimeout(() => router.push(ROLE_REDIRECT[user.role]), 800);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirm) {
      toast.error(t("passwords_mismatch"));
      return;
    }
    if (regPassword.length < 6) {
      toast.error(t("password_too_short"));
      return;
    }
    setIsLoading(true);
    const { user, error } = register({
      firstName: regFirstName,
      lastName: regLastName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      role: regRole,
      companyName: ["agency", "hotel", "agence-voyages"].includes(regRole) ? regCompany : undefined,
    });
    if (error || !user) {
      toast.error(error ?? t("register_error"));
      setIsLoading(false);
      return;
    }
    toast.success(t("account_created"));
    setTimeout(() => router.push(ROLE_REDIRECT[user.role]), 800);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success(t("reset_email_sent"));
      setForgotPassword(false);
    }, 1000);
  };

  const needsCompany = ["agency", "hotel", "agence-voyages"].includes(regRole);

  return (
    <div className="flex w-full min-h-screen bg-background">
      {/* Left side: Image & Brand */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-gradient-to-br from-[#9A3412] via-[#C2410C] to-[#EA580C]">
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <circle cx="150" cy="150" r="250" fill="#F97316" opacity="0.3" />
          <circle cx="950" cy="200" r="300" fill="#FB923C" opacity="0.2" />
          <circle cx="200" cy="700" r="200" fill="#EA580C" opacity="0.25" />
          <circle cx="1000" cy="750" r="180" fill="#FDBA74" opacity="0.15" />
          <circle cx="600" cy="450" r="350" fill="#C2410C" opacity="0.2" />
          <path d="M0 900 L200 700 L400 850 L600 650 L800 800 L1000 600 L1200 750 L1200 900 Z" fill="#1E40AF" opacity="0.3" />
          <path d="M0 800 L300 600 L500 750 L700 550 L900 700 L1100 500 L1200 650 L1200 900 L0 900 Z" fill="#EA580C" opacity="0.4" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-br from-[#9A3412]/60 via-[#9A3412]/40 to-transparent" />

        <div className="relative z-10 flex flex-col justify-between p-14 w-full h-full text-white">
          <Link href="/" className="flex items-center gap-3 w-fit hover:opacity-80 transition-opacity">
            <img src="/Logo-Réseau.png" alt="Njangui" className="h-10 w-auto" />
            <span className="text-3xl font-bold">NJANGUI</span>
          </Link>

          <div className="max-w-lg space-y-8">
            <div>
              <h1 className="text-5xl font-bold leading-tight mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
                {t("brand_desc")}
              </h1>
              <p className="text-lg text-white/75 font-light leading-relaxed">
                {t("brand_subdesc")}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { val: "47+", label: t("stats_agencies") },
                { val: "2 841", label: t("stats_tourists") },
                { val: "318", label: t("stats_reservations") },
              ].map((s) => (
                <div key={s.label} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <div className="text-2xl font-bold">{s.val}</div>
                  <div className="text-xs text-white/60 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Comptes de démo */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20">
              <p className="text-sm font-bold text-white/90 mb-3">{t("quick_login_prefix")}</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_LOGINS.map((q) => (
                  <button
                    key={q.email}
                    onClick={() => handleQuickLogin(q.email, q.password)}
                    className="text-left text-xs bg-white/10 hover:bg-white/25 border border-white/20 rounded-lg px-3 py-2 transition-all font-medium text-white/90 hover:text-white"
                  >
                    {t(q.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-white/50">
            <span>© 2026 Njangui</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>ENSP Yaoundé</span>
          </div>
        </div>
      </div>

      {/* Right side: Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-10 bg-muted/30" style={{ fontFamily: "Nunito, sans-serif" }}>
        <div className="w-full max-w-md space-y-7">

          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-6">
            <Link href="/" className="flex items-center gap-2 mb-1">
              <img src="/Logo-Réseau.png" alt="Njangui" className="h-10 w-auto" />
              <span className="text-3xl font-bold text-foreground">NJANGUI</span>
            </Link>
            <p className="text-xs text-muted-foreground">{t("mobile_tagline")}</p>
          </div>

          {/* Mobile quick logins */}
          <div className="lg:hidden bg-accent rounded-xl p-4 border border-border">
            <p className="text-xs font-bold text-[#EA580C] mb-2">{t("quick_login_prefix")}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_LOGINS.slice(0, 4).map((q) => (
                <button
                  key={q.email}
                  onClick={() => handleQuickLogin(q.email, q.password)}
                  className="text-left text-xs bg-background hover:bg-[#EA580C] hover:text-white border border-border rounded-lg px-2.5 py-2 transition-all font-medium text-foreground"
                >
                  {t(q.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {forgotPassword ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">{t("forgot_title")}</h2>
                <p className="text-muted-foreground text-sm">{t("forgot_desc")}</p>
              </div>
              <form className="space-y-5" onSubmit={handleForgotPassword}>
                <div className="space-y-2">
                  <Label htmlFor="email-reset" className="text-foreground font-semibold">{t("forgot_email_label")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input id="email-reset" type="email" required placeholder={t("forgot_email_placeholder")} className="pl-10 h-12 bg-background border-border rounded-xl" />
                  </div>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-12 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold rounded-xl">
                  {isLoading ? t("forgot_sending") : t("forgot_send")}
                </Button>
                <button type="button" onClick={() => setForgotPassword(false)} className="w-full text-center text-sm text-muted-foreground hover:text-[#EA580C] font-semibold transition-colors">
                  {t("forgot_back")}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-1">{t("welcome_title")}</h2>
                <p className="text-muted-foreground text-sm">{t("welcome_desc")}</p>
              </div>

              <Tabs defaultValue={tab === "signup" ? "signup" : "login"} className="w-full">
                <TabsList className="grid w-full grid-cols-2 p-1 bg-muted rounded-xl mb-6">
                  <TabsTrigger value="login" className="rounded-lg py-2.5 text-sm font-bold data-[state=active]:bg-background data-[state=active]:text-[#EA580C] data-[state=active]:shadow-sm transition-all">
                    {t("login_tab")}
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-lg py-2.5 text-sm font-bold data-[state=active]:bg-background data-[state=active]:text-[#EA580C] data-[state=active]:shadow-sm transition-all">
                    {t("signup_tab")}
                  </TabsTrigger>
                </TabsList>

                {/* ── LOGIN ── */}
                <TabsContent value="login" className="animate-in fade-in duration-300">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-foreground font-semibold text-sm">{t("email_label")}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 h-4.5 w-4.5 text-muted-foreground" />
                        <Input
                          type="email"
                          required
                          placeholder={t("email_placeholder")}
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="pl-10 h-12 bg-background border-border rounded-xl focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <Label className="text-foreground font-semibold text-sm">{t("password_label")}</Label>
                        <button type="button" onClick={() => setForgotPassword(true)} className="text-xs text-[#EA580C] hover:underline font-semibold">
                          {t("forgot_link")}
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 h-4.5 w-4.5 text-muted-foreground" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder={t("password_placeholder")}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="pl-10 pr-10 h-12 bg-background border-border rounded-xl focus:border-[#EA580C]"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-muted-foreground hover:text-muted-foreground">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 group mt-2"
                    >
                      {isLoading ? t("logging_in") : (
                        <>{t("login_btn")} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* ── SIGNUP ── */}
                <TabsContent value="signup" className="animate-in fade-in duration-300">
                  <form onSubmit={handleRegister} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-foreground font-semibold text-sm">{t("first_name_label")}</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input required value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} className="pl-9 h-11 bg-background border-border rounded-xl" placeholder={t("first_name_placeholder")} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-foreground font-semibold text-sm">{t("last_name_label")}</Label>
                        <Input required value={regLastName} onChange={(e) => setRegLastName(e.target.value)} className="h-11 bg-background border-border rounded-xl" placeholder={t("last_name_placeholder")} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-foreground font-semibold text-sm">{t("email_label_short")}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="pl-9 h-11 bg-background border-border rounded-xl" placeholder={t("email_placeholder")} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-foreground font-semibold text-sm">{t("phone_label")}</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input type="tel" required value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className="pl-9 h-11 bg-background border-border rounded-xl" placeholder={t("phone_placeholder")} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-foreground font-semibold text-sm">{t("account_type_label")}</Label>
                      <Select value={regRole} onValueChange={(v) => setRegRole(v as UserRole)}>
                        <SelectTrigger className="h-11 bg-background border-border rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tourist">{t("select_tourist")}</SelectItem>
                          <SelectItem value="agency">{t("select_agency")}</SelectItem>
                          <SelectItem value="hotel">{t("select_hotel")}</SelectItem>
                          <SelectItem value="agence-voyages">{t("select_travel_agency")}</SelectItem>
                          <SelectItem value="guide">{t("select_guide")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {needsCompany && (
                      <div className="space-y-1">
                        <Label className="text-foreground font-semibold text-sm">{t("company_name_label")}</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input required value={regCompany} onChange={(e) => setRegCompany(e.target.value)} className="pl-9 h-11 bg-background border-border rounded-xl" placeholder={t("company_name_placeholder")} />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-foreground font-semibold text-sm">{t("password_label_short")}</Label>
                        <Input type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="h-11 bg-background border-border rounded-xl" placeholder={t("password_min_placeholder")} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-foreground font-semibold text-sm">{t("confirm_label")}</Label>
                        <Input type="password" required value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} className="h-11 bg-background border-border rounded-xl" placeholder={t("confirm_placeholder")} />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 mt-1 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                      {isLoading ? t("creating") : (
                        <><CheckCircle2 size={18} /> {t("create_account")}</>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">{/* client component cant use hook here */}Chargement…</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
