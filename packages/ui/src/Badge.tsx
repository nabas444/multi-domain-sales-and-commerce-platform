import React from 'react';
import { cn } from './utils.js';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const base =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight transition-colors focus:outline-none';

  const variants = {
    default: 'bg-zinc-900 text-zinc-50 hover:bg-zinc-800',
    secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border border-zinc-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-red-50 text-red-700 border border-red-200',
    outline: 'text-zinc-950 border border-zinc-300',
  };

  return <div className={cn(base, variants[variant], className)} {...props} />;
}
