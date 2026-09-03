import React from 'react';
import { cn } from './utils.js';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function Alert({ className, variant = 'default', ...props }: AlertProps) {
  const base = 'relative w-full rounded-lg border p-4 text-sm [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4';

  const variants = {
    default: 'bg-white text-zinc-900 border-zinc-200',
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    danger: 'bg-red-50 text-red-900 border-red-200',
    info: 'bg-blue-50 text-blue-900 border-blue-200',
  };

  return <div role="alert" className={cn(base, variants[variant], className)} {...props} />;
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={cn('mb-1 font-semibold leading-none tracking-tight', className)} {...props} />;
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <div className={cn('text-xs text-zinc-600 [&_p]:leading-relaxed', className)} {...props} />;
}
