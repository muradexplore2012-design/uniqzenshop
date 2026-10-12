export type BannerPosition = 'hero' | 'side_top' | 'side_bottom';

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  tagline?: string;
  image: string;
  mobileImage?: string;
  buttonText?: string;
  buttonLink?: string;
  active: boolean;
  sortOrder: number;
  position?: BannerPosition;
  isFullGraphic?: boolean;
  startDate?: any;
  endDate?: any;
  createdAt: any;
  updatedAt: any;
}
