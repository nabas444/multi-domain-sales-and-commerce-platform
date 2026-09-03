import Link from 'next/link';
import { Button } from '@platform/ui';
import {
  Building2,
  ShieldCheck,
  Layers,
  ArrowRight,
  BarChart3,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-zinc-950 flex flex-col">
      {/* Navigation Header */}
      <header className="h-16 border-b border-zinc-200 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded bg-zinc-900 flex items-center justify-center text-white font-bold text-sm tracking-wider">
            MD
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-zinc-900 block">
              MULTI-DOMAIN
            </span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block -mt-1 font-medium">
              Sales & Commerce Platform
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/marketplace">
            <Button variant="outline" size="sm">
              Public Marketplace
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="primary" size="sm">
              Access Workspace
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center space-x-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-800 mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Foundation & Core Tenant Architecture Active</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight max-w-3xl text-zinc-950 leading-tight">
          Enterprise Multi-Domain Commercial Operating System
        </h1>

        <p className="mt-4 text-base sm:text-lg text-zinc-600 max-w-2xl leading-relaxed">
          Configuration-first infrastructure combining marketplace discovery, inventory ownership,
          omni-channel CRM, sales agency execution, and deterministic financial ledger settlement.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/dashboard">
            <Button variant="primary" size="lg" className="h-11 px-6">
              Launch Control Room
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="h-11 px-6">
              Partner Portal Login
            </Button>
          </Link>
        </div>

        {/* Core Architectural Pillars */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 rounded-lg border border-zinc-200 bg-zinc-50/50 hover:bg-white hover:shadow-sm transition-all">
            <div className="h-10 w-10 rounded-md bg-zinc-900 text-white flex items-center justify-center mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base text-zinc-900">Strict Tenant Boundary</h3>
            <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
              Every query and mutation is strictly scoped at the database, service, and context
              layer. Zero risk of cross-tenant data leakage.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-zinc-200 bg-zinc-50/50 hover:bg-white hover:shadow-sm transition-all">
            <div className="h-10 w-10 rounded-md bg-zinc-900 text-white flex items-center justify-center mb-4">
              <Sliders className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base text-zinc-900">Dynamic Domain Engine</h3>
            <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
              Create and operate Real Estate, Automotive, Elevators, and Commerce verticals without
              rebuilding the codebase.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-zinc-200 bg-zinc-50/50 hover:bg-white hover:shadow-sm transition-all">
            <div className="h-10 w-10 rounded-md bg-zinc-900 text-white flex items-center justify-center mb-4">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base text-zinc-900">Auditable Financial Ledger</h3>
            <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
              Double-entry-style immutable ledger recording exact contract versions, fee triggers,
              sales splits, and partner settlements.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-6 px-6 text-center text-xs text-zinc-500">
        Multi-Domain Sales & Commerce Platform • Phase 0/1 Foundation Active
      </footer>
    </div>
  );
}
