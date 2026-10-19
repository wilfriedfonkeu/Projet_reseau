"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Plane, User, ChevronDown, Sun, Moon, Globe } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/lib/auth-context";
import { useLang } from "@/src/lib/lang";

interface SidebarItem {
  key: string;
  label: string;
  icon: React.ElementType;
}

interface DashboardShellProps {
  title: string;
  items: SidebarItem[];
  active: string;
  onChange: (key: string) => void;
  children: React.ReactNode;
}

export function DashboardShell({ title, items, active, onChange, children }: DashboardShellProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { t, lang, setLang } = useLang();

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    if (!user) router.replace("/auth");
  }, [user, router]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const handleLogout = () => {
    logout();
    router.push("/auth");
  };

  const displayName = user
    ? user.companyName ?? `${user.firstName} ${user.lastName}`
    : "…";

  const initials = user
    ? (user.firstName[0] ?? "") + (user.lastName[0] ?? "")
    : "DT";

  const activeLabel = items.find((i) => i.key === active)?.label ?? title;

  return (
    <div className="flex min-h-screen bg-background" style={{ fontFamily: "Nunito, sans-serif" }}>
      {/* ── Sidebar desktop ── */}
      <aside className="hidden md:flex flex-col w-64 bg-[#9A3412] text-white min-h-screen flex-shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <img src="/Logo-Réseau.png" alt="Njangui" className="h-8 w-auto" />
            <span className="font-bold text-lg text-white">NJANGUI</span>
          </Link>

          {/* User card */}
          {user && (
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
              {user.avatar ? (
                <img src={user.avatar} alt={user.firstName} className="w-9 h-9 rounded-full object-cover border-2 border-white/30" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#EA580C] flex items-center justify-center text-sm font-bold">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-sm font-bold truncate">{displayName}</div>
                <div className="text-[10px] text-white/50 capitalize">{user.role}</div>
              </div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => onChange(item.key)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all",
                  active === item.key
                    ? "bg-[#EA580C] text-white shadow-md"
                    : "text-white/65 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon size={17} className="flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-white/65 hover:bg-red-500/20 hover:text-red-300 transition-all"
          >
            <LogOut size={17} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-background border-b px-4 md:px-6 py-3.5 flex items-center justify-between shadow-sm sticky top-0 z-30">
          {/* Mobile: menu button */}
          <div className="flex items-center gap-3">
            <button
              className="md:hidden flex items-center gap-2 text-foreground font-bold"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <div className="w-7 h-7 rounded-lg bg-[#EA580C] flex items-center justify-center">
                <Plane size={13} className="text-white" />
              </div>
              <ChevronDown size={16} className={cn("transition-transform", mobileOpen && "rotate-180")} />
            </button>
            <h1 className="text-base font-bold text-foreground hidden md:block">{title}</h1>
            <h1 className="text-base font-bold text-foreground md:hidden">{activeLabel}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} title={isDark ? t("light_mode") : t("dark_mode")} className="text-muted-foreground hover:text-foreground transition p-1.5 rounded-lg hover:bg-accent">
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={() => setLang(lang === "fr" ? "en" : "fr")} title={t("language")} className="text-muted-foreground hover:text-foreground transition p-1.5 rounded-lg hover:bg-accent text-xs font-bold uppercase">
              <Globe size={14} className="inline mr-0.5" />{lang}
            </button>
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-[#EA580C]/20" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#EA580C]/10 flex items-center justify-center text-[#EA580C] font-bold text-sm">
                {initials}
              </div>
            )}
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-foreground">{displayName}</div>
              <div className="text-[10px] text-muted-foreground capitalize">{user?.role}</div>
            </div>
            <button onClick={handleLogout} title="Déconnexion" className="text-muted-foreground hover:text-red-500 transition ml-1">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Mobile sidebar drawer */}
        {mobileOpen && (
          <div className="md:hidden bg-[#9A3412] text-white shadow-xl">
            <nav className="p-3 space-y-0.5">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => { onChange(item.key); setMobileOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all",
                      active === item.key ? "bg-[#EA580C] text-white" : "text-white/65 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon size={17} /> {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        <div className="flex-1 p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
