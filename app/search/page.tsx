"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DtNavbar, DtFooter } from "@/src/components/dt-navbar";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { Label } from "@/src/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { getPublicPacks, AGENCIES } from "@/src/lib/njangui-data";
import { useOffersLoader } from "@/src/hooks/use-offers-loader";
import { Search as SearchIcon, Filter, Clock, MapPin } from "lucide-react";
import { useLang } from "@/src/lib/lang";

function SearchContent() {
  useOffersLoader();
  const { t } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDestination = searchParams.get("destination") || "";
  const initialCategory = searchParams.get("category") || "Tous";
  const initialAgency = searchParams.get("agency") || "Toutes";
  const initialMaxPrice = searchParams.get("maxPrice") || "";
  
  const [searchTerm, setSearchTerm] = useState(initialDestination);
  const [category, setCategory] = useState(initialCategory);
  const [agency, setAgency] = useState(initialAgency);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);

  const filteredPacks = getPublicPacks().filter((p) => {
    const matchDest = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.desc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = category === "Tous" || p.category === category;
    const matchAgency = agency === "Toutes" || p.agencyId === agency;
    const matchPrice = !maxPrice || p.price <= parseInt(maxPrice);
    return matchDest && matchCat && matchAgency && matchPrice;
  });

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar / Filters */}
      <aside className="w-full md:w-64 shrink-0 space-y-6">
        <Card className="sticky top-24">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-center gap-2 font-bold text-lg text-foreground border-b pb-3">
              <Filter size={20} /> {t("filters_title")}
            </div>
            
            <div className="space-y-2">
              <Label>{t("keyword_search_label")}</Label>
              <div className="relative">
                <SearchIcon size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input 
                  placeholder={t("keyword_search_placeholder")} 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("category_label")}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tous">{t("all_categories")}</SelectItem>
                  <SelectItem value="Aventure">{t("filter_aventure")}</SelectItem>
                  <SelectItem value="Luxe">{t("filter_luxe")}</SelectItem>
                  <SelectItem value="Détente">{t("filter_detente")}</SelectItem>
                  <SelectItem value="Culturel">Culturel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("budget_label")}</Label>
              <Input 
                type="number" 
                placeholder={t("budget_placeholder")} 
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("agency_label")}</Label>
              <Select value={agency} onValueChange={setAgency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Toutes">{t("all_agencies")}</SelectItem>
                  {AGENCIES.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              className="w-full" 
              onClick={() => {
                setSearchTerm("");
                setCategory("Tous");
                setAgency("Toutes");
                setMaxPrice("");
              }}
            >
              {t("reset_btn")}
            </Button>
          </CardContent>
        </Card>
      </aside>

      {/* Results list */}
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t("search_results")} ({filteredPacks.length})
          </h1>
        </div>

        {filteredPacks.length === 0 ? (
          <Card className="py-16 text-center text-muted-foreground border-dashed">
            <CardContent>{t("no_results")}</CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPacks.map((p) => {
              const ag = AGENCIES.find(a => a.id === p.agencyId);
              return (
                <Card key={p.id} className="overflow-hidden hover:shadow-xl transition-all group p-0 border-t-2 border-[#EA580C] flex flex-col h-full">
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <Badge className="absolute top-2 right-2 bg-[#EA580C]/90 hover:bg-[#EA580C] text-white">{p.category}</Badge>
                  </div>
                  <CardContent className="p-5 flex flex-col flex-1">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{p.name}</h3>
                      {ag && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                          <MapPin size={12} /> {ag.name} ({ag.city})
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{p.desc}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-auto pt-4 border-t">
                      <span className="flex items-center gap-1 text-muted-foreground"><Clock size={14} />{p.duration}</span>
                      <span className="font-bold text-[#EA580C] text-lg">{p.price.toLocaleString()} {t("fcfa")}</span>
                    </div>
                    <Button 
                      className="w-full mt-4 bg-background border border-[#EA580C]/30 text-[#EA580C] hover:bg-[#EA580C] hover:text-white"
                      onClick={() => router.push(`/offers/${p.id}`)}
                    >
                      {t("view_details")}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  const { t } = useLang();
  return (
    <div style={{ fontFamily: "Nunito, sans-serif" }} className="bg-background min-h-screen flex flex-col">
      <DtNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-5 py-8 w-full">
        <Suspense fallback={<div className="flex items-center justify-center p-20">{t("loading_spinner")}</div>}>
          <SearchContent />
        </Suspense>
      </main>

      <DtFooter />
    </div>
  );
}
