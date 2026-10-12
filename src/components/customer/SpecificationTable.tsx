import React from 'react';
import { ProductSpecification } from '../../types/product';

interface SpecificationTableProps {
  specifications: ProductSpecification[];
}

export const SpecificationTable: React.FC<SpecificationTableProps> = ({ specifications }) => {
  if (!specifications || specifications.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-400 italic">
        No technical specifications listed for this product.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-subtle">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <tbody className="divide-y divide-slate-100">
          {specifications.map((spec, index) => (
            <tr
              key={index}
              className={index % 2 === 0 ? 'bg-slate-50/60' : 'bg-white hover:bg-slate-50/30'}
            >
              <td className="w-1/3 py-3.5 px-4 font-medium text-slate-700 border-r border-slate-100">
                {spec.key}
              </td>
              <td className="w-2/3 py-3.5 px-4 text-slate-900 font-semibold">
                {spec.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
