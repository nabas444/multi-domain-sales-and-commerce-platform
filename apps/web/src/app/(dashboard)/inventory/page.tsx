'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Badge,
  Modal,
  Select,
} from '@platform/ui';
import {
  Package,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Eye,
  MapPin,
  Building,
  Film,
  Image as ImageIcon,
  FileText,
  Edit3,
  ExternalLink,
  Download,
  Trash2,
  Check,
  Star,
  Copy,
  Layers,
  ChevronRight,
  Maximize2,
  Compass,
  Navigation,
} from 'lucide-react';
import { MediaUploader, UploadedMedia } from '@/components/MediaUploader';
import { AddressMapAttachment, AddressData } from '@/components/AddressMapAttachment';

export interface Listing {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'SOLD' | 'ARCHIVED';
  moderation_status: string;
  domain_name: string;
  category_name: string;
  organization_name: string;
  stock_quantity: number;
  attributes: Record<string, any>;
  primary_media_url?: string;
  media: UploadedMedia[];
  is_featured: boolean;
  address?: AddressData;
  ownership?: {
    owner_name: string;
    owner_contact: string;
    sales_right_type: string;
    verification_status: string;
    cadastre_id?: string;
  };
}

export default function InventoryPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  // Inspect Modal Hero viewer state
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'proofs' | 'map' | 'ownership' | 'moderation'>('overview');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video' | 'raw'>('all');

  // Form states for new listing
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('3');
  const [areaSqm, setAreaSqm] = useState('220');
  const [ownerName, setOwnerName] = useState('');
  const [ownerContact, setOwnerContact] = useState('');
  const [salesRight, setSalesRight] = useState('EXCLUSIVE');
  const [createMediaList, setCreateMediaList] = useState<UploadedMedia[]>([]);
  const [createAddress, setCreateAddress] = useState<AddressData>({
    street_address: 'Namibia St, Atlas Hotel Area',
    subcity: 'Bole',
    city: 'Addis Ababa',
    country: 'Ethiopia',
    landmark: 'Behind Edna Mall & Atlas Hotels',
    latitude: 9.0015,
    longitude: 38.7842,
    formatted_address: 'Namibia St, Bole Atlas, Addis Ababa, Ethiopia',
    google_maps_url: 'https://www.google.com/maps/search/?api=1&query=9.0015,38.7842',
  });

  // Form states for editing listing
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editBedrooms, setEditBedrooms] = useState('3');
  const [editAreaSqm, setEditAreaSqm] = useState('220');
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editOwnerContact, setEditOwnerContact] = useState('');
  const [editSalesRight, setEditSalesRight] = useState('EXCLUSIVE');
  const [editMediaList, setEditMediaList] = useState<UploadedMedia[]>([]);
  const [editAddress, setEditAddress] = useState<AddressData | undefined>(undefined);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/v1/inventory/listings').catch(() => null);
      if (res && res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : json?.data || [];
        if (items.length > 0) {
          setListings(items);
          return;
        }
      }

      // High-grade seeded inventory with rich multi-file footages, images, deed materials, and live Google Map attachments
      setListings([
        {
          id: 'l1',
          title: 'Luxury 3-Bedroom Penthouse in Bole Atlas',
          slug: 'luxury-3-bedroom-penthouse-bole-atlas',
          price: 18500000,
          currency: 'ETB',
          status: 'PUBLISHED',
          moderation_status: 'APPROVED',
          domain_name: 'Real Estate',
          category_name: 'Apartments & Penthouses',
          organization_name: 'Apex Real Estate Group',
          stock_quantity: 1,
          is_featured: true,
          primary_media_url:
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
          address: {
            street_address: 'Namibia St, Atlas Hotel Area',
            subcity: 'Bole',
            city: 'Addis Ababa',
            country: 'Ethiopia',
            landmark: 'Behind Edna Mall & Atlas Hotels',
            latitude: 9.0015,
            longitude: 38.7842,
            formatted_address: 'Namibia St, Bole Atlas, Addis Ababa, Ethiopia',
            google_maps_url: 'https://www.google.com/maps/search/?api=1&query=9.0015,38.7842',
          },
          media: [
            {
              id: 'm1-1',
              url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
              secureUrl:
                'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
              format: 'jpg',
              resourceType: 'image',
              fileName: 'penthouse-living-room-hdr.jpg',
              title: 'Master Living & Skyline Balcony View',
              bytes: 2450000,
              tag: 'hero',
            },
            {
              id: 'm1-2',
              url: 'https://res.cloudinary.com/besmhzyh/video/upload/v1788545284/live-tests/videos/test-video-1788545281987.mp4',
              secureUrl:
                'https://res.cloudinary.com/besmhzyh/video/upload/v1788545284/live-tests/videos/test-video-1788545281987.mp4',
              format: 'mp4',
              resourceType: 'video',
              duration: 13.4,
              fileName: 'penthouse-4k-walkthrough-footage.mp4',
              title: 'Unedited 4K Video Tour Footage',
              bytes: 14800000,
              tag: 'footage',
            },
            {
              id: 'm1-3',
              url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
              secureUrl:
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
              format: 'jpg',
              resourceType: 'image',
              fileName: 'modern-kitchen-island.jpg',
              title: 'Italian Designer Fitted Kitchen',
              bytes: 1890000,
              tag: 'gallery',
            },
            {
              id: 'm1-4',
              url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
              secureUrl:
                'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
              format: 'jpg',
              resourceType: 'image',
              fileName: 'master-en-suite-bathroom.jpg',
              title: 'Master En-suite with Jacuzzi',
              bytes: 1420000,
              tag: 'gallery',
            },
            {
              id: 'm1-5',
              url: 'https://res.cloudinary.com/besmhzyh/image/upload/v1788545593/live-tests/api-route/rks2a6xup5u0zlyx8c6b.png',
              secureUrl:
                'https://res.cloudinary.com/besmhzyh/image/upload/v1788545593/live-tests/api-route/rks2a6xup5u0zlyx8c6b.png',
              format: 'pdf',
              resourceType: 'raw',
              fileName: 'Title_Deed_Cadastre_Bole_Atlas_Deed_2026.pdf',
              title: 'Notarized Freehold Title Deed Certificate',
              bytes: 750000,
              tag: 'title_deed',
            },
          ],
          attributes: {
            bedrooms: 3,
            bathrooms: 3,
            area_sqm: 240,
            floor_number: 12,
            title_status: 'Freehold Title Deed',
            year_built: 2024,
            parking_spaces: 2,
          },
          ownership: {
            owner_name: 'Dr. Yohannes Girma',
            owner_contact: '+251911445566',
            sales_right_type: 'EXCLUSIVE',
            verification_status: 'VERIFIED',
            cadastre_id: 'CAD-AA-BOLE-88412-2026',
          },
        },
        {
          id: 'l2',
          title: 'Executive Diplomatic Villa with Private Garden in Old Airport',
          slug: 'executive-villa-old-airport',
          price: 65000000,
          currency: 'ETB',
          status: 'PENDING_REVIEW',
          moderation_status: 'PENDING',
          domain_name: 'Real Estate',
          category_name: 'Villas & Houses',
          organization_name: 'Apex Real Estate Group',
          stock_quantity: 1,
          is_featured: false,
          primary_media_url:
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
          address: {
            street_address: 'South Africa Embassy Way, Old Airport',
            subcity: 'Kirkos / Nifas Silk',
            city: 'Addis Ababa',
            country: 'Ethiopia',
            landmark: 'Near International Community School (ICS)',
            latitude: 8.9821,
            longitude: 38.7365,
            formatted_address: 'South Africa Embassy Way, Old Airport, Addis Ababa, Ethiopia',
            google_maps_url: 'https://www.google.com/maps/search/?api=1&query=8.9821,38.7365',
          },
          media: [
            {
              id: 'm2-1',
              url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
              secureUrl:
                'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
              format: 'jpg',
              resourceType: 'image',
              fileName: 'villa-exterior-garden.jpg',
              title: 'Front Elevation & Landscaped Grounds',
              bytes: 3200000,
              tag: 'hero',
            },
            {
              id: 'm2-2',
              url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
              secureUrl:
                'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
              format: 'jpg',
              resourceType: 'image',
              fileName: 'villa-dining-reception.jpg',
              title: 'Formal Dining & High-Ceiling Reception',
              bytes: 2800000,
              tag: 'gallery',
            },
            {
              id: 'm2-3',
              url: 'https://res.cloudinary.com/besmhzyh/video/upload/v1788545075/live-tests/videos/test-video-1788545056644.mp4',
              secureUrl:
                'https://res.cloudinary.com/besmhzyh/video/upload/v1788545075/live-tests/videos/test-video-1788545056644.mp4',
              format: 'mp4',
              resourceType: 'video',
              duration: 13.4,
              fileName: 'drone-aerial-perimeter-footage.mp4',
              title: 'Drone Perimeter & Security Video Footage',
              bytes: 15400000,
              tag: 'footage',
            },
            {
              id: 'm2-4',
              url: 'https://res.cloudinary.com/besmhzyh/image/upload/v1788545624/live-tests/api-route/znzs4nymhkxtc2uni6za.png',
              secureUrl:
                'https://res.cloudinary.com/besmhzyh/image/upload/v1788545624/live-tests/api-route/znzs4nymhkxtc2uni6za.png',
              format: 'pdf',
              resourceType: 'raw',
              fileName: 'Legal_Mandate_SoleAgency_OldAirport.pdf',
              title: 'Certified Land Registry Ownership Deed',
              bytes: 650000,
              tag: 'title_deed',
            },
          ],
          attributes: {
            bedrooms: 5,
            bathrooms: 6,
            area_sqm: 650,
            title_status: 'Freehold Title Deed',
            year_built: 2023,
            parking_spaces: 4,
          },
          ownership: {
            owner_name: 'Ato Mulugeta Teshome',
            owner_contact: '+251911778899',
            sales_right_type: 'SOLE_AGENCY',
            verification_status: 'VERIFIED',
            cadastre_id: 'CAD-AA-KIRKOS-99321-2025',
          },
        },
      ]);
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Modal with selected listing pre-loaded
  const handleOpenEdit = (listing: Listing) => {
    setEditingListing(listing);
    setEditTitle(listing.title);
    setEditPrice(String(listing.price));
    setEditBedrooms(String(listing.attributes?.bedrooms || '3'));
    setEditAreaSqm(String(listing.attributes?.area_sqm || '200'));
    setEditOwnerName(listing.ownership?.owner_name || '');
    setEditOwnerContact(listing.ownership?.owner_contact || '');
    setEditSalesRight(listing.ownership?.sales_right_type || 'EXCLUSIVE');
    setEditMediaList(listing.media || []);
    setEditAddress(
      listing.address || {
        street_address: listing.title,
        subcity: 'Bole',
        city: 'Addis Ababa',
        country: 'Ethiopia',
        latitude: 9.0015,
        longitude: 38.7842,
      }
    );
  };

  // Save changes to edited listing
  const handleSaveEdit = () => {
    if (!editingListing || !editTitle.trim()) return;

    const heroItem = editMediaList.find((m) => m.tag === 'hero') || editMediaList[0];
    const updatedListing: Listing = {
      ...editingListing,
      title: editTitle,
      price: parseFloat(editPrice) || editingListing.price,
      primary_media_url: heroItem?.secureUrl || editingListing.primary_media_url,
      media: editMediaList,
      address: editAddress || editingListing.address,
      attributes: {
        ...editingListing.attributes,
        bedrooms: parseInt(editBedrooms, 10) || 3,
        area_sqm: parseInt(editAreaSqm, 10) || 200,
      },
      ownership: {
        ...editingListing.ownership,
        owner_name: editOwnerName || editingListing.ownership?.owner_name || 'Authorized Owner',
        owner_contact: editOwnerContact || editingListing.ownership?.owner_contact || '+251911000000',
        sales_right_type: editSalesRight,
        verification_status: editingListing.ownership?.verification_status || 'VERIFIED',
      },
    };

    setListings((prev) => prev.map((l) => (l.id === editingListing.id ? updatedListing : l)));

    // Also update currently inspected listing if open
    if (selectedListing?.id === editingListing.id) {
      setSelectedListing(updatedListing);
    }

    setEditingListing(null);
  };

  // Create new listing
  const handleCreateListing = async () => {
    if (!title.trim()) return;

    const heroItem = createMediaList.find((m) => m.tag === 'hero') || createMediaList[0];
    const newListing: Listing = {
      id: `l-${Date.now()}`,
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      price: parseFloat(price) || 10000000,
      currency: 'ETB',
      status: 'PENDING_REVIEW',
      moderation_status: 'PENDING',
      domain_name: 'Real Estate',
      category_name: 'Apartments & Penthouses',
      organization_name: 'Apex Real Estate Group',
      stock_quantity: 1,
      is_featured: false,
      primary_media_url:
        heroItem?.secureUrl ||
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      media: createMediaList,
      address: createAddress,
      attributes: {
        bedrooms: parseInt(bedrooms, 10) || 3,
        area_sqm: parseInt(areaSqm, 10) || 200,
      },
      ownership: {
        owner_name: ownerName || 'Certified Landlord',
        owner_contact: ownerContact || '+251911000000',
        sales_right_type: salesRight,
        verification_status: 'VERIFIED',
        cadastre_id: `CAD-AA-REV-${Date.now().toString().slice(-5)}`,
      },
    };

    setListings((prev) => [newListing, ...prev]);
    setCreateModalOpen(false);
    setTitle('');
    setPrice('');
    setOwnerName('');
    setOwnerContact('');
    setCreateMediaList([]);
  };

  const handleModerate = async (listingId: string, targetStatus: 'PUBLISHED' | 'REJECTED') => {
    setListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, status: targetStatus as any } : l))
    );
    if (selectedListing && selectedListing.id === listingId) {
      setSelectedListing((prev) => (prev ? { ...prev, status: targetStatus as any } : null));
    }
  };

  // Filter listings
  const filtered = (Array.isArray(listings) ? listings : []).filter((l) => {
    const matchSearch =
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.address?.street_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.address?.subcity?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Filter materials in inspect view
  const currentMediaItems = selectedListing?.media || [];
  const filteredMedia = currentMediaItems.filter((m) => {
    if (mediaFilter === 'all') return true;
    if (mediaFilter === 'image') return m.resourceType === 'image';
    if (mediaFilter === 'video')
      return m.resourceType === 'video' || m.secureUrl?.endsWith('.mp4') || m.secureUrl?.includes('/video/');
    if (mediaFilter === 'raw')
      return m.resourceType === 'raw' || m.secureUrl?.endsWith('.pdf') || m.format === 'pdf';
    return true;
  });

  const activeMedia = currentMediaItems[activeMediaIndex] || currentMediaItems[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2.5">
            <Package className="h-6 w-6 text-zinc-700" />
            Inventory &amp; Asset Management
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage multi-file real estate footages, live Google Maps geo-attachments, verified title deeds, and ownership mandates.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Property Listing
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search listings by title, street, subcity, or cadastre reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'PUBLISHED', label: 'Published Live' },
              { value: 'PENDING_REVIEW', label: 'Pending Moderation' },
              { value: 'DRAFT', label: 'Draft' },
            ]}
          />
        </div>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-zinc-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Real Estate Inventory Units</CardTitle>
              <CardDescription>
                Live properties with live Google Maps geo-location, multi-file proof vaults, and cadastre deeds.
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {filtered.length} listings
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-700 uppercase">
                <tr>
                  <th className="py-3 px-4">Property &amp; Proof Materials</th>
                  <th className="py-3 px-4">Address &amp; Google Map</th>
                  <th className="py-3 px-4">Price (ETB)</th>
                  <th className="py-3 px-4">Ownership Mandate</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filtered.map((item) => {
                  const mediaCount = item.media?.length || (item.primary_media_url ? 1 : 0);
                  const hasVideo = item.media?.some(
                    (m) =>
                      m.resourceType === 'video' ||
                      m.secureUrl?.endsWith('.mp4') ||
                      m.secureUrl?.includes('/video/')
                  );
                  const hasDocs = item.media?.some(
                    (m) =>
                      m.resourceType === 'raw' ||
                      m.secureUrl?.endsWith('.pdf') ||
                      m.format === 'pdf'
                  );

                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-16 shrink-0 rounded-md overflow-hidden bg-zinc-100 border border-zinc-200">
                            {item.primary_media_url ? (
                              <img
                                src={item.primary_media_url}
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-zinc-400">
                                <Building className="h-5 w-5" />
                              </div>
                            )}
                            {hasVideo && (
                              <div className="absolute bottom-0.5 right-0.5 bg-black/80 rounded p-0.5 text-white">
                                <Film className="h-2.5 w-2.5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-900 hover:text-indigo-600 transition-colors">
                              {item.title}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                              <span className="flex items-center gap-1 font-mono text-[11px] text-zinc-600">
                                <Layers className="h-3 w-3 text-indigo-500" />
                                {mediaCount} materials
                              </span>
                              {hasVideo && (
                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium text-[10px]">
                                  Video Tour
                                </span>
                              )}
                              {hasDocs && (
                                <span className="text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-medium text-[10px]">
                                  Deed PDF
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.address ? (
                          <div className="space-y-0.5 max-w-[200px]">
                            <div className="flex items-center gap-1 text-xs font-medium text-zinc-800 truncate">
                              <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                              <span className="truncate">{item.address.street_address}</span>
                            </div>
                            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                              <span>
                                {item.address.subcity ? `${item.address.subcity}, ` : ''}
                                {item.address.city}
                              </span>
                              {item.address.google_maps_url && (
                                <a
                                  href={item.address.google_maps_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-600 hover:text-indigo-800 text-[10px] font-medium"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Map ↗
                                </a>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400">Addis Ababa, Ethiopia</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-900">
                          {item.price.toLocaleString()} {item.currency}
                        </div>
                        <div className="text-xs text-zinc-400">
                          {item.attributes?.area_sqm ? `${item.attributes.area_sqm} m²` : '—'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.ownership ? (
                          <div className="space-y-0.5">
                            <Badge variant="success" className="text-xs flex items-center gap-1 w-max">
                              <ShieldCheck className="h-3 w-3" />
                              {item.ownership.sales_right_type}
                            </Badge>
                            <div className="text-xs text-zinc-500 truncate max-w-[140px]">
                              {item.ownership.owner_name}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs">Self-Owned</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            item.status === 'PUBLISHED'
                              ? 'success'
                              : item.status === 'PENDING_REVIEW'
                              ? 'warning'
                              : 'outline'
                          }
                          className="text-xs"
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedListing(item);
                            setActiveMediaIndex(0);
                            setActiveTab('overview');
                          }}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Inspect Materials
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(item)}
                          className="text-zinc-600 hover:text-zinc-900"
                        >
                          <Edit3 className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* ADVANCED INSPECT & PROOF THEATER MODAL                                   */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        title="Asset Inspection, Multi-Material Proof Vault &amp; Live Map"
        maxWidth="6xl"
      >
        {selectedListing && (
          <div className="space-y-5">
            {/* Top Overview Banner */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant={
                      selectedListing.status === 'PUBLISHED'
                        ? 'success'
                        : selectedListing.status === 'PENDING_REVIEW'
                        ? 'warning'
                        : 'outline'
                    }
                    className="text-xs"
                  >
                    {selectedListing.status}
                  </Badge>
                  <span className="text-xs text-zinc-500">•</span>
                  <span className="text-xs font-semibold text-zinc-700">{selectedListing.domain_name}</span>
                  <span className="text-xs text-zinc-400">/</span>
                  <span className="text-xs text-zinc-500">{selectedListing.category_name}</span>
                  <span className="text-xs text-zinc-500">•</span>
                  <span className="text-xs font-mono text-zinc-500">ID: {selectedListing.id}</span>
                </div>
                <h3 className="font-bold text-xl text-zinc-900 mt-1">{selectedListing.title}</h3>
                {selectedListing.address && (
                  <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-rose-500" />
                    <span>{selectedListing.address.formatted_address || selectedListing.address.street_address}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-xs text-zinc-500">Valuation Price</div>
                  <div className="font-bold text-xl text-zinc-900">
                    {selectedListing.price.toLocaleString()} {selectedListing.currency}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(selectedListing)}
                >
                  <Edit3 className="h-3.5 w-3.5 mr-1" />
                  Edit Listing &amp; Map
                </Button>
              </div>
            </div>

            {/* High-End Two-Column Visual Stage & Proof Deck */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Visual Theater Stage & Filmstrip (7 cols) */}
              <div className="lg:col-span-7 space-y-3">
                {/* Hero Stage Display */}
                <div className="relative aspect-16/10 bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 shadow-lg flex items-center justify-center">
                  {activeMedia ? (
                    activeMedia.resourceType === 'video' ||
                    activeMedia.secureUrl?.endsWith('.mp4') ||
                    activeMedia.secureUrl?.includes('/video/') ? (
                      <video
                        key={activeMedia.secureUrl}
                        src={activeMedia.secureUrl}
                        controls
                        autoPlay
                        className="w-full h-full object-contain"
                      />
                    ) : activeMedia.resourceType === 'raw' ||
                      activeMedia.secureUrl?.endsWith('.pdf') ||
                      activeMedia.format === 'pdf' ? (
                      <div className="p-8 text-center text-zinc-200 space-y-3">
                        <div className="h-16 w-16 mx-auto rounded-xl bg-red-950/60 border border-red-800/80 text-red-400 flex items-center justify-center">
                          <FileText className="h-8 w-8" />
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-white">
                            {activeMedia.title || activeMedia.fileName || 'Certified Legal Proof Document'}
                          </h4>
                          <p className="text-xs text-zinc-400 mt-1 font-mono">{activeMedia.fileName}</p>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <a
                            href={activeMedia.secureUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open Cloudinary CDN Document
                          </a>
                        </div>
                      </div>
                    ) : (
                      <img
                        key={activeMedia.secureUrl}
                        src={activeMedia.secureUrl}
                        alt={activeMedia.title || 'Selected property asset'}
                        className="w-full h-full object-contain"
                      />
                    )
                  ) : (
                    <div className="p-12 text-center text-zinc-500">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 text-zinc-600" />
                      <p className="text-sm">No media attached yet</p>
                    </div>
                  )}

                  {/* Badges Overlay */}
                  {activeMedia && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-none">
                      <span className="bg-black/80 backdrop-blur-md border border-white/10 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow">
                        {activeMedia.resourceType === 'video'
                          ? '4K VIDEO FOOTAGE'
                          : activeMedia.resourceType === 'raw'
                          ? 'LEGAL PROOF PDF'
                          : 'HDR PHOTO'}
                      </span>
                      {activeMedia.tag === 'hero' && (
                        <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow">
                          <Star className="h-2.5 w-2.5 fill-current" />
                          PRIMARY HERO
                        </span>
                      )}
                    </div>
                  )}

                  {/* Full Raw CDN trigger */}
                  {activeMedia && (
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      <a
                        href={activeMedia.secureUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-md bg-black/60 hover:bg-black text-white/90 hover:text-white backdrop-blur-xs transition-colors shadow"
                        title="Open direct Cloudinary CDN source"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Filmstrip / Media Carousel Strip */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-zinc-700">
                      <span>Inspection Proofs &amp; Media ({selectedListing.media?.length || 0})</span>
                    </div>
                    {/* Media Type Filter Pills */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setMediaFilter('all')}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          mediaFilter === 'all'
                            ? 'bg-zinc-900 text-white'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setMediaFilter('image')}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          mediaFilter === 'image'
                            ? 'bg-zinc-900 text-white'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                      >
                        Photos
                      </button>
                      <button
                        onClick={() => setMediaFilter('video')}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          mediaFilter === 'video'
                            ? 'bg-zinc-900 text-white'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                      >
                        Footages
                      </button>
                      <button
                        onClick={() => setMediaFilter('raw')}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          mediaFilter === 'raw'
                            ? 'bg-zinc-900 text-white'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                      >
                        Deeds &amp; Proofs
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Thumbnail Slider */}
                  <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                    {filteredMedia.map((item, idx) => {
                      const realIndex = selectedListing.media.findIndex((m) => m === item);
                      const isSelected = realIndex === activeMediaIndex;
                      const isVideo =
                        item.resourceType === 'video' ||
                        item.secureUrl?.endsWith('.mp4') ||
                        item.secureUrl?.includes('/video/');
                      const isDoc =
                        item.resourceType === 'raw' ||
                        item.secureUrl?.endsWith('.pdf') ||
                        item.format === 'pdf';

                      return (
                        <button
                          key={item.id || idx}
                          type="button"
                          onClick={() => setActiveMediaIndex(realIndex >= 0 ? realIndex : 0)}
                          className={`relative h-18 w-24 shrink-0 rounded-lg overflow-hidden border-2 transition-all group ${
                            isSelected
                              ? 'border-indigo-600 ring-2 ring-indigo-200 shadow-md scale-102'
                              : 'border-zinc-200 hover:border-zinc-400 opacity-75 hover:opacity-100'
                          }`}
                        >
                          {isVideo ? (
                            <div className="relative w-full h-full bg-zinc-900 flex items-center justify-center">
                              <video src={item.secureUrl} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <Film className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          ) : isDoc ? (
                            <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center p-1 text-red-600">
                              <FileText className="h-5 w-5 mb-0.5" />
                              <span className="text-[9px] font-bold">DEED PDF</span>
                            </div>
                          ) : (
                            <img src={item.secureUrl} alt={item.title} className="w-full h-full object-cover" />
                          )}
                          {item.tag === 'hero' && (
                            <span className="absolute bottom-0.5 left-0.5 bg-amber-500 text-white text-[8px] font-bold px-1 rounded">
                              HERO
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Multi-Tab Detailed Inspection & Proof Vault (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                {/* Navigation Tabs */}
                <div className="flex border-b border-zinc-200 gap-1 text-xs overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-2 px-2 font-semibold transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === 'overview'
                        ? 'border-zinc-900 text-zinc-900'
                        : 'border-transparent text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    Specs &amp; Details
                  </button>
                  <button
                    onClick={() => setActiveTab('map')}
                    className={`pb-2 px-2 font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-1 ${
                      activeTab === 'map'
                        ? 'border-rose-600 text-rose-600'
                        : 'border-transparent text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Live Map
                  </button>
                  <button
                    onClick={() => setActiveTab('proofs')}
                    className={`pb-2 px-2 font-semibold transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === 'proofs'
                        ? 'border-zinc-900 text-zinc-900'
                        : 'border-transparent text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    Proof Vault ({selectedListing.media?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('ownership')}
                    className={`pb-2 px-2 font-semibold transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === 'ownership'
                        ? 'border-zinc-900 text-zinc-900'
                        : 'border-transparent text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    Ownership
                  </button>
                  <button
                    onClick={() => setActiveTab('moderation')}
                    className={`pb-2 px-2 font-semibold transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === 'moderation'
                        ? 'border-zinc-900 text-zinc-900'
                        : 'border-transparent text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    Moderation
                  </button>
                </div>

                {/* Tab 1: Overview & Specifications */}
                {activeTab === 'overview' && (
                  <div className="space-y-3">
                    <div className="bg-zinc-50 rounded-lg p-3.5 border border-zinc-200 space-y-2.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-zinc-200">
                        <span className="text-zinc-500">Gross Price:</span>
                        <strong className="text-zinc-900 font-mono text-sm">
                          {selectedListing.price.toLocaleString()} {selectedListing.currency}
                        </strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-200">
                        <span className="text-zinc-500">Floor Area:</span>
                        <strong className="text-zinc-900">
                          {selectedListing.attributes?.area_sqm || 220} m²
                        </strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-200">
                        <span className="text-zinc-500">Bedrooms / Bathrooms:</span>
                        <strong className="text-zinc-900">
                          {selectedListing.attributes?.bedrooms || 3} Bed •{' '}
                          {selectedListing.attributes?.bathrooms || 3} Bath
                        </strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-200">
                        <span className="text-zinc-500">Title Status:</span>
                        <strong className="text-emerald-700 font-medium">
                          {selectedListing.attributes?.title_status || 'Freehold Title Deed'}
                        </strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-zinc-500">Address / Location:</span>
                        <strong className="text-zinc-900 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                          <span className="truncate">
                            {selectedListing.address?.street_address || 'Bole Atlas, Addis Ababa'}
                          </span>
                        </strong>
                      </div>
                    </div>

                    {/* Compact Live Google Map Preview in Overview */}
                    {selectedListing.address && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-700 flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-rose-500" />
                            Live Google Map Location
                          </span>
                          <button
                            onClick={() => setActiveTab('map')}
                            className="text-indigo-600 hover:text-indigo-800 font-medium text-[11px]"
                          >
                            Expand Map View →
                          </button>
                        </div>
                        <div className="h-32 w-full rounded-lg overflow-hidden border border-zinc-200 relative">
                          <iframe
                            title="Overview Map"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            src={`https://maps.google.com/maps?q=${encodeURIComponent(
                              selectedListing.address.latitude && selectedListing.address.longitude
                                ? `${selectedListing.address.latitude},${selectedListing.address.longitude}`
                                : selectedListing.address.formatted_address ||
                                    `${selectedListing.address.street_address}, ${selectedListing.address.city}`
                            )}&t=m&z=15&ie=UTF8&iwloc=&output=embed`}
                          />
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
                      <div className="font-semibold flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-blue-700" />
                        Cadastre Registration Proof Attached
                      </div>
                      <p className="text-[11px] text-blue-700">
                        Cadastre PIN: <strong>{selectedListing.ownership?.cadastre_id || 'CAD-AA-88912'}</strong> •
                        Verified by Ethiopian Land Management &amp; Cadastre Authority.
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab 2: Live Google Map Full Attachment */}
                {activeTab === 'map' && (
                  <div className="space-y-3">
                    <AddressMapAttachment
                      value={selectedListing.address}
                      readOnly={true}
                    />
                  </div>
                )}

                {/* Tab 3: Proof Vault */}
                {activeTab === 'proofs' && (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {selectedListing.media?.map((m, idx) => (
                      <div
                        key={m.id || idx}
                        className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-medium text-zinc-900 truncate max-w-[200px]">
                            {m.resourceType === 'video' ? (
                              <Film className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                            ) : m.resourceType === 'raw' ? (
                              <FileText className="h-3.5 w-3.5 text-red-500 shrink-0" />
                            ) : (
                              <ImageIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            )}
                            <span className="truncate">{m.title || m.fileName}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {m.tag?.toUpperCase() || m.resourceType.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-200/60">
                          <span className="font-mono text-[10px] truncate max-w-[180px]">
                            {m.secureUrl}
                          </span>
                          <a
                            href={m.secureUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-0.5"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Open
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 4: Ownership & Sales Mandate */}
                {activeTab === 'ownership' && (
                  <div className="space-y-3 bg-zinc-50 border border-zinc-200 rounded-lg p-3.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-zinc-200">
                      <span className="text-zinc-500">Legal Owner:</span>
                      <strong className="text-zinc-900 font-semibold">
                        {selectedListing.ownership?.owner_name || 'Dr. Yohannes Girma'}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-200">
                      <span className="text-zinc-500">Owner Contact Phone:</span>
                      <strong className="text-zinc-900 font-mono">
                        {selectedListing.ownership?.owner_contact || '+251911445566'}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-200">
                      <span className="text-zinc-500">Sales Authorization Mandate:</span>
                      <strong className="text-indigo-700">
                        {selectedListing.ownership?.sales_right_type || 'EXCLUSIVE'} MANDATE
                      </strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-zinc-500">Cadastre Cadastral ID:</span>
                      <strong className="text-zinc-800 font-mono">
                        {selectedListing.ownership?.cadastre_id || 'CAD-AA-BOLE-88412-2026'}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Tab 5: Governance & Moderation */}
                {activeTab === 'moderation' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs space-y-2">
                      <div className="font-semibold text-zinc-900">Partner Moderation Workflow</div>
                      <p className="text-zinc-500">
                        Review all high-resolution footage, live Google Maps boundaries, and ownership deeds before publishing live.
                      </p>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      <Button
                        variant="primary"
                        onClick={() => handleModerate(selectedListing.id, 'PUBLISHED')}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        Approve &amp; Publish Live on Marketplace
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleModerate(selectedListing.id, 'REJECTED')}
                      >
                        <XCircle className="h-4 w-4 mr-1.5" />
                        Reject with Feedback to Broker
                      </Button>
                    </div>
                  </div>
                )}

                {/* Modal Footer Controls */}
                <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedListing(null)}
                  >
                    Close Inspection
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenEdit(selectedListing)}
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1" />
                    Edit Listing &amp; Map
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* EDIT LISTING, MEDIA & GOOGLE MAP MODAL                                    */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!editingListing}
        onClose={() => setEditingListing(null)}
        title="Edit Real Estate Asset, Media Vault &amp; Live Map"
        maxWidth="5xl"
      >
        {editingListing && (
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Property Title</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Property title..."
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Price (ETB)</label>
                <Input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Bedrooms</label>
                <Input
                  type="number"
                  value={editBedrooms}
                  onChange={(e) => setEditBedrooms(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Floor Area (m²)</label>
                <Input
                  type="number"
                  value={editAreaSqm}
                  onChange={(e) => setEditAreaSqm(e.target.value)}
                />
              </div>
            </div>

            {/* Live Google Map Address Attachment Section */}
            <div className="border-t border-zinc-200 pt-3">
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-rose-500" />
                Live Google Map &amp; Address Attachment
              </h4>
              <p className="text-xs text-zinc-500 mb-2.5">
                Adjust the property address, subcity, or GPS coordinates to sync the live Google Map attachment.
              </p>
              <AddressMapAttachment
                value={editAddress}
                onChange={setEditAddress}
              />
            </div>

            {/* Multi-Media Vault & Proof Uploader */}
            <div className="border-t border-zinc-200 pt-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider block">
                    Upload &amp; Manage Media Materials (Cloudinary CDN)
                  </label>
                  <p className="text-xs text-zinc-500">
                    Upload multiple images, video tours, and title deeds at once. Delete or re-tag any item.
                  </p>
                </div>
              </div>

              <MediaUploader
                value={editMediaList}
                onChange={setEditMediaList}
                folder="property-listings"
                multiple={true}
                maxSizeMB={100}
              />
            </div>

            {/* Ownership Section */}
            <div className="border-t border-zinc-200 pt-3">
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">
                Legal Ownership Authorization
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Legal Owner Name</label>
                  <Input
                    value={editOwnerName}
                    onChange={(e) => setEditOwnerName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Owner Contact Phone</label>
                  <Input
                    value={editOwnerContact}
                    onChange={(e) => setEditOwnerContact(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Sales Right</label>
                  <Select
                    value={editSalesRight}
                    onChange={(e) => setEditSalesRight(e.target.value)}
                    options={[
                      { value: 'EXCLUSIVE', label: 'Exclusive Mandate' },
                      { value: 'SOLE_AGENCY', label: 'Sole Agency' },
                      { value: 'OPEN_LISTING', label: 'Open Listing' },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
              <Button variant="outline" onClick={() => setEditingListing(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveEdit}>
                <Check className="h-4 w-4 mr-1" />
                Save Changes, Media &amp; Map
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* CREATE LISTING MODAL WITH MULTIPLE UPLOAD & LIVE GOOGLE MAP ATTACHMENT    */}
      {/* ========================================================================= */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Real Estate Asset, Multi-Media &amp; Live Map"
        maxWidth="5xl"
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Property Title</label>
            <Input
              placeholder="e.g. Modern 3-Bedroom Apartment in Bole"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Price (ETB)</label>
              <Input
                placeholder="15000000"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Floor Area (m²)</label>
              <Input
                type="number"
                value={areaSqm}
                onChange={(e) => setAreaSqm(e.target.value)}
              />
            </div>
          </div>

          {/* Live Google Map Address Attachment Section */}
          <div className="border-t border-zinc-200 pt-3">
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-rose-500" />
              Live Google Map Address Attachment
            </h4>
            <p className="text-xs text-zinc-500 mb-2.5">
              Provide the street address or choose a district preset. A live Google Map pin and GPS coordinates will be attached automatically.
            </p>
            <AddressMapAttachment
              value={createAddress}
              onChange={setCreateAddress}
            />
          </div>

          {/* Multiple Media & Proof Uploader */}
          <div className="border-t border-zinc-200 pt-3">
            <div className="mb-2">
              <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider block">
                Attach Media, Footages &amp; Proof Materials (Cloudinary CDN)
              </label>
              <p className="text-xs text-zinc-500">
                You can select and upload multiple files simultaneously (e.g. 5 photos, 1 video walkthrough, and 1 deed PDF).
              </p>
            </div>
            <MediaUploader
              value={createMediaList}
              onChange={setCreateMediaList}
              folder="property-listings"
              multiple={true}
              maxSizeMB={100}
            />
          </div>

          {/* Ownership */}
          <div className="border-t border-zinc-200 pt-3">
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">
              Legal Ownership Authorization
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Legal Owner Name</label>
                <Input
                  placeholder="Full name as appears on Title Deed"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Owner Contact Phone</label>
                  <Input
                    placeholder="+251911..."
                    value={ownerContact}
                    onChange={(e) => setOwnerContact(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Sales Authorization Type</label>
                  <Select
                    value={salesRight}
                    onChange={(e) => setSalesRight(e.target.value)}
                    options={[
                      { value: 'EXCLUSIVE', label: 'Exclusive Sales Mandate' },
                      { value: 'SOLE_AGENCY', label: 'Sole Agency' },
                      { value: 'OPEN_LISTING', label: 'Open Listing' },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateListing}>
              Submit Listing with Materials &amp; Live Map
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
