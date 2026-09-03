'use client';

import React from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@platform/ui';
import {
  Building2,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Server,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Mission Control Room</h1>
            <Badge variant="success">SYSTEM OPERATIONAL</Badge>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Global governance, tenant isolation metrics, and platform performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/organizations">
            <Button variant="outline" size="sm">
              <Building2 className="mr-1.5 h-3.5 w-3.5" />
              Manage Partners
            </Button>
          </Link>
          <Link href="/audit">
            <Button variant="secondary" size="sm">
              <Activity className="mr-1.5 h-3.5 w-3.5" />
              View Audit Feed
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2 border-b-0">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Active Partners
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-zinc-900 mt-1">2</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-zinc-500 flex items-center justify-between">
            <span>Apex Real Estate + Provider</span>
            <span className="text-emerald-600 font-medium">100% verified</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2 border-b-0">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Active Domains
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-zinc-900 mt-1">1</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-zinc-500 flex items-center justify-between">
            <span>Real Estate Vertical</span>
            <span className="text-zinc-600 font-medium">Phase 3 Seed</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2 border-b-0">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Tenant Boundary
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-zinc-900 mt-1">100%</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-zinc-500 flex items-center justify-between">
            <span>Server-side isolation</span>
            <span className="text-emerald-600 font-medium">Zero leakage</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2 border-b-0">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Base Currency
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-zinc-900 mt-1">ETB</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-zinc-500 flex items-center justify-between">
            <span>Ethiopian Birr</span>
            <span className="text-zinc-600 font-medium">USD Secondary</span>
          </CardContent>
        </Card>
      </div>

      {/* System Infrastructure Health Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Core Architectural Infrastructure</CardTitle>
              <CardDescription className="text-xs">
                PostgreSQL 18 schemas, tenant boundary interceptors, and security guarantees
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-[10px]">
              PHASE 0/1 COMPLETE
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-3.5 rounded border border-zinc-200 bg-zinc-50/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-zinc-900">PostgreSQL 18</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-zinc-600">
                13 Schemas partitioned: identity, organizations, domains, inventory, finance, audit.
              </p>
            </div>

            <div className="p-3.5 rounded border border-zinc-200 bg-zinc-50/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-zinc-900">Tenant Isolation Guard</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-zinc-600">
                AsyncLocalStorage request context + repository scoping + cross-tenant penetration test.
              </p>
            </div>

            <div className="p-3.5 rounded border border-zinc-200 bg-zinc-50/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-zinc-900">Immutable Audit Logs</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-zinc-600">
                Append-only trigger prevents any UPDATE or DELETE operations on audit trail.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
