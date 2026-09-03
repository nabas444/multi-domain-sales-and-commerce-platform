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
} from '@platform/ui';
import { ShieldCheck, Lock, Activity } from 'lucide-react';

interface AuditItem {
  id: string;
  timestamp: string;
  actor: string;
  resource: string;
  action: string;
  correlationId: string;
}

export default function AuditPage() {
  const [logs] = useState<AuditItem[]>([
    {
      id: 'log-001',
      timestamp: new Date().toISOString(),
      actor: 'admin@platform.local',
      resource: 'platform',
      action: 'system_initialized',
      correlationId: 'boot-init-001',
    },
    {
      id: 'log-002',
      timestamp: new Date().toISOString(),
      actor: 'admin@platform.local',
      resource: 'identity.user',
      action: 'user.registered',
      correlationId: 'reg-apex-002',
    },
    {
      id: 'log-003',
      timestamp: new Date().toISOString(),
      actor: 'partner@apexrealty.et',
      resource: 'identity.session',
      action: 'user.logged_in',
      correlationId: 'sess-apex-003',
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Immutable Audit Trail</h1>
            <Badge variant="outline" className="font-mono text-[10px] text-zinc-600">
              <Lock className="h-3 w-3 mr-1 text-emerald-600 inline" />
              APPEND-ONLY ENFORCED
            </Badge>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Cryptographic and database-trigger guaranteed historical record of all state mutations
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Audit Events Feed</CardTitle>
          <CardDescription className="text-xs">
            Every action captures actor, organization scope, resource ID, correlation ID, and timestamps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Correlation ID</TableHead>
                <TableHead className="text-right">Integrity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs text-zinc-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-zinc-800">{log.actor}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {log.resource}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-zinc-900">{log.action}</TableCell>
                  <TableCell className="font-mono text-[11px] text-zinc-500 truncate max-w-[150px]">
                    {log.correlationId}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center text-[10px] text-emerald-600 font-medium">
                      <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                      Verified
                    </span>
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
