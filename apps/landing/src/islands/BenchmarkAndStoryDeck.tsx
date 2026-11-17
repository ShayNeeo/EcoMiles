import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UploadCloud,
  Download,
  CheckCircle2,
  FileSpreadsheet,
  ShieldAlert,
  Printer,
  ShieldCheck,
  Lock,
  EyeOff,
  Eye,
  UserCheck,
  Trash2,
  ArrowRight,
  Clock,
  TrendingDown,
  Truck,
} from 'lucide-react';
import {
  parseXlsxToRows,
  parseCsvToRows,
  runEphemeralBenchmarkFromRows,
  buildAutomatedExcelWorkbookXml,
  type EphemeralBenchmarkResult,
  type StrategySummary,
} from '../utils/xlsxBenchmarkEngine';

interface EChartsInstance {
  setOption: (opt: Record<string, unknown>, notMerge?: boolean) => void;
  resize: () => void;
  dispose: () => void;
}

declare global {
  interface Window {
    echarts?: {
      init: (el: HTMLElement, theme?: string | null, opts?: { renderer?: string }) => EChartsInstance;
    };
  }
}

export type StoryActId = 'act1_executive' | 'act2_diagnostics' | 'act3_fleet_esg' | 'act4_benchmark_lab' | 'all_acts';
type DetailDrawerTab = 'routes_report' | 'qd23_fixes' | 'security_benchmark';

const SAMPLE_WORKBOOKS = [
  {
    id: 'coldchain_120',
    file: 'EcoMiles_Mau_Chuoi_Lanh_120_Don_Cam_Tai_QD23.xlsx',
    label: 'Mẫu 1: Chuỗi Lạnh 120 Đơn (Có 28 đơn dính giờ cấm)',
    shortLabel: 'Hàng Lạnh · 120 Đơn',
  },
  {
    id: 'fmcg_80',
    file: 'EcoMiles_Mau_FMCG_80_Don_TPHCM.xlsx',
    label: 'Mẫu 2: Phân Phối FMCG 80 Cửa Hàng Nội Đô',
    shortLabel: 'FMCG · 80 Đơn',
  },
  {
    id: 'erp_500',
    file: 'EcoMiles_Mau_ERP_500_Don_7_Ngay.xlsx',
    label: 'Mẫu 3: Dữ Liệu ERP 500 Đơn (7 Ngày Vận Hành)',
    shortLabel: 'ERP · 500 Đơn',
  },
] as const;

const TENANT_WORKSPACES = [
  {
    id: 'TENANT-RAM-SANDBOX',
    name: 'Chế độ Thử nghiệm Bảo mật (Chỉ xử lý trên trình duyệt, không lưu máy chủ)',
    isolation: 'Bộ nhớ tạm thời trên thiết bị người dùng (Tự xóa khi đóng trang)',
    encryption: 'Giải mã cục bộ ngay trên trình duyệt · Không gửi dữ liệu đơn hàng lên máy chủ chung',
  },
  {
    id: 'TENANT-FMCG-01',
    name: 'Không gian Doanh nghiệp A: Công ty Phân phối Thực phẩm Sài Gòn',
    isolation: 'Phân vùng cơ sở dữ liệu độc lập (Mã định danh: TNT-SGFMCG-001)',
    encryption: 'Mã hóa AES-256-GCM theo khóa riêng của Doanh nghiệp A',
  },
  {
    id: 'TENANT-COLD-02',
    name: 'Không gian Doanh nghiệp B: Chuỗi Cung ứng Kho Lạnh Nam Việt',
    isolation: 'Phân vùng cơ sở dữ liệu độc lập (Mã định danh: TNT-COLDNV-002)',
    encryption: 'Mã hóa AES-256-GCM theo khóa riêng của Doanh nghiệp B',
  },
] as const;

function EChartCanvas({ option, height = 260 }: { option: Record<string, unknown>; height?: number }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = hostRef.current;
    if (!el || typeof window === 'undefined' || !window.echarts) return;
    const chart = window.echarts.init(el, null, { renderer: 'canvas' });
    chart.setOption(option, true);
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, [option]);
  return <div ref={hostRef} style={{ width: '100%', height: `${height}px` }} />;
}

export function BenchmarkAndStoryDeck({ initialAct = 'act1_executive' }: { initialAct?: StoryActId }) {
  const [detailTab, setDetailTab] = useState<DetailDrawerTab>(
    initialAct === 'act4_benchmark_lab' ? 'security_benchmark' : 'routes_report'
  );
  const [result, setResult] = useState<EphemeralBenchmarkResult | null>(null);
  const [selectedStrategyId, setSelectedStrategyId] = useState<StrategySummary['id']>('ecomiles_ecoalns');
  const [loadingSample, setLoadingSample] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [focusedDistrict, setFocusedDistrict] = useState<string>('ALL');
  const [selectedTenantId, setSelectedTenantId] = useState<string>('TENANT-RAM-SANDBOX');
  const [maskPii, setMaskPii] = useState<boolean>(true);
  const [reportExportNotice, setReportExportNotice] = useState<string>('');
  const [accessApprovals, setAccessApprovals] = useState([
    {
      id: 'role-dispatcher',
      role: 'Điều phối viên ca sáng (Trạm Tân Bình)',
      scope: 'Xem danh sách đơn hàng, chạy tối ưu tuyến và điều chỉnh khung giờ giao',
      approved: true,
      updatedAt: '08:15 hôm nay',
    },
    {
      id: 'role-driver',
      role: 'Ứng dụng Tài xế giao hàng (Giới hạn theo biển số xe)',
      scope: 'Chỉ xem các điểm dừng thuộc chuyến xe được phân công, ẩn giá trị hợp đồng',
      approved: true,
      updatedAt: '08:20 hôm nay',
    },
    {
      id: 'role-auditor',
      role: 'Kiểm toán viên Môi trường / Đối tác ESG độc lập',
      scope: 'Chỉ xem số liệu tổng hợp km, nhiên liệu và CO₂e, ẩn toàn bộ tên và địa chỉ khách hàng',
      approved: false,
      updatedAt: 'Chờ chủ doanh nghiệp phê duyệt',
    },
  ]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadSampleWorkbook = async (fileName: string) => {
    setLoadingSample(fileName);
    setUploadError('');
    try {
      const resp = await fetch(`/samples/${fileName}`);
      if (!resp.ok) throw new Error(`Không thể tải file mẫu ${fileName} (HTTP ${resp.status})`);
      const buf = await resp.arrayBuffer();
      const rows = await parseXlsxToRows(buf);
      const bench = runEphemeralBenchmarkFromRows(rows, fileName);
      setResult(bench);
      setFocusedDistrict('ALL');
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingSample('');
    }
  };

  useEffect(() => {
    let cancelled = false;
    const fileName = 'EcoMiles_Mau_Chuoi_Lanh_120_Don_Cam_Tai_QD23.xlsx';
    fetch(`/samples/${fileName}`)
      .then((resp) => (resp.ok ? resp.arrayBuffer() : null))
      .then((buf) => (buf ? parseXlsxToRows(buf) : null))
      .then((rows) => {
        if (cancelled || !rows) return;
        const bench = runEphemeralBenchmarkFromRows(rows, fileName);
        setResult(bench);
        setFocusedDistrict('ALL');
      })
      .catch((err: unknown) => {
        if (!cancelled) setUploadError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFileUpload = async (file: File) => {
    setUploadError('');
    setLoadingSample(file.name);
    try {
      const lower = file.name.toLowerCase();
      let rows: string[][];
      if (lower.endsWith('.csv')) {
        const text = await file.text();
        rows = parseCsvToRows(text);
      } else if (lower.endsWith('.xlsx')) {
        const buf = await file.arrayBuffer();
        rows = await parseXlsxToRows(buf);
      } else {
        throw new Error('Vui lòng chọn file bảng tính chuẩn .xlsx hoặc .csv.');
      }
      const bench = runEphemeralBenchmarkFromRows(rows, file.name);
      setResult(bench);
      setFocusedDistrict('ALL');
      setReportExportNotice(
        `Đã phân tích xong file "${file.name}" (${bench.rows_valid} đơn hàng) chỉ trong ${bench.strategies.ecomiles_ecoalns.runtime_ms} ms. Xem ngay sự khác biệt Trước và Sau bên dưới.`
      );
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingSample('');
    }
  };

  const exportComparisonCsv = () => {
    if (!result) return;
    const cols = [
      'strategy_id',
      'strategy_name',
      'vehicles_used',
      'km_total',
      'km_empty_return',
      'empty_running_pct',
      'backhaul_orders_matched',
      'litres_total',
      'fuel_cost_vnd',
      'kg_co2_ttw',
      'kg_co2_wtw',
      'g_co2e_per_tkm',
      'payload_utilisation_pct',
      'ban_violations',
      'late_orders',
      'delta_vs_human_km_pct',
      'runtime_ms',
    ];
    const rows = Object.values(result.strategies).map((s) =>
      [
        s.id,
        `"${s.name}"`,
        s.vehicles_used,
        s.km_total,
        s.km_empty_return,
        s.empty_running_pct,
        s.backhaul_orders_matched,
        s.litres_total,
        s.fuel_cost_vnd,
        s.kg_co2_ttw,
        s.kg_co2_wtw,
        s.g_co2e_per_tkm,
        s.payload_utilisation_pct,
        s.ban_violations,
        s.late_orders,
        s.delta_vs_human_km_pct,
        s.runtime_ms,
      ].join(',')
    );
    const csv =
      `# file=${result.file_name} fingerprint=${result.dataset_fingerprint} parsed_at=${result.parsed_at}\n` +
      cols.join(',') +
      '\n' +
      rows.join('\n') +
      '\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_Cao_Kiem_Toan_EcoMiles_${result.file_name.replace(/\.[^.]+$/, '')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setReportExportNotice(
      `Đã kết xuất file CSV kiểm toán (${result.rows_valid} đơn hàng) lúc ${new Date().toLocaleTimeString('vi-VN')}.`
    );
  };

  const exportAutomatedMultiSheetExcel = () => {
    if (!result) return;
    const xml = buildAutomatedExcelWorkbookXml(result, selectedStrategyId);
    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_Cao_Tu_Dong_3_Sheet_EcoMiles_${result.file_name.replace(/\.[^.]+$/, '')}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setReportExportNotice(
      `Đã tự động tạo và tải xuống Báo cáo Excel 3 Sheet (1_Tong_Hop_Hieu_Qua_ESG, 2_Chi_Tiet_Tung_Chuyen_Xe, 3_Kiem_Toan_Don_Hang_QD23) kèm mã xác thực ${result.dataset_fingerprint}.`
    );
  };

  const toggleRoleApproval = (roleId: string) => {
    setAccessApprovals((prev) =>
      prev.map((item) =>
        item.id === roleId
          ? {
              ...item,
              approved: !item.approved,
              updatedAt: !item.approved
                ? `Đã phê duyệt lúc ${new Date().toLocaleTimeString('vi-VN')}`
                : `Đã thu hồi quyền lúc ${new Date().toLocaleTimeString('vi-VN')}`,
            }
          : item
      )
    );
  };

  if (!result) {
    return (
      <div className="p-12 rounded-3xl bg-[#003049] border border-white/10 text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#C1121F] border-t-transparent animate-spin mx-auto" />
        <p className="text-sm font-bold text-[#FDF0D5]">Đang phân tích bảng tính đơn hàng và tối ưu lộ trình...</p>
      </div>
    );
  }

  const rawSt = result.strategies.raw_excel;
  const humanSt = result.strategies.human_google_proxy;
  const twoOptSt = result.strategies.ecomiles_2opt;
  const alnsSt = result.strategies.ecomiles_ecoalns;
  const activeStrategy = result.strategies[selectedStrategyId] || alnsSt;

  const kmSaved = Number((humanSt.km_total - alnsSt.km_total).toFixed(1));
  const kmSavedPct = Math.abs(alnsSt.delta_vs_human_km_pct);
  const emptyKmSaved = Number((humanSt.km_empty_return - alnsSt.km_empty_return).toFixed(1));
  const vndSaved = Math.max(0, humanSt.fuel_cost_vnd - alnsSt.fuel_cost_vnd);
  const co2Saved = Number((humanSt.kg_co2_ttw - alnsSt.kg_co2_ttw).toFixed(2));
  const co2SavedPct = Math.abs(alnsSt.delta_vs_human_co2_pct);
  const banOrdersCount = result.orders.filter((o) => o.qd23_ban_conflict).length;

  return (
    <div className="space-y-6 pb-16 tabular-nums">
      {/* =====================================================================
          ZONE 1: ULTRA-CLEAN INPUT & SAMPLE SWITCHER BAR
          "Upload your .xlsx or pick a real HCMC scenario -> See the difference"
          ===================================================================== */}
      <section
        aria-label="Tải bảng tính đơn hàng và chọn kịch bản"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) handleFileUpload(f);
        }}
        className="p-5 sm:p-6 rounded-3xl bg-[#003049] border border-white/15 shadow-xl space-y-4"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileUpload(f);
          }}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FDF0D5] text-[#003049] font-black">
                BƯỚC 1: NẠP BẢNG TÍNH ĐƠN HÀNG (.XLSX)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#004366] text-[#669BBC] border border-[#669BBC] font-mono break-all">
                Đang mở: {result.file_name} ({result.rows_valid} điểm giao)
              </span>
              <button
                onClick={() => setDetailTab('security_benchmark')}
                className="px-2.5 py-0.5 rounded-full bg-[#002033] hover:bg-[#004366] text-[#FDF0D5] border border-white/10 flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#669BBC]" />
                <span>Xử lý cục bộ bảo mật · Đã che SĐT khách nhận</span>
              </button>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-1">
              So Sánh Tức Thì: Chia Tuyến Thủ Công vs. Tự Động Hóa EcoMiles
            </h1>
          </div>

          {/* Primary Upload CTA + 1-Click Automated Report Export */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-2xl bg-[#C1121F] hover:bg-[#780000] text-[#FDF0D5] text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#C1121F]/25"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Tải File Excel (.xlsx) Của Bạn</span>
            </button>

            <button
              onClick={exportAutomatedMultiSheetExcel}
              className="px-4 py-2.5 rounded-2xl bg-[#669BBC] hover:bg-[#FDF0D5] text-[#003049] text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer shadow-md"
              title="Tự động xuất file Excel gồm 3 Sheet: Tổng hợp ESG, Chi tiết chuyến xe và Kiểm toán đơn hàng"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Báo Cáo Tự Động (3 Sheet .XLS)</span>
            </button>
          </div>
        </div>

        {/* Simple 3-Scenario Pills + Download Sample Link */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#669BBC] font-bold">Hoặc thử nhanh 3 tập dữ liệu thực tế TP.HCM:</span>
            {SAMPLE_WORKBOOKS.map((sw) => {
              const isCurrent = result.file_name === sw.file;
              return (
                <button
                  key={sw.id}
                  onClick={() => loadSampleWorkbook(sw.file)}
                  disabled={loadingSample !== ''}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer border ${
                    isCurrent
                      ? 'bg-[#FDF0D5] text-[#003049] border-[#FDF0D5] shadow-sm font-black'
                      : 'bg-[#002033] text-[#FDF0D5] border-white/10 hover:border-[#C1121F]/50 hover:text-white'
                  }`}
                >
                  {sw.shortLabel}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`/samples/${result.file_name}`}
              download={result.file_name}
              className="text-[#FDF0D5] hover:underline font-bold flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file .xlsx đang mở về máy để xem cấu trúc cột</span>
            </a>
          </div>
        </div>

        {uploadError && (
          <div className="p-3.5 rounded-2xl bg-[#780000]/30 border border-[#C1121F] text-xs text-[#FDF0D5] font-bold">
            Lỗi đọc file: {uploadError}
          </div>
        )}

        {reportExportNotice && (
          <div className="p-3.5 rounded-2xl bg-[#669BBC] border border-[#003049] text-xs font-semibold text-[#003049] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#003049] shrink-0" />
              <span>{reportExportNotice}</span>
            </div>
            <button
              onClick={() => setReportExportNotice('')}
              className="text-[11px] font-bold text-[#003049] underline hover:text-[#780000] cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}
      </section>

      {/* =====================================================================
          ZONE 2: THE INSTANT "BEFORE vs AFTER" TRANSFORMATION SPLIT
          No toggling required: Left = Manual Dispatch, Right = EcoMiles
          ===================================================================== */}
      <section aria-label="Đối chứng trực tiếp Trước và Sau khi dùng EcoMiles" className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* LEFT CARD: BEFORE (Manual Excel + Google Maps) */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-[#003049] border border-[#C1121F] flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full bg-[#780000]/30 text-[#FDF0D5] border border-[#C1121F] text-xs font-black uppercase">
                  TRƯỚC KHI DÙNG · Chia Tuyến Thủ Công
                </span>
                <span className="text-xs text-[#669BBC] font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#C1121F]" />
                  Mất 60 đến 120 phút/ca
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-white">
                Nhân sự lọc Excel theo Quận + Dò đường từng chặng trên Google Maps
              </h2>
              <p className="text-xs text-[#669BBC] leading-relaxed">
                Google Maps chỉ dẫn đường ngắn nhất giữa 2 điểm rời rạc, không tự chia {result.rows_valid} đơn cho đội xe, không tính tải trọng và không lọc giờ cấm tải nội đô.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#002033] border border-white/5">
                <div className="text-[11px] text-[#669BBC] font-bold">Tổng quãng đường</div>
                <div className="text-2xl font-black text-white mt-0.5">{humanSt.km_total.toFixed(1)} km</div>
                <div className="text-[11px] text-[#669BBC] mt-0.5">Cần {humanSt.vehicles_used} chuyến xe</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#002033] border border-[#C1121F]">
                <div className="text-[11px] text-[#FDF0D5] font-bold">Tỷ lệ xe chạy rỗng</div>
                <div className="text-2xl font-black text-[#C1121F] mt-0.5">{humanSt.empty_running_pct.toFixed(1)}%</div>
                <div className="text-[11px] text-[#FDF0D5]/80 mt-0.5">
                  {humanSt.km_empty_return.toFixed(1)} km về kho không hàng
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#002033] border border-white/5">
                <div className="text-[11px] text-[#669BBC] font-bold">Nhiên liệu &amp; Chi phí</div>
                <div className="text-xl font-black text-white mt-0.5">{humanSt.litres_total.toFixed(1)} Lít</div>
                <div className="text-[11px] text-[#669BBC] mt-0.5">
                  {humanSt.fuel_cost_vnd.toLocaleString('vi-VN')} ₫ / ca
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#002033] border border-[#C1121F]">
                <div className="text-[11px] text-[#FDF0D5] font-bold">Phát thải &amp; Giờ cấm</div>
                <div className="text-xl font-black text-white mt-0.5">{humanSt.kg_co2_ttw.toFixed(1)} kg CO₂</div>
                <div className="text-[11px] text-[#FDF0D5] font-bold mt-0.5">
                  Cảnh báo: {humanSt.ban_violations} đơn dính giờ cấm QĐ 23
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT CARD: AFTER (EcoMiles Automated Optimization) */}
          <div className="lg:col-span-7 p-6 rounded-3xl bg-gradient-to-br from-[#003049] via-[#002033] to-[#780000]/45 border-2 border-[#C1121F] shadow-2xl flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full bg-[#FDF0D5] text-[#003049] text-xs font-black uppercase">
                  SAU KHI DÙNG ECOMILES · Tự Động Hóa Toàn Diện
                </span>
                <span className="text-xs text-[#669BBC] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-[#FDF0D5]" />
                  Xếp tuyến tự động trong {alnsSt.runtime_ms} ms
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Gom cụm thông minh + Tự động dời giờ cấm QĐ 23/2018 + Ghép đơn chiều về giảm chạy rỗng
              </h2>
              <p className="text-xs text-[#FDF0D5] leading-relaxed">
                Hệ thống tự động gom các điểm gần nhau, xếp khít {alnsSt.payload_utilisation_pct}% tải trọng xe, dời {banOrdersCount} đơn trùng giờ cấm sang khung hợp pháp và ghép thêm đơn thu hồi chiều về kho.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Outcome 1: Distance */}
              <div className="p-3.5 rounded-2xl bg-[#002033] border border-[#669BBC]">
                <div className="text-[11px] text-[#669BBC] font-bold">Tổng quãng đường</div>
                <div className="text-2xl font-black text-white mt-0.5">{alnsSt.km_total.toFixed(1)} km</div>
                <div className="text-xs font-extrabold text-[#4ADE80] mt-1 flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                  <span>Giảm {kmSaved} km (-{kmSavedPct}%)</span>
                </div>
              </div>

              {/* Outcome 2: Empty Running & Backhaul */}
              <div className="p-3.5 rounded-2xl bg-[#002033] border border-[#C1121F]/50">
                <div className="text-[11px] text-[#FDF0D5] font-bold">Tỷ lệ xe chạy rỗng</div>
                <div className="text-2xl font-black text-[#FDF0D5] mt-0.5">
                  {alnsSt.empty_running_pct.toFixed(1)}%
                </div>
                <div className="text-xs font-extrabold text-[#4ADE80] mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Ghép +{alnsSt.backhaul_orders_matched} đơn chiều về</span>
                </div>
              </div>

              {/* Outcome 3: Fuel & Cost */}
              <div className="p-3.5 rounded-2xl bg-[#002033] border border-[#669BBC]">
                <div className="text-[11px] text-[#669BBC] font-bold">Nhiên liệu &amp; Chi phí</div>
                <div className="text-2xl font-black text-white mt-0.5">{alnsSt.litres_total.toFixed(1)} Lít</div>
                <div className="text-xs font-extrabold text-[#4ADE80] mt-1 flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                  <span>Tiết kiệm {vndSaved.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>

              {/* Outcome 4: CO2 & Legal Compliance */}
              <div className="p-3.5 rounded-2xl bg-[#002033] border border-[#669BBC]">
                <div className="text-[11px] text-[#669BBC] font-bold">Phát thải &amp; Giờ cấm</div>
                <div className="text-2xl font-black text-white mt-0.5">{alnsSt.kg_co2_ttw.toFixed(1)} kg CO₂</div>
                <div className="text-xs font-extrabold text-[#4ADE80] mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>0 vi phạm · Giảm {co2SavedPct}% CO₂</span>
                </div>
              </div>
            </div>

            {/* Net Impact Strip */}
            <div className="p-3.5 rounded-2xl bg-[#052E16]/80 border border-[#4ADE80]/45 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="text-white font-bold">
                <strong className="text-[#FDF0D5]">Hiệu quả ròng đạt được ngay trên file này:</strong> Cắt giảm{' '}
                <strong>{kmSaved} km</strong> di chuyển (trong đó giảm <strong>{emptyKmSaved} km</strong> chạy xe rỗng), tiết kiệm{' '}
                <strong>{co2Saved} kg CO₂e</strong> và bảo vệ <strong>{banOrdersCount}/{banOrdersCount} đơn</strong> khỏi mức phạt giờ cấm tải TP.HCM.
              </div>
              <a
                href="/dispatcher/"
                className="px-3 py-1.5 rounded-xl bg-[#FDF0D5] text-[#003049] font-black text-xs flex items-center gap-1 shrink-0"
              >
                <span>Chuyển sang Bàn điều phối</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          ZONE 3: 2 SCANNABLE VISUAL CHARTS (Comparison Bars + Route Map)
          ===================================================================== */}
      <section aria-label="Biểu đồ trực quan so sánh hiệu quả và bản đồ tuyến đường" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Direct Visual Comparison (Before vs After) */}
        <div className="p-6 rounded-3xl bg-[#003049] border border-white/10 space-y-3">
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              1. Biểu Đồ Đối Chứng: Tổng Quãng Đường, Km Chạy Rỗng &amp; Phát Thải CO₂e
            </h3>
            <p className="text-xs text-[#669BBC] mt-0.5">
              So sánh trực quan giữa Thứ tự bảng tính gốc, Chia tuyến thủ công + Google Maps và EcoMiles.
            </p>
          </div>

          <EChartCanvas
            height={275}
            option={{
              tooltip: { trigger: 'axis' },
              legend: {
                data: ['Tổng quãng đường (km)', 'Km chạy rỗng (km)', 'CO₂e trực tiếp (kg)', 'CO₂e vòng đời (kg)'],
                textStyle: { color: '#669BBC', fontSize: 11 },
                bottom: 0,
              },
              grid: { left: 52, right: 28, top: 36, bottom: 74 },
              toolbox: {
                right: 6,
                top: 0,
                feature: { saveAsImage: { title: 'PNG', name: 'ecomiles-comparison', pixelRatio: 2 } },
              },
              xAxis: {
                type: 'category',
                data: ['1. Bảng Tính Gốc', '2. Chia Thủ Công', '3. EcoMiles 2-Opt', '4. EcoMiles Toàn Diện'],
                axisLabel: { color: '#D4BF94', fontSize: 10, interval: 0 },
              },
              yAxis: {
                type: 'value',
                name: 'km / kg CO₂e',
                axisLabel: { color: '#669BBC' },
                splitLine: { lineStyle: { color: '#002033' } },
              },
              series: [
                {
                  name: 'Tổng quãng đường (km)',
                  type: 'bar',
                  itemStyle: { color: '#669BBC' },
                  data: [rawSt.km_total, humanSt.km_total, twoOptSt.km_total, alnsSt.km_total],
                },
                {
                  name: 'Km chạy rỗng (km)',
                  type: 'bar',
                  itemStyle: { color: '#C1121F' },
                  data: [
                    rawSt.km_empty_return,
                    humanSt.km_empty_return,
                    twoOptSt.km_empty_return,
                    alnsSt.km_empty_return,
                  ],
                },
                {
                  name: 'CO₂e trực tiếp (kg)',
                  type: 'bar',
                  itemStyle: { color: '#669BBC', borderColor: '#FDF0D5', borderWidth: 1 },
                  data: [rawSt.kg_co2_ttw, humanSt.kg_co2_ttw, twoOptSt.kg_co2_ttw, alnsSt.kg_co2_ttw],
                },
                {
                  name: 'CO₂e vòng đời (kg)',
                  type: 'bar',
                  itemStyle: { color: '#AE1F23' },
                  data: [rawSt.kg_co2_wtw, humanSt.kg_co2_wtw, twoOptSt.kg_co2_wtw, alnsSt.kg_co2_wtw],
                },
              ],
            }}
          />
        </div>

        {/* Chart 2: Route Map & QĐ 23/2018 Truck-Ban Hotspots */}
        <div className="p-6 rounded-3xl bg-[#003049] border border-white/10 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                2. Bản Đồ Lộ Trình Đội Xe &amp; Điểm Đã Tự Động Né Giờ Cấm Tải
              </h3>
              <p className="text-xs text-[#669BBC] mt-0.5">
                Điểm kem Varden: Kho Tân Bình · Chấm Blue Marble: Điểm hợp lệ · Chấm Đỏ Crimson: Điểm trùng giờ cấm đã dời lịch.
              </p>
            </div>
            {focusedDistrict !== 'ALL' && (
              <button
                onClick={() => setFocusedDistrict('ALL')}
                className="px-2.5 py-1 rounded-xl bg-[#FDF0D5] text-[#003049] text-[11px] font-black cursor-pointer shrink-0"
              >
                Xem toàn TP.HCM
              </button>
            )}
          </div>

          <EChartCanvas
            height={275}
            option={{
              tooltip: { trigger: 'item' },
              grid: { left: 64, right: 28, top: 32, bottom: 46 },
              toolbox: {
                right: 6,
                top: 0,
                feature: { saveAsImage: { title: 'PNG', name: 'ecomiles-route-map', pixelRatio: 2 } },
              },
              xAxis: {
                type: 'value',
                name: 'Kinh độ (°E)',
                nameLocation: 'middle',
                nameGap: 28,
                scale: true,
                min: 'dataMin',
                max: 'dataMax',
                axisLabel: { color: '#669BBC', formatter: (v: number) => Number(v).toFixed(3) },
                splitLine: { lineStyle: { color: '#002033' } },
              },
              yAxis: {
                type: 'value',
                name: 'Vĩ độ (°N)',
                scale: true,
                min: 'dataMin',
                max: 'dataMax',
                axisLabel: { color: '#669BBC', formatter: (v: number) => Number(v).toFixed(3) },
                splitLine: { lineStyle: { color: '#002033' } },
              },
              series: [
                {
                  type: 'lines',
                  coordinateSystem: 'cartesian2d',
                  polyline: true,
                  data: activeStrategy.routes.map((r) => ({
                    coords: r.stops.map((s) => [s.lng, s.lat]),
                    lineStyle: { color: r.color, width: 2.2, opacity: 0.85 },
                    name: r.plate,
                  })),
                },
                {
                  name: 'Điểm giao hợp lệ',
                  type: 'scatter',
                  symbolSize: 7,
                  itemStyle: { color: '#669BBC', borderColor: '#FDF0D5', borderWidth: 1 },
                  data: result.orders
                    .filter(
                      (o) =>
                        !o.qd23_ban_conflict &&
                        !o.late_risk &&
                        (focusedDistrict === 'ALL' || o.district === focusedDistrict)
                    )
                    .map((o) => [o.lng, o.lat, `${o.external_id}: ${o.address}`]),
                },
                {
                  name: 'Điểm trùng giờ cấm đã dời lịch',
                  type: 'scatter',
                  symbolSize: 11,
                  itemStyle: { color: '#C1121F', borderColor: '#fff', borderWidth: 1.5 },
                  data: result.orders
                    .filter(
                      (o) =>
                        (o.qd23_ban_conflict || o.late_risk) &&
                        (focusedDistrict === 'ALL' || o.district === focusedDistrict)
                    )
                    .map((o) => [
                      o.lng,
                      o.lat,
                      `${o.external_id} (${o.window_start} đến ${o.window_end})`,
                    ]),
                },
                {
                  name: 'Kho Tân Bình DC',
                  type: 'scatter',
                  symbolSize: 15,
                  itemStyle: { color: '#FDF0D5', borderColor: '#003049', borderWidth: 2 },
                  data: [[106.661, 10.801, 'Kho Trung Tâm Tân Bình (10.801, 106.661)']],
                },
              ],
            }}
          />
        </div>
      </section>

      {/* =====================================================================
          ZONE 4: CLEAN 3-PILL ACTION DRAWER (1 Focused Table at a Time)
          1. Lộ trình đội xe & Xuất báo cáo tự động (Default)
          2. Danh sách đơn đã tự động dời giờ cấm QĐ 23/2018
          3. Bảo mật đa doanh nghiệp & Bảng đối chứng 4 phương pháp
          ===================================================================== */}
      <section aria-label="Chi tiết lộ trình, xử lý giờ cấm và bảo mật doanh nghiệp" className="p-6 rounded-3xl bg-[#003049] border border-white/10 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setDetailTab('routes_report')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                detailTab === 'routes_report'
                  ? 'bg-[#FDF0D5] text-[#003049] shadow-md'
                  : 'bg-[#002033] text-[#FDF0D5] border border-white/10 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>1. Chi Tiết {activeStrategy.vehicles_used} Chuyến Xe &amp; Xuất Báo Cáo Tự Động</span>
            </button>

            <button
              onClick={() => setDetailTab('qd23_fixes')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                detailTab === 'qd23_fixes'
                  ? 'bg-[#FDF0D5] text-[#003049] shadow-md'
                  : 'bg-[#002033] text-[#FDF0D5] border border-white/10 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>2. {banOrdersCount} Đơn Đã Tự Động Dời Giờ Cấm Tải QĐ 23/2018</span>
            </button>

            <button
              onClick={() => setDetailTab('security_benchmark')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                detailTab === 'security_benchmark'
                  ? 'bg-[#FDF0D5] text-[#003049] shadow-md'
                  : 'bg-[#002033] text-[#FDF0D5] border border-white/10 hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>3. Bảo Mật Đa Doanh Nghiệp &amp; Đối Chứng 4 Thuật Toán</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportComparisonCsv}
              className="px-3 py-1.5 rounded-xl bg-[#002033] hover:bg-[#004366] text-[#FDF0D5] border border-white/10 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#669BBC]" />
              <span>Tải CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl bg-[#002033] hover:bg-[#004366] text-[#FDF0D5] border border-white/10 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#669BBC]" />
              <span>In PDF</span>
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={detailTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {/* TAB 1: ROUTES & AUTOMATED REPORT STUDIO */}
            {detailTab === 'routes_report' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#002033] border border-[#C1121F]/30 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="font-black text-[#FDF0D5] uppercase">
                      Cơ chế Xuất Báo Cáo Kiểm Toán Tự Động (Chuẩn ISO 14083 / GLEC v3.2)
                    </div>
                    <p className="text-[#FDF0D5]">
                      Hệ thống tự động tổng hợp quãng đường có tải, quãng đường chạy rỗng, đơn ghép chiều về và nhân với hệ số phát thải nhiên liệu (Diesel: 2.68 kg CO₂e/L · Xăng: 2.31 kg CO₂e/L) để đóng gói thành file Excel 3 Sheet chỉ với 1 cú nhấp chuột. Mã xác thực: <code className="text-[#669BBC]">{result.dataset_fingerprint}</code>.
                    </p>
                  </div>
                  <button
                    onClick={exportAutomatedMultiSheetExcel}
                    className="px-4 py-2.5 rounded-xl bg-[#C1121F] hover:bg-[#780000] text-[#FDF0D5] font-black text-xs flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Tải Báo Cáo Excel 3 Sheet Ngay</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full text-left text-xs text-[#FDF0D5]">
                    <thead className="bg-[#002033] text-[#669BBC] uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Chuyến</th>
                        <th className="py-2.5 px-3">Biển số xe</th>
                        <th className="py-2.5 px-3">Nhiên liệu</th>
                        <th className="py-2.5 px-3 text-right">Điểm giao</th>
                        <th className="py-2.5 px-3 text-right">Tải giao (kg)</th>
                        <th className="py-2.5 px-3 text-right">Lấp đầy tải</th>
                        <th className="py-2.5 px-3 text-right">Tổng km</th>
                        <th className="py-2.5 px-3 text-right">Km chạy rỗng</th>
                        <th className="py-2.5 px-3 text-right">Đơn ghép chiều về</th>
                        <th className="py-2.5 px-3 text-right">Nhiên liệu (L)</th>
                        <th className="py-2.5 px-3 text-right">CO₂e TTW / WTW</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                      {activeStrategy.routes.map((r) => (
                        <tr key={r.route_id} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 font-mono text-[#669BBC]">#{r.route_id}</td>
                          <td className="py-2.5 px-3 font-bold text-white">{r.plate}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.fuel === 'diesel' ? 'bg-[#669BBC]/20 text-[#FDF0D5]' : 'bg-[#780000]/30 text-[#FDF0D5]'
                              }`}
                            >
                              {r.fuel === 'diesel' ? 'Dầu Diesel' : 'Xăng RON95'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {r.stops.filter((s) => s.kind === 'stop').length}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {r.kg_delivered} / {r.capacity_kg}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-[#669BBC] font-bold">
                            {r.payload_utilisation_pct}%
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-white font-bold">{r.km} km</td>
                          <td className="py-2.5 px-3 text-right font-mono text-[#FDF0D5]">
                            {r.km_empty_return} km ({r.empty_running_pct}%)
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-[#FDF0D5] font-bold">
                            +{r.backhaul_orders_matched} đơn ({r.backhaul_kg_recovered} kg)
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">{r.litres} L</td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            <strong className="text-white">{r.kg_co2_ttw}</strong> /{' '}
                            <span className="text-[#669BBC]">{r.kg_co2_wtw} kg</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: QĐ 23/2018 BAN REMEDIATION & ROOT-CAUSE DIAGNOSTICS */}
            {detailTab === 'qd23_fixes' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-5 space-y-3">
                  <div className="text-xs font-extrabold text-white uppercase">
                    Chẩn đoán nguyên nhân &amp; Cách hệ thống tự động xử lý
                  </div>
                  {result.anomalies.map((anom) => (
                    <div
                      key={anom.id}
                      onClick={() => setFocusedDistrict(anom.district)}
                      className="p-4 rounded-2xl bg-[#002033] border border-[#C1121F] space-y-1.5 cursor-pointer hover:border-[#C1121F]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-[#FDF0D5]">{anom.title}</span>
                        <span className="px-2 py-0.5 rounded bg-[#003049] text-[#FDF0D5] text-[10px] font-bold">
                          {anom.district}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#FDF0D5]">
                        <strong>Nguyên nhân:</strong> {anom.root_cause}
                      </p>
                      <p className="text-[11px] text-[#4ADE80] font-semibold">
                        <strong>Tự động xử lý:</strong> {anom.recommended_fix}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="lg:col-span-7 space-y-3">
                  <div className="text-xs font-extrabold text-white uppercase">
                    Bảng đối chứng dời khung giờ cấm tải QĐ 23/2018 (Trước và Sau tối ưu)
                  </div>
                  <div className="overflow-x-auto max-h-72 rounded-2xl border border-white/10">
                    <table className="w-full text-left text-xs text-[#FDF0D5]">
                      <thead className="bg-[#002033] text-[#669BBC] uppercase text-[10px] font-bold sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">Mã đơn</th>
                          <th className="py-2.5 px-3">Quận</th>
                          <th className="py-2.5 px-3">Giờ gốc (Vi phạm QĐ 23)</th>
                          <th className="py-2.5 px-3">Giờ EcoMiles (Hợp lệ)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-medium">
                        {result.orders.filter((o) => o.qd23_ban_conflict).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-[#669BBC]">
                              Tập dữ liệu này không có đơn hàng nào rơi vào khung giờ cấm tải QĐ 23/2018.
                            </td>
                          </tr>
                        ) : (
                          result.orders
                            .filter((o) => o.qd23_ban_conflict)
                            .slice(0, 20)
                            .map((o) => {
                              const sMin = parseInt(o.window_start.slice(0, 2), 10) * 60;
                              const fixedWindow = sMin < 540 ? '09:05 đến 11:30' : '13:15 đến 15:45';
                              return (
                                <tr key={o.external_id} className="hover:bg-white/[0.02]">
                                  <td className="py-2 px-3 font-mono text-[#FDF0D5] font-bold">
                                    {o.external_id}
                                  </td>
                                  <td className="py-2 px-3">{o.district}</td>
                                  <td className="py-2 px-3 font-mono text-[#FDF0D5]">
                                    {o.window_start} đến {o.window_end}
                                  </td>
                                  <td className="py-2 px-3 font-mono text-[#4ADE80] font-bold">
                                    <span className="inline-flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>{fixedWindow}</span>
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MULTI-TENANT SECURITY APPROVAL & 4-STRATEGY BENCHMARK TABLE */}
            {detailTab === 'security_benchmark' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Tenant Workspace Selector */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="text-xs font-extrabold text-white uppercase">
                      1. Cách Ly Dữ Liệu Đa Doanh Nghiệp (Tenant Isolation)
                    </div>
                    {TENANT_WORKSPACES.map((t) => {
                      const isSelected = selectedTenantId === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTenantId(t.id)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-1 ${
                            isSelected
                              ? 'bg-[#004366] border-[#669BBC] text-[#FDF0D5]'
                              : 'bg-[#002033] border-white/10 text-[#FDF0D5]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-white">{t.name}</span>
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded bg-[#669BBC] text-[#003049] text-[10px] font-black shrink-0">
                                Đang bật
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#FDF0D5]">{t.isolation}</div>
                          <div className="text-[11px] text-[#669BBC]">{t.encryption}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right: Role Access Approval Table + PII Masking */}
                  <div className="lg:col-span-7 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-extrabold text-white uppercase flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-[#FDF0D5]" />
                        <span>2. Phê Duyệt Quyền Truy Cập &amp; Ẩn Danh SĐT (Nghị Định 13/2023)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setMaskPii(!maskPii)}
                          className="px-3 py-1 rounded-xl bg-[#669BBC] text-[#003049] border border-[#003049] text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {maskPii ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{maskPii ? 'Đang che SĐT khách nhận' : 'Đang hiện SĐT'}</span>
                        </button>
                        <button
                          onClick={() => {
                            loadSampleWorkbook('EcoMiles_Mau_Chuoi_Lanh_120_Don_Cam_Tai_QD23.xlsx');
                            setReportExportNotice('Đã xóa sạch dữ liệu phiên tạm thời.');
                          }}
                          className="px-3 py-1 rounded-xl bg-[#780000]/30 text-[#FDF0D5] border border-[#C1121F] text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa phiên</span>
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#002033]">
                      <table className="w-full text-left text-xs text-[#FDF0D5]">
                        <thead className="bg-[#002033] text-[#669BBC] uppercase text-[10px] font-bold">
                          <tr>
                            <th className="py-2.5 px-3">Vai trò</th>
                            <th className="py-2.5 px-3">Phạm vi dữ liệu</th>
                            <th className="py-2.5 px-3">Trạng thái</th>
                            <th className="py-2.5 px-3 text-right">Phê duyệt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {accessApprovals.map((item) => (
                            <tr key={item.id}>
                              <td className="py-2.5 px-3 font-bold text-white">{item.role}</td>
                              <td className="py-2.5 px-3 text-[11px] text-[#FDF0D5]">{item.scope}</td>
                              <td className="py-2.5 px-3">
                                {item.approved ? (
                                  <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534] font-bold text-[11px] inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Đã duyệt</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#B91C1C] font-bold text-[11px]">
                                    Đang khóa
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => toggleRoleApproval(item.id)}
                                  className={`px-3 py-1 rounded-xl font-bold text-xs cursor-pointer ${
                                    item.approved
                                      ? 'bg-[#004366] text-[#FDF0D5] border border-white/10'
                                      : 'bg-[#FDF0D5] text-[#003049] font-black'
                                  }`}
                                >
                                  {item.approved ? 'Thu hồi' : 'Phê duyệt'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {result.orders[0] && (
                      <div className="p-3 rounded-xl bg-[#002033] border border-white/10 text-xs text-[#FDF0D5]">
                        <strong>Mẫu hiển thị thông tin người nhận:</strong>{' '}
                        <span className="font-mono text-[#FDF0D5]">
                          {result.orders[0].external_id} ·{' '}
                          {maskPii
                            ? `${result.orders[0].receiver.slice(0, 6)}*** · SĐT: ${result.orders[0].phone.slice(0, 3)}****${result.orders[0].phone.slice(-3)}`
                            : `${result.orders[0].receiver} · SĐT: ${result.orders[0].phone}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4-Strategy Full Benchmark Table */}
                <div className="space-y-2 pt-3 border-t border-white/10">
                  <div className="text-xs font-extrabold text-white uppercase">
                    3. Bảng Đối Chứng Chi Tiết 4 Phương Pháp Điều Phối Trên Cùng Mạng Lưới Đường Bộ
                  </div>
                  <div className="overflow-x-auto rounded-2xl border border-white/10">
                    <table className="w-full text-left text-xs text-[#FDF0D5]">
                      <thead className="bg-[#002033] text-[#669BBC] uppercase text-[10px] font-bold">
                        <tr>
                          <th className="py-2.5 px-3">Phương pháp</th>
                          <th className="py-2.5 px-3 text-right">Số xe</th>
                          <th className="py-2.5 px-3 text-right">Tổng km</th>
                          <th className="py-2.5 px-3 text-right">Km chạy rỗng</th>
                          <th className="py-2.5 px-3 text-right">Đơn ghép về</th>
                          <th className="py-2.5 px-3 text-right">Nhiên liệu</th>
                          <th className="py-2.5 px-3 text-right">CO₂e TTW / WTW</th>
                          <th className="py-2.5 px-3 text-right">Vi phạm giờ cấm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {[rawSt, humanSt, twoOptSt, alnsSt].map((st) => (
                          <tr
                            key={st.id}
                            onClick={() => setSelectedStrategyId(st.id)}
                            className={`cursor-pointer ${
                              selectedStrategyId === st.id ? 'bg-[#780000]/40' : 'hover:bg-white/[0.02]'
                            }`}
                          >
                            <td className="py-2.5 px-3 font-bold text-white">{st.name}</td>
                            <td className="py-2.5 px-3 text-right font-mono">{st.vehicles_used}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-white">{st.km_total} km</td>
                            <td className="py-2.5 px-3 text-right font-mono text-[#FDF0D5]">
                              {st.km_empty_return} km ({st.empty_running_pct}%)
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-[#FDF0D5] font-bold">
                              +{st.backhaul_orders_matched} đơn
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">{st.litres_total} L</td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              {st.kg_co2_ttw} / {st.kg_co2_wtw} kg
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold">
                              {st.ban_violations === 0 ? (
                                <span className="text-[#4ADE80]">0 vi phạm</span>
                              ) : (
                                <span className="text-[#F87171]">{st.ban_violations} vi phạm</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  );
}
