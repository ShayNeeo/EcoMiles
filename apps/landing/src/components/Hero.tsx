import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  FileSpreadsheet,
  SplitSquareVertical,
} from 'lucide-react';

interface HeroProps {
  onOpenPilotModal: () => void;
}

const HERO_TABS = [
  {
    id: 'dispatcher',
    label: 'Điều phối đội xe',
    src: '/pitch-deck-screenshots/01_desktop_b2b_tms_fleet_overview.png',
    alt: 'Giao diện trung tâm điều phối đội xe B2B EcoMiles',
    href: '/dashboard/',
    tag: '120 đơn · 7/10 xe',
  },
  {
    id: 'maps',
    label: 'Bản đồ vùng cấm QĐ 23',
    src: '/pitch-deck-screenshots/04_desktop_maps_overview_qd23_banned_zones.png',
    alt: 'Bản đồ xe tải né khung giờ cấm tải QĐ 23/2018',
    href: '/maps/?vehicle=0&mode=navigate',
    tag: '0 vi phạm giờ cấm',
  },
  {
    id: 'benchmark',
    label: 'Đối chứng EVSIM',
    src: '/pitch-deck-screenshots/02_desktop_b2b_tms_evsim_dual_simulator.png',
    alt: 'Phòng đối chứng thuật toán mô phỏng 2 bản đồ song song',
    href: '/benchmark/',
    tag: '-34,9% quãng đường',
  },
];

export const Hero: React.FC<HeroProps> = () => {
  const [activeTab, setActiveTab] = useState<'dispatcher' | 'maps' | 'benchmark'>('dispatcher');
  const currentTab = HERO_TABS.find((t) => t.id === activeTab) || HERO_TABS[0];

  return (
    <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#F4F8F5] via-[#F8FAFC] to-white border-b border-slate-200/80 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Concise Editorial Headline + 1-sentence summary + 2 CTAs */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-[1.12]">
              Điều phối lộ trình xe tải thông minh, giảm{' '}
              <span className="text-[#14532D]">34,9% quãng đường</span>
            </h1>

            <p className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-xl">
              Tải lên bảng tính Excel đơn hàng để tự động chia tuyến né giờ cấm tải TP.HCM, ghép hàng chiều về và xuất báo cáo CO₂.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <a
                href="/dashboard/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#14532D] hover:bg-[#0F3F22] text-white font-bold text-sm shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Vào Hệ Thống Điều Phối</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="/benchmark/"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-[#0F172A] border border-slate-300 font-bold text-sm shadow-sm transition-all cursor-pointer"
              >
                <SplitSquareVertical className="w-4 h-4 text-[#14532D]" />
                <span>Xem Đối Chứng 2 Bản Đồ</span>
              </a>
            </div>

            {/* Quick Proof Badges */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs text-[#475569]">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                Nghị định 13/2023 bảo mật
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                ISO 14083 / GLEC v3.2
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                $0 phí bản đồ dẫn đường
              </span>
            </div>
          </div>

          {/* Right Column: Visual Browser Mockup with Interactive Tabs */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_50px_-15px_rgba(15,23,42,0.12)] overflow-hidden">
              {/* Browser Chrome Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100/90 border-b border-slate-200">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>

                <div className="px-3 py-1 rounded-md bg-white border border-slate-200/80 text-xs font-mono text-slate-600 flex items-center gap-1.5 max-w-[240px] truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">ecomiles.vn{currentTab.href}</span>
                </div>

                <div className="text-xs font-semibold text-[#14532D]">
                  {currentTab.tag}
                </div>
              </div>

              {/* View Selector Tabs */}
              <div className="flex items-center border-b border-slate-200 bg-slate-50 px-2 pt-2 gap-1 overflow-x-auto">
                {HERO_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`px-3.5 py-1.5 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border-t border-x ${
                        isActive
                          ? 'bg-white text-[#0F172A] border-slate-200 -mb-px font-bold shadow-sm'
                          : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Screenshot Preview */}
              <div className="relative bg-slate-900 aspect-[16/10] overflow-hidden group">
                <img
                  key={currentTab.id}
                  src={currentTab.src}
                  alt={currentTab.alt}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.01]"
                  loading="eager"
                  decoding="async"
                />
                <a
                  href={currentTab.href}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white text-[#0F172A] text-xs font-bold shadow-md border border-slate-200 flex items-center gap-1.5 backdrop-blur-sm transition-all"
                >
                  <span>Mở không gian làm việc</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#14532D]" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom 4 Locked Metric Facts Strip */}
        <div className="mt-14 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-[#475569]">Quãng đường tối ưu</div>
            <div className="text-xl sm:text-2xl font-black text-[#0F172A] mt-1 tabular-nums">
              374,4 <span className="text-xs text-slate-400">km</span> → 243,7 <span className="text-xs text-slate-400">km</span>
            </div>
            <div className="text-xs text-[#16A34A] font-bold mt-0.5">Giảm 34,9% tổng km chạy</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-[#475569]">Ghép đơn chiều về (Backhaul)</div>
            <div className="text-xl sm:text-2xl font-black text-[#0F172A] mt-1 tabular-nums">
              32,8% → 2,7%
            </div>
            <div className="text-xs text-[#16A34A] font-bold mt-0.5">Thu hồi 2.074,7 kg hàng (21 đơn về)</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-[#475569]">Vi phạm giờ cấm QĐ 23</div>
            <div className="text-xl sm:text-2xl font-black text-[#0F172A] mt-1 tabular-nums">
              28 → 0 vi phạm
            </div>
            <div className="text-xs text-[#16A34A] font-bold mt-0.5">Tuân thủ khung cấm 06-09h &amp; 16-20h</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-[#475569]">Ước tính CO₂e (GLEC v3.2)</div>
            <div className="text-xl sm:text-2xl font-black text-[#0F172A] mt-1 tabular-nums">
              -32,2% CO₂e
            </div>
            <div className="text-xs text-[#14532D] font-bold mt-0.5">83,57 → 56,66 kg CO₂e · Xuất Excel 3 Sheet</div>
          </div>
        </div>
      </div>
    </section>
  );
};
