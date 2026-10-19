"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in react-leaflet
const fixLeafletIcon = () => {
  const L = require("leaflet");
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
};

let blueIcon: any = null, greenIcon: any = null;
if (typeof window !== "undefined") {
  const L = require("leaflet");
  blueIcon = new L.Icon({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
  greenIcon = new L.Icon({
    iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

interface MapProps {
  hotels: any[];
  onSelectHotel?: (hotelId: string) => void;
  selectedHotelId?: string | null;
}

export function DtMap({ hotels, onSelectHotel, selectedHotelId }: MapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fixLeafletIcon();
  }, []);

  if (!mounted) {
    return <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">Chargement de la carte...</div>;
  }

  // Centre par défaut (Cameroun)
  const center = hotels.length > 0 ? [hotels[0].lat, hotels[0].lng] : [4.05, 9.7];

  return (
    <MapContainer center={center as any} zoom={11} className="w-full h-full rounded-xl z-0 relative">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {hotels.map((h) => (
        <Marker key={h.id} position={[h.lat, h.lng]} icon={selectedHotelId === h.id ? greenIcon : blueIcon}>
          <Popup>
            <div className="text-center font-sans">
              <h4 className="font-bold text-foreground">{h.name}</h4>
              <p className="text-sm text-muted-foreground mb-2">{h.city}</p>
              <div className="font-bold text-[#EA580C] mb-2">{h.pricePerNight.toLocaleString()} FCFA / nuit</div>
              {onSelectHotel && (
                <button
                  className={`px-3 py-1 text-xs rounded font-bold w-full ${
                    selectedHotelId === h.id ? "bg-green-500 text-white" : "bg-[#EA580C] text-white"
                  }`}
                  onClick={() => onSelectHotel(h.id)}
                >
                  {selectedHotelId === h.id ? "Sélectionné" : "Sélectionner"}
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
