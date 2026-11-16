import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  FileSpreadsheet,
  SplitSquareVertical,
} from 'lucide-react';
import {
  BackhaulMatchIcon,
  Co2AuditIcon,
  HanoiRingIcon,
  IsoLedgerIcon,
  Qd23WindowIcon,
  TruckWeightIcon,
  VanExemptIcon,
} from './EcoMilesMark';

interface HeroProps {
  onOpenPilotModal: () => void;
}

type PilotPresetId = 'beverage' | 'grocery01' | 'grocery91';

interface PilotPreset {
  id: PilotPresetId;
  label: string;
  sublabel: string;
  deltaKm: string;
  beforeKm: string;
  afterKm: string;
  beforePctWidth: number;
  afterPctWidth: number;
  tripsDelta: string;
  lawTag: string;
  co2Note: string;
}

const PILOT_PRESETS: PilotPreset[] = [
  {
    id: 'beverage',
    label: 'Đồ uống · Xe tải 2,5T',
    sublabel: '500 đơn thật / 88 ngày TP.HCM',
    deltaKm: '−30,5%',
    beforeKm: '14.178 km',
    afterKm: '9.857 km',
    beforePctWidth: 100,
    afterPctWidth: 69.5,
    tripsDelta: '543 → 328 chuyến (−39,6%)',
    lawTag: '235 → 0 lỗi QĐ 23/2018 · 0 quá tải',
    co2Note: '2.774 vs 3.990 kg CO₂e (GLEC)',
  },
  {
    id: 'grocery01',
    label: 'Tạp hóa #01 · Van <950kg',
    sublabel: '798 đơn thật / 161 ngày TP.HCM',
    deltaKm: '−50,8%',
    beforeKm: '13.441 km',
    afterKm: '6.611 km',
    beforePctWidth: 100,
    afterPctWidth: 49.2,
    tripsDelta: '798 → 161 chuyến ghép vòng',
    lawTag: 'Miễn cấm giờ TP.HCM 24/24 (<950 kg)',
    co2Note: '1.914 vs 3.890 kg CO₂e',
  },
  {
    id: 'grocery91',
    label: 'Mạng lưới 91 Cửa hàng',
    sublabel: '2.395 đơn hợp lệ / 393 ngày',
    deltaKm: '−36,4%',
    beforeKm: '46.376 km',
    afterKm: '29.508 km',
    beforePctWidth: 100,
    afterPctWidth: 63.6,
    tripsDelta: '−37,5% vs ghép thứ tự giờ',
    lawTag: 'Ghép chiều về đa điểm bán',
    co2Note: 'Tiết kiệm 1.822 L dầu · 4,88 tấn CO₂e',
  },
];

const HERO_TABS = [
  {
    id: 'dispatcher',
    label: 'Điều phối đội xe',
    src: '/pitch-deck-screenshots/01_desktop_b2b_tms_fleet_overview.png',
    alt: 'Giao diện trung tâm điều phối đội xe B2B EcoMiles',
    href: '/dashboard/',
    tag: '2.895 ĐƠN · OSRM',
  },
  {
    id: 'maps',
    label: 'Bản đồ vùng cấm',
    src: '/pitch-deck-screenshots/04_desktop_maps_overview_qd23_banned_zones.png',
    alt: 'Bản đồ xe tải né khung giờ cấm tải QĐ 23/2018',
    href: '/maps/?vehicle=0&mode=navigate',
    tag: '0 VI PHẠM QĐ 23',
  },
  {
    id: 'benchmark',
    label: 'Đối chứng EVSIM',
    src: '/pitch-deck-screenshots/02_desktop_b2b_tms_evsim_dual_simulator.png',
    alt: 'Phòng đối chứng thuật toán mô phỏng 2 bản đồ song song',
    href: '/benchmark/',
    tag: '−30,5% ĐẾN −50,8%',
  },
];

export const Hero: React.FC<HeroProps> = () => {
  const [activePresetId, setActivePresetId] = useState<PilotPresetId>('beverage');
  const [activeTab, setActiveTab] = useState<'dispatcher' | 'maps' | 'benchmark'>('dispatcher');

  const preset = PILOT_PRESETS.find((p) => p.id === activePresetId) ?? PILOT_PRESETS[0];
  const currentTab = HERO_TABS.find((t) => t.id === activeTab) ?? HERO_TABS[0];

  return (
    <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 px-4 sm:px-6 lg:px-8 em-grid-cosmos border-b-4 border-[#C1121F] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left 6 Cols: High-Contrast Graphic Poster & Interactive Pilot Diagram */}
          <div className="lg:col-span-6 space-y-5 text-left">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[60px] font-extrabold text-[#FDF0D5] tracking-[-0.04em] leading-[0.98]">
              Đường về không trống<span className="text-[#C1121F]">.</span>
            </h1>

            {/* High-Impact Graphic Delta Strip */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-baseline gap-2 rounded-lg bg-[#C1121F] px-4 py-2 text-[#FDF0D5] shadow-md">
                <span className="font-display text-2xl sm:text-3xl font-black tabular-nums tracking-tight">
                  −30,5% đến −50,8%
                </span>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#FDF0D5]/90">
                  km thực OSRM
                </span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-[#669BBC] px-3.5 py-2 text-[#003049] font-extrabold text-xs">
                <Qd23WindowIcon className="w-4 h-4 text-[#003049]" />
                <span>0 lỗi cấm tải QĐ 23 · NĐ 168</span>
              </span>
            </div>

            <p className="text-sm sm:text-base font-medium text-[#FDF0D5]/90 max-w-lg leading-snug">
              Excel vào → Tuyến ghép chiều về, né giờ cấm &amp; sổ CO₂e ra.
            </p>

            {/* Interactive Real Pilot Selector + Visual Corridor Diagram */}
            <div className="rounded-xl border border-[#669BBC]/45 bg-[#002033] p-4 shadow-xl space-y-3.5">
              {/* Interactive Dataset Switcher Buttons */}
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Chọn bộ dữ liệu thật tại TP.HCM">
                {PILOT_PRESETS.map((item) => {
                  const isSelected = item.id === activePresetId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActivePresetId(item.id)}
                      aria-pressed={isSelected}
                      className={`px-3 py-1.5 rounded-md font-mono text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#C1121F] text-[#FDF0D5]'
                          : 'bg-[#003049] text-[#669BBC] hover:text-[#FDF0D5] border border-[#669BBC]/30'
                      }`}
                    >
                      {item.id === 'beverage' ? (
                        <TruckWeightIcon className="w-3.5 h-3.5" />
                      ) : item.id === 'grocery01' ? (
                        <VanExemptIcon className="w-3.5 h-3.5" />
                      ) : (
                        <BackhaulMatchIcon className="w-3.5 h-3.5" />
                      )}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Visual Comparison Bar + Folded M Graphic */}
              <div className="rounded-lg bg-[#FDF0D5] p-3.5 text-[#003049]">
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#D4BF94]">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#003049]">
                    {preset.sublabel}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#780000] text-[#FDF0D5] font-mono text-xs font-extrabold tabular-nums">
                    {preset.deltaKm} KM
                  </span>
                </div>

                {/* Before vs After Proportional Bar Graphic */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-mono font-bold">
                    <span className="w-24 shrink-0 text-[#AE1F23]">GOOGLE MAPS</span>
                    <div className="flex-1 h-4 rounded-sm bg-[#EED9AF] overflow-hidden">
                      <div
                        className="h-full bg-[#C1121F] transition-all duration-300"
                        style={{ width: `${preset.beforePctWidth}%` }}
                      />
                    </div>
                    <span className="w-20 text-right tabular-nums text-[#780000]">{preset.beforeKm}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-mono font-bold">
                    <span className="w-24 shrink-0 text-[#003049]">ECOMILES</span>
                    <div className="flex-1 h-4 rounded-sm bg-[#EED9AF] overflow-hidden">
                      <div
                        className="h-full bg-[#003049] transition-all duration-300"
                        style={{ width: `${preset.afterPctWidth}%` }}
                      />
                    </div>
                    <span className="w-20 text-right tabular-nums text-[#003049]">{preset.afterKm}</span>
                  </div>
                </div>

                {/* Inline 24h Corridor Graphic Strip */}
                <svg
                  viewBox="0 0 540 94"
                  fill="none"
                  className="w-full h-auto mt-3 pt-2.5 border-t border-[#D4BF94]"
                  role="img"
                  aria-label="Sơ đồ khép vòng Return M né khung giờ cấm tải TP.HCM"
                >
                  <rect x="8" y="6" width="122" height="16" fill="#669BBC" />
                  <rect x="130" y="6" width="68" height="16" fill="#780000" />
                  <rect x="198" y="6" width="154" height="16" fill="#003049" />
                  <rect x="352" y="6" width="88" height="16" fill="#780000" />
                  <rect x="440" y="6" width="92" height="16" fill="#669BBC" />
                  <text x="69" y="17" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8" fontWeight="700" fill="#003049">00-06 MỞ</text>
                  <text x="164" y="17" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8" fontWeight="700" fill="#FDF0D5">06-09 CẤM</text>
                  <text x="275" y="17" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8" fontWeight="700" fill="#FDF0D5">09-16 NỘI ĐÔ</text>
                  <text x="396" y="17" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8" fontWeight="700" fill="#FDF0D5">16-20 CẤM</text>
                  <text x="486" y="17" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8" fontWeight="700" fill="#003049">20-24 ĐÊM</text>

                  <path d="M28 66 H130 V36 L275 56 L420 36 V66" stroke="#003049" strokeWidth="3.2" strokeLinecap="square" strokeLinejoin="miter" />
                  <path d="M420 66 H130" stroke="#669BBC" strokeWidth="4" strokeLinecap="square" />
                  <path d="M420 66 H504" stroke="#AE1F23" strokeWidth="2.8" strokeLinecap="square" />
                  <circle cx="28" cy="66" r="4.5" fill="#003049" />
                  <circle cx="130" cy="36" r="4.5" fill="#003049" />
                  <circle cx="275" cy="56" r="5" fill="#C1121F" />
                  <circle cx="420" cy="36" r="4.5" fill="#003049" />
                  <rect x="498" y="60" width="11" height="11" fill="#AE1F23" />

                  <text x="275" y="84" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8.5" fontWeight="700" fill="#003049">
                    {`${preset.tripsDelta}  ·  ${preset.co2Note}`}
                  </text>
                </svg>

                <div className="mt-2 flex items-center justify-between gap-2 rounded bg-[#669BBC]/35 px-2.5 py-1.5 font-mono text-[11px] font-bold text-[#003049]">
                  <span>{preset.lawTag}</span>
                  <span>OSRM THẬT</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <a
                href="/dashboard/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[#C1121F] hover:bg-[#780000] text-[#FDF0D5] font-extrabold text-sm shadow-lg transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Mở Bảng Điều Phối</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="/benchmark/"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg bg-[#FDF0D5] hover:bg-[#669BBC] text-[#003049] font-extrabold text-sm transition-colors cursor-pointer"
              >
                <SplitSquareVertical className="w-4 h-4 text-[#AE1F23]" />
                <span>Đối Chứng 2 Bản Đồ</span>
              </a>
            </div>
          </div>

          {/* Right 6 Cols: Interactive Workspace Browser Frame */}
          <div className="lg:col-span-6">
            <div className="rounded-xl border-2 border-[#669BBC] bg-[#002033] shadow-[0_24px_56px_-18px_rgba(0,0,0,0.65)] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#002033] border-b border-[#669BBC]/30 text-[#FDF0D5]">
                <div className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-wider uppercase text-[#669BBC]">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#C1121F]" />
                  <span>TP.HCM · HÀ NỘI</span>
                </div>

                <div className="px-2.5 py-0.5 rounded bg-[#003049] border border-[#669BBC]/30 text-[11px] font-mono text-[#FDF0D5] truncate max-w-[200px]">
                  ecomiles.vn{currentTab.href}
                </div>

                <div className="px-2 py-0.5 rounded bg-[#C1121F] font-mono text-[10px] font-bold text-[#FDF0D5]">
                  {currentTab.tag}
                </div>
              </div>

              <div className="flex items-center gap-1 bg-[#003049] px-2 pt-2 border-b border-[#669BBC]/30 overflow-x-auto">
                {HERO_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer rounded-t-md ${
                        isActive
                          ? 'bg-[#FDF0D5] text-[#003049]'
                          : 'bg-transparent text-[#669BBC] hover:text-[#FDF0D5]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="relative bg-[#002033] aspect-[16/10] overflow-hidden group">
                <img
                  key={currentTab.id}
                  src={currentTab.src}
                  alt={currentTab.alt}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.01]"
                  loading="eager"
                  decoding="async"
                />
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#002033] border-t border-[#669BBC]/25">
                <span className="font-mono text-[11px] font-bold text-[#669BBC] truncate">
                  {currentTab.alt}
                </span>
                <a
                  href={currentTab.href}
                  className="shrink-0 px-3.5 py-1.5 rounded-lg bg-[#C1121F] hover:bg-[#780000] text-[#FDF0D5] text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <span>Chạy thử ngay</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Compact Pictogram Strip below preview */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[#FDF0D5]">
              <div className="flex items-center gap-2 rounded-lg bg-[#002033] border border-[#669BBC]/30 px-3 py-2 text-[11px] font-bold">
                <VanExemptIcon className="w-4 h-4 text-[#669BBC] shrink-0" />
                <span>Van &lt;950kg 24/24</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-[#002033] border border-[#669BBC]/30 px-3 py-2 text-[11px] font-bold">
                <HanoiRingIcon className="w-4 h-4 text-[#C1121F] shrink-0" />
                <span>Vành đai 3 HN</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-[#002033] border border-[#669BBC]/30 px-3 py-2 text-[11px] font-bold">
                <IsoLedgerIcon className="w-4 h-4 text-[#669BBC] shrink-0" />
                <span>Sổ GLEC v3.2</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-[#002033] border border-[#669BBC]/30 px-3 py-2 text-[11px] font-bold">
                <Co2AuditIcon className="w-4 h-4 text-[#C1121F] shrink-0" />
                <span>$0 phí Map API</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom 4 Colour-Blocked Proof Banners */}
        <div className="mt-12 pt-8 border-t border-[#669BBC]/25 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-[#FDF0D5] text-[#003049] border-2 border-[#003049]">
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#AE1F23]">Đồ uống 2,5T · 500 đơn</div>
            <div className="font-display text-2xl sm:text-3xl font-black mt-1 tabular-nums">−30,5%</div>
            <div className="text-xs font-bold text-[#003049] mt-0.5 tabular-nums">14.178 → 9.857 km · 0 QĐ 23</div>
          </div>

          <div className="p-4 rounded-xl bg-[#780000] text-[#FDF0D5] border-2 border-[#C1121F]">
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#FDF0D5]/80">Van &lt;950kg · Cửa hàng #01</div>
            <div className="font-display text-2xl sm:text-3xl font-black mt-1 tabular-nums">−50,8%</div>
            <div className="text-xs font-bold text-[#FDF0D5] mt-0.5 tabular-nums">13.441 → 6.611 km (798 đơn)</div>
          </div>

          <div className="p-4 rounded-xl bg-[#669BBC] text-[#003049] border-2 border-[#003049]">
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#003049]">91 Cửa hàng · 393 ngày</div>
            <div className="font-display text-2xl sm:text-3xl font-black mt-1 tabular-nums">−36,4%</div>
            <div className="text-xs font-bold text-[#003049] mt-0.5 tabular-nums">46.376 → 29.508 km (2.395 đơn)</div>
          </div>

          <div className="p-4 rounded-xl bg-[#002033] text-[#FDF0D5] border-2 border-[#669BBC]">
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#669BBC]">Tiết kiệm vs lịch cũ</div>
            <div className="font-display text-2xl sm:text-3xl font-black mt-1 tabular-nums">22-37%</div>
            <div className="text-xs font-bold text-[#FDF0D5] mt-0.5 tabular-nums">1.822 L dầu · −30-40% số chuyến</div>
          </div>
        </div>
      </div>
    </section>
  );
};
