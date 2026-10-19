"use client";
import { useEffect, useState } from "react";
import { getCurrentUser, type DtUser } from "@/src/lib/auth-store";

export function useAuth() {
  const [user, setUser] = useState<DtUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getCurrentUser());
    setLoading(false);
  }, []);

  const refresh = () => setUser(getCurrentUser());

  return { user, loading, refresh };
}
