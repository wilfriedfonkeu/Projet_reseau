"use client";
import { useState, useEffect } from "react";
import { loadCustomOffers, getCustomOfferCount, subscribeToDataChanges } from "@/src/lib/njangui-data";

export function useOffersLoader() {
  const [ready, setReady] = useState(false);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const unsub = subscribeToDataChanges(() => forceUpdate(n => n + 1));
    if (getCustomOfferCount() > 0) {
      setReady(true);
      return unsub;
    }
    loadCustomOffers().then(() => setReady(true));
    return unsub;
  }, []);

  return ready;
}
