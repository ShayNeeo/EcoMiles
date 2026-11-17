import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Compass, LayoutDashboard, SplitSquareVertical } from 'lucide-react';
import { HanoiRingIcon, Qd23WindowIcon, VanExemptIcon } from './EcoMilesMark';

type WorkspaceViewId = 'dispatcher' | 'benchmark' | 'driver_map';

interface WorkspaceSpec {
  id: WorkspaceViewId;
  shortLabel: string;
  title: string;
  roleBadge: string;
  timeWindowRule: string;
  imageSrc: string;
  liveRouteUrl: string;
  liveRouteLabel: string;
  samplePackages: {
    orderCode: string;
    area: string;
    customerWindow: string;
    restrictionNote: string;
    plannedArrival: string;
  }[];
  chips: string[];
}

const WORKSPACE_VIEWS: WorkspaceSpec[] = [
  {
    id: 'dispatcher',
    shortLabel: '1. Điều phối viên',
    title: 'Xếp lịch né giờ cấm QĐ 23 · QCVN 41 · QĐ 01',
    roleBadge: 'Điều phối & Quản lý đội xe',
    timeWindowRule: 'Vành đai 06-09h · Lõi nội đô 09:02-15:50',
    imageSrc: '/pitch-deck-screenshots/01_desktop_b2b_tms_fleet_overview.png',
    liveRouteUrl: '/dashboard/',
    liveRouteLabel: 'Mở Bảng Điều Khiển',
    samplePackages: [
      {
        orderCode: 'BEV-25T-105',
        area: 'Quận 3 (Vành đai cấm)',
        customerWindow: '07:30-10:00',
        restrictionNote: 'Cấm tải ≤2,5T 06-09h',
        plannedArrival: '09:08 (Hợp lệ)',
      },
      {
        orderCode: 'VAN-945-044',
        area: 'Quận 1 (<950kg)',
        customerWindow: '07:00-09:00',
        restrictionNote: 'Miễn cấm giờ (24/24h)',
        plannedArrival: '07:35 (Giao ngay)',
      },
      {
        orderCode: 'BH-TB-19',
        area: 'Bình Tân → Kho Q12',
        customerWindow: '15:30-18:00',
        restrictionNote: 'Rời lõi trước 16:00',
        plannedArrival: '16:18 (Ghép về)',
      },
    ],
    chips: ['Bắt 235 ca xung đột QĐ 23', 'Xóa 73 ca quá tải 2,5T', 'Đồng bộ app tài xế'],
  },
  {
    id: 'benchmark',
    shortLabel: '2. Đối chứng EVSIM',
    title: 'So sánh trực tiếp trước và sau khi tối ưu',
    roleBadge: '2 Bản đồ OSRM song song',
    timeWindowRule: 'Cùng 642 ma trận đường bộ thật',
    imageSrc: '/pitch-deck-screenshots/02_desktop_b2b_tms_evsim_dual_simulator.png',
    liveRouteUrl: '/benchmark/',
    liveRouteLabel: 'Mở Phòng Đối Chứng',
    samplePackages: [
      {
        orderCode: 'Đồ uống 2,5T',
        area: '500 đơn / 88 ngày',
        customerWindow: 'Google Maps tay',
        restrictionNote: '14.178 km · 235 lỗi QĐ 23',
        plannedArrival: '9.857 km (−30,5% · 0 lỗi)',
      },
      {
        orderCode: 'Tạp hóa 91 shop',
        area: '2.395 đơn / 393 ngày',
        customerWindow: 'Van <950 kg',
        restrictionNote: '46.376 km đơn lẻ',
        plannedArrival: '29.508 km (−36,4%)',
      },
    ],
    chips: ['Tải Excel đối chứng ngay', '0 fallback đường chim bay', 'Minh bạch lít dầu & CO₂e'],
  },
  {
    id: 'driver_map',
    shortLabel: '3. App Tài xế & Bản đồ',
    title: 'Cảnh báo vùng cấm đỏ & biển P.106a/b theo xe',
    roleBadge: 'Tài xế xe tải & Xe van ($0 API)',
    timeWindowRule: 'Cảnh báo cầu 13T · Khung giờ cấm 4-6M NĐ 168',
    imageSrc: '/pitch-deck-screenshots/04_desktop_maps_overview_qd23_banned_zones.png',
    liveRouteUrl: '/driver/',
    liveRouteLabel: 'Mở Ứng Dụng Tài Xế',
    samplePackages: [
      {
        orderCode: '51C-25T.01',
        area: 'Tân Bình (Vành đai)',
        customerWindow: '06:30-08:30',
        restrictionNote: 'Hành lang mở',
        plannedArrival: '07:15 (Đúng ca)',
      },
      {
        orderCode: '51C-25T.02',
        area: 'Lõi TP.HCM QĐ 23',
        customerWindow: '09:30-11:30',
        restrictionNote: 'Tránh cầu ≤13T',
        plannedArrival: '09:48 (Khung 09-16h)',
      },
    ],
    chips: ['Giọng nói tiếng Việt', 'Khóa giới hạn 4h lái', 'Báo điểm ghép chiều về'],
  },
];

export const DriverAndDispatcherShowcase: React.FC = () => {
  const [selectedId, setSelectedId] = useState<WorkspaceViewId>('dispatcher');
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handler = (ev: Event) => {
      const custom = ev as CustomEvent<{ tab?: WorkspaceViewId }>;
      if (custom.detail?.tab) setSelectedId(custom.detail.tab);
    };
    window.addEventListener('ecomiles:select-device', handler as EventListener);
    return () => window.removeEventListener('ecomiles:select-device', handler as EventListener);
  }, []);

  const activeView = WORKSPACE_VIEWS.find((v) => v.id === selectedId) ?? WORKSPACE_VIEWS[0];

  const renderTabIcon = (id: WorkspaceViewId) => {
    if (id === 'dispatcher') return <LayoutDashboard className="w-4 h-4" />;
    if (id === 'benchmark') return <SplitSquareVertical className="w-4 h-4" />;
    return <Compass className="w-4 h-4" />;
  };

  return (
    <section
      id="showcase"
      ref={sectionRef}
      className="relative py-20 sm:py-24 px-4 sm:px-6 lg:px-8 em-grid-cosmos text-[#FDF0D5] border-b-4 border-[#003049] scroll-mt-20 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#669BBC]/30 pb-6">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#FDF0D5] tracking-tight leading-tight max-w-3xl">
            Ma trận giờ cấm tải &amp; 3 màn hình tác nghiệp
          </h2>
          <span className="inline-flex items-center gap-2 rounded-md bg-[#FEF3C7] border border-[#F59E0B] px-3 py-1.5 font-mono text-xs font-extrabold text-[#B45309] shrink-0">
            <Qd23WindowIcon className="w-4 h-4" />
            <span>NĐ 168/2024: TRÁNH PHẠT 4-6 TRIỆU ĐỒNG</span>
          </span>
        </div>

        {/* Visual 24h Traffic-Light Statutory Matrix Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-xl overflow-hidden border-2 border-[#FDF0D5]/80 text-xs shadow-xl">
          <div className="bg-[#B91C1C] p-4 text-[#FDF0D5] border-b lg:border-b-0 sm:border-r border-[#FDF0D5]/25">
            <div className="font-mono font-extrabold uppercase">06:00-09:00 · CẤM SÁNG</div>
            <div className="font-bold mt-1">Xe ≥950 kg-2,5T giao vành đai ngoài</div>
          </div>
          <div className="bg-[#166534] p-4 text-[#FDF0D5] border-b lg:border-b-0 lg:border-r border-[#FDF0D5]/25">
            <div className="font-mono font-extrabold uppercase">09:00-16:00 · MỞ LÕI</div>
            <div className="font-bold mt-1">Đẩy toàn bộ đơn Quận 1, 3, 5, 10</div>
          </div>
          <div className="bg-[#669BBC] p-4 text-[#003049] border-b sm:border-b-0 sm:border-r border-[#003049]/25">
            <div className="font-mono font-extrabold uppercase flex items-center gap-1.5 text-[#003049]">
              <VanExemptIcon className="w-4 h-4" />
              <span>VAN &lt;950 KG · 24/24</span>
            </div>
            <div className="font-bold mt-1">Chạy nội đô TP.HCM trừ tuyến biển P.106</div>
          </div>
          <div className="bg-[#FEF3C7] p-4 text-[#003049]">
            <div className="font-mono font-extrabold uppercase flex items-center gap-1.5 text-[#B45309]">
              <HanoiRingIcon className="w-4 h-4" />
              <span>CẢNH BÁO HN · QĐ 01/2026</span>
            </div>
            <div className="font-bold mt-1">Kiểm tổng tải ≥2T Vành đai 3 (06-21h)</div>
          </div>
        </div>

        {/* 3 Role Workspace Switcher Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 p-2 rounded-xl bg-[#002033] border border-[#669BBC]/40 w-fit mx-auto">
          {WORKSPACE_VIEWS.map((view) => {
            const isActive = view.id === selectedId;
            return (
              <button
                key={view.id}
                type="button"
                onClick={() => setSelectedId(view.id)}
                aria-pressed={isActive}
                className={`relative px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors flex items-center gap-2 cursor-pointer ${
                  isActive ? 'text-[#003049]' : 'text-[#FDF0D5] hover:text-[#669BBC]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeWorkspaceTabPill"
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                    className="absolute inset-0 rounded-lg bg-[#FDF0D5]"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {renderTabIcon(view.id)}
                  <span>{view.shortLabel}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Workspace Showcase */}
        <div className="rounded-2xl bg-[#FDF0D5] text-[#003049] border-2 border-[#003049] p-5 sm:p-8 shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              <div className="lg:col-span-7 space-y-4">
                <div className="rounded-xl overflow-hidden border-2 border-[#003049] bg-[#002033] p-2">
                  <img
                    src={activeView.imageSrc}
                    alt={activeView.title}
                    className="w-full h-auto max-h-[320px] object-contain mx-auto rounded-lg"
                  />
                </div>

                <div className="rounded-xl bg-[#003049] text-[#FDF0D5] p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] font-bold">
                    <span className="text-[#669BBC] uppercase">LỆNH ĐIỀU PHỐI MẪU</span>
                    <span>{activeView.timeWindowRule}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs tabular-nums">
                      <thead>
                        <tr className="border-b border-[#669BBC]/30 text-[#669BBC] font-mono">
                          <th className="py-1.5 pr-3">Mã / Nhóm</th>
                          <th className="py-1.5 pr-3">Khu vực</th>
                          <th className="py-1.5 pr-3">Ràng buộc</th>
                          <th className="py-1.5">Kết quả</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#669BBC]/20">
                        {activeView.samplePackages.map((pkg) => (
                          <tr key={pkg.orderCode}>
                            <td className="py-2 pr-3 font-mono font-bold text-[#FDF0D5]">{pkg.orderCode}</td>
                            <td className="py-2 pr-3">{pkg.area}</td>
                            <td className="py-2 pr-3 text-[#FBBF24] font-semibold">{pkg.restrictionNote}</td>
                            <td className="py-2 font-extrabold text-[#4ADE80]">{pkg.plannedArrival}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-[#FDF0D5] bg-[#C1121F] px-3 py-1 rounded">
                    {activeView.roleBadge}
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-black text-[#003049] leading-tight">
                    {activeView.title}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {activeView.chips.map((hl) => (
                    <span
                      key={hl}
                      className="px-3 py-1.5 rounded-md bg-[#F8E7C4] border border-[#003049] text-xs font-bold text-[#003049]"
                    >
                      {hl}
                    </span>
                  ))}
                </div>

                <a
                  href={activeView.liveRouteUrl}
                  className="w-full py-3.5 px-5 rounded-lg bg-[#003049] hover:bg-[#C1121F] text-[#FDF0D5] font-extrabold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <span>{activeView.liveRouteLabel}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
