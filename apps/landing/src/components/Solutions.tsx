import React, { useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowUpRight, BarChart3, CheckCircle2, Clock, RefreshCw, Route } from 'lucide-react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export const Solutions: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useGSAP(
    () => {
      if (shouldReduceMotion || !sectionRef.current) return;

      gsap.fromTo(
        '.gsap-solution-card',
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );
    },
    { scope: sectionRef, dependencies: [shouldReduceMotion] }
  );

  const solutions = [
    {
      id: '01',
      icon: <Route className="w-5 h-5 text-[#14532D]" />,
      badge: 'Tối ưu tuyến đa ràng buộc',
      title: 'Phân cụm & Khử đoạn chạy chồng chéo',
      description:
        'Nhập file Excel đơn hàng: thuật toán tự động khớp tải trọng xe và gom cụm theo quận trên mạng lưới đường thật TP.HCM.',
      screenshot: '/pitch-deck-screenshots/01_desktop_b2b_tms_fleet_overview.png',
      alt: 'Giao diện phân cụm lộ trình EcoMiles',
      metrics: [
        'Cắt giảm 34,9% tổng quãng đường (374,4 km xuống 243,7 km)',
        'Huy động 7/10 xe phục vụ toàn bộ 120 đơn hàng',
        'Thời gian tính toán lộ trình dưới 1 giây',
      ],
      liveHref: '/dashboard/',
      liveLabel: 'Mở Bảng Điều Khiển Đội Xe',
    },
    {
      id: '02',
      icon: <Clock className="w-5 h-5 text-[#14532D]" />,
      badge: 'Tuân thủ QĐ 23/2018 & Cầu 13T',
      title: 'Tự động né khung giờ cấm tải nội đô',
      description:
        'Tích hợp giờ cấm tải 06:00 - 09:00 & 16:00 - 20:00: tự động dời lịch hợp pháp hoặc định tuyến vòng qua hành lang mở.',
      screenshot: '/pitch-deck-screenshots/04_desktop_maps_overview_qd23_banned_zones.png',
      alt: 'Bản đồ vùng cấm tải QĐ 23 TP.HCM',
      metrics: [
        '0 vi phạm giờ cấm (so với 28 lỗi khi chia thủ công)',
        'Cảnh báo trực quan vùng cấm đỏ và cầu giới hạn tải trọng',
        'Bản đồ dẫn đường tiếng Việt không tốn phí bản quyền API',
      ],
      liveHref: '/maps/?vehicle=0&mode=navigate',
      liveLabel: 'Mở Bản Đồ Vùng Cấm QĐ 23',
    },
    {
      id: '03',
      icon: <RefreshCw className="w-5 h-5 text-[#14532D]" />,
      badge: 'Ghép đơn chiều về (Backhaul)',
      title: 'Biến chuyến xe quay về rỗng thành doanh thu',
      description:
        'Khi hoàn tất điểm giao cuối, hệ thống quét và ghép các đơn thu hồi hàng hoàn hoặc luân chuyển nội bộ dọc đường về kho.',
      screenshot: '/pitch-deck-screenshots/06_desktop_driver_2tier_middle_and_last_mile.png',
      alt: 'Ứng dụng tài xế hiển thị đơn hàng chiều về',
      metrics: [
        'Giảm tỷ lệ chạy rỗng từ 32,8% xuống chỉ còn 2,7%',
        'Tự động ghép 21 đơn chiều về, thu hồi 2.074,7 kg hàng',
        'Tài xế nhận lệnh lấy hàng ngay trên ứng dụng điện thoại',
      ],
      liveHref: '/driver/',
      liveLabel: 'Mở Ứng Dụng Tài Xế',
    },
    {
      id: '04',
      icon: <BarChart3 className="w-5 h-5 text-[#14532D]" />,
      badge: 'Kiểm toán ISO 14083 / GLEC v3.2',
      title: 'Đo lường phát thải động & Xuất báo cáo ESG',
      description:
        'Ước tính tiêu hao nhiên liệu theo tải trọng thực sau từng điểm dỡ hàng (mô hình GLX-HDT-v1 tham chiếu GLEC v3.2).',
      screenshot: '/pitch-deck-screenshots/02_desktop_b2b_tms_evsim_dual_simulator.png',
      alt: 'Mô phỏng đối chứng phát thải và nhiên liệu',
      metrics: [
        'Cắt giảm 32,2% CO₂e TTW (từ 83,57 kg xuống 56,66 kg CO₂e)',
        'Xuất tự động file Excel 3 Sheet, CSV và PDF đối soát',
        'Mã hóa dữ liệu độc lập theo Nghị định 13/2023/NĐ-CP',
      ],
      liveHref: '/benchmark/',
      liveLabel: 'Mở Phòng Đối Chứng EVSIM',
    },
  ];

  return (
    <section
      id="solutions"
      ref={sectionRef}
      className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200/80 scroll-mt-24"
    >
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
            4 trụ cột công nghệ tối ưu hóa vận tải B2B
          </h2>
          <p className="mt-4 text-base text-[#475569] leading-relaxed">
            Thay thế việc chia tuyến thủ công bằng thuật toán đa ràng buộc, bản đồ né giờ cấm tải TP.HCM và báo cáo phát thải tự động.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {solutions.map((item) => (
            <div
              key={item.id}
              className="gsap-solution-card flex flex-col justify-between rounded-2xl border border-slate-200 bg-[#F8FAFC] hover:bg-white hover:border-emerald-600/40 p-6 sm:p-7 shadow-sm hover:shadow-md transition-all"
            >
              <div>
                {/* Visual Thumbnail */}
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 mb-5 aspect-[16/9]">
                  <img
                    src={item.screenshot}
                    alt={item.alt}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#14532D] border border-emerald-200">
                    {item.icon}
                    <span>{item.badge}</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-400">
                    {item.id}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[#0F172A] mb-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-sm text-[#475569] leading-relaxed mb-4">
                  {item.description}
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-200/80 mb-6">
                  {item.metrics.map((metric, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-[#334155]">
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                      <span>{metric}</span>
                    </div>
                  ))}
                </div>
              </div>

              <a
                href={item.liveHref}
                className="inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#0F172A] hover:text-[#14532D] hover:border-[#14532D] transition-colors"
              >
                <span>{item.liveLabel}</span>
                <ArrowUpRight className="w-4 h-4 text-[#14532D]" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
