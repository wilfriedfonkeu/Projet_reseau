"use client";

import { use, useState, useEffect } from "react";
import { useLang } from "@/src/lib/lang";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DtNavbar, DtFooter } from "@/src/components/dt-navbar";
import { DtMap } from "@/src/components/dt-map";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { getPublicPacks, HOTELS_NEARBY, pushReservation, loadSavedReservations, loadGuides, getAllGuides, loadTrips, getAllTrips, type GuideData } from "@/src/lib/njangui-data";
import { getCurrentUser } from "@/src/lib/auth-store";
import { useOffersLoader } from "@/src/hooks/use-offers-loader";
import { toast } from "sonner";
import { CheckCircle2, ChevronRight, ChevronLeft, MapPin, Bus, Hotel, Star, User, X, ExternalLink } from "lucide-react";

export default function ReservationWorkflow({ params }: { params: Promise<{ offerId: string }> }) {
  useOffersLoader();
  const { t } = useLang();

  const STEPS = [
    { id: 1, title: t("step_travel_details") },
    { id: 2, title: t("step_accommodation_short") },
    { id: 3, title: t("step_transport_short") },
    { id: 4, title: t("step_summary") },
    { id: 5, title: t("step_payment") },
  ];
  const resolvedParams = use(params);
  const router = useRouter();
  const pack = getPublicPacks().find((p) => p.id === resolvedParams.offerId);

  const [step, setStep] = useState(1);
  const [participants, setParticipants] = useState(1);
  const [days, setDays] = useState(1);
  const [date, setDate] = useState("");
  const [dateArrivee, setDateArrivee] = useState("");
  const [dateDepart, setDateDepart] = useState("");
  
  const [selectedHotel, setSelectedHotel] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [availableGuides, setAvailableGuides] = useState<GuideData[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);
  const [detailHotel, setDetailHotel] = useState<typeof HOTELS_NEARBY[0] | null>(null);

  useEffect(() => {
    if (!pack) return;
    loadTrips();
    loadGuides().then(() => {
      const agencyId = (pack as any)?.agencyId;
      if (agencyId) {
        setAvailableGuides(getAllGuides().filter(g => g.agencyId === agencyId));
      }
    });
  }, [pack?.id]);

  if (!pack) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <DtNavbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center"><p>{t("offer_not_found_short")}</p></Card>
        </div>
        <DtFooter />
      </div>
    );
  }

  const hotelObj = HOTELS_NEARBY.find(h => h.id === selectedHotel);
  const tripsToDest = getAllTrips().filter(t => t.to.toLowerCase() === (pack as any).location?.toLowerCase());
  const tripObj = tripsToDest.find(t => t.vehicle === selectedTrip);

  // Calculate total price
  const computedDays = dateArrivee && dateDepart
    ? Math.max(1, Math.round((new Date(dateDepart).getTime() - new Date(dateArrivee).getTime()) / (1000 * 60 * 60 * 24)))
    : days;
  const basePrice = pack.price * participants * computedDays;
  const hotelPrice = hotelObj ? hotelObj.pricePerNight * computedDays * participants : 0;
  const transportPrice = tripObj ? tripObj.price * participants * 2 : 0;
  const totalPrice = basePrice + hotelPrice + transportPrice;

  const nextStep = () => {
    if (step === 1 && (!dateArrivee || !dateDepart || participants < 1 || computedDays < 1)) return toast.error(t("fill_travel_details_error"));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(s => Math.min(s + 1, 5));
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const completeReservation = async () => {
    const user = getCurrentUser();
    if (!user) return toast.error(t("login_to_reserve"));
    const ref = `DT-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
    await pushReservation({
      ref,
      packId: pack.id,
      packName: pack.name,
      userId: user.id,
      dates: dateArrivee && dateDepart ? `${dateArrivee} → ${dateDepart}` : "À définir",
      status: "Confirmée",
      participants,
      days: computedDays,
      totalPrice,
      createdAt: new Date().toISOString().split("T")[0],
      hotelName: hotelObj?.name,
      hotelPrice: hotelObj ? hotelObj.pricePerNight * computedDays * participants : undefined,
      transportLabel: tripObj ? `${tripObj.from} → ${tripObj.to} ${tripObj.time}` : undefined,
      transportPrice: tripObj ? tripObj.price * participants * 2 : undefined,
      transportAgency: tripObj?.company,
      guideId: selectedGuide ?? undefined,
      guideName: selectedGuide ? availableGuides.find(g => g.id === selectedGuide)?.name : undefined,
    });
    toast.success(t("reservation_confirmed"), { description: `${t("ref_label")} ${ref}` });
    setTimeout(() => router.push("/dashboard/tourist"), 1500);
  };

  return (
    <div style={{ fontFamily: "Nunito, sans-serif" }} className="bg-background min-h-screen flex flex-col">
      <DtNavbar />

      <main className="flex-1 max-w-5xl mx-auto px-5 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t("reservation_title")} {pack.name}
          </h1>
          <p className="text-muted-foreground">{t("reservation_desc")}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-0 h-1 bg-[#EA580C] -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
          <div className="flex justify-between relative z-10">
            {STEPS.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  s.id < step ? "bg-[#EA580C] text-white" :
                  s.id === step ? "bg-[#EA580C] text-white ring-4 ring-[#EA580C]/30" :
                  "bg-white border-2 border-border text-muted-foreground"
                }`}>
                  {s.id < step ? <CheckCircle2 size={16} /> : s.id}
                </div>
                <span className={`text-xs font-semibold hidden md:block ${s.id <= step ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Main Form Area */}
          <div className="md:col-span-2">
            <Card className="border-t-4 border-[#EA580C] shadow-lg">
              <CardContent className="p-6">
                
                {/* STEP 1: Dates & Participants & Guide */}
                {step === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <h2 className="text-xl font-bold text-foreground mb-4">{t("travel_details_heading")}</h2>
                      <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>{t("arrival_date_label")}</Label>
                          <Input type="date" value={dateArrivee} onChange={e => setDateArrivee(e.target.value)} />
                        </div>
                        <div>
                          <Label>{t("departure_date_label")}</Label>
                          <Input type="date" value={dateDepart} onChange={e => setDateDepart(e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>{t("participants_label")}</Label>
                          <Input type="number" min={1} max={50} value={participants} onChange={e => setParticipants(Math.max(1, parseInt(e.target.value) || 1))} />
                        </div>
                        <div>
                          <Label>{t("days_label")}</Label>
                          <Input type="number" min={1} max={30} value={computedDays} disabled className="opacity-60" />
                        </div>
                      </div>
                      {availableGuides.length > 0 && (
                        <div>
                          <Label>{t("choose_guide_label")}</Label>
                          <div className="grid sm:grid-cols-2 gap-3 mt-2">
                            {availableGuides.map(g => (
                              <Card
                                key={g.id}
                                className={`cursor-pointer transition-all overflow-hidden ${
                                  selectedGuide === g.id ? "ring-2 ring-[#EA580C] bg-orange-50/50" : "hover:border-[#EA580C]/50"
                                }`}
                                onClick={() => setSelectedGuide(g.id)}
                              >
                                <CardContent className="p-3 flex items-start gap-3">
                                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-orange-100">
                                    <img src={g.image} alt={g.name} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-sm text-foreground">{g.name}</div>
                                    <div className="text-xs text-muted-foreground">{g.specialty}</div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 2: Hébergement (Liste + Carte) */}
                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl font-bold text-foreground">{t("accommodation_heading")}</h2>
                      <Button variant="outline" size="sm" onClick={() => setSelectedHotel(null)}>{t("skip_step")}</Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{t("choose_hotel_desc")}</p>

                    {/* Hotel List */}
                    <div className="grid sm:grid-cols-2 gap-3">
                      {HOTELS_NEARBY.map((h) => (
                        <Card
                          key={h.id}
                          className={`cursor-pointer transition-all overflow-hidden ${
                            selectedHotel === h.id ? "ring-2 ring-[#EA580C] bg-orange-50/50" : "hover:border-[#EA580C]/50"
                          }`}
                          onClick={() => setSelectedHotel(h.id)}
                          onDoubleClick={() => setDetailHotel(h)}
                        >
                          <div className="flex">
                            {h.image && (
                              <div className="w-24 h-24 shrink-0">
                                <img src={h.image} alt={h.name} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <CardContent className="p-3 flex-1 min-w-0">
                              <span className="font-bold text-sm text-foreground truncate">{h.name}</span>
                              <Link href={`/hotel/${h.id}`} className="inline ml-1 shrink-0"><ExternalLink size={12} className="text-muted-foreground hover:text-[#EA580C]" /></Link>
                              <div className="text-xs text-muted-foreground">{h.city}</div>
                              <div className="flex items-center gap-1 mt-1">
                                <Star size={12} className="fill-amber-400 text-amber-400" />
                                <span className="text-xs font-semibold">{h.rating}</span>
                              </div>
                              <div className="font-bold text-[#EA580C] text-sm mt-1">{h.pricePerNight.toLocaleString()} {t("fcfa")} <span className="text-xs text-muted-foreground font-normal">/nuit</span></div>
                            </CardContent>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Map */}
                    <div className="h-[400px] rounded-xl overflow-hidden border">
                      <DtMap hotels={HOTELS_NEARBY} onSelectHotel={setSelectedHotel} selectedHotelId={selectedHotel} />
                    </div>

                    {selectedHotel && (
                      <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Hotel className="text-[#EA580C]" />
                          <div>
                          <div className="flex items-center gap-1">
                            <div className="font-bold text-foreground">{HOTELS_NEARBY.find(h => h.id === selectedHotel)?.name}</div>
                            <Link href={`/hotel/${selectedHotel}`}><ExternalLink size={12} className="text-muted-foreground hover:text-[#EA580C]" /></Link>
                          </div>
                            <div className="text-xs text-[#EA580C]">{t("hotel_selected")}</div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => setSelectedHotel(null)}>
                          {t("remove_btn")}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 3: Transport */}
                {step === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl font-bold text-foreground">{t("transport_heading")}</h2>
                      <Button variant="outline" size="sm" onClick={() => setSelectedTrip(null)}>{t("skip_step")}</Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{t("transport_desc_short")}</p>
                    
                    <div className="space-y-3">
                      {tripsToDest.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Bus size={32} className="mx-auto mb-2 opacity-40" />
                          <p>{t("no_transport_available")}</p>
                          <p className="text-xs mt-1">{t("skip_transport_hint")}</p>
                        </div>
                      ) : tripsToDest.map((trip, i) => (
                        <Card 
                          key={i} 
                          className={`cursor-pointer transition-all ${selectedTrip === trip.vehicle ? 'ring-2 ring-[#EA580C] bg-orange-50/50' : 'hover:border-[#EA580C]/50'}`}
                          onClick={() => setSelectedTrip(trip.vehicle)}
                        >
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                <Bus className="text-[#EA580C]" size={18} />
                              </div>
                              <div>
                                <div className="font-bold text-foreground">{trip.from} → {trip.to}</div>
                                <div className="text-xs text-muted-foreground">{trip.company}</div>
                                <div className="text-sm text-muted-foreground">{t("departure_time")} {trip.time} • {t("round_trip_included")}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-[#EA580C]">{(trip.price * 2).toLocaleString()} {t("fcfa")}</div>
                              <div className="text-xs text-muted-foreground">{t("per_person")}</div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 4: Récapitulatif */}
                {step === 4 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <h2 className="text-xl font-bold text-foreground mb-4">{t("summary_heading")}</h2>
                    
                    <div className="space-y-4">
                      <div className="p-4 border rounded-xl bg-background">
                        <div className="flex items-center gap-3 mb-2">
                          <MapPin className="text-[#EA580C]" />
                          <h3 className="font-bold">{t("summary_pack")} {pack.name}</h3>
                        </div>
                        <ul className="text-sm space-y-1 ml-9 text-muted-foreground">
                          <li>{t("summary_date")} <strong>{dateArrivee && dateDepart ? `${dateArrivee} → ${dateDepart}` : t("summary_not_specified")}</strong></li>
                          <li>{t("summary_participants")} <strong>{participants} {t("summary_person")}</strong></li>
                          <li>{t("summary_duration")} <strong>{computedDays} {computedDays > 1 ? t("summary_days") : t("summary_day")}</strong></li>
                          <li>{t("summary_unit_price")} {pack.price.toLocaleString()} {t("fcfa")}</li>
                        </ul>
                      </div>

                      {hotelObj && (
                        <div className="p-4 border rounded-xl bg-orange-50/50">
                          <div className="flex items-center gap-3 mb-2">
                            <Hotel className="text-[#EA580C]" />
                            <h3 className="font-bold">{t("summary_hotel")} {hotelObj.name}</h3>
                            <Link href={`/hotel/${hotelObj.id}`} className="ml-1"><ExternalLink size={12} className="text-muted-foreground hover:text-[#EA580C]" /></Link>
                          </div>
                          <ul className="text-sm space-y-1 ml-9 text-muted-foreground">
                            <li>{t("summary_location")} {hotelObj.city}</li>
                            <li>{t("summary_price_per_night")} {hotelObj.pricePerNight.toLocaleString()} {t("fcfa")}</li>
                          </ul>
                        </div>
                      )}

                      {tripObj && (
                        <div className="p-4 border rounded-xl bg-orange-50/50">
                          <div className="flex items-center gap-3 mb-2">
                            <Bus className="text-[#EA580C]" />
                            <h3 className="font-bold">{t("summary_transport")} {tripObj.from} → {tripObj.to}</h3>
                          </div>
                          <ul className="text-sm space-y-1 ml-9 text-muted-foreground">
                            <li>{t("summary_departure")} {tripObj.time} ({t("round_trip_included")})</li>
                            <li>{t("summary_price_per_person")} {(tripObj.price * 2).toLocaleString()} {t("fcfa")}</li>
                          </ul>
                        </div>
                      )}

                      {selectedGuide && (() => {
                        const guide = availableGuides.find(g => g.id === selectedGuide);
                        if (!guide) return null;
                        return (
                          <div className="p-4 border rounded-xl bg-orange-50/50">
                            <div className="flex items-center gap-3 mb-2">
                              <User className="text-[#EA580C]" />
                              <h3 className="font-bold">{t("summary_guide")} {guide.name}</h3>
                            </div>
                            <ul className="text-sm space-y-1 ml-9 text-muted-foreground">
                              <li>{t("summary_guide_specialty")} {guide.specialty}</li>
                            </ul>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* STEP 5: Paiement */}
                {step === 5 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <h2 className="text-xl font-bold text-foreground mb-4">{t("payment_heading")}</h2>
                    
                    <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
                      <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="card">{t("tab_card")}</TabsTrigger>
                        <TabsTrigger value="om">{t("tab_om")}</TabsTrigger>
                        <TabsTrigger value="momo">{t("tab_momo")}</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="card" className="space-y-4">
                        <div><Label>{t("card_number_label")}</Label><Input placeholder={t("card_number_placeholder")} /></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><Label>{t("expiry_label")}</Label><Input placeholder={t("expiry_placeholder")} /></div>
                          <div><Label>{t("cvc_label")}</Label><Input placeholder={t("cvc_placeholder")} /></div>
                        </div>
                        <div><Label>{t("card_name_label")}</Label><Input placeholder={t("card_name_placeholder")} /></div>
                      </TabsContent>

                      <TabsContent value="om" className="space-y-4">
                        <div><Label>{t("om_phone_label")}</Label><Input placeholder={t("om_phone_placeholder")} /></div>
                        <p className="text-sm text-muted-foreground">{t("om_ussd_hint")}</p>
                      </TabsContent>

                      <TabsContent value="momo" className="space-y-4">
                        <div><Label>{t("momo_phone_label")}</Label><Input placeholder={t("momo_phone_placeholder")} /></div>
                        <p className="text-sm text-muted-foreground">{t("momo_ussd_hint")}</p>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t">
                  <Button variant="outline" onClick={prevStep} disabled={step === 1}>
                    <ChevronLeft size={16} className="mr-1" /> {t("back_btn")}
                  </Button>
                  
                  {step < 5 ? (
                    <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={nextStep}>
                      {t("continue_btn")} <ChevronRight size={16} className="ml-1" />
                    </Button>
                  ) : (
                    <Button className="bg-green-600 hover:bg-green-700 text-white font-bold px-8" onClick={completeReservation}>
                      {t("pay_btn")} {totalPrice.toLocaleString()} {t("fcfa")}
                    </Button>
                  )}
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Sidebar Summary */}
          <div className="md:col-span-1">
            <Card className="sticky top-24 bg-background border-none shadow-md">
              <CardContent className="p-5">
                <h3 className="font-bold text-foreground mb-4 border-b pb-2">{t("price_detail_heading")}</h3>
                
                <div className="space-y-3 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("pack_line")} ({participants}x)</span>
                    <span className="font-medium">{basePrice.toLocaleString()} {t("fcfa")}</span>
                  </div>
                  
                  {hotelObj && (
                    <div className="flex justify-between text-[#EA580C]">
                      <span>{t("hotel_line")} ({computedDays} {computedDays > 1 ? t("summary_days") : t("summary_day")} x {participants})</span>
                      <span className="font-medium">+{hotelPrice.toLocaleString()} {t("fcfa")}</span>
                    </div>
                  )}

                  {tripObj && (
                    <div className="flex justify-between text-[#EA580C]">
                      <span>{t("transport_line")} (A/R x {participants})</span>
                      <span className="font-medium">+{transportPrice.toLocaleString()} {t("fcfa")}</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">{t("total_label")}</span>
                    <span className="font-bold text-xl text-[#EA580C]">{totalPrice.toLocaleString()} {t("fcfa")}</span>
                  </div>
                  <p className="text-right text-xs text-muted-foreground mt-1">{t("taxes_included")}</p>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>

      <DtFooter />

      {/* Modal détail hôtel */}
      {detailHotel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetailHotel(null)}>
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {detailHotel.image && (
              <div className="w-full h-48 overflow-hidden">
                <img src={detailHotel.image} alt={detailHotel.name} className="w-full h-full object-cover" />
              </div>
            )}
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{detailHotel.name}</h3>
                  <p className="text-sm text-muted-foreground">{detailHotel.city}</p>
                </div>
                <button onClick={() => setDetailHotel(null)} className="p-1 rounded hover:bg-accent"><X size={20} /></button>
              </div>
              {detailHotel.desc && <p className="text-sm text-foreground leading-relaxed">{detailHotel.desc}</p>}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1"><Star size={14} className="fill-amber-400 text-amber-400" /><span className="font-semibold">{detailHotel.rating}</span></div>
                <div><span className="text-muted-foreground">{detailHotel.rooms} chambres</span></div>
                <div className="font-bold text-[#EA580C]">{detailHotel.pricePerNight.toLocaleString()} {t("fcfa")} /nuit</div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setDetailHotel(null)}>{t("modal_close")}</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
