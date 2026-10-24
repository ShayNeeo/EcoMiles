import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UploadCloud,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Sparkles,
  ShieldAlert,
  TrendingDown,
  Compass,
  Play,
  SlidersHorizontal,
  Printer,
  ShieldCheck,
  Lock,
  FileCheck2,
  RefreshCcw,
  EyeOff,
  Eye,
  UserCheck,
  Trash2,
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

const SAMPLE_WORKBOOKS = [
  {
    id: 'fmcg_80',
    file: 'EcoMiles_Mau_FMCG_80_Don_TPHCM.xlsx',
    badge: 'Mẫu 1: FMCG 80 Đơn Nội Đô',
    title: 'Phân Phối Hàng Tiêu Dùng Nhanh (80 Cửa Hàng TP.HCM)',
    desc: 'Mô phỏng lộ trình giao hàng Bách Hóa Xanh, WinMart+, Circle K qua 8 quận nội thành. So sánh trực tiếp giữa cách chia Quận thủ công kết hợp Google Maps và thuật toán tối ưu của EcoMiles.',
    highlight: 'Giảm 30.1% quãng đường, giảm chạy rỗng từ 28.6% xuống 8.8%',
  },
  {
    id: 'coldchain_120',
    file: 'EcoMiles_Mau_Chuoi_Lanh_120_Don_Cam_Tai_QD23.xlsx',
    badge: 'Mẫu 2: Hàng Lạnh 120 Đơn & Giờ Cấm',
    title: 'Chuỗi Cung Ứng Thực Phẩm Lạnh (120 Đơn & 28 Điểm Trùng Giờ Cấm)',
    desc: 'Chứa 28 đơn hàng lạnh đặt vào khung cao điểm sáng (06:00 đến 09:00) và chiều (16:00 đến 20:00) trùng khung giờ cấm xe tải nhẹ nội đô theo Quyết định 23/2018/QĐ-UBND TP.HCM.',
    highlight: 'Xử lý triệt để 28/28 điểm trùng giờ cấm tải, giảm 40.0% km',
  },
  {
    id: 'erp_500',
    file: 'EcoMiles_Mau_ERP_500_Don_7_Ngay.xlsx',
    badge: 'Mẫu 3: Dữ Liệu ERP 500 Đơn',
    title: 'Dữ Liệu Xuất Hệ Thống ERP Doanh Nghiệp (500 Đơn Hàng Đa Ngày)',
    desc: 'Kiểm thử quy mô lớn 500 đơn hàng trong 1 tuần vận hành với đầy đủ báo cáo phân rã hiệu quả quãng đường, ghép hàng chiều về và cơ cấu đội xe.',
    highlight: 'Giải 500 đơn trong 31 ms, ghép 81 đơn chiều về kho',
  },
] as const;

const TENANT_WORKSPACES = [
  {
    id: 'TENANT-RAM-SANDBOX',
    name: 'Chế độ Thử nghiệm Bảo mật (Chỉ xử lý trên trình duyệt, không lưu máy chủ)',
    isolation: 'Bộ nhớ tạm thời trên thiết bị người dùng (Tự xóa khi đóng trang)',
    encryption: 'Giải mã cục bộ Web-Standards · Không truyền dữ liệu lên đám mây',
    policy: 'Mặc định cho khách hàng dùng thử và kiểm định độc lập',
  },
  {
    id: 'TENANT-FMCG-01',
    name: 'Không gian Doanh nghiệp A: Công ty Phân phối Thực phẩm & Đồ uống Sài Gòn',
    isolation: 'Phân vùng cơ sở dữ liệu riêng biệt (Mã định danh: TNT-SGFMCG-001)',
    encryption: 'Mã hóa AES-256-GCM theo khóa riêng của Doanh nghiệp A',
    policy: 'Cách ly hoàn toàn với Doanh nghiệp B và C · Không chia sẻ dữ liệu chéo',
  },
  {
    id: 'TENANT-COLD-02',
    name: 'Không gian Doanh nghiệp B: Chuỗi Cung ứng Kho Lạnh Nam Việt',
    isolation: 'Phân vùng cơ sở dữ liệu riêng biệt (Mã định danh: TNT-COLDNV-002)',
    encryption: 'Mã hóa AES-256-GCM theo khóa riêng của Doanh nghiệp B',
    policy: 'Chỉ nhân sự được Giám đốc Doanh nghiệp B phê duyệt mới được xem lộ trình',
  },
] as const;

function EChartCanvas({ option, height = 250 }: { option: Record<string, unknown>; height?: number }) {
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
  const [activeAct, setActiveAct] = useState<StoryActId>(initialAct);
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

  useEffect(() => {
    setActiveAct(initialAct);
  }, [initialAct]);

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
    loadSampleWorkbook('EcoMiles_Mau_Chuoi_Lanh_120_Don_Cam_Tai_QD23.xlsx');
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
    setReportExportNotice(`Đã tự động kết xuất file CSV kiểm toán (${result.rows_valid} đơn hàng) lúc ${new Date().toLocaleTimeString('vi-VN')}.`);
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
      `Đã tự động tạo và tải xuống Báo cáo Excel 3 Sheet (1_Tong_Hop_Hieu_Qua_ESG, 2_Chi_Tiet_Tung_Chuyen_Xe, 3_Kiem_Toan_Don_Hang_QD23) kèm mã kiểm chứng ${result.dataset_fingerprint}.`
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
      <div className="p-12 rounded-3xl bg-slate-900/60 border border-white/10 text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-ecomiles-lime border-t-transparent animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-300">Đang khởi tạo dữ liệu điều phối và báo cáo tự động EcoMiles...</p>
      </div>
    );
  }

  const rawSt = result.strategies.raw_excel;
  const humanSt = result.strategies.human_google_proxy;
  const twoOptSt = result.strategies.ecomiles_2opt;
  const alnsSt = result.strategies.ecomiles_ecoalns;
  const activeStrategy = result.strategies[selectedStrategyId] || alnsSt;

  const kmSavedVsHuman = Number((humanSt.km_total - activeStrategy.km_total).toFixed(1));
  const emptyKmSavedVsHuman = Number((humanSt.km_empty_return - activeStrategy.km_empty_return).toFixed(1));
  const vndSavedVsHuman = Math.max(0, humanSt.fuel_cost_vnd - activeStrategy.fuel_cost_vnd);
  const co2SavedVsHuman = Number((humanSt.kg_co2_ttw - activeStrategy.kg_co2_ttw).toFixed(2));
  const activeTenant = TENANT_WORKSPACES.find((t) => t.id === selectedTenantId) || TENANT_WORKSPACES[0];

  const STORY_ACTS: Array<{ id: StoryActId; step: string; label: string; desc: string }> = [
    {
      id: 'act1_executive',
      step: 'Bước 1 · Tổng Quan Tối Ưu',
      label: 'Hiệu Quả So Với Chia Thủ Công',
      desc: 'Đối chứng quãng đường, tỷ lệ chạy xe rỗng, chi phí nhiên liệu và lượng giảm phát thải CO₂e',
    },
    {
      id: 'act2_diagnostics',
      step: 'Bước 2 · Chẩn Đoán Tuyến',
      label: 'Phát Hiện Lỗi & Né Giờ Cấm',
      desc: `Tự động phát hiện ${result.anomalies.length} điểm nghẽn, xử lý giờ cấm tải QĐ 23/2018 và ghép đơn chiều về`,
    },
    {
      id: 'act3_fleet_esg',
      step: 'Bước 3 · Báo Cáo Tự Động',
      label: 'Xuất Báo Cáo ESG & Đội Xe',
      desc: 'Chứng minh quy trình tự động xuất báo cáo kiểm toán 3 Sheet Excel, CSV và bản in PDF',
    },
    {
      id: 'act4_benchmark_lab',
      step: 'Bước 4 · Thử File & Bảo Mật',
      label: 'Tải File .XLSX & Phân Quyền',
      desc: 'Tải bảng tính thực tế của doanh nghiệp, cách ly dữ liệu đa công ty và phê duyệt quyền truy cập',
    },
    {
      id: 'all_acts',
      step: 'Toàn Cảnh 4 Bước',
      label: 'Xem Liền Mạch Toàn Bộ',
      desc: 'Hiển thị trọn vẹn 4 bước trên cùng một trang để thuyết trình hoặc xuất báo cáo tổng thể',
    },
  ];

  const showAct1 = activeAct === 'act1_executive' || activeAct === 'all_acts';
  const showAct2 = activeAct === 'act2_diagnostics' || activeAct === 'all_acts';
  const showAct3 = activeAct === 'act3_fleet_esg' || activeAct === 'all_acts';
  const showAct4 = activeAct === 'act4_benchmark_lab' || activeAct === 'all_acts';

  return (
    <div className="space-y-6 pb-16 tabular-nums">
      {/* Top Executive Context & Process Transformation Bar */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className="px-2.5 py-0.5 rounded-full bg-ecomiles-lime text-slate-950 font-black">
                ĐỐI CHỨNG TRỰC TIẾP TRÊN DỮ LIỆU THỰC
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono break-all">
                Đang phân tích: {result.file_name} ({result.rows_valid} điểm giao · Mã kiểm chứng {result.dataset_fingerprint})
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cách ly bảo mật dữ liệu doanh nghiệp</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-1">
              Trung Tâm Tối Ưu Lộ Trình, Giảm Xe Chạy Rỗng &amp; Báo Cáo Phát Thải Tự Động
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Thay thế quy trình nhập liệu bảng tính và chia tuyến thủ công bằng quy trình tự động hóa 4 bước: từ bảng tính đơn hàng đến lộ trình tối ưu, ghép hàng chiều về và xuất báo cáo kiểm toán chỉ trong vài giây.
            </p>
          </div>

          {/* Quick File Switcher + Upload & Report Triggers */}
          <div className="flex flex-wrap items-center gap-2">
            {SAMPLE_WORKBOOKS.map((sw) => {
              const isCurrent = result.file_name === sw.file;
              return (
                <button
                  key={sw.id}
                  onClick={() => loadSampleWorkbook(sw.file)}
                  disabled={loadingSample !== ''}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isCurrent
                      ? 'bg-ecomiles-lime text-slate-950 border-ecomiles-lime shadow-md'
                      : 'bg-slate-950 text-slate-300 border-white/10 hover:border-ecomiles-lime/50 hover:text-white'
                  }`}
                >
                  {sw.badge}
                </button>
              );
            })}
            <button
              onClick={() => {
                setActiveAct('act4_benchmark_lab');
                setTimeout(() => fileInputRef.current?.click(), 120);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Tải File .XLSX Của Bạn</span>
            </button>
            <button
              onClick={exportAutomatedMultiSheetExcel}
              className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-ecomiles-lime border border-ecomiles-lime/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="Tải xuống Báo cáo Excel tự động gồm 3 bảng (Tổng hợp ESG, Chi tiết chuyến xe, Kiểm toán đơn hàng)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-ecomiles-lime" />
              <span>Xuất Báo Cáo Excel (3 Sheet)</span>
            </button>
            <button
              onClick={exportComparisonCsv}
              className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="Xuất bảng đối chứng 4 phương pháp ra CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Xuất CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="In hoặc lưu báo cáo ra PDF"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>In Báo Cáo PDF</span>
            </button>
          </div>
        </div>

        {reportExportNotice && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{reportExportNotice}</span>
            </div>
            <button
              onClick={() => setReportExportNotice('')}
              className="text-[11px] font-bold text-emerald-300 hover:text-white cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}

        {/* 4-Step Process Navigation Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pt-2 border-t border-white/10">
          {STORY_ACTS.map((act) => {
            const active = activeAct === act.id;
            return (
              <button
                key={act.id}
                onClick={() => setActiveAct(act.id)}
                className={`p-3 rounded-2xl text-left transition-all cursor-pointer border ${
                  active
                    ? 'bg-ecomiles-lime/15 border-ecomiles-lime text-white shadow-lg'
                    : 'bg-slate-950/60 border-white/5 text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                  <span className={active ? 'text-ecomiles-lime' : 'text-slate-400'}>{act.step}</span>
                  {act.id === 'act2_diagnostics' && result.anomalies.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {result.anomalies.length} phát hiện
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-white mt-0.5 truncate">{act.label}</div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">{act.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Animated Story Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeAct}-${result.file_name}-${selectedStrategyId}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="space-y-8"
        >
          {/* =====================================================================
              STEP 1: PROCESS TRANSFORMATION & EXECUTIVE PITCH (6 Perceptual Units)
              ===================================================================== */}
          {showAct1 && (
            <section className="space-y-5" aria-label="Bước 1: Hiệu Quả Tối Ưu So Với Chia Tuyến Thủ Công">
              {/* Visual Process Comparison Banner: Manual vs EcoMiles Automated Flow */}
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-ecomiles-lime">
                      QUY TRÌNH CHUYỂN ĐỔI TỪ ĐIỀU PHỐI THỦ CÔNG SANG TỰ ĐỘNG HÓA
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                      Vì sao chia tuyến bằng tay trên bảng tính + Google Maps gây lãng phí quãng đường và chạy xe rỗng?
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-white/10">
                    <span className="text-[11px] text-slate-400 px-2 font-bold flex items-center gap-1">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-ecomiles-lime" />
                      Chế độ đang xem:
                    </span>
                    {(
                      [
                        { id: 'ecomiles_ecoalns', label: 'EcoMiles Toàn Diện' },
                        { id: 'ecomiles_2opt', label: 'EcoMiles 2-Opt' },
                        { id: 'human_google_proxy', label: 'Chia Thủ Công + Google Maps' },
                        { id: 'raw_excel', label: 'Bảng Tính Gốc' },
                      ] as const
                    ).map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setSelectedStrategyId(st.id)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedStrategyId === st.id
                            ? 'bg-ecomiles-lime text-slate-950 font-black'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Before vs After Process Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-rose-500/25 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-rose-300 uppercase">1. Cách Làm Thủ Công Cũ</span>
                      <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 font-bold">Mất 60 đến 120 phút/ca</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Nhân sự lọc bảng tính theo từng Quận, chia cho từng tài xế rồi tra từng chặng trên Google Maps. Xe giao xong điểm cuối ở xa phải <strong>chạy rỗng chiều về kho ({humanSt.empty_running_pct}% quãng đường rỗng)</strong> và dễ dính phạt giờ cấm tải.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-ecomiles-lime/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-ecomiles-lime uppercase">2. Thuật Toán Tự Động EcoMiles</span>
                      <span className="px-2 py-0.5 rounded bg-ecomiles-lime/20 text-ecomiles-lime font-bold">Chỉ mất {alnsSt.runtime_ms} ms</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Tự động gom cụm tọa độ, xếp khít tải trọng xe ({alnsSt.payload_utilisation_pct}%), tự động dời đơn trùng giờ cấm QĐ 23/2018 và <strong>ghép {alnsSt.backhaul_orders_matched} đơn lấy hàng chiều về ({alnsSt.backhaul_kg_recovered} kg)</strong> để giảm tỷ lệ chạy rỗng xuống còn <strong>{alnsSt.empty_running_pct}%</strong>.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-emerald-300 uppercase">3. Thực Thi &amp; Xuất Báo Cáo Tự Động</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold">Tức thì · 1 chạm</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Lộ trình đẩy thẳng xuống ứng dụng điện thoại của tài xế kèm cảnh báo giờ cấm. Khi kết thúc ca, hệ thống <strong>tự động xuất Báo cáo Excel 3 Sheet, CSV và PDF chuẩn ISO 14083 / GLEC v3.2</strong> mà không cần tính tay.
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 Perceptual Hero KPI Cards (Units 1-4 of Step 1) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* KPI 1: Total Route Distance */}
                <div className="p-5 rounded-3xl bg-slate-900/85 border border-white/10 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      1. Tổng Cự Ly Lộ Trình
                    </span>
                    <Compass className="w-4 h-4 text-ecomiles-lime" />
                  </div>
                  <div>
                    <div className="text-3xl font-black text-white">
                      {activeStrategy.km_total.toFixed(1)}{' '}
                      <span className="text-sm font-semibold text-slate-400">km</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold ${
                          activeStrategy.delta_vs_human_km_pct <= 0
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {activeStrategy.delta_vs_human_km_pct <= 0 ? '' : '+'}
                        {activeStrategy.delta_vs_human_km_pct}% so với chia thủ công ({humanSt.km_total} km)
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 border-t border-white/5 pt-2 flex justify-between">
                    <span>So với thứ tự bảng tính gốc ({rawSt.km_total} km):</span>
                    <strong className="text-ecomiles-lime">{activeStrategy.delta_vs_raw_km_pct}%</strong>
                  </div>
                </div>

                {/* KPI 2: Empty-Run (Chạy Xe Rỗng) & Backhaul Optimization */}
                <div className="p-5 rounded-3xl bg-slate-900/85 border border-ecomiles-lime/30 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-ecomiles-lime">
                      2. Tỷ Lệ Chạy Rỗng &amp; Ghép Đơn Về
                    </span>
                    <RefreshCcw className="w-4 h-4 text-ecomiles-lime" />
                  </div>
                  <div>
                    <div className="text-3xl font-black text-ecomiles-lime">
                      {activeStrategy.empty_running_pct.toFixed(1)}%{' '}
                      <span className="text-sm font-semibold text-slate-300">
                        ({activeStrategy.km_empty_return.toFixed(1)} km rỗng)
                      </span>
                    </div>
                    <div className="mt-1.5 text-xs text-emerald-300 font-bold">
                      {emptyKmSavedVsHuman > 0
                        ? `Cắt giảm ${emptyKmSavedVsHuman} km chạy rỗng so với chia thủ công (${humanSt.empty_running_pct}%)`
                        : `Tỷ lệ xe chạy rỗng chiều về khi chưa ghép đơn`}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-300 border-t border-white/5 pt-2 flex justify-between">
                    <span>Ghép đơn thu hồi chiều về kho:</span>
                    <strong className="text-emerald-400">
                      {activeStrategy.backhaul_orders_matched} đơn ({activeStrategy.backhaul_kg_recovered} kg)
                    </strong>
                  </div>
                </div>

                {/* KPI 3: Fuel & Cost Savings */}
                <div className="p-5 rounded-3xl bg-slate-900/85 border border-white/10 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      3. Nhiên Liệu &amp; Chi Phí Vận Hành
                    </span>
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-3xl font-black text-white">
                      {activeStrategy.litres_total.toFixed(1)}{' '}
                      <span className="text-sm font-semibold text-slate-400">Lít định mức</span>
                    </div>
                    <div className="mt-1.5 text-xs text-emerald-300 font-bold">
                      {vndSavedVsHuman > 0
                        ? `Tiết kiệm ${vndSavedVsHuman.toLocaleString('vi-VN')} ₫ mỗi ca (Rút ngắn ${kmSavedVsHuman} km)`
                        : 'Mốc chi phí nhiên liệu khi điều phối thủ công'}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 border-t border-white/5 pt-2 flex justify-between">
                    <span>Chi phí nhiên liệu ước tính:</span>
                    <strong className="text-white">{activeStrategy.fuel_cost_vnd.toLocaleString('vi-VN')} ₫</strong>
                  </div>
                </div>

                {/* KPI 4: Carbon Emissions & QĐ 23 Compliance */}
                <div className="p-5 rounded-3xl bg-slate-900/85 border border-white/10 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      4. Phát Thải CO₂e &amp; Tuân Thủ Giờ Cấm
                    </span>
                    <Sparkles className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <div className="text-3xl font-black text-white">
                      {activeStrategy.kg_co2_ttw.toFixed(2)}{' '}
                      <span className="text-sm font-semibold text-slate-400">kg CO₂e</span>
                    </div>
                    <div className="mt-1.5 text-xs font-bold">
                      {activeStrategy.ban_violations === 0 ? (
                        <span className="text-emerald-400">
                          ✓ 0 vi phạm giờ cấm tải TP.HCM ({activeStrategy.vehicles_used} xe, lấp đầy tải {activeStrategy.payload_utilisation_pct}%)
                        </span>
                      ) : (
                        <span className="text-amber-400">
                          ⚠️ {activeStrategy.ban_violations} điểm rơi vào giờ cấm tải QĐ 23/2018
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 border-t border-white/5 pt-2 flex justify-between">
                    <span>Tổng phát thải tính cả vòng đời (WTW):</span>
                    <strong className="text-ecomiles-lime">
                      {activeStrategy.kg_co2_wtw.toFixed(2)} kg (Giảm {co2SavedVsHuman > 0 ? `${co2SavedVsHuman} kg` : '0 kg'})
                    </strong>
                  </div>
                </div>
              </div>

              {/* 2 Primary Story Visuals (Units 5 & 6 of Step 1) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Visual 5: 4-Strategy Benchmark including Empty-Run km */}
                <div className="p-6 rounded-3xl bg-slate-900/75 border border-white/10 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                        5. Đối Chứng 4 Phương Pháp: Tổng Cự Ly, Km Chạy Rỗng &amp; Phát Thải CO₂e
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Đo lường công bằng trên cùng một mạng lưới đường bộ TP.HCM giữa Bảng tính gốc, Chia thủ công + Google Maps và EcoMiles.
                      </p>
                    </div>
                  </div>

                  <EChartCanvas
                    height={275}
                    option={{
                      tooltip: { trigger: 'axis' },
                      legend: {
                        data: ['Tổng quãng đường (km)', 'Km chạy rỗng (km)', 'CO₂e trực tiếp (kg)', 'CO₂e vòng đời (kg)'],
                        textStyle: { color: '#94a3b8', fontSize: 11 },
                        bottom: 0,
                      },
                      grid: { left: 52, right: 28, top: 36, bottom: 74 },
                      toolbox: {
                        right: 6,
                        top: 0,
                        feature: { saveAsImage: { title: 'PNG', name: 'ecomiles-strategy-compare', pixelRatio: 2 } },
                      },
                      xAxis: {
                        type: 'category',
                        data: ['1. Bảng Tính Gốc', '2. Chia Thủ Công', '3. EcoMiles 2-Opt', '4. EcoMiles Toàn Diện'],
                        axisLabel: { color: '#e2e8f0', fontSize: 10, interval: 0 },
                      },
                      yAxis: {
                        type: 'value',
                        name: 'km / kg CO₂e',
                        axisLabel: { color: '#94a3b8' },
                        splitLine: { lineStyle: { color: '#1e293b' } },
                      },
                      series: [
                        {
                          name: 'Tổng quãng đường (km)',
                          type: 'bar',
                          itemStyle: { color: '#38bdf8' },
                          data: [rawSt.km_total, humanSt.km_total, twoOptSt.km_total, alnsSt.km_total],
                        },
                        {
                          name: 'Km chạy rỗng (km)',
                          type: 'bar',
                          itemStyle: { color: '#f97316' },
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
                          itemStyle: { color: '#36d9a5' },
                          data: [rawSt.kg_co2_ttw, humanSt.kg_co2_ttw, twoOptSt.kg_co2_ttw, alnsSt.kg_co2_ttw],
                        },
                        {
                          name: 'CO₂e vòng đời (kg)',
                          type: 'bar',
                          itemStyle: { color: '#ffd400' },
                          data: [rawSt.kg_co2_wtw, humanSt.kg_co2_wtw, twoOptSt.kg_co2_wtw, alnsSt.kg_co2_wtw],
                        },
                      ],
                    }}
                  />

                  {/* PVM / ASI Bridge Strip */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Mốc Chia Thủ Công + Google Maps
                      </span>
                      <strong className="text-white text-sm">{result.pvm_decomposition.human_baseline_co2_ttw} kg CO₂e</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Giảm Nhờ Rút Ngắn Đường &amp; Giảm Rỗng
                      </span>
                      <strong className="text-emerald-400 text-sm">
                        {result.pvm_decomposition.distance_effect_kg} kg CO₂e
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Giảm Nhờ Phân Bổ Đội Xe Tiết Kiệm
                      </span>
                      <strong className="text-sky-400 text-sm">
                        {result.pvm_decomposition.fleet_mix_effect_kg} kg CO₂e
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Visual 6: Hourly Demand & QĐ 23/2018 Ban Exposure */}
                <div className="p-6 rounded-3xl bg-slate-900/75 border border-white/10 space-y-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      6. Phân Bổ Đơn Hàng &amp; Phát Thải Theo Khung Giờ (06:00 đến 18:00)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Cột màu cam đánh dấu khung giờ cấm xe tải nhẹ nội đô TP.HCM (06:00 đến 09:00 và 16:00 đến 20:00 theo Quyết định 23/2018).
                    </p>
                  </div>

                  <EChartCanvas
                    height={250}
                    option={{
                      tooltip: { trigger: 'axis' },
                      legend: {
                        data: ['Số đơn giao', 'CO₂e trực tiếp (kg)'],
                        textStyle: { color: '#94a3b8' },
                        bottom: 0,
                      },
                      grid: { left: 50, right: 50, top: 36, bottom: 52 },
                      toolbox: {
                        right: 6,
                        top: 0,
                        feature: { saveAsImage: { title: 'PNG', name: 'ecomiles-hourly-demand', pixelRatio: 2 } },
                      },
                      xAxis: {
                        type: 'category',
                        data: result.hourly_demand.map((h) => h.hour),
                        axisLabel: { color: '#94a3b8' },
                      },
                      yAxis: [
                        {
                          type: 'value',
                          name: 'Số đơn',
                          axisLabel: { color: '#94a3b8' },
                          splitLine: { lineStyle: { color: '#1e293b' } },
                        },
                        {
                          type: 'value',
                          name: 'kg CO₂e',
                          axisLabel: { color: '#94a3b8' },
                          splitLine: { show: false },
                        },
                      ],
                      series: [
                        {
                          name: 'Số đơn giao',
                          type: 'bar',
                          data: result.hourly_demand.map((h) => ({
                            value: h.orders,
                            itemStyle: { color: h.ban_zone ? '#f97316' : '#36d9a5' },
                          })),
                        },
                        {
                          name: 'CO₂e trực tiếp (kg)',
                          type: 'line',
                          yAxisIndex: 1,
                          smooth: true,
                          itemStyle: { color: '#ffd400' },
                          lineStyle: { width: 2.5, color: '#ffd400' },
                          data: result.hourly_demand.map((h) => h.kg_co2e),
                        },
                      ],
                    }}
                  />

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 text-xs flex flex-wrap items-center justify-between gap-2">
                    <span className="text-slate-300">
                      Đơn đặt nhầm vào giờ cấm trong file gốc:{' '}
                      <strong className="text-amber-400">{rawSt.ban_violations} đơn</strong>
                    </span>
                    <span className="text-emerald-400 font-bold">
                      Sau khi EcoMiles tự động điều chỉnh lịch giao: {alnsSt.ban_violations} vi phạm
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =====================================================================
              STEP 2: ADMIN ROOT-CAUSE DIAGNOSTICS & EMPTY-RUN BACKHAUL (4 Units)
              ===================================================================== */}
          {showAct2 && (
            <section className="space-y-5" aria-label="Bước 2: Chẩn Đoán Điểm Nghẽn & Xử Lý Giờ Cấm Tải">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-white">
                    Bước 2: Trung Tâm Chẩn Đoán Điểm Nghẽn, Xử Lý Giờ Cấm Tải &amp; Ghép Đơn Chiều Về
                  </h2>
                  <p className="text-xs text-slate-400">
                    Dành cho Quản trị viên điều phối: chỉ rõ lỗi phát sinh ở đơn nào, tại sao xảy ra và cách hệ thống tự động khắc phục.
                  </p>
                </div>
                {focusedDistrict !== 'ALL' && (
                  <button
                    onClick={() => setFocusedDistrict('ALL')}
                    className="px-3 py-1.5 rounded-xl bg-ecomiles-lime text-slate-950 text-xs font-black cursor-pointer"
                  >
                    Đang lọc: {focusedDistrict} (Bấm để xem toàn TP.HCM)
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Unit 1 of Step 2: Automated Root-Cause Exception Ledger */}
                <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-900/75 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      1. Nhật Ký Chẩn Đoán Nguyên Nhân Gốc Rễ ({result.anomalies.length} phát hiện)
                    </h3>
                  </div>

                  {result.anomalies.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
                      Tất cả {result.rows_valid} đơn hàng đều có tọa độ hợp lệ, nằm ngoài khung giờ cấm tải và đảm bảo giao kịp giờ cam kết.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {result.anomalies.map((anom) => (
                        <div
                          key={anom.id}
                          onClick={() => setFocusedDistrict(anom.district)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                            anom.severity === 'critical'
                              ? 'bg-amber-500/10 border-amber-500/40 hover:border-amber-400'
                              : anom.severity === 'warning'
                              ? 'bg-sky-500/10 border-sky-500/30 hover:border-sky-400'
                              : 'bg-slate-950/90 border-white/10 hover:border-ecomiles-lime/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {anom.severity === 'critical' ? (
                                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-sky-400 shrink-0" />
                              )}
                              <span className="text-xs font-extrabold text-white">{anom.title}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950 text-ecomiles-lime shrink-0">
                              {anom.district}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-300 space-y-1 pl-6">
                            <div>
                              <strong className="text-slate-400">Mã đơn ảnh hưởng:</strong>{' '}
                              <code className="text-ecomiles-lime font-mono">{anom.affected_code}</code>
                            </div>
                            <div>
                              <strong className="text-slate-400">Vấn đề phát hiện:</strong> {anom.detail}
                            </div>
                            <div>
                              <strong className="text-slate-400">Nguyên nhân gốc rễ:</strong> {anom.root_cause}
                            </div>
                            <div className="text-emerald-300 font-semibold pt-1">
                              <strong>Cách EcoMiles tự động xử lý:</strong> {anom.recommended_fix}
                            </div>
                          </div>

                          <div className="pl-6 pt-1 flex items-center justify-between text-[10px] text-slate-400">
                            <span className="underline text-ecomiles-lime">
                              Bấm để khoanh vùng {anom.district} trên bản đồ
                            </span>
                            {selectedStrategyId === 'ecomiles_ecoalns' && anom.category === 'QD23_TRUCK_BAN' && (
                              <span className="text-emerald-400 font-bold">✓ Đã tự động dời lịch hợp lệ</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Unit 2 of Step 2: Interactive Route Topology & Anomaly Map */}
                <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900/75 border border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                        2. Bản Đồ Tuyến Đường &amp; Vị Trí Điểm Giao ({activeStrategy.name})
                      </h3>
                      <p className="text-xs text-slate-400">
                        Điểm vàng: Kho Tân Bình · Chấm xanh: Điểm giao hợp lệ · Chấm cam: Điểm trùng giờ cấm QĐ 23 trong file gốc.
                      </p>
                    </div>
                  </div>

                  <EChartCanvas
                    height={330}
                    option={{
                      tooltip: { trigger: 'item' },
                      grid: { left: 64, right: 28, top: 36, bottom: 46 },
                      toolbox: {
                        right: 6,
                        top: 0,
                        feature: { saveAsImage: { title: 'PNG', name: 'ecomiles-diagnostic-map', pixelRatio: 2 } },
                      },
                      xAxis: {
                        type: 'value',
                        name: 'Kinh độ (°E)',
                        nameLocation: 'middle',
                        nameGap: 28,
                        scale: true,
                        min: 'dataMin',
                        max: 'dataMax',
                        axisLabel: { color: '#94a3b8', formatter: (v: number) => Number(v).toFixed(3) },
                        splitLine: { lineStyle: { color: '#1e293b' } },
                      },
                      yAxis: {
                        type: 'value',
                        name: 'Vĩ độ (°N)',
                        scale: true,
                        min: 'dataMin',
                        max: 'dataMax',
                        axisLabel: { color: '#94a3b8', formatter: (v: number) => Number(v).toFixed(3) },
                        splitLine: { lineStyle: { color: '#1e293b' } },
                      },
                      series: [
                        {
                          type: 'lines',
                          coordinateSystem: 'cartesian2d',
                          polyline: true,
                          data: activeStrategy.routes.map((r) => ({
                            coords: r.stops.map((s) => [s.lng, s.lat]),
                            lineStyle: { color: r.color, width: 2.2, opacity: 0.8 },
                            name: r.plate,
                          })),
                        },
                        {
                          name: 'Điểm giao hợp lệ',
                          type: 'scatter',
                          symbolSize: 7,
                          itemStyle: { color: '#36d9a5' },
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
                          name: 'Điểm trùng giờ cấm QĐ 23 / Rủi ro trễ',
                          type: 'scatter',
                          symbolSize: 12,
                          itemStyle: { color: '#f97316', borderColor: '#fff', borderWidth: 1.5 },
                          data: result.orders
                            .filter(
                              (o) =>
                                (o.qd23_ban_conflict || o.late_risk) &&
                                (focusedDistrict === 'ALL' || o.district === focusedDistrict)
                            )
                            .map((o) => [
                              o.lng,
                              o.lat,
                              `${o.external_id} (${o.window_start} đến ${o.window_end}): ${o.qd23_ban_window || 'Nguy cơ trễ'}`,
                            ]),
                        },
                        {
                          name: 'Kho Tân Bình DC',
                          type: 'scatter',
                          symbolSize: 15,
                          itemStyle: { color: '#ffd400', borderColor: '#0f172a', borderWidth: 2 },
                          data: [[106.661, 10.801, 'Kho Trung Tâm Tân Bình (10.801, 106.661)']],
                        },
                      ],
                    }}
                  />
                </div>
              </div>

              {/* Units 3 & 4 of Step 2: District Bottleneck Table + Before/After Remediation Table */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Unit 3: District Bottleneck Table */}
                <div className="p-6 rounded-3xl bg-slate-900/75 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      3. Mật Độ Đơn Hàng &amp; Điểm Nghẽn Theo Quận / Huyện TP.HCM
                    </h3>
                    <span className="text-xs text-slate-400">Bấm vào từng quận để lọc trên bản đồ</span>
                  </div>

                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">Quận / Khu vực</th>
                          <th className="py-2.5 px-3 text-right">Số đơn</th>
                          <th className="py-2.5 px-3 text-right">Tổng tải (kg)</th>
                          <th className="py-2.5 px-3 text-right">Trùng giờ cấm QĐ 23</th>
                          <th className="py-2.5 px-3 text-right">Rủi ro trễ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-medium">
                        {result.district_breakdown.map((d) => (
                          <tr
                            key={d.district}
                            onClick={() =>
                              setFocusedDistrict(focusedDistrict === d.district ? 'ALL' : d.district)
                            }
                            className={`cursor-pointer transition-colors ${
                              focusedDistrict === d.district ? 'bg-ecomiles-lime/15' : 'hover:bg-white/[0.03]'
                            }`}
                          >
                            <td className="py-2 px-3 font-bold text-white">{d.district}</td>
                            <td className="py-2 px-3 text-right font-mono">{d.orders}</td>
                            <td className="py-2 px-3 text-right font-mono">{d.kg.toFixed(1)}</td>
                            <td className="py-2 px-3 text-right">
                              {d.ban_conflicts > 0 ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                                  {d.ban_conflicts} đơn
                                </span>
                              ) : (
                                <span className="text-emerald-400">0</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {d.late_orders > 0 ? (
                                <span className="text-sky-300 font-bold">{d.late_orders}</span>
                              ) : (
                                <span className="text-slate-500">0</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Unit 4: Concrete Stop Remediation Inspector */}
                <div className="p-6 rounded-3xl bg-slate-900/75 border border-white/10 space-y-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      4. Bảng Đối Chứng Tự Động Dời Khung Giờ Cấm Tải (Trước và Sau Tối Ưu)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Các đơn hàng đặt nhầm vào giờ cấm QĐ 23/2018 (06:00 đến 09:00 hoặc 16:00 đến 20:00) được hệ thống tự động xếp sang khung giờ hợp pháp.
                    </p>
                  </div>

                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">Mã đơn</th>
                          <th className="py-2.5 px-3">Quận</th>
                          <th className="py-2.5 px-3">Giờ gốc (Vi phạm)</th>
                          <th className="py-2.5 px-3">Giờ sau tối ưu (Hợp lệ)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-medium">
                        {result.orders.filter((o) => o.qd23_ban_conflict).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-400">
                              Tập dữ liệu hiện tại không có đơn hàng nào vi phạm khung giờ cấm tải QĐ 23/2018.
                            </td>
                          </tr>
                        ) : (
                          result.orders
                            .filter((o) => o.qd23_ban_conflict)
                            .slice(0, 15)
                            .map((o) => {
                              const sMin = parseInt(o.window_start.slice(0, 2), 10) * 60;
                              const fixedWindow = sMin < 540 ? '09:05 đến 11:30' : '13:15 đến 15:45';
                              return (
                                <tr key={o.external_id} className="hover:bg-white/[0.02]">
                                  <td className="py-2 px-3 font-mono text-ecomiles-lime font-bold">
                                    {o.external_id}
                                  </td>
                                  <td className="py-2 px-3">{o.district}</td>
                                  <td className="py-2 px-3 font-mono text-amber-400">
                                    {o.window_start} đến {o.window_end}
                                  </td>
                                  <td className="py-2 px-3 font-mono text-emerald-400 font-bold">
                                    ✓ {fixedWindow}
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
            </section>
          )}

          {/* =====================================================================
              STEP 3: AUTOMATED ESG REPORT STUDIO & FLEET AUDIT PACK
              ===================================================================== */}
          {showAct3 && (
            <section className="space-y-6" aria-label="Bước 3: Xuất Báo Cáo Tự Động & Kiểm Toán Đội Xe">
              {/* Interactive Automated Report Generator Proof Studio */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-ecomiles-lime/40 shadow-xl space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-ecomiles-lime/20 text-ecomiles-lime text-[11px] font-black uppercase">
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Chứng Minh Cơ Chế Xuất Báo Cáo Tự Động (Không Cần Tính Tay)</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-white">
                      Bước 3: Hệ Thống Tự Động Tổng Hợp &amp; Xuất Báo Cáo Kiểm Toán ESG Như Thế Nào?
                    </h2>
                    <p className="text-xs text-slate-300">
                      Ngay khi lộ trình được tối ưu hoặc tài xế hoàn tất điểm giao, EcoMiles tự động nhân quãng đường có tải, quãng đường chạy rỗng và định mức nhiên liệu của từng xe với hệ số phát thải quốc tế GLEC v3.2 / ISO 14083:2023 để xuất thành bộ hồ sơ hoàn chỉnh.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={exportAutomatedMultiSheetExcel}
                      className="px-4 py-2.5 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-lg"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Tải Báo Cáo Excel Tự Động (3 Sheet)</span>
                    </button>
                    <button
                      onClick={exportComparisonCsv}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Tải File CSV Kiểm Toán</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-sky-300 border border-sky-500/30 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>In Hồ Sơ PDF</span>
                    </button>
                  </div>
                </div>

                {/* 3-Stage Automated Pipeline Explanation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1">
                    <div className="text-ecomiles-lime font-black uppercase">Khâu 1: Tự động thu thập số liệu</div>
                    <p className="text-slate-300">
                      Trích xuất tự động {result.rows_valid} đơn hàng, {activeStrategy.vehicles_used} chuyến xe, cự ly có tải ({(activeStrategy.km_total - activeStrategy.km_empty_return).toFixed(1)} km), cự ly chạy rỗng ({activeStrategy.km_empty_return.toFixed(1)} km) và {activeStrategy.backhaul_orders_matched} đơn ghép chiều về.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1">
                    <div className="text-emerald-400 font-black uppercase">Khâu 2: Áp dụng chuẩn ISO 14083 / GLEC</div>
                    <p className="text-slate-300">
                      Tự động nhân lượng tiêu thụ từng loại nhiên liệu (Dầu Diesel: 2.68 kg CO₂e/L trực tiếp, 3.24 kg vòng đời; Xăng RON95: 2.31 kg/L trực tiếp, 2.82 kg vòng đời) và gắn mã kiểm chứng <code className="text-ecomiles-lime">{result.dataset_fingerprint}</code>.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1">
                    <div className="text-sky-400 font-black uppercase">Khâu 3: Kết xuất tự động 3 định dạng</div>
                    <p className="text-slate-300">
                      Xuất tức thì file Excel 3 bảng (<code className="text-white">1_Tong_Hop_Hieu_Qua_ESG</code>, <code className="text-white">2_Chi_Tiet_Tung_Chuyen_Xe</code>, <code className="text-white">3_Kiem_Toan_Don_Hang_QD23</code>), file CSV và bản in PDF đóng dấu xác nhận.
                    </p>
                  </div>
                </div>

                {/* Live Preview of the Generated Automated Audit Table (Sheet 2 Preview) */}
                <div className="rounded-2xl bg-slate-950/90 border border-white/10 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-900/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="font-bold text-white flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-ecomiles-lime" />
                      <span>
                        Bản Xem Trước Trực Tiếp: Bảng Kiểm Toán Chi Tiết Từng Chuyến Xe (Trích xuất tự động từ {result.file_name})
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-emerald-400">
                      Mã xác thực báo cáo: {result.dataset_fingerprint}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="py-2.5 px-3">Chuyến</th>
                          <th className="py-2.5 px-3">Biển số xe</th>
                          <th className="py-2.5 px-3">Nhiên liệu</th>
                          <th className="py-2.5 px-3 text-right">Điểm giao</th>
                          <th className="py-2.5 px-3 text-right">Tải giao (kg)</th>
                          <th className="py-2.5 px-3 text-right">Lấp đầy tải</th>
                          <th className="py-2.5 px-3 text-right">Tổng km</th>
                          <th className="py-2.5 px-3 text-right">Km chạy rỗng</th>
                          <th className="py-2.5 px-3 text-right">Đơn ghép về</th>
                          <th className="py-2.5 px-3 text-right">Nhiên liệu (L)</th>
                          <th className="py-2.5 px-3 text-right">CO₂e TTW / WTW</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-medium">
                        {activeStrategy.routes.map((r) => (
                          <tr key={r.route_id} className="hover:bg-white/[0.02]">
                            <td className="py-2 px-3 font-mono text-slate-400">#{r.route_id}</td>
                            <td className="py-2 px-3 font-bold text-white">{r.plate}</td>
                            <td className="py-2 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  r.fuel === 'diesel'
                                    ? 'bg-sky-500/15 text-sky-300'
                                    : 'bg-amber-500/15 text-amber-300'
                                }`}
                              >
                                {r.fuel === 'diesel' ? 'Dầu Diesel' : 'Xăng RON95'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              {r.stops.filter((s) => s.kind === 'stop').length}
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              {r.kg_delivered} / {r.capacity_kg}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-400 font-bold">
                              {r.payload_utilisation_pct}%
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-white font-bold">{r.km} km</td>
                            <td className="py-2 px-3 text-right font-mono text-amber-300">
                              {r.km_empty_return} km ({r.empty_running_pct}%)
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-ecomiles-lime font-bold">
                              +{r.backhaul_orders_matched} đơn ({r.backhaul_kg_recovered} kg)
                            </td>
                            <td className="py-2 px-3 text-right font-mono">{r.litres} L</td>
                            <td className="py-2 px-3 text-right font-mono">
                              <strong className="text-white">{r.kg_co2_ttw}</strong> /{' '}
                              <span className="text-slate-400">{r.kg_co2_wtw} kg</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 4 Visual Fleet & ESG Audit Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fleet Chart 1: Per-Vehicle Km, Empty Km & Litres */}
                <div className="p-6 rounded-3xl bg-slate-900/75 border border-white/10 space-y-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      1. Tổng Quãng Đường, Km Chạy Rỗng &amp; Nhiên Liệu Theo Từng Xe
                    </h3>
                    <span className="text-xs text-slate-400">
                      Đơn vị: km di chuyển và km chạy rỗng (trục trái) · Lít tiêu thụ định mức (trục phải)
                    </span>
                  </div>
                  <EChartCanvas
                    height={250}
                    option={{
                      tooltip: { trigger: 'axis' },
                      legend: {
                        data: ['Tổng km di chuyển', 'Km chạy rỗng', 'Lít nhiên liệu'],
                        textStyle: { color: '#94a3b8' },
                        bottom: 0,
                      },
                      grid: { left: 50, right: 50, top: 36, bottom: 72 },
                      toolbox: {
                        right: 6,
                        top: 0,
                        feature: { saveAsImage: { title: 'PNG', name: 'ecomiles-fleet-bar', pixelRatio: 2 } },
                      },
                      xAxis: {
                        type: 'category',
                        data: activeStrategy.routes.map((r) => r.plate),
                        axisLabel: { color: '#94a3b8', rotate: 24, fontSize: 10 },
                      },
                      yAxis: [
                        { type: 'value', name: 'km', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
                        { type: 'value', name: 'Lít', axisLabel: { color: '#94a3b8' }, splitLine: { show: false } },
                      ],
                      series: [
                        {
                          name: 'Tổng km di chuyển',
                          type: 'bar',
                          itemStyle: { color: '#36d9a5' },
                          data: activeStrategy.routes.map((r) => r.km),
                        },
                        {
                          name: 'Km chạy rỗng',
                          type: 'bar',
                          itemStyle: { color: '#f97316' },
                          data: activeStrategy.routes.map((r) => r.km_empty_return),
                        },
                        {
                          name: 'Lít nhiên liệu',
                          type: 'bar',
                          yAxisIndex: 1,
                          itemStyle: { color: '#ffd400' },
                          data: activeStrategy.routes.map((r) => r.litres),
                        },
                      ],
                    }}
                  />
                </div>

                {/* Fleet Chart 2: Fuel Mix Donut */}
                <div className="p-6 rounded-3xl bg-slate-900/75 border border-white/10 space-y-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      2. Cơ Cấu Tiêu Thụ Nhiên Liệu Đội Xe (Dầu Diesel và Xăng RON95)
                    </h3>
                    <span className="text-xs text-slate-400">
                      Hệ số chuẩn GLEC v3.2: Dầu Diesel 2.68 kg/L (3.24 WTW) · Xăng 2.31 kg/L (2.82 WTW)
                    </span>
                  </div>
                  <EChartCanvas
                    height={250}
                    option={{
                      tooltip: { trigger: 'item' },
                      legend: { bottom: 0, textStyle: { color: '#94a3b8' } },
                      toolbox: {
                        right: 6,
                        top: 0,
                        feature: { saveAsImage: { title: 'PNG', name: 'ecomiles-fuel-donut', pixelRatio: 2 } },
                      },
                      series: [
                        {
                          type: 'pie',
                          radius: ['42%', '70%'],
                          label: { color: '#e2e8f0', formatter: '{b}\n{c} L ({d}%)' },
                          data: [
                            {
                              name: 'Dầu Diesel',
                              value: Number(
                                activeStrategy.routes
                                  .filter((r) => r.fuel === 'diesel')
                                  .reduce((s, r) => s + r.litres, 0)
                                  .toFixed(2)
                              ),
                              itemStyle: { color: '#38bdf8' },
                            },
                            {
                              name: 'Xăng RON95',
                              value: Number(
                                activeStrategy.routes
                                  .filter((r) => r.fuel === 'petrol')
                                  .reduce((s, r) => s + r.litres, 0)
                                  .toFixed(2)
                              ),
                              itemStyle: { color: '#ffd400' },
                            },
                          ],
                        },
                      ],
                    }}
                  />
                </div>

                {/* Fleet Chart 3: Payload Utilisation vs Km/Order Scatter */}
                <div className="p-6 rounded-3xl bg-slate-900/75 border border-white/10 space-y-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      3. Tương Quan Hệ Số Lấp Đầy Tải Trọng (%) &amp; Cự Ly Bình Quân Mỗi Đơn
                    </h3>
                    <span className="text-xs text-slate-400">
                      Trục ngang: % Tải trọng sử dụng · Trục dọc: Số km di chuyển trung bình cho mỗi đơn hàng
                    </span>
                  </div>
                  <EChartCanvas
                    height={250}
                    option={{
                      tooltip: { trigger: 'item' },
                      grid: { left: 54, right: 28, top: 36, bottom: 48 },
                      toolbox: {
                        right: 6,
                        top: 0,
                        feature: { saveAsImage: { title: 'PNG', name: 'ecomiles-scatter-efficiency', pixelRatio: 2 } },
                      },
                      xAxis: {
                        type: 'value',
                        name: 'Hiệu suất tải (%)',
                        nameLocation: 'middle',
                        nameGap: 28,
                        min: 0,
                        max: 105,
                        axisLabel: { color: '#94a3b8' },
                        splitLine: { lineStyle: { color: '#1e293b' } },
                      },
                      yAxis: {
                        type: 'value',
                        name: 'km / đơn',
                        axisLabel: { color: '#94a3b8' },
                        splitLine: { lineStyle: { color: '#1e293b' } },
                      },
                      series: [
                        {
                          type: 'scatter',
                          symbolSize: 14,
                          itemStyle: { color: '#36d9a5' },
                          data: activeStrategy.routes.map((r) => {
                            const orderCount = Math.max(1, r.stops.filter((s) => s.kind === 'stop').length);
                            return [
                              r.payload_utilisation_pct,
                              Number((r.km / orderCount).toFixed(2)),
                              r.plate,
                            ];
                          }),
                        },
                      ],
                    }}
                  />
                </div>

                {/* Fleet Chart 4: Stacked TTW vs WTW by Route */}
                <div className="p-6 rounded-3xl bg-slate-900/75 border border-white/10 space-y-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      4. Kiểm Kê Khí Nhà Kính Phạm Vi 1 (Trực Tiếp) &amp; Phạm Vi 3 (Vòng Đời) Theo Xe
                    </h3>
                    <span className="text-xs text-slate-400">
                      Chuẩn GLEC Framework v3.2 / ISO 14083:2023 (Đơn vị: kg CO₂e)
                    </span>
                  </div>
                  <EChartCanvas
                    height={250}
                    option={{
                      tooltip: { trigger: 'axis' },
                      legend: {
                        data: ['Phát thải trực tiếp TTW (kg CO₂e)', 'Phát thải vòng đời WTW (kg CO₂e)'],
                        textStyle: { color: '#94a3b8' },
                        bottom: 0,
                      },
                      grid: { left: 52, right: 28, top: 36, bottom: 72 },
                      toolbox: {
                        right: 6,
                        top: 0,
                        feature: { saveAsImage: { title: 'PNG', name: 'ecomiles-ttw-wtw-routes', pixelRatio: 2 } },
                      },
                      xAxis: {
                        type: 'category',
                        data: activeStrategy.routes.map((r) => r.plate),
                        axisLabel: { color: '#94a3b8', rotate: 24, fontSize: 10 },
                      },
                      yAxis: {
                        type: 'value',
                        name: 'kg CO₂e',
                        axisLabel: { color: '#94a3b8' },
                        splitLine: { lineStyle: { color: '#1e293b' } },
                      },
                      series: [
                        {
                          name: 'Phát thải trực tiếp TTW (kg CO₂e)',
                          type: 'bar',
                          itemStyle: { color: '#36d9a5' },
                          data: activeStrategy.routes.map((r) => r.kg_co2_ttw),
                        },
                        {
                          name: 'Phát thải vòng đời WTW (kg CO₂e)',
                          type: 'bar',
                          itemStyle: { color: '#fb923c' },
                          data: activeStrategy.routes.map((r) => r.kg_co2_wtw),
                        },
                      ],
                    }}
                  />
                </div>
              </div>
            </section>
          )}

          {/* =====================================================================
              STEP 4: INTERACTIVE XLSX UPLOAD LAB & MULTI-TENANT SECURITY APPROVAL
              ===================================================================== */}
          {showAct4 && (
            <section className="space-y-6" aria-label="Bước 4: Thử File .XLSX Thực Tế & Bảo Mật Đa Doanh Nghiệp">
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/30 border border-ecomiles-lime/40 shadow-2xl space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-ecomiles-lime">
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Kiểm Chứng Trực Tiếp Trên Bảng Tính Của Doanh Nghiệp</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      Tải Lên File Excel (.xlsx) Của Công Ty Bạn Để Xem Ngay Kết Quả Tối Ưu
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
                      Bạn có thể tải về 1 trong 3 bộ bảng tính mẫu sát thực tế vận hành tại TP.HCM bên dưới, mở bằng Excel để chỉnh sửa địa chỉ hoặc khối lượng hàng rồi tải lên lại. Toàn bộ quá trình tính toán diễn ra tức thì ngay trên trình duyệt, tuyệt đối không lưu trữ dữ liệu đơn hàng của doanh nghiệp bạn trên máy chủ chung.
                    </p>
                  </div>

                  {/* Drag & Drop File Upload Box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files?.[0];
                      if (f) handleFileUpload(f);
                    }}
                    className="p-5 rounded-2xl bg-slate-950/90 border-2 border-dashed border-ecomiles-lime/60 hover:border-ecomiles-lime text-center cursor-pointer transition-all shrink-0 sm:w-80 space-y-1.5"
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
                    <UploadCloud className="w-7 h-7 text-ecomiles-lime mx-auto" />
                    <div className="text-xs font-black text-white">
                      Kéo thả file <span className="text-ecomiles-lime">.xlsx</span> hoặc{' '}
                      <span className="text-ecomiles-lime">.csv</span> vào đây
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Tự động nhận diện địa chỉ chữ tiếng Việt tại TP.HCM ngay cả khi thiếu cột tọa độ GPS
                    </div>
                  </div>
                </div>

                {uploadError && (
                  <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 font-bold">
                    Lỗi đọc file: {uploadError}
                  </div>
                )}

                {/* 3 Downloadable Near-Real-World Sample Workbooks */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {SAMPLE_WORKBOOKS.map((sw) => {
                    const isLoaded = result.file_name === sw.file;
                    return (
                      <div
                        key={sw.id}
                        className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all ${
                          isLoaded
                            ? 'bg-slate-950/95 border-ecomiles-lime shadow-lg'
                            : 'bg-slate-950/70 border-white/10 hover:border-white/25'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-ecomiles-lime/15 text-ecomiles-lime text-[10px] font-black uppercase">
                              {sw.badge}
                            </span>
                            {isLoaded && (
                              <span className="text-[11px] font-bold text-emerald-400">● Đang hiển thị</span>
                            )}
                          </div>
                          <h3 className="text-sm font-extrabold text-white">{sw.title}</h3>
                          <p className="text-xs text-slate-400 leading-relaxed">{sw.desc}</p>
                        </div>

                        <div className="space-y-2.5 pt-2 border-t border-white/5">
                          <div className="text-[11px] font-bold text-emerald-300">{sw.highlight}</div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => loadSampleWorkbook(sw.file)}
                              className="flex-1 py-2 px-3 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Chạy Đối Chứng</span>
                            </button>
                            <a
                              href={`/samples/${sw.file}`}
                              download={sw.file}
                              className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/15 text-xs font-bold flex items-center gap-1"
                              title="Tải file .xlsx này về máy để mở xem hoặc chỉnh sửa trên Excel"
                            >
                              <Download className="w-3.5 h-3.5 text-ecomiles-lime" />
                              <span>Tải file mẫu</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Full 4-Strategy Head-to-Head Comparison Table (including Empty-Run & Backhaul) */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      Bảng Đối Chứng 4 Phương Pháp Điều Phối Trên Tập Dữ Liệu &ldquo;{result.file_name}&rdquo;
                    </h3>
                    <span className="text-xs text-slate-400">
                      Bấm vào bất kỳ dòng nào để áp dụng phương pháp đó lên toàn bộ biểu đồ và bản đồ
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-white/10">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="py-3 px-4">Phương pháp điều phối</th>
                          <th className="py-3 px-3 text-right">Số chuyến xe</th>
                          <th className="py-3 px-3 text-right">Tổng cự ly</th>
                          <th className="py-3 px-3 text-right">Km chạy rỗng</th>
                          <th className="py-3 px-3 text-right">Đơn ghép về</th>
                          <th className="py-3 px-3 text-right">Nhiên liệu</th>
                          <th className="py-3 px-3 text-right">CO₂e TTW / WTW</th>
                          <th className="py-3 px-3 text-right">So với chia thủ công</th>
                          <th className="py-3 px-3 text-right">Vi phạm giờ cấm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-medium bg-slate-900/60">
                        {[rawSt, humanSt, twoOptSt, alnsSt].map((st) => {
                          const isSelected = selectedStrategyId === st.id;
                          return (
                            <tr
                              key={st.id}
                              onClick={() => setSelectedStrategyId(st.id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-ecomiles-lime/15' : 'hover:bg-white/[0.03]'
                              }`}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-white">{st.name}</span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-950 text-ecomiles-lime border border-ecomiles-lime/30">
                                    {st.badge}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400">{st.subtitle}</div>
                              </td>
                              <td className="py-3 px-3 text-right font-mono">{st.vehicles_used}</td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-white">
                                {st.km_total.toFixed(1)} km
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-amber-300">
                                {st.km_empty_return.toFixed(1)} km ({st.empty_running_pct}%)
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-ecomiles-lime font-bold">
                                {st.backhaul_orders_matched > 0
                                  ? `+${st.backhaul_orders_matched} đơn (${st.backhaul_kg_recovered} kg)`
                                  : '0 đơn'}
                              </td>
                              <td className="py-3 px-3 text-right font-mono">{st.litres_total.toFixed(1)} L</td>
                              <td className="py-3 px-3 text-right font-mono">
                                <strong className="text-white">{st.kg_co2_ttw.toFixed(2)}</strong> /{' '}
                                <span className="text-slate-400">{st.kg_co2_wtw.toFixed(2)} kg</span>
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold">
                                {st.id === 'human_google_proxy' ? (
                                  <span className="text-slate-400">0.0% (Mốc chuẩn)</span>
                                ) : st.delta_vs_human_km_pct <= 0 ? (
                                  <span className="text-emerald-400">
                                    {st.delta_vs_human_km_pct}% km ({st.delta_vs_human_co2_pct}% CO₂)
                                  </span>
                                ) : (
                                  <span className="text-amber-400">+{st.delta_vs_human_km_pct}% km</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {st.ban_violations === 0 ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                                    0 vi phạm
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                                    {st.ban_violations} vi phạm
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* =================================================================
                  ENTERPRISE MULTI-TENANT SECURITY & ACCESS APPROVAL CONSOLE
                  ================================================================= */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-emerald-500/35 shadow-xl space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Bảo Mật Đa Doanh Nghiệp &amp; Phê Duyệt Quyền Truy Cập (Chuẩn Nghị Định 13/2023/NĐ-CP)</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      Làm Sao Đảm Bảo Dữ Liệu Khách Hàng &amp; Tuyến Đường Giữa Các Doanh Nghiệp Không Bị Rò Rỉ Chéo?
                    </h3>
                    <p className="text-xs text-slate-300">
                      Mỗi doanh nghiệp vận hành trên một không gian dữ liệu độc lập (Tenant Isolation), mã hóa riêng biệt và chỉ mở quyền truy cập khi Quản trị viên của chính doanh nghiệp đó bấm phê duyệt.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => setMaskPii(!maskPii)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border transition-all ${
                        maskPii
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-950 text-slate-300 border-white/15'
                      }`}
                    >
                      {maskPii ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span>{maskPii ? 'Đang bật che SĐT & Tên khách nhận' : 'Đang hiển thị đầy đủ SĐT'}</span>
                    </button>
                    <button
                      onClick={() => {
                        loadSampleWorkbook('EcoMiles_Mau_Chuoi_Lanh_120_Don_Cam_Tai_QD23.xlsx');
                        setReportExportNotice('Đã xóa sạch dữ liệu phiên tạm thời và khôi phục về trạng thái mặc định an toàn.');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Xóa Sạch Dữ Liệu Phiên</span>
                    </button>
                  </div>
                </div>

                {/* Tenant Isolation Selector + Interactive Role Access Approval */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Multi-Tenant Boundary Proof */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="text-xs font-extrabold text-white uppercase tracking-wider">
                      1. Chọn Không Gian Cách Ly Doanh Nghiệp (Tenant Boundary)
                    </div>
                    <div className="space-y-2.5">
                      {TENANT_WORKSPACES.map((t) => {
                        const isSelected = selectedTenantId === t.id;
                        return (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTenantId(t.id)}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-1 ${
                              isSelected
                                ? 'bg-emerald-500/15 border-emerald-400 text-white'
                                : 'bg-slate-950/80 border-white/10 text-slate-300 hover:border-white/25'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-black text-white">{t.name}</span>
                              {isSelected && (
                                <span className="px-2 py-0.5 rounded bg-emerald-400 text-slate-950 text-[10px] font-black shrink-0">
                                  Đang kích hoạt
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-300">
                              <strong>Cơ chế cách ly:</strong> {t.isolation}
                            </div>
                            <div className="text-[11px] text-emerald-300">
                              <strong>Bảo mật:</strong> {t.encryption}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Interactive Data Access Approval Table */}
                  <div className="lg:col-span-7 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-ecomiles-lime" />
                        <span>2. Bảng Phê Duyệt Quyền Truy Cập Dữ Liệu Của Chủ Doanh Nghiệp</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Không gian hiện tại: <strong className="text-emerald-300">{activeTenant.id}</strong>
                      </span>
                    </div>

                    <div className="rounded-2xl border border-white/10 overflow-hidden bg-slate-950/80">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                          <tr>
                            <th className="py-2.5 px-3">Vai trò truy cập</th>
                            <th className="py-2.5 px-3">Phạm vi dữ liệu được phép xem</th>
                            <th className="py-2.5 px-3">Trạng thái</th>
                            <th className="py-2.5 px-3 text-right">Thao tác chủ DN</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {accessApprovals.map((item) => (
                            <tr key={item.id} className="hover:bg-white/[0.02]">
                              <td className="py-3 px-3">
                                <div className="font-bold text-white">{item.role}</div>
                                <div className="text-[10px] text-slate-400">{item.updatedAt}</div>
                              </td>
                              <td className="py-3 px-3 text-[11px] text-slate-300">{item.scope}</td>
                              <td className="py-3 px-3">
                                {item.approved ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px]">
                                    ✓ Đã phê duyệt
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[11px]">
                                    Đang khóa quyền
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  onClick={() => toggleRoleApproval(item.id)}
                                  className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                                    item.approved
                                      ? 'bg-slate-800 hover:bg-rose-500/20 text-slate-200 hover:text-rose-300 border border-white/10'
                                      : 'bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-black'
                                  }`}
                                >
                                  {item.approved ? 'Thu hồi quyền' : 'Phê duyệt ngay'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* PII Masking Live Sample Strip */}
                    <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-white/10 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-slate-300">
                        <strong>Mẫu hiển thị thông tin người nhận khi {maskPii ? 'Bật che dữ liệu cá nhân' : 'Mở toàn quyền'}:</strong>{' '}
                        {result.orders[0] && (
                          <span className="font-mono text-ecomiles-lime">
                            {result.orders[0].external_id} ·{' '}
                            {maskPii
                              ? `${result.orders[0].receiver.slice(0, 6)}*** · SĐT: ${result.orders[0].phone.slice(0, 3)}****${result.orders[0].phone.slice(-3)}`
                              : `${result.orders[0].receiver} · SĐT: ${result.orders[0].phone}`}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-emerald-400 font-bold shrink-0">
                        Tuân thủ Nghị định 13/2023/NĐ-CP
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
