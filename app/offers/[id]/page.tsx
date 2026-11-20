"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DtNavbar, DtFooter } from "@/src/components/dt-navbar";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Textarea } from "@/src/components/ui/textarea";
import { getPublicPacks, AGENCIES, HOTELS_NEARBY, FLEET, getReviewsByPack, pushReview, loadSavedReviews, getReservationsByUser, loadGuides, getGuidesByIds, loadTrips, getAllTrips, type GuideData } from "@/src/lib/njangui-data";
import { useOffersLoader } from "@/src/hooks/use-offers-loader";
import { getCurrentUser } from "@/src/lib/auth-store";
import { MapPin, Clock, CalendarDays, Star, Shield, ArrowRight, Bus, Hotel, CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/src/lib/lang";

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

  return (
    <div style={{ fontFamily: "Nunito, sans-serif" }} className="bg-background min-h-screen flex flex-col">
      <DtNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-5 py-8 w-full">
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-2xl overflow-hidden aspect-[16/9] shadow-lg">
              <img src={pack.image} alt={pack.name} className="w-full h-full object-cover" />
            </div>

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

            {/* Hôtel choisi et hébergements à proximité */}
            {((pack as any).location || (pack as any).hotelId) && (() => {
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
            {((pack as any).location) && (() => {
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
            {guides.length > 0 && (
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
                  {t("reserve_pack")}
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
