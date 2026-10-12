import React from 'react';
import { LucideIcon, PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionLink?: string;
  onActionClick?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = PackageOpen,
  title,
  description,
  actionLabel,
  actionLink,
  onActionClick,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-brand-border bg-white ${className}`}
    >
      <div className="w-16 h-16 rounded-full bg-brand-muted flex items-center justify-center text-brand-muted-foreground mb-4">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-brand-foreground mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-brand-muted-foreground max-w-md mb-6">
          {description}
        </p>
      )}
      {actionLabel && (
        <div>
          {actionLink ? (
            <Link
              to={actionLink}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-brand-primary text-white font-medium hover:bg-brand-primary-hover transition-colors shadow-sm text-sm"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onActionClick}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-brand-primary text-white font-medium hover:bg-brand-primary-hover transition-colors shadow-sm text-sm"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
