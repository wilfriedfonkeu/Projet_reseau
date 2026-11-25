"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DtNavbar, DtFooter } from "@/src/components/dt-navbar";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { getPublicPacks, CIRCUITS, DESTINATIONS, REVIEWS, AGENCIES } from "@/src/lib/njangui-data";
import { getCurrentUser } from "@/src/lib/auth-store";
import { useOffersLoader } from "@/src/hooks/use-offers-loader";
import { useLang } from "@/src/lib/lang";
import {
  Search, MapPin, Clock, Star, ChevronLeft, ChevronRight,
  Plane, Compass, Hotel, Building2, ArrowRight, Shield
} from "lucide-react";

const HOTELS_LIST = [
  {
    id: "hotel-ilomba",
    name: "L'Hôtel Ilomba",
    city: "Kribi",
    image: encodeURI("/images/hotels/L'Hôtel Ilomba (Kribi).jpeg"),
    desc: "Confort moderne et accueil chaleureux près de la côte de Kribi.",
    price: 45000,
    rating: 4.7,
  },
  {
    id: "hotel-bobende",
    name: "Le Fini Hotel Bobende",
    city: "Limbé",
    image: encodeURI("/images/hotels/Le Fini Hotel Bobende (Limbé).jpg"),
    desc: "Détente et brise marine à Limbé dans un cadre agréable.",
    price: 55000,
    rating: 4.8,
  },
  {
    id: "hotel-artisanat",
    name: "L'Hôtel de l'Artisanat",
    city: "Foumban",
    image: encodeURI("/images/hotels/L'Hôtel de l'Artisanat (Foumban).webp"),
    desc: "Charme authentique et décoration inspirée des traditions de Foumban.",
    price: 38000,
    rating: 4.6,
  },
  {
    id: "hotel-bouba",
    name: "Le Bouba Ndjida Safari Lodge",
    city: "Nord",
    image: encodeURI("/images/hotels/Le Bouba Ndjida Safari Lodge.jpeg"),
    desc: "Évasion nature et sérénité aux portes des grands espaces du Nord.",
    price: 62000,
    rating: 4.9,
  },
];

export default function HomePage() {
  useOffersLoader();
  const router = useRouter();
  const { t } = useLang();
  const [packCat, setPackCat] = useState("Tous");
  const [reviewIdx, setReviewIdx] = useState(0);
  const [step, setStep] = useState(0);
  const [searchDest, setSearchDest] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchBudget, setSearchBudget] = useState("");
  const [searchType, setSearchType] = useState("");
  const allPacks = getPublicPacks();
  const filteredPacks = packCat === "Tous" ? allPacks : allPacks.filter((p) => p.category === packCat);

  const reserve = (id: string, isCircuit?: boolean) => {
    const user = getCurrentUser();
    if (!user) { router.push("/auth?tab=signup"); return; }
    if (isCircuit) { toast.info(t("circuit_login_hint")); router.push("/auth?tab=signup"); return; }
    router.push(`/reservation/${id}`);
  };

  return (
    <div style={{ fontFamily: "Nunito, sans-serif" }} className="bg-background">
      <DtNavbar />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden text-white py-20 md:py-32">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=2000" alt="Plage du Cameroun" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#9A3412]/50 via-[#9A3412]/40 to-[#EA580C]/50" />
        </div>
        <div className="relative max-w-6xl mx-auto px-5 text-center">
          <Badge className="bg-white/20 text-white border-white/30 mb-6 px-4 py-1.5 text-sm backdrop-blur">
            <Plane size={13} className="mr-1.5" /> {t("hero_badge")}
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t("hero_discover")}{" "}
            <em className="text-transparent bg-clip-text bg-gradient-to-r from-[#FB923C] to-[#FDBA74]" style={{ fontStyle: "italic" }}>
              {t("hero_cameroun")}
            </em>
          </h1>
          <p className="text-white/80 text-xl mb-10 max-w-2xl mx-auto">
            {t("hero_desc")}
          </p>

          {/* Search bar */}
          <Card className="max-w-5xl mx-auto bg-background text-foreground p-4 md:p-5 shadow-2xl rounded-2xl border-t-4 border-[#EA580C]">
            <CardContent className="p-0 grid md:grid-cols-5 gap-3">
              <Input placeholder={t("hero_dest_placeholder")} id="hero-destination"
                value={searchDest} onChange={(e) => setSearchDest(e.target.value)} />
              <Input type="date" id="hero-date"
                value={searchDate} onChange={(e) => setSearchDate(e.target.value)} />
              <Input placeholder={t("hero_budget_placeholder")} type="number" id="hero-budget"
                value={searchBudget} onChange={(e) => setSearchBudget(e.target.value)} />
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger id="hero-type"><SelectValue placeholder={t("hero_type_placeholder")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aventure">{t("filter_aventure")}</SelectItem>
                  <SelectItem value="luxe">{t("filter_luxe")}</SelectItem>
                  <SelectItem value="detente">{t("filter_detente")}</SelectItem>
                  <SelectItem value="culturel">Culturel</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => {
                  const params = new URLSearchParams();
                  if (searchDest) params.set("destination", searchDest);
                  if (searchBudget) params.set("maxPrice", searchBudget);
                  if (searchType) params.set("category", searchType);
                  const qs = params.toString();
                  toast.info(t("hero_searching"));
                  router.push(qs ? `/search?${qs}` : "/search");
                }}
                className="bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold"
                id="hero-search-btn"
              >
                <Search size={16} /> {t("hero_search")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── BANDEAU VALEURS ── */}
      <section className="bg-gradient-to-r from-[#EA580C]/5 to-[#F97316]/10 border-y border-[#EA580C]/10 py-8">
        <div className="max-w-6xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: Compass, label: t("value_custom_trips"), sub: t("value_configurator") },
            { icon: Hotel, label: t("value_geolocated_hotels"), sub: t("value_nearby_suggestions") },
            { icon: Plane, label: t("value_transport_included"), sub: t("value_priority_agencies") },
            { icon: Shield, label: t("value_secure_payment"), sub: t("value_om_mtn_card") },
          ].map((v, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-accent hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-full bg-[#EA580C]/10 flex items-center justify-center">
                <v.icon size={22} className="text-[#EA580C]" />
              </div>
              <span className="text-sm font-bold text-foreground">{v.label}</span>
              <span className="text-xs text-muted-foreground">{v.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── AGENCES PARTENAIRES ── */}
      <section className="max-w-7xl mx-auto px-5 py-16">
        <div className="flex flex-wrap items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("agencies_title")} <span className="text-[#EA580C]">{t("agencies_highlight")}</span>
            </h2>
            <p className="text-muted-foreground mt-1">{t("agencies_desc")}</p>
          </div>
          <Button onClick={() => router.push("/pricing")} variant="outline" className="border-[#EA580C] text-[#EA580C] hover:bg-[#EA580C] hover:text-white">
            <Building2 size={16} /> {t("agencies_partner_cta")} <ArrowRight size={16} />
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {AGENCIES.map((a) => (
            <Card key={a.id} className="hover:shadow-xl transition-all border-t-4 border-[#EA580C] group">
              <CardContent className="p-5 text-center">
                <img src={a.logo} alt={a.name} className="w-16 h-16 mx-auto rounded-full ring-4 ring-[#EA580C]/10 group-hover:ring-[#EA580C]/30 transition" />
                <h3 className="font-bold mt-3 text-foreground">{a.name}</h3>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                  <MapPin size={12} /> {a.city}
                </div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{a.desc}</p>
                <div className="flex justify-between items-center mt-3 text-xs">
                  <span className="flex items-center gap-1 text-[#EA580C] font-semibold">
                    <Star size={12} className="fill-[#EA580C]" /> {a.rating}
                  </span>
                  <span className="text-muted-foreground">{getPublicPacks().filter(p => p.agencyId === a.id).length} {t("offers_count")}</span>
                </div>
                <Button size="sm" variant="outline" className="w-full mt-4 border-[#EA580C] text-[#EA580C] hover:bg-[#EA580C] hover:text-white"
                  onClick={() => router.push(`/search?agency=${a.id}`)}>
                  {t("view_offers")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── PACKS ── */}
      <section id="packs" className="bg-muted/50 py-16">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex flex-wrap items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                {t("our_packs_title")} <span className="text-[#EA580C]">{t("our_packs_highlight")}</span>
              </h2>
              <p className="text-muted-foreground mt-1">{t("our_packs_desc")}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[{ key: "Tous", label: t("filter_all") }, { key: "Aventure", label: t("filter_aventure") }, { key: "Luxe", label: t("filter_luxe") }, { key: "Détente", label: t("filter_detente") }].map((c) => (
                <Button key={c.key} size="sm" onClick={() => setPackCat(c.key)}
                  className={packCat === c.key ? "bg-[#EA580C] text-white" : "bg-background border border-[#EA580C]/30 text-foreground hover:bg-[#EA580C]/10"}>
                  {c.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPacks.map((p) => (
              <Card key={p.id} className="overflow-hidden hover:shadow-xl transition-all group p-0 border-t-2 border-[#EA580C]">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{p.name}</h3>
                    <Badge className="bg-[#EA580C] text-white text-xs">{p.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{p.desc}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground"><Clock size={14} />{p.duration}</span>
                    <span className="font-bold text-[#EA580C] text-lg">{p.price.toLocaleString()} {t("fcfa")}</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1 border-[#EA580C] text-[#EA580C]"
                      onClick={() => router.push(`/offers/${p.id}`)}>
                      {t("details_btn")}
                    </Button>
                    <Button size="sm" className="flex-1 bg-[#EA580C] hover:bg-[#C2410C]" onClick={() => reserve(p.id)}>
                      {t("reserve_btn")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CIRCUITS (AVEC VIDÉOS LOCALES ET DESCRIPTIONS) ── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-5">
          <h2 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t("our_circuits_title")} <span className="text-[#EA580C]">{t("our_circuits_highlight")}</span>
          </h2>
          <p className="text-muted-foreground mb-8">{t("our_circuits_desc")}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CIRCUITS.map((c) => {
              const idLower = `${c.id} ${c.name}`.toLowerCase();
              let videoSrc = "/videos/circuit-cote.mp4";
              let videoCaption = "Aperçu vidéo : faune sauvage, grands espaces et découverte côtière.";

              if (idLower.includes("volcan")) {
                videoSrc = "/videos/circuit-volcans.mp4";
                videoCaption = "Aperçu vidéo : forêt brumeuse, arbres d'altitude et reliefs volcaniques.";
              } else if (idLower.includes("ancestral") || idLower.includes("ouest")) {
                videoSrc = "/videos/circuit-ancestral.mp4";
                videoCaption = "Aperçu vidéo : éléphants en liberté, nature sauvage et patrimoine.";
              } else if (idLower.includes("adamaoua") || idLower.includes("lac") || idLower.includes("nord")) {
                videoSrc = "/videos/circuit-adamaoua.mp4";
                videoCaption = "Aperçu vidéo : lac paisible, collines verdoyantes et grands espaces.";
              }

              return (
                <Card key={c.id} className="overflow-hidden hover:shadow-xl transition-all p-0 bg-card group border-t-2 border-[#EA580C]">
                  <div className="aspect-[4/3] overflow-hidden bg-black relative">
                    <video
                      src={videoSrc}
                      preload="auto"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold mb-1">{c.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{c.desc}</p>
                    <p className="text-xs font-medium text-[#EA580C]/90 bg-[#EA580C]/5 rounded-lg p-2 mb-3">
                      {videoCaption}
                    </p>
                    <div className="flex justify-between items-center text-sm mb-3">
                      <span className="text-muted-foreground flex items-center gap-1"><Clock size={12} />{c.duration}</span>
                      <span className="font-bold text-[#EA580C]">{c.price.toLocaleString()} {t("fcfa")}</span>
                    </div>
                    <Button size="sm" onClick={() => reserve(c.id, true)} className="w-full bg-[#EA580C] hover:bg-[#C2410C]">
                      {t("reserve_btn")}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── DESTINATIONS ── */}
      <section className="bg-muted/50 py-16">
        <div className="max-w-7xl mx-auto px-5">
          <h2 className="text-3xl md:text-4xl font-bold mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t("destinations_title")} <span className="text-[#F97316]">{t("destinations_highlight")}</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {DESTINATIONS.map((d) => (
              <button key={d.name} onClick={() => router.push(`/search?destination=${d.name}`)}
                className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer text-left shadow-md hover:shadow-xl transition-all">
                <img src={d.image} alt={d.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-[#FB923C]" />
                    <span className="font-bold">{d.name}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── HÔTELS (SOUS DESTINATIONS PHARES) ── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex flex-wrap items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                Nos <span className="text-[#EA580C]">Hôtels</span> partenaires
              </h2>
              <p className="text-muted-foreground mt-1">
                Des hébergements sélectionnés pour leur confort, leur accueil et leur proximité avec vos destinations.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push("/search")}
              className="border-[#EA580C] text-[#EA580C] hover:bg-[#EA580C] hover:text-white"
            >
              <Hotel size={16} className="mr-1.5" /> Voir tous les hébergements <ArrowRight size={16} className="ml-1" />
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOTELS_LIST.map((h) => (
              <Card key={h.id} className="overflow-hidden hover:shadow-xl transition-all p-0 bg-card group border-t-4 border-[#EA580C] rounded-2xl">
                <div className="aspect-[4/3] overflow-hidden relative bg-muted">
                  <img
                    src={h.image}
                    alt={h.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-background/95 backdrop-blur px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow">
                    <Star size={12} className="fill-[#EA580C] text-[#EA580C]" />
                    <span>{h.rating}</span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <MapPin size={12} className="text-[#EA580C]" />
                    <span>{h.city}</span>
                  </div>
                  <h3 className="font-bold text-base text-foreground mb-1">{h.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{h.desc}</p>
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-xs text-muted-foreground">À partir de</span>
                    <span className="font-bold text-[#EA580C]">{h.price.toLocaleString()} {t("fcfa")}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/search?destination=${encodeURIComponent(h.city)}`)}
                    className="w-full bg-[#EA580C] hover:bg-[#C2410C] text-white"
                  >
                    Découvrir l&apos;hôtel
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONFIGURATEUR VOYAGE SUR MESURE ── */}
      <section className="py-16 bg-gradient-to-br from-[#EA580C]/5 to-[#F97316]/10">
        <div className="max-w-4xl mx-auto px-5">
          <h2 className="text-3xl md:text-4xl font-bold mb-2 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t("configurator_title")} <span className="text-[#EA580C]">{t("configurator_highlight")}</span>
          </h2>
          <p className="text-center text-muted-foreground mb-8">{t("configurator_desc")}</p>
          <Card className="p-6 md:p-8 border-t-4 border-[#EA580C] shadow-xl">
            <div className="flex justify-between mb-8">
              {[t("step_destination"), t("step_accommodation"), t("step_transport"), t("step_activities")].map((s, i) => (
                <div key={s} className="flex-1 flex flex-col items-center text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-all ${
                    i < step ? "bg-[#EA580C] text-white scale-110" :
                    i === step ? "bg-[#EA580C] text-white ring-4 ring-[#EA580C]/30 scale-110" :
                    "bg-muted text-muted-foreground"
                  }`}>{i + 1}</div>
                  <span className="text-xs font-semibold hidden sm:block text-muted-foreground">{s}</span>
                </div>
              ))}
            </div>
            <div className="min-h-[120px] flex flex-col gap-3">
              {step === 0 && (<><Input placeholder={t("dest_placeholder")} /><Input type="date" /></>)}
              {step === 1 && (
                <Select><SelectTrigger><SelectValue placeholder={t("choose_hotel")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="h1">Hôtel La Falaise — Douala</SelectItem>
                    <SelectItem value="h2">Mont Fébé Resort — Yaoundé</SelectItem>
                    <SelectItem value="h3">Kribi Beach Hotel</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {step === 2 && (
                <Select><SelectTrigger><SelectValue placeholder={t("choose_trip")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="t1">Douala → Kribi (Minibus)</SelectItem>
                    <SelectItem value="t2">Yaoundé → Bafoussam (Bus)</SelectItem>
                    <SelectItem value="t3">Douala → Limbe (4x4)</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {step === 3 && (
                <Select><SelectTrigger><SelectValue placeholder={t("choose_guide")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="g1">Guide Ngoumou — Kribi</SelectItem>
                    <SelectItem value="g2">Guide Talla — Bafoussam</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>{t("previous_btn")}</Button>
              {step < 3
                ? <Button onClick={() => setStep(step + 1)} className="bg-[#EA580C]">{t("next_btn")}</Button>
                : <Button onClick={() => { toast.success(t("trip_configured")); router.push("/auth?tab=signup"); }} className="bg-[#EA580C]">{t("confirm_btn")}</Button>
              }
            </div>
          </Card>
        </div>
      </section>

      {/* ── CARTE INTERACTIVE ── */}
      <section className="max-w-7xl mx-auto px-5 py-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          {t("map_title")} <span className="text-[#F97316]">{t("map_highlight")}</span>
        </h2>
        <p className="text-muted-foreground mb-6">{t("map_desc")}</p>
        <div className="relative aspect-[16/8] rounded-2xl border-2 border-[#F97316]/30 overflow-hidden shadow-xl">
          <iframe
            title="Carte Cameroun"
            src="https://www.openstreetmap.org/export/embed.html?bbox=8.5%2C2.0%2C16.2%2C13.0&layer=mapnik"
            className="w-full h-full"
          />
          <div className="absolute top-3 left-3 bg-background/90 backdrop-blur rounded-lg px-3 py-2 text-xs font-semibold text-foreground shadow">
            📍 {t("map_geolocation")}
          </div>
        </div>
      </section>

      {/* ── AVIS CLIENTS ── */}
      <section className="bg-[#9A3412] dark:bg-card text-white py-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-[#F97316]/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-[#EA580C]/15 blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t("reviews_title")} <em className="text-[#FB923C]" style={{ fontStyle: "italic" }}>{t("reviews_highlight")}</em>
          </h2>
          <Card className="bg-white/10 border-white/20 text-white p-8 backdrop-blur">
            <CardContent className="p-0">
              <div className="flex items-center justify-center gap-3 mb-4">
                <img src={REVIEWS[reviewIdx].avatar} className="w-14 h-14 rounded-full ring-2 ring-[#FB923C]" alt="" />
                <div className="text-left">
                  <div className="font-bold">{REVIEWS[reviewIdx].name}</div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: REVIEWS[reviewIdx].rating }).map((_, i) => (
                      <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="italic text-white/90 text-lg">&ldquo;{REVIEWS[reviewIdx].text}&rdquo;</p>
              <div className="flex justify-center gap-3 mt-6">
                <Button size="icon" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10"
                  onClick={() => setReviewIdx((reviewIdx - 1 + REVIEWS.length) % REVIEWS.length)}><ChevronLeft /></Button>
                <Button size="icon" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10"
                  onClick={() => setReviewIdx((reviewIdx + 1) % REVIEWS.length)}><ChevronRight /></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <DtFooter />
    </div>
  );
}