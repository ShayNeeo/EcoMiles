import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  FileSpreadsheet,
  SplitSquareVertical,
} from 'lucide-react';
import { BackhaulMatchIcon, IsoLedgerIcon, Qd23WindowIcon } from './EcoMilesMark';

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
    <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-[#F6F1E7] border-b border-[#D8D2C4] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Return-Line Thesis + Verified Proof + CTAs */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-[#101418] tracking-[-0.04em] leading-[1.02]">
              Đường về không trống<span className="text-[#1B45D7]">.</span>{' '}
              <span className="block mt-2 text-2xl sm:text-3xl font-extrabold text-[#2A2F36] tracking-[-0.025em] leading-[1.14]">
                Giảm <span className="text-[#0B7A3B]">34,9%</span> quãng đường chạy rỗng TP.HCM
              </span>
            </h1>

            <p className="text-base sm:text-[17px] text-[#2A2F36] leading-relaxed max-w-xl">
              Nạp bảng Excel đơn hàng để ghép tuyến chiều về, né khung giờ cấm tải QĐ 23/2018 và xuất sổ kiểm toán phát thải CO₂e chuẩn ISO 14083.
            </p>

            {/* Recomposed Folded Return-M Corridor visual signature */}
            <div className="border border-[#D8D2C4] bg-[#FBF8F1] p-3">
              <svg viewBox="0 0 540 162" fill="none" className="w-full h-auto" role="img" aria-label="Sơ đồ tuyến khép vòng Return M tránh giờ cấm QĐ 23/2018">
                {/* 24h QĐ 23/2018 Clock Band */}
                <rect x="10" y="8" width="520" height="18" fill="#ECE5D7" stroke="#D8D2C4" strokeWidth="1" />
                <rect x="10" y="8" width="124" height="18" fill="#EEF2FC" />
                <rect x="134" y="8" width="66" height="18" fill="#FDF3E7" />
                <rect x="134" y="8" width="66" height="2.5" fill="#A64B08" />
                <rect x="200" y="8" width="154" height="18" fill="#EAF5EE" />
                <rect x="200" y="8" width="154" height="2.5" fill="#0B7A3B" />
                <rect x="354" y="8" width="88" height="18" fill="#FDF3E7" />
                <rect x="354" y="8" width="88" height="2.5" fill="#A64B08" />
                <rect x="442" y="8" width="88" height="18" fill="#EEF2FC" />
                <text x="167" y="20" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8.5" fontWeight="700" fill="#A64B08">06–09 CẤM</text>
                <text x="277" y="20" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8.5" fontWeight="700" fill="#0B7A3B">09–16 MỞ QĐ 23</text>
                <text x="398" y="20" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8.5" fontWeight="700" fill="#A64B08">16–20 CẤM</text>

                {/* Enclosed Verified Backhaul Cargo Bay */}
                <path d="M134 118 V50 L277 90 L420 50 V118 H134 Z" fill="#0B7A3B" fillOpacity="0.09" />

                {/* Legacy Empty-Return Deadhead Ghost */}
                <path d="M134 121 C205 142 349 142 420 121" stroke="#B42318" strokeWidth="2" strokeDasharray="5 4" />
                <text x="277" y="150" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8.5" fontWeight="700" fill="#B42318">TRƯỚC: CHẠY RỖNG 32,8% · 28 LỖI QĐ 23</text>

                {/* Folded Return-M Route Path */}
                <path d="M36 118 H134 V50 L277 90 L420 50 V118" stroke="#101418" strokeWidth="3.2" strokeLinecap="square" strokeLinejoin="miter" />
                <path d="M420 118 H134" stroke="#1B45D7" strokeWidth="3.8" strokeLinecap="square" />
                <path d="M420 118 H496" stroke="#0B7A3B" strokeWidth="2.8" strokeLinecap="square" />

                <circle cx="36" cy="118" r="4.5" fill="#101418" />
                <circle cx="134" cy="50" r="4.5" fill="#101418" />
                <circle cx="277" cy="90" r="5" fill="#1B45D7" />
                <circle cx="420" cy="50" r="4.5" fill="#101418" />
                <rect x="129" y="113" width="10" height="10" fill="#0B7A3B" />
                <rect x="492" y="113" width="10" height="10" fill="#0B7A3B" />

                <text x="36" y="106" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8.5" fontWeight="700" fill="#101418">CÁT LÁI</text>
                <text x="134" y="42" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8.5" fontWeight="700" fill="#101418">SÓNG THẦN</text>
                <text x="277" y="79" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8.5" fontWeight="700" fill="#1B45D7">GHÉP VỀ</text>
                <text x="420" y="42" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8.5" fontWeight="700" fill="#101418">TÂN BÌNH</text>
                <text x="277" y="110" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8.5" fontWeight="700" fill="#0B7A3B">CÒN 2,7% RỖNG · −34,9% KM</text>
                <text x="497" y="106" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8.5" fontWeight="700" fill="#0B7A3B">ISO 14083</text>
              </svg>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <a
                href="/dashboard/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-[4px] bg-[#101418] hover:bg-[#1B45D7] text-[#F6F1E7] font-bold text-sm shadow-sm transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Vào Hệ Thống Điều Phối</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="/benchmark/"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-[4px] bg-[#FFFFFF] hover:bg-[#ECE5D7] text-[#101418] border border-[#BDB5A3] font-bold text-sm transition-colors cursor-pointer"
              >
                <SplitSquareVertical className="w-4 h-4 text-[#1B45D7]" />
                <span>Xem Đối Chứng 2 Bản Đồ</span>
              </a>
            </div>

            {/* Quick Proof Badges */}
            <div className="pt-4 border-t border-[#D8D2C4] flex flex-wrap items-center gap-4 text-xs text-[#2A2F36]">
              <span className="flex items-center gap-1.5 font-medium">
                <Qd23WindowIcon className="w-4 h-4 text-[#A64B08]" />
                28 → 0 vi phạm QĐ 23/2018
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <IsoLedgerIcon className="w-4 h-4 text-[#0B7A3B]" />
                ISO 14083 / GLEC v3.2
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <BackhaulMatchIcon className="w-4 h-4 text-[#1B45D7]" />
                $0 phí bản đồ dẫn đường
              </span>
            </div>
          </div>

          {/* Right Column: Visual Browser Frame with Interactive Tabs */}
          <div className="lg:col-span-7">
            <div className="rounded-[4px] border border-[#BDB5A3] bg-[#FBF8F1] shadow-[0_18px_40px_-15px_rgba(16,20,24,0.16)] overflow-hidden">
              {/* Ledger Frame Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#101418] border-b border-[#101418] text-[#F6F1E7]">
                <div className="flex items-center gap-2 font-mono text-[11px] tracking-wider uppercase text-[#C9C3B6]">
                  <span className="inline-block w-2.5 h-2.5 bg-[#0B7A3B]" />
                  <span>51C · TP.HCM</span>
                </div>

                <div className="px-3 py-1 bg-[#1B2128] border border-[#2A323D] text-xs font-mono text-[#F6F1E7] flex items-center gap-1.5 max-w-[240px] truncate">
                  <span className="truncate">ecomiles.vn{currentTab.href}</span>
                </div>

                <div className="font-mono text-xs font-bold text-[#F6F1E7]">
                  {currentTab.tag}
                </div>
              </div>

              {/* View Selector Tabs */}
              <div className="flex items-center border-b border-[#D8D2C4] bg-[#ECE5D7] px-2 pt-2 gap-1 overflow-x-auto">
                {HERO_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border-t border-x ${
                        isActive
                          ? 'bg-[#FFFFFF] text-[#101418] border-[#BDB5A3] -mb-px font-bold'
                          : 'bg-transparent text-[#5B5F66] border-transparent hover:text-[#101418]'
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
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white text-[#101418] text-xs font-bold shadow-md border border-slate-200 flex items-center gap-1.5 backdrop-blur-sm transition-all"
                >
                  <span>Mở không gian làm việc</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#101418]" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom 4 Locked Metric Facts Strip */}
        <div className="mt-14 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-[#5B5F66]">Quãng đường tối ưu</div>
            <div className="text-xl sm:text-2xl font-black text-[#101418] mt-1 tabular-nums">
              374,4 <span className="text-xs text-slate-400">km</span> → 243,7 <span className="text-xs text-slate-400">km</span>
            </div>
            <div className="text-xs text-[#0B7A3B] font-bold mt-0.5">Giảm 34,9% tổng km chạy</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-[#5B5F66]">Ghép đơn chiều về (Backhaul)</div>
            <div className="text-xl sm:text-2xl font-black text-[#101418] mt-1 tabular-nums">
              32,8% → 2,7%
            </div>
            <div className="text-xs text-[#0B7A3B] font-bold mt-0.5">Thu hồi 2.074,7 kg hàng (21 đơn về)</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-[#5B5F66]">Vi phạm giờ cấm QĐ 23</div>
            <div className="text-xl sm:text-2xl font-black text-[#101418] mt-1 tabular-nums">
              28 → 0 vi phạm
            </div>
            <div className="text-xs text-[#0B7A3B] font-bold mt-0.5">Tuân thủ khung cấm 06-09h &amp; 16-20h</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-[#5B5F66]">Ước tính CO₂e (GLEC v3.2)</div>
            <div className="text-xl sm:text-2xl font-black text-[#101418] mt-1 tabular-nums">
              -32,2% CO₂e
            </div>
            <div className="text-xs text-[#101418] font-bold mt-0.5">83,57 → 56,66 kg CO₂e · Xuất Excel 3 Sheet</div>
          </div>
        </div>
      </div>
    </section>
  );
};
