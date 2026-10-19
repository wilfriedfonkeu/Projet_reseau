"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Menu, X, Globe, LogIn, LayoutDashboard, LogOut, User } from "lucide-react";
import { ROLE_REDIRECT } from "@/src/lib/auth-store";
import { useAuth } from "@/src/lib/auth-context";
import { cn } from "@/src/lib/utils";
import { ThemeToggle } from "@/src/components/theme-toggle";
import { useLang } from "@/src/lib/lang";

const NAV_LINKS = [
  { href: "/", label: "home" },
  { href: "/search", label: "nav_offers" },
  { href: "/messages", label: "nav_messages" },
  { href: "/pricing", label: "nav_pricing" },
];

export function DtNavbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang, setLang } = useLang();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const roleName: Record<string, string> = {
    tourist: t("role_tourist"),
    agency: t("role_agency"),
    hotel: t("role_hotel"),
    "agence-voyages": t("role_agence_voyages"),
    guide: t("role_guide"),
    admin: t("role_admin"),
  };

  // Vérifie si un lien est actif
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <img src="/Logo-Réseau.png" alt="Njangui" className="h-9 w-auto" />
            <span className="text-xl font-bold text-foreground">NJANGUI</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                  isActive(link.href)
                    ? "text-[#EA580C] dark:text-orange-400 bg-primary/8"
                    : "text-muted-foreground hover:text-[#EA580C] dark:hover:text-orange-400 hover:bg-accent"
                )}
              >
                {t(link.label)}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#EA580C] dark:bg-orange-400 rounded-full" />
                )}
              </Link>
            ))}
            <button onClick={() => setLang(lang === "fr" ? "en" : "fr")}
              className="flex items-center gap-1 text-xs text-muted-foreground border border-border rounded-full px-2.5 py-1 ml-2 hover:bg-accent transition">
              <Globe size={12} /> {lang === "fr" ? "EN" : "FR"}
            </button>
            <ThemeToggle />
          </div>

          {/* CTA — selon état de connexion */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.firstName}
                      className="w-8 h-8 rounded-full object-cover border-2 border-primary/20"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User size={15} className="text-[#EA580C] dark:text-orange-400" />
                    </div>
                  )}
                  <div className="leading-tight">
                    <div className="font-bold text-foreground text-xs">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{roleName[user.role] ?? user.role}</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground gap-1.5"
                  onClick={() => router.push(ROLE_REDIRECT[user.role])}
                >
                  <LayoutDashboard size={14} /> {t("dashboard_btn")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive gap-1.5"
                  onClick={handleLogout}
                >
                  <LogOut size={14} /> {t("logout")}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground gap-1.5 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-500 dark:hover:text-white"
                  onClick={() => router.push("/auth")}
                >
                  <LogIn size={14} /> {t("login")}
                </Button>
                <Button
                  size="sm"
                  className="bg-[#EA580C] hover:bg-[#C2410C] gap-1.5"
                  onClick={() => router.push("/auth?tab=signup")}
                >
                  {t("signup")}
                </Button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2 rounded-lg hover:bg-accent transition" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden py-4 border-t border-border space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all",
                  isActive(link.href)
                    ? "text-[#EA580C] dark:text-orange-400 bg-primary/8 font-bold"
                    : "text-muted-foreground hover:text-[#EA580C] dark:hover:text-orange-400 hover:bg-accent"
                )}
              >
                {isActive(link.href) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] dark:bg-orange-400" />
                )}
                {t(link.label)}
              </Link>
            ))}
            <div className="pt-2 px-2 space-y-2">
              {user ? (
                <>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={() => { setOpen(false); router.push(ROLE_REDIRECT[user.role]); }}
                  >
                    {t("my_dashboard")}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-destructive border-destructive/30"
                    onClick={() => { setOpen(false); handleLogout(); }}
                  >
                    {t("logout")}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="w-full bg-[#EA580C] hover:bg-[#C2410C]"
                    onClick={() => { setOpen(false); router.push("/auth"); }}
                  >
                    {t("login")}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-[#EA580C] text-[#EA580C]"
                    onClick={() => { setOpen(false); router.push("/auth?tab=signup"); }}
                  >
                    {t("signup")}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export function DtFooter() {
  const { t } = useLang();
  return (
    <footer className="bg-[#9A3412] dark:bg-card text-white py-12">
      <div className="max-w-7xl mx-auto px-5">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="text-2xl font-bold mb-3 flex items-center gap-2">
              <img src="/Logo-Réseau.png" alt="Njangui" className="h-8 w-auto inline-block" />
              <span>NJANGUI</span>
            </div>
            <p className="text-white/60 text-sm">{t("footer_desc")}</p>
          </div>
          <div>
            <h4 className="font-bold mb-3 text-sm uppercase tracking-wide text-white/80">{t("footer_platform")}</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/search" className="hover:text-white transition">{t("footer_search_offers")}</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition">{t("footer_agency_subscriptions")}</Link></li>
              <li><Link href="/auth" className="hover:text-white transition">{t("login")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3 text-sm uppercase tracking-wide text-white/80">{t("footer_actors")}</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li>{t("footer_agencies")}</li>
              <li>{t("footer_hotels")}</li>
              <li>{t("footer_guides")}</li>
              <li>{t("footer_travel_agencies")}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3 text-sm uppercase tracking-wide text-white/80">{t("footer_contact")}</h4>
            <p className="text-sm text-white/60">contact@njangui.cm</p>
            <p className="text-sm text-white/60 mt-1">+237 6 99 00 00 00</p>
            <p className="text-sm text-white/60 mt-1">Douala, Cameroun</p>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 text-center text-xs text-white/40">
          {t("footer_copyright")}
        </div>
      </div>
    </footer>
  );
}
