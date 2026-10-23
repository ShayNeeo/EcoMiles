import React from 'react';
import { Route, Clock, RefreshCw, BarChart3, Cpu, CheckCircle } from 'lucide-react';

export const Solutions: React.FC = () => {
  const solutions = [
    {
      id: '01',
      icon: <Route className="w-6 h-6 text-ecomiles-lime" />,
      badge: 'Tự Động Sắp Tuyến',
      title: 'Sắp Xếp Tuyến Giao Hàng Hiệu Quả',
      description:
        'Tự động gom các điểm giao gần nhau, tính theo tải trọng xe và khung giờ đã hẹn để tạo lộ trình hợp lý chỉ trong vài giây.',
      metrics: [
        'Giảm 20–30% tổng quãng đường',
        'Tiết kiệm 15–25% nhiên liệu & chi phí bảo trì',
        'Rút ngắn 80–90% thời gian điều phối',
      ],
      gradient: 'from-yellow-400/10 to-emerald-400/5',
    },
    {
      id: '02',
      icon: <Clock className="w-6 h-6 text-emerald-400" />,
      badge: 'Cập Nhật Liên Tục',
      title: 'Chủ Động Tránh Đường Ùn Tắc',
      description:
        'Cập nhật mật độ xe và điểm ùn tắc thời gian thực theo từng cung đường đô thị tại TP.HCM & Hà Nội, chủ động đề xuất lộ trình thay thế tránh kẹt xe giờ cao điểm.',
      metrics: ['Tăng tỷ lệ giao đúng hẹn 98.8%', 'Cảnh báo lệch tuyến tức thì'],
      gradient: 'from-emerald-500/10 to-teal-500/5',
    },
    {
      id: '03',
      icon: <RefreshCw className="w-6 h-6 text-emerald-300" />,
      badge: 'Tận Dụng Chiều Về',
      title: 'Ghép Thêm Đơn Khi Xe Quay Về',
      description:
        'Phát hiện và ghép các đơn lấy hàng chiều về khi xe hoàn thành tuyến giao tại điểm đích, giúp hạn chế quãng đường quay về không tải.',
      metrics: [
        'Giảm tỷ lệ xe chạy rỗng từ 30–35% xuống 5–10%',
        'Tăng số đơn hoàn thành trên mỗi chuyến',
        'Nâng cao hiệu suất khai thác đội xe',
      ],
      gradient: 'from-emerald-500/10 to-teal-500/5',
    },
    {
      id: '04',
      icon: <BarChart3 className="w-6 h-6 text-ecomiles-lime" />,
      badge: 'Theo Dõi Phát Thải',
      title: 'Biết Mỗi Chuyến Xe Phát Thải Bao Nhiêu CO₂',
      description:
        'Tự động tính lượng CO₂ của từng chuyến xe và đơn hàng theo phương pháp quốc tế, giúp doanh nghiệp dễ tổng hợp báo cáo phát triển bền vững.',
      metrics: ['Giảm 20–30% phát thải CO₂ / đơn hàng', 'Dễ tổng hợp báo cáo môi trường', 'Lập kế hoạch chuyển đổi xe điện'],
      gradient: 'from-yellow-400/10 to-emerald-500/5',
    },
  ];

  return (
    <section id="solutions" className="relative overflow-hidden py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-950/80 border-t border-white/5 scroll-mt-24">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[min(600px,100vw)] h-[300px] bg-ecomiles-lime/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-white/10 text-xs font-bold text-ecomiles-lime mb-4 shadow-sm">
            <Cpu className="w-3.5 h-3.5" />
            <span>GIẢI PHÁP DÀNH CHO DOANH NGHIỆP GIAO NHẬN</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            4 Cách EcoMiles Giúp <span className="text-ecomiles-lime">Vận Hành Hiệu Quả Hơn</span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Thay việc chia tuyến thủ công trên bảng tính bằng một quy trình tự động, dễ theo dõi và dễ sử dụng — giúp giao hàng đúng hẹn, giảm chi phí và giảm phát thải.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {solutions.map((item) => (
            <div
              key={item.id}
              className={`relative rounded-3xl p-8 sm:p-9 bg-gradient-to-br ${item.gradient} bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:border-ecomiles-lime/40 transition-all duration-300 group hover:-translate-y-1 shadow-xl shadow-black/30 flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 bg-slate-800/60 border border-white/10 px-3 py-1 rounded-full">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-ecomiles-lime transition-colors leading-snug">
                  {item.title}
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                  {item.description}
                </p>
              </div>

              <div className="pt-5 border-t border-white/10 space-y-2.5">
                {item.metrics.map((metric, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                    <CheckCircle className="w-4 h-4 text-ecomiles-lime shrink-0" />
                    <span>{metric}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
