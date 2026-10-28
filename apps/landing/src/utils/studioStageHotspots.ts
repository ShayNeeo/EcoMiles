export type DeviceBannerFocusId =
  | 'all_banner'
  | 'macbook_pro'
  | 'windows_xps'
  | 'galaxy_zfold'
  | 'ipad_pro'
  | 'iphone_duo'
  | 'iphone_18_pro_max'
  | 'galaxy_s26_ultra';

export interface StudioStageSpatialHotspot {
  id: Exclude<DeviceBannerFocusId, 'all_banner'>;
  label: string;
  roleHint: string;
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
  zIndexClass: string;
}

export const STUDIO_STAGE_SPATIAL_HOTSPOTS: readonly StudioStageSpatialHotspot[] = [
  {
    id: 'macbook_pro',
    label: '1. MacBook Pro 16"',
    roleHint: 'Trung Tâm B2B TMS (/dashboard)',
    leftPct: 11.5,
    topPct: 4.0,
    widthPct: 35.5,
    heightPct: 21.5,
    zIndexClass: 'z-10',
  },
  {
    id: 'windows_xps',
    label: '2. Windows 11 XPS 16',
    roleHint: 'Đối Chứng Kép EVSIM (/benchmark)',
    leftPct: 52.0,
    topPct: 4.0,
    widthPct: 35.5,
    heightPct: 21.5,
    zIndexClass: 'z-10',
  },
  {
    id: 'galaxy_zfold',
    label: '3. Galaxy Z Fold',
    roleHint: 'Bản Đồ Xe Tải Mở (/maps)',
    leftPct: 1.5,
    topPct: 24.5,
    widthPct: 18.2,
    heightPct: 55.5,
    zIndexClass: 'z-20',
  },
  {
    id: 'iphone_18_pro_max',
    label: '4. iPhone 18 Pro Max',
    roleHint: 'App Tài Xế Chặng Giữa (/driver)',
    leftPct: 22.8,
    topPct: 26.5,
    widthPct: 11.4,
    heightPct: 53.5,
    zIndexClass: 'z-20',
  },
  {
    id: 'iphone_duo',
    label: '5. iPhone Duo (Gập Đôi)',
    roleHint: 'Đa Nhiệm 2 Màn Hình (/driver)',
    leftPct: 38.4,
    topPct: 26.5,
    widthPct: 22.2,
    heightPct: 53.5,
    zIndexClass: 'z-20',
  },
  {
    id: 'galaxy_s26_ultra',
    label: '6. Galaxy S26 Ultra',
    roleHint: 'Dẫn Đường Waypoints ($0 API)',
    leftPct: 64.0,
    topPct: 26.5,
    widthPct: 11.4,
    heightPct: 53.5,
    zIndexClass: 'z-20',
  },
  {
    id: 'ipad_pro',
    label: '7. iPad Pro M4',
    roleHint: 'Taplo Kho Bãi & Bến Xuất (/dashboard)',
    leftPct: 79.4,
    topPct: 24.5,
    widthPct: 18.2,
    heightPct: 55.5,
    zIndexClass: 'z-20',
  },
] as const;
