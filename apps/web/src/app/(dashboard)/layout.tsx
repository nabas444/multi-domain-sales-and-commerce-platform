'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Layers,
  Package,
  Users,
  FileText,
  DollarSign,
  Settings,
  ShieldAlert,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Search,
} from 'lucide-react';
import { Badge, Button } from '@platform/ui';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    isSuperAdmin: boolean;
    roles: string[];
    activeOrganizationId?: string | null;
  } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('platform_user');
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('platform_token');
    localStorage.removeItem('platform_user');
    router.push('/login');
  };

  const navItems: NavItem[] = [
    {
      label: 'Control Room',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4 mr-2.5" />,
    },
    {
      label: 'Organizations',
      href: '/organizations',
      icon: <Building2 className="h-4 w-4 mr-2.5" />,
      badge: 'Tenant Core',
    },
    {
      label: 'Domain Catalog',
      href: '/domains',
      icon: <Layers className="h-4 w-4 mr-2.5" />,
      badge: 'Config',
    },
    {
      label: 'Inventory',
      href: '/inventory',
      icon: <Package className="h-4 w-4 mr-2.5" />,
    },
    {
      label: 'CRM & Leads',
      href: '/crm',
      icon: <Users className="h-4 w-4 mr-2.5" />,
    },
    {
      label: 'Contracts',
      href: '/contracts',
      icon: <FileText className="h-4 w-4 mr-2.5" />,
    },
    {
      label: 'Financial Ledger',
      href: '/finance',
      icon: <DollarSign className="h-4 w-4 mr-2.5" />,
    },
    {
      label: 'Settings & Theme',
      href: '/settings',
      icon: <Settings className="h-4 w-4 mr-2.5" />,
    },
    {
      label: 'Audit Trail',
      href: '/audit',
      icon: <ShieldAlert className="h-4 w-4 mr-2.5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col antialiased">
      {/* Top Header */}
      <header className="h-14 border-b border-zinc-200 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-md text-zinc-600 hover:bg-zinc-100"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="h-7 w-7 rounded bg-zinc-950 flex items-center justify-center text-white font-bold text-xs tracking-wider">
              MD
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-950 hidden sm:inline-block">
              MULTI-DOMAIN PLATFORM
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-3">
          {/* Active Tenant Context Indicator */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md border border-zinc-200 bg-zinc-50 text-xs text-zinc-700">
            <Building2 className="h-3.5 w-3.5 text-zinc-500" />
            <span className="font-medium">
              {user?.isSuperAdmin ? 'Global Provider Context' : 'Apex Real Estate'}
            </span>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 ml-1">
              {user?.isSuperAdmin ? 'SUPER ADMIN' : user?.roles?.[0] || 'MEMBER'}
            </Badge>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex">
        {/* Left Sidebar (Desktop) */}
        <aside className="w-60 border-r border-zinc-200 bg-zinc-50/50 p-4 hidden md:flex flex-col justify-between">
          <nav className="space-y-1">
            <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Navigation
            </div>
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                    active
                      ? 'bg-zinc-900 text-white font-semibold shadow-sm'
                      : 'text-zinc-700 hover:bg-zinc-200/60 hover:text-zinc-900'
                  }`}
                >
                  <span className="flex items-center">
                    {item.icon}
                    {item.label}
                  </span>
                  {item.badge && !active && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700 font-mono">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 rounded-md border border-zinc-200 bg-white">
            <span className="text-[10px] font-semibold uppercase text-zinc-400 block mb-1">
              Active User
            </span>
            <span className="text-xs font-semibold text-zinc-900 block truncate">
              {user ? `${user.firstName} ${user.lastName}` : 'System Administrator'}
            </span>
            <span className="text-[11px] text-zinc-500 block truncate">
              {user?.email || 'admin@platform.local'}
            </span>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
