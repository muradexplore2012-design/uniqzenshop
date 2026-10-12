import React from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';
import { Category } from '../../types/category';
import { ProductFilterParams } from '../../types/product';

interface ProductFilterDrawerProps {
  categories: Category[];
  availableBrands: string[];
  filters: ProductFilterParams;
  onFilterChange: (newFilters: ProductFilterParams) => void;
  isOpen: boolean;
  onClose: () => void;
  totalProductsCount: number;
}

export const ProductFilterDrawer: React.FC<ProductFilterDrawerProps> = ({
  categories,
  availableBrands,
  filters,
  onFilterChange,
  isOpen,
  onClose,
  totalProductsCount,
}) => {
  const handleCategorySelect = (catSlug: string) => {
    onFilterChange({
      ...filters,
      category: filters.category === catSlug ? undefined : catSlug,
    });
  };

  const handleBrandSelect = (brand: string) => {
    onFilterChange({
      ...filters,
      brand: filters.brand === brand ? undefined : brand,
    });
  };

  const handleInStockToggle = () => {
    onFilterChange({
      ...filters,
      inStock: !filters.inStock,
    });
  };

  const handleClear = () => {
    onFilterChange({
      sortBy: filters.sortBy || 'newest',
    });
  };

  const filterContent = (
    <div className="space-y-6">
      {/* Category Filter */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Categories
        </h4>
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {categories.length > 0 ? (
            categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.slug || cat.id)}
                className={`flex items-center justify-between w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filters.category === (cat.slug || cat.id)
                    ? 'bg-brand-primary text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No categories yet</p>
          )}
        </div>
      </div>

      {/* Brands Filter */}
      {availableBrands.length > 0 && (
        <div className="pt-4 border-t border-slate-200">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Brands
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {availableBrands.map((b) => (
              <button
                key={b}
                onClick={() => handleBrandSelect(b)}
                className={`flex items-center justify-between w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filters.brand === b
                    ? 'bg-brand-primary text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{b}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Range Filter */}
      <div className="pt-4 border-t border-slate-200">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Price Range (BDT)
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Min (৳)</label>
            <input
              type="number"
              placeholder="0"
              value={filters.minPrice !== undefined ? filters.minPrice : ''}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  minPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-primary"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Max (৳)</label>
            <input
              type="number"
              placeholder="100,000"
              value={filters.maxPrice !== undefined ? filters.maxPrice : ''}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  maxPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-primary"
            />
          </div>
        </div>
      </div>

      {/* Availability Filter */}
      <div className="pt-4 border-t border-slate-200">
        <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-medium text-slate-700 select-none">
          <input
            type="checkbox"
            checked={Boolean(filters.inStock)}
            onChange={handleInStockToggle}
            className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary border-slate-300"
          />
          <span>In Stock Only</span>
        </label>
      </div>

      {/* Reset Filters */}
      <div className="pt-4 border-t border-slate-200">
        <button
          onClick={handleClear}
          className="w-full py-2 px-3 text-xs font-semibold text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Filters</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (persistent) */}
      <div className="hidden lg:block w-64 bg-white p-5 rounded-2xl border border-brand-border h-fit sticky top-28">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <Filter className="w-4 h-4 text-brand-secondary" />
            <span>Filter Gadgets</span>
          </div>
          <span className="text-xs text-slate-400">{totalProductsCount} items</span>
        </div>
        {filterContent}
      </div>

      {/* Mobile Drawer / Bottom Sheet */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-6 overflow-y-auto z-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-base">
                  <Filter className="w-4 h-4 text-brand-secondary" />
                  <span>Filter Products</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {filterContent}
            </div>

            <div className="pt-6 border-t border-slate-200 mt-6">
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-brand-primary text-white text-sm font-semibold rounded-xl shadow-sm"
              >
                Apply & View ({totalProductsCount})
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
