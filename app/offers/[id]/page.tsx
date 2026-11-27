"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DtNavbar, DtFooter } from "@/src/components/dt-navbar";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Textarea } from "@/src/components/ui/textarea";
import { getPublicPacks, AGENCIES, HOTELS_NEARBY, FLEET, getReviewsByPack, pushReview, loadSavedReviews, getReservationsByUser, loadGuides, getGuidesByIds, loadTrips, getAllTrips, loadPartners, getAllPartners, type GuideData, type PartnerData, type CircuitSite } from "@/src/lib/njangui-data";
import { useOffersLoader } from "@/src/hooks/use-offers-loader";
import { getCurrentUser } from "@/src/lib/auth-store";
import { MapPin, Clock, CalendarDays, Star, Shield, ArrowRight, Bus, Hotel, CheckCircle2, ExternalLink, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/src/lib/lang";

type GalleryItem = { image: string; label: string; city: string };

function normalizeCity(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function SiteImageCarousel({ items, previousLabel, nextLabel }: { items: GalleryItem[]; previousLabel: string; nextLabel: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % items.length);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [index, items.length]);

  if (items.length === 0) return null;
  const current = items[index] ?? items[0];

  return (
    <div className="rounded-2xl overflow-hidden border bg-card">
      <div className="relative aspect-[16/9] sm:aspect-[21/9]">
        <img src={current.image} alt={current.label} className="w-full h-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 py-5">
          <p className="font-bold text-white drop-shadow">{current.label}</p>
          <p className="text-sm text-white/80 flex items-center gap-1"><MapPin size={12} /> {current.city}</p>
        </div>
        {items.length > 1 && (
          <>
            <button
              type="button"
              aria-label={previousLabel}
              title={previousLabel}
              onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label={nextLabel}
              title={nextLabel}
              onClick={() => setIndex((i) => (i + 1) % items.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-3 right-4 flex gap-1.5">
              {items.map((item, i) => (
                <button
                  key={`${item.image}-${i}`}
                  type="button"
                  aria-label={`${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-2 bg-white/60 hover:bg-white"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function OfferDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  useOffersLoader();
  const { t } = useLang();
  const resolvedParams = use(params);
  const router = useRouter();
  const pack = getPublicPacks().find((p) => p.id === resolvedParams.id);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviews, setReviews] = useState<ReturnType<typeof getReviewsByPack>>([]);
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [canReview, setCanReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [guides, setGuides] = useState<GuideData[]>([]);
  const [partners, setPartners] = useState<PartnerData[]>(getAllPartners());

  useEffect(() => {
    loadSavedReviews().then(() => {
      setReviews(getReviewsByPack(resolvedParams.id));
    });
    const u = getCurrentUser();
    setUser(u);
    if (u) {
      const userReservations = getReservationsByUser(u.id);
      const hasConfirmed = userReservations.some(r => r.packId === resolvedParams.id && (r.status === "Confirmée" || r.status === "Terminée"));
      setCanReview(hasConfirmed);
    }
    loadTrips();
    loadPartners().then(() => setPartners(getAllPartners()));
    loadGuides().then(() => {
      if ((pack as any)?.guideIds?.length) {
        setGuides(getGuidesByIds((pack as any).guideIds));
      }
    });
  }, [resolvedParams.id]);
  
  if (!pack) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <DtNavbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <h1 className="text-2xl font-bold mb-4">{t("offer_not_found")}</h1>
            <p className="text-muted-foreground mb-6">{t("offer_not_found_desc")}</p>
            <Button onClick={() => router.push("/search")}>{t("back_to_offers")}</Button>
          </Card>
        </div>
        <DtFooter />
      </div>
    );
  }

  const agency = AGENCIES.find((a) => a.id === pack.agencyId);
  const circuitSites = pack.sites ?? [];
  const sitesByCity = circuitSites.reduce<Record<string, CircuitSite[]>>((acc, site) => {
    if (!acc[site.city]) acc[site.city] = [];
    acc[site.city].push(site);
    return acc;
  }, {});
  const addGalleryItem = (list: GalleryItem[], item?: GalleryItem) => {
    if (!item?.image) return;
    if (!list.some(existing => existing.image === item.image && existing.label === item.label)) list.push(item);
  };
  const hotelByName = (name?: string) =>
    HOTELS_NEARBY.find(hotel => normalizeCity(hotel.name) === normalizeCity(name ?? ""));
  const hotelByPartnerId = (id?: string) => {
    const partner = partners.find(item => item.id === id);
    return partner ? hotelByName(partner.name) : undefined;
  };

  const galleryItems: GalleryItem[] = [];
  if (pack.type === "circuit") {
    circuitSites.forEach(site => {
      addGalleryItem(galleryItems, site.image ? { image: site.image, label: site.name, city: site.city } : undefined);
      const hotel = hotelByName(site.hotelName)
        ?? (site.hotelPartnerIds ?? []).map(hotelByPartnerId).find(Boolean)
        ?? HOTELS_NEARBY.find(item => normalizeCity(item.city) === normalizeCity(site.city));
      addGalleryItem(galleryItems, hotel?.image ? { image: hotel.image, label: hotel.name, city: site.city } : undefined);
    });
    (pack.images ?? []).forEach(image => addGalleryItem(galleryItems, { image, label: pack.name, city: pack.location }));
  } else {
    addGalleryItem(galleryItems, { image: pack.image, label: pack.name, city: pack.location });
    (pack.images ?? []).forEach(image => addGalleryItem(galleryItems, { image, label: pack.name, city: pack.location }));
    const hotel = HOTELS_NEARBY.find(item => item.id === pack.hotelId)
      ?? hotelByPartnerId(pack.hotelPartnerId)
      ?? (pack.hotelPartnerIds ?? []).map(hotelByPartnerId).find(Boolean)
      ?? HOTELS_NEARBY.find(item => normalizeCity(item.city) === normalizeCity(pack.location));
    addGalleryItem(galleryItems, hotel?.image ? { image: hotel.image, label: hotel.name, city: hotel.city } : undefined);
  }
  if (galleryItems.length === 0) addGalleryItem(galleryItems, { image: pack.image, label: pack.name, city: pack.location });

  const guideNamesById = (ids?: string[]) =>
    (ids ?? [])
      .map((id) => guides.find((g) => g.id === id)?.name)
      .filter((name): name is string => Boolean(name))
      .join(", ");
  const partnerNamesById = (ids?: string[]) =>
    (ids ?? [])
      .map((id) => partners.find((p) => p.id === id)?.name)
      .filter((name): name is string => Boolean(name))
      .join(", ");

  return (
    <div style={{ fontFamily: "Nunito, sans-serif" }} className="bg-background min-h-screen flex flex-col">
      <DtNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-5 py-8 w-full">
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <SiteImageCarousel
              key={pack.id}
              items={galleryItems}
              previousLabel={t("previous_image")}
              nextLabel={t("next_image")}
            />

            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-[#EA580C] text-white">{pack.category}</Badge>
                <Badge variant="outline" className="text-muted-foreground bg-card"><Clock size={12} className="mr-1"/> {pack.duration}</Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                {pack.name}
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                {pack.desc}
              </p>
            </div>

            {circuitSites.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-2 text-foreground">{t("circuit_itinerary")}</h3>
                <p className="text-sm text-muted-foreground mb-5">{t("circuit_itinerary_desc")}</p>
                <div className="space-y-5">
                  {Object.entries(sitesByCity).map(([city, sites]) => {
                    const cityGuides = guideNamesById(Array.from(new Set(sites.flatMap((s) => s.guideIds ?? []))));
                    const cityHotels = partnerNamesById(Array.from(new Set(sites.flatMap((s) => s.hotelPartnerIds ?? []))));
                    const cityTransport = partnerNamesById(Array.from(new Set(sites.flatMap((s) => s.transportPartnerIds ?? []))));
                    const cityKey = normalizeCity(city);
                    const cityTrips = getAllTrips().filter(
                      (trip) => normalizeCity(trip.to) === cityKey || normalizeCity(trip.from) === cityKey
                    );
                    const cityGuideList = Array.from(new Set(sites.flatMap((s) => s.guideIds ?? [])))
                      .map((id) => guides.find((g) => g.id === id))
                      .filter((g): g is GuideData => Boolean(g));
                    const cityHotelIds = Array.from(new Set(sites.flatMap((s) => s.hotelPartnerIds ?? [])));
                    const cityPartnerHotels = cityHotelIds
                      .map((id) => partners.find((p) => p.id === id))
                      .filter((p): p is PartnerData => Boolean(p));
                    const cityNearbyHotels = HOTELS_NEARBY.filter(
                      (h) => normalizeCity(h.city) === cityKey &&
                        !cityPartnerHotels.some((p) => normalizeCity(p.name) === normalizeCity(h.name))
                    );
                    const citySiteHotels = Array.from(new Set(sites.map((s) => s.hotelName).filter((n): n is string => Boolean(n))))
                      .filter((name) =>
                        !cityPartnerHotels.some((p) => normalizeCity(p.name) === normalizeCity(name)) &&
                        !cityNearbyHotels.some((h) => normalizeCity(h.name) === normalizeCity(name))
                      );
                    return (
                      <div key={city} className="rounded-2xl border bg-card p-5">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <MapPin size={16} className="text-[#EA580C]" />
                          <h4 className="font-bold text-foreground">{city}</h4>
                          <Badge variant="outline" className="text-xs">
                            {sites.length} {t("circuit_sites_count")}
                          </Badge>
                          {cityGuides && <Badge variant="secondary" className="text-xs">{t("circuit_guide")} : {cityGuides}</Badge>}
                          {cityHotels && <Badge variant="secondary" className="text-xs">{t("circuit_hotel")} : {cityHotels}</Badge>}
                          {cityTransport && <Badge variant="secondary" className="text-xs">{t("circuit_transport")} : {cityTransport}</Badge>}
                        </div>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 mb-5">
                          <div className="rounded-xl border bg-muted/30 p-3">
                            <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wide text-[#EA580C]">
                              <Bus size={14} /> {t("circuit_transport_available")}
                            </div>
                            {cityTrips.length > 0 ? (
                              <div className="space-y-2">
                                {cityTrips.slice(0, 4).map((trip, i) => (
                                  <div key={`${trip.from}-${trip.to}-${trip.time}-${i}`} className="flex items-center justify-between gap-2 rounded-lg bg-card p-2">
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold truncate">
                                        {trip.from} <ArrowRight size={11} className="inline text-[#EA580C]" /> {trip.to}
                                      </p>
                                      <p className="text-[11px] text-muted-foreground truncate">{trip.time} · {trip.company}</p>
                                    </div>
                                    <span className="text-xs font-bold text-[#EA580C] whitespace-nowrap">
                                      {trip.price.toLocaleString()} {t("fcfa")}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">{t("circuit_no_transport")}</p>
                            )}
                          </div>
                          <div className="rounded-xl border bg-muted/30 p-3">
                            <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wide text-[#EA580C]">
                              <Users size={14} /> {t("circuit_guides_available")}
                            </div>
                            {cityGuideList.length > 0 ? (
                              <div className="space-y-2">
                                {cityGuideList.map((g) => (
                                  <div key={g.id} className="flex items-center gap-2 rounded-lg bg-card p-2">
                                    <img src={g.image} alt={g.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold truncate">{g.name}</p>
                                      <p className="text-[11px] text-muted-foreground truncate">{g.specialty}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">{t("circuit_no_guide")}</p>
                            )}
                          </div>
                          <div className="rounded-xl border bg-muted/30 p-3">
                            <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wide text-[#EA580C]">
                              <Hotel size={14} /> {t("circuit_accommodation_available")}
                            </div>
                            {citySiteHotels.length > 0 || cityPartnerHotels.length > 0 || cityNearbyHotels.length > 0 ? (
                              <div className="space-y-2">
                                {citySiteHotels.map((name) => (
                                  <div key={name} className="rounded-lg bg-card p-2">
                                    <p className="text-xs font-bold truncate">{name}</p>
                                  </div>
                                ))}
                                {cityPartnerHotels.map((p) => (
                                  <div key={p.id} className="rounded-lg bg-card p-2">
                                    <p className="text-xs font-bold truncate">{p.name}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                      {p.contract?.roomType || t("circuit_hotel")}
                                      {p.contract?.roomPrice ? ` · ${p.contract.roomPrice.toLocaleString()} ${t("fcfa")}` : ""}
                                    </p>
                                  </div>
                                ))}
                                {cityNearbyHotels.slice(0, 2).map((h) => (
                                  <div key={h.id} className="rounded-lg bg-card p-2">
                                    <p className="text-xs font-bold truncate">{h.name}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                      {h.pricePerNight.toLocaleString()} {t("fcfa")} · {h.rating}{" "}
                                      <Star size={10} className="inline fill-amber-400 text-amber-400" />
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">{t("circuit_no_accommodation")}</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-4">
                          {sites.map((site) => {
                            const guidesHere = guideNamesById(site.guideIds);
                            const hotelsHere = partnerNamesById(site.hotelPartnerIds);
                            const transportHere = partnerNamesById(site.transportPartnerIds);
                            return (
                              <div key={site.id} className="rounded-xl border bg-muted/20 p-3">
                                <h5 className="font-bold text-foreground">{site.name}</h5>
                                <p className="text-sm text-muted-foreground mt-1">{site.desc}</p>
                                <div className="flex flex-wrap gap-2 mt-3 text-xs">
                                  {guidesHere && <Badge variant="outline" className="text-xs">{t("circuit_guide")} : {guidesHere}</Badge>}
                                  {hotelsHere && <Badge variant="outline" className="text-xs">{t("circuit_hotel")} : {hotelsHere}</Badge>}
                                  {transportHere && <Badge variant="outline" className="text-xs">{t("circuit_transport")} : {transportHere}</Badge>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hôtel choisi et hébergements à proximité */}
            {pack.type !== "circuit" && ((pack as any).location || (pack as any).hotelId) && (() => {
              const chosenHotel = (pack as any).hotelId ? HOTELS_NEARBY.find(h => h.id === (pack as any).hotelId) : null;
              const loc = (pack as any).location || chosenHotel?.city || "";
              const nearbyHotels = loc ? HOTELS_NEARBY.filter(h => h.city.toLowerCase() === loc.toLowerCase() && h.id !== chosenHotel?.id) : [];
              if (!chosenHotel && nearbyHotels.length === 0) return null;
              return (
                <div>
                  <h3 className="text-xl font-bold mb-4 text-foreground">{t("accommodation_nearby")}</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {chosenHotel && (
                      <Card className="bg-[#EA580C]/5 border-2 border-[#EA580C] shadow-md">
                        <CardContent className="p-4 flex items-start gap-3">
                          <img src={chosenHotel.image} alt={chosenHotel.name} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#EA580C] uppercase tracking-wider mb-1">{t("accommodation_heading")}</div>
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-sm text-foreground">{chosenHotel.name}</span>
                              <Link href={`/hotel/${chosenHotel.id}`}><ExternalLink size={12} className="text-muted-foreground hover:text-[#EA580C]" /></Link>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-foreground mt-1">
                              <Star size={12} className="fill-amber-400 text-amber-400" /> {chosenHotel.rating}
                            </div>
                            <div className="text-xs text-foreground mt-1 font-semibold">
                              {chosenHotel.pricePerNight.toLocaleString()} {t("fcfa")} / {t("per_night")}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {nearbyHotels.slice(0, 2).map(h => (
                      <Card key={h.id} className="bg-card border-l-4 border-l-[#EA580C]">
                        <CardContent className="p-4 flex items-start gap-3">
                          <img src={h.image} alt={h.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs text-muted-foreground mb-1">{t("accommodation_desc")}</div>
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="font-bold text-sm text-foreground truncate">{h.name}</span>
                              <Link href={`/hotel/${h.id}`} className="shrink-0"><ExternalLink size={12} className="text-muted-foreground hover:text-[#EA580C]" /></Link>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Star size={12} className="fill-amber-400 text-amber-400" /> {h.rating}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {h.pricePerNight.toLocaleString()} {t("fcfa")} / {t("per_night")}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Transport disponible */}
            {pack.type !== "circuit" && (pack as any).location && (() => {
              const tripsHere = getAllTrips().filter(trip => trip.to.toLowerCase() === (pack as any).location.toLowerCase());
              if (tripsHere.length === 0) return null;
              return (
                <div>
                  <h3 className="text-xl font-bold mb-4 text-foreground">{t("easy_transport")}</h3>
                  <div className="space-y-3">
                    {tripsHere.map((trip, i) => {
                      const veh = FLEET.find(f => f.id === trip.vehicle);
                      return (
                        <Card key={i} className="bg-card border-l-4 border-l-[#EA580C]">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                <Bus size={18} className="text-[#EA580C]" />
                              </div>
                              <div>
                                <div className="font-bold text-sm text-foreground">{trip.from} <ArrowRight size={14} className="inline text-[#EA580C]" /> {trip.to}</div>
                                <div className="text-xs text-muted-foreground">{t("departure")} {trip.time} · {veh?.type ?? trip.vehicle}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-[#EA580C] text-sm">{trip.price.toLocaleString()} {t("fcfa")}</div>
                              <div className="text-xs text-muted-foreground">{t("per_person")}</div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Guides touristiques */}
            {pack.type !== "circuit" && guides.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4 text-foreground">{t("your_guides")}</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {guides.map(g => (
                    <Card key={g.id} className="bg-card border border-[#EA580C]/20">
                      <CardContent className="p-4 flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 bg-orange-100">
                          <img src={g.image} alt={g.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-foreground">{g.name}</h4>
                          <Badge variant="outline" className="text-xs mt-1">{g.specialty}</Badge>
                          <p className="text-xs text-muted-foreground mt-2">{g.bio}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Inclus */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-foreground">{t("included_in_pack")}</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {[t("included_guide"), t("included_activities"), t("included_transfers"), t("included_assistance")].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="pt-6 border-t">
              <h3 className="text-xl font-bold mb-4 text-foreground">{t("what_travelers_say")}</h3>
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground text-sm italic">{t("no_reviews_yet")}</p>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className="bg-card p-4 rounded-xl border">
                      <div className="flex items-center gap-3 mb-2">
                        <img src={r.avatar ?? "https://i.pravatar.cc/56?img=0"} alt={r.name} className="w-10 h-10 rounded-full" />
                        <div>
                          <div className="font-bold text-sm">{r.name}</div>
                          <div className="flex gap-0.5">
                            {Array.from({ length: r.rating }).map((_, idx) => (
                              <Star key={idx} size={12} className="fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground italic">"{r.text}"</p>
                    </div>
                  ))
                )}
              </div>

              {canReview && (
                <div className="mt-6 p-5 border rounded-xl bg-muted/30">
                  <h4 className="font-bold text-foreground mb-3">{t("give_review")}</h4>
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setReviewRating(n)}>
                        <Star size={24} className={n <= reviewRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"} />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder={t("share_experience")}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="mb-3"
                  />
                  <Button
                    size="sm"
                    className="bg-[#EA580C] hover:bg-[#C2410C]"
                    disabled={submitting || !reviewText.trim()}
                    onClick={async () => {
                      if (!user) return;
                      setSubmitting(true);
                      const rev = {
                        id: `rev_${Date.now()}`,
                        packId: pack.id,
                        userId: user.id,
                        name: `${user.firstName} ${user.lastName}`,
                        avatar: user.avatar,
                        rating: reviewRating,
                        text: reviewText,
                        createdAt: new Date().toISOString().split("T")[0],
                      };
                      await pushReview(rev);
                      setReviews(prev => [rev, ...prev]);
                      setReviewText("");
                      setReviewRating(5);
                      setSubmitting(false);
                      toast.success(t("thank_review"));
                    }}
                  >
                    {t("publish_review")}
                  </Button>
                </div>
              )}
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:self-start lg:sticky lg:top-24">
            {/* Booking Card */}
            <Card className="border-t-4 border-[#EA580C] shadow-xl bg-card">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-[#EA580C] mb-1">
                  {pack.price.toLocaleString()} {t("fcfa")}
                </div>
                <div className="text-sm text-muted-foreground mb-6">{t("per_person")} / {pack.duration}</div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CalendarDays size={18} className="text-[#EA580C]" />
                    <span>{t("flexible_dates")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Shield size={18} className="text-[#EA580C]" />
                    <span>{t("secure_payment")}</span>
                  </div>
                </div>

                <Button 
                  className="w-full bg-[#EA580C] hover:bg-[#C2410C] py-6 text-lg font-bold"
                  onClick={() => router.push(`/reservation/${pack.id}`)}
                >
                  {pack.type === "circuit" ? t("reserve_circuit") : t("reserve_pack")}
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-3">
                  {t("no_charge_now")}
                </p>
              </CardContent>
            </Card>

            {/* Agency Card */}
            {agency && (
              <Card className="bg-card">
                <CardContent className="p-5 text-center">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{t("proposed_by")}</div>
                  <img src={(agency.userId === user?.id && user?.avatar) || agency.logo} alt={agency.name} className="w-16 h-16 mx-auto rounded-full object-cover ring-2 ring-border mb-3" />
                  <h4 className="font-bold text-lg text-foreground">{agency.name}</h4>
                  <div className="flex justify-center items-center gap-1 text-xs text-muted-foreground mb-2">
                    <MapPin size={12} /> {agency.city}
                  </div>
                  <div className="flex justify-center items-center gap-1 text-sm font-semibold text-[#EA580C] mb-4">
                    <Star size={14} className="fill-[#EA580C]" /> {agency.rating}
                  </div>
                  <Button variant="outline" className="w-full text-xs" onClick={() => {
                    if (!user) { toast.error(t("login_to_contact")); return; }
                    const contactId = (agency as any).userId || agency.id;
                    router.push(`/messages?contact=${contactId}&pack=${pack.id}`);
                  }}>{t("contact_agency")}</Button>
                </CardContent>
              </Card>
            )}
          </div>

        </div>
      </main>

      <DtFooter />
    </div>
  );
}
