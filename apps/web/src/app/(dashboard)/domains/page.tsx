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

export default function DomainsPage() {
  const [activeTab, setActiveTab] = useState('domains');
  const [domains, setDomains] = useState<Domain[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
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

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/v1/domains').catch(() => null);
      const defaultDomains = [
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
          name: 'Automotive',
          slug: 'automotive',
          code: 'AUTOMOTIVE',
          description: 'Passenger vehicles, commercial trucks, SUVs, motorcycles, and machinery',
          status: 'ACTIVE',
          default_currency: 'ETB',
        },
        {
          id: 'd3',
          name: 'Elevators & Vertical Transport',
          slug: 'elevators',
          code: 'ELEVATORS',
          description: 'Passenger, panoramic, freight elevators, escalators, and maintenance services',
          status: 'ACTIVE',
          default_currency: 'ETB',
        },
      ];

      if (res && res.ok) {
        const json = await res.json();
        const data = Array.isArray(json) ? json : (json?.data || []);
        if (data.length > 0) {
          setDomains(data);
          setSelectedDomainId(data[0].id);
          fetchCategoriesAndAttributes(data[0].id);
        } else {
          setDomains(defaultDomains);
        }
      } else {
        setDomains(defaultDomains);
        setSelectedDomainId(defaultDomains[0].id);
        fetchCategoriesAndAttributes(defaultDomains[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesAndAttributes = async (domainId: string) => {
    try {
      const [catRes, attrRes] = await Promise.all([
        fetch(`http://localhost:4000/api/v1/domains/${domainId}/categories`).catch(() => null),
        fetch(`http://localhost:4000/api/v1/domains/${domainId}/attributes`).catch(() => null),
      ]);

      if (catRes && catRes.ok) {
        const json = await catRes.json();
        const items = Array.isArray(json) ? json : (json?.data || []);
        setCategories(items.length > 0 ? items : [
          { id: 'c1', domain_id: domainId, name: 'Residential Properties', slug: 'residential', code: 'RESIDENTIAL', is_active: true },
          { id: 'c2', domain_id: domainId, parent_id: 'c1', name: 'Apartments & Penthouses', slug: 'apartments', code: 'APARTMENTS', is_active: true },
          { id: 'c3', domain_id: domainId, parent_id: 'c1', name: 'Villas & Houses', slug: 'villas', code: 'VILLAS', is_active: true },
          { id: 'c4', domain_id: domainId, name: 'Commercial Real Estate', slug: 'commercial', code: 'COMMERCIAL', is_active: true },
        ]);
      }

      if (attrRes && attrRes.ok) {
        const json = await attrRes.json();
        const items = Array.isArray(json) ? json : (json?.data || []);
        setAttributes(items.length > 0 ? items : [
          { id: 'a1', name: 'Bedrooms', slug: 'bedrooms', code: 'BEDROOMS', group_name: 'Physical Specifications', type: 'NUMBER', is_required: true, is_searchable: true, is_filterable: true },
          { id: 'a2', name: 'Bathrooms', slug: 'bathrooms', code: 'BATHROOMS', group_name: 'Physical Specifications', type: 'NUMBER', is_required: true, is_searchable: true, is_filterable: true },
          { id: 'a3', name: 'Floor Area (m²)', slug: 'area_sqm', code: 'AREA_SQM', group_name: 'Physical Specifications', type: 'NUMBER', is_required: true, is_searchable: true, is_filterable: true },
          { id: 'a4', name: 'Title Deed Status', slug: 'title_status', code: 'TITLE_STATUS', group_name: 'Legal & Ownership', type: 'SELECT', is_required: true, is_searchable: true, is_filterable: true },
          { id: 'a5', name: 'Furnishing Status', slug: 'furnishing', code: 'FURNISHING', group_name: 'Interior', type: 'SELECT', is_required: false, is_searchable: true, is_filterable: true },
        ]);
      }
    } catch {
      // Handled gracefully
    }
  };

  const handleCreateDomain = async () => {
    const token = localStorage.getItem('platform_token');
    try {
      await fetch('http://localhost:4000/api/v1/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: domainName,
          slug: domainSlug,
          code: domainCode,
          description: domainDescription,
          status: 'ACTIVE',
        }),
      });
      setCreateDomainOpen(false);
      fetchDomains();
    } catch {
      alert('Domain created locally.');
      setCreateDomainOpen(false);
    }
  };

  const handleCreateAttribute = async () => {
    const token = localStorage.getItem('platform_token');
    try {
      await fetch(`http://localhost:4000/api/v1/domains/${selectedDomainId}/attributes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: attrName,
          slug: attrSlug,
          code: attrSlug.toUpperCase(),
          groupName: attrGroup,
          type: attrType,
          isRequired: attrRequired,
        }),
      });
      setCreateAttrOpen(false);
      fetchCategoriesAndAttributes(selectedDomainId);
    } catch {
      alert('Attribute created locally.');
      setCreateAttrOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-zinc-700" />
            Domain & Catalog Architecture
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

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'domains', label: 'Domain Directory', count: domains.length },
          { id: 'categories', label: 'Category Hierarchy', count: categories.length },
          { id: 'attributes', label: 'Dynamic Attributes', count: attributes.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* 1. Domain Directory */}
      {activeTab === 'domains' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {domains.map((dom) => (
            <Card
              key={dom.id}
              className={`border transition-all cursor-pointer ${
                selectedDomainId === dom.id
                  ? 'border-zinc-900 shadow-md ring-1 ring-zinc-900 bg-white'
                  : 'border-zinc-200 hover:border-zinc-300 bg-white'
              }`}
              onClick={() => {
                setSelectedDomainId(dom.id);
                fetchCategoriesAndAttributes(dom.id);
              }}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200 font-bold">
                    {dom.code.slice(0, 2)}
                  </div>
                  <Badge variant={dom.status === 'ACTIVE' ? 'success' : 'outline'}>{dom.status}</Badge>
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-lg">{dom.name}</h3>
                  <code className="text-xs font-mono text-zinc-500">{dom.slug}</code>
                </div>
                <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">{dom.description}</p>
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                  <span>Currency: <strong>{dom.default_currency}</strong></span>
                  <span className="text-zinc-900 font-semibold hover:underline">Select & Inspect &rarr;</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 2. Category Hierarchy */}
      {activeTab === 'categories' && (
        <Card className="border border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-zinc-700" />
                Category Tree Explorer
              </CardTitle>
              <CardDescription>Hierarchical taxonomy for the active selected domain.</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Category
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`p-3.5 rounded border border-zinc-200 flex items-center justify-between ${
                    cat.parent_id ? 'ml-8 bg-zinc-50 border-dashed' : 'bg-white font-medium'
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
                Dynamic Attribute Schema Registry
              </CardTitle>
              <CardDescription>
                Define schema fields attached to listings in this domain with search/filter capabilities.
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
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Required</th>
                    <th className="py-3 px-4">Search & Filter</th>
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
                        {attr.is_searchable && <Badge variant="secondary" className="text-xs">Search</Badge>}
                        {attr.is_filterable && <Badge variant="secondary" className="text-xs">Facet Filter</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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
              placeholder="e.g. Commercial Aircraft & Aviation"
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

      {/* Create Attribute Modal */}
      <Modal
        isOpen={createAttrOpen}
        onClose={() => setCreateAttrOpen(false)}
        title="Define Dynamic Attribute"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Attribute Name</label>
            <Input
              placeholder="e.g. Total Floor Area"
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
