// ============================================================
// Njangui — Données de démonstration
// ============================================================

export interface IdDocument {
  type: "cni" | "passport";
  number: string;
  fileUrl: string;
}

export interface GuideData {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  promise: string;
  image: string;
  city: string;
  agencyId: string;
  idDocument?: IdDocument | null;
  photo?: string;
  paymentMethod?: string;
  commission?: number;
  price?: number; // tarif journalier du guide (FCFA), fixé lors du contrat
  userId?: string; // compte utilisateur associé (messagerie)
}

const GUIDES_FALLBACK: GuideData[] = [
  { id: "g1", name: "Alphonse Obama", specialty: "Pirogue, oiseaux, contes Beti", bio: "Poète, conteur et amoureux du fleuve Nyong, Alphonse rame sur ces eaux depuis son enfance.", promise: "Glissez avec moi sur les eaux miroirs du Nyong.", image: "/images/guides/alphonse-obama.avif", city: "Mbalmayo", agencyId: "ag1" },
  { id: "g2", name: "Christian Kolo", specialty: "Survie en forêt, primates, écologie", bio: "Ingénieur des eaux et forêts passionné de conservation.", promise: "Nous marcherons sur les traces des géants de la forêt.", image: "/images/guides/christian-kolo.jpg", city: "Yaoundé", agencyId: "ag1" },
  { id: "g3", name: "David Kapsiki", specialty: "Géologie volcanique, artisanat, rituels", bio: "Enfant des Monts Mandara, chasseur d'images et grand humaniste.", promise: "Je vous emmène voir le soleil se lever derrière le pic de Roumsiki.", image: "/images/guides/david-kapsiki.jpg", city: "Roumsiki", agencyId: "ag4" },
  { id: "g4", name: "Ibrahim Njoya", specialty: "Histoire Bamoun, symbolique, architecture royale", bio: "Historien de formation et descendant lointain de la lignée royale.", promise: "Je vous ouvrirai les portes du temps.", image: "/images/guides/ibrahim-njoya.jpg", city: "Foumban", agencyId: "ag3" },
  { id: "g5", name: "Jean-Marie Ngalame", specialty: "Photo nature, ethnobotanique, cascades", bio: "Éco-guide passionné de nature sauvage et de cinéma.", promise: "Je vous guiderai au plus près du grondement de l'eau.", image: "/images/guides/jean-marie-ngalame.avif", city: "Nkongsamba", agencyId: "ag3" },
  { id: "g6", name: "Maelis Ndame", specialty: "Navigation côtière, gastronomie, rituels de l'eau", bio: "Originaire de la communauté Batanga, profondément connectée au fleuve et à l'océan.", promise: "Je vous emmène là où le fleuve embrasse la mer.", image: "/images/guides/maelis-ndame.avif", city: "Kribi", agencyId: "ag1" },
  { id: "g7", name: "Ousmane Boukar", specialty: "Safari, pistage, ornithologie", bio: "15 ans d'expérience comme pisteur et guide de safari.", promise: "Suivez-moi, je vous promets de croiser le regard du Roi de la forêt.", image: "/images/guides/ousmane-boukar.avif", city: "Maroua", agencyId: "ag4" },
  { id: "g8", name: "Saliou Bakari", specialty: "Trekking équestre, culture Bororo, légendes", bio: "Guide de randonnée issu du peuple nomade Bororo.", promise: "Je vous ferai chevaucher à travers la brume des cratères.", image: "/images/guides/saliou-bakari.avif", city: "Nkongsamba", agencyId: "ag3" },
  { id: "g9", name: "Samuel Ewome", specialty: "Volcanologie, haute altitude, contes Bakweri", bio: "Plus de 80 ascensions du Mont Cameroun à son actif.", promise: "Avec moi, vous apprendrez à écouter les secrets du volcan.", image: "/images/guides/samuel-ewome.avif", city: "Buea", agencyId: "ag1" },
  { id: "g10", name: "Sandra Bella", specialty: "Excursions marines, sports nautiques, histoire coloniale", bio: "Guide spécialisée dans le tourisme balnéaire et les sports nautiques.", promise: "Je vous garantis un séjour déconnecté.", image: "/images/guides/sandra-sea-bella.avif", city: "Limbé", agencyId: "ag1" },
  { id: "g11", name: "Pierre Ekwé", specialty: "Trekking haute montagne, volcanologie", bio: "Guide de haute montagne certifié, spécialiste du Mont Cameroun.", promise: "Je vous mènerai au sommet du toit de l'Afrique.", image: "/images/guides/samuel-ewome.avif", city: "Buea", agencyId: "ag2" },
  { id: "g12", name: "Estelle Manga", specialty: "Botanique, randonnée, photographie", bio: "Biologiste passionnée par la flore des montagnes camerounaises.", promise: "Chaque plante a une histoire à raconter.", image: "/images/guides/jean-marie-ngalame.avif", city: "Buea", agencyId: "ag2" },
  { id: "g13", name: "Roger Mbida", specialty: "Spéléologie, canyoning, cascades", bio: "Explorateur des grottes et canyons de l'Ouest Cameroun.", promise: "Je vous ferai découvrir les secrets cachés derrière chaque cascade.", image: "/images/guides/christian-kolo.jpg", city: "Nkongsamba", agencyId: "ag2" },
];

let _guidesCache: GuideData[] | null = null;

export async function loadGuides(): Promise<GuideData[]> {
  if (_guidesCache) return _guidesCache;
  try {
    const res = await fetch("/api/guides");
    _guidesCache = await res.json();
    if (!Array.isArray(_guidesCache)) _guidesCache = GUIDES_FALLBACK;
    return _guidesCache;
  } catch {
    _guidesCache = GUIDES_FALLBACK;
    return _guidesCache;
  }
}

export function getGuidesByAgency(agencyId: string): GuideData[] {
  return (_guidesCache ?? []).filter(g => g.agencyId === agencyId);
}

export function getGuideById(id: string): GuideData | undefined {
  return (_guidesCache ?? []).find(g => g.id === id);
}

export function getGuidesByIds(ids: string[]): GuideData[] {
  return (_guidesCache ?? []).filter(g => ids.includes(g.id));
}

export function getAllGuides(): GuideData[] {
  return _guidesCache ?? [];
}

export const COMMISSION_RATE = 0.1; // 10%

// --- Agences partenaires ---
export const AGENCIES = [
  { id: "ag1", userId: "usr_020", name: "Évasion Cameroun", city: "Douala", rating: 4.8, desc: "Spécialiste des séjours balnéaires sur la côte atlantique.", logo: "https://i.pravatar.cc/64?img=1", slug: "evasion-cm" },
  { id: "ag2", userId: "usr_021", name: "Mont Aventure", city: "Yaoundé", rating: 4.6, desc: "Circuits nature et randonnées dans les hauts plateaux.", logo: "https://i.pravatar.cc/64?img=2", slug: "mont-aventure" },
  { id: "ag3", name: "Wouri Voyages", city: "Douala", rating: 4.5, desc: "Découverte du patrimoine culturel et historique du Cameroun.", logo: "https://i.pravatar.cc/64?img=3", slug: "wouri-voyages" },
  { id: "ag4", userId: "usr_022", name: "Afrique Sauvage", city: "Garoua", rating: 4.9, desc: "Safaris et parcs nationaux du Grand Nord camerounais.", logo: "https://i.pravatar.cc/64?img=4", slug: "afrique-sauvage" },
  { id: "ag5", name: "Kribi Plages Découverte", city: "Kribi", rating: 4.7, desc: "Escapades balnéaires et sports nautiques à Kribi.", logo: "https://i.pravatar.cc/64?img=7", slug: "kribi-plages" },
  { id: "ag6", name: "Express Inter-Cités", city: "Douala", rating: 4.4, desc: "Transport inter-urbain rapide et confortable partout au Cameroun.", logo: "https://i.pravatar.cc/64?img=8", slug: "express-cites" },
];

// --- Packs touristiques ---
export interface CircuitSite {
  id: string;
  name: string;
  city: string;
  desc: string;
  image?: string;
  lat?: number;
  lng?: number;
  guideIds?: string[];
  hotelPartnerIds?: string[];
  hotelName?: string;
  transportPartnerIds?: string[];
}

export type PackItem = {
  id: string;
  location: string;
  lat: number;
  lng: number;
  name: string;
  category: string;
  price: number;
  duration: string;
  desc: string;
  image: string;
  agencyId: string;
  type?: "circuit";
  hotelId?: string;
  images?: string[];
  guideIds?: string[];
  hotelPartnerId?: string;
  transportPartnerId?: string;
  hotelPartnerIds?: string[];
  transportPartnerIds?: string[];
  agencyMargin?: number;
  places?: number;
  sites?: CircuitSite[];
};

export interface Circuit extends PackItem {
  type: "circuit";
  sites: CircuitSite[];
}

export const PACKS: PackItem[] = [
  { id: "p2", location: "Buea", lat: 4.1581, lng: 9.2625, name: "Mont Cameroun Trek", category: "Aventure", price: 320000, duration: "4 jours", desc: "Ascension du toit de l'Afrique de l'Ouest avec guide certifié.", image: "/images/mont-cameroun/mont cameroun.jpg", agencyId: "ag2", hotelId: "h23" },
  { id: "p3", location: "Yaoundé", lat: 3.8667, lng: 11.5167, name: "Yaoundé Luxe", category: "Luxe", price: 540000, duration: "5 jours", desc: "Hôtels 5 étoiles, musées et gastronomie camerounaise.", image: "/images/site-ebogo/Site touristique d'ebogo 1.jpg", agencyId: "ag2" },
  { id: "p4", location: "Limbe", lat: 4.0178, lng: 9.2063, name: "Limbe & Volcan", category: "Aventure", price: 260000, duration: "3 jours", desc: "Plage de sable noir volcanique et collines verdoyantes.", image: "/images/plages/down-beach/down-beach.jpg", agencyId: "ag1", hotelId: "h20" },
  { id: "p5", location: "Maroua", lat: 10.5953, lng: 14.3247, name: "Safari Grand Nord", category: "Aventure", price: 450000, duration: "6 jours", desc: "Parc national de Waza et faune sauvage africaine.", image: "/images/parc-waza/Parc National de Waza 1.jpg", agencyId: "ag4", hotelId: "h18" },
  { id: "p6", location: "Bafoussam", lat: 5.4772, lng: 10.4178, name: "Bafoussam & Artisanat", category: "Détente", price: 195000, duration: "2 jours", desc: "Hauts plateaux de l'Ouest et villages artisanaux.", image: "/images/lacs-manengouba/Lacs Manengouba 1.jpg", agencyId: "ag3" },
  { id: "p7", location: "Nkongsamba", lat: 4.9570, lng: 9.9408, name: "Chute d'Ekom Nkam", category: "Aventure", price: 150000, duration: "1 jour", desc: "La Chute d'Ekom Nkam incarne la puissance brute de la nature dans ce qu'elle a de plus sauvage et de plus théâtral. Nichée au cœur d'une forêt tropicale d'un vert émeraude presque irréel, cette cascade monumentale plonge verticalement de plus de 80 mètres dans un gouffre impressionnant, libérant un grondement sourd et une brume éternelle qui enveloppe la canopée. Ce décor digne des plus grands films d'aventure plonge instantanément le visiteur dans une atmosphère mystique, où l'on se sent infiniment petit face à la splendeur des éléments.", image: "/images/chute-ekom-nkam/Chute d'Ekom Nkam 2.jpg", agencyId: "ag2", hotelId: "h24", images: ["/images/chute-ekom-nkam/Chute d'Ekom Nkam 1.jpg"] },
  { id: "p8", location: "Kribi", lat: 2.9395, lng: 9.9104, name: "Chutes de la Lobé", category: "Détente", price: 120000, duration: "1 jour", desc: "Les chutes de la Lobé créent un phénomène naturel d'une rareté absolue à travers le monde, qui pétrifie d'admiration dès le premier regard. Imaginez un fleuve puissant qui, au terme de sa course à travers la jungle, se jette directement dans les eaux tumultueuses de l'océan Atlantique par une série de cascades grondantes de près de vingt mètres de hauteur. Le contraste entre le sable doré de la plage, la fraîcheur des chutes d'eau douce et l'immensité de l'eau salée offre un tableau féerique unique, particulièrement magique lors du coucher du soleil.", image: "/images/chutes-lobe/Chutes de la Lobé 2.jpg", agencyId: "ag1", hotelId: "h14", images: ["/images/chutes-lobe/Chutes de la Lobé 1.jpg", "/images/chutes-lobe/Chutes de la Lobé 3.jpg", "/images/chutes-lobe/Chutes de la Lobé 4.jpg", "/images/chutes-lobe/Chutes de la Lobé 5.jpg"], guideIds: ["g6", "g9"] },
  { id: "p9", location: "Nkongsamba", lat: 4.9570, lng: 9.9408, name: "Lacs Manengouba", category: "Détente", price: 250000, duration: "2 jours", desc: "Les Lacs Manengouba, nichés au sommet du Mont Manengouba, offrent une vision d'une sérénité si parfaite qu'elle semble surnaturelle. Logés au fond de la caldeira d'un volcan éteint à l'ambiance souvent caressée par la brume, ces deux lacs de cratère fascinent par leurs couleurs radicalement différentes : l'un dévoile des eaux d'un vert émeraude sombre et mystérieux, tandis que l'autre scintille d'un bleu d'une pureté cristalline. Le paysage environnant, composé de prairies verdoyantes à perte de vue où paissent des troupeaux, compose un décor pastoral magique et profondément ressourçant.", image: "/images/lacs-manengouba/Lacs Manengouba 2.jpg", agencyId: "ag2", hotelId: "h24", images: ["/images/lacs-manengouba/Lacs Manengouba 1.jpg"] },
  { id: "p10", location: "Buea", lat: 4.1581, lng: 9.2625, name: "Mont Cameroun", category: "Aventure", price: 350000, duration: "4 jours", desc: "Le Mont Cameroun offre l'un des spectacles naturels les plus impressionnants d'Afrique, où la terre rencontre littéralement les nuages. Ce géant volcanique actif s'élève majestueusement au-dessus de l'océan Atlantique, proposant une ascension vertigineuse à travers une diversité de paysages saisissante, allant de la forêt tropicale dense à un décor lunaire et désertique près de son sommet. Atteindre son point culminant procure la sensation inoubliable de dominer le continent, face à un panorama à couper le souffle où l'horizon se confond avec l'immensité marine.", image: "/images/mont-cameroun/mont cameroun.jpg", agencyId: "ag2", hotelId: "h23", images: ["/images/mont-cameroun/mont cameroun1.jpg", "/images/mont-cameroun/mont cameroun2.jpg"], guideIds: ["g9"] },
  { id: "p11", location: "Foumban", lat: 5.7266, lng: 10.8994, name: "Palais des sultans Bamoun", category: "Culturel", price: 180000, duration: "1 jour", desc: "Le Palais des sultans Bamoun saisit les visiteurs par sa grandeur architecturale et l'intensité de son héritage historique. Cet édifice majestueux et centenaire, qui s'élève fièrement, incarne le faste et le raffinement d'une dynastie royale restée ininterrompue depuis des siècles. Pénétrer dans son enceinte et explorer le grand espace d'exposition du complexe permet de ressentir toute la force d'une culture vivante, à travers la splendeur des arts sacrés, des sculptures monumentales en bronze et des attributs royaux chargés de mystère.", image: "/images/palais-bamoun/Palais des sultans Bamoun3.jpg", agencyId: "ag3", hotelId: "h13", images: ["/images/palais-bamoun/Palais des sultans Bamoun1.jpg", "/images/palais-bamoun/Palais des sultans Bamoun2.jpg"] },
  { id: "p12", location: "Maroua", lat: 10.5953, lng: 14.3247, name: "Parc National de Waza", category: "Aventure", price: 400000, duration: "5 jours", desc: "Le Parc National de Waza propose une immersion totale dans l'Afrique légendaire des grands safaris et des espaces infinis. Traverser ses immenses étendues de savane dorée donne l'impression de pénétrer dans un sanctuaire hors du temps, où la faune sauvage règne en maître absolue sous un ciel immense. C'est l'émotion pure de croiser le regard d'un lion au détour d'une piste, d'observer des troupeaux d'éléphants se désaltérer aux points d'eau ou de voir des girafes s'élever élégamment au-dessus des acacias.", image: "/images/parc-waza/Parc National de Waza 3.jpg", agencyId: "ag4", hotelId: "h18", images: ["/images/parc-waza/Parc National de Waza 1.jpg", "/images/parc-waza/Parc National de Waza 2.jpg", "/images/parc-waza/Parc National de Waza 4.jpg"] },
  { id: "p13", location: "Yaoundé", lat: 3.8667, lng: 11.5167, name: "Réserve de faune du Dja", category: "Aventure", price: 380000, duration: "4 jours", desc: "La Réserve de faune du Dja représente le joyau ultime de la biodiversité d'Afrique centrale, classé au patrimoine mondial de l'UNESCO. S'aventurer sous la canopée de cette immense forêt primaire, c'est pénétrer dans l'un des poumons verts les plus denses et les mieux préservés de la planète, ceinturé par les boucles spectaculaires du fleuve Dja. L'expérience est celle d'une immersion sensorielle totale : l'humidité enveloppante, les bruits de la jungle mystérieuse et la chance unique d'apercevoir des gorilles de plaine ou des chimpanzés dans leur habitat originel.", image: "/images/reserve-dja/Réserve de faune du Dja4.jpg", agencyId: "ag4", hotelId: "h26", images: ["/images/reserve-dja/Réserve de faune du Dja1.jpg", "/images/reserve-dja/Réserve de faune du Dja2.jpg", "/images/reserve-dja/Réserve de faune du Dja3.jpg"] },
  { id: "p14", location: "Maroua", lat: 10.5953, lng: 14.3247, name: "Roumsiki", category: "Culturel", price: 280000, duration: "3 jours", desc: "Roumsiki transporte ses visiteurs dans un autre monde grâce à son relief volcanique d'un surréalisme total. Le village est entouré d'un paysage lunaire saisissant, hérissé d'immenses aiguilles rocheuses sombres qui jaillissent du sol comme des géants de pierre figés pour l'éternité. Lorsque la lumière du matin ou du soir frappe ces pics majestueux, le panorama se pare de reflets spectaculaires, offrant l'un des décors géologiques les plus saisissants et les plus photographiés de toute l'Afrique.", image: "/images/roumsiki/Roumsiki 2.jpg", agencyId: "ag4", hotelId: "h17", images: ["/images/roumsiki/Roumsiki 1.jpg"] },
  { id: "p15", location: "Yaoundé", lat: 3.8667, lng: 11.5167, name: "Site touristique d'ebogo", category: "Détente", price: 150000, duration: "1 jour", desc: "Le Site touristique d'ebogo est une ode à la poésie et à la tranquillité absolue au cœur de la forêt équatoriale. Une promenade en pirogue traditionnelle sur les eaux calmes et miroitantes du fleuve Nyong permet de s'enfoncer doucement dans un tunnel de végétation luxuriante, où les arbres centenaires se reflètent parfaitement à la surface. Le silence de la nature, seulement interrompu par le chant des oiseaux tropicaux et le clapotis de l'eau, crée une atmosphère presque irréelle de paix et de communion avec une nature totalement préservée.", image: "/images/site-ebogo/Site touristique d'ebogo 2.jpg", agencyId: "ag1", hotelId: "h26", images: ["/images/site-ebogo/Site touristique d'ebogo 1.jpg", "/images/site-ebogo/Site touristique d'ebogo 3.jpg", "/images/site-ebogo/Site touristique d'ebogo 4.jpg"] },
  { id: "p16", location: "Kribi", lat: 2.9395, lng: 9.9104, name: "Plage de Grand Batanga", category: "Détente", price: 85000, duration: "1 jour", desc: "Imaginez une étendue infinie de sable fin aux reflets d'or et d'ambre, caressée par une eau turquoise et délicieusement tiède tout au long de l'année. À Grand Batanga, le temps semble suspendre son vol. Des cocotiers majestueux, chargés de fruits, s'inclinent avec une élégance rare vers l'océan, créant des recoins d'ombre parfaits pour la rêverie. Marcher sur ce rivage au moment où le soleil plonge à l'horizon, embrasant le ciel de nuances pourpres et orangées, procure une sensation de liberté et de plénitude totale. C'est l'incarnation même de la carte postale paradisiaque.", image: "/images/plages/grand-batanga/grand-batanga-1.jpg", agencyId: "ag5", hotelId: "h25", images: ["/images/plages/grand-batanga/grand-batanga-2.jpg"] },
  { id: "p17", location: "Limbe", lat: 4.0150, lng: 9.2080, name: "Down Beach Limbé", category: "Détente", price: 90000, duration: "1 jour", desc: "Down Beach offre une scène vivante et captivante, suspendue entre l'océan et les montagnes. Face à cette grande plage de sable sombre, une baie parsemée d'îlots rocheux volcaniques jaillit des eaux sombres, créant un panorama digne des plus grands récits d'aventures maritimes. Le site ensorcelle par son âme et son authenticité : c'est le théâtre quotidien des pêcheurs artisanaux qui bravent courageusement l'océan à bord de leurs pirogues traditionnelles en bois, peintes de couleurs éclatantes. S'y promener au crépuscule, c'est capter l'essence même de la vie côtière africaine dans toute sa splendeur.", image: "/images/plages/down-beach/down-beach.jpg", agencyId: "ag1", hotelId: "h20", images: ["/images/plages/down-beach/down-beach.webp"] },
  { id: "p18", location: "Limbe", lat: 4.0200, lng: 9.2000, name: "Mile 6 Beach Limbé", category: "Détente", price: 95000, duration: "1 jour", desc: "Préparez-vous à un choc visuel et à une immersion dans un décor d'un surréalisme total. Sous l'influence du majestueux Mont Cameroun tout proche, le rivage change radicalement pour se draper d'un sable fin d'un noir charbon intense et brillant, qui scintille sous les rayons du soleil comme des milliers de diamants noirs. Le contraste chromatique est tout simplement spectaculaire : la noirceur magnétique du sol fait ressortir le blanc immaculé de l'écume des vagues, tandis que les falaises verdoyantes qui entourent la baie ajoutent une touche théâtrale. C'est une terre originelle, mystique, qui dégage une énergie vibrante.", image: "/images/plages/mile-6/mile-6.jpg", agencyId: "ag1", hotelId: "h22", images: ["/images/plages/mile-6/mile-6.avif"] },
];

// --- Circuits ---
export const CIRCUITS: Circuit[] = [
  {
    id: "c1",
    type: "circuit",
    name: "L'Émeraude des Lobés",
    duration: "7 jours",
    price: 350000,
    desc: "De Douala à Kribi en longeant la côte : marchés, chutes et plages avec des acteurs locaux à chaque étape.",
    image: "/images/chutes-lobe/Chutes de la Lobé 3.jpg",
    location: "Kribi",
    lat: 2.9395,
    lng: 9.9104,
    category: "Détente",
    agencyId: "ag1",
    guideIds: ["g6", "g10"],
    hotelPartnerIds: ["par1"],
    transportPartnerIds: ["par3"],
    agencyMargin: 350000,
    images: ["/images/chutes-lobe/Chutes de la Lobé 2.jpg", "/images/plages/grand-batanga/grand-batanga-1.jpg"],
    sites: [
      {
        id: "c1s1",
        name: "Marchés de Douala",
        city: "Douala",
        desc: "Découverte du port et des marchés avec un guide de la ville.",
        image: "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=400&q=80",
        lat: 4.0515,
        lng: 9.7679,
        guideIds: ["g6"],
        transportPartnerIds: ["par3"],
        hotelName: "Hôtel Douala Centre",
      },
      {
        id: "c1s2",
        name: "Chutes de la Lobé",
        city: "Kribi",
        desc: "Cascades tombant directement dans l'océan, accompagnées par un guide local.",
        image: "/images/chutes-lobe/Chutes de la Lobé 2.jpg",
        lat: 2.9374,
        lng: 9.9089,
        guideIds: ["g6"],
        hotelPartnerIds: ["par1"],
      },
      {
        id: "c1s3",
        name: "Plage de Grand Batanga",
        city: "Kribi",
        desc: "Plage de sable doré et village de pêcheurs, avec hébergement partenaire.",
        image: "/images/plages/grand-batanga/grand-batanga-1.jpg",
        lat: 2.929,
        lng: 9.891,
        guideIds: ["g10"],
        hotelPartnerIds: ["par1"],
      },
    ],
  },
  {
    id: "c2",
    type: "circuit",
    name: "Le Souffle des Volcans",
    duration: "5 jours",
    price: 280000,
    desc: "Buea, Limbé et le Mont Cameroun : plusieurs sites dans chaque ville, encadrés par des guides et hébergements partenaires.",
    image: "/images/mont-cameroun/mont cameroun1.jpg",
    location: "Buea",
    lat: 4.1581,
    lng: 9.2625,
    category: "Aventure",
    agencyId: "ag2",
    guideIds: ["g11", "g12"],
    hotelPartnerIds: ["par5"],
    agencyMargin: 280000,
    images: ["/images/mont-cameroun/mont cameroun.jpg", "/images/plages/down-beach/down-beach.jpg"],
    sites: [
      {
        id: "c2s1",
        name: "Mont Cameroun",
        city: "Buea",
        desc: "Ascension du toit de l'Afrique de l'Ouest avec un guide certifié.",
        image: "/images/mont-cameroun/mont cameroun.jpg",
        lat: 4.1581,
        lng: 9.2625,
        guideIds: ["g11"],
        hotelPartnerIds: ["par5"],
      },
      {
        id: "c2s2",
        name: "Jardin botanique de Buea",
        city: "Buea",
        desc: "Balade botanique et point de vue sur la ville, avec le même guide de montagne.",
        image: "/images/mont-cameroun/mont cameroun2.jpg",
        lat: 4.149,
        lng: 9.254,
        guideIds: ["g12"],
        hotelPartnerIds: ["par5"],
      },
      {
        id: "c2s3",
        name: "Down Beach Limbé",
        city: "Limbé",
        desc: "Plage de sable noir et retour des pêcheurs, guidée par un acteur de la côte.",
        image: "/images/plages/down-beach/down-beach.jpg",
        lat: 4.015,
        lng: 9.208,
        guideIds: ["g12"],
      },
      {
        id: "c2s4",
        name: "Mile 6 Beach",
        city: "Limbé",
        desc: "Sable volcanique et falaises verdoyantes, deuxième site de la même ville.",
        image: "/images/plages/mile-6/mile-6.jpg",
        lat: 4.02,
        lng: 9.2,
        guideIds: ["g12"],
      },
    ],
  },
  {
    id: "c3",
    type: "circuit",
    name: "L'Or des Sultans",
    duration: "8 jours",
    price: 420000,
    desc: "Palais, musées et chefferies : deux sites culturels à Foumban et une escale à Douala.",
    image: "/images/palais-bamoun/Palais des sultans Bamoun1.jpg",
    location: "Foumban",
    lat: 5.7266,
    lng: 10.8994,
    category: "Culturel",
    agencyId: "ag1",
    guideIds: ["g6", "g9"],
    hotelPartnerIds: ["par2"],
    transportPartnerIds: ["par3"],
    agencyMargin: 420000,
    images: ["/images/palais-bamoun/Palais des sultans Bamoun3.jpg", "/images/palais-bamoun/Palais des sultans Bamoun2.jpg"],
    sites: [
      {
        id: "c3s1",
        name: "Palais des sultans Bamoun",
        city: "Foumban",
        desc: "Architecture royale et collections sacrées, avec un guide culturel.",
        image: "/images/palais-bamoun/Palais des sultans Bamoun3.jpg",
        lat: 5.728,
        lng: 10.898,
        guideIds: ["g6"],
        hotelPartnerIds: ["par2"],
      },
      {
        id: "c3s2",
        name: "Musée des arts Bamoun",
        city: "Foumban",
        desc: "Sculptures, bronzes et attributs royaux dans la même ville que le palais.",
        image: "/images/palais-bamoun/Palais des sultans Bamoun2.jpg",
        lat: 5.727,
        lng: 10.897,
        guideIds: ["g6"],
        hotelPartnerIds: ["par2"],
      },
      {
        id: "c3s3",
        name: "Centre culturel de Douala",
        city: "Douala",
        desc: "Escal artistique avant de rejoindre l'Ouest, avec transport partenaire.",
        image: "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=400&q=80",
        lat: 4.0515,
        lng: 9.7679,
        guideIds: ["g9"],
        transportPartnerIds: ["par3"],
        hotelName: "Hôtel Douala Centre",
      },
    ],
  },
  {
    id: "c4",
    type: "circuit",
    name: "La Lune de l'Adamaoua",
    duration: "6 jours",
    price: 310000,
    desc: "Deux sites à Ngaoundéré puis le grand nord sauvage, avec guides locaux à chaque étape.",
    image: "/images/parc-waza/Parc National de Waza 4.jpg",
    location: "Ngaoundéré",
    lat: 7.3167,
    lng: 13.5833,
    category: "Aventure",
    agencyId: "ag2",
    guideIds: ["g12", "g13"],
    agencyMargin: 310000,
    images: ["/images/parc-waza/Parc National de Waza 3.jpg", "/images/roumsiki/Roumsiki 2.jpg"],
    sites: [
      {
        id: "c4s1",
        name: "Palais du Lamibé",
        city: "Ngaoundéré",
        desc: "Chefferie traditionnelle et architecture du plateau de l'Adamaoua.",
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80",
        lat: 7.3167,
        lng: 13.5833,
        guideIds: ["g12"],
        hotelName: "Hôtel Adamaoua Résidence",
      },
      {
        id: "c4s2",
        name: "Lac Tison",
        city: "Ngaoundéré",
        desc: "Lac naturel et village de pêcheurs, deuxième site de la même ville.",
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80",
        lat: 7.3,
        lng: 13.57,
        guideIds: ["g13"],
        hotelName: "Hôtel Adamaoua Résidence",
      },
      {
        id: "c4s3",
        name: "Parc national de Waza",
        city: "Maroua",
        desc: "Safari dans la savane du grand Nord avec un guide de la réserve.",
        image: "/images/parc-waza/Parc National de Waza 3.jpg",
        lat: 11.4,
        lng: 14.6,
        guideIds: ["g13"],
        hotelName: "Le Campement de Waza",
      },
    ],
  },
];

export function getAllCircuits(): Circuit[] {
  return CIRCUITS;
}

export function getCircuitById(id: string): Circuit | undefined {
  return CIRCUITS.find((c) => c.id === id);
}

// --- Destinations ---
export const DESTINATIONS = [
  { name: "Kribi", image: "/images/chutes-lobe/Chutes de la Lobé 1.jpg" },
  { name: "Yaoundé", image: "/images/site-ebogo/Site touristique d'ebogo 1.jpg" },
  { name: "Douala", image: "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=400&q=80" },
  { name: "Limbe", image: "/images/plages/mile-6/mile-6.jpg" },
  { name: "Bafoussam", image: "/images/lacs-manengouba/Lacs Manengouba 2.jpg" },
  { name: "Garoua", image: "/images/parc-waza/Parc National de Waza 2.jpg" },
  { name: "Ngaoundéré", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80" },
  { name: "Ebolowa", image: "/images/reserve-dja/Réserve de faune du Dja1.jpg" },
];

// --- Points de fidélité ---

export interface PointsEntry {
  userId: string;
  agencyId: string;
  agencyName: string;
  points: number;
}

export function getTouristPoints(userId: string): PointsEntry[] {
  const reservations = getAllReservations().filter(
    r => r.userId === userId && (r.status === "Confirmée" || r.status === "Terminée")
  );
  const map = new Map<string, { name: string; total: number }>();
  for (const r of reservations) {
    let agencyId: string | undefined;
    let agencyName: string | undefined;
    // Chercher l'agence via le pack
    const pack = getAllPacks().find(p => p.id === r.packId || p.name === r.packName);
    if (pack) {
      const agency = AGENCIES.find(a => a.id === pack.agencyId);
      if (agency) {
        agencyId = agency.id;
        agencyName = agency.name;
      }
    }
    // Fallback: chercher l'agence via les infos de la réservation
    if (!agencyId) {
      const agency = AGENCIES.find(a =>
        r.packName.toLowerCase().includes(a.name.toLowerCase()) ||
        a.name.toLowerCase().includes(r.packName.toLowerCase())
      );
      if (agency) {
        agencyId = agency.id;
        agencyName = agency.name;
      }
    }
    if (!agencyId) continue;
    const earned = Math.floor(r.totalPrice / 1000);
    const existing = map.get(agencyId);
    if (existing) {
      existing.total += earned;
    } else {
      map.set(agencyId, { name: agencyName ?? "Inconnue", total: earned });
    }
  }
  return Array.from(map.entries()).map(([agencyId, v]) => ({
    userId,
    agencyId,
    agencyName: v.name,
    points: v.total,
  }));
}

// --- Porte monnaie ---

export interface WalletTransaction {
  amount: number;
  method: "carte_bancaire" | "orange_money" | "mobile_money";
  date: string;
  type: "deposit";
}

export function getWalletBalance(userId: string): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(`njangui_wallet_${userId}`);
  if (!raw) return 0;
  const data = JSON.parse(raw);
  return data.balance ?? 0;
}

export function addMoneyToWallet(userId: string, amount: number, method: WalletTransaction["method"]): { balance: number; error: string | null } {
  if (amount <= 0) return { balance: getWalletBalance(userId), error: "Montant invalide." };
  if (!["carte_bancaire", "orange_money", "mobile_money"].includes(method)) {
    return { balance: getWalletBalance(userId), error: "Méthode de paiement invalide." };
  }
  const raw = localStorage.getItem(`njangui_wallet_${userId}`);
  let data: { balance: number; transactions: WalletTransaction[] };
  if (raw) {
    data = JSON.parse(raw);
  } else {
    data = { balance: 0, transactions: [] };
  }
  data.balance += amount;
  data.transactions.push({
    amount,
    method,
    date: new Date().toISOString(),
    type: "deposit",
  });
  localStorage.setItem(`njangui_wallet_${userId}`, JSON.stringify(data));
  return { balance: data.balance, error: null };
}

export function getWalletHistory(userId: string): WalletTransaction[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(`njangui_wallet_${userId}`);
  if (!raw) return [];
  return JSON.parse(raw).transactions ?? [];
}

// --- Avis clients ---
// --- Avis persistés ---

export interface ReviewData {
  id: string;
  packId: string;
  userId: string;
  name: string;
  avatar?: string;
  rating: number;
  text: string;
  createdAt: string;
}

export const REVIEWS: ReviewData[] = [
  { id: "rev_001", packId: "p8", userId: "usr_001", name: "Aïcha Nkomo", avatar: "https://i.pravatar.cc/56?img=5", rating: 5, text: "Expérience inoubliable à Kribi ! L'organisation était parfaite, notre guide était passionnant.", createdAt: "2026-01-15" },
  { id: "rev_002", packId: "p2", userId: "usr_002", name: "Jean-Marc Beti", avatar: "https://i.pravatar.cc/56?img=6", rating: 5, text: "Le trek sur le Mont Cameroun est une aventure de toute une vie. Njangui a tout géré.", createdAt: "2026-02-20" },
  { id: "rev_003", packId: "p4", userId: "usr_003", name: "Sandrine Kameni", avatar: "https://i.pravatar.cc/56?img=7", rating: 4, text: "Très belle organisation pour notre séjour au Grand Nord, paysages à couper le souffle !", createdAt: "2026-03-10" },
  { id: "rev_004", packId: "p16", userId: "usr_100", name: "Amadou & Amina Bello", avatar: "/images/tourists/amadou-bello.avif", rating: 5, text: "Pour notre lune de miel, Kribi a été un véritable coup de foudre. S'allonger sur le sable doré de Grand Batanga sous les cocotiers qui se courbent vers l'océan, c'est le paradis sur terre. Mais le clou du spectacle reste les chutes de la Lobé. Voir ce fleuve immense se jeter directement dans les vagues de l'océan en cascades vrombissantes est un spectacle unique au monde. Nous avons remonté le fleuve en pirogue avant de déguster des crevettes géantes braisées, les pieds dans l'eau, face au coucher du soleil. C'était féerique, romantique et totalement dépaysant !", createdAt: "2026-04-05" },
  { id: "rev_005", packId: "p13", userId: "usr_101", name: "Dr. Arthur Dupont", avatar: "/images/tourists/arthur-dupont.jpg", rating: 5, text: "Pénétrer dans la forêt primaire du Dja est une expérience sensorielle d'une intensité rare. Le dôme de la canopée est si dense que la lumière y est tamisée, et l'atmosphère vibre littéralement au son des oiseaux et des insectes. Accompagné par un pisteur local, j'ai vécu le moment le plus fort de ma vie de naturaliste : observer, à moins de trente mètres, un groupe de gorilles de plaine évoluer dans leur habitat d'origine. C'est une nature brute, puissante et intacte. On se sent infiniment petit et privilégié au cœur de ce poumon vert.", createdAt: "2026-03-22" },
  { id: "rev_006", packId: "p14", userId: "usr_102", name: "Elena Rostova", avatar: "/images/tourists/elena-rostova.avif", rating: 5, text: "J'ai vu des paysages grandioses sur tous les continents, mais le lever du soleil sur les aiguilles de Roumsiki m'a littéralement coupé le souffle. On a l'impression d'avoir atterri sur une autre planète. La lumière rasante du matin qui frappe ces géants de pierre crée un contraste d'ombres et de reliefs absolument magique pour la photo. Au-delà du paysage lunaire, la rencontre avec le peuple des montagnes et la consultation du sorcier au crabe ont ajouté une profondeur mystique inoubliable à mon séjour. Un choc visuel et culturel total !", createdAt: "2026-02-18" },
  { id: "rev_007", packId: "p11", userId: "usr_103", name: "Marcus Johnson", avatar: "/images/tourists/marcus-johnson.avif", rating: 5, text: "Foumban est une claque culturelle majeure. En arrivant devant le Palais des Sultans, on est tout de suite impressionné par la grandeur et la majesté de l'architecture. Mais c'est à l'intérieur que la magie opère : la richesse des collections, les masques de cérémonie, les armes historiques et l'histoire de la dynastie sont fascinants. J'ai été ébloui par le génie du Roi Njoya et son alphabet secret. En sortant, j'ai visité la rue des artisans fondeurs de bronze. Repartir avec une pièce d'art unique, façonnée sous mes yeux selon des techniques ancestrales, a rendu ce voyage inestimable.", createdAt: "2026-04-20" },
];

// --- Abonnements ---
export interface SubscriptionPlan {
  id: string;
  label: string;
  price: number;
  period: string;
  publications: number;
  popular: boolean;
  save: string | null;
  published: boolean;
}

export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: "monthly", label: "Mensuel", price: 25000, period: "mois", publications: 5, popular: false, save: null, published: true },
  { id: "semester", label: "Semestriel", price: 120000, period: "6 mois", publications: 15, popular: true, save: "30 000 FCFA", published: true },
  { id: "yearly", label: "Annuel", price: 200000, period: "an", publications: 50, popular: false, save: "100 000 FCFA", published: true },
];

function normalizeSubscriptionPlan(plan: any): SubscriptionPlan {
  return {
    id: String(plan?.id ?? `plan_${Date.now()}`),
    label: String(plan?.label ?? ""),
    price: Number(plan?.price) || 0,
    period: String(plan?.period ?? ""),
    publications: Number(plan?.publications) || 0,
    popular: Boolean(plan?.popular),
    save: plan?.save == null || plan?.save === "" ? null : String(plan.save),
    published: plan?.published !== false,
  };
}

export let SUBSCRIPTION_PLANS: SubscriptionPlan[] = [...DEFAULT_SUBSCRIPTION_PLANS];

let _savedSubscriptionPlans: SubscriptionPlan[] | null = null;

export async function loadSubscriptionPlans(): Promise<void> {
  try {
    const res = await fetch("/api/subscription-plans");
    const data = await res.json();
    const plans =
      Array.isArray(data) && data.length > 0
        ? data.map(normalizeSubscriptionPlan)
        : [...DEFAULT_SUBSCRIPTION_PLANS];
    _savedSubscriptionPlans = plans;
    SUBSCRIPTION_PLANS = plans;
  } catch {
    _savedSubscriptionPlans = [...DEFAULT_SUBSCRIPTION_PLANS];
    SUBSCRIPTION_PLANS = _savedSubscriptionPlans;
  }
}

export function getSubscriptionPlans(): SubscriptionPlan[] {
  return _savedSubscriptionPlans ?? SUBSCRIPTION_PLANS;
}

export function getPublishedSubscriptionPlans(): SubscriptionPlan[] {
  return getSubscriptionPlans().filter((p) => p.published !== false);
}

export async function saveSubscriptionPlan(plan: SubscriptionPlan): Promise<void> {
  if (!_savedSubscriptionPlans) _savedSubscriptionPlans = getSubscriptionPlans().slice();
  const normalized = normalizeSubscriptionPlan(plan);
  _savedSubscriptionPlans.unshift(normalized);
  SUBSCRIPTION_PLANS = _savedSubscriptionPlans;
  try {
    await fetch("/api/subscription-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalized),
    });
  } catch {
    /* ignore */
  }
}

export async function updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<void> {
  if (!_savedSubscriptionPlans) _savedSubscriptionPlans = getSubscriptionPlans().slice();
  const idx = _savedSubscriptionPlans.findIndex((p) => p.id === id);
  if (idx !== -1) _savedSubscriptionPlans[idx] = normalizeSubscriptionPlan({ ..._savedSubscriptionPlans[idx], ...updates, id });
  SUBSCRIPTION_PLANS = _savedSubscriptionPlans;
  try {
    await fetch("/api/subscription-plans", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
  } catch {
    /* ignore */
  }
}

export async function removeSubscriptionPlan(id: string): Promise<void> {
  if (!_savedSubscriptionPlans) _savedSubscriptionPlans = getSubscriptionPlans().slice();
  _savedSubscriptionPlans = _savedSubscriptionPlans.filter((p) => p.id !== id);
  SUBSCRIPTION_PLANS = _savedSubscriptionPlans.length > 0 ? _savedSubscriptionPlans : [...DEFAULT_SUBSCRIPTION_PLANS];
  try {
    await fetch("/api/subscription-plans", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  } catch {
    /* ignore */
  }
}

// --- Données admin ---
export const KPIS = [
  { label: "Agences actives", value: "47", trend: "+3 ce mois" },
  { label: "Touristes inscrits", value: "2 841", trend: "+142 cette semaine" },
  { label: "Réservations (mois)", value: "318", trend: "+22%" },
  { label: "Revenus nets (FCFA)", value: "62.4M", trend: "+18% vs mois précédent" },
];

export const REVENUE_DATA = [
  { mois: "Jan", revenus: 38 }, { mois: "Fév", revenus: 45 }, { mois: "Mar", revenus: 52 },
  { mois: "Avr", revenus: 48 }, { mois: "Mai", revenus: 61 }, { mois: "Juin", revenus: 70 },
];

export const PARTNERS = [
  { name: "Évasion Cameroun", type: "Agence touristique", city: "Douala", status: "Actif" },
  { name: "Star Voyages", type: "Agence de voyage", city: "Yaoundé", status: "Actif" },
  { name: "Hôtel La Falaise", type: "Hôtelier", city: "Douala", status: "Actif" },
  { name: "Guide Ngoumou", type: "Guide", city: "Kribi", status: "Actif" },
  { name: "Trans-Cameroun", type: "Agence de voyage", city: "Bafoussam", status: "Suspendu" },
];

// --- Données agence ---
export const AGENCY_REVENUE = [
  { mois: "Jan", brut: 6.2, net: 5.6 }, { mois: "Fév", brut: 7.1, net: 6.4 },
  { mois: "Mar", brut: 7.8, net: 7.0 }, { mois: "Avr", brut: 6.9, net: 6.2 },
  { mois: "Mai", brut: 8.3, net: 7.5 }, { mois: "Juin", brut: 9.1, net: 8.2 },
];

// --- Réservations ---
export interface ReservationData {
  ref: string;
  packId: string;
  packName: string;
  userId: string;
  dates: string;
  status: "Confirmée" | "En attente" | "Terminée" | "Annulée";
  participants: number;
  days: number;
  totalPrice: number;
  createdAt: string;
  hotelName?: string;
  hotelPrice?: number;
  transportLabel?: string;
  transportPrice?: number;
  transportAgency?: string;
  guideId?: string;
  guideIds?: string[]; // tous les guides sélectionnés lors de la personnalisation
  guideName?: string;
  agencyId?: string; // agence propriétaire de l'offre réservée
  cityDetails?: ReservationCityDetail[];
}

export type ReservationSiteGuide = {
  site: string;
  guideId: string;
  guideName: string;
  days: number;
  guidePrice: number;
};

export type ReservationCityDetail = {
  city: string;
  hotelName?: string;
  hotelPrice?: number;
  transportLabel?: string;
  transportPrice?: number;
  transportAgency?: string;
  guideIds?: string[];
  guideNames?: string[];
  guidePrice?: number;
  siteGuides?: ReservationSiteGuide[];
};

export const RESERVATIONS: ReservationData[] = [
  { ref: "DT-2026-001", packId: "p8", packName: "Chutes de la Lobé", dates: "10–13 juin 2026", status: "Confirmée", userId: "usr_001", participants: 2, days: 4, totalPrice: 240000, createdAt: "2026-05-20" },
  { ref: "DT-2026-002", packId: "p2", packName: "Mont Cameroun Trek", dates: "20–24 juin 2026", status: "En attente", userId: "usr_002", participants: 1, days: 5, totalPrice: 320000, createdAt: "2026-06-01" },
  { ref: "DT-2025-047", packId: "p5", packName: "Safari Grand Nord", dates: "15–21 déc. 2025", status: "Terminée", userId: "usr_003", participants: 3, days: 7, totalPrice: 1350000, createdAt: "2025-11-10" },
];

// --- Données hôtel ---
export const ROOMS = [
  { type: "Chambre Standard", capacity: 2, price: 35000, count: 20 },
  { type: "Chambre Supérieure", capacity: 2, price: 55000, count: 10 },
  { type: "Suite Junior", capacity: 3, price: 85000, count: 5 },
  { type: "Suite Présidentielle", capacity: 4, price: 150000, count: 2 },
];

// --- Données agences de voyages ---
export const FLEET = [
  { id: "V-001", type: "Minibus 14 places", capacity: 14, status: "Disponible" },
  { id: "V-002", type: "Bus 35 places", capacity: 35, status: "Disponible" },
  { id: "V-003", type: "Berline VIP", capacity: 4, status: "En mission" },
  { id: "V-004", type: "4x4 Tout-terrain", capacity: 7, status: "Disponible" },
];

export const TRIPS = [
  { from: "Douala", to: "Kribi", time: "07h00", vehicle: "V-001", price: 5000, company: "Star Voyages" },
  { from: "Douala", to: "Kribi", time: "09h00", vehicle: "V-005", price: 4500, company: "Trans-Cameroun" },
  { from: "Yaoundé", to: "Kribi", time: "06h00", vehicle: "V-006", price: 6000, company: "Trans-Cameroun" },
  { from: "Douala", to: "Limbe", time: "08h00", vehicle: "V-001", price: 3000, company: "Star Voyages" },
  { from: "Douala", to: "Limbe", time: "10h00", vehicle: "V-005", price: 2500, company: "Trans-Cameroun" },
  { from: "Douala", to: "Buea", time: "08h30", vehicle: "V-003", price: 3500, company: "Star Voyages" },
  { from: "Douala", to: "Buea", time: "11h00", vehicle: "V-006", price: 3000, company: "Trans-Cameroun" },
  { from: "Douala", to: "Nkongsamba", time: "09h00", vehicle: "V-004", price: 4000, company: "Star Voyages" },
  { from: "Douala", to: "Yaoundé", time: "06h00", vehicle: "V-002", price: 5000, company: "Trans-Cameroun" },
  { from: "Douala", to: "Yaoundé", time: "14h00", vehicle: "V-001", price: 5500, company: "Star Voyages" },
  { from: "Yaoundé", to: "Douala", time: "07h00", vehicle: "V-002", price: 5000, company: "Trans-Cameroun" },
  { from: "Yaoundé", to: "Bafoussam", time: "06h30", vehicle: "V-002", price: 4500, company: "Trans-Cameroun" },
  { from: "Yaoundé", to: "Foumban", time: "08h00", vehicle: "V-003", price: 5500, company: "Trans-Cameroun" },
  { from: "Garoua", to: "Maroua", time: "09h00", vehicle: "V-004", price: 6000, company: "Trans-Cameroun" },
  { from: "Yaoundé", to: "Kribi", time: "05h00", vehicle: "V-007", price: 6500, company: "CamTrans" },
];

export interface TripData {
  from: string;
  to: string;
  time: string;
  vehicle: string;
  price: number;
  company: string;
}

let _savedTrips: TripData[] | null = null;

export async function loadTrips(): Promise<void> {
  if (_savedTrips !== null) return;
  try {
    const res = await fetch("/api/trips");
    const data = await res.json();
    _savedTrips = Array.isArray(data) ? data : [];
  } catch {
    _savedTrips = [];
  }
}

export function getAllTrips(): TripData[] {
  return [..._savedTrips ?? [], ...TRIPS];
}

export async function saveTrip(trip: TripData) {
  if (!_savedTrips) _savedTrips = [];
  _savedTrips.unshift(trip);
  try {
    await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trip),
    });
  } catch { /* ignore */ }
}

export async function removeSavedTrip(index: number) {
  if (!_savedTrips) return;
  _savedTrips.splice(index, 1);
  try {
    await fetch("/api/trips", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index }),
    });
  } catch { /* ignore */ }
}

// --- Hôtels pour la carte / réservation ---
export const HOTELS_NEARBY = [
  { id: "h13", name: "L'Hôtel de l'Artisanat", city: "Foumban", lat: 5.7280, lng: 10.8980, pricePerNight: 35000, rating: 4.6, rooms: 5, image: "/images/hotels/L'Hôtel de l'Artisanat (Foumban).webp", desc: "Situé au cœur de la ville historique de Foumban, cet hôtel met à l'honneur l'artisanat local. Chambres décorées avec des œuvres d'art Bamoun, restaurant proposant une cuisine traditionnelle revisitée." },
  { id: "h14", name: "L'Hôtel Ilomba", city: "Kribi", lat: 2.9380, lng: 9.9120, pricePerNight: 55000, rating: 4.7, rooms: 6, image: "/images/hotels/L'Hôtel Ilomba (Kribi).jpeg", desc: "Établissement de charme face à l'océan Atlantique. Piscine à débordement, plage privée et restaurant de fruits de mer. Idéal pour les séjours balnéaires à Kribi." },
  { id: "h15", name: "Les Gîtes de Kribi", city: "Kribi", lat: 2.9400, lng: 9.9080, pricePerNight: 45000, rating: 4.5, rooms: 8, image: "/images/hotels/L'Hôtel-Restaurant Les Gîtes de Kribi.jpg", desc: "Gîtes touristiques offrant un cadre paisible et verdoyant à quelques minutes des plages de Kribi. Parfait pour les familles et les groupes d'amis." },
  { id: "h16", name: "Le Bouba Ndjida Safari Lodge", city: "Bouba Ndjida", lat: 8.5000, lng: 14.5000, pricePerNight: 80000, rating: 4.9, rooms: 4, image: "/images/hotels/Le Bouba Ndjida Safari Lodge.jpeg", desc: "Lodge de luxe en pleine savane, aux portes du parc national de Bouba Ndjida. Safaris guidés, observation de la faune sauvage et nuits à la belle étoile." },
  { id: "h17", name: "Le Campement de Roumsiki", city: "Roumsiki", lat: 10.4740, lng: 13.5830, pricePerNight: 60000, rating: 4.8, rooms: 5, image: "/images/hotels/Le Campement de Roumsiki.jpg", desc: "Campement écologique perché dans les Monts Mandara. Cases traditionnelles en pierre, vue imprenable sur le pic de Roumsiki et randonnées culturelles avec les populations Kapsiki." },
  { id: "h18", name: "Le Campement de Waza", city: "Waza", lat: 11.4000, lng: 14.6000, pricePerNight: 55000, rating: 4.6, rooms: 6, image: "/images/hotels/Le Campement Touristique de Waza.jpg", desc: "Campement situé à proximité du parc national de Waza. Excursions safari, rencontres avec les éléphants et les lions, et immersion dans la culture Kotoko." },
  { id: "h19", name: "Le Domaine de Melong", city: "Melong", lat: 5.0000, lng: 9.9500, pricePerNight: 40000, rating: 4.5, rooms: 4, image: "/images/hotels/Le Domaine de Melong (Melong).jpg", desc: "Domaine niché dans les hauts plateaux de l'Ouest, entouré de plantations de café et de bananiers. Randonnées vers les cascades et baignades en piscine naturelle." },
  { id: "h20", name: "Le Fini Hotel Bobende", city: "Limbé", lat: 4.0150, lng: 9.2080, pricePerNight: 65000, rating: 4.7, rooms: 7, image: "/images/hotels/Le Fini Hotel Bobende (Limbé).jpg", desc: "Hôtel moderne situé sur les hauteurs de Limbé avec vue panoramique sur l'océan et le Mont Cameroun. Spa, piscine chauffée et restaurant gastronomique." },
  { id: "h21", name: "Le Lomié Éco-Lodge", city: "Lomié", lat: 3.1500, lng: 13.6000, pricePerNight: 50000, rating: 4.7, rooms: 5, image: "/images/hotels/Le Lomié Éco-Lodge (Lomié).jpg", desc: "Éco-lodge au cœur de la forêt équatoriale du Sud-Est Cameroun. Construction en matériaux locaux, énergie solaire et excursions vers les réserves de faune." },
  { id: "h22", name: "Le Marcsons Hotels and Resorts", city: "Limbé", lat: 4.0200, lng: 9.2000, pricePerNight: 55000, rating: 4.6, rooms: 10, image: "/images/hotels/Le Marcsons Hotels and Resorts (Limbé).webp", desc: "Complexe hôtelier de standing international à Limbé. Plusieurs restaurants, piscines, salle de sport et accès direct à la plage de Limbé." },
  { id: "h23", name: "Le Mountain Hotel", city: "Buea", lat: 4.1600, lng: 9.2600, pricePerNight: 50000, rating: 4.6, rooms: 6, image: "/images/hotels/Le Mountain Hotel (Buea).jpg", desc: "Hôtel de charme situé sur les pentes du Mont Cameroun. Climat frais, vue spectaculaire sur la ville de Buea et point de départ idéal pour l'ascension du volcan." },
  { id: "h24", name: "Le Relais des Crandell", city: "Nkongsamba", lat: 4.9550, lng: 9.9420, pricePerNight: 40000, rating: 4.4, rooms: 5, image: "/images/hotels/Le Relais des Crandell (Nkongsamba).jpg", desc: "Relais de campagne à Nkongsamba, entouré de collines verdoyantes. Cadre calme et reposant, idéal pour les escales entre Douala et l'Ouest du Cameroun." },
  { id: "h25", name: "Le Tara Plage", city: "Kribi", lat: 2.9500, lng: 9.9000, pricePerNight: 48000, rating: 4.6, rooms: 6, image: "/images/hotels/Le Tara Plage (Kribi).jpg", desc: "Hôtel de plage offrant un cadre idyllique sur les côtes de Kribi. Bungalows face à la mer, sports nautiques et excursions aux chutes de la Lobé." },
  { id: "h26", name: "Les Éco-Lodges du Nyong", city: "Mbalmayo", lat: 3.5000, lng: 11.5000, pricePerNight: 55000, rating: 4.8, rooms: 4, image: "/images/hotels/Les Éco-Lodges du Nyong .jpeg", desc: "Lodges écologiques en bordure du fleuve Nyong. Balades en pirogue, observation des oiseaux et nuits bercées par le chant de la nature." },
];

// --- Affiliations agences de voyage ---
export const AFFILIATIONS = [
  { id: "aff1", travelAgency: "Star Voyages", touristAgency: "Évasion Cameroun", status: "Acceptée", since: "Jan 2026" },
  { id: "aff2", travelAgency: "Trans-Cameroun", touristAgency: "Mont Aventure", status: "En attente", since: "Mai 2026" },
  { id: "aff3", travelAgency: "CamTrans", touristAgency: "Évasion Cameroun", status: "Refusée", since: "Avr 2026" },
];

// --- Partenaires de l'agence (hôteliers & agences de voyages) ---
export type PartnerType = "hotelier" | "agence-voyages";
export type PartnerStatus = "Actif" | "En attente" | "Suspendu";

/** Clauses du contrat définies depuis "Mes partenaires" et reprises dans "Mes revenus". */
export interface PartnerContract {
  commissionRate: number;   // % prélevé sur les ventes générées avec le partenaire
  paymentDelay: number;     // délai de règlement en jours
  durationMonths: number;   // durée du contrat en mois
  startDate: string;        // date de début (YYYY-MM-DD)
  notes: string;            // clauses particulières
  roomPrice?: number;       // Hôtelier : prix d'une nuit (FCFA)
  roomType?: string;        // Hôtelier : type de chambre
  tripPrice?: number;       // Agence de voyages : prix d'une place (FCFA)
  tripLabel?: string;       // Agence de voyages : trajet concerné
}

export interface PartnerData {
  id: string;
  agencyId: string;
  name: string;
  type: PartnerType;
  city: string;
  contact: string;
  email: string;
  phone: string;
  status: PartnerStatus;
  contract: PartnerContract;
  createdAt: string;
  userId?: string; // compte utilisateur associé (messagerie)
}

const PARTNERS_FALLBACK: PartnerData[] = [
  {
    id: "par1", agencyId: "ag1", name: "L'Hôtel Ilomba", type: "hotelier", city: "Kribi",
    contact: "Mme Ngono", email: "contact@hotel-ilomba.cm", phone: "+237 6 99 12 34 56",
    status: "Actif",
    contract: { commissionRate: 15, paymentDelay: 30, durationMonths: 12, startDate: "2026-01-15", notes: "Annulation gratuite jusqu'à J-7. Petit-déjeuner inclus.", roomPrice: 55000, roomType: "Chambre Supérieure" },
    createdAt: "2026-01-15",
  },
  {
    id: "par2", agencyId: "ag1", name: "L'Hôtel de l'Artisanat", type: "hotelier", city: "Foumban",
    contact: "M. Mbarga", email: "artisanat.foumban@example.cm", phone: "+237 6 77 88 99 00",
    status: "Actif",
    contract: { commissionRate: 12, paymentDelay: 15, durationMonths: 6, startDate: "2026-03-01", notes: "Chambres décorées d'œuvres Bamoun, petit-déjeuner inclus.", roomPrice: 35000, roomType: "Chambre Standard" },
    createdAt: "2026-03-01",
  },
  {
    id: "par3", agencyId: "ag1", name: "Star Voyages", type: "agence-voyages", city: "Douala",
    contact: "Mme Aïcha Nkomo", email: "commercial@starvoyages.cm", phone: "+237 6 55 44 33 22",
    status: "Actif",
    contract: { commissionRate: 8, paymentDelay: 7, durationMonths: 12, startDate: "2026-01-01", notes: "Transport inclus dans les packs balnéaires, 2 départs par jour.", tripPrice: 5000, tripLabel: "Douala → Kribi" },
    createdAt: "2026-01-01",
  },
  {
    id: "par4", agencyId: "ag1", name: "Trans-Cameroun", type: "agence-voyages", city: "Yaoundé",
    contact: "M. Jean-Marc Beti", email: "partenariat@trans-cameroun.cm", phone: "+237 6 33 22 11 00",
    status: "En attente",
    contract: { commissionRate: 10, paymentDelay: 15, durationMonths: 6, startDate: "2026-05-01", notes: "Bus climatisés, validation du contrat en cours.", tripPrice: 4500, tripLabel: "Douala → Kribi" },
    createdAt: "2026-05-01",
  },
  {
    id: "par5", agencyId: "ag2", name: "Le Mountain Hotel", type: "hotelier", city: "Buea",
    contact: "M. Ewome", email: "reservation@mountain-hotel.cm", phone: "+237 6 12 34 56 78",
    status: "Actif",
    contract: { commissionRate: 14, paymentDelay: 30, durationMonths: 12, startDate: "2026-02-01", notes: "Point de départ de l'ascension du Mont Cameroun.", roomPrice: 50000, roomType: "Chambre Supérieure" },
    createdAt: "2026-02-01",
  },
];

let _savedPartners: PartnerData[] | null = null;

export async function loadPartners(): Promise<void> {
  if (_savedPartners !== null) return;
  try {
    const res = await fetch("/api/partners");
    const data = await res.json();
    _savedPartners = Array.isArray(data) ? data : PARTNERS_FALLBACK;
  } catch {
    _savedPartners = PARTNERS_FALLBACK;
  }
}

export function getAllPartners(): PartnerData[] {
  return _savedPartners ?? PARTNERS_FALLBACK;
}

export function getPartnersByAgency(agencyId: string): PartnerData[] {
  return getAllPartners().filter(p => p.agencyId === agencyId);
}

export async function savePartner(partner: PartnerData): Promise<void> {
  if (!_savedPartners) _savedPartners = getAllPartners().slice();
  _savedPartners.unshift(partner);
  try {
    await fetch("/api/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partner),
    });
  } catch { /* ignore */ }
}

export async function updatePartner(id: string, updates: Partial<PartnerData>): Promise<void> {
  if (!_savedPartners) _savedPartners = getAllPartners().slice();
  const idx = _savedPartners.findIndex(p => p.id === id);
  if (idx !== -1) _savedPartners[idx] = { ..._savedPartners[idx], ...updates };
  try {
    await fetch("/api/partners", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
  } catch { /* ignore */ }
}

export async function removePartner(id: string): Promise<void> {
  if (_savedPartners) _savedPartners = _savedPartners.filter(p => p.id !== id);
  try {
    await fetch("/api/partners", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  } catch { /* ignore */ }
}

/** Chiffre généré et commission due selon les clauses du contrat du partenaire. */
export function getPartnerRevenue(partner: PartnerData, reservations: ReservationData[]) {
  let generated = 0;
  let count = 0;
  for (const r of reservations) {
    const name = partner.name.trim().toLowerCase();
    const matches = partner.type === "hotelier"
      ? r.hotelName?.trim().toLowerCase() === name
      : r.transportAgency?.trim().toLowerCase() === name;
    if (!matches) continue;
    generated += partner.type === "hotelier" ? (r.hotelPrice ?? 0) : (r.transportPrice ?? 0);
    count += 1;
  }
  const commission = Math.round(generated * ((partner.contract?.commissionRate ?? 0) / 100));
  return { generated, commission, net: generated - commission, count };
}

/** Champs de tarification propres aux offres (en plus des champs communs des packs). */
interface OfferPricing {
  hotelPartnerId?: string;
  transportPartnerId?: string;
  hotelPartnerIds?: string[];
  transportPartnerIds?: string[];
  guideIds?: string[];
  agencyMargin?: number;
}

/** Une ligne de revenu : montant confié au partenaire, taux de commission et commission reversée à l'agence. */
export interface RevenueLine {
  name: string;
  rate: number;       // taux de commission (%)
  base: number;       // montant de la prestation confiée au partenaire (FCFA)
  commission: number; // commission reversée à l'agence (FCFA)
}

/** Revenu de l'agence sur une réservation : commissions par partenaire + part définie dans l'offre. */
export interface ReservationRevenue {
  hotel: RevenueLine;
  transport: RevenueLine;
  guide: RevenueLine;
  agencyMargin: number; // part de l'agence définie dans l'offre (FCFA)
  total: number;        // total des revenus de l'agence sur cette réservation
}

export function getReservationRevenue(r: ReservationData): ReservationRevenue {
  const offer = getAllPacks().find(p => p.id === r.packId) as OfferPricing | undefined;
  const partners = getAllPartners();

  // Hôtelier : priorité au partenaire réellement choisi lors de la réservation
  // (nom), puis aux IDs de l'offre (sélection multiple, puis ancien ID unique).
  const hotelPartner =
    partners.find(p => p.type === "hotelier" && p.name.trim().toLowerCase() === (r.hotelName ?? "").trim().toLowerCase()) ||
    (offer?.hotelPartnerIds?.length ? partners.find(p => p.type === "hotelier" && offer.hotelPartnerIds!.includes(p.id)) : undefined) ||
    (offer?.hotelPartnerId ? partners.find(p => p.type === "hotelier" && p.id === offer.hotelPartnerId) : undefined);

  // Agence de voyages : même logique (choix réservation → IDs de l'offre).
  const transportPartner =
    partners.find(p => p.type === "agence-voyages" && p.name.trim().toLowerCase() === (r.transportAgency ?? "").trim().toLowerCase()) ||
    (offer?.transportPartnerIds?.length ? partners.find(p => p.type === "agence-voyages" && offer.transportPartnerIds!.includes(p.id)) : undefined) ||
    (offer?.transportPartnerId ? partners.find(p => p.type === "agence-voyages" && p.id === offer.transportPartnerId) : undefined);

  // Guides : sélectionnés lors de la réservation, sinon ceux liés à l'offre
  const guideIds = r.guideIds?.length
    ? r.guideIds
    : (r.guideId ? [r.guideId] : (offer?.guideIds ?? []));
  const guides = guideIds
    .map(id => getAllGuides().find(g => g.id === id))
    .filter((g): g is GuideData => Boolean(g));

  const hotelBase = r.hotelPrice ?? 0;
  const transportBase = r.transportPrice ?? 0;
  const guideBase = guides.reduce((sum, g) => sum + (g.price ?? 0) * (r.days || 1), 0);
  const guideCommission = guides.reduce(
    (sum, g) => sum + Math.round((g.price ?? 0) * (r.days || 1) * ((g.commission ?? 10) / 100)), 0
  );

  const hotelRate = hotelPartner?.contract?.commissionRate ?? 0;
  const transportRate = transportPartner?.contract?.commissionRate ?? 0;
  const guideRate = guides[0]?.commission ?? 10; // 10% par défaut si aucun taux n'a été défini au contrat

  const hotel: RevenueLine = {
    name: hotelPartner?.name || r.hotelName || "—",
    rate: hotelRate,
    base: hotelBase,
    commission: Math.round(hotelBase * hotelRate / 100),
  };
  const transport: RevenueLine = {
    name: transportPartner?.name || r.transportAgency || "—",
    rate: transportRate,
    base: transportBase,
    commission: Math.round(transportBase * transportRate / 100),
  };
  const guideLine: RevenueLine = {
    name: guides.length ? guides.map(g => g.name).join(", ") : (r.guideName || "—"),
    rate: guideRate,
    base: guideBase,
    commission: guideCommission,
  };
  const agencyMargin = Number(offer?.agencyMargin ?? 0) || 0;

  return {
    hotel,
    transport,
    guide: guideLine,
    agencyMargin,
    total: hotel.commission + transport.commission + guideLine.commission + agencyMargin,
  };
}

// --- Packs composites ---
export const COMPOSITE_PACKS = [
  {
    id: "cp1", name: "Kribi Tout Compris",
    offer: "Chutes de la Lobé", hotel: "Kribi Beach Hotel",
    transport: "Douala → Kribi (Minibus)", totalPrice: 245000,
    status: "Publié", agency: "Star Voyages",
  },
  {
    id: "cp2", name: "Aventure Mont Cameroun VIP",
    offer: "Mont Cameroun Trek", hotel: "Hôtel La Falaise",
    transport: "Douala → Limbe (4x4)", totalPrice: 415000,
    status: "Brouillon", agency: "Star Voyages",
  },
];

// --- Offres en attente de validation admin ---
export const PENDING_OFFERS = [
  { id: "off1", title: "Ebolowa Découverte", agency: "Wouri Voyages", type: "Circuit", price: 160000, submittedAt: "01/06/2026" },
  { id: "off2", title: "Maroua Sauvage", agency: "Afrique Sauvage", type: "Safari", price: 380000, submittedAt: "02/06/2026" },
  { id: "off3", title: "Foumban Royal", agency: "Mont Aventure", type: "Culturel", price: 220000, submittedAt: "03/06/2026" },
];

// --- Offres créées depuis le dashboard agence ---
// Données persistées dans data/custom-offers.json via /api/custom-offers.
// Cache local synchronisé avec l'API.

let _offlineOffers: PackItem[] | null = null;
let _hiddenIds: string[] = [];
let _dataListeners: (() => void)[] = [];

export function subscribeToDataChanges(listener: () => void) {
  _dataListeners.push(listener);
  return () => { _dataListeners = _dataListeners.filter(l => l !== listener); };
}

function notifyDataChanges() {
  _dataListeners.forEach(l => l());
}

export async function loadCustomOffers(): Promise<void> {
  if (_offlineOffers !== null) return;
  try {
    const res = await fetch("/api/custom-offers");
    const store = await res.json();
    _offlineOffers = Array.isArray(store) ? store : (store.custom ?? []);
    _hiddenIds = store.hidden ?? [];
    notifyDataChanges();
  } catch {
    _offlineOffers = [];
    notifyDataChanges();
  }
}

export function getAllPacks(): PackItem[] {
  return [...(_offlineOffers ?? []), ...CIRCUITS, ...PACKS];
}

function isAgencyAccountActiveById(agencyId?: string): boolean {
  if (!agencyId || typeof window === "undefined") return true;
  const agency = AGENCIES.find((a) => a.id === agencyId);
  if (!agency?.userId) return true;
  try {
    const stored = JSON.parse(window.localStorage.getItem("dt_users_db") || "[]") as Array<{ id?: string; accountStatus?: string }>;
    const user = Array.isArray(stored) ? stored.find((u) => u?.id === agency.userId) : undefined;
    if (user) return user.accountStatus !== "suspended";
  } catch {
    /* ignore */
  }
  return true;
}

export function getActiveAgencies() {
  return AGENCIES.filter((a) => isAgencyAccountActiveById(a.id));
}

export function getPublicPacks() {
  return getAllPacks().filter(
    (p) => !_hiddenIds.includes(p.id) && isAgencyAccountActiveById(p.agencyId)
  );
}

export async function saveCustomOffer(offer: typeof PACKS[0]) {
  if (!_offlineOffers) _offlineOffers = [];
  _offlineOffers.unshift(offer);
  notifyDataChanges();
  try {
    await fetch("/api/custom-offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(offer),
    });
  } catch { /* ignore */ }
}

export async function removeCustomOffer(id: string) {
  if (_offlineOffers) _offlineOffers = _offlineOffers.filter((o) => o.id !== id);
  notifyDataChanges();
  try {
    await fetch("/api/custom-offers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  } catch { /* ignore */ }
}

export async function hidePack(id: string) {
  if (!_hiddenIds.includes(id)) _hiddenIds.push(id);
  notifyDataChanges();
  try {
    await fetch("/api/custom-offers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, hidden: true }),
    });
  } catch { /* ignore */ }
}

export async function unhidePack(id: string) {
  _hiddenIds = _hiddenIds.filter((h) => h !== id);
  notifyDataChanges();
  try {
    await fetch("/api/custom-offers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, hidden: false }),
    });
  } catch { /* ignore */ }
}

export async function updateCustomOffer(id: string, updates: Partial<typeof PACKS[0]>) {
  if (!_offlineOffers) _offlineOffers = [];
  let changed = false;
  const idx = _offlineOffers.findIndex(o => o.id === id);
  if (idx !== -1) {
    _offlineOffers[idx] = { ...(_offlineOffers[idx] as any), ...updates } as any;
    changed = true;
  }
  // Mettre à jour aussi dans les packs intégrés (pour les offres built-in modifiables)
  const builtIdx = PACKS.findIndex(p => p.id === id);
  if (builtIdx !== -1) {
    (PACKS as any)[builtIdx] = { ...PACKS[builtIdx], ...updates };
    changed = true;
  }
  if (changed) notifyDataChanges();
  try {
    await fetch("/api/custom-offers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
  } catch { /* ignore */ }
}

export function isPackHidden(id: string) {
  return _hiddenIds.includes(id);
}

export function getCustomOfferCount() {
  return _offlineOffers?.length ?? 0;
}

// --- Réservations persistées ---

let _savedReservations: ReservationData[] | null = null;

export async function loadSavedReservations(): Promise<void> {
  if (_savedReservations !== null) return;
  try {
    const res = await fetch("/api/reservations");
    const data = await res.json();
    _savedReservations = Array.isArray(data) ? data : [];
  } catch {
    _savedReservations = [];
  }
  notifyDataChanges();
}

export function getAllReservations(): ReservationData[] {
  // Une réservation persistée portant la même référence remplace la réservation intégrée :
  // cela permet d'annuler ou supprimer aussi les réservations de démonstration.
  const byRef = new Map<string, ReservationData>();
  for (const r of RESERVATIONS) byRef.set(r.ref, r);
  for (const r of (_savedReservations ?? [])) byRef.set(r.ref, r);
  return Array.from(byRef.values()).filter((r) => !(r as ReservationData & { _deleted?: boolean })._deleted);
}

export function getReservationsByUser(userId: string): ReservationData[] {
  return getAllReservations().filter(r => r.userId === userId);
}

export function getReservationsByAgency(agencyId: string): ReservationData[] {
  const packIds = getAllPacks().filter(p => p.agencyId === agencyId).map(p => p.id);
  return getAllReservations().filter(r =>
    (r.agencyId && r.agencyId === agencyId) ||   // réservations récentes : lien direct
    (!r.agencyId && packIds.includes(r.packId))  // anciennes réservations : repli sur l'offre
  );
}

export async function pushReservation(res: ReservationData): Promise<void> {
  if (!_savedReservations) _savedReservations = [];
  _savedReservations.unshift(res);
  notifyDataChanges();
  try {
    await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(res),
    });
  } catch { /* ignore */ }
}

/** Annule une réservation (elle ne compte plus dans les revenus). */
export async function setReservationStatus(res: ReservationData, status: ReservationData["status"]): Promise<void> {
  const updated = { ...res, status };
  if (!_savedReservations) _savedReservations = [];
  const index = _savedReservations.findIndex((r) => r.ref === res.ref);
  if (index >= 0) _savedReservations[index] = updated;
  else _savedReservations.push(updated);
  notifyDataChanges();
  try {
    await fetch("/api/reservations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: res.ref, status }),
    });
  } catch { /* ignore */ }
}

/** Supprime définitivement une réservation de l'agence. */
export async function deleteReservation(ref: string): Promise<void> {
  if (!_savedReservations) _savedReservations = [];
  _savedReservations = _savedReservations.filter((r) => r.ref !== ref);
  _savedReservations.push({ ref, _deleted: true } as unknown as ReservationData);
  notifyDataChanges();
  try {
    await fetch("/api/reservations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref }),
    });
  } catch { /* ignore */ }
}

// --- Avis persistés ---

let _savedReviews: ReviewData[] | null = null;

export async function loadSavedReviews(): Promise<void> {
  if (_savedReviews !== null) return;
  try {
    const res = await fetch("/api/reviews");
    const data = await res.json();
    _savedReviews = Array.isArray(data) ? data : [];
  } catch {
    _savedReviews = [];
  }
}

export function getAllReviews(): ReviewData[] {
  return [...REVIEWS, ...(_savedReviews ?? [])];
}

export function getReviewsByPack(packId: string): ReviewData[] {
  return getAllReviews().filter(r => r.packId === packId);
}

export function getReviewsByUser(userId: string): ReviewData[] {
  return getAllReviews().filter(r => r.userId === userId);
}

export async function pushReview(rev: ReviewData): Promise<void> {
  if (!_savedReviews) _savedReviews = [];
  _savedReviews.unshift(rev);
  try {
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rev),
    });
  } catch { /* ignore */ }
}

// --- Messagerie ---
export interface MessageData {
  id: string;
  senderId: string;
  receiverId: string;
  packId?: string;
  text: string;
  createdAt: string;
  read: boolean;
}

let _savedMessages: MessageData[] = [];

export async function loadSavedMessages(): Promise<void> {
  try {
    const res = await fetch("/api/messages");
    const data = await res.json();
    _savedMessages = Array.isArray(data) ? data : [];
  } catch {
    _savedMessages = [];
  }
}

export function getAllMessages(): MessageData[] {
  return [...(_savedMessages ?? [])];
}

export function getConversations(userId: string): { withUserId: string; packId?: string; lastMessage: MessageData }[] {
  const msgs = getAllMessages().filter(m => m.senderId === userId || m.receiverId === userId);
  const convMap = new Map<string, { withUserId: string; packId?: string; lastMessage: MessageData }>();
  for (const m of msgs) {
    const otherId = m.senderId === userId ? m.receiverId : m.senderId;
    const key = m.packId ? `${otherId}_${m.packId}` : otherId;
    const existing = convMap.get(key);
    if (!existing || m.createdAt > existing.lastMessage.createdAt) {
      convMap.set(key, { withUserId: otherId, packId: m.packId, lastMessage: m });
    }
  }
  return Array.from(convMap.values()).sort((a, b) => b.lastMessage.createdAt.localeCompare(a.lastMessage.createdAt));
}

export function getMessagesBetween(userId: string, otherId: string, packId?: string): MessageData[] {
  return getAllMessages().filter(m => {
    const matchPair = (m.senderId === userId && m.receiverId === otherId) || (m.senderId === otherId && m.receiverId === userId);
    if (!matchPair) return false;
    if (packId) return m.packId === packId;
    return true;
  }).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function sendMessage(msg: MessageData): Promise<void> {
  if (!_savedMessages) _savedMessages = [];
  _savedMessages.push(msg);
  try {
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg),
    });
  } catch { /* ignore */ }
}

export async function markMessagesRead(userId: string, otherId: string): Promise<void> {
  let changed = false;
  for (const m of _savedMessages) {
    if (m.receiverId === userId && m.senderId === otherId && !m.read) {
      m.read = true;
      changed = true;
    }
  }
  if (changed) {
    try { await fetch("/api/messages", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, otherId }) }); } catch { /* ignore */ }
  }
}

export function getUnreadCount(userId: string): number {
  return getAllMessages().filter(m => m.receiverId === userId && !m.read).length;
}
