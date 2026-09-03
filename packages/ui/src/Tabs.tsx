import React from 'react';
import { cn } from './utils.js';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={cn('flex border-b border-zinc-200', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center space-x-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none',
              isActive
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'ml-1.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                  isActive ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
