export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type PaymentMethod = 'cod' | 'online';

export interface OrderItem {
  productId: string;
  name: string;
  slug: string;
  image: string;
  sku: string;
  variantId?: string;
  variantSummary?: string; // e.g. "Color: Black, Storage: 256GB"
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CustomerInfo {
  userId?: string;
  fullName: string;
  phone: string;
  email?: string;
  fullAddress: string;
  division: string;
  district: string;
  upazila?: string;
  deliveryNotes?: string;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: any;
  note?: string;
  updatedBy?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. UZ-241010-1234
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  deliveryZoneId?: string;
  deliveryZoneName?: string;
  deliveryCharge: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  statusHistory: OrderStatusHistoryItem[];
  internalNotes?: string;
  createdAt: any;
  updatedAt: any;
}
