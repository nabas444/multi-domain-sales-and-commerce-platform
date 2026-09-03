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
  FileText,
  Calculator,
  ShieldAlert,
  History,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface Contract {
  id: string;
  contract_number: string;
  organization_name: string;
  plan_name: string;
  version: number;
  status: string;
  effective_date: string;
  fee_model: string;
  terms: {
    platformFeeRate: number;
    agentCommissionRate: number;
    settlementCycleDays: number;
  };
}

export default function ContractsPage() {
  const [activeTab, setActiveTab] = useState('contracts');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // Fee Simulator States
  const [simValue, setSimValue] = useState('10000000');
  const [simPlatformRate, setSimPlatformRate] = useState('2.0');
  const [simAgentRate, setSimAgentRate] = useState('1.0');

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const token = localStorage.getItem('platform_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('http://localhost:4000/api/v1/commercial/contracts', { headers }).catch(() => null);
      if (res && res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : (json?.data || []);
        setContracts(items.length > 0 ? items : [
          {
            id: 'c1',
            contract_number: 'CNT-APEX-2026-001',
            organization_name: 'Apex Real Estate Group',
            plan_name: 'Enterprise Developer Plan',
            version: 1,
            status: 'ACTIVE',
            effective_date: '2026-01-01',
            fee_model: 'HYBRID',
            terms: {
              platformFeeRate: 2.0,
              agentCommissionRate: 1.0,
              settlementCycleDays: 30,
            },
          },
        ]);
      }
    } catch {
      // Handled
    }
  };

  // Waterfall calculation simulation
  const gross = parseFloat(simValue) || 0;
  const pRate = parseFloat(simPlatformRate) || 0;
  const aRate = parseFloat(simAgentRate) || 0;
  const platformFee = (gross * pRate) / 100;
  const agentShare = (gross * aRate) / 100;
  const partnerNet = gross - platformFee - agentShare;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-zinc-700" />
            Commercial Contracts & Fee Governance
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Deterministic commercial terms, waterfall formulas, partner contract versioning, and dispute handling.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'contracts', label: 'Active Partner Contracts', count: contracts.length },
          { id: 'simulator', label: 'Commercial Waterfall Simulator' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* 1. Contracts List */}
      {activeTab === 'contracts' && (
        <Card className="border border-zinc-200">
          <CardHeader>
            <CardTitle>Governing Partner Contracts</CardTitle>
            <CardDescription>
              Each partner is governed by immutable versioned terms. Transactions always execute against the active version.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 text-xs uppercase font-semibold text-zinc-500 bg-zinc-50">
                  <tr>
                    <th className="py-3.5 px-4">Contract Number</th>
                    <th className="py-3.5 px-4">Partner Organization</th>
                    <th className="py-3.5 px-4">Subscription Plan</th>
                    <th className="py-3.5 px-4">Fee Model</th>
                    <th className="py-3.5 px-4">Platform Fee</th>
                    <th className="py-3.5 px-4">Agent Share</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {contracts.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-zinc-900">
                        {c.contract_number}
                        <span className="ml-2 text-xs font-normal text-zinc-400">v{c.version}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-800">{c.organization_name}</td>
                      <td className="py-3.5 px-4 text-xs text-zinc-600">{c.plan_name}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="text-xs">{c.fee_model}</Badge>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-900">{c.terms.platformFeeRate}%</td>
                      <td className="py-3.5 px-4 font-mono text-zinc-900">{c.terms.agentCommissionRate}%</td>
                      <td className="py-3.5 px-4">
                        <Badge variant="success" className="text-xs">{c.status}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedContract(c)}
                        >
                          View Terms
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Waterfall Simulator */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border border-zinc-200 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-zinc-700" />
                Transaction Parameters
              </CardTitle>
              <CardDescription>Simulate the exact ledger allocation on deal closure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Gross Property Value (ETB)
                </label>
                <Input
                  type="number"
                  value={simValue}
                  onChange={(e) => setSimValue(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Platform Success Fee Rate (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={simPlatformRate}
                  onChange={(e) => setSimPlatformRate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Sales Agent Commission (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={simAgentRate}
                  onChange={(e) => setSimAgentRate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Waterfall Output Card */}
          <Card className="border border-zinc-200 lg:col-span-2 bg-zinc-50">
            <CardHeader>
              <CardTitle>Deterministic Waterfall Distribution Output</CardTitle>
              <CardDescription>
                Gross Transaction &rarr; Platform Fee &rarr; Sales Commission &rarr; Net Partner Settlement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-white rounded border border-zinc-200 flex justify-between items-center">
                <div>
                  <div className="text-xs text-zinc-500 font-semibold uppercase">1. Gross Deal Value</div>
                  <div className="text-xl font-bold font-mono text-zinc-900">{gross.toLocaleString()} ETB</div>
                </div>
                <Badge variant="outline">100%</Badge>
              </div>

              <div className="p-4 bg-white rounded border border-zinc-200 flex justify-between items-center">
                <div>
                  <div className="text-xs text-zinc-500 font-semibold uppercase">2. Platform Provider Fee ({pRate}%)</div>
                  <div className="text-xl font-bold font-mono text-emerald-700">{platformFee.toLocaleString()} ETB</div>
                </div>
                <Badge variant="success">Earned Fee</Badge>
              </div>

              <div className="p-4 bg-white rounded border border-zinc-200 flex justify-between items-center">
                <div>
                  <div className="text-xs text-zinc-500 font-semibold uppercase">3. Dedicated Agent Commission ({aRate}%)</div>
                  <div className="text-xl font-bold font-mono text-blue-700">{agentShare.toLocaleString()} ETB</div>
                </div>
                <Badge variant="secondary">Agent Payout</Badge>
              </div>

              <div className="p-4 bg-zinc-900 text-white rounded border border-zinc-900 flex justify-between items-center">
                <div>
                  <div className="text-xs text-zinc-400 font-semibold uppercase">4. Net Payable to Partner</div>
                  <div className="text-2xl font-bold font-mono">{partnerNet.toLocaleString()} ETB</div>
                </div>
                <Badge variant="outline" className="border-zinc-700 text-white">Settlement</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contract Terms Modal */}
      <Modal
        isOpen={!!selectedContract}
        onClose={() => setSelectedContract(null)}
        title={`Contract Terms: ${selectedContract?.contract_number || ''}`}
      >
        {selectedContract && (
          <div className="space-y-4">
            <div className="p-3 bg-zinc-50 rounded border border-zinc-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">Partner:</span>
                <strong>{selectedContract.organization_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Subscription Plan:</span>
                <strong>{selectedContract.plan_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Settlement Cycle:</span>
                <strong>{selectedContract.terms.settlementCycleDays} Days</strong>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setSelectedContract(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
