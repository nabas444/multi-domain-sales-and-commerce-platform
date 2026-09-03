'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  Button,
  Input,
  Badge,
} from '@platform/ui';
import {
  Building2,
  Search,
  Filter,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

interface MarketplaceListing {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  domain_name: string;
  category_name: string;
  organization_name: string;
  primary_media_url: string;
  attributes: Record<string, any>;
  location?: {
    city?: string;
    subcity?: string;
    address?: string;
  };
}

export default function MarketplaceCatalogPage() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [selectedDomain, setSelectedDomain] = useState('real-estate');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketplaceListings();
  }, [selectedDomain, selectedCategory]);

  const fetchMarketplaceListings = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/v1/inventory/listings?status=PUBLISHED').catch(() => null);
      if (res && res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : (json?.data || []);
        if (items.length > 0) {
          setListings(items);
          return;
        }
      }
      setListings([
        {
          id: 'l1',
          title: 'Luxury 3-Bedroom Penthouse in Bole Atlas',
          slug: 'luxury-3-bedroom-penthouse-bole-atlas',
          price: 18500000,
          currency: 'ETB',
          domain_name: 'Real Estate',
          category_name: 'Apartments & Penthouses',
          organization_name: 'Apex Real Estate Group',
          primary_media_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
          attributes: {
            bedrooms: 3,
            bathrooms: 3,
            area_sqm: 240,
            floor_number: 12,
            title_status: 'Freehold Title Deed',
          },
          location: {
            city: 'Addis Ababa',
            subcity: 'Bole',
            address: 'Atlas Hotel Area, Ring Road Tower 12th Floor',
          },
        },
        {
          id: 'l2',
          title: 'Modern Corporate Office Floor in Mega Building',
          slug: 'modern-corporate-office-mega-building',
          price: 250000,
          currency: 'ETB / mo',
          domain_name: 'Real Estate',
          category_name: 'Commercial Real Estate',
          organization_name: 'Apex Real Estate Group',
          primary_media_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
          attributes: {
            area_sqm: 480,
            parking_spaces: 6,
            title_status: 'Freehold Title Deed',
          },
          location: {
            city: 'Addis Ababa',
            subcity: 'Bole',
            address: 'Bole Road, Mega Building 5th Floor',
          },
        },
        {
          id: 'l3',
          title: 'Executive 5-Bedroom Villa in Old Airport Diplomatic Zone',
          slug: 'executive-5-bedroom-villa-old-airport',
          price: 65000000,
          currency: 'ETB',
          domain_name: 'Real Estate',
          category_name: 'Villas & Houses',
          organization_name: 'Apex Real Estate Group',
          primary_media_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
          attributes: {
            bedrooms: 5,
            bathrooms: 6,
            area_sqm: 650,
            title_status: 'Freehold Title Deed',
          },
          location: {
            city: 'Addis Ababa',
            subcity: 'Old Airport',
            address: 'Near International Community School (ICS)',
          },
        },
      ]);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const filtered = (Array.isArray(listings) ? listings : []).filter((l) => {
    const matchSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === 'ALL' || l.category_name.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      {/* Top Marketplace Navigation */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/marketplace" className="flex items-center gap-2.5 font-bold text-lg text-zinc-900 tracking-tight">
              <div className="h-8 w-8 rounded bg-zinc-900 flex items-center justify-center text-white text-sm font-black">
                P
              </div>
              <span>Platform Commercial Marketplace</span>
            </Link>
            <div className="hidden md:flex items-center gap-1 text-sm font-medium text-zinc-600">
              <button
                onClick={() => setSelectedDomain('real-estate')}
                className={`px-3 py-1.5 rounded-md ${selectedDomain === 'real-estate' ? 'bg-zinc-100 text-zinc-900 font-semibold' : 'hover:text-zinc-900'}`}
              >
                Real Estate
              </button>
              <button
                onClick={() => setSelectedDomain('automotive')}
                className={`px-3 py-1.5 rounded-md ${selectedDomain === 'automotive' ? 'bg-zinc-100 text-zinc-900 font-semibold' : 'hover:text-zinc-900'}`}
              >
                Automotive &amp; Vehicles
              </button>
              <button
                onClick={() => setSelectedDomain('elevators')}
                className={`px-3 py-1.5 rounded-md ${selectedDomain === 'elevators' ? 'bg-zinc-100 text-zinc-900 font-semibold' : 'hover:text-zinc-900'}`}
              >
                Elevators
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm">Partner &amp; Agent Login</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Search Section */}
      <section className="bg-white border-b border-zinc-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="max-w-3xl space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">
              Direct Verified Developer &amp; Partner Inventory
            </h1>
            <p className="text-base text-zinc-600">
              Browse authentic verified properties in Addis Ababa with full title deed transparency and direct sales agent access.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search by neighborhood, project, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
            <div>
              <select
                className="w-full h-10 px-3 rounded-md border border-zinc-300 bg-white text-sm text-zinc-900"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="apartments">Apartments &amp; Penthouses</option>
                <option value="villas">Villas &amp; Houses</option>
                <option value="commercial">Commercial Real Estate</option>
              </select>
            </div>
            <div>
              <Button variant="primary" className="w-full h-10">
                Filter Results
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-zinc-500">
            Showing <strong className="text-zinc-900 font-semibold">{filtered.length}</strong> verified properties
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <Link key={item.id} href={`/marketplace/${item.slug}`} className="group">
              <Card className="h-full border border-zinc-200 overflow-hidden hover:border-zinc-400 transition-all hover:shadow-md bg-white">
                <div className="relative h-56 w-full bg-zinc-100 overflow-hidden">
                  <img
                    src={item.primary_media_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge variant="success" className="shadow-sm backdrop-blur bg-emerald-700/90 text-white border-0">
                      Verified Mandate
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-zinc-900/80 backdrop-blur text-white px-2.5 py-1 rounded text-xs font-mono font-bold">
                    {item.price.toLocaleString()} {item.currency}
                  </div>
                </div>

                <CardContent className="p-5 space-y-3">
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    {item.category_name}
                  </div>
                  <h3 className="font-bold text-zinc-900 text-base line-clamp-1 group-hover:text-zinc-700">
                    {item.title}
                  </h3>

                  {item.location && (
                    <div className="text-xs text-zinc-500 flex items-center gap-1 line-clamp-1">
                      <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      {item.location.address || `${item.location.subcity}, ${item.location.city}`}
                    </div>
                  )}

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
                    {item.attributes.bedrooms && (
                      <div className="flex items-center gap-1 font-medium">
                        <BedDouble className="h-3.5 w-3.5 text-zinc-400" />
                        {item.attributes.bedrooms} Beds
                      </div>
                    )}
                    {item.attributes.bathrooms && (
                      <div className="flex items-center gap-1 font-medium">
                        <Bath className="h-3.5 w-3.5 text-zinc-400" />
                        {item.attributes.bathrooms} Baths
                      </div>
                    )}
                    {item.attributes.area_sqm && (
                      <div className="flex items-center gap-1 font-medium">
                        <Maximize2 className="h-3.5 w-3.5 text-zinc-400" />
                        {item.attributes.area_sqm} m²
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
