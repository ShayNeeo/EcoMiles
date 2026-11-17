import React from 'react';
import { AlertTriangle, ArrowUpRight, CheckCircle2, Flame } from 'lucide-react';
import {
  BackhaulMatchIcon,
  HanoiRingIcon,
  IsoLedgerIcon,
  Qd23WindowIcon,
} from './EcoMilesMark';

interface PillarItem {
  id: string;
  tag: string;
  title: string;
  metric: string;
  semanticTone: 'ok' | 'warn' | 'err-fixed';
  statusLabel: string;
  href: string;
  renderGraphic: () => React.ReactNode;
}

const PILLARS: PillarItem[] = [
  {
    id: 'backhaul',
    tag: '01 · GHÉP ĐƠN CHIỀU VỀ',
    title: 'Biến km chạy rỗng thành tuyến ghép khứ hồi',
    metric: '−30,5% đến −50,8% km',
    semanticTone: 'ok',
    statusLabel: 'XANH · ĐÃ CHỨNG MINH OSRM',
    href: '/dashboard/',
    renderGraphic: () => (
      <svg viewBox="0 0 280 86" fill="none" className="w-full h-auto" aria-hidden="true">
        <rect x="6" y="10" width="268" height="22" rx="4" fill="#FEE2E2" />
        <rect x="6" y="10" width="248" height="22" rx="4" fill="#DC2626" />
        <text x="16" y="25" fontFamily="JetBrains Mono, monospace" fontSize="10" fontWeight="700" fill="#FDF0D5">
          TRƯỚC: RỖNG CHIỀU VỀ · 14.178 KM
        </text>
        <rect x="6" y="42" width="268" height="22" rx="4" fill="#DCFCE7" />
        <rect x="6" y="42" width="166" height="22" rx="4" fill="#15803D" />
        <text x="16" y="57" fontFamily="JetBrains Mono, monospace" fontSize="10" fontWeight="700" fill="#FDF0D5">
          SAU: 9.857 KM (−30,5%)
        </text>
        <text x="180" y="57" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fontWeight="700" fill="#15803D">
          543→328 CHUYẾN
        </text>
      </svg>
    ),
  },
  {
    id: 'legal',
    tag: '02 · LUẬT GIAO THÔNG 2025-2026',
    title: 'Khử phạt QĐ 23 TP.HCM & Vành đai 3 Hà Nội',
    metric: '235 → 0 vi phạm',
    semanticTone: 'err-fixed',
    statusLabel: 'ĐỎ → XANH · TRÁNH PHẠT 4-6M',
    href: '/maps/?vehicle=0&mode=navigate',
    renderGraphic: () => (
      <svg viewBox="0 0 280 86" fill="none" className="w-full h-auto" aria-hidden="true">
        <rect x="6" y="10" width="66" height="26" rx="4" fill="#15803D" />
        <text x="39" y="27" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fontWeight="700" fill="#FDF0D5">00-06 MỞ</text>
        <rect x="76" y="10" width="60" height="26" rx="4" fill="#DC2626" />
        <text x="106" y="27" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fontWeight="700" fill="#FDF0D5">06-09 CẤM</text>
        <rect x="140" y="10" width="68" height="26" rx="4" fill="#669BBC" />
        <text x="174" y="27" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fontWeight="700" fill="#003049">09-16 LÕI</text>
        <rect x="212" y="10" width="62" height="26" rx="4" fill="#DC2626" />
        <text x="243" y="27" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fontWeight="700" fill="#FDF0D5">16-20 CẤM</text>
        <rect x="6" y="46" width="268" height="24" rx="4" fill="#FEF3C7" stroke="#B45309" />
        <text x="140" y="62" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fontWeight="700" fill="#B45309">
          NĐ 168: PHẠT 4-6M · QĐ 01 HN: CẤM XE ≥2T 06-21h
        </text>
      </svg>
    ),
  },
  {
    id: 'van950',
    tag: '03 · ĐỊNH TUYẾN VAN <950KG',
    title: 'Tách đúng xe Van nội đô theo QCVN 41:2024',
    metric: '6.611 km (−50,8%)',
    semanticTone: 'warn',
    statusLabel: 'VÀNG · KIỂM TẢI & BIỂN P.106',
    href: '/driver/',
    renderGraphic: () => (
      <svg viewBox="0 0 280 86" fill="none" className="w-full h-auto" aria-hidden="true">
        <rect x="6" y="10" width="128" height="58" rx="6" fill="#003049" />
        <text x="18" y="30" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fontWeight="700" fill="#FBBF24">QCVN 41:2024</text>
        <text x="18" y="50" fontFamily="Be Vietnam Pro, sans-serif" fontSize="13" fontWeight="800" fill="#FDF0D5">Van &lt;950kg</text>
        <text x="18" y="63" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#669BBC">Bãi bỏ luật xe con</text>
        <rect x="144" y="10" width="130" height="58" rx="6" fill="#DCFCE7" stroke="#15803D" />
        <text x="156" y="30" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fontWeight="700" fill="#15803D">TP.HCM 24/24</text>
        <text x="156" y="50" fontFamily="JetBrains Mono, monospace" fontSize="14" fontWeight="800" fill="#003049">−50,8% km</text>
        <text x="156" y="63" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#15803D">Trừ biển cấm P.106</text>
      </svg>
    ),
  },
  {
    id: 'esg',
    tag: '04 · SỔ KIỂM TOÁN GLEC v3.2',
    title: 'Xuất Excel 3 Sheet tách TTW / WTW & ẩn danh PII',
    metric: '−4,88t CO2e TTW',
    semanticTone: 'ok',
    statusLabel: 'XANH · ISO 14083 & NĐ 13',
    href: '/portal/audit/',
    renderGraphic: () => (
      <svg viewBox="0 0 280 86" fill="none" className="w-full h-auto" aria-hidden="true">
        <rect x="6" y="10" width="84" height="58" rx="6" fill="#F8E7C4" stroke="#003049" />
        <text x="48" y="34" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fontWeight="800" fill="#003049">Sheet 1</text>
        <text x="48" y="52" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="#15803D">KPI ESG</text>
        <rect x="98" y="10" width="84" height="58" rx="6" fill="#003049" />
        <text x="140" y="34" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fontWeight="800" fill="#FDF0D5">Sheet 2</text>
        <text x="140" y="52" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="#4ADE80">−1.822 L dầu</text>
        <rect x="190" y="10" width="84" height="58" rx="6" fill="#003049" />
        <text x="232" y="34" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fontWeight="800" fill="#FDF0D5">Sheet 3</text>
        <text x="232" y="52" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="#669BBC">Che SĐT</text>
      </svg>
    ),
  },
];

export const Solutions: React.FC = () => {
  return (
    <section
      id="solutions"
      aria-labelledby="solutions-heading"
      className="relative overflow-hidden bg-[#FDF0D5] text-[#003049]"
    >
      {/* ACT 2A: Psychological Loss-Aversion Strip (Gochujang Red ~8% brand voltage) */}
      <div className="bg-[#780000] text-[#FDF0D5] px-4 sm:px-6 lg:px-8 py-8 border-y-2 border-[#003049]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-5 items-center">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-extrabold uppercase tracking-wider text-[#FBBF24]">
              <Flame className="w-3.5 h-3.5" />
              <span>ĐIỂM MÙ CHI PHÍ MỖI CA</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-black text-[#FDF0D5] leading-snug">
              3 rò rỉ âm thầm của đội xe chạy bằng Excel
            </h2>
          </div>

          <div className="rounded-xl bg-[#002033]/55 border border-[#F87171]/40 p-4 space-y-1">
            <div className="font-mono text-[11px] font-bold text-[#F87171]">LỖI 01 · QUÃNG ĐƯỜNG THỪA</div>
            <div className="font-display text-xl font-black text-[#FDF0D5]">+30,5% đến +50,8% km</div>
            <div className="text-xs text-[#FDF0D5]/80">Tra Google Maps từng điểm gây lặp cung đường</div>
          </div>

          <div className="rounded-xl bg-[#002033]/55 border border-[#FBBF24]/45 p-4 space-y-1">
            <div className="font-mono text-[11px] font-bold text-[#FBBF24]">LỖI 02 · PHẠT GIỜ CẤM</div>
            <div className="font-display text-xl font-black text-[#FDF0D5]">4-6 triệu đ + −2 điểm GPLX</div>
            <div className="text-xs text-[#FDF0D5]/80">NĐ 168/2024 bắt nghiêm tải trọng &amp; biển P.106</div>
          </div>

          <div className="rounded-xl bg-[#002033]/55 border border-[#F87171]/40 p-4 space-y-1">
            <div className="font-mono text-[11px] font-bold text-[#F87171]">LỖI 03 · CHẠY RỖNG CHIỀU VỀ</div>
            <div className="font-display text-xl font-black text-[#FDF0D5]">32-38% ca không hàng</div>
            <div className="text-xs text-[#FDF0D5]/80">Thùng trống quay đầu, đốt dầu nhưng 0 doanh thu</div>
          </div>
        </div>
      </div>

      {/* ACT 2B: Calm Varden Gallery Spread — 4 Direct Graphic Solutions */}
      <div className="px-4 py-16 sm:px-6 sm:py-22 lg:px-8 border-b border-[#003049]/15">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b-2 border-[#003049]">
            <div className="space-y-2">
              <div className="font-mono text-xs font-extrabold uppercase tracking-wider text-[#AE1F23]">
                GIẢI PHÁP TRỰC QUAN
              </div>
              <h2
                id="solutions-heading"
                className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#003049] tracking-tight"
              >
                Bốn cơ chế khóa chặt lỗ hổng vận tải
              </h2>
            </div>
            <div className="inline-flex items-center gap-3 text-xs font-mono font-bold text-[#003049]/75">
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#15803D]" />Đạt / Tiết kiệm</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#B45309]" />Cảnh báo luật</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />Đã triệt tiêu</span>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-7">
            {PILLARS.map((item) => {
              const badgeStyle =
                item.semanticTone === 'ok'
                  ? 'bg-[#DCFCE7] text-[#15803D] border-[#15803D]/30'
                  : item.semanticTone === 'warn'
                    ? 'bg-[#FEF3C7] text-[#B45309] border-[#B45309]/35'
                    : 'bg-[#FEE2E2] text-[#B91C1C] border-[#B91C1C]/30';

              const IconComponent =
                item.id === 'backhaul'
                  ? BackhaulMatchIcon
                  : item.id === 'legal'
                    ? Qd23WindowIcon
                    : item.id === 'van950'
                      ? HanoiRingIcon
                      : IsoLedgerIcon;

              return (
                <article
                  key={item.id}
                  className="rounded-2xl bg-[#F8E7C4] border-2 border-[#003049] p-6 sm:p-7 flex flex-col justify-between gap-5 shadow-sm hover:-translate-y-0.5 transition-transform"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#003049]/70">
                        {item.tag}
                      </span>
                      <h3 className="font-display text-xl sm:text-2xl font-black text-[#003049] leading-tight">
                        {item.title}
                      </h3>
                    </div>
                    <span className="w-10 h-10 rounded-xl bg-[#003049] text-[#FDF0D5] flex items-center justify-center shrink-0">
                      <IconComponent className="w-5 h-5" />
                    </span>
                  </div>

                  {/* Direct Graphic Comparison Diagram */}
                  <div className="rounded-xl bg-[#FDF0D5] border border-[#003049]/20 p-3.5">
                    {item.renderGraphic()}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-mono font-extrabold ${badgeStyle}`}>
                        {item.semanticTone === 'warn' ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        <span>{item.statusLabel}</span>
                      </span>
                      <span className="font-mono text-sm font-black text-[#003049]">{item.metric}</span>
                    </div>

                    <a
                      href={item.href}
                      className="inline-flex items-center gap-1 text-xs font-extrabold text-[#C1121F] hover:text-[#780000]"
                    >
                      <span>Mở mô-đun</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
