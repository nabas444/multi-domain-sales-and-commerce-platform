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
  UploadCloud,
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
  const [collapsed, setCollapsed] = useState(false);
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
    const savedCollapsed = localStorage.getItem('platform_sidebar_collapsed');
    if (savedCollapsed) {
      setCollapsed(savedCollapsed === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('platform_sidebar_collapsed', String(next));
  };

  const handleSignOut = () => {
    localStorage.removeItem('platform_token');
    localStorage.removeItem('platform_user');
    router.push('/login');
  };

  const navItems = [
    {
      label: 'Control Room',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4 shrink-0" />,
    },
    {
      label: 'Moderation Queue',
      href: '/moderation',
      icon: <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />,
      badge: 'Review',
    },
    {
      label: 'Organizations',
      href: '/organizations',
      icon: <Building2 className="h-4 w-4 shrink-0" />,
      badge: 'Tenants',
    },
    {
      label: 'Domain Catalog',
      href: '/domains',
      icon: <Layers className="h-4 w-4 shrink-0" />,
      badge: 'Taxonomy',
    },
    {
      label: 'Inventory',
      href: '/inventory',
      icon: <Package className="h-4 w-4 shrink-0" />,
    },
    {
      label: 'Cloudinary Media CDN',
      href: '/media',
      icon: <UploadCloud className="h-4 w-4 shrink-0 text-blue-600" />,
      badge: 'Cloudinary',
    },
    {
      label: 'Sales CRM & Deals',
      href: '/crm',
      icon: <Users className="h-4 w-4 shrink-0" />,
      badge: 'Field Mode',
    },
    {
      label: 'Contracts & Terms',
      href: '/contracts',
      icon: <FileText className="h-4 w-4 shrink-0" />,
    },
    {
      label: 'Financial Ledger',
      href: '/finance',
      icon: <DollarSign className="h-4 w-4 shrink-0" />,
    },
    {
      label: 'Marketing & CMS',
      href: '/marketing',
      icon: <Layers className="h-4 w-4 shrink-0" />,
    },
    {
      label: 'Settings & Theme',
      href: '/settings',
      icon: <Settings className="h-4 w-4 shrink-0" />,
    },
    {
      label: 'Audit Trail',
      href: '/audit',
      icon: <ShieldAlert className="h-4 w-4 shrink-0" />,
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
          <Link href="/marketplace" className="hidden sm:inline-flex">
            <Button variant="outline" size="sm" className="h-7 text-xs">
              Public Marketplace
            </Button>
          </Link>

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

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex">
          <div className="w-64 bg-white h-full p-4 flex flex-col justify-between border-r border-zinc-200 shadow-xl">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <span className="font-bold text-sm text-zinc-900">Workspace Menu</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                        active
                          ? 'bg-zinc-900 text-white font-semibold'
                          : 'text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        {item.icon}
                        <span>{item.label}</span>
                      </span>
                      {item.badge && (
                        <Badge variant={active ? 'secondary' : 'outline'} className="text-[9px] py-0 px-1">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="pt-3 border-t border-zinc-100">
              <Link href="/marketplace" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full mb-2">
                  Visit Marketplace
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex">
        {/* Left Sidebar (Desktop - Collapsible) */}
        <aside
          className={`${
            collapsed ? 'w-16' : 'w-60'
          } transition-all duration-200 border-r border-zinc-200 bg-zinc-50/50 p-3 hidden md:flex flex-col justify-between`}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 pb-2">
              {!collapsed && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Navigation
                </span>
              )}
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-1 rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/50 transition-colors mx-auto"
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <Menu className="h-3.5 w-3.5" />
              </button>
            </div>

            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center ${
                    collapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-2.5 py-2'
                  } rounded-md text-xs font-medium transition-colors ${
                    active
                      ? 'bg-zinc-900 text-white font-semibold shadow-sm'
                      : 'text-zinc-700 hover:bg-zinc-200/60 hover:text-zinc-900'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {item.icon}
                    {!collapsed && <span>{item.label}</span>}
                  </span>
                  {!collapsed && item.badge && (
                    <Badge variant={active ? 'secondary' : 'outline'} className="text-[9px] py-0 px-1">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
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
