import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-brand-border p-4 animate-pulse flex flex-col justify-between">
      <div>
        <div className="w-full aspect-square bg-slate-200 rounded-lg mb-3"></div>
        <div className="h-3 bg-slate-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-4/5 mb-3"></div>
        <div className="h-3 bg-slate-100 rounded w-2/3 mb-4"></div>
      </div>
      <div>
        <div className="h-5 bg-slate-200 rounded w-1/2 mb-3"></div>
        <div className="h-9 bg-slate-200 rounded-lg w-full"></div>
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full bg-white rounded-xl border border-brand-border overflow-hidden animate-pulse">
      <div className="h-12 bg-slate-100 border-b border-brand-border"></div>
      <div className="divide-y divide-brand-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between space-x-4">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/6"></div>
            <div className="h-4 bg-slate-200 rounded w-1/12"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
