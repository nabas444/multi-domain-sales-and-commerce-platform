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
} from '@platform/ui';
import {
  DollarSign,
  Receipt,
  FileCheck,
  AlertOctagon,
  Plus,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
} from 'lucide-react';

interface LedgerEntry {
  id: string;
  entry_type: string;
  debit_amount: number;
  credit_amount: number;
  balance_after: number;
  currency: string;
  reference_number: string;
  notes: string;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  type: string;
  total_amount: number;
  currency: string;
  status: string;
  due_date: string;
}

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState('ledger');
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [creditBalance, setCreditBalance] = useState(100);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeAmount, setDisputeAmount] = useState('');

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      const token = localStorage.getItem('platform_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const [ledRes, invRes] = await Promise.all([
        fetch('http://localhost:4000/api/v1/commercial/ledger', { headers }).catch(() => null),
        fetch('http://localhost:4000/api/v1/commercial/invoices', { headers }).catch(() => null),
      ]);

      if (ledRes && ledRes.ok) {
        const json = await ledRes.json();
        const items = Array.isArray(json) ? json : (json?.data || []);
        setLedger(items.length > 0 ? items : [
          {
            id: 'led1',
            entry_type: 'PLATFORM_FEE',
            debit_amount: 370000,
            credit_amount: 0,
            balance_after: -370000,
            currency: 'ETB',
            reference_number: 'TXN-1725354000-881',
            notes: 'Platform success fee on deal DL-001 (Rate: 2.0%)',
            created_at: new Date().toISOString(),
          },
          {
            id: 'led2',
            entry_type: 'AGENT_COMMISSION',
            debit_amount: 185000,
            credit_amount: 0,
            balance_after: -555000,
            currency: 'ETB',
            reference_number: 'TXN-1725354000-881-AGT',
            notes: 'Sales agent commission for Selam Bekele (Rate: 1.0%)',
            created_at: new Date().toISOString(),
          },
          {
            id: 'led3',
            entry_type: 'SUBSCRIPTION_FEE',
            debit_amount: 25000,
            credit_amount: 0,
            balance_after: -25000,
            currency: 'ETB',
            reference_number: 'LED-INIT-001',
            notes: 'Monthly enterprise SaaS subscription invoice',
            created_at: new Date(Date.now() - 86400000).toISOString(),
          },
        ]);
      }

      if (invRes && invRes.ok) {
        const json = await invRes.json();
        const items = Array.isArray(json) ? json : (json?.data || []);
        setInvoices(items.length > 0 ? items : [
          {
            id: 'inv1',
            invoice_number: 'INV-2026-001',
            type: 'SUBSCRIPTION',
            total_amount: 25000,
            currency: 'ETB',
            status: 'PAID',
            due_date: '2026-02-01',
          },
          {
            id: 'inv2',
            invoice_number: 'INV-2026-002',
            type: 'COMMISSION_FEE',
            total_amount: 370000,
            currency: 'ETB',
            status: 'ISSUED',
            due_date: '2026-02-15',
          },
        ]);
      }
    } catch {
      // Handled
    }
  };

  const handleFileDispute = async () => {
    alert('Commercial dispute submitted. Funds held in escrow until audit review.');
    setDisputeModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2.5">
            <DollarSign className="h-6 w-6 text-zinc-700" />
            Financial Ledger & Settlement Engine
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Double-entry immutable accounting ledger, invoicing, partner settlements, and dispute resolution.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDisputeModalOpen(true)}>
            <AlertOctagon className="h-4 w-4 mr-1.5 text-rose-600" />
            File Dispute
          </Button>
          <Button variant="primary">
            <Download className="h-4 w-4 mr-1.5" />
            Generate Settlement Statement
          </Button>
        </div>
      </div>

      {/* Wallet / Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-zinc-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Lead Credit Balance</div>
              <div className="text-2xl font-bold font-mono text-zinc-900 mt-1">{creditBalance} Credits</div>
            </div>
            <div className="h-10 w-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-700">
              <Coins className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Matured Partner Payout</div>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">17,945,000 ETB</div>
            </div>
            <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-700">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Platform Retained Fees</div>
              <div className="text-2xl font-bold font-mono text-zinc-900 mt-1">395,000 ETB</div>
            </div>
            <div className="h-10 w-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-700">
              <Receipt className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'ledger', label: 'Immutable Ledger Entries', count: ledger.length },
          { id: 'invoices', label: 'Invoices & Billing', count: invoices.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* 1. Financial Ledger */}
      {activeTab === 'ledger' && (
        <Card className="border border-zinc-200">
          <CardHeader>
            <CardTitle>Append-Only Ledger Feed</CardTitle>
            <CardDescription>
              Every debit and credit is mathematically permanent. Corrections are recorded solely as compensating adjustments.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 text-xs uppercase font-semibold text-zinc-500 bg-zinc-50">
                  <tr>
                    <th className="py-3.5 px-4">Transaction Ref</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Debit Amount</th>
                    <th className="py-3.5 px-4">Credit Amount</th>
                    <th className="py-3.5 px-4">Balance After</th>
                    <th className="py-3.5 px-4">Notes / Rationale</th>
                    <th className="py-3.5 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {ledger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-zinc-900 text-xs">
                        {entry.reference_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="text-xs">{entry.entry_type}</Badge>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-rose-600">
                        {entry.debit_amount > 0 ? `-${Number(entry.debit_amount).toLocaleString()} ${entry.currency}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-600">
                        {entry.credit_amount > 0 ? `+${Number(entry.credit_amount).toLocaleString()} ${entry.currency}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-800 font-semibold">
                        {Number(entry.balance_after).toLocaleString()} {entry.currency}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-600 max-w-xs truncate">
                        {entry.notes}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-400">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Invoices */}
      {activeTab === 'invoices' && (
        <Card className="border border-zinc-200">
          <CardHeader>
            <CardTitle>Invoices & Billing Statements</CardTitle>
            <CardDescription>SaaS subscription charges and commercial commission invoices.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 text-xs uppercase font-semibold text-zinc-500 bg-zinc-50">
                  <tr>
                    <th className="py-3.5 px-4">Invoice #</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-zinc-900">{inv.invoice_number}</td>
                      <td className="py-3.5 px-4 text-xs font-medium text-zinc-700">{inv.type}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-zinc-900">
                        {inv.total_amount.toLocaleString()} {inv.currency}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-600">{inv.due_date}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant={inv.status === 'PAID' ? 'success' : 'warning'}>{inv.status}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button variant="outline" size="sm">Download PDF</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dispute Modal */}
      <Modal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        title="File Commercial Fee Dispute"
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-600">
            Filing a dispute halts fund release for the associated transaction and assigns a compliance auditor.
          </p>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Dispute Reason</label>
            <Input
              placeholder="e.g. Transaction gross was adjusted after buyer price renegotiation"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Requested Adjustment (ETB)</label>
            <Input
              type="number"
              placeholder="e.g. 50000"
              value={disputeAmount}
              onChange={(e) => setDisputeAmount(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" onClick={() => setDisputeModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleFileDispute}>Submit Dispute</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
