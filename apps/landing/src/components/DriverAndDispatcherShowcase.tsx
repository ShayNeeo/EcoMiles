import React, { useState } from 'react';
import { Monitor, Globe2, Check } from 'lucide-react';

export const DriverAndDispatcherShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dispatcher' | 'driver'>('dispatcher');

  return (
    <section id="showcase" className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-900/90 border-t border-white/5 scroll-mt-24">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950 border border-white/10 text-xs font-bold text-ecomiles-lime mb-4">
            <Monitor className="w-3.5 h-3.5" />
            <span>HỆ SINH THÁI SẢN PHẨM TOÀN DIỆN</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Công Cụ Dễ Dùng Cho <span className="text-ecomiles-lime">Người Quản Lý &amp; Tài Xế</span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-300">
            Kết nối liền mạch giữa người quản lý tại văn phòng và tài xế ngoài đường, giúp mọi người cùng nhìn thấy một kế hoạch giao hàng thống nhất.
          </p>

          {/* Tab Switcher */}
          <div className="inline-flex max-w-full flex-col p-1.5 rounded-2xl bg-slate-950 border border-white/10 mt-8 sm:flex-row">
            <button
              onClick={() => setActiveTab('dispatcher')}
              aria-pressed={activeTab === 'dispatcher'}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'dispatcher'
                  ? 'bg-ecomiles-lime text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Màn Hình Cho Người Quản Lý</span>
            </button>

            <button
              onClick={() => setActiveTab('driver')}
              aria-pressed={activeTab === 'driver'}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'driver'
                  ? 'bg-ecomiles-lime text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe2 className="w-4 h-4" />
              <span>Web Dành Cho Tài Xế</span>
            </button>
          </div>
        </div>

        {/* Content Box */}
        {activeTab === 'dispatcher' ? (
          <div className="bg-slate-950/80 rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Info */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-block px-3 py-1 rounded-full text-[11px] font-bold text-ecomiles-lime bg-ecomiles-lime/10 border border-ecomiles-lime/20 uppercase tracking-wider">
                Trung Tâm Điều Hành Bưu Cục
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Màn Hình Điều Hành Dễ Theo Dõi
              </h3>

              <p className="text-sm text-slate-300 leading-relaxed">
                Người quản lý chỉ cần tải danh sách đơn hàng lên, hệ thống sẽ nhóm các điểm giao, đề xuất tuyến phù hợp và hiển thị tiến độ của từng xe trên bản đồ.
              </p>

              <div className="space-y-3 text-xs sm:text-sm text-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Nhập đơn hàng nhanh từ bảng tính quen thuộc</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Theo dõi vị trí xe và tiến độ giao hàng trên bản đồ</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Tải báo cáo nhiên liệu và lượng CO₂ dưới dạng bảng hoặc tài liệu</span>
                </div>
              </div>
            </div>

            {/* Right Mockup */}
            <div className="lg:col-span-6 bg-slate-900 rounded-2xl p-5 border border-white/10 shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">console.ecomiles.vn</span>
              </div>

              {/* Mini Dashboard Preview */}
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                    <div className="text-[10px] text-slate-400">Đơn hàng hôm nay</div>
                    <div className="text-lg font-extrabold text-ecomiles-lime">80 / 80</div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                    <div className="text-[10px] text-slate-400">Đội xe hoạt động</div>
                    <div className="text-lg font-extrabold text-emerald-400">10 Xe</div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                    <div className="text-[10px] text-slate-400">CO₂ Tiết giảm</div>
                    <div className="text-lg font-extrabold text-emerald-300">-142.8 kg</div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-white/5 text-xs text-slate-300">
                  <div className="flex justify-between items-center mb-2 font-bold text-white">
                    <span>Lộ trình đang thực hiện: Xe 03</span>
                    <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full text-[10px]">Đang di chuyển</span>
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <div>Kho Tân Bình → Cụm Bình Thạnh (8 đơn) → Thủ Đức (12 đơn)</div>
                    <div className="text-ecomiles-lime">Đã ghép 1 đơn lấy hàng chiều về (Thủ Đức → Bình Thạnh)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/80 rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Info */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-block px-3 py-1 rounded-full text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 uppercase tracking-wider">
                Web Responsive Dành Cho Tài Xế
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Mở Trên Trình Duyệt, Không Cần Cài Ứng Dụng
              </h3>

              <p className="text-sm text-slate-300 leading-relaxed">
                Tài xế mở đường dẫn EcoMiles trên trình duyệt là thấy ngay thứ tự các điểm cần giao. Web chỉ đường từng chặng, báo đơn chiều về và hỗ trợ lưu xác nhận giao hàng.
              </p>

              <div className="space-y-3 text-xs sm:text-sm text-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Dùng trực tiếp trên trình duyệt điện thoại, máy tính bảng hoặc máy tính</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Chụp ảnh, chữ ký và lưu xác nhận giao hàng ngay trên hệ thống</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Nhận thông báo nhận đơn ghép chiều về tăng thêm thu nhập mỗi chuyến</span>
                </div>
              </div>
            </div>

            {/* Right Driver Web Mockup */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-white/10 bg-slate-800/80 px-4 py-3">
                  <div className="flex gap-1.5" aria-hidden="true">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 py-1.5 text-left font-mono text-[10px] text-slate-400">
                    driver.ecomiles.vn/tuyen-hom-nay
                  </div>
                </div>

                <div className="grid gap-3 p-4 text-xs sm:grid-cols-2 sm:p-5">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 text-center sm:col-span-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Nhiệm Vụ Hôm Nay</span>
                    <div className="text-xl font-extrabold text-ecomiles-lime mt-0.5">20 Điểm Giao</div>
                    <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">Đã hoàn thành 14/20</div>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-ecomiles-lime/30">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                      <span>ĐIỂM GIAO TIẾP THEO</span>
                      <span className="text-ecomiles-lime font-bold">14:15</span>
                    </div>
                    <div className="font-bold text-white text-xs">Siêu thị Co.opmart Bình Triệu</div>
                    <div className="text-[11px] text-slate-400 mt-1">241 QL13, Hiệp Bình Chánh, Thủ Đức</div>
                  </div>

                  <div className="p-4 bg-emerald-950/60 rounded-2xl border border-emerald-500/30 text-[11px] text-emerald-300">
                    <strong>Đơn chiều về sẵn sàng:</strong> Nhận 50kg hàng từ Thủ Đức về kho trung tâm (+120.000đ).
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
