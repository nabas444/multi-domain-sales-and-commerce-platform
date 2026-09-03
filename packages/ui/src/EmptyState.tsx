import React from 'react';
import { cn } from './utils.js';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 p-8 text-center animate-in fade-in-50 bg-zinc-50/50',
        className
      )}
    >
      {icon && <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 mb-4">{icon}</div>}
      <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
      <p className="mt-1 text-sm text-zinc-500 max-w-sm">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
