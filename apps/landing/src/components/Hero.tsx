import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  FileSpreadsheet,
  SplitSquareVertical,
} from 'lucide-react';
import { TruckWeightIcon, VanExemptIcon } from './EcoMilesMark';

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
  beforeIssue: string;
  afterProof: string;
  co2Note: string;
  warningNote: string;
}

const PILOT_PRESETS: PilotPreset[] = [
  {
    id: 'beverage',
    label: 'Đồ uống · Xe 2,5T',
    sublabel: '500 đơn thật / 88 ngày TP.HCM',
    deltaKm: '−30,5%',
    beforeKm: '14.178 km',
    afterKm: '9.857 km',
    beforeIssue: '235 ca dính giờ cấm + 73 ca quá tải',
    afterProof: '0 lỗi QĐ 23 · 543 → 328 chuyến (−39,6%)',
    co2Note: '2,774 vs 3,990 kg CO2e',
    warningNote: 'Cắt đỉnh cấm tải 06-09h & 16-20h',
  },
  {
    id: 'grocery01',
    label: 'Tạp hóa #01 · Van <950kg',
    sublabel: '2.395 đơn thật / 393 ngày',
    deltaKm: '−50,8%',
    beforeKm: '13.441 km',
    afterKm: '6.611 km',
    beforeIssue: 'Chạy 1 điểm/chuyến rời rạc theo Google Maps',
    afterProof: '−26,0% vs gom theo giờ · hợp pháp QCVN 41:2024',
    co2Note: '−50,8% dầu tiêu thụ thực tế',
    warningNote: 'Kiểm tra biển P.106 & tải <950kg',
  },
  {
    id: 'grocery91',
    label: 'Mạng lưới 91 Cửa hàng',
    sublabel: '2.395 đơn thật toàn hệ thống',
    deltaKm: '−36,4%',
    beforeKm: '46.376 km',
    afterKm: '29.508 km',
    beforeIssue: 'Tuyến chéo chồng lấn + rỗng chiều về',
    afterProof: '−37,5% vs nối chuỗi lịch cũ · ghép 91 điểm bán',
    co2Note: '−1.822 L dầu · −4,88t TTW / −5,90t WTW',
    warningNote: 'Cảnh báo ngõ cấm Hà Nội QĐ 01/2026',
  },
];

export const Hero: React.FC<HeroProps> = () => {
  const [selectedPreset, setSelectedPreset] = useState<PilotPresetId>('beverage');
  const [sculptureMode, setSculptureMode] = useState<'after' | 'before'>('after');

  const preset = PILOT_PRESETS.find((p) => p.id === selectedPreset) || PILOT_PRESETS[0];

  return (
    <section
      aria-label="Giới thiệu EcoMiles"
      className="relative overflow-hidden bg-[#FDF0D5] text-[#003049] pt-8 sm:pt-12 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 border-b border-[#003049]/15"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* LEFT GALLERY (60% Varden negative space mindset — zero card clutter) */}
          <div className="lg:col-span-6 space-y-7">
            {/* Single Semantic Trust Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#DCFCE7] border border-[#15803D]/30 text-[#15803D] text-xs font-extrabold">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>0 vi phạm QĐ 23/2018 · QĐ 01/2026 · QCVN 41:2024</span>
            </div>

            {/* Sculptural Display Headline */}
            <div className="space-y-4">
              <h1 className="font-display text-5xl sm:text-6xl lg:text-[68px] font-extrabold text-[#003049] leading-[0.95] tracking-[-0.035em] text-balance">
                Đường về
                <br />
                không trống<span className="text-[#C1121F]">.</span>
              </h1>
              <p className="text-base sm:text-lg font-medium text-[#003049]/80 max-w-lg leading-relaxed">
                Gom đơn Excel, né giờ cấm tải 24/24 và ghép hàng chiều về chỉ trong{' '}
                <strong className="text-[#003049] font-extrabold">30 giây</strong>. Kiểm chứng trên{' '}
                <strong className="text-[#003049] font-extrabold">2.895 đơn thật</strong> tại TP.HCM.
              </p>
            </div>

            {/* Minimal Architectural Tab Selector (no heavy enclosed boxes) */}
            <div className="space-y-3">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#AE1F23]">
                Chọn dữ liệu đối chứng OSRM thật:
              </div>
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Tập dữ liệu pilot">
                {PILOT_PRESETS.map((item) => {
                  const isActive = item.id === selectedPreset;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setSelectedPreset(item.id)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border ${
                        isActive
                          ? 'bg-[#003049] text-[#FDF0D5] border-[#003049] shadow-sm'
                          : 'bg-transparent text-[#003049]/80 border-[#003049]/25 hover:border-[#003049] hover:text-[#003049]'
                      }`}
                    >
                      {item.id === 'beverage' ? (
                        <TruckWeightIcon className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <VanExemptIcon className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{item.label}</span>
                      <span
                        className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                          isActive
                            ? 'bg-[#15803D] text-[#FDF0D5]'
                            : 'bg-[#F8E7C4] text-[#003049]'
                        }`}
                      >
                        {item.deltaKm}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Conversion Pair — Single Crimson Focus Magnet */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="/dashboard/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#C1121F] hover:bg-[#780000] text-[#FDF0D5] font-extrabold text-sm shadow-md transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Mở Bàn Điều Phối</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="/benchmark/"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#FDF0D5] hover:bg-[#F8E7C4] text-[#003049] border-2 border-[#003049] font-extrabold text-sm transition-colors"
              >
                <SplitSquareVertical className="w-4 h-4" />
                <span>Đối Chứng 2 Bản Đồ</span>
              </a>
            </div>

            {/* Quiet Anchoring Footer Note */}
            <p className="text-xs font-mono font-semibold text-[#003049]/65">
              $0 phí Google Map API · Chuẩn sổ CO2e GLEC v3.2 · Bảo mật NĐ 13/2023
            </p>
          </div>

          {/* RIGHT CANVAS (40% Cosmos Night Sculpture: Interactive Loss-to-Gain Route Metamorphosis) */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl bg-[#003049] text-[#FDF0D5] border-2 border-[#003049] shadow-2xl overflow-hidden">
              {/* Sculpture Toolbar */}
              <div className="flex items-center justify-between gap-2 px-5 py-3.5 bg-[#002033] border-b border-[#669BBC]/25">
                <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#669BBC]">
                  {preset.sublabel}
                </div>
                <div className="inline-flex rounded-lg bg-[#003049] p-0.5 border border-[#669BBC]/30">
                  <button
                    type="button"
                    onClick={() => setSculptureMode('before')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-colors cursor-pointer ${
                      sculptureMode === 'before'
                        ? 'bg-[#DC2626] text-[#FDF0D5]'
                        : 'text-[#669BBC] hover:text-[#FDF0D5]'
                    }`}
                  >
                    Trước (GMaps)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSculptureMode('after')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-colors cursor-pointer ${
                      sculptureMode === 'after'
                        ? 'bg-[#15803D] text-[#FDF0D5]'
                        : 'text-[#669BBC] hover:text-[#FDF0D5]'
                    }`}
                  >
                    Sau (EcoMiles)
                  </button>
                </div>
              </div>

              {/* Animated Kinetic Route Canvas */}
              <div className="p-5 sm:p-6 space-y-5">
                <svg
                  viewBox="0 0 560 225"
                  fill="none"
                  className="w-full h-auto"
                  role="img"
                  aria-label="Mô hình tuyến đường: Khử chạy rỗng chiều về và né tường giờ cấm"
                >
                  {/* Subtle Night Grid */}
                  <g stroke="#669BBC" strokeOpacity="0.12" strokeWidth="1">
                    <line x1="0" y1="50" x2="560" y2="50" />
                    <line x1="0" y1="115" x2="560" y2="115" />
                    <line x1="0" y1="180" x2="560" y2="180" />
                    <line x1="140" y1="10" x2="140" y2="215" />
                    <line x1="280" y1="10" x2="280" y2="215" />
                    <line x1="420" y1="10" x2="420" y2="215" />
                  </g>

                  {/* 24h Curfew Hazard Walls (Semantic Error Red & Warning Yellow) */}
                  <rect x="176" y="18" width="150" height="22" rx="4" fill="#DC2626" fillOpacity="0.22" stroke="#F87171" strokeWidth="1.2" />
                  <text x="251" y="33" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fontWeight="700" fill="#F87171">
                    CẤM TẢI 06-09h / 16-20h
                  </text>

                  <rect x="336" y="18" width="136" height="22" rx="4" fill="#B45309" fillOpacity="0.24" stroke="#FBBF24" strokeWidth="1.2" />
                  <text x="404" y="33" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fontWeight="700" fill="#FBBF24">
                    NGƯỠNG VAN &lt;950KG
                  </text>

                  {/* BEFORE STATE: Error Red Chaotic Deadhead Return Loop */}
                  <g opacity={sculptureMode === 'before' ? 1 : 0.28} className="transition-opacity duration-300">
                    <path
                      d="M52 148 L156 58 L256 76 L354 54 L498 118"
                      stroke="#F87171"
                      strokeWidth="2.5"
                      strokeDasharray="6 5"
                      fill="none"
                    />
                    <path
                      d="M498 118 Q280 212 52 148"
                      stroke="#F87171"
                      strokeWidth="3"
                      strokeDasharray="7 5"
                      fill="none"
                      className={sculptureMode === 'before' ? 'em-flow-line' : ''}
                    />
                    <circle cx="256" cy="76" r="6" fill="#DC2626" stroke="#FDF0D5" strokeWidth="1.5" />
                    <text x="280" y="196" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10.5" fontWeight="700" fill="#F87171">
                      CHIỀU VỀ CHẠY RỖNG ({preset.beforeKm}) · 235 LỖI CẤM TẢI
                    </text>
                  </g>

                  {/* AFTER STATE: Blue Marble Corridor + Semantic Green Backhaul Match */}
                  <g opacity={sculptureMode === 'after' ? 1 : 0.22} className="transition-opacity duration-300">
                    {/* Shaded Recovered Corridor */}
                    <path
                      d="M52 148 L170 96 L320 112 L498 118 L345 162 L180 156 Z"
                      fill="#669BBC"
                      fillOpacity="0.16"
                    />
                    {/* Outbound Marble Highway */}
                    <path
                      d="M52 148 L170 96 L320 112 L498 118"
                      stroke="#669BBC"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Return Matched Green Backhaul */}
                    <path
                      d="M498 118 L345 162 L180 156 L52 148"
                      stroke="#4ADE80"
                      strokeWidth="4.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="em-flow-line"
                    />
                    {/* Nodes */}
                    <circle cx="170" cy="96" r="5" fill="#FDF0D5" stroke="#669BBC" strokeWidth="2.5" />
                    <circle cx="320" cy="112" r="5" fill="#FDF0D5" stroke="#669BBC" strokeWidth="2.5" />
                    <circle cx="345" cy="162" r="6" fill="#4ADE80" stroke="#002033" strokeWidth="2" />
                    <circle cx="180" cy="156" r="6" fill="#4ADE80" stroke="#002033" strokeWidth="2" />
                    <text x="345" y="182" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fontWeight="700" fill="#4ADE80">
                      GHÉP HÀNG CHIỀU VỀ + NÉ QĐ 23 ({preset.afterKm})
                    </text>
                  </g>

                  {/* Shared Depot & Destination Anchors */}
                  <rect x="40" y="136" width="24" height="24" rx="5" fill="#FDF0D5" stroke="#C1121F" strokeWidth="2.5" />
                  <text x="52" y="176" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fontWeight="700" fill="#FDF0D5">
                    KHO DC
                  </text>
                  <circle cx="498" cy="118" r="8" fill="#C1121F" stroke="#FDF0D5" strokeWidth="2" />
                  <text x="498" y="140" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fontWeight="700" fill="#FDF0D5">
                    ĐIỂM CUỐI
                  </text>
                </svg>

                {/* Behavioral Visual Split Comparison (Error Red vs Success Green) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 tabular-nums">
                  <div className="rounded-xl bg-[#002033] border border-[#F87171]/35 p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#F87171]">
                      <span>GOOGLE MAPS THỦ CÔNG</span>
                      <span>CHẠY THỪA</span>
                    </div>
                    <div className="font-display text-2xl font-extrabold text-[#FDF0D5]">{preset.beforeKm}</div>
                    <div className="text-[11px] text-[#FDF0D5]/75">{preset.beforeIssue}</div>
                  </div>

                  <div className="rounded-xl bg-[#052E16]/75 border border-[#4ADE80]/55 p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#4ADE80]">
                      <span>ECOMILES OSRM</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#15803D] text-[#FDF0D5]">{preset.deltaKm} KM</span>
                    </div>
                    <div className="font-display text-2xl font-extrabold text-[#4ADE80]">{preset.afterKm}</div>
                    <div className="text-[11px] text-[#DCFCE7]">{preset.afterProof}</div>
                  </div>
                </div>

                {/* Subtle Warning Caution Bar */}
                <div className="flex items-center justify-between gap-2 rounded-lg bg-[#FEF3C7]/10 border border-[#FBBF24]/35 px-3.5 py-2 text-xs text-[#FBBF24]">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{preset.warningNote}</span>
                  </span>
                  <span className="font-mono font-bold text-[11px] text-[#FDF0D5] shrink-0">{preset.co2Note}</span>
                </div>
              </div>

              {/* Clean Live Product Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 bg-[#002033] border-t border-[#669BBC]/25 text-xs">
                <span className="font-mono text-[11px] font-bold text-[#669BBC]">
                  TRẢI NGHIỆM TRỰC TIẾP TRÊN TRÌNH DUYỆT:
                </span>
                <div className="flex items-center gap-3 font-bold">
                  <a href="/dashboard/" className="text-[#FDF0D5] hover:text-[#4ADE80] inline-flex items-center gap-1">
                    <span>Điều phối</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                  <a href="/maps/" className="text-[#FDF0D5] hover:text-[#4ADE80] inline-flex items-center gap-1">
                    <span>Bản đồ QĐ 23</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                  <a href="/driver/" className="text-[#FDF0D5] hover:text-[#4ADE80] inline-flex items-center gap-1">
                    <span>App Tài xế</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
