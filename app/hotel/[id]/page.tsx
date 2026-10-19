"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { DtNavbar, DtFooter } from "@/src/components/dt-navbar";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { HOTELS_NEARBY } from "@/src/lib/njangui-data";
import { MapPin, Star, Home, ArrowLeft } from "lucide-react";
import { useLang } from "@/src/lib/lang";

export default function HotelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useLang();
  const resolvedParams = use(params);
  const router = useRouter();
  const hotel = HOTELS_NEARBY.find(h => h.id === resolvedParams.id);
  const [showFullDesc, setShowFullDesc] = useState(false);

  if (!hotel) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <DtNavbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <h2 className="text-xl font-bold text-foreground mb-2">Hôtel introuvable</h2>
            <p className="text-sm text-muted-foreground mb-4">Cet hôtel n'existe pas ou a été retiré.</p>
            <Button variant="outline" onClick={() => router.back()}>Retour</Button>
          </Card>
        </div>
        <DtFooter />
      </div>
    );
  }

  const descTruncated = hotel.desc && hotel.desc.length > 120;
  const displayDesc = showFullDesc || !descTruncated ? hotel.desc : hotel.desc?.slice(0, 120) + "...";

  return (
    <div style={{ fontFamily: "Nunito, sans-serif" }} className="bg-background min-h-screen flex flex-col">
      <DtNavbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition">
          <ArrowLeft size={16} /> Retour
        </button>

        <div className="grid md:grid-cols-5 gap-6">
          {/* Image */}
          <div className="md:col-span-3">
            <div className="w-full h-72 md:h-96 rounded-xl overflow-hidden bg-muted">
              {hotel.image && (
                <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover" />
              )}
            </div>
          </div>

          {/* Infos */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{hotel.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <MapPin size={14} />
                <span>{hotel.city}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star size={16} className="fill-amber-400 text-amber-400" />
                <span className="font-bold text-foreground">{hotel.rating}</span>
              </div>
              <span className="text-sm text-muted-foreground">({hotel.rooms} chambres)</span>
            </div>

            <div className="text-2xl font-bold text-[#EA580C]">
              {hotel.pricePerNight.toLocaleString()} FCFA <span className="text-sm text-muted-foreground font-normal">/nuit</span>
            </div>

            {hotel.desc && (
              <div>
                <p className="text-sm text-foreground leading-relaxed">{displayDesc}</p>
                {descTruncated && (
                  <button onClick={() => setShowFullDesc(!showFullDesc)} className="text-xs text-[#EA580C] hover:underline mt-1">
                    {showFullDesc ? "Voir moins" : "Lire la suite"}
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button className="flex-1 bg-[#EA580C] hover:bg-[#C2410C]" onClick={() => router.back()}>
                <Home size={16} className="mr-1" /> Réserver
              </Button>
            </div>
          </div>
        </div>
      </main>
      <DtFooter />
    </div>
  );
}
