'use client';

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  Tabs,
} from '@platform/ui';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Eye,
  Building,
  Check,
  Ban,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface ModerationItem {
  id: string;
  type: 'LISTING' | 'ORGANIZATION' | 'AGENT';
  title: string;
  submittedBy: string;
  domain: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  details: string;
}

export default function ModerationPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [items, setItems] = useState<ModerationItem[]>([
    {
      id: 'mod-1',
      type: 'LISTING',
      title: 'Executive Villa in Old Airport Diplomatic Zone',
      submittedBy: 'Apex Real Estate Group',
      domain: 'Real Estate',
      submittedAt: '10 minutes ago',
      status: 'PENDING',
      details: 'Price: 65,000,000 ETB • Title deed verified • Mandate: Sole Agency',
    },
    {
      id: 'mod-2',
      type: 'ORGANIZATION',
      title: 'Blue Nile Transport & Machinery PLC',
      submittedBy: 'System Onboarding Portal',
      domain: 'Automotive & Heavy Equipment',
      submittedAt: '1 hour ago',
      status: 'PENDING',
      details: 'Commercial Registration: ET-AA-2026-9812 • City: Addis Ababa',
    },
    {
      id: 'mod-3',
      type: 'LISTING',
      title: 'Modern Corporate Office Floor in Mega Building',
      submittedBy: 'Apex Real Estate Group',
      domain: 'Real Estate',
      submittedAt: '3 hours ago',
      status: 'APPROVED',
      details: 'Price: 250,000 ETB/mo • Verified Freehold Commercial Space',
    },
  ]);

  const handleAction = (id: string, newStatus: 'APPROVED' | 'REJECTED' | 'PENDING') => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  const filtered = items.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return item.status === 'PENDING';
    if (activeTab === 'approved') return item.status === 'APPROVED';
    if (activeTab === 'rejected') return item.status === 'REJECTED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
              Content & Partner Moderation Queue
            </h1>
            <Badge variant="warning">
              {items.filter((i) => i.status === 'PENDING').length} PENDING REVIEW
            </Badge>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Review and certify listings, legal title disclosures, and partner tenant applications before publication
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'all', label: 'All Items', count: items.length },
          { id: 'pending', label: 'Pending Review', count: items.filter((i) => i.status === 'PENDING').length },
          { id: 'approved', label: 'Approved', count: items.filter((i) => i.status === 'APPROVED').length },
          { id: 'rejected', label: 'Rejected', count: items.filter((i) => i.status === 'REJECTED').length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Queue Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center border-zinc-200">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <div className="text-sm font-semibold text-zinc-800">Queue is clear!</div>
            <p className="text-xs text-zinc-500 mt-1">No items match the current status filter.</p>
          </Card>
        ) : (
          filtered.map((item) => (
            <Card key={item.id} className="border-zinc-200 hover:border-zinc-300 transition-colors">
              <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-zinc-900 text-sm">{item.title}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {item.type}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {item.domain}
                    </Badge>
                    <Badge
                      variant={
                        item.status === 'APPROVED'
                          ? 'success'
                          : item.status === 'PENDING'
                          ? 'warning'
                          : 'danger'
                      }
                      className="text-[10px]"
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-600">{item.details}</p>
                  <div className="text-[11px] text-zinc-400 flex items-center gap-2 pt-0.5">
                    <span>Submitted by: <strong className="text-zinc-700">{item.submittedBy}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.submittedAt}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  {item.status === 'PENDING' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(item.id, 'REJECTED')}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        <Ban className="mr-1.5 h-3.5 w-3.5" />
                        Reject
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAction(item.id, 'APPROVED')}
                      >
                        <Check className="mr-1.5 h-3.5 w-3.5" />
                        Approve & Publish
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAction(item.id, 'PENDING')}
                      className="text-xs text-zinc-500"
                    >
                      Reopen Review
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
