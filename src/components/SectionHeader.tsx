import React from 'react';
import { cn } from '../utils/cn';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  badge,
  className,
}) => {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-emerald-950/60 mb-6 font-sans', className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-extrabold tracking-tight text-white">{title}</h2>
          {badge}
        </div>
        {subtitle && <p className="text-xs text-neutral-300 max-w-2xl">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
