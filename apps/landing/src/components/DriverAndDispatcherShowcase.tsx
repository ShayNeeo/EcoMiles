import React, { useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  ArrowUpRight,
  Check,
  Clock,
  Compass,
  LayoutDashboard,
  SplitSquareVertical,
  Truck,
} from 'lucide-react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

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
    shortLabel: '1. Bảng Điều Khiển Điều Phối',
    title: 'Tự Động Xếp Lịch Giao Hàng Né Khung Giờ Cấm Tải 06:00 - 09:00 & 16:00 - 20:00',
    roleBadge: 'DÀNH CHO ĐIỀU PHỐI VIÊN & QUẢN LÝ ĐỘI XE',
    timeWindowRule: 'Ưu tiên vành đai ngoài lúc 06:00 - 09:00, mở luồng vào nội đô từ 09:02 đến 15:50',
    areaFocus: 'Nội đô hạn chế (Quận 1, 3, 5, 10, Phú Nhuận, Bình Thạnh) & Vành đai (Tân Bình, Thủ Đức, Gò Vấp)',
    imageSrc: '/pitch-deck-screenshots/01_desktop_b2b_tms_fleet_overview.png',
    liveRouteUrl: '/dashboard/',
    liveRouteLabel: 'Mở Bảng Điều Khiển Đội Xe',
    description:
      'Khi tải file Excel đơn hàng lên, hệ thống tự động đối chiếu địa chỉ từng quận với khung giờ cấm xe tải nhẹ theo QĐ 23/2018/QĐ-UBND. Các đơn nằm trong vùng lõi nội đô có giờ hẹn sáng sớm được dời hợp pháp sang ngay sau 09:00 hoặc giao bằng xe tải nhỏ dưới 500kg.',
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
        area: 'Bình Tân → Kho Tân Bình',
        customerWindow: '15:30 - 18:00',
        restrictionNote: 'Rời nội đô trước giờ cấm chiều 16:00',
        plannedArrival: 'Thu hồi hàng về kho lúc 16:20',
      },
    ],
    highlights: [
      'Phát hiện tức thì 28 đơn hàng có khung giờ hẹn trùng với giờ cấm tải nội đô TP.HCM',
      'Tự động sắp thứ tự giao các điểm vành đai trước, vào lõi nội đô đúng khung mở 09:00 - 16:00',
      'Tối ưu tự động giao diện theo màn hình máy tính, máy tính bảng hoặc điện thoại đang dùng',
    ],
  },
  {
    id: 'benchmark',
    shortLabel: '2. Phòng Đối Chứng Lộ Trình',
    title: 'Kiểm Nghiệm Trực Quan Trước Và Sau Khi Tối Ưu Khung Giờ Cấm Tải',
    roleBadge: 'ĐỐI CHỨNG 2 BẢN ĐỒ CHẠY SONG SONG (06:00 - 20:00)',
    timeWindowRule: 'Mô phỏng trực tiếp đồng hồ ca vận hành từ 06:00 sáng đến 20:00 tối',
    areaFocus: 'So sánh trên cùng mạng lưới đường bộ thực tế tại TP.HCM',
    imageSrc: '/pitch-deck-screenshots/02_desktop_b2b_tms_evsim_dual_simulator.png',
    liveRouteUrl: '/benchmark/',
    liveRouteLabel: 'Mở Phòng Đối Chứng EVSIM',
    description:
      'Chạy song song hai phương án trên cùng một danh sách đơn hàng: bên trái là cách chia quận thủ công thường đi xuyên vào vùng cấm lúc 06:00 - 09:00, bên phải là thuật toán EcoMiles tự động điều tiết nhịp giao theo khung giờ mở.',
    samplePackages: [
      {
        orderCode: 'Chia thủ công (Baseline)',
        area: '12 chuyến xe rời rạc',
        customerWindow: '06:00 - 20:00',
        restrictionNote: '28 đơn đi xuyên vùng cấm giờ cao điểm',
        plannedArrival: '374.4 km · 32.8% chạy rỗng',
      },
      {
        orderCode: 'Thuật toán EcoMiles v2.1',
        area: '7 chuyến xe gom cụm',
        customerWindow: '06:00 - 20:00',
        restrictionNote: '0 vi phạm QĐ 23 · Ghép 21 đơn chiều về',
        plannedArrival: '243.7 km (-34.9%) · 2.7% chạy rỗng',
      },
    ],
    highlights: [
      'Bấm chọn nhanh các mốc giờ 07:30 (Cấm sáng), 09:05 (Mở nội đô) và 16:30 (Cấm chiều) để quan sát đường đi',
      'Cho phép tải lên file Excel đơn hàng thực tế của doanh nghiệp để kiểm chứng ngay trên trình duyệt',
      'Tính toán minh bạch số lít nhiên liệu, chi phí tiết kiệm và lượng phát thải CO₂ cắt giảm',
    ],
  },
  {
    id: 'driver_map',
    shortLabel: '3. Bản Đồ Xe Tải & App Tài Xế',
    title: 'Dẫn Đường Né Vùng Cấm Đỏ Và Hiển Thị Cửa Sổ Giao Hàng Từng Điểm Dừng',
    roleBadge: 'DÀNH CHO TÀI XẾ XE TẢI (>500KG) & XE VAN (<=500KG)',
    timeWindowRule: 'Cảnh báo trực tiếp vùng cấm theo giờ và giới hạn tải trọng cầu 13T / 4.5m',
    areaFocus: 'Hiển thị rõ từng khu vực quận, khung giờ khách hẹn và giờ xe đến hợp pháp',
    imageSrc: '/pitch-deck-screenshots/04_desktop_maps_overview_qd23_banned_zones.png',
    liveRouteUrl: '/maps/?vehicle=0&mode=navigate',
    liveRouteLabel: 'Mở Bản Đồ Xe Tải & Lộ Trình',
    description:
      'Tài xế mở trực tiếp trên điện thoại hoặc màn hình buồng lái mà không cần cài đặt phức tạp. Mỗi điểm dừng đều hiển thị rõ khu vực quận, khung giờ khách hẹn, giờ xe đến dự kiến (đã né giờ cấm) và nút cập nhật trạng thái giao hàng một chạm.',
    samplePackages: [
      {
        orderCode: 'Chặng #1 → Phú Nhuận',
        area: 'Nội đô hạn chế QĐ 23',
        customerWindow: '08:30 - 10:30',
        restrictionNote: 'Né đường cấm Phan Đăng Lưu trước 09:00',
        plannedArrival: 'Xe đến 09:12 · Đúng hẹn & hợp pháp',
      },
      {
        orderCode: 'Chặng #2 → Quận 1',
        area: 'Lõi trung tâm QĐ 23',
        customerWindow: '09:30 - 11:30',
        restrictionNote: 'Kiểm tra cầu Kiệu (Cho phép <= 13T)',
        plannedArrival: 'Xe đến 09:48 · Khung mở 09:00 - 16:00',
      },
    ],
    highlights: [
      'Hiển thị trực quan vùng cấm tải màu đỏ trên bản đồ kèm hướng dẫn giọng nói tiếng Việt miễn phí',
      'Xe tải (>500kg) dùng bản đồ xe tải chuyên dụng; xe van (<=500kg) mở nhanh Google Maps nhiều điểm dừng',
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
      className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-slate-900/95 border-t border-white/10 scroll-mt-16 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-ecomiles-lime/10 border border-ecomiles-lime/30 text-ecomiles-lime text-xs font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>Giải Quyết Giờ Cấm Tải QĐ 23/2018 · Khu Vực &amp; Cửa Sổ Giao Hàng</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-4xl">
            Giao Đúng Hẹn Khách Hàng Mà Không Vi Phạm <span className="text-ecomiles-lime">Giờ Cấm Tải Nội Đô</span>
          </h2>

          <p className="max-w-2xl text-sm sm:text-base text-slate-300 leading-relaxed">
            Giao diện tự động tối ưu theo màn hình máy tính của điều phối viên và điện thoại của tài xế, tập trung hiển thị rõ vùng hạn chế, khung giờ khách hẹn và giờ xe đến hợp pháp.
          </p>

          {/* Visual 06:00 - 20:00 HCMC Truck Ban Schedule Strip */}
          <div className="w-full max-w-4xl pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 rounded-2xl overflow-hidden border border-white/15 text-xs">
              <div className="bg-rose-950/70 border-b sm:border-b-0 sm:border-r border-white/10 px-4 py-3 text-left">
                <div className="font-extrabold text-rose-300 uppercase">06:00 - 09:00 · Cấm Tải Sáng</div>
                <div className="text-slate-200 mt-0.5">
                  Xe tải ưu tiên giao vành đai ngoài (Tân Bình, Gò Vấp, Thủ Đức), đợi mở luồng nội đô.
                </div>
              </div>
              <div className="bg-emerald-950/75 border-b sm:border-b-0 sm:border-r border-white/10 px-4 py-3 text-left">
                <div className="font-extrabold text-ecomiles-lime uppercase">09:00 - 16:00 · Khung Mở Nội Đô</div>
                <div className="text-slate-200 mt-0.5">
                  Tập trung giao dứt điểm các đơn vùng lõi (Quận 1, 3, 5, 10, Phú Nhuận, Bình Thạnh).
                </div>
              </div>
              <div className="bg-rose-950/70 px-4 py-3 text-left">
                <div className="font-extrabold text-rose-300 uppercase">16:00 - 20:00 · Cấm Tải Chiều</div>
                <div className="text-slate-200 mt-0.5">
                  Rời nội đô trước 15:50 và kết hợp thu hồi đơn hàng chiều về kho Tân Bình.
                </div>
              </div>
            </div>
          </div>

          {/* 3 Focused Role Workspace Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-slate-950/90 border border-white/10">
            {WORKSPACE_VIEWS.map((view) => {
              const isActive = view.id === selectedId;
              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => setSelectedId(view.id)}
                  aria-pressed={isActive}
                  className={`relative px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center gap-2 cursor-pointer ${
                    isActive ? 'text-slate-950' : 'text-slate-200 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeWorkspaceTabPill"
                      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                      className="absolute inset-0 rounded-xl bg-ecomiles-lime shadow-sm"
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
        <div className="rounded-3xl bg-slate-950/90 border border-white/10 p-5 sm:p-8 shadow-2xl shadow-black/60">
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
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900/80 p-2 sm:p-3">
                  <img
                    src={activeView.imageSrc}
                    alt={activeView.title}
                    className="w-full h-auto max-h-[340px] object-contain mx-auto rounded-xl"
                  />
                </div>

                {/* Compact Time-Window & Restricted Area Resolution Table */}
                <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-extrabold text-ecomiles-lime uppercase tracking-wider">
                      Ví Dụ Xử Lý Khu Vực Cấm Tải &amp; Khung Giờ Giao Hàng:
                    </span>
                    <span className="text-slate-300 font-semibold">{activeView.timeWindowRule}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs tabular-nums">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-300">
                          <th className="py-2 pr-3">Đơn / Chặng</th>
                          <th className="py-2 pr-3">Khu vực</th>
                          <th className="py-2 pr-3">Khung giờ hẹn</th>
                          <th className="py-2 pr-3">Ràng buộc giờ cấm</th>
                          <th className="py-2">Lịch xe đến tối ưu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-200">
                        {activeView.samplePackages.map((pkg) => (
                          <tr key={pkg.orderCode}>
                            <td className="py-2 pr-3 font-mono font-bold text-white">{pkg.orderCode}</td>
                            <td className="py-2 pr-3">{pkg.area}</td>
                            <td className="py-2 pr-3 font-mono">{pkg.customerWindow}</td>
                            <td className="py-2 pr-3 text-amber-300">{pkg.restrictionNote}</td>
                            <td className="py-2 font-bold text-emerald-400">{pkg.plannedArrival}</td>
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
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-ecomiles-lime">
                    <Truck className="w-3.5 h-3.5" />
                    <span>{activeView.roleBadge}</span>
                  </span>

                  <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
                    {activeView.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activeView.description}
                  </p>
                </div>

                <div className="space-y-2.5 border-y border-white/10 py-4">
                  {activeView.highlights.map((hl, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-100">
                      <Check className="w-4 h-4 text-ecomiles-lime shrink-0 mt-0.5" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <a
                    href={activeView.liveRouteUrl}
                    className="flex-1 py-3 px-4 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-black/40 transition-colors"
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
