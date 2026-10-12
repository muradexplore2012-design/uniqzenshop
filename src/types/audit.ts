export interface AuditLog {
  id: string;
  adminUid: string;
  adminEmail?: string;
  action: string; // e.g. "product.create", "order.status_update", "settings.update"
  targetType: string; // "product", "order", "category", "coupon", "settings"
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  timestamp: any;
}
