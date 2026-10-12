export interface Coupon {
  id: string;
  code: string; // e.g. "GADGET10"
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountAmount: number; // e.g. 10 (%) or 500 (BDT)
  minOrderAmount?: number;
  maxDiscountAmount?: number; // max cap for percentage discounts
  expiryDate?: any;
  usageLimit?: number;
  usedCount: number;
  perCustomerLimit?: number;
  active: boolean;
  createdAt: any;
  updatedAt: any;
}
