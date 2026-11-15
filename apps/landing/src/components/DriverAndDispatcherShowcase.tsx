import React, { useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ArrowUpRight,
  Check,
  Compass,
  LayoutDashboard,
  SplitSquareVertical,
  Truck,
} from 'lucide-react';

type WorkspaceViewId = 'dispatcher' | 'benchmark' | 'driver_map';

interface WorkspaceSpec {
  id: WorkspaceViewId;
  shortLabel: string;
  title: string;
  roleBadge: string;
  timeWindowRule: string;
  areaFocus: string;
  imageSrc: string;
  liveRouteUrl: string;
  liveRouteLabel: string;
  description: string;
  samplePackages: {
    orderCode: string;
    area: string;
    customerWindow: string;
    restrictionNote: string;
    plannedArrival: string;
  }[];
  highlights: string[];
}

const WORKSPACE_VIEWS: WorkspaceSpec[] = [
  {
    id: 'dispatcher',
    shortLabel: '1. Điều phối viên',
    title: 'Xếp lịch giao hàng né khung giờ cấm tải 06:00 - 09:00 & 16:00 - 20:00',
    roleBadge: 'Dành cho điều phối viên & Quản lý đội xe',
    timeWindowRule: 'Ưu tiên vành đai lúc 06:00 - 09:00, mở luồng nội đô từ 09:02 đến 15:50',
    areaFocus: 'Nội đô hạn chế (Quận 1, 3, 5, 10, Phú Nhuận) & Vành đai (Tân Bình, Thủ Đức, Gò Vấp)',
    imageSrc: '/pitch-deck-screenshots/01_desktop_b2b_tms_fleet_overview.png',
    liveRouteUrl: '/dashboard/',
    liveRouteLabel: 'Mở Bảng Điều Khiển Đội Xe',
    description:
      'Khi nhập file Excel đơn hàng, hệ thống tự động đối chiếu địa chỉ từng quận với khung giờ cấm tải theo QĐ 23/2018/QĐ-UBND. Các đơn nội đô giờ hẹn sáng sớm được dời hợp pháp sang sau 09:00.',
    samplePackages: [
      {
        orderCode: 'COLD-2026-0105',
        area: 'Quận 3 (Vùng cấm 06-09h)',
        customerWindow: '07:30 - 10:00',
        restrictionNote: 'Vướng giờ cấm sáng nếu đi lúc 07:30',
        plannedArrival: 'Giao lúc 09:08 (Hợp lệ 100%)',
      },
      {
        orderCode: 'COLD-2026-0044',
        area: 'Gò Vấp (Hành lang mở)',
        customerWindow: '07:00 - 09:00',
        restrictionNote: 'Tuyến ngoài vùng cấm nội đô',
        plannedArrival: 'Giao lúc 07:35 (Tận dụng đầu ca)',
      },
      {
        orderCode: 'BACKHAUL-TB-19',
        area: 'Bình Tân -> Kho Tân Bình',
        customerWindow: '15:30 - 18:00',
        restrictionNote: 'Rời nội đô trước giờ cấm chiều 16:00',
        plannedArrival: 'Thu hồi hàng về kho lúc 16:20',
      },
    ],
    highlights: [
      'Phát hiện tức thì 28 đơn hàng trùng khung giờ cấm tải nội đô TP.HCM',
      'Tự động sắp xếp giao điểm vành đai trước, vào lõi nội đô từ 09:00 đến 16:00',
      'Đồng bộ tức thì lộ trình xuống ứng dụng di động của từng tài xế',
    ],
  },
  {
    id: 'benchmark',
    shortLabel: '2. Đối chứng lộ trình',
    title: 'Kiểm nghiệm trước và sau khi tối ưu khung giờ cấm tải',
    roleBadge: 'Đối chứng 2 bản đồ chạy song song',
    timeWindowRule: 'Mô phỏng ca vận hành từ 06:00 sáng đến 20:00 tối',
    areaFocus: 'So sánh trên cùng mạng lưới đường bộ thực tế tại TP.HCM',
    imageSrc: '/pitch-deck-screenshots/02_desktop_b2b_tms_evsim_dual_simulator.png',
    liveRouteUrl: '/benchmark/',
    liveRouteLabel: 'Mở Phòng Đối Chứng EVSIM',
    description:
      'Chạy song song 2 phương án: bên trái chia quận thủ công thường đi vào vùng cấm giờ cao điểm; bên phải thuật toán EcoMiles tự động điều tiết nhịp giao theo khung giờ mở hợp pháp.',
    samplePackages: [
      {
        orderCode: 'Chia thủ công (Baseline)',
        area: '12 chuyến xe rời rạc',
        customerWindow: '06:00 - 20:00',
        restrictionNote: '28 đơn vi phạm giờ cao điểm',
        plannedArrival: '374,4 km · 32,8% chạy rỗng',
      },
      {
        orderCode: 'EcoMiles v2.1',
        area: '7 chuyến xe gom cụm',
        customerWindow: '06:00 - 20:00',
        restrictionNote: '0 vi phạm QĐ 23 · Ghép 21 đơn chiều về',
        plannedArrival: '243,7 km (-34,9%) · 2,7% rỗng',
      },
    ],
    highlights: [
      'Bấm chọn nhanh các mốc giờ 07:30 (Cấm sáng), 09:05 (Mở nội đô), 16:30 (Cấm chiều)',
      'Tải lên file Excel đơn hàng thực tế của doanh nghiệp để kiểm chứng tức thì',
      'Tính toán minh bạch lượng dầu tiết kiệm và lượng phát thải CO₂ cắt giảm',
    ],
  },
  {
    id: 'driver_map',
    shortLabel: '3. Bản đồ xe tải & App tài xế',
    title: 'Dẫn đường né vùng cấm đỏ và hiển thị cửa sổ giao hàng',
    roleBadge: 'Dành cho tài xế xe tải (>500kg) & xe van',
    timeWindowRule: 'Cảnh báo trực tiếp vùng cấm theo giờ và giới hạn tải trọng cầu 13T / 4.5m',
    areaFocus: 'Hiển thị rõ từng khu vực quận, khung giờ khách hẹn và giờ xe đến',
    imageSrc: '/pitch-deck-screenshots/04_desktop_maps_overview_qd23_banned_zones.png',
    liveRouteUrl: '/driver/',
    liveRouteLabel: 'Mở Ứng Dụng Tài Xế',
    description:
      'Tài xế xem toàn bộ danh sách điểm giao trong ca, có cảnh báo trực quan đường cấm và cây cầu giới hạn tải trọng. Hướng dẫn giọng nói tiếng Việt giúp lái xe an toàn.',
    samplePackages: [
      {
        orderCode: 'NV-TRUCK-01',
        area: 'Vành đai Tân Bình',
        customerWindow: '06:30 - 08:30',
        restrictionNote: 'Hành lang thông thoáng',
        plannedArrival: 'Đến điểm giao lúc 07:15',
      },
      {
        orderCode: 'NV-TRUCK-02',
        area: 'Lõi trung tâm QĐ 23',
        customerWindow: '09:30 - 11:30',
        restrictionNote: 'Kiểm tra cầu Kiệu (<= 13T)',
        plannedArrival: 'Đến 09:48 · Khung mở 09:00 - 16:00',
      },
    ],
    highlights: [
      'Hiển thị trực quan vùng cấm tải màu đỏ trên bản đồ kèm giọng nói tiếng Việt',
      'Xe tải (>500kg) dùng bản đồ chuyên dụng; xe van mở nhanh Google Maps Waypoints',
      'Tự động thông báo các điểm lấy hàng chiều về kho giúp giảm xe chạy rỗng',
    ],
  },
];

export const DriverAndDispatcherShowcase: React.FC = () => {
  const [selectedId, setSelectedId] = useState<WorkspaceViewId>('dispatcher');
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);

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
      className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#F6F1E7] border-t border-slate-200/80 scroll-mt-16 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#101418] tracking-tight leading-tight max-w-4xl">
            Giao đúng hẹn mà không vi phạm giờ cấm tải nội đô TP.HCM
          </h2>

          <p className="max-w-2xl text-base text-[#5B5F66] leading-relaxed">
            Bản đồ xe tải tự động hiển thị vùng cấm tải QĐ 23/2018 màu đỏ, khung giờ khách hẹn và giờ xe đến hợp pháp.
          </p>

          {/* Visual 06:00 - 20:00 HCMC Truck Ban Schedule Strip */}
          <div className="w-full max-w-4xl pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 rounded-2xl overflow-hidden border border-slate-200 text-xs shadow-sm">
              <div className="bg-rose-50/80 border-b sm:border-b-0 sm:border-r border-slate-200 px-4 py-3 text-left">
                <div className="font-extrabold text-rose-800 uppercase">06:00 - 09:00 · Cấm tải sáng</div>
                <div className="text-slate-600 mt-0.5">
                  Xe tải ưu tiên giao vành đai ngoài (Tân Bình, Gò Vấp, Thủ Đức), chờ mở luồng nội đô.
                </div>
              </div>
              <div className="bg-emerald-50/80 border-b sm:border-b-0 sm:border-r border-slate-200 px-4 py-3 text-left">
                <div className="font-extrabold text-[#101418] uppercase">09:00 - 16:00 · Khung mở nội đô</div>
                <div className="text-slate-600 mt-0.5">
                  Tập trung giao dứt điểm các đơn vùng lõi (Quận 1, 3, 5, 10, Phú Nhuận, Bình Thạnh).
                </div>
              </div>
              <div className="bg-rose-50/80 px-4 py-3 text-left">
                <div className="font-extrabold text-rose-800 uppercase">16:00 - 20:00 · Cấm tải chiều</div>
                <div className="text-slate-600 mt-0.5">
                  Rời nội đô trước 15:50 và kết hợp thu hồi đơn hàng chiều về kho Tân Bình.
                </div>
              </div>
            </div>
          </div>

          {/* 3 Focused Role Workspace Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            {WORKSPACE_VIEWS.map((view) => {
              const isActive = view.id === selectedId;
              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => setSelectedId(view.id)}
                  aria-pressed={isActive}
                  className={`relative px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center gap-2 cursor-pointer ${
                    isActive ? 'text-white' : 'text-[#5B5F66] hover:text-[#101418]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeWorkspaceTabPill"
                      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                      className="absolute inset-0 rounded-xl bg-[#101418] shadow-sm"
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
        </div>

        {/* Main Workspace Preview & Time-Window Resolution Panel */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-8 shadow-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Left 7 Cols: Clean Screenshot + Sample Time-Window Conflict Table */}
              <div className="lg:col-span-7 space-y-4">
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2 sm:p-3">
                  <img
                    src={activeView.imageSrc}
                    alt={activeView.title}
                    className="w-full h-auto max-h-[340px] object-contain mx-auto rounded-lg"
                  />
                </div>

                {/* Compact Time-Window & Restricted Area Resolution Table */}
                <div className="rounded-xl bg-[#F6F1E7] border border-slate-200 p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[#101418] uppercase tracking-wider">
                      Ví dụ xử lý khung giờ &amp; vùng cấm tải:
                    </span>
                    <span className="text-slate-600 font-medium">{activeView.timeWindowRule}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs tabular-nums">
                      <thead>
                        <tr className="border-b border-slate-200 text-[#101418] font-semibold">
                          <th className="py-2 pr-3">Đơn / Chặng</th>
                          <th className="py-2 pr-3">Khu vực</th>
                          <th className="py-2 pr-3">Khung giờ hẹn</th>
                          <th className="py-2 pr-3">Ràng buộc</th>
                          <th className="py-2 text-[#101418]">Lịch xe đến</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 text-[#334155]">
                        {activeView.samplePackages.map((pkg) => (
                          <tr key={pkg.orderCode}>
                            <td className="py-2 pr-3 font-mono font-bold text-[#101418]">{pkg.orderCode}</td>
                            <td className="py-2 pr-3">{pkg.area}</td>
                            <td className="py-2 pr-3 font-mono">{pkg.customerWindow}</td>
                            <td className="py-2 pr-3 text-amber-700 font-medium">{pkg.restrictionNote}</td>
                            <td className="py-2 font-bold text-[#101418]">{pkg.plannedArrival}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right 5 Cols: Role Context, Highlights & Direct Launch Button */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#101418] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <Truck className="w-3.5 h-3.5 text-[#101418]" />
                    <span>{activeView.roleBadge}</span>
                  </span>

                  <h3 className="text-xl sm:text-2xl font-bold text-[#101418] leading-snug">
                    {activeView.title}
                  </h3>

                  <p className="text-sm text-[#5B5F66] leading-relaxed">
                    {activeView.description}
                  </p>
                </div>

                <div className="space-y-2 border-y border-slate-200 py-4">
                  {activeView.highlights.map((hl, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#334155]">
                      <Check className="w-4 h-4 text-[#0B7A3B] shrink-0 mt-0.5" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <a
                    href={activeView.liveRouteUrl}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#101418] hover:bg-[#1B45D7] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <span>{activeView.liveRouteLabel}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
