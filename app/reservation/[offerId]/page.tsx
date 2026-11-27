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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import {
  getPublicPacks, HOTELS_NEARBY, pushReservation, loadGuides, getAllGuides,
  loadTrips, getAllTrips, loadPartners, getPartnersByAgency,
  type CircuitSite, type GuideData, type PartnerData, type ReservationData, type ReservationCityDetail,
} from "@/src/lib/njangui-data";
import { getCurrentUser, ROLE_REDIRECT, type DtUser } from "@/src/lib/auth-store";
import { downloadTicketPdf, downloadInvoicePdf } from "@/src/lib/pdf-documents";
import { useOffersLoader } from "@/src/hooks/use-offers-loader";
import { toast } from "sonner";
import { CheckCircle2, ChevronRight, ChevronLeft, MapPin, Bus, Hotel, Star, User, X, ExternalLink, Download } from "lucide-react";

/** Champs de tarification propres aux offres créées dans « Mes publications ». */
type Offer = ReturnType<typeof getPublicPacks>[number] & {
  hotelId?: string;
  hotelPartnerId?: string;
  transportPartnerId?: string;
  hotelPartnerIds?: string[];
  transportPartnerIds?: string[];
  guideIds?: string[];
  agencyMargin?: number;
  places?: number;
};

/** Hôtel proposé au touriste : issu d'un partenaire de l'agence qui a publié l'offre. */
type HotelOption = {
  id: string;          // id du partenaire (utilisé aussi par la carte)
  partnerId: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  image?: string;
  rating?: number;
  rooms?: number;
  desc?: string;
  pricePerNight: number; // prix du contrat (FCFA / nuit)
  roomType?: string;
};

/** Trajet proposé au touriste : issu d'un partenaire agence de voyages. */
type TransportOption = {
  id: string;          // `${partner.id}::${trip?.vehicle ?? "default"}`
  partnerId: string;
  company: string;
  from: string;
  to: string;
  time?: string;
  vehicle?: string;
  price: number;       // prix du contrat (FCFA / place)
  label?: string;
  status: string;      // statut du contrat partenaire
};

type CityOptionGroup = {
  city: string;
  hotels: HotelOption[];
  transports: TransportOption[];
  guides: GuideData[];
};

type GuideSiteGroup = {
  id: string;
  name: string;
  city: string;
  guides: GuideData[];
};

type CitySelection = {
  city: string;
  hotel?: HotelOption;
  transport?: TransportOption;
};

function normalizeCity(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function ReservationWorkflow({ params }: { params: Promise<{ offerId: string }> }) {
  useOffersLoader();
  const { t, lang } = useLang();

  const STEPS = [
    { id: 1, title: t("step_travel_details") },
    { id: 2, title: t("step_accommodation_short") },
    { id: 3, title: t("step_transport_short") },
    { id: 4, title: t("step_summary") },
    { id: 5, title: t("step_payment") },
  ];
  const resolvedParams = use(params);
  const router = useRouter();
  const pack = getPublicPacks().find((p) => p.id === resolvedParams.offerId) as Offer | undefined;

  const [step, setStep] = useState(1);
  const [participants, setParticipants] = useState(1);
  const [days, setDays] = useState(1);
  const [dateArrivee, setDateArrivee] = useState("");
  const [dateDepart, setDateDepart] = useState("");
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [cityOptions, setCityOptions] = useState<CityOptionGroup[]>([]);
  const [selectedHotelsByCity, setSelectedHotelsByCity] = useState<Record<string, string | null>>({});
  const [selectedTransportsByCity, setSelectedTransportsByCity] = useState<Record<string, string | null>>({});
  const [guideSites, setGuideSites] = useState<GuideSiteGroup[]>([]);
  const [selectedGuideBySite, setSelectedGuideBySite] = useState<Record<string, string | null>>({});
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [detailHotel, setDetailHotel] = useState<HotelOption | null>(null);
  const [confirmedReservation, setConfirmedReservation] = useState<ReservationData | null>(null);
  const [confirmedUser, setConfirmedUser] = useState<DtUser | null>(null);

  const isCircuit = pack?.type === "circuit";
  const hotelOptions = cityOptions.flatMap(group => group.hotels);
  const transportOptions = cityOptions.flatMap(group => group.transports);
  const guideOptions = guideSites.flatMap(site => site.guides);
  const handleMapHotelSelect = (hotelId: string) => {
    const group = cityOptions.find(option => option.hotels.some(hotel => hotel.id === hotelId));
    if (group) setSelectedHotelsByCity(prev => ({ ...prev, [group.city]: hotelId }));
  };

  useEffect(() => {
    if (!pack) return;
    let cancelled = false;

    Promise.all([loadTrips(), loadGuides(), loadPartners()]).then(() => {
      if (cancelled) return;

      const agencyId = pack.agencyId;
      const partners = getPartnersByAgency(agencyId);
      const allTrips = getAllTrips();
      const allGuides = getAllGuides();
      const sites = pack.sites ?? [];
      const allowedHotelIds = pack.hotelPartnerIds ?? null;
      const allowedTransportIds = pack.transportPartnerIds ?? null;
      const allowedGuideIds = pack.guideIds ?? null;
      const sitesByCity = sites.reduce<Record<string, CircuitSite[]>>((acc, site) => {
        if (!acc[site.city]) acc[site.city] = [];
        acc[site.city].push(site);
        return acc;
      }, {});
      const cityNames = sites.length > 0 ? Object.keys(sitesByCity) : [pack.location ?? ""];

      const groups: CityOptionGroup[] = cityNames.map((city) => {
        const citySites = sitesByCity[city] ?? [];
        const cityKey = normalizeCity(city);
        const siteHotelIds = Array.from(new Set(citySites.flatMap(site => site.hotelPartnerIds ?? [])));
        const siteTransportIds = Array.from(new Set(citySites.flatMap(site => site.transportPartnerIds ?? [])));
        const siteGuideIds = Array.from(new Set(citySites.flatMap(site => site.guideIds ?? [])));
        const hotelIds = sites.length > 0 ? siteHotelIds : allowedHotelIds;
        const transportIds = sites.length > 0 ? siteTransportIds : allowedTransportIds;
        const guideIds = sites.length > 0 ? siteGuideIds : allowedGuideIds;

        const hotels: HotelOption[] = partners
          .filter((partner: PartnerData) => partner.type === "hotelier" && (!hotelIds || hotelIds.includes(partner.id)))
          .map((partner: PartnerData) => {
            const known = HOTELS_NEARBY.find(hotel => normalizeCity(hotel.name) === normalizeCity(partner.name));
            return {
              id: partner.id,
              partnerId: partner.id,
              name: partner.name,
              city: known?.city ?? partner.city,
              lat: known?.lat ?? 4.05,
              lng: known?.lng ?? 9.7,
              image: known?.image,
              rating: known?.rating,
              rooms: known?.rooms,
              desc: known?.desc,
              pricePerNight: Number(partner.contract?.roomPrice ?? known?.pricePerNight ?? 0) || 0,
              roomType: partner.contract?.roomType,
            };
          });

        if (sites.length > 0) {
          HOTELS_NEARBY
            .filter(hotel => normalizeCity(hotel.city) === cityKey && !hotels.some(option => normalizeCity(option.name) === normalizeCity(hotel.name)))
            .forEach(hotel => hotels.push({
              id: `nearby::${hotel.id}`,
              partnerId: hotel.id,
              name: hotel.name,
              city: hotel.city,
              lat: hotel.lat,
              lng: hotel.lng,
              image: hotel.image,
              rating: hotel.rating,
              rooms: hotel.rooms,
              desc: hotel.desc,
              pricePerNight: Number(hotel.pricePerNight) || 0,
            }));

          Array.from(new Set(citySites.map(site => site.hotelName).filter((name): name is string => Boolean(name))))
            .forEach((name) => {
              if (hotels.some(option => normalizeCity(option.name) === normalizeCity(name))) return;
              const known = HOTELS_NEARBY.find(hotel => normalizeCity(hotel.name) === normalizeCity(name));
              const site = citySites.find(item => item.hotelName === name);
              hotels.push({
                id: `site::${site?.id ?? cityKey}::${name}`,
                partnerId: `site::${site?.id ?? cityKey}::${name}`,
                name,
                city,
                lat: site?.lat ?? known?.lat ?? pack.lat,
                lng: site?.lng ?? known?.lng ?? pack.lng,
                image: known?.image,
                rating: known?.rating,
                rooms: known?.rooms,
                desc: known?.desc,
                pricePerNight: Number(known?.pricePerNight ?? 40000) || 40000,
              });
            });
        }

        const transports: TransportOption[] = partners
          .filter((partner: PartnerData) => partner.type === "agence-voyages" && (!transportIds || transportIds.includes(partner.id)))
          .flatMap((partner: PartnerData): TransportOption[] => {
            const matchingTrips = allTrips.filter(trip =>
              trip.company.trim().toLowerCase() === partner.name.trim().toLowerCase() &&
              (normalizeCity(trip.to) === cityKey || normalizeCity(trip.from) === cityKey)
            );
            const unitPrice = Number(partner.contract?.tripPrice ?? 0) || 0;
            if (matchingTrips.length === 0) {
              return [{
                id: `trip::${cityKey}::${partner.id}::default`,
                partnerId: partner.id,
                company: partner.name,
                from: "—",
                to: city,
                price: unitPrice,
                label: partner.contract?.tripLabel,
                status: partner.status,
              }];
            }
            return matchingTrips.map((trip, index) => ({
              id: `trip::${cityKey}::${partner.id}::${index}`,
              partnerId: partner.id,
              company: partner.name,
              from: trip.from,
              to: trip.to,
              time: trip.time,
              vehicle: trip.vehicle,
              price: unitPrice,
              label: partner.contract?.tripLabel,
              status: partner.status,
            }));
          });

        if (sites.length > 0) {
          allTrips
            .filter(trip => normalizeCity(trip.to) === cityKey || normalizeCity(trip.from) === cityKey)
            .forEach((trip, index) => {
              if (transports.some(option =>
                normalizeCity(option.company) === normalizeCity(trip.company) &&
                option.from === trip.from && option.to === trip.to
              )) return;
              transports.push({
                id: `trip::${cityKey}::${trip.company}::${index}`,
                partnerId: `trip::${trip.company}::${index}`,
                company: trip.company,
                from: trip.from,
                to: trip.to,
                time: trip.time,
                vehicle: trip.vehicle,
                price: Number(trip.price) || 0,
                status: "Actif",
              });
            });
        }

        const guides = allGuides.filter(guide => guide.agencyId === agencyId && (!guideIds || guideIds.includes(guide.id)));
        if (sites.length > 0) {
          allGuides
            .filter(guide => normalizeCity(guide.city) === cityKey && !guides.some(item => item.id === guide.id))
            .forEach(guide => guides.push(guide));
        }

        return { city, hotels, transports, guides };
      });

      setCityOptions(groups);

      const guideGroups: GuideSiteGroup[] = sites.length > 0
        ? sites.map(site => {
            const siteGuideIds = Array.from(new Set(site.guideIds ?? []));
            const guides = allGuides
              .filter(guide => siteGuideIds.includes(guide.id))
              .filter((guide, index, list) => list.findIndex(item => item.id === guide.id) === index);
            return { id: site.id, name: site.name, city: site.city, guides };
          })
        : [{
            id: pack.id,
            name: pack.name,
            city: pack.location ?? "",
            guides: allGuides
              .filter(guide => !allowedGuideIds || allowedGuideIds.includes(guide.id))
              .filter((guide, index, list) => list.findIndex(item => item.id === guide.id) === index),
          }];
      setGuideSites(guideGroups);

      const nextHotels: Record<string, string | null> = {};
      const nextTransports: Record<string, string | null> = {};
      const nextSelectedGuides: Record<string, string | null> = {};

      groups.forEach(group => {
        const groupHotelIds = sites.length > 0
          ? Array.from(new Set((sitesByCity[group.city] ?? []).flatMap(site => site.hotelPartnerIds ?? [])))
          : allowedHotelIds;
        const groupTransportIds = sites.length > 0
          ? Array.from(new Set((sitesByCity[group.city] ?? []).flatMap(site => site.transportPartnerIds ?? [])))
          : allowedTransportIds;

        const initialHotel =
          (groupHotelIds ? group.hotels.find(hotel => groupHotelIds.includes(hotel.partnerId)) : null) ||
          group.hotels.find(hotel => hotel.id.startsWith("site::")) ||
          (pack.hotelPartnerId && group.hotels.find(hotel => hotel.partnerId === pack.hotelPartnerId)) ||
          (pack.hotelId && group.hotels.find(hotel => hotel.id === pack.hotelId)) ||
          group.hotels[0] ||
          null;
        const initialTransport =
          (groupTransportIds ? group.transports.find(option => groupTransportIds.includes(option.partnerId)) : null) ||
          (pack.transportPartnerId && group.transports.find(option => option.partnerId === pack.transportPartnerId)) ||
          group.transports.find(option => option.status === "Actif") ||
          group.transports[0] ||
          null;

        nextHotels[group.city] = initialHotel?.id ?? null;
        nextTransports[group.city] = initialTransport?.id ?? null;
      });

      guideGroups.forEach(group => {
        const siteGuideIds = sites.length > 0
          ? Array.from(new Set(sites.find(site => site.id === group.id)?.guideIds ?? []))
          : allowedGuideIds;
        nextSelectedGuides[group.id] = group.guides.find(guide => (siteGuideIds ?? []).includes(guide.id))?.id
          ?? group.guides[0]?.id
          ?? null;
      });

      setSelectedHotelsByCity(nextHotels);
      setSelectedTransportsByCity(nextTransports);
      setSelectedGuideBySite(nextSelectedGuides);

      const parsedDuration = parseInt(String(pack.duration ?? ""), 10);
      if (!Number.isNaN(parsedDuration) && parsedDuration > 0) setDays(parsedDuration);
    });

    return () => { cancelled = true; };
  }, [
    pack?.id, pack?.agencyId, pack?.location, pack?.sites,
    pack?.hotelPartnerId, pack?.transportPartnerId,
    pack?.hotelPartnerIds?.join(","), pack?.transportPartnerIds?.join(","), pack?.guideIds?.join(","),
  ]);

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

  const selectedGuideEntries = guideSites.flatMap(site => {
    const guide = site.guides.find(item => item.id === selectedGuideBySite[site.id]);
    return guide ? [{ site, guide }] : [];
  });
  const chosenGuides = selectedGuideEntries.map(entry => entry.guide);
  const citySelections: CitySelection[] = cityOptions.map(group => ({
    city: group.city,
    hotel: group.hotels.find(hotel => hotel.id === selectedHotelsByCity[group.city]),
    transport: group.transports.find(option => option.id === selectedTransportsByCity[group.city]),
  }));
  const hotelObj = citySelections.find(selection => selection.hotel)?.hotel;
  const selectedMapHotelId = Object.values(selectedHotelsByCity).find(Boolean) ?? null;
  const tripObj = citySelections.find(selection => selection.transport)?.transport;

  const computedDays = dateArrivee && dateDepart
    ? Math.max(1, Math.round((new Date(dateDepart).getTime() - new Date(dateArrivee).getTime()) / (1000 * 60 * 60 * 24)))
    : days;
  const daysPerCity = Math.max(1, Math.round(computedDays / Math.max(1, citySelections.length)));
  const daysPerSite = Math.max(1, Math.round(computedDays / Math.max(1, guideSites.length)));

  const roomCost = citySelections.reduce((sum, selection) =>
    sum + (selection.hotel ? selection.hotel.pricePerNight * daysPerCity : 0), 0);
  const tripCost = citySelections.reduce((sum, selection) =>
    sum + (selection.transport ? selection.transport.price * participants : 0), 0);
  const guideCost = selectedGuideEntries.reduce((sum, entry) =>
    sum + (entry.guide.price ?? 0) * daysPerSite, 0);
  const agencyMargin = Number(pack.agencyMargin ?? pack.price) || 0;
  const totalPrice = roomCost + tripCost + guideCost + agencyMargin;

  const cityDetails: ReservationCityDetail[] = citySelections
    .map(selection => {
      const siteGuides = selectedGuideEntries.filter(entry => entry.site.city === selection.city);
      return {
        city: selection.city,
        hotelName: selection.hotel?.name,
        hotelPrice: selection.hotel ? selection.hotel.pricePerNight * daysPerCity : undefined,
        transportLabel: selection.transport
          ? `${selection.transport.from} → ${selection.transport.to}${selection.transport.time ? ` ${selection.transport.time}` : ""}`
          : undefined,
        transportPrice: selection.transport ? selection.transport.price * participants : undefined,
        transportAgency: selection.transport?.company,
        guideIds: siteGuides.map(entry => entry.guide.id),
        guideNames: siteGuides.map(entry => `${entry.site.name}: ${entry.guide.name}`),
        guidePrice: siteGuides.reduce((sum, entry) => sum + (entry.guide.price ?? 0) * daysPerSite, 0) || undefined,
        siteGuides: siteGuides.map(entry => ({
          site: entry.site.name,
          guideId: entry.guide.id,
          guideName: entry.guide.name,
          days: daysPerSite,
          guidePrice: (entry.guide.price ?? 0) * daysPerSite,
        })),
      };
    })
    .filter(detail => detail.hotelName || detail.transportLabel || (detail.guideNames?.length ?? 0) > 0);

  const handleArrivalDate = (value: string) => {
    setDateArrivee(value);
    if (dateDepart && value && dateDepart < value) setDateDepart("");
  };

  const handleDepartureDate = (value: string) => {
    if (value && value < (dateArrivee || minDate)) return toast.error(t("invalid_dates_error"));
    setDateDepart(value);
  };

  const nextStep = () => {
    if (step === 1) {
      if (!dateArrivee || !dateDepart || participants < 1 || computedDays < 1) return toast.error(t("fill_travel_details_error"));
      if (dateArrivee < minDate || dateDepart < dateArrivee) return toast.error(t("invalid_dates_error"));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(s => Math.min(s + 1, 5));
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const completeReservation = async () => {
    const user = getCurrentUser();
    if (!user) return toast.error(t("login_to_reserve"));
    const ref = `DT-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
    const reservation: ReservationData = {
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
      hotelPrice: roomCost || undefined,
      transportLabel: tripObj
        ? `${tripObj.from} → ${tripObj.to}${tripObj.time ? ` ${tripObj.time}` : ""}`
        : undefined,
      transportPrice: tripCost || undefined,
      transportAgency: tripObj?.company,
      guideId: chosenGuides[0]?.id,
      guideIds: chosenGuides.map(g => g.id),
      guideName: chosenGuides.map(g => g.name).join(", ") || undefined,
      agencyId: pack.agencyId,
      cityDetails,
    };
    await pushReservation(reservation);
    setConfirmedReservation(reservation);
    setConfirmedUser(user);
    toast.success(t("reservation_confirmed"), { description: `${t("ref_label")} ${ref}` });
  };

  const handleDownloadTicket = async () => {
    if (!confirmedReservation) return;
    try {
      await downloadTicketPdf(
        confirmedReservation,
        confirmedUser,
        lang,
        isCircuit ? cityOptions.map(group => group.city).join(" → ") : pack.location,
      );
      toast.success(t("ticket_downloaded"));
    } catch {
      toast.error(t("pdf_error"));
    }
  };

  const handleDownloadInvoice = async () => {
    if (!confirmedReservation) return;
    try {
      await downloadInvoicePdf(confirmedReservation, confirmedUser, lang);
      toast.success(t("invoice_downloaded"));
    } catch {
      toast.error(t("pdf_error"));
    }
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
                          <Input type="date" min={minDate} value={dateArrivee} onChange={e => handleArrivalDate(e.target.value)} />
                        </div>
                        <div>
                          <Label>{t("departure_date_label")}</Label>
                          <Input type="date" min={dateArrivee || minDate} value={dateDepart} onChange={e => handleDepartureDate(e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>{t("participants_label")}</Label>
                          <Input type="number" min={1} max={50} value={participants} onChange={e => setParticipants(Math.min(50, Math.max(1, parseInt(e.target.value, 10) || 1)))} onBlur={() => setParticipants(v => Math.max(1, v))} />
                        </div>
                        <div>
                          <Label>{t("days_label")}</Label>
                          <Input type="number" min={1} max={30} value={computedDays} disabled className="opacity-60" />
                        </div>
                      </div>
                      {isCircuit && (
                        <p className="text-sm italic text-muted-foreground">{t("reservation_circuit_note")}</p>
                      )}
                      {guideOptions.length > 0 ? (
                        <div className="space-y-5">
                          <Label>{t("choose_guide_label")}</Label>
                          {guideSites.filter(site => site.guides.length > 0).map(site => {
                            return (
                              <div key={site.id}>
                                {isCircuit && (
                                  <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-foreground">
                                    <MapPin size={15} className="text-[#EA580C]" /> {site.city} — {site.name}
                                  </div>
                                )}
                                <div className="grid sm:grid-cols-2 gap-3">
                                  {site.guides.map(g => {
                                    const active = selectedGuideBySite[site.id] === g.id;
                                    return (
                                      <Card
                                        key={g.id}
                                        className={`cursor-pointer transition-all overflow-hidden ${
                                          active ? "ring-2 ring-[#EA580C] bg-orange-50/50" : "hover:border-[#EA580C]/50"
                                        }`}
                                        onClick={() => setSelectedGuideBySite(prev => ({ ...prev, [site.id]: active ? null : g.id }))}
                                      >
                                        <CardContent className="p-3 flex items-start gap-3">
                                          <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-orange-100">
                                            <img src={g.image} alt={g.name} className="w-full h-full object-cover" />
                                          </div>
                                          <div className="min-w-0">
                                            <div className="font-bold text-sm text-foreground">{g.name}</div>
                                            <div className="text-xs text-muted-foreground">{g.specialty}</div>
                                            <div className="text-xs font-semibold text-[#EA580C] mt-1">
                                              {(g.price ?? 0).toLocaleString()} {t("fcfa")} / {t("day_short")}
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm italic text-muted-foreground">{t("reservation_no_partner_guides")}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 2: Hébergement (Liste + Carte) */}
                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl font-bold text-foreground">{t("accommodation_heading")}</h2>
                      <Button variant="outline" size="sm" onClick={() => setSelectedHotelsByCity({})}>{t("skip_step")}</Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{t("choose_hotel_desc")}</p>
                    {isCircuit && <p className="text-sm italic text-muted-foreground mb-4">{t("reservation_circuit_note")}</p>}

                    {hotelOptions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Hotel size={32} className="mx-auto mb-2 opacity-40" />
                        <p>{t("reservation_no_partner_hotels")}</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-5">
                          {cityOptions.filter(group => group.hotels.length > 0).map(group => (
                            <div key={group.city}>
                              {isCircuit && (
                                <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-foreground">
                                  <MapPin size={15} className="text-[#EA580C]" /> {group.city}
                                </div>
                              )}
                              <div className="grid sm:grid-cols-2 gap-3">
                                {group.hotels.map(h => (
                                  <Card
                                    key={h.id}
                                    className={`cursor-pointer transition-all overflow-hidden ${
                                      selectedHotelsByCity[group.city] === h.id ? "ring-2 ring-[#EA580C] bg-orange-50/50" : "hover:border-[#EA580C]/50"
                                    }`}
                                    onClick={() => setSelectedHotelsByCity(prev => ({ ...prev, [group.city]: h.id }))}
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
                                        <div className="text-xs text-muted-foreground">{h.city}</div>
                                        {h.roomType && <div className="text-xs text-muted-foreground">{h.roomType}</div>}
                                        {h.rating != null && (
                                          <div className="flex items-center gap-1 mt-1">
                                            <Star size={12} className="fill-amber-400 text-amber-400" />
                                            <span className="text-xs font-semibold">{h.rating}</span>
                                          </div>
                                        )}
                                        <div className="font-bold text-[#EA580C] text-sm mt-1">
                                          {h.pricePerNight.toLocaleString()} {t("fcfa")}
                                          <span className="text-xs text-muted-foreground font-normal"> /{t("night_short")}</span>
                                        </div>
                                      </CardContent>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="h-[400px] rounded-xl overflow-hidden border">
                          <DtMap hotels={hotelOptions} onSelectHotel={handleMapHotelSelect} selectedHotelId={selectedMapHotelId} />
                        </div>
                      </>
                    )}

                    {citySelections.filter(selection => selection.hotel).length > 0 && (
                      <div className="space-y-2">
                        {citySelections.filter(selection => selection.hotel).map(selection => (
                          <div key={selection.city} className="p-4 bg-orange-50 border border-orange-100 rounded-lg flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <Hotel className="text-[#EA580C] shrink-0" />
                              <div className="min-w-0">
                                <div className="font-bold text-foreground truncate">{selection.hotel?.name}</div>
                                <div className="text-xs text-[#EA580C]">{isCircuit ? selection.city : t("hotel_selected")}</div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 shrink-0"
                              onClick={() => setSelectedHotelsByCity(prev => ({ ...prev, [selection.city]: null }))}
                            >
                              {t("remove_btn")}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 3: Transport */}
                {step === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl font-bold text-foreground">{t("transport_heading")}</h2>
                      <Button variant="outline" size="sm" onClick={() => setSelectedTransportsByCity({})}>{t("skip_step")}</Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{t("transport_desc_short")}</p>
                    {isCircuit && <p className="text-sm italic text-muted-foreground mb-4">{t("reservation_circuit_note")}</p>}

                    <div className="space-y-5">
                      {transportOptions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Bus size={32} className="mx-auto mb-2 opacity-40" />
                          <p>{t("reservation_no_partner_transport")}</p>
                          <p className="text-xs mt-1">{t("skip_transport_hint")}</p>
                        </div>
                      ) : cityOptions.filter(group => group.transports.length > 0).map(group => (
                        <div key={group.city} className="space-y-3">
                          {isCircuit && (
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                              <MapPin size={15} className="text-[#EA580C]" /> {group.city}
                            </div>
                          )}
                          {group.transports.map(trip => (
                            <Card
                              key={trip.id}
                              className={`cursor-pointer transition-all ${selectedTransportsByCity[group.city] === trip.id ? 'ring-2 ring-[#EA580C] bg-orange-50/50' : 'hover:border-[#EA580C]/50'}`}
                              onClick={() => setSelectedTransportsByCity(prev => ({ ...prev, [group.city]: trip.id }))}
                            >
                              <CardContent className="p-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-4 min-w-0">
                                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                    <Bus className="text-[#EA580C]" size={18} />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-foreground">
                                      {trip.from !== "—" ? `${trip.from} → ${trip.to}` : (trip.label || trip.to)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{trip.company}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {trip.time ? `${t("departure_time")} ${trip.time} • ` : ""}{t("round_trip_included")}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="font-bold text-[#EA580C]">{trip.price.toLocaleString()} {t("fcfa")}</div>
                                  <div className="text-xs text-muted-foreground">{t("per_person")}</div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
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
                          <li>{t("breakdown_margin")} <strong>{agencyMargin.toLocaleString()} {t("fcfa")}</strong></li>
                        </ul>
                      </div>

                      {isCircuit && cityDetails.length > 0 && (
                        <div className="p-4 border rounded-xl bg-orange-50/50">
                          <div className="flex items-center gap-3 mb-3">
                            <MapPin className="text-[#EA580C]" />
                            <h3 className="font-bold">{t("reservation_by_city")}</h3>
                          </div>
                          <div className="space-y-4">
                            {cityDetails.map(detail => (
                              <div key={detail.city} className="border-l-2 border-[#EA580C]/40 pl-3">
                                <div className="font-bold text-sm text-foreground mb-1">{detail.city}</div>
                                <ul className="text-sm space-y-1 text-muted-foreground">
                                  {detail.hotelName && <li>{t("summary_hotel")} {detail.hotelName}</li>}
                                  {detail.transportLabel && <li>{t("summary_transport")} {detail.transportAgency} — {detail.transportLabel}</li>}
                                  {(detail.guideNames?.length ?? 0) > 0 && <li>{t("summary_guide")} {detail.guideNames?.join(", ")}</li>}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!isCircuit && hotelObj && (
                        <div className="p-4 border rounded-xl bg-orange-50/50">
                          <div className="flex items-center gap-3 mb-2">
                            <Hotel className="text-[#EA580C]" />
                            <h3 className="font-bold">{t("summary_hotel")} {hotelObj.name}</h3>
                          </div>
                          <ul className="text-sm space-y-1 ml-9 text-muted-foreground">
                            <li>{t("summary_location")} {hotelObj.city}</li>
                            {hotelObj.roomType && <li>{hotelObj.roomType}</li>}
                            <li>{t("summary_price_per_night")} {hotelObj.pricePerNight.toLocaleString()} {t("fcfa")}</li>
                            <li className="font-semibold text-[#EA580C]">
                              {t("breakdown_room")} : {roomCost.toLocaleString()} {t("fcfa")}
                            </li>
                          </ul>
                        </div>
                      )}

                      {!isCircuit && tripObj && (
                        <div className="p-4 border rounded-xl bg-orange-50/50">
                          <div className="flex items-center gap-3 mb-2">
                            <Bus className="text-[#EA580C]" />
                            <h3 className="font-bold">{t("summary_transport")} {tripObj.from} → {tripObj.to}</h3>
                          </div>
                          <ul className="text-sm space-y-1 ml-9 text-muted-foreground">
                            <li>{tripObj.company}{tripObj.time ? ` • ${t("departure_time")} ${tripObj.time}` : ""}</li>
                            <li>{t("summary_price_per_person")} {tripObj.price.toLocaleString()} {t("fcfa")}</li>
                            <li className="font-semibold text-[#EA580C]">
                              {t("breakdown_trip")} : {tripCost.toLocaleString()} {t("fcfa")}
                            </li>
                          </ul>
                        </div>
                      )}

                      {!isCircuit && chosenGuides.length > 0 && (
                        <div className="p-4 border rounded-xl bg-orange-50/50">
                          <div className="flex items-center gap-3 mb-2">
                            <User className="text-[#EA580C]" />
                            <h3 className="font-bold">{t("summary_guide")}</h3>
                          </div>
                          <ul className="text-sm space-y-1 ml-9 text-muted-foreground">
                            {chosenGuides.map(g => (
                              <li key={g.id}>
                                {g.name} — {(g.price ?? 0).toLocaleString()} {t("fcfa")}/{t("day_short")}
                              </li>
                            ))}
                            <li className="font-semibold text-[#EA580C]">
                              {t("breakdown_guide")} : {guideCost.toLocaleString()} {t("fcfa")}
                            </li>
                          </ul>
                        </div>
                      )}
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

                    {confirmedReservation && (
                      <Card className="border-green-500/40 bg-green-50/50">
                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-center gap-2 text-green-700 font-bold">
                            <CheckCircle2 size={20} /> {t("reservation_confirmed")}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t("ref_label")} <span className="font-mono font-semibold">{confirmedReservation.ref}</span>
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={handleDownloadTicket}>
                              <Download size={14} className="mr-1" /> {t("download_ticket_pdf")}
                            </Button>
                            <Button variant="outline" onClick={handleDownloadInvoice}>
                              <Download size={14} className="mr-1" /> {t("download_invoice_pdf")}
                            </Button>
                            <Button
                              className="bg-[#EA580C] hover:bg-[#C2410C]"
                              onClick={() => router.push(ROLE_REDIRECT[confirmedUser?.role ?? "tourist"] ?? "/dashboard/tourist")}
                            >
                              {t("go_to_dashboard")}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
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
                    <Button className="bg-green-600 hover:bg-green-700 text-white font-bold px-8" onClick={completeReservation} disabled={!!confirmedReservation}>
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
                  {hotelObj && (
                    <div className="flex justify-between gap-3 text-[#EA580C]">
                      <span>
                        {t("breakdown_room")} ({hotelObj.pricePerNight.toLocaleString()} × {computedDays} {t("night_short")})
                      </span>
                      <span className="font-medium whitespace-nowrap">{roomCost.toLocaleString()} {t("fcfa")}</span>
                    </div>
                  )}

                  {tripObj && (
                    <div className="flex justify-between gap-3 text-[#EA580C]">
                      <span>
                        {t("breakdown_trip")} ({tripObj.price.toLocaleString()} × {participants})
                      </span>
                      <span className="font-medium whitespace-nowrap">{tripCost.toLocaleString()} {t("fcfa")}</span>
                    </div>
                  )}

                  {chosenGuides.length > 0 && (
                    <div className="flex justify-between gap-3 text-[#EA580C]">
                      <span>{t("breakdown_guide")} ({chosenGuides.length} × {daysPerSite} {t("day_short")})</span>
                      <span className="font-medium whitespace-nowrap">{guideCost.toLocaleString()} {t("fcfa")}</span>
                    </div>
                  )}

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">{t("breakdown_margin")}</span>
                    <span className="font-medium whitespace-nowrap">{agencyMargin.toLocaleString()} {t("fcfa")}</span>
                  </div>
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
