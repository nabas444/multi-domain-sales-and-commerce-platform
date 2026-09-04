'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Badge,
  Tabs,
  Modal,
  Select,
} from '@platform/ui';
import {
  Layers,
  FolderTree,
  Sliders,
  Plus,
  Building2,
  Truck,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Package,
} from 'lucide-react';

interface Domain {
  id: string;
  name: string;
  slug: string;
  code: string;
  icon?: string;
  description: string;
  status: string;
  default_currency: string;
}

interface Category {
  id: string;
  domain_id: string;
  parent_id?: string | null;
  name: string;
  slug: string;
  code: string;
  is_active: boolean;
}

interface Attribute {
  id: string;
  name: string;
  slug: string;
  code: string;
  group_name: string;
  type: string;
  is_required: boolean;
  is_searchable: boolean;
  is_filterable: boolean;
}

const DOMAIN_DATA_PRESETS: Record<
  string,
  { categories: Category[]; attributes: Attribute[] }
> = {
  d1: {
    categories: [
      { id: 'c1', domain_id: 'd1', name: 'Residential Properties', slug: 'residential', code: 'RESIDENTIAL', is_active: true },
      { id: 'c2', domain_id: 'd1', parent_id: 'c1', name: 'Apartments & Penthouses', slug: 'apartments', code: 'APARTMENTS', is_active: true },
      { id: 'c3', domain_id: 'd1', parent_id: 'c1', name: 'Villas & Houses', slug: 'villas', code: 'VILLAS', is_active: true },
      { id: 'c4', domain_id: 'd1', name: 'Commercial Real Estate', slug: 'commercial', code: 'COMMERCIAL', is_active: true },
      { id: 'c5', domain_id: 'd1', name: 'Land & Off-Plan Projects', slug: 'land-plots', code: 'LAND_PLOTS', is_active: true },
    ],
    attributes: [
      { id: 'a1', name: 'Bedrooms', slug: 'bedrooms', code: 'BEDROOMS', group_name: 'Physical Specifications', type: 'NUMBER', is_required: true, is_searchable: true, is_filterable: true },
      { id: 'a2', name: 'Bathrooms', slug: 'bathrooms', code: 'BATHROOMS', group_name: 'Physical Specifications', type: 'NUMBER', is_required: true, is_searchable: true, is_filterable: true },
      { id: 'a3', name: 'Floor Area (m²)', slug: 'area_sqm', code: 'AREA_SQM', group_name: 'Physical Specifications', type: 'NUMBER', is_required: true, is_searchable: true, is_filterable: true },
      { id: 'a4', name: 'Title Deed Status', slug: 'title_status', code: 'TITLE_STATUS', group_name: 'Legal & Ownership', type: 'SELECT', is_required: true, is_searchable: true, is_filterable: true },
      { id: 'a5', name: 'Furnishing Status', slug: 'furnishing', code: 'FURNISHING', group_name: 'Interior', type: 'SELECT', is_required: false, is_searchable: true, is_filterable: true },
    ],
  },
  d2: {
    categories: [
      { id: 'c201', domain_id: 'd2', name: 'Passenger Vehicles', slug: 'passenger-vehicles', code: 'PASSENGER', is_active: true },
      { id: 'c202', domain_id: 'd2', parent_id: 'c201', name: 'SUVs & Crossovers', slug: 'suvs', code: 'SUVS', is_active: true },
      { id: 'c203', domain_id: 'd2', parent_id: 'c201', name: 'Executive Sedans', slug: 'sedans', code: 'SEDANS', is_active: true },
      { id: 'c204', domain_id: 'd2', name: 'Commercial & Heavy Duty', slug: 'commercial-trucks', code: 'COMMERCIAL_TRUCKS', is_active: true },
      { id: 'c205', domain_id: 'd2', parent_id: 'c204', name: 'Dump Trucks & Tippers', slug: 'dump-trucks', code: 'DUMP_TRUCKS', is_active: true },
    ],
    attributes: [
      { id: 'a201', name: 'Model Year', slug: 'year', code: 'YEAR', group_name: 'Technical Specs', type: 'NUMBER', is_required: true, is_searchable: true, is_filterable: true },
      { id: 'a202', name: 'Mileage (km)', slug: 'mileage', code: 'MILEAGE', group_name: 'Condition', type: 'NUMBER', is_required: true, is_searchable: true, is_filterable: true },
      { id: 'a203', name: 'Transmission', slug: 'transmission', code: 'TRANSMISSION', group_name: 'Drivetrain', type: 'SELECT', is_required: true, is_searchable: true, is_filterable: true },
      { id: 'a204', name: 'Fuel Type', slug: 'fuel_type', code: 'FUEL_TYPE', group_name: 'Engine', type: 'SELECT', is_required: true, is_searchable: true, is_filterable: true },
      { id: 'a205', name: 'Customs / Duty Status', slug: 'duty_status', code: 'DUTY_STATUS', group_name: 'Legal & Customs', type: 'SELECT', is_required: true, is_searchable: true, is_filterable: true },
      { id: 'a206', name: 'Payload Capacity (Tons)', slug: 'payload_tonnage', code: 'PAYLOAD', group_name: 'Heavy Equipment', type: 'NUMBER', is_required: false, is_searchable: true, is_filterable: true },
    ],
  },
  d3: {
    categories: [
      { id: 'c301', domain_id: 'd3', name: 'Passenger Elevators', slug: 'passenger-elevators', code: 'PASSENGER_LIFTS', is_active: true },
      { id: 'c302', domain_id: 'd3', parent_id: 'c301', name: 'High-Speed Residential Lifts', slug: 'high-speed-lifts', code: 'HIGH_SPEED', is_active: true },
      { id: 'c303', domain_id: 'd3', name: 'Panoramic & Glass Elevators', slug: 'panoramic-elevators', code: 'PANORAMIC', is_active: true },
      { id: 'c304', domain_id: 'd3', name: 'Freight & Hospital Bed Lifts', slug: 'freight-lifts', code: 'FREIGHT', is_active: true },
      { id: 'c305', domain_id: 'd3', name: 'Escalators & Moving Walks', slug: 'escalators', code: 'ESCALATORS', is_active: true },
    ],
    attributes: [
      { id: 'a301', name: 'Rated Load Capacity (kg)', slug: 'capacity_kg', code: 'CAPACITY_KG', group_name: 'Engineering Ratings', type: 'NUMBER', is_required: true, is_searchable: true, is_filterable: true },
      { id: 'a302', name: 'Passenger Capacity', slug: 'passenger_count', code: 'PASSENGERS', group_name: 'Engineering Ratings', type: 'NUMBER', is_required: true, is_searchable: true, is_filterable: true },
      { id: 'a303', name: 'Rated Speed (m/s)', slug: 'speed_mps', code: 'SPEED_MPS', group_name: 'Performance', type: 'NUMBER', is_required: true, is_searchable: true, is_filterable: true },
      { id: 'a304', name: 'Max Floors / Travel (m)', slug: 'max_floors', code: 'MAX_FLOORS', group_name: 'Installation Scope', type: 'NUMBER', is_required: true, is_searchable: true, is_filterable: true },
      { id: 'a305', name: 'Drive Machine Type', slug: 'drive_type', code: 'DRIVE_TYPE', group_name: 'Mechanical', type: 'SELECT', is_required: true, is_searchable: true, is_filterable: true },
      { id: 'a306', name: 'Automatic Rescue Device (ARD)', slug: 'has_ard', code: 'HAS_ARD', group_name: 'Safety Systems', type: 'BOOLEAN', is_required: true, is_searchable: true, is_filterable: true },
    ],
  },
};

export default function DomainsPage() {
  const [activeTab, setActiveTab] = useState('domains');
  const [domains, setDomains] = useState<Domain[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string>('d1');
  const [inspectModalDomain, setInspectModalDomain] = useState<Domain | null>(null);
  const [loading, setLoading] = useState(true);

  // Create Domain Modal
  const [createDomainOpen, setCreateDomainOpen] = useState(false);
  const [domainName, setDomainName] = useState('');
  const [domainSlug, setDomainSlug] = useState('');
  const [domainCode, setDomainCode] = useState('');
  const [domainDescription, setDomainDescription] = useState('');

  // Create Attribute Modal
  const [createAttrOpen, setCreateAttrOpen] = useState(false);
  const [attrName, setAttrName] = useState('');
  const [attrSlug, setAttrSlug] = useState('');
  const [attrType, setAttrType] = useState('NUMBER');
  const [attrGroup, setAttrGroup] = useState('Physical Specifications');
  const [attrRequired, setAttrRequired] = useState(false);

  // Create Category Modal
  const [createCatOpen, setCreateCatOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catCode, setCatCode] = useState('');

  useEffect(() => {
    fetchDomains();
  }, []);

  const defaultDomains: Domain[] = [
    {
      id: 'd1',
      name: 'Real Estate',
      slug: 'real-estate',
      code: 'REAL_ESTATE',
      description: 'Residential apartments, commercial buildings, villas, land, and off-plan projects',
      status: 'ACTIVE',
      default_currency: 'ETB',
    },
    {
      id: 'd2',
      name: 'Automotive & Heavy Equipment',
      slug: 'automotive',
      code: 'AUTOMOTIVE',
      description: 'Passenger vehicles, commercial trucks, SUVs, motorcycles, and construction machinery',
      status: 'ACTIVE',
      default_currency: 'ETB',
    },
    {
      id: 'd3',
      name: 'Elevators & Vertical Transport',
      slug: 'elevators',
      code: 'ELEVATORS',
      description: 'Passenger, panoramic, freight elevators, escalators, and modernization engineering',
      status: 'ACTIVE',
      default_currency: 'ETB',
    },
  ];

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/v1/domains').catch(() => null);
      if (res && res.ok) {
        const json = await res.json();
        const data = Array.isArray(json) ? json : (json?.data || []);
        if (data.length > 0) {
          setDomains(data);
          const firstId = data[0].id;
          setSelectedDomainId(firstId);
          loadDomainDetails(firstId, data[0].slug);
          return;
        }
      }
      setDomains(defaultDomains);
      setSelectedDomainId(defaultDomains[0].id);
      loadDomainDetails(defaultDomains[0].id, defaultDomains[0].slug);
    } finally {
      setLoading(false);
    }
  };

  const loadDomainDetails = (domainId: string, slug?: string) => {
    // Check preset or match by domainId or slug
    let matchedKey = domainId;
    if (!DOMAIN_DATA_PRESETS[matchedKey]) {
      if (slug?.includes('auto')) matchedKey = 'd2';
      else if (slug?.includes('elev')) matchedKey = 'd3';
      else matchedKey = 'd1';
    }

    const preset = DOMAIN_DATA_PRESETS[matchedKey] || DOMAIN_DATA_PRESETS['d1'];
    setCategories(preset.categories);
    setAttributes(preset.attributes);
  };

  const handleSelectAndInspect = (dom: Domain, targetTab: 'categories' | 'attributes' = 'categories') => {
    setSelectedDomainId(dom.id);
    loadDomainDetails(dom.id, dom.slug);
    setActiveTab(targetTab);
  };

  const handleCreateDomain = async () => {
    if (!domainName.trim()) return;
    const newDom: Domain = {
      id: `dom-${Date.now()}`,
      name: domainName,
      slug: domainSlug || domainName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      code: domainCode || domainName.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
      description: domainDescription || 'Custom commercial domain architecture',
      status: 'ACTIVE',
      default_currency: 'ETB',
    };

    DOMAIN_DATA_PRESETS[newDom.id] = {
      categories: [
        { id: `c-${Date.now()}`, domain_id: newDom.id, name: 'General Products & Units', slug: 'general', code: 'GENERAL', is_active: true },
      ],
      attributes: [
        { id: `a-${Date.now()}`, name: 'Model / Specification', slug: 'spec_model', code: 'SPEC_MODEL', group_name: 'General', type: 'STRING', is_required: true, is_searchable: true, is_filterable: true },
      ],
    };

    setDomains((prev) => [...prev, newDom]);
    setSelectedDomainId(newDom.id);
    loadDomainDetails(newDom.id, newDom.slug);
    setCreateDomainOpen(false);
    setDomainName('');
    setDomainSlug('');
    setDomainCode('');
    setDomainDescription('');
  };

  const handleCreateAttribute = () => {
    if (!attrName.trim()) return;
    const newAttr: Attribute = {
      id: `attr-${Date.now()}`,
      name: attrName,
      slug: attrSlug || attrName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      code: (attrSlug || attrName).toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
      group_name: attrGroup,
      type: attrType,
      is_required: attrRequired,
      is_searchable: true,
      is_filterable: true,
    };

    setAttributes((prev) => [...prev, newAttr]);
    setCreateAttrOpen(false);
    setAttrName('');
    setAttrSlug('');
  };

  const handleCreateCategory = () => {
    if (!catName.trim()) return;
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      domain_id: selectedDomainId,
      name: catName,
      slug: catSlug || catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      code: catCode || catName.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
      is_active: true,
    };
    setCategories((prev) => [...prev, newCat]);
    setCreateCatOpen(false);
    setCatName('');
    setCatSlug('');
    setCatCode('');
  };

  const activeDomain = domains.find((d) => d.id === selectedDomainId) || domains[0] || defaultDomains[0];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-zinc-700" />
            Domain &amp; Catalog Architecture
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Build multi-tenant, multi-domain catalogs with dynamic schema attributes and no-code category trees.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => setCreateDomainOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create Domain
          </Button>
        </div>
      </div>

      {/* Active Domain Breadcrumb / Switcher Banner */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-zinc-900 text-white font-bold flex items-center justify-center text-xs">
            {activeDomain?.code.slice(0, 2) || 'MD'}
          </div>
          <div>
            <div className="text-xs text-zinc-500 font-medium">Currently Selected Domain:</div>
            <div className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <span>{activeDomain?.name}</span>
              <Badge variant="success" className="text-[10px]">{activeDomain?.status}</Badge>
              <span className="text-xs text-zinc-500 font-mono">({activeDomain?.slug})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab !== 'domains' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('domains')}
            >
              Switch Domain Catalog
            </Button>
          )}
          <Link href={`/marketplace`}>
            <Button variant="outline" size="sm" className="text-xs">
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              View in Marketplace
            </Button>
          </Link>
          <Link href={`/inventory`}>
            <Button variant="outline" size="sm" className="text-xs">
              <Package className="h-3.5 w-3.5 mr-1" />
              Manage Inventory
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'domains', label: 'Domain Directory', count: domains.length },
          { id: 'categories', label: `Category Tree (${activeDomain?.name || ''})`, count: categories.length },
          { id: 'attributes', label: `Schema Attributes (${activeDomain?.name || ''})`, count: attributes.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* 1. Domain Directory */}
      {activeTab === 'domains' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {domains.map((dom) => {
            const isSelected = selectedDomainId === dom.id;
            return (
              <Card
                key={dom.id}
                className={`border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-zinc-900 shadow-md ring-2 ring-zinc-900 bg-white'
                    : 'border-zinc-200 hover:border-zinc-400 bg-white'
                }`}
              >
                <CardContent className="p-6 space-y-4 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-md bg-zinc-900 text-white flex items-center justify-center font-black text-sm">
                      {dom.code.slice(0, 2)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isSelected && (
                        <Badge variant="secondary" className="text-[10px]">
                          Active Scope
                        </Badge>
                      )}
                      <Badge variant={dom.status === 'ACTIVE' ? 'success' : 'outline'}>
                        {dom.status}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-zinc-900 text-lg">{dom.name}</h3>
                    <code className="text-xs font-mono text-zinc-500">{dom.slug}</code>
                  </div>

                  <p className="text-xs text-zinc-600 line-clamp-3 leading-relaxed">
                    {dom.description}
                  </p>

                  <div className="pt-2 border-t border-zinc-100 text-xs text-zinc-500 flex justify-between items-center">
                    <span>Base Currency:</span>
                    <strong className="font-mono text-zinc-900">{dom.default_currency}</strong>
                  </div>
                </CardContent>

                {/* Card Action Footer */}
                <div className="p-4 bg-zinc-50 border-t border-zinc-100 rounded-b-lg flex flex-col gap-2">
                  <Button
                    variant={isSelected ? 'primary' : 'outline'}
                    size="sm"
                    className="w-full justify-between"
                    onClick={() => handleSelectAndInspect(dom, 'categories')}
                  >
                    <span>Inspect Domain Taxonomy</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs text-zinc-600"
                      onClick={() => handleSelectAndInspect(dom, 'attributes')}
                    >
                      Dynamic Schema ({dom.id === 'd2' ? '6' : dom.id === 'd3' ? '6' : '5'} fields)
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-zinc-600"
                      onClick={() => setInspectModalDomain(dom)}
                    >
                      Dossier
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 2. Category Hierarchy */}
      {activeTab === 'categories' && (
        <Card className="border border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-zinc-700" />
                Category Tree: {activeDomain?.name}
              </CardTitle>
              <CardDescription>
                Hierarchical taxonomy tree enforced for all listings published under <strong>{activeDomain?.name}</strong>.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCreateCatOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Add Category
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`p-3.5 rounded border border-zinc-200 flex items-center justify-between ${
                    cat.parent_id ? 'ml-8 bg-zinc-50 border-dashed' : 'bg-white font-medium shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400 font-mono text-xs">{cat.parent_id ? '└──' : '📁'}</span>
                    <span className="text-sm text-zinc-900">{cat.name}</span>
                    <code className="text-xs font-mono bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">
                      {cat.slug}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="text-xs">Active</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Dynamic Attributes */}
      {activeTab === 'attributes' && (
        <Card className="border border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-zinc-700" />
                Schema Registry: {activeDomain?.name}
              </CardTitle>
              <CardDescription>
                Dynamic schema specifications required and filterable for <strong>{activeDomain?.name}</strong> assets.
              </CardDescription>
            </div>
            <Button variant="primary" size="sm" onClick={() => setCreateAttrOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Define Attribute
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 text-xs uppercase font-semibold text-zinc-500 bg-zinc-50">
                  <tr>
                    <th className="py-3 px-4">Field Name</th>
                    <th className="py-3 px-4">Slug / Code</th>
                    <th className="py-3 px-4">Group</th>
                    <th className="py-3 px-4">Data Type</th>
                    <th className="py-3 px-4">Required</th>
                    <th className="py-3 px-4">Search &amp; Facet Filters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {attributes.map((attr) => (
                    <tr key={attr.id} className="hover:bg-zinc-50/60">
                      <td className="py-3 px-4 font-semibold text-zinc-900">{attr.name}</td>
                      <td className="py-3 px-4 font-mono text-xs text-zinc-600">{attr.slug}</td>
                      <td className="py-3 px-4 text-xs text-zinc-600">{attr.group_name}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs font-mono">{attr.type}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        {attr.is_required ? (
                          <Badge variant="danger" className="text-xs">Required</Badge>
                        ) : (
                          <span className="text-xs text-zinc-400">Optional</span>
                        )}
                      </td>
                      <td className="py-3 px-4 flex gap-1.5">
                        {attr.is_searchable && <Badge variant="secondary" className="text-xs">Searchable</Badge>}
                        {attr.is_filterable && <Badge variant="secondary" className="text-xs">Faceted</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Domain Dossier Modal */}
      <Modal
        isOpen={!!inspectModalDomain}
        onClose={() => setInspectModalDomain(null)}
        title={`Domain Architecture: ${inspectModalDomain?.name || ''}`}
      >
        {inspectModalDomain && (
          <div className="space-y-4">
            <div className="p-3.5 bg-zinc-50 rounded border border-zinc-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Domain Identifier:</span>
                <span className="font-mono text-zinc-900 font-semibold">{inspectModalDomain.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Slug:</span>
                <span className="font-mono text-zinc-700">{inspectModalDomain.slug}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Ledger Currency:</span>
                <span className="font-mono font-bold text-zinc-900">{inspectModalDomain.default_currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Lifecycle Status:</span>
                <Badge variant="success" className="text-[10px]">{inspectModalDomain.status}</Badge>
              </div>
              <p className="text-zinc-600 pt-1 border-t border-zinc-200">
                {inspectModalDomain.description}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setInspectModalDomain(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  handleSelectAndInspect(inspectModalDomain, 'categories');
                  setInspectModalDomain(null);
                }}
              >
                Inspect Taxonomy &rarr;
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Domain Modal */}
      <Modal
        isOpen={createDomainOpen}
        onClose={() => setCreateDomainOpen(false)}
        title="Create New Domain Architecture"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Domain Name</label>
            <Input
              placeholder="e.g. Commercial Aircraft &amp; Aviation"
              value={domainName}
              onChange={(e) => {
                setDomainName(e.target.value);
                setDomainSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                setDomainCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]+/g, '_'));
              }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Slug</label>
            <Input value={domainSlug} onChange={(e) => setDomainSlug(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Code</label>
            <Input value={domainCode} onChange={(e) => setDomainCode(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Description</label>
            <Input
              placeholder="Describe commercial scope of this domain"
              value={domainDescription}
              onChange={(e) => setDomainDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" onClick={() => setCreateDomainOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateDomain}>Create Domain</Button>
          </div>
        </div>
      </Modal>

      {/* Create Category Modal */}
      <Modal
        isOpen={createCatOpen}
        onClose={() => setCreateCatOpen(false)}
        title={`Add Category to ${activeDomain?.name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Category Name</label>
            <Input
              placeholder="e.g. Land &amp; Development Plots"
              value={catName}
              onChange={(e) => {
                setCatName(e.target.value);
                setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                setCatCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]+/g, '_'));
              }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Slug</label>
            <Input value={catSlug} onChange={(e) => setCatSlug(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Code</label>
            <Input value={catCode} onChange={(e) => setCatCode(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" onClick={() => setCreateCatOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateCategory}>Add Category</Button>
          </div>
        </div>
      </Modal>

      {/* Create Attribute Modal */}
      <Modal
        isOpen={createAttrOpen}
        onClose={() => setCreateAttrOpen(false)}
        title={`Define Schema Attribute for ${activeDomain?.name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Attribute Name</label>
            <Input
              placeholder="e.g. Engine Displacement (cc)"
              value={attrName}
              onChange={(e) => {
                setAttrName(e.target.value);
                setAttrSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_'));
              }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Slug / Identifier</label>
            <Input value={attrSlug} onChange={(e) => setAttrSlug(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Data Type</label>
            <Select
              value={attrType}
              onChange={(e) => setAttrType(e.target.value)}
              options={[
                { value: 'NUMBER', label: 'Numeric Value' },
                { value: 'STRING', label: 'Short Text' },
                { value: 'BOOLEAN', label: 'Boolean (Yes/No)' },
                { value: 'SELECT', label: 'Single Select Option' },
                { value: 'MULTI_SELECT', label: 'Multi Select' },
              ]}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Group Header</label>
            <Input value={attrGroup} onChange={(e) => setAttrGroup(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="attrReq"
              checked={attrRequired}
              onChange={(e) => setAttrRequired(e.target.checked)}
              className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
            />
            <label htmlFor="attrReq" className="text-sm text-zinc-700">Required field when publishing listings</label>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" onClick={() => setCreateAttrOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateAttribute}>Save Attribute</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
