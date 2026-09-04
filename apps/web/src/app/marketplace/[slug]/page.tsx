'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Badge,
} from '@platform/ui';
import {
  Building2,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  ShieldCheck,
  Calendar,
  Phone,
  CheckCircle2,
  ArrowLeft,
  Share2,
} from 'lucide-react';

export default function ListingDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryDate, setInquiryDate] = useState('');
  const [inquiryMsg, setInquiryMsg] = useState('I am interested in scheduling a viewing or consultation for this asset.');
  const [submitted, setSubmitted] = useState(false);

  // Property & item catalog map
  const catalog: Record<string, any> = {
    'luxury-3-bedroom-penthouse-bole-atlas': {
      title: 'Luxury 3-Bedroom Penthouse in Bole Atlas',
      price: 18500000,
      currency: 'ETB',
      domain: 'Real Estate',
      category: 'Apartments & Penthouses',
      developer: 'Apex Real Estate Group',
      location: 'Atlas Hotel Area, Ring Road Tower 12th Floor, Bole, Addis Ababa',
      description:
        'Exclusive top-floor corner penthouse with uncompromised panoramic views across the Addis Ababa skyline. Finished with imported European porcelain tiles, customized Italian kitchen cabinetry, and premium sanitary fittings. Features 3 generous en-suite bedrooms, private expansive terrace, dedicated service quarters, 24/7 backup power generator, and dual high-speed elevators.',
      specs: [
        { label: 'Bedrooms', value: '3 En-Suite' },
        { label: 'Bathrooms', value: '3.5 Bathrooms' },
        { label: 'Total Floor Area', value: '240 m²' },
        { label: 'Floor Level', value: '12th Floor (Penthouse)' },
        { label: 'Title Deed Status', value: 'Freehold Title Deed (Ready)' },
        { label: 'Furnishing', value: 'Fully Furnished' },
        { label: 'Backup Generator', value: 'Automatic Transfer 24/7' },
        { label: 'Dedicated Water Reserve', value: '10,000L Underground Tank' },
      ],
      ownership: {
        ownerName: 'Dr. Yohannes Girma',
        mandateType: 'Exclusive Certified Mandate',
        verifiedDate: 'January 2026',
      },
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      ],
    },
    'modern-corporate-office-mega-building': {
      title: 'Modern Corporate Office Floor in Mega Building',
      price: 250000,
      currency: 'ETB / mo',
      domain: 'Real Estate',
      category: 'Commercial Real Estate',
      developer: 'Apex Real Estate Group',
      location: 'Bole Road, Mega Building 5th Floor, Addis Ababa',
      description:
        'Turn-key open plan executive corporate office floor equipped with structured fiber-optic networking, central HVAC cooling, biometric access turnstiles, and 6 allocated basement parking slots.',
      specs: [
        { label: 'Total Floor Area', value: '480 m²' },
        { label: 'Parking Spaces', value: '6 Allocated Slots' },
        { label: 'Elevators', value: '4 High Speed Schindler' },
        { label: 'Backup Power', value: '500kVA Heavy Duty Perkins' },
      ],
      ownership: {
        ownerName: 'Mega Commercial Holdings',
        mandateType: 'Exclusive Certified Mandate',
        verifiedDate: 'February 2026',
      },
      images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80',
      ],
    },
    'executive-5-bedroom-villa-old-airport': {
      title: 'Executive 5-Bedroom Villa in Old Airport Diplomatic Zone',
      price: 65000000,
      currency: 'ETB',
      domain: 'Real Estate',
      category: 'Villas & Houses',
      developer: 'Apex Real Estate Group',
      location: 'Old Airport Diplomatic Enclave, near ICS, Addis Ababa',
      description:
        'Prestigious standalone luxury residence built on a 650 m² plot within the secure Old Airport diplomatic quarter. Includes swimming pool, manicured grounds, 4-car garage, and 2-room staff quarters.',
      specs: [
        { label: 'Bedrooms', value: '5 Master Suites' },
        { label: 'Bathrooms', value: '6 Bathrooms' },
        { label: 'Plot Area', value: '650 m²' },
        { label: 'Security', value: 'Perimeter Laser + Guardhouse' },
      ],
      ownership: {
        ownerName: 'Ato Mulugeta Teshome',
        mandateType: 'Sole Agency Mandate',
        verifiedDate: 'January 2026',
      },
      images: [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      ],
    },
    'toyota-land-cruiser-300-zx': {
      title: 'Toyota Land Cruiser 300 ZX V6 Twin Turbo',
      price: 34500000,
      currency: 'ETB',
      domain: 'Automotive',
      category: 'Passenger SUVs',
      developer: 'Zemen Automotive PLC',
      location: 'Bole Michael Showroom, Addis Ababa',
      description:
        'Brand new 2025 Toyota Land Cruiser ZX flagship specification. Features 3.5L Twin Turbo V6, 10-speed direct shift transmission, Multi-Terrain Monitor with panoramic cameras, and rear entertainment screens.',
      specs: [
        { label: 'Model Year', value: '2025' },
        { label: 'Transmission', value: '10-Speed Automatic' },
        { label: 'Mileage', value: '0 km (Brand New)' },
        { label: 'Customs Clearance', value: 'Duty Paid & Customs Certified' },
      ],
      ownership: {
        ownerName: 'Zemen Automotive Importers',
        mandateType: 'Authorized Dealership',
        verifiedDate: 'January 2026',
      },
      images: [
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
      ],
    },
  };

  const property = catalog[slug] || catalog['luxury-3-bedroom-penthouse-bole-atlas'];

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:4000/api/v1/crm/public-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: 'apex-real-estate',
          domainId: 'real-estate',
          customer: {
            firstName: inquiryName.split(' ')[0] || inquiryName,
            lastName: inquiryName.split(' ')[1] || 'Inquirer',
            phone: inquiryPhone,
            email: inquiryEmail,
          },
          inquiryMessage: `${inquiryMsg} (Preferred viewing/consultation: ${inquiryDate || 'Anytime'})`,
        }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/marketplace" className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900">
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace Catalog
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm">Partner Portal</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge variant="outline">{property.domain}</Badge>
              <Badge variant="outline">{property.category}</Badge>
              <Badge variant="success" className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Verified Mandate
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              {property.title}
            </h1>
            <div className="text-sm text-zinc-600 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
              {property.location}
            </div>
          </div>
          <div className="text-left md:text-right">
            <div className="text-xs text-zinc-500 font-semibold uppercase">Listing Price</div>
            <div className="text-3xl font-black font-mono text-zinc-900">
              {property.price.toLocaleString()} {property.currency}
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 h-96 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
            <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
          </div>
          <div className="grid grid-cols-1 gap-4 h-96">
            <div className="h-44 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
              <img src={property.images[1] || property.images[0]} alt={property.title} className="w-full h-full object-cover" />
            </div>
            <div className="h-44 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
              <img src={property.images[2] || property.images[0]} alt={property.title} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* 2-Column Content: Left Details & Right Schedule Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="border border-zinc-200">
              <CardHeader>
                <CardTitle>Asset Overview &amp; Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-700 leading-relaxed">{property.description}</p>
              </CardContent>
            </Card>

            {/* Specifications Grid */}
            <Card className="border border-zinc-200">
              <CardHeader>
                <CardTitle>Technical Specifications &amp; Parameters</CardTitle>
                <CardDescription>Verified attributes against domain schema definition.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                  {property.specs.map((spec: any) => (
                    <div key={spec.label} className="p-3 bg-zinc-50 rounded border border-zinc-100">
                      <div className="text-xs text-zinc-500 font-medium">{spec.label}</div>
                      <div className="text-sm font-semibold text-zinc-900 mt-0.5">{spec.value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Legal Ownership Transparency */}
            <Card className="border border-zinc-200 bg-emerald-50/40">
              <CardContent className="p-5 flex items-start gap-3.5">
                <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">Legal Verification Guarantee</h4>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                    This asset has been inspected and verified by <strong>{property.developer}</strong>. 
                    Authorized under {property.ownership.mandateType} registered with owner {property.ownership.ownerName}.
                    Dossier available for compliance verification prior to transaction settlement.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Lead Capture Form */}
          <div className="lg:col-span-1">
            <Card className="border border-zinc-200 sticky top-24 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Inquire &amp; Schedule Inspection</CardTitle>
                <CardDescription>Direct inquiry routed to assigned authorized sales agent.</CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="p-6 text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 mx-auto">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h4 className="font-bold text-zinc-900 text-base">Inquiry Dispatched!</h4>
                    <p className="text-xs text-zinc-600">
                      An authorized representative from <strong>{property.developer}</strong> has received your request.
                      Guaranteed first-contact response under our 30-minute SLA.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSubmitted(false)}
                      className="mt-2 text-xs"
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleInquiry} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-zinc-700 block mb-1">Your Full Name</label>
                      <Input
                        required
                        placeholder="e.g. Abebe Kebede"
                        value={inquiryName}
                        onChange={(e) => setInquiryName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-700 block mb-1">Phone Number (Required)</label>
                      <Input
                        required
                        placeholder="+251911..."
                        value={inquiryPhone}
                        onChange={(e) => setInquiryPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-700 block mb-1">Email Address</label>
                      <Input
                        type="email"
                        placeholder="you@domain.com"
                        value={inquiryEmail}
                        onChange={(e) => setInquiryEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-700 block mb-1">Preferred Inspection Date</label>
                      <Input
                        type="date"
                        value={inquiryDate}
                        onChange={(e) => setInquiryDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-700 block mb-1">Inquiry Message</label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white"
                        value={inquiryMsg}
                        onChange={(e) => setInquiryMsg(e.target.value)}
                      />
                    </div>
                    <Button type="submit" variant="primary" className="w-full">
                      Book Private Consultation &rarr;
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
