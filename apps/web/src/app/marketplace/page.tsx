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
  Truck,
  Layers,
} from 'lucide-react';

interface MarketplaceListing {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  domain_name: string;
  domain_slug: string;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketplaceListings();
  }, [selectedDomain]);

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

      // Rich multi-domain seed catalog
      setListings([
        // Real Estate
        {
          id: 'l1',
          title: 'Luxury 3-Bedroom Penthouse in Bole Atlas',
          slug: 'luxury-3-bedroom-penthouse-bole-atlas',
          price: 18500000,
          currency: 'ETB',
          domain_name: 'Real Estate',
          domain_slug: 'real-estate',
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
          domain_slug: 'real-estate',
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
          domain_slug: 'real-estate',
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
        // Automotive
        {
          id: 'l4',
          title: 'Toyota Land Cruiser 300 ZX V6 Twin Turbo',
          slug: 'toyota-land-cruiser-300-zx',
          price: 34500000,
          currency: 'ETB',
          domain_name: 'Automotive',
          domain_slug: 'automotive',
          category_name: 'Passenger SUVs',
          organization_name: 'Zemen Automotive PLC',
          primary_media_url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
          attributes: {
            year: 2025,
            transmission: 'Automatic 10-Speed',
            fuel: 'Petrol / Gasoline',
            mileage: '0 km (Brand New)',
          },
          location: {
            city: 'Addis Ababa',
            subcity: 'Bole',
            address: 'Bole Michael Showroom',
          },
        },
        {
          id: 'l5',
          title: 'Mercedes-Benz Actros 3340 Heavy Tipper Truck',
          slug: 'mercedes-benz-actros-3340',
          price: 16800000,
          currency: 'ETB',
          domain_name: 'Automotive',
          domain_slug: 'automotive',
          category_name: 'Commercial Heavy Equipment',
          organization_name: 'Zemen Automotive PLC',
          primary_media_url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80',
          attributes: {
            year: 2024,
            payload_tonnage: '20 Tons',
            engine: 'OM501LA V6 Turbo',
          },
          location: {
            city: 'Addis Ababa',
            subcity: 'Akaki Kaliti',
            address: 'Industrial Zone Logistics Yard',
          },
        },
        // Elevators
        {
          id: 'l6',
          title: 'Schindler 5500 Passenger High-Speed Elevator',
          slug: 'schindler-5500-passenger-elevator',
          price: 4900000,
          currency: 'ETB',
          domain_name: 'Elevators & Vertical Transport',
          domain_slug: 'elevators',
          category_name: 'Passenger Elevators',
          organization_name: 'Apex Vertical Engineering',
          primary_media_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=1200&q=80',
          attributes: {
            capacity: '13 Persons (1000 kg)',
            speed: '2.5 m/s',
            floors_max: '30 Floors',
          },
          location: {
            city: 'Addis Ababa',
            subcity: 'Kirkos',
            address: 'Kazanchis Engineering Hub',
          },
        },
      ]);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  const filtered = listings.filter((l) => {
    const matchDomain = selectedDomain === 'ALL' || l.domain_slug === selectedDomain;
    const matchCategory = selectedCategory === 'ALL' || l.category_name.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        l.category_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDomain && matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      {/* Top Marketplace Navigation */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-zinc-900 tracking-tight">
              <div className="h-8 w-8 rounded bg-zinc-900 flex items-center justify-center text-white text-sm font-black">
                MD
              </div>
              <span>Platform Commercial Marketplace</span>
            </Link>
            <div className="hidden md:flex items-center gap-1 text-sm font-medium text-zinc-600">
              <button
                onClick={() => {
                  setSelectedDomain('real-estate');
                  setSelectedCategory('ALL');
                }}
                className={`px-3 py-1.5 rounded-md transition-colors ${selectedDomain === 'real-estate' ? 'bg-zinc-900 text-white font-semibold shadow-sm' : 'hover:bg-zinc-100 hover:text-zinc-900'}`}
              >
                Real Estate
              </button>
              <button
                onClick={() => {
                  setSelectedDomain('automotive');
                  setSelectedCategory('ALL');
                }}
                className={`px-3 py-1.5 rounded-md transition-colors ${selectedDomain === 'automotive' ? 'bg-zinc-900 text-white font-semibold shadow-sm' : 'hover:bg-zinc-100 hover:text-zinc-900'}`}
              >
                Automotive &amp; Vehicles
              </button>
              <button
                onClick={() => {
                  setSelectedDomain('elevators');
                  setSelectedCategory('ALL');
                }}
                className={`px-3 py-1.5 rounded-md transition-colors ${selectedDomain === 'elevators' ? 'bg-zinc-900 text-white font-semibold shadow-sm' : 'hover:bg-zinc-100 hover:text-zinc-900'}`}
              >
                Elevators &amp; Heavy Lift
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">Workspace Dashboard</Button>
            </Link>
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
              {selectedDomain === 'automotive'
                ? 'Certified Commercial Vehicles & Passenger Fleets'
                : selectedDomain === 'elevators'
                ? 'Elevators, Escalators & Vertical Infrastructure'
                : 'Direct Verified Developer & Partner Real Estate'}
            </h1>
            <p className="text-base text-zinc-600">
              Browse authentic verified listings in Ethiopia with verified legal status, transparent pricing, and direct sales agency execution.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search by title, category, model, or keyword..."
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
                {selectedDomain === 'real-estate' && (
                  <>
                    <option value="apartments">Apartments &amp; Penthouses</option>
                    <option value="villas">Villas &amp; Houses</option>
                    <option value="commercial">Commercial Real Estate</option>
                  </>
                )}
                {selectedDomain === 'automotive' && (
                  <>
                    <option value="passenger">Passenger SUVs</option>
                    <option value="heavy">Commercial Heavy Equipment</option>
                  </>
                )}
                {selectedDomain === 'elevators' && (
                  <>
                    <option value="passenger">Passenger Elevators</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <Button
                variant="primary"
                className="w-full h-10"
                onClick={() => {
                  const el = document.getElementById('catalog-grid');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Filter Results ({filtered.length})
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Grid */}
      <main id="catalog-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-zinc-500">
            Showing <strong className="text-zinc-900 font-semibold">{filtered.length}</strong> verified items in{' '}
            <span className="capitalize font-semibold text-zinc-800">{selectedDomain.replace('-', ' ')}</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-zinc-200">
            <Layers className="h-10 w-10 text-zinc-400 mx-auto mb-2" />
            <div className="font-semibold text-zinc-800">No listings match your filter.</div>
            <p className="text-xs text-zinc-500 mt-1">Try selecting a different domain or clearing your search term.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
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
                      {item.attributes.year && (
                        <div className="font-medium">
                          Year: {item.attributes.year}
                        </div>
                      )}
                      {item.attributes.speed && (
                        <div className="font-medium">
                          Speed: {item.attributes.speed}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
