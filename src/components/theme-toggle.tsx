"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("dt_theme");
    const isDark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("dt_theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full hover:bg-accent transition"
      aria-label="Changer le thème"
    >
      {dark ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-muted-foreground" />}
    </button>
  );
}
