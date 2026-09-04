'use client';

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Badge,
  Button,
  Modal,
  Input,
  Select,
} from '@platform/ui';
import { Building2, Plus, CheckCircle2, ShieldCheck, Eye, MapPin } from 'lucide-react';

interface OrgRecord {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'DRAFT' | 'SUSPENDED';
  city: string;
  branchCount: number;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrgRecord[]>([
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'System Provider Global',
      slug: 'system-provider',
      type: 'PROVIDER',
      status: 'ACTIVE',
      city: 'Addis Ababa',
      branchCount: 1,
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Apex Real Estate Group',
      slug: 'apex-real-estate',
      type: 'DEVELOPER',
      status: 'ACTIVE',
      city: 'Addis Ababa (Bole HQ)',
      branchCount: 1,
    },
  ]);

  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrgRecord | null>(null);

  // Form states
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [newOrgType, setNewOrgType] = useState('DEVELOPER');
  const [newOrgCity, setNewOrgCity] = useState('Addis Ababa');

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    const newOrg: OrgRecord = {
      id: `org-${Date.now()}`,
      name: newOrgName.trim(),
      slug: newOrgSlug.trim() || newOrgName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      type: newOrgType,
      status: 'ACTIVE',
      city: newOrgCity.trim() || 'Addis Ababa',
      branchCount: 1,
    };

    setOrganizations((prev) => [...prev, newOrg]);
    setNewOrgName('');
    setNewOrgSlug('');
    setOnboardModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            Partner Organizations
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            Manage partner onboarding, legal verification status, branches, and tenant scopes
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setOnboardModalOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Onboard New Partner
        </Button>
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Registered Organizations</CardTitle>
          <CardDescription className="text-xs">
            Showing all {organizations.length} active tenant boundaries in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Branches</TableHead>
                <TableHead>Lifecycle Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium text-zinc-900 flex items-center">
                    <Building2 className="h-4 w-4 mr-2 text-zinc-400" />
                    {org.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-600">{org.slug}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">
                      {org.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-600">{org.city}</TableCell>
                  <TableCell className="text-xs text-zinc-600">{org.branchCount}</TableCell>
                  <TableCell>
                    {org.status === 'ACTIVE' ? (
                      <Badge variant="success" className="text-[10px]">
                        ACTIVE
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10px]">
                        {org.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setSelectedOrg(org)}
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      View Tenant
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Onboard New Partner Modal */}
      <Modal
        isOpen={onboardModalOpen}
        onClose={() => setOnboardModalOpen(false)}
        title="Onboard New Partner Organization"
      >
        <form onSubmit={handleOnboardSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Organization Legal Name
            </label>
            <Input
              required
              placeholder="e.g. Zemen Automotive PLC"
              value={newOrgName}
              onChange={(e) => {
                setNewOrgName(e.target.value);
                setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
              }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Tenant Slug (Subdomain identifier)
            </label>
            <Input
              required
              placeholder="e.g. zemen-automotive"
              value={newOrgSlug}
              onChange={(e) => setNewOrgSlug(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                Commercial Type
              </label>
              <Select
                value={newOrgType}
                onChange={(e) => setNewOrgType(e.target.value)}
                options={[
                  { value: 'DEVELOPER', label: 'Real Estate Developer' },
                  { value: 'DEALER', label: 'Automotive Dealer' },
                  { value: 'DISTRIBUTOR', label: 'Equipment Distributor' },
                  { value: 'BROKER', label: 'Brokerage Firm' },
                ]}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                Headquarters City
              </label>
              <Input
                placeholder="Addis Ababa"
                value={newOrgCity}
                onChange={(e) => setNewOrgCity(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" type="button" onClick={() => setOnboardModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Complete Onboarding
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Tenant Modal */}
      <Modal
        isOpen={!!selectedOrg}
        onClose={() => setSelectedOrg(null)}
        title={`Tenant Dossier: ${selectedOrg?.name || ''}`}
      >
        {selectedOrg && (
          <div className="space-y-4">
            <div className="p-3 bg-zinc-50 rounded border border-zinc-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Tenant UUID:</span>
                <span className="font-mono text-zinc-800">{selectedOrg.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Tenant Slug:</span>
                <span className="font-mono font-semibold text-zinc-900">{selectedOrg.slug}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Commercial Category:</span>
                <Badge variant="secondary" className="text-[10px]">{selectedOrg.type}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Isolation Boundary:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Strict Row-Level Scoped
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Location:</span>
                <span className="text-zinc-800">{selectedOrg.city}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSelectedOrg(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  alert(`Switched workspace context to ${selectedOrg.name}`);
                  setSelectedOrg(null);
                }}
              >
                Switch Context &rarr;
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
