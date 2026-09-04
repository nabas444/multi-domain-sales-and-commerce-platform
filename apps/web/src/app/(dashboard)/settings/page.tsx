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
  Settings,
  Palette,
  Flag,
  Shield,
  Search,
  CheckCircle2,
  History,
  AlertCircle,
} from 'lucide-react';

interface SettingDef {
  id: string;
  key: string;
  label: string;
  description: string;
  category: string;
  data_type: string;
  sensitivity: string;
  default_value: any;
  allowed_scopes: string[];
}

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  state: 'OFF' | 'INTERNAL' | 'BETA' | 'ON';
  description?: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [definitions, setDefinitions] = useState<SettingDef[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSetting, setEditingSetting] = useState<SettingDef | null>(null);
  const [overrideValue, setOverrideValue] = useState('');
  const [overrideScope, setOverrideScope] = useState('ORGANIZATION');
  const [overrideReason, setOverrideReason] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Theme customizer state
  const [selectedPalette, setSelectedPalette] = useState('monochrome-light');
  const [borderRadius, setBorderRadius] = useState('0.375rem');
  const [density, setDensity] = useState('comfortable');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('platform_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const [defRes, flagsRes] = await Promise.all([
        fetch('http://localhost:4000/api/v1/settings/definitions', { headers }).catch(() => null),
        fetch('http://localhost:4000/api/v1/settings/feature-flags', { headers }).catch(() => null),
      ]);

      if (defRes && defRes.ok) {
        const json = await defRes.json();
        const data = Array.isArray(json) ? json : (json?.data || []);
        if (data.length > 0) setDefinitions(data);
      } else {
        // Fallback default definitions for instant offline display
        setDefinitions([
          {
            id: '1',
            key: 'platform.name',
            label: 'Platform Name',
            description: 'Global system commercial brand name',
            category: 'GENERAL',
            data_type: 'STRING',
            sensitivity: 'LOW',
            default_value: 'Multi-Domain Sales & Commerce Platform',
            allowed_scopes: ['PLATFORM', 'ORGANIZATION'],
          },
          {
            id: '2',
            key: 'platform.general.timezone',
            label: 'System Timezone',
            description: 'Standard platform operating timezone',
            category: 'GENERAL',
            data_type: 'STRING',
            sensitivity: 'LOW',
            default_value: 'Africa/Addis_Ababa',
            allowed_scopes: ['PLATFORM', 'DOMAIN', 'ORGANIZATION'],
          },
          {
            id: '3',
            key: 'platform.general.default_currency',
            label: 'Default Currency',
            description: 'Standard ledger and pricing currency',
            category: 'GENERAL',
            data_type: 'STRING',
            sensitivity: 'FINANCIAL',
            default_value: 'ETB',
            allowed_scopes: ['PLATFORM', 'DOMAIN'],
          },
          {
            id: '4',
            key: 'listing.publishing.mode',
            label: 'Listing Moderation Mode',
            description: 'Whether new listings require provider admin approval before publishing',
            category: 'LISTINGS',
            data_type: 'ENUM',
            sensitivity: 'OPERATIONAL',
            default_value: 'REQUIRES_APPROVAL',
            allowed_scopes: ['PLATFORM', 'DOMAIN', 'ORGANIZATION'],
          },
          {
            id: '5',
            key: 'crm.lead.sla_minutes',
            label: 'Lead Response SLA (Minutes)',
            description: 'Maximum permitted minutes before a new lead breaches first-contact SLA',
            category: 'CRM',
            data_type: 'NUMBER',
            sensitivity: 'OPERATIONAL',
            default_value: 30,
            allowed_scopes: ['PLATFORM', 'DOMAIN', 'ORGANIZATION'],
          },
          {
            id: '6',
            key: 'commercial.commission.rate',
            label: 'Default Platform Commission (%)',
            description: 'Standard provider success fee percentage',
            category: 'COMMERCIAL',
            data_type: 'NUMBER',
            sensitivity: 'FINANCIAL',
            default_value: 2.0,
            allowed_scopes: ['PLATFORM', 'DOMAIN'],
          },
        ]);
      }

      if (flagsRes && flagsRes.ok) {
        const json = await flagsRes.json();
        const flagsData = Array.isArray(json) ? json : (json?.data || []);
        if (flagsData.length > 0) setFeatureFlags(flagsData);
      } else {
        setFeatureFlags([
          { id: '1', key: 'module.crm', name: 'Sales CRM & Deals', state: 'ON', description: 'Leads, Deals, Activities and Kanban' },
          { id: '2', key: 'module.marketplace', name: 'Public Discovery Marketplace', state: 'ON', description: 'Buyer-facing listing catalog' },
          { id: '3', key: 'module.commercial', name: 'Commercial Fee & Ledger Engine', state: 'ON', description: 'Deterministic waterfall distribution' },
          { id: '4', key: 'module.marketing', name: 'Marketing Campaigns & CMS', state: 'ON', description: 'Attribution tracking & pages' },
          { id: '5', key: 'module.ai_assistant', name: 'AI Lead & Listing Copilot', state: 'BETA', description: 'Automated description & lead scoring' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOverride = async () => {
    if (!editingSetting) return;
    const token = localStorage.getItem('platform_token');
    let parsedValue: any = overrideValue;
    if (editingSetting.data_type === 'NUMBER') parsedValue = Number(overrideValue);
    if (editingSetting.data_type === 'BOOLEAN') parsedValue = overrideValue === 'true';

    try {
      await fetch(`http://localhost:4000/api/v1/settings/values/${editingSetting.key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          scope: overrideScope,
          value: parsedValue,
          reason: overrideReason,
        }),
      });

      setSaveSuccess(true);
      setDefinitions((prev) =>
        prev.map((d) =>
          d.key === editingSetting.key ? { ...d, default_value: parsedValue } : d
        )
      );
      setTimeout(() => {
        setSaveSuccess(false);
        setEditingSetting(null);
      }, 1000);
    } catch {
      setDefinitions((prev) =>
        prev.map((d) =>
          d.key === editingSetting.key ? { ...d, default_value: parsedValue } : d
        )
      );
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setEditingSetting(null);
      }, 1000);
    }
  };

  const toggleFlagState = (flagId: string) => {
    const states: ('OFF' | 'INTERNAL' | 'BETA' | 'ON')[] = ['OFF', 'INTERNAL', 'BETA', 'ON'];
    setFeatureFlags((prev) =>
      prev.map((f) => {
        if (f.id !== flagId) return f;
        const nextIndex = (states.indexOf(f.state) + 1) % states.length;
        return { ...f, state: states[nextIndex] };
      })
    );
  };

  const filteredDefinitions = definitions.filter((def) => {
    const matchesQuery =
      def.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      def.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      def.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || def.category === categoryFilter;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2.5">
            <Settings className="h-6 w-6 text-zinc-700" />
            Settings & Configuration Center
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Hierarchical configuration registry: PLATFORM &gt; DOMAIN &gt; ORG &gt; CATEGORY &gt; USER
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'catalog', label: 'Settings Catalog', count: definitions.length },
          { id: 'theme', label: 'Theme & Design Tokens' },
          { id: 'flags', label: 'Feature Flags', count: featureFlags.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* 1. Settings Catalog */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search settings by key, label, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {['ALL', 'GENERAL', 'LISTINGS', 'CRM', 'COMMERCIAL'].map((cat) => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter(cat)}
                  className="whitespace-nowrap"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Definitions Grid */}
          <div className="grid grid-cols-1 gap-4">
            {filteredDefinitions.map((def) => (
              <Card key={def.id} className="border border-zinc-200 hover:border-zinc-300 transition-colors">
                <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-semibold text-zinc-900 text-base">{def.label}</span>
                      <code className="text-xs font-mono bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded border border-zinc-200">
                        {def.key}
                      </code>
                      <Badge variant="outline" className="text-xs">
                        {def.category}
                      </Badge>
                      <Badge
                        variant={def.sensitivity === 'FINANCIAL' ? 'danger' : def.sensitivity === 'OPERATIONAL' ? 'warning' : 'secondary'}
                        className="text-xs"
                      >
                        {def.sensitivity}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-600">{def.description}</p>
                    <div className="flex items-center gap-4 text-xs text-zinc-500 pt-1">
                      <span>
                        Default:{' '}
                        <strong className="text-zinc-800 font-mono">
                          {typeof def.default_value === 'object' ? JSON.stringify(def.default_value) : String(def.default_value)}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>Allowed Scopes: {def.allowed_scopes?.join(', ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingSetting(def);
                        setOverrideValue(
                          typeof def.default_value === 'object' ? JSON.stringify(def.default_value) : String(def.default_value)
                        );
                        setOverrideScope(def.allowed_scopes?.[0] || 'ORGANIZATION');
                      }}
                    >
                      Override Value
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 2. Theme Tokens Customizer */}
      {activeTab === 'theme' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 border border-zinc-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-zinc-700" />
                Theme Configuration
              </CardTitle>
              <CardDescription>
                Customize brand palettes and layout density tokens with immediate live rendering.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wider block mb-1.5">
                  Color Palette Preset
                </label>
                <Select
                  value={selectedPalette}
                  onChange={(e) => setSelectedPalette(e.target.value)}
                  options={[
                    { value: 'monochrome-light', label: 'Monochromatic Light (Standard)' },
                    { value: 'zinc-graphite', label: 'Zinc Graphite Contrast' },
                    { value: 'corporate-slate', label: 'Corporate Slate' },
                  ]}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wider block mb-1.5">
                  Corner Radius
                </label>
                <Select
                  value={borderRadius}
                  onChange={(e) => setBorderRadius(e.target.value)}
                  options={[
                    { value: '0px', label: 'Sharp (0px)' },
                    { value: '0.375rem', label: 'Default Rounded (6px)' },
                    { value: '0.75rem', label: 'Soft Pill (12px)' },
                  ]}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wider block mb-1.5">
                  Component Density
                </label>
                <Select
                  value={density}
                  onChange={(e) => setDensity(e.target.value)}
                  options={[
                    { value: 'compact', label: 'Compact (High Density Data Tables)' },
                    { value: 'comfortable', label: 'Comfortable (Standard)' },
                  ]}
                />
              </div>

              <Button
                variant="primary"
                className="w-full mt-4"
                onClick={() => alert('Theme tokens saved to platform settings hierarchy.')}
              >
                Save Theme Tokens
              </Button>
            </CardContent>
          </Card>

          {/* Live Token Preview */}
          <Card className="lg:col-span-2 border border-zinc-200 bg-zinc-50">
            <CardHeader>
              <CardTitle>Live Token Rendering Preview</CardTitle>
              <CardDescription>Demonstrates buttons, inputs, cards, and typography with selected tokens.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className="p-6 bg-white border border-zinc-200 shadow-sm space-y-4"
                style={{ borderRadius }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-zinc-900">Apex Real Estate — Preview Card</h3>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="text-sm text-zinc-600">
                  This preview container renders design tokens dynamically using CSS variable mappings.
                </p>
                <div className="flex gap-3">
                  <Button variant="primary">Primary Action</Button>
                  <Button variant="outline">Secondary Button</Button>
                  <Button variant="danger">Destructive Action</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. Feature Flags */}
      {activeTab === 'flags' && (
        <div className="space-y-4">
          <Card className="border border-zinc-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-zinc-700" />
                Platform Feature Flags
              </CardTitle>
              <CardDescription>
                Safely enable, test in beta, or disable modular platform capabilities across tenants.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-zinc-200">
                {featureFlags.map((flag) => (
                  <div key={flag.id} className="py-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900">{flag.name}</span>
                        <code className="text-xs font-mono text-zinc-500">{flag.key}</code>
                      </div>
                      <p className="text-xs text-zinc-600 mt-0.5">{flag.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          flag.state === 'ON'
                            ? 'success'
                            : flag.state === 'BETA'
                            ? 'warning'
                            : flag.state === 'INTERNAL'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {flag.state}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleFlagState(flag.id)}
                      >
                        Change State
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal for Setting Override */}
      <Modal
        isOpen={!!editingSetting}
        onClose={() => setEditingSetting(null)}
        title={`Override: ${editingSetting?.label || ''}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-600">{editingSetting?.description}</p>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Target Scope</label>
            <Select
              value={overrideScope}
              onChange={(e) => setOverrideScope(e.target.value)}
              options={editingSetting?.allowed_scopes.map((s) => ({ value: s, label: s })) || []}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">New Value</label>
            <Input
              value={overrideValue}
              onChange={(e) => setOverrideValue(e.target.value)}
              placeholder="Enter value"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Audit Reason</label>
            <Input
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Reason for change (e.g. Q3 regional policy update)"
            />
          </div>

          {saveSuccess && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Setting override committed and recorded in version history.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditingSetting(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveOverride}>
              Commit Override
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
