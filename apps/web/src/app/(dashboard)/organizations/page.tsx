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
} from '@platform/ui';
import { Building2, Plus, CheckCircle2, ShieldAlert } from 'lucide-react';

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
  const [organizations] = useState<OrgRecord[]>([
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
        <Button variant="primary" size="sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Onboard New Partner
        </Button>
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Registered Organizations</CardTitle>
          <CardDescription className="text-xs">
            Showing all active tenant boundaries in the system
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
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      View Tenant
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
