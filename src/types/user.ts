export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
  photoURL?: string;
  role?: 'admin' | 'customer';
  addresses?: UserAddress[];
  defaultAddressId?: string;
  disabled?: boolean;
  totalOrders?: number;
  totalSpent?: number;
  createdAt: any;
  updatedAt: any;
}

export interface UserAddress {
  id: string;
  label: string; // e.g. "Home", "Office"
  fullName: string;
  phone: string;
  fullAddress: string;
  division: string;
  district: string;
  upazila?: string;
  isDefault?: boolean;
}
