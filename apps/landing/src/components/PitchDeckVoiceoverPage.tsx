import { useState, useEffect, useRef } from 'react';
import {
  ExternalLink,
  Download,
  ArrowLeft,
  Clock,
  Sparkles,
  Maximize2,
  Minimize2,
  Monitor,
  Smartphone,
  CheckCircle2,
  Eye,
  EyeOff,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  AlertTriangle,
  TrendingUp,
  Leaf,
  Zap,
  ShieldCheck,
  Award,
  Truck,
  Users,
  ChevronRight,
  Layers,
  Printer
} from 'lucide-react';
import { ThreeDeviceEcosystemBanner, type DeviceBannerFocusId } from './ThreeDeviceEcosystemBanner';

const GALLERY_LIGHTBOX_ASSETS = [
  '00_ecomiles_clean_devices_hero_stage.png',
  '00_ecomiles_flagship_cover_banner.png',
  '26_mockup_macbook_pro_16_b2b_tms.png',
  '27_mockup_windows_xps_16_evsim_dual.png',
  '24_mockup_samsung_zfold_tablet_cockpit.png',
  '25_mockup_ipad_pro_tablet_tms.png',
  '23_mockup_iphone_duo_dual_screen.png',
  '21_mockup_iphone_18_pro_max_driver.png',
  '22_mockup_samsung_s26_ultra_maps_live.png',
  '17_slide_composite_all_devices_hero_trio.png',
  '18_slide_composite_driver_and_maps_mobile_tablet.png',
  '19_slide_composite_dispatcher_and_evsim_benchmark.png',
  '20_slide_composite_4role_enterprise_architecture.png',
] as const;

interface SlideItem {
  id: number;
  title: string;
  subtitle: string;
  duration: string;
  targetSeconds: number;
  voiceover: string;
  slideImage: string;
  tag: string;
}

const SLIDES: SlideItem[] = [
  {
    id: 1,
    title: "Trang Bìa",
    subtitle: "Bài Toán 80 Đơn / 10 Xe & Khủng Hoảng Điều Phối Excel",
    duration: "~20s",
    targetSeconds: 20,
    tag: "Khởi Đầu Ấn Tượng · The Hook",
    voiceover:
      "“80 đơn hàng cần giao. 10 chiếc xe tải. Và công cụ điều phối duy nhất… là một file Excel. Bạn có thấy quen không? Đó là buổi sáng bình thường của rất nhiều doanh nghiệp vận tải Việt Nam - tuyến chồng chéo, xe chạy vòng, cuối ngày gần một phần ba số xe quay về tay không. Và đó chính là lý do EcoMiles ra đời - tối ưu vận chuyển, tiết kiệm chi phí, kiến tạo tương lai xanh!”",
    slideImage: "/slides/slide-01.jpg"
  },
  {
    id: 2,
    title: "Vấn Đề (Số Liệu)",
    subtitle: "Chi Phí Logistics 17% GDP & Phát Thải CO₂ Giao Thông",
    duration: "~12s",
    targetSeconds: 12,
    tag: "Nỗi Đau Thị Trường · Market Pain",
    voiceover:
      "\"Câu chuyện đó không phải cá biệt. Logistics Việt Nam đang tiêu tốn tới 17% GDP, gấp rưỡi mức bình quân thế giới, trong khi 80% phát thải CO₂ ngành giao thông đến từ đường bộ, và có tới 30 - 35% xe chạy rỗng mỗi ngày.\"",
    slideImage: "/slides/slide-02.jpg"
  },
  {
    id: 3,
    title: "Đội Ngũ Sáng Lập",
    subtitle: "5 Sinh Viên Đa Ngành NEU Cùng Mục Tiêu Xanh Hoá Vận Tải",
    duration: "~10s",
    targetSeconds: 10,
    tag: "Năng Lực Thực Thi · Team & Execution",
    voiceover:
      "\"Đứng sau bài toán đó là 5 sinh viên đa ngành: công nghệ, tài chính, marketing, logistics, thương mại điện tử, cùng chung một mục tiêu xanh hoá logistics Việt Nam.\"",
    slideImage: "/slides/slide-03.jpg"
  },
  {
    id: 4,
    title: "Ý Nghĩa & Tầm Nhìn",
    subtitle: "Chuyển Đổi Kép (Dual Transition) & Net Zero 2050",
    duration: "~15s",
    targetSeconds: 15,
    tag: "Tầm Nhìn Vĩ Mô · Macro Alignment",
    voiceover:
      "\"Với chúng tôi, logistics xanh không phải một lựa chọn xa xỉ, mà là con đường tất yếu để doanh nghiệp Việt Nam phát triển bền vững. Đó cũng là lý do EcoMiles hướng tới trở thành nền tảng quản trị vận tải và phát thải hàng đầu Việt Nam, đồng hành cùng mục tiêu Net Zero 2050.\"",
    slideImage: "/slides/slide-04.jpg"
  },
  {
    id: 5,
    title: "4 Tính Năng Cốt Lõi",
    subtitle: "VRPTW Thông Minh, Cảnh Báo Lệch Tuyến, Ghép Chiều Về & CO₂ GLEC",
    duration: "~20s",
    targetSeconds: 20,
    tag: "Công Nghệ Lõi · Core Engine",
    voiceover:
      "\"Vậy EcoMiles giải quyết bài toán đó như thế nào? Nền tảng tự động sắp tuyến, chủ động cảnh báo lệch tuyến, ghép đơn chiều về để giảm xe chạy rỗng, và tự động đo lường, báo cáo CO₂ theo chuẩn quốc tế GLEC và GHG Protocol trên cùng một hệ thống.\"",
    slideImage: "/slides/slide-05.jpg"
  },
  {
    id: 6,
    title: "Giao Diện Quản Lý (Dashboard)",
    subtitle: "Bàn Điều Hành Dispatcher 24/7 & Ứng Dụng Tài Xế PWA",
    duration: "~15s",
    targetSeconds: 15,
    tag: "Minh Chứng Sản Phẩm · Live Demo",
    voiceover:
      "“Toàn bộ được quản lý qua một giao diện trực quan: người quản lý tải đơn hàng lên, hệ thống tự nhóm tuyến, theo dõi vị trí xe theo thời gian thực, và xuất báo cáo phát thải chỉ trong vài cú nhấp chuột.”",
    slideImage: "/slides/slide-06.jpg"
  },
  {
    id: 7,
    title: "So Sánh Cạnh Tranh",
    subtitle: "Khác Biệt Vượt Trội: Tối Ưu Vận Hành + Đo Lường CO₂ Đơn Lẻ",
    duration: "~15s",
    targetSeconds: 15,
    tag: "Hào Khí Phòng Thủ · Competitive Moat",
    voiceover:
      "“Không chỉ vậy, khác với cách làm cũ vốn thủ công và không đo lường được phát thải, EcoMiles là nền tảng duy nhất kết hợp đồng thời tối ưu vận hành và đo lường CO₂ minh bạch, truy vết đến từng đơn hàng cụ thể.”",
    slideImage: "/slides/slide-07.jpg"
  },
  {
    id: 8,
    title: "Tính Khả Thi & Tài Chính",
    subtitle: "Mô Phỏng Thực Tế 80 Đơn / 10 Xe: Hoàn Vốn 1.68 Năm, IRR 28%",
    duration: "~20s",
    targetSeconds: 20,
    tag: "Hiệu Quả Đầu Tư · Financial Defensibility",
    voiceover:
      "“Quay lại với kho hàng 80 đơn hàng, 10 xe tải ở đầu video - đó chính là kịch bản thực tế mà EcoMiles đã mô phỏng thành công trên MVP tại EcoMiles.w9.nu. Với thời gian hoàn vốn khoảng 1,68 năm, IRR 28%, và lợi nhuận dương từ năm thứ hai, đây là mô hình vừa khả thi, vừa bền vững.”",
    slideImage: "/slides/slide-08.jpg"
  },
  {
    id: 9,
    title: "Thông Điệp Cộng Đồng",
    subtitle: "Tác Động Xã Hội: Giảm Ô Nhiễm Đô Thị & Giảm Áp Lực Cho Tài Xế",
    duration: "~20s",
    targetSeconds: 20,
    tag: "Tác Động Bền Vững · ESG Impact",
    voiceover:
      "“Và hơn cả những con số, chúng tôi tin một tuyến đường không chạy rỗng cũng là một hơi thở trong lành hơn cho thành phố, một ngày làm việc nhẹ nhàng hơn cho người tài xế - nơi phát triển kinh tế và bảo vệ môi trường có thể song hành.”",
    slideImage: "/slides/slide-09.jpg"
  },
  {
    id: 10,
    title: "Kêu Gọi & Tầm Nhìn Kết",
    subtitle: "Tối Ưu Vận Chuyển · Tiết Kiệm Chi Phí · Kiến Tạo Tương Lai Xanh",
    duration: "~10s",
    targetSeconds: 10,
    tag: "Kêu Gọi Hành Động · The Grand Ask",
    voiceover:
      "“Tối ưu vận chuyển, tiết kiệm chi phí, kiến tạo tương lai xanh - đó là những gì EcoMiles mang lại. Cảm ơn bạn đã dành thời gian đồng hành cùng chúng tôi.”",
    slideImage: "/slides/slide-10.jpg"
  }
];

export function PitchDeckVoiceoverPage({ onBackToHome }: { onBackToHome?: () => void }) {
  const [activeSlide, setActiveSlide] = useState<number>(1);
  const [presentationMode, setPresentationMode] = useState<'interactive' | 'slides'>('interactive');
  const [showCaptions, setShowCaptions] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Interactive state for Slide 1 (Solver simulation)
  const [simStep, setSimStep] = useState<'idle' | 'running' | 'completed'>('idle');

  // Interactive state for Slide 2 (Fleet calculator)
  const [fleetSize, setFleetSize] = useState<number>(10);

  // Interactive state for Slide 5 (Core Features tabs)
  const [activeFeatureTab, setActiveFeatureTab] = useState<number>(0);

  // Interactive state for Slide 6 (Live Console tabs)
  const [activeConsoleTab, setActiveConsoleTab] = useState<'both' | 'dispatcher' | 'driver' | 'devices_7'>('both');

  const [activeFieldDeviceIdx, setActiveFieldDeviceIdx] = useState<number>(0);
  const [galleryStageMode, setGalleryStageMode] = useState<'studio_24k' | 'webgl_3d'>('studio_24k');
  const [deckWebglFocusId, setDeckWebglFocusId] = useState<DeviceBannerFocusId>('all_banner');
  const [lightboxAsset, setLightboxAsset] = useState<string | null>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);

  const scrollToSlide = (slideId: number) => {
    const targetElement = slideRefs.current[slideId - 1];
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Intersection observer to track active slide during scroll
  useEffect(() => {
    if (window.location.hash) {
      const match = window.location.hash.match(/slide-(\d+)/);
      if (match) {
        const slideId = parseInt(match[1], 10);
        setTimeout(() => {
          scrollToSlide(slideId);
        }, 300);
      }
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight * 0.35;
      for (let i = SLIDES.length - 1; i >= 0; i--) {
        const el = slideRefs.current[i];
        if (el && el.offsetTop <= scrollPosition) {
          if (activeSlide !== SLIDES[i].id) {
            setActiveSlide(SLIDES[i].id);
          }
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeSlide]);

  // Stop speech synthesis when active slide changes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const tid = window.setTimeout(() => setIsPlayingAudio(false), 0);
      return () => window.clearTimeout(tid);
    }
    return undefined;
  }, [activeSlide]);

  // Keyboard navigation for presentation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        scrollToSlide(Math.min(SLIDES.length, activeSlide + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        scrollToSlide(Math.max(1, activeSlide - 1));
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 's') {
        setShowCaptions(prev => !prev);
      } else if (e.key.toLowerCase() === 'm') {
        setPresentationMode(prev => prev === 'interactive' ? 'slides' : 'interactive');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlide]);

  // Web Speech API Voice-over playback for judges
  const toggleVoiceoverSpeech = (slideId: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Trình duyệt của bạn chưa hỗ trợ Web Speech API.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const currentSlideData = SLIDES.find(s => s.id === slideId);
    if (!currentSlideData) return;

    const cleanText = currentSlideData.voiceover.replace(/[“”"]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang.includes('vi') || v.lang.includes('VN'));
    if (viVoice) {
      utterance.voice = viVoice;
    }

    utterance.onstart = () => {
      setIsPlayingAudio(true);
    };

    utterance.onend = () => {
      setIsPlayingAudio(false);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Trigger simulated 80-order route optimization
  const triggerSimulation = () => {
    setSimStep('running');
    setTimeout(() => {
      setSimStep('completed');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-emerald-400 selection:text-slate-950 font-sans">
      {/* Official SO 2026 Competition Banner Header */}
      <header className="sticky top-0 z-50 border-b border-cyan-500/30 bg-[#041c43]/95 backdrop-blur-2xl shadow-2xl transition-all duration-200 print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2 sm:px-6">
          {/* Left: Brand Emblem & Back link */}
          <div className="flex items-center gap-2.5 shrink-0 z-10">
            <button
              type="button"
              onClick={() => {
                if (onBackToHome) {
                  onBackToHome();
                } else {
                  window.location.href = '/';
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-950/70 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-900 hover:text-white transition backdrop-blur-md"
              title="Về trang chủ EcoMiles"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Trang chủ</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-3">
              <span className="font-black text-sm tracking-tight text-white">
                ECO<span className="text-amber-400">MILES</span>
              </span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-emerald-300">
                SO 2026
              </span>
            </div>
          </div>

          {/* Right: Mode Switcher & Presentation Controls */}
          <div className="flex items-center gap-2 shrink-0 z-10">
            {/* Presentation Mode Toggle */}
            <div className="inline-flex rounded-lg bg-slate-950/80 p-1 border border-white/10 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setPresentationMode('interactive')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  presentationMode === 'interactive'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Trải nghiệm tương tác web 2026 sống động"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Bản Tương Tác</span>
              </button>
              <button
                type="button"
                onClick={() => setPresentationMode('slides')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  presentationMode === 'slides'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Bản trình chiếu Slide 16:9 gốc"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Slide Gốc</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const prev = showCaptions;
                setShowCaptions(false);
                setTimeout(() => {
                  window.print();
                  setShowCaptions(prev);
                }, 100);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition backdrop-blur-md"
              title="Xuất bản in PDF 16:9 không phụ đề (Ctrl+P)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xuất PDF</span>
            </button>

            <a
              href="/slides/EcoMiles_Pitch_Deck_SO2026_No_Subtitles.pdf"
              download="EcoMiles_Pitch_Deck_SO2026_No_Subtitles.pdf"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition backdrop-blur-md"
              title="Tải tệp PDF 16:9 Không Phụ Đề chính thức"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Tải PDF</span>
            </a>

            <button
              type="button"
              onClick={() => setShowCaptions(prev => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition backdrop-blur-md ${
                showCaptions
                  ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300'
                  : 'border-white/10 bg-slate-950/70 text-slate-300 hover:text-white'
              }`}
              title="Bật / Tắt phụ đề lời thoại (S)"
            >
              {showCaptions ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="hidden lg:inline">Phụ đề</span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-950/70 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-900 transition backdrop-blur-md"
              title="Toàn màn hình trình chiếu (F)"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden xl:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
            </button>

            <a
              href="/app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/30 transition"
              title="Mở Bàn Điều Hành Trực Tiếp để Demo Live với Ban Giám Khảo"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Demo Live</span>
            </a>
          </div>
        </div>

        {/* Slide Jump Pill Bar */}
        <div className="bg-slate-950/90 border-t border-slate-800/80 px-4 py-1.5 overflow-x-auto scrollbar-thin">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 min-w-max">
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 mr-1 hidden sm:inline">
                Mục lục:
              </span>
              {SLIDES.map((slide) => {
                const isActive = activeSlide === slide.id;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => scrollToSlide(slide.id)}
                    className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-[10px] font-black opacity-80">
                      {slide.id < 10 ? `0${slide.id}` : slide.id}
                    </span>
                    <span className="text-[11px] whitespace-nowrap">{slide.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Presentation Navigation Hint */}
            <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-700">Space</kbd>
                /
                <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-700">↓</kbd>
                chuyển slide
              </span>
              <span>•</span>
              <span className="text-amber-400 font-semibold">Tổng thời lượng: ~157s</span>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Side Dot Tracker (Right Edge) */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-center gap-2 bg-slate-950/70 p-2 rounded-full border border-slate-800 backdrop-blur-md print:hidden">
        {SLIDES.map((s) => {
          const isActive = activeSlide === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollToSlide(s.id)}
              className={`group relative flex items-center justify-center transition-all ${
                isActive ? 'h-7 w-7' : 'h-4 w-4'
              }`}
              title={`Slide ${s.id}: ${s.title}`}
            >
              <span
                className={`rounded-full transition-all duration-300 ${
                  isActive
                    ? 'h-6 w-6 bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/40'
                    : 'h-2 w-2 bg-slate-700 group-hover:bg-slate-400 group-hover:scale-125'
                }`}
              >
                {isActive ? s.id : ''}
              </span>

              <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-200 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                {s.id}. {s.title} ({s.duration})
              </span>
            </button>
          );
        })}
      </div>

      {/* Top Banner Hero */}
      <div className="w-full bg-[#041c43] border-b border-cyan-500/40 shadow-2xl py-3 sm:py-5 px-0 flex flex-col items-center justify-center overflow-hidden print:hidden">
        <div className="w-full flex justify-center">
          <img
            src="/assets/neu_so2026_banner.png"
            alt="Olympic Khởi Nghiệp 2026 (SO 2026): NEU & Ban Tổ Chức"
            className="w-full h-auto max-h-36 sm:max-h-48 md:max-h-56 object-contain drop-shadow-2xl select-none"
          />
        </div>
        <div className="mt-2.5 px-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-semibold tracking-wider text-cyan-200/90 uppercase">
          <span className="text-emerald-400 font-bold">Dự án: EcoMiles</span>
          <span>•</span>
          <span>Vòng 1: Ý tưởng</span>
          <span>•</span>
          <span>Olympic Khởi Nghiệp 2026 (SO 2026)</span>
          <span>•</span>
          <span className="text-amber-300 font-bold">Pitch Deck Trực Tuyến</span>
        </div>
      </div>

      {/* Main Presentation Feed */}
      <main className="pb-32">
        {SLIDES.map((slide, index) => {
          const isActive = activeSlide === slide.id;

          return (
            <section
              key={slide.id}
              id={`slide-${slide.id}`}
              ref={(el) => {
                slideRefs.current[index] = el;
              }}
              className="scroll-mt-24 px-4 py-12 sm:px-6 lg:px-8 border-b border-slate-900 relative"
            >
              <div className="mx-auto max-w-6xl">
                {/* Slide Header Indicator */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 pb-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-base font-black text-emerald-400 shadow-inner">
                      {slide.id < 10 ? `0${slide.id}` : slide.id}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                          {slide.title}
                        </h2>
                        <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10.5px] font-extrabold text-emerald-300 uppercase tracking-wide">
                          {slide.tag}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                        {slide.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 print:hidden">
                    {/* Voice-over Audio Button */}
                    <button
                      type="button"
                      onClick={() => toggleVoiceoverSpeech(slide.id)}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-md ${
                        isPlayingAudio && isActive
                          ? 'bg-amber-400 text-slate-950 animate-pulse'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700'
                      }`}
                      title="Nghe giọng đọc thuyết minh mô phỏng"
                    >
                      {isPlayingAudio && isActive ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>Dừng đọc</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Nghe lời thoại</span>
                        </>
                      )}
                    </button>

                    <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{slide.duration}</span>
                    </div>
                  </div>
                </div>

                {/* THE CORE CONTENT: DUAL MODE */}
                {presentationMode === 'slides' ? (
                  /* Mode B: Original Static 16:9 Presentation Frame */
                  <div className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-2 sm:p-3 shadow-2xl transition-all hover:border-emerald-500/40">
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-900 flex items-center justify-center">
                      <img
                        src={slide.slideImage}
                        alt={`Slide ${slide.id}: ${slide.title}`}
                        className="h-full w-full object-contain"
                        loading={slide.id <= 3 ? "eager" : "lazy"}
                      />
                    </div>
                  </div>
                ) : (
                  /* Mode A: 2026 Interactive Living Experience */
                  <div className="space-y-6">
                    {/* SLIDE 1 */}
                    {slide.id === 1 && (
                      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/30 p-6 sm:p-10 shadow-2xl">
                        <div className="text-center max-w-3xl mx-auto mb-8">
                          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-4 py-1 text-xs font-bold text-emerald-400 mb-3">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>OLYMPIC KHỞI NGHIỆP 2026 · SO 2026</span>
                          </div>
                          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                            ECO<span className="text-ecomiles-lime">MILES</span>
                          </h1>
                          <p className="text-base sm:text-xl font-bold text-slate-200 mt-2">
                            Nền Tảng Điều Phối Vận Tải Thông Minh &amp; Giảm Phát Thải CO₂
                          </p>
                          <p className="text-xs sm:text-sm text-slate-400 mt-2">
                            Tối ưu vận chuyển · Tiết kiệm chi phí · Kiến tạo tương lai xanh
                          </p>
                        </div>

                        {/* 7-Device Studio Cover Banner Showcase Card on Slide 1 */}
                        <div className="mb-6 rounded-2xl border border-ecomiles-lime/35 bg-slate-950/85 p-3 sm:p-4 shadow-xl space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="font-extrabold text-ecomiles-lime uppercase tracking-wider">
                              Sân Khấu 7 Thiết Bị Đồng Bộ Thời Gian Thực (MacBook · Windows · Z Fold · iPad · iPhone Duo · 18 Pro Max · S26 Ultra)
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setLightboxAsset('00_ecomiles_clean_devices_hero_stage.png')}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-ecomiles-lime border border-ecomiles-lime/40 font-bold text-[11px] cursor-pointer"
                              >
                                Phóng to 2.4K
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setGalleryStageMode('webgl_3d');
                                  document.getElementById('pitch-deck-screenshots')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-[11px] cursor-pointer"
                              >
                                Mở Sân Khấu 3D WebGL ↓
                              </button>
                            </div>
                          </div>
                          <img
                            src="/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png"
                            alt="EcoMiles 7-Device Flagship Studio Cover Banner"
                            onClick={() => setLightboxAsset('00_ecomiles_clean_devices_hero_stage.png')}
                            className="w-full max-h-[260px] object-contain mx-auto rounded-xl cursor-zoom-in drop-shadow-[0_18px_36px_rgba(0,0,0,0.85)]"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                          <div className="rounded-2xl border border-red-500/30 bg-red-950/15 p-5 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-4 border-b border-red-500/20 pb-3">
                              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                <span>8:00 SÁNG: KHỦNG HOẢNG EXCEL</span>
                              </div>
                              <span className="text-[11px] font-mono text-red-300 bg-red-500/20 px-2 py-0.5 rounded">
                                Cách Làm Cũ
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed mb-4">
                              80 đơn hàng rải khắp TP.HCM. 10 xe tải giao nhận. Điều phối viên ghép thủ công qua Zalo/Excel:
                            </p>

                            <div className="space-y-2 font-mono text-xs">
                              <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-red-500/20 text-red-200">
                                <span>Tuyến đường:</span>
                                <span className="font-bold text-red-400">Chồng chéo, chạy lòng vòng</span>
                              </div>
                              <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-red-500/20 text-red-200">
                                <span>Xe chạy rỗng về:</span>
                                <span className="font-bold text-red-400">33% (Quay về tay không)</span>
                              </div>
                              <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-red-500/20 text-red-200">
                                <span>Cấm tải TP.HCM:</span>
                                <span className="font-bold text-red-400">Dễ dính phạt giờ cấm 6-9h</span>
                              </div>
                              <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-red-500/20 text-red-200">
                                <span>Tổng quãng đường:</span>
                                <span className="font-bold text-red-400">480 km / 10 xe</span>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-5 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-4 border-b border-emerald-500/20 pb-3">
                              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                                <Zap className="w-4 h-4" />
                                <span>8:00:02 SÁNG: ECOMILES AI ENGINE</span>
                              </div>
                              <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded">
                                1-Click Dispatch
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed mb-4">
                              Hệ thống tự động gom 80 đơn hàng thành 5 tuyến xe tối ưu OSRM, loại bỏ hoàn toàn xe chạy rỗng:
                            </p>

                            <div className="space-y-2 font-mono text-xs">
                              <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-emerald-500/20 text-emerald-200">
                                <span>Tối ưu tuyến:</span>
                                <span className="font-bold text-emerald-400">Tự động gom cụm theo quận</span>
                              </div>
                              <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-emerald-500/20 text-emerald-200">
                                <span>Xe chạy rỗng về:</span>
                                <span className="font-bold text-emerald-400">Giảm &gt; 80% nhờ ghép chiều về</span>
                              </div>
                              <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-emerald-500/20 text-emerald-200">
                                <span>QĐ 23/2019 cấm tải:</span>
                                <span className="font-bold text-emerald-400">Tự né khung 6h-9h &amp; 16h-20h</span>
                              </div>
                              <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-emerald-500/20 text-emerald-200">
                                <span>Tổng quãng đường:</span>
                                <span className="font-bold text-emerald-400">312 km (-35% tiết kiệm)</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={triggerSimulation}
                            disabled={simStep === 'running'}
                            className={`px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg ${
                              simStep === 'running'
                                ? 'bg-slate-800 text-slate-400 cursor-wait'
                                : 'bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 shadow-ecomiles-lime/20'
                            }`}
                          >
                            <RotateCcw className={`w-4 h-4 ${simStep === 'running' ? 'animate-spin' : ''}`} />
                            <span>
                              {simStep === 'running'
                                ? 'Đang giải bài toán VRPTW 80 đơn...'
                                : simStep === 'completed'
                                ? 'Đã mô phỏng 80 đơn/10 xe (Bấm để chạy lại)'
                                : 'Mô phỏng gom 80 đơn / 10 xe ngay lập tức'}
                            </span>
                          </button>

                          <a
                            href="/app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 bg-slate-900 border border-slate-700 hover:border-emerald-400 text-white transition-all"
                          >
                            <Monitor className="w-4 h-4 text-emerald-400" />
                            <span>Mở Bàn Điều Hành Trực Tiếp (/app/)</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* SLIDE 2 */}
                    {slide.id === 2 && (
                      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-10 shadow-2xl space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6 text-center">
                            <div className="text-4xl sm:text-5xl font-black text-amber-400 font-mono tracking-tight">
                              17.0%
                            </div>
                            <div className="text-xs uppercase font-extrabold tracking-wider text-amber-300 mt-2">
                              Chi Phí Logistics / GDP
                            </div>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                              Gấp rưỡi mức bình quân thế giới (10.6%). Doanh nghiệp Việt Nam mất hàng chục nghìn tỷ đồng vì điều phối manh mún.
                            </p>
                          </div>

                          <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center">
                            <div className="text-4xl sm:text-5xl font-black text-red-400 font-mono tracking-tight">
                              80.0%
                            </div>
                            <div className="text-xs uppercase font-extrabold tracking-wider text-red-300 mt-2">
                              Phát Thải CO₂ Đường Bộ
                            </div>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                              80% lượng khí thải CO₂ của toàn ngành giao thông vận tải đến từ đường bộ, tập trung lớn tại các đô thị đông đúc.
                            </p>
                          </div>

                          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-6 text-center">
                            <div className="text-4xl sm:text-5xl font-black text-cyan-400 font-mono tracking-tight">
                              30 - 35%
                            </div>
                            <div className="text-xs uppercase font-extrabold tracking-wider text-cyan-300 mt-2">
                              Xe Chạy Rỗng Mỗi Ngày
                            </div>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                              Cứ 3 xe tải trên đường thì có 1 xe quay về tay không. Vừa xả khói vô ích, vừa ăn mòn lợi nhuận tài xế và chủ xe.
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-emerald-500/30 bg-slate-950 p-6">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
                            <div>
                              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                Tương Tác Trực Tiếp · Interactive Agitation Tool
                              </div>
                              <h3 className="text-lg font-bold text-white mt-1">
                                Tính Lãng Phí Nhiên Liệu &amp; Phát Thải Theo Quy Mô Đội Xe
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg">
                              <Truck className="w-4 h-4 text-emerald-400" />
                              <span className="text-xs font-bold text-white">{fleetSize} Xe Tải</span>
                            </div>
                          </div>

                          <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-xs text-slate-400 font-medium">
                              <span>5 Xe (Hộ kinh doanh)</span>
                              <span>25 Xe (Hợp tác xã)</span>
                              <span>50 Xe (Doanh nghiệp SME)</span>
                              <span>100 Xe (Đội xe lớn)</span>
                            </div>
                            <input
                              type="range"
                              min={5}
                              max={100}
                              step={5}
                              value={fleetSize}
                              onChange={(e) => setFleetSize(parseInt(e.target.value, 10))}
                              className="w-full accent-emerald-400 cursor-pointer"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="rounded-xl bg-slate-900/80 border border-white/10 p-4">
                              <span className="text-xs text-slate-400">Tiền dầu lãng phí mỗi tháng:</span>
                              <div className="text-xl font-bold text-red-400 font-mono mt-1">
                                {(fleetSize * 3.8).toFixed(1)} Triệu VNĐ
                              </div>
                              <span className="text-[10.5px] text-slate-500">
                                ~{(fleetSize * 45.6).toFixed(0)} Triệu VNĐ / năm
                              </span>
                            </div>

                            <div className="rounded-xl bg-slate-900/80 border border-white/10 p-4">
                              <span className="text-xs text-slate-400">Quãng đường rỗng vô ích:</span>
                              <div className="text-xl font-bold text-amber-400 font-mono mt-1">
                                {(fleetSize * 840).toLocaleString('vi-VN')} km / tháng
                              </div>
                              <span className="text-[10.5px] text-slate-500">
                                Tương đương {(fleetSize * 0.25).toFixed(1)} vòng Trái Đất / năm
                              </span>
                            </div>

                            <div className="rounded-xl bg-slate-900/80 border border-white/10 p-4">
                              <span className="text-xs text-slate-400">Khí CO₂ phát thải thừa:</span>
                              <div className="text-xl font-bold text-cyan-400 font-mono mt-1">
                                {(fleetSize * 0.28).toFixed(1)} Tấn CO₂ / tháng
                              </div>
                              <span className="text-[10.5px] text-slate-500">
                                Tiêu chuẩn GLEC / GHG Protocol
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SLIDE 3 */}
                    {slide.id === 3 && (
                      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-10 shadow-2xl space-y-8">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                          <div>
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                              Sức Mạnh Liên Ngành · 70 Năm Đại Học Kinh Tế Quốc Dân (NEU)
                            </span>
                            <h3 className="text-2xl font-black text-white mt-1">
                              5 Mảnh Ghép Sáng Lập Toàn Diện Cho Chuyển Đổi Kép
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg bg-slate-950 border border-white/10 px-3 py-1.5 text-xs text-slate-300">
                              Viện ĐTTT, CLC &amp; POHE
                            </span>
                            <span className="rounded-lg bg-slate-950 border border-white/10 px-3 py-1.5 text-xs text-slate-300">
                              CICN
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                          <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 flex flex-col items-center text-center hover:border-emerald-400/50 transition-all group">
                            <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-emerald-400/40 group-hover:border-emerald-400 transition-all">
                              <img
                                src="/team/thuy.jpg"
                                alt="Nguyễn Thu Thuỷ"
                                className="w-full h-full object-cover"
                                style={{ objectPosition: 'center 20%' }}
                              />
                            </div>
                            <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                              Nguyễn Thu Thuỷ
                            </h4>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              2005 · ĐH Kinh Tế Quốc Dân
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-300 mt-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              QTKD Quốc Tế CLC
                            </span>
                            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                              Nghiên cứu &amp; cung cấp kiến thức chuyên môn về Logistics và Chuỗi cung ứng.
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 flex flex-col items-center text-center hover:border-emerald-400/50 transition-all group">
                            <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-emerald-400/40 group-hover:border-emerald-400 transition-all">
                              <img
                                src="/team/thanh.jpg"
                                alt="Phạm Quốc Thanh"
                                className="w-full h-full object-cover"
                                style={{ objectPosition: 'center 32%' }}
                              />
                            </div>
                            <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                              Phạm Quốc Thanh
                            </h4>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              2004 · ĐH Quốc Tế (IU - ĐHQG)
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-300 mt-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Công Nghệ &amp; AI
                            </span>
                            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                              Kiến trúc Cloudflare Edge Serverless 24/7, thuật toán VRPTW OSRM và ứng dụng PWA tài xế.
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 flex flex-col items-center text-center hover:border-emerald-400/50 transition-all group">
                            <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-emerald-400/40 group-hover:border-emerald-400 transition-all">
                              <img
                                src="/team/phuong.jpg"
                                alt="Nguyễn Ngọc Khánh Phương"
                                className="w-full h-full object-cover"
                                style={{ objectPosition: 'center 28%' }}
                              />
                            </div>
                            <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                              Khánh Phương
                            </h4>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              2004 · ĐH Ngoại Thương CS2
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-300 mt-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              ESG &amp; Bền Vững
                            </span>
                            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                              Nghiên cứu tiêu chuẩn GLEC/GHG Scope 3, chính sách giờ cấm tải đô thị và tác động môi trường.
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 flex flex-col items-center text-center hover:border-emerald-400/50 transition-all group">
                            <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-emerald-400/40 group-hover:border-emerald-400 transition-all">
                              <img
                                src="/team/phuc.jpg"
                                alt="Nguyễn Hồng Phúc"
                                className="w-full h-full object-cover"
                                style={{ objectPosition: 'center 24%' }}
                              />
                            </div>
                            <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                              Nguyễn Hồng Phúc
                            </h4>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              2004 · Đại học FPT Hà Nội
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-300 mt-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Tài Chính &amp; Vốn
                            </span>
                            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                              Xây dựng mô hình tài chính hoàn vốn 1.68 năm, IRR 28%, định giá SaaS và kế hoạch gọi vốn.
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 flex flex-col items-center text-center hover:border-emerald-400/50 transition-all group">
                            <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-emerald-400/40 group-hover:border-emerald-400 transition-all">
                              <img
                                src="/team/ngan.jpg"
                                alt="Lê Thị Hoàng Ngân"
                                className="w-full h-full object-cover"
                                style={{ objectPosition: 'center 25%' }}
                              />
                            </div>
                            <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                              Lê Thị Hoàng Ngân
                            </h4>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              2006 · ĐH Kinh Tế Quốc Dân
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-300 mt-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Thương Mại Điện Tử
                            </span>
                            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                              Nghiên cứu thị trường &amp; phân tích xu hướng hành vi khách hàng mục tiêu.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SLIDE 4 */}
                    {slide.id === 4 && (
                      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-10 shadow-2xl space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                              <Leaf className="w-5 h-5" />
                            </div>
                            <h4 className="text-sm font-bold text-white">
                              Quyết Định 876/QĐ-TTg
                            </h4>
                            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                              Chương trình hành động về chuyển đổi năng lượng xanh, giảm phát thải khí carbon và khí mê-tan của ngành GTVT đến 2050.
                            </p>
                          </div>

                          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-5">
                            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <h4 className="text-sm font-bold text-white">
                              Nghị Định 06/2022/NĐ-CP
                            </h4>
                            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                              Quy định kiểm kê khí nhà kính bắt buộc. Các doanh nghiệp trong chuỗi cung ứng phải có số liệu phát thải minh bạch.
                            </p>
                          </div>

                          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
                              <Award className="w-5 h-5" />
                            </div>
                            <h4 className="text-sm font-bold text-white">
                              Cam Kết COP26 Net Zero 2050
                            </h4>
                            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                              Logistics xanh không còn là lựa chọn xa xỉ, mà là điều kiện tiên quyết để giữ chân khách hàng FDI và chuỗi cung ứng toàn cầu.
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-slate-950 p-6">
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 text-emerald-400">
                            Lộ Trình Tầm Nhìn Chiến Lược 2026 - 2030
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 relative">
                              <span className="text-xs font-bold text-emerald-400 font-mono">2026 · GIAI ĐOẠN 1</span>
                              <h5 className="text-sm font-bold text-white mt-1">Nền Tảng Điều Phối SME</h5>
                              <p className="text-xs text-slate-400 mt-1">
                                Tối ưu tuyến giao hàng nội đô TP.HCM &amp; Hà Nội, giảm 15-20% quãng đường và đo lường CO2 tức thì.
                              </p>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 relative">
                              <span className="text-xs font-bold text-cyan-400 font-mono">2028 · GIAI ĐOẠN 2</span>
                              <h5 className="text-sm font-bold text-white mt-1">Mạng Lưới Ghép Đơn Chiều Về</h5>
                              <p className="text-xs text-slate-400 mt-1">
                                Chia sẻ chuyến xe rỗng liên doanh nghiệp tại vùng kinh tế trọng điểm phía Nam (Bình Dương, Đồng Nai).
                              </p>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 relative">
                              <span className="text-xs font-bold text-amber-400 font-mono">2030 · GIAI ĐOẠN 3</span>
                              <h5 className="text-sm font-bold text-white mt-1">Sàn Tín Chỉ Carbon Vận Tải</h5>
                              <p className="text-xs text-slate-400 mt-1">
                                Thương mại hóa lượng CO2 cắt giảm được thành chứng chỉ carbon xanh phục vụ bù trừ phát thải Net Zero.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SLIDE 5 */}
                    {slide.id === 5 && (
                      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-10 shadow-2xl space-y-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          {[
                            {
                              id: 0,
                              icon: Zap,
                              title: "1. Sắp Tuyến Động",
                              desc: "Thuật toán VRPTW"
                            },
                            {
                              id: 1,
                              icon: AlertTriangle,
                              title: "2. Cảnh Báo Lệch Tuyến",
                              desc: "Giám sát GPS real-time"
                            },
                            {
                              id: 2,
                              icon: RotateCcw,
                              title: "3. Ghép Đơn Chiều Về",
                              desc: "Cắt giảm xe chạy rỗng"
                            },
                            {
                              id: 3,
                              icon: Leaf,
                              title: "4. Báo Cáo CO₂ GLEC",
                              desc: "Chuẩn GHG Protocol"
                            }
                          ].map((f) => {
                            const isSelected = activeFeatureTab === f.id;
                            const IconComponent = f.icon;
                            return (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => setActiveFeatureTab(f.id)}
                                className={`p-4 rounded-2xl border text-left transition-all ${
                                  isSelected
                                    ? 'border-emerald-400 bg-emerald-500/15 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400'
                                    : 'border-white/10 bg-slate-950/60 hover:bg-slate-950'
                                }`}
                              >
                                <IconComponent className={`w-5 h-5 mb-2 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                                <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                  {f.title}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {f.desc}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="rounded-2xl border border-emerald-500/30 bg-slate-950 p-6">
                          {activeFeatureTab === 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                              <div>
                                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                  Công Nghệ Thuật Toán VRPTW (Vehicle Routing with Time Windows)
                                </span>
                                <h4 className="text-xl font-black text-white mt-1">
                                  Tự Động Gom Cụm &amp; Sắp Tuyến Đa Trạm Dưới 2 Giây
                                </h4>
                                <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
                                  Thay vì mất 45 phút điều phối viên sắp thủ công trên Excel, EcoMiles phân tích đồng thời 80 - 500 đơn hàng, tự động tránh khung giờ cấm tải TP.HCM (6h - 9h &amp; 16h - 20h theo QĐ 23/2018) và tính toán khoảng cách thực tế trên bản đồ số OSRM.
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2 text-xs font-mono">
                                  <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-300">
                                    Thời gian tính: 1.2s
                                  </span>
                                  <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-300">
                                    Độ chính xác OSRM: 99.4%
                                  </span>
                                </div>
                              </div>
                              <div className="p-4 rounded-xl bg-slate-900 border border-white/10 font-mono text-xs text-slate-300 space-y-2">
                                <div className="text-emerald-400 font-bold">// Ma trận khoảng cách thực tế TP.HCM</div>
                                <div>[Xe 51C-000.01]: Tân Bình → Q3 → Q1 (16 đơn)</div>
                                <div>[Xe 51C-000.02]: Thủ Đức → Bình Thạnh (18 đơn)</div>
                                <div>[Xe 51C-000.03]: Quận 7 → Nhà Bè (15 đơn)</div>
                                <div className="text-emerald-300 pt-2 border-t border-slate-800">
                                  Không vi phạm giờ cấm tải · Giảm 35% quãng đường
                                </div>
                              </div>
                            </div>
                          )}

                          {activeFeatureTab === 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                              <div>
                                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                                  Giám Sát GPS Thông Minh &amp; Cảnh Báo Chủ Động
                                </span>
                                <h4 className="text-xl font-black text-white mt-1">
                                  Chủ Động Bắt Lỗi Lệch Tuyến &amp; Ứng Biến Tắc Đường
                                </h4>
                                <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
                                  Nếu tài xế di chuyển chệch khỏi hành lang giao nhận hoặc xuất hiện điểm ùn tắc đột xuất, hệ thống phát tín hiệu cảnh báo rung trực tiếp trên ứng dụng Driver PWA và lập tức tính toán tuyến tránh thay thế.
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2 text-xs font-mono">
                                  <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-amber-300">
                                    Độ trễ GPS: &lt; 500ms
                                  </span>
                                  <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-amber-300">
                                    Cảnh báo rung PWA: Tức thì
                                  </span>
                                </div>
                              </div>
                              <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 font-mono text-xs text-slate-300 space-y-2">
                                <div className="text-amber-400 font-bold">Tín Hiệu Cảnh Báo Lệch Tuyến</div>
                                <div>Xe 51C-000.01 chệch khỏi tuyến Cách Mạng Tháng 8 (+2.4km)</div>
                                <div>Nguyên nhân: Ùn tắc cục bộ ngã 6 Dân Chủ</div>
                                <div className="text-emerald-400 pt-2 border-t border-slate-800">
                                  → EcoMiles tự đề xuất: Chuyển hướng rẽ Hoàng Sa (Nhanh hơn 12 phút)
                                </div>
                              </div>
                            </div>
                          )}

                          {activeFeatureTab === 2 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                              <div>
                                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                                  Thuật Toán Ghép Đơn Chiều Về (Smart Backhaul Matchmaking)
                                </span>
                                <h4 className="text-xl font-black text-white mt-1">
                                  Biến Xe Chạy Rỗng Thành Doanh Thu Thuần
                                </h4>
                                <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
                                  Tự động gom các đơn thu hồi hàng hoàn, đơn luân chuyển nội bộ hoặc đơn mới từ các kho lân cận trên cung đường xe quay về bãi. Biến 30 - 35% tỷ lệ xe chạy rỗng thành năng suất giao nhận hữu ích.
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2 text-xs font-mono">
                                  <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                                    Giảm chạy rỗng: 25 - 35%
                                  </span>
                                  <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                                    Tăng thu nhập tài xế: +15%
                                  </span>
                                </div>
                              </div>
                              <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 font-mono text-xs text-slate-300 space-y-2">
                                <div className="text-cyan-400 font-bold">Ghép Chiều Về Thành Công</div>
                                <div>Xe 51C-000.02 vừa hoàn tất 18 đơn tại Thủ Đức</div>
                                <div>Hệ thống phát hiện: 6 đơn trả hàng tại Bình Thạnh trên đường về</div>
                                <div className="text-cyan-300 pt-2 border-t border-slate-800">
                                  → Tự động kích hoạt hành trình chiều về có tải (Tăng 420.000đ doanh thu)
                                </div>
                              </div>
                            </div>
                          )}

                          {activeFeatureTab === 3 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                              <div>
                                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                  Đo Lường Phát Thải Tham Chiếu GLEC &amp; ISO 14083 (Chưa Chứng Nhận)
                                </span>
                                <h4 className="text-xl font-black text-white mt-1">
                                  Báo Cáo CO₂ Từng Đơn Hàng Sẵn Sàng Kiểm Toán ESG
                                </h4>
                                <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
                                  Tính toán lượng phát thải chính xác theo hệ số kgCO₂e/tấn-km của xe tải nhẹ và xe tải van. Giúp doanh nghiệp chứng minh số liệu giảm phát thải thực chất khi làm việc với đối tác xuất khẩu và sàn thương mại điện tử.
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2 text-xs font-mono">
                                  <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-300">
                                    Chuẩn: GLEC Framework v3.0 (tham chiếu)
                                  </span>
                                  <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-300">
                                    Định dạng: CSV / Excel / PDF
                                  </span>
                                </div>
                              </div>
                              <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 font-mono text-xs text-slate-300 space-y-2">
                                <div className="text-emerald-400 font-bold">Mẫu Báo Cáo Phát Thải GLEC</div>
                                <div>Tổng số kiện giao: 80 đơn hàng</div>
                                <div>Tổng phát thải thực tế: 17.6 kg CO₂e (Chuẩn cũ: 142.4 kg)</div>
                                <div className="text-emerald-400 pt-2 border-t border-slate-800">
                                  Cắt giảm ước tính: -88% CO₂e (tham chiếu GLEC, chưa chứng nhận)
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* SLIDE 6 */}
                    {slide.id === 6 && (
                      <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-slate-900/95 via-slate-900 to-emerald-950/20 p-6 sm:p-10 shadow-2xl space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                          <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400 mb-2">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>HỆ THỐNG VẬN HÀNH THỰC TẾ TRÊN CLOUDFLARE 24/7</span>
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight">
                              Trực Quan Hoá Bàn Điều Hành &amp; Ứng Dụng Tài Xế Di Động
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                              Tối ưu tuyến đường, theo dõi vị trí xe thời gian thực và xuất báo cáo phát thải chỉ trong vài cú nhấp chuột.
                            </p>
                          </div>

                          <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 shrink-0">
                            <button
                              type="button"
                              onClick={() => setActiveConsoleTab('both')}
                              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                                activeConsoleTab === 'both'
                                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Ghép Đôi Cả 2 Máy</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveConsoleTab('dispatcher')}
                              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
                                activeConsoleTab === 'dispatcher'
                                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <Monitor className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Bàn Điều Hành</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveConsoleTab('driver')}
                              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
                                activeConsoleTab === 'driver'
                                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">App Tài Xế</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveConsoleTab('devices_7')}
                              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer ${
                                activeConsoleTab === 'devices_7'
                                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span>Dàn 7 Thiết Bị</span>
                            </button>
                          </div>
                        </div>

                        {/* BOTH DEVICES COMBINED VIEW (DEFAULT) */}
                        {activeConsoleTab === 'both' && (
                          <div className="space-y-6">
                            {/* Dual Device Stage */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                              {/* Desktop Dispatcher Frame (8 cols on lg) */}
                              <div className="lg:col-span-8 rounded-2xl border border-slate-700/80 bg-slate-950 shadow-2xl overflow-hidden flex flex-col group">
                                {/* Browser Window Bar */}
                                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                                    <span className="text-[11px] font-mono text-slate-400 ml-2 hidden sm:inline">
                                      EcoMiles Dispatcher Console · Điều Phối Tuyến TP.HCM
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 rounded-md bg-slate-950 border border-slate-800 px-2.5 py-1 text-[10px] font-mono text-emerald-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span>https://ecomiles.pages.dev/app/</span>
                                  </div>
                                </div>

                                {/* Browser Content Image */}
                                <div className="relative bg-slate-950">
                                  <img
                                    src="/screenshots/dispatcher-ecomiles.png"
                                    alt="Bàn điều hành EcoMiles: 80 điểm giao hàng, 5 tuyến xe và báo cáo CO2"
                                    className="w-full h-auto object-cover"
                                  />
                                  <div className="absolute top-3 left-3 bg-slate-950/90 border border-emerald-500/40 rounded-lg px-3 py-1.5 text-[11px] text-emerald-300 font-semibold backdrop-blur-md shadow-lg hidden sm:flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                    <span>Phân cụm 80 đơn · 5 tuyến xe tải · Giảm -88.03% km</span>
                                  </div>
                                </div>

                                {/* Bottom Footer of Browser */}
                                <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-t border-slate-800 text-xs">
                                  <div className="flex items-center gap-2 text-slate-300">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                    <span className="font-semibold text-emerald-400">Cloudflare D1 &amp; Workers:</span>
                                    <span className="text-slate-400 hidden sm:inline">Tối ưu hoá VRPTW + 2-Opt tức thì</span>
                                  </div>
                                  <a
                                    href="/app/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 text-xs font-bold shadow-md shadow-emerald-500/20 transition"
                                  >
                                    <span>Mở Bàn Điều Hành (/app/)</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>

                              {/* Mobile Smartphone Frame (4 cols on lg) */}
                              <div className="lg:col-span-4 flex flex-col items-center">
                                {/* iPhone Mockup Container */}
                                <div className="w-full max-w-[290px] rounded-[38px] border-[5px] border-slate-700 bg-slate-950 shadow-2xl overflow-hidden relative group">
                                  {/* Dynamic Island Notch */}
                                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-20 flex items-center justify-center">
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 mr-2"></div>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500/40"></div>
                                  </div>

                                  {/* Smartphone Screen Content */}
                                  <div className="pt-2 bg-slate-950">
                                    <img
                                      src="/screenshots/driver-ecomiles.png"
                                      alt="App tài xế EcoMiles trên điện thoại thông minh"
                                      className="w-full h-auto object-cover max-h-[500px]"
                                    />
                                  </div>

                                  {/* Smartphone Bottom Bar */}
                                  <div className="p-3 bg-slate-900 border-t border-slate-800 text-center">
                                    <a
                                      href="/driver/?plate=51C-000.01"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-2 text-xs font-bold transition shadow-md shadow-amber-400/20"
                                    >
                                      <Smartphone className="w-3.5 h-3.5" />
                                      <span>Mở App Tài Xế (/driver/)</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                </div>
                                <span className="text-[11px] text-slate-400 font-medium mt-2 text-center">
                                  PWA di động cho tài xế · Nhận lệnh tức thì &amp; Cảnh báo cấm tải
                                </span>
                              </div>
                            </div>

                            {/* Operational Synergy Loop */}
                            <div className="rounded-2xl bg-slate-950/80 border border-white/10 p-4 sm:p-5">
                              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                <span>Vòng Khép Kín Vận Hành: Từ Bàn Điều Hành Đến Từng Bánh Xe Lăn</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                                <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3">
                                  <div className="text-emerald-400 font-bold mb-1">1. Phân Cụm VRPTW</div>
                                  <p className="text-slate-300">Gộp 80 đơn hàng vào 5 xe tải tự động qua giải thuật VRPTW và 2-Opt.</p>
                                </div>
                                <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3">
                                  <div className="text-cyan-400 font-bold mb-1">2. Cảnh Báo Giờ Cấm Tải TP.HCM</div>
                                  <p className="text-slate-300">Tự động cảnh báo vi phạm khung giờ cấm tải theo QĐ 23/2018 (khung 06h - 09h &amp; 16h - 20h).</p>
                                </div>
                                <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3">
                                  <div className="text-amber-400 font-bold mb-1">3. Đồng Bộ Điện Thoại &lt;0.2s</div>
                                  <p className="text-slate-300">Tài xế nhận lộ trình theo thứ tự 1-2-3 trên PWA, gọi khách và xác nhận 1-chạm.</p>
                                </div>
                                <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3">
                                  <div className="text-emerald-400 font-bold mb-1">4. Kiểm Kê CO₂ Scope 3</div>
                                  <p className="text-slate-300">Tự động phát hành báo cáo phát thải ước tính theo khung GLEC / ISO 14083, chưa chứng nhận.</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* DISPATCHER ONLY VIEW */}
                        {activeConsoleTab === 'dispatcher' && (
                          <div className="space-y-4">
                            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl group">
                              <img
                                src="/screenshots/dispatcher-ecomiles.png"
                                alt="Bàn điều hành EcoMiles: 80 điểm giao hàng, 5 tuyến xe và báo cáo CO2"
                                className="w-full h-auto object-cover max-h-[560px]"
                              />
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4 flex items-center justify-between">
                                <div className="text-xs text-slate-300">
                                  <strong className="text-emerald-400">Bàn Điều Hành Dispatcher:</strong> Bản đồ OSM trực quan 80 điểm giao, 5 tuyến xe tải đa màu sắc, báo cáo phát thải -88% CO2.
                                </div>
                                <a
                                  href="/app/"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 text-xs font-bold shadow-md shadow-emerald-500/20 shrink-0"
                                >
                                  <span>Mở App Thật (/app/)</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* DRIVER ONLY VIEW */}
                        {activeConsoleTab === 'driver' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6 items-center">
                              <div className="space-y-4">
                                <div className="rounded-2xl bg-slate-950 border border-white/10 p-5 space-y-3">
                                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Thiết Kế Tối Giản Dành Riêng Cho Tài Xế Xe Tải</span>
                                  </div>
                                  <p className="text-xs text-slate-300 leading-relaxed">
                                    Không đòi hỏi cài đặt phức tạp từ App Store / Google Play. Chạy mượt mà trên nền Web PWA, tiết kiệm dung lượng 3G/4G và tương thích với mọi dòng điện thoại thông minh.
                                  </p>
                                  <div className="space-y-2 text-xs font-mono text-slate-300">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                      <span>Nhận thứ tự điểm dừng tối ưu theo thứ tự 1, 2, 3...</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                      <span>Cảnh báo giờ cấm tải TP.HCM (06h - 09h &amp; 16h - 20h)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                      <span>Cập nhật trạng thái 'Đã giao' / 'Báo hoãn' 1-chạm</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-3">
                                  <a
                                    href="/driver/?plate=51C-000.01"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 px-4 py-2.5 text-xs font-bold transition shadow-md shadow-emerald-400/20"
                                  >
                                    <Smartphone className="w-4 h-4" />
                                    <span>Mở App Tài Xế (51C-000.01)</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>

                              <div className="flex justify-center">
                                <div className="rounded-3xl border-4 border-slate-800 bg-slate-950 p-2 shadow-2xl max-w-[280px]">
                                  <img
                                    src="/screenshots/driver-ecomiles.png"
                                    alt="Giao diện di động EcoMiles dành cho tài xế"
                                    className="w-full h-auto rounded-2xl"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 4TH TAB: 7-DEVICE SYNC HARDWARE STAGE */}
                        {activeConsoleTab === 'devices_7' && (
                          <div className="space-y-5">
                            <div
                              onClick={() => setLightboxAsset('00_ecomiles_clean_devices_hero_stage.png')}
                              className="relative rounded-2xl overflow-hidden border border-emerald-500/40 bg-slate-950 p-3 group cursor-zoom-in shadow-2xl"
                            >
                              <img
                                src="/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png"
                                alt="EcoMiles 7 Thiết Bị Đồng Bộ"
                                className="w-full max-h-[340px] object-contain mx-auto rounded-xl drop-shadow-[0_18px_36px_rgba(0,0,0,0.85)]"
                              />
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                              {[
                                { file: '26_mockup_macbook_pro_16_b2b_tms.png', name: 'MacBook Pro 16"', role: 'B2B TMS' },
                                { file: '27_mockup_windows_xps_16_evsim_dual.png', name: 'Windows XPS 16', role: 'EVSIM Dual' },
                                { file: '24_mockup_samsung_zfold_tablet_cockpit.png', name: 'Galaxy Z Fold', role: 'Cockpit Ops' },
                                { file: '25_mockup_ipad_pro_tablet_tms.png', name: 'iPad Pro M4', role: 'Warehouse TMS' },
                                { file: '23_mockup_iphone_duo_dual_screen.png', name: 'iPhone Duo', role: 'Dual-Screen' },
                                { file: '21_mockup_iphone_18_pro_max_driver.png', name: 'iPhone 18 Pro Max', role: 'Driver App' },
                                { file: '22_mockup_samsung_s26_ultra_maps_live.png', name: 'Galaxy S26 Ultra', role: 'Live /maps' },
                              ].map((dev) => (
                                <button
                                  key={dev.file}
                                  type="button"
                                  onClick={() => setLightboxAsset(dev.file)}
                                  className="group rounded-xl border border-white/10 bg-slate-950 p-2 text-left hover:border-emerald-400/50 transition-all cursor-zoom-in flex flex-col justify-between"
                                >
                                  <img
                                    src={`/pitch-deck-screenshots/${dev.file}`}
                                    alt={dev.name}
                                    className="w-full h-24 object-contain rounded-lg bg-black/40 p-1"
                                  />
                                  <div className="mt-2 min-w-0">
                                    <div className="text-[11px] font-bold text-white truncate">{dev.name}</div>
                                    <div className="text-[10px] text-slate-400 truncate">{dev.role}</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SLIDE 7 */}
                    {slide.id === 7 && (
                      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-10 shadow-2xl space-y-6">
                        <div className="text-center max-w-2xl mx-auto">
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                            Lợi Thế Cạnh Tranh Bền Vững · Competitive Moat
                          </span>
                          <h3 className="text-2xl font-black text-white mt-1">
                            Tại Sao EcoMiles Vượt Trội Trên Thị Trường?
                          </h3>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-800 text-slate-400">
                                <th className="py-3 px-4 font-bold text-white">Tiêu Chí Đánh Giá</th>
                                <th className="py-3 px-4 font-black text-emerald-400 bg-emerald-500/10 rounded-t-xl">
                                  EcoMiles
                                </th>
                                <th className="py-3 px-4 font-semibold text-slate-300">File Excel / Zalo</th>
                                <th className="py-3 px-4 font-semibold text-slate-300">TMS Truyền Thống</th>
                                <th className="py-3 px-4 font-semibold text-slate-300">App Gọi Xe (Lalamove)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono">
                              <tr>
                                <td className="py-3 px-4 font-sans font-medium text-slate-200">
                                  Tối ưu tuyến tự động thời gian thực (VRPTW)
                                </td>
                                <td className="py-3 px-4 font-bold text-emerald-400 bg-emerald-500/5">
                                  &lt; 2 Giây (AI OSRM)
                                </td>
                                <td className="py-3 px-4 text-red-400">Thủ công (30-60p)</td>
                                <td className="py-3 px-4 text-amber-300">Có (Nhưng chậm)</td>
                                <td className="py-3 px-4 text-red-400">Ghép đơn lẻ điểm</td>
                              </tr>
                              <tr>
                                <td className="py-3 px-4 font-sans font-medium text-slate-200">
                                  Xử lý giờ cấm tải TP.HCM (QĐ 23/2019)
                                </td>
                                <td className="py-3 px-4 font-bold text-emerald-400 bg-emerald-500/5">
                                  Tự động cảnh báo
                                </td>
                                <td className="py-3 px-4 text-red-400">Dễ dính phạt</td>
                                <td className="py-3 px-4 text-red-400">Không có dữ liệu VN</td>
                                <td className="py-3 px-4 text-amber-300">Tài xế tự né</td>
                              </tr>
                              <tr>
                                <td className="py-3 px-4 font-sans font-medium text-slate-200">
                                  Báo cáo CO₂ chuẩn GLEC / GHG Protocol
                                </td>
                                <td className="py-3 px-4 font-bold text-emerald-400 bg-emerald-500/5">
                                  Từng kiện hàng
                                </td>
                                <td className="py-3 px-4 text-red-400">Không có</td>
                                <td className="py-3 px-4 text-red-400">Không có</td>
                                <td className="py-3 px-4 text-red-400">Không có</td>
                              </tr>
                              <tr>
                                <td className="py-3 px-4 font-sans font-medium text-slate-200">
                                  Ghép đơn chiều về giảm xe chạy rỗng
                                </td>
                                <td className="py-3 px-4 font-bold text-emerald-400 bg-emerald-500/5">
                                  Giảm 30 - 35%
                                </td>
                                <td className="py-3 px-4 text-red-400">Quay về rỗng</td>
                                <td className="py-3 px-4 text-amber-300">Hạn chế</td>
                                <td className="py-3 px-4 text-red-400">Không hỗ trợ</td>
                              </tr>
                              <tr>
                                <td className="py-3 px-4 font-sans font-medium text-slate-200">
                                  Chi phí &amp; Triển khai cho SME
                                </td>
                                <td className="py-3 px-4 font-bold text-emerald-400 bg-emerald-500/5">
                                  199k/xe (Dùng thử 0đ)
                                </td>
                                <td className="py-3 px-4 text-emerald-400">Miễn phí</td>
                                <td className="py-3 px-4 text-red-400">Đắt (&gt; 50-100tr)</td>
                                <td className="py-3 px-4 text-red-400">Chiết khấu cao (18-20%)</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Interactive 4-Device Field Hardware Switcher */}
                        {(() => {
                          const FIELD_DEVICES = [
                            {
                              label: '1. iPhone Duo · Gập Đôi 2 Màn Hình',
                              file: '23_mockup_iphone_duo_dual_screen.png',
                              role: 'Dual-Screen Manifest + Waypoints',
                              desc: 'Màn trái hiển thị bảng kê Middle-Mile (Xe tải >2.5T), màn phải chạy điều hướng Last-Mile (<=500kg) khóa điểm dừng Google Maps ($0 API).',
                              primaryHref: '/driver/',
                              primaryText: 'Mở App Tài Xế (/driver)',
                            },
                            {
                              label: '2. iPhone 18 Pro Max · Chế Độ Nắng Gắt',
                              file: '21_mockup_iphone_18_pro_max_driver.png',
                              role: 'High-Contrast Outdoor HUD',
                              desc: 'Giao diện PWA tương phản cao ngoài trời nắng gắt TP.HCM, cảnh báo khung giờ cấm tải QĐ 23/2018 (06h-09h & 16h-20h) và ký nhận giao hàng 1-chạm.',
                              primaryHref: '/driver/',
                              primaryText: 'Mở App Tài Xế (/driver)',
                            },
                            {
                              label: '3. Galaxy S26 Ultra · Hẻm Nhỏ Waypoints',
                              file: '22_mockup_samsung_s26_ultra_maps_live.png',
                              role: 'Alley Waypoints & Live Truck Follow',
                              desc: 'Tự động tách đơn hẻm nhỏ Quận 3 / Quận 10 sang xe van <=500kg và xuất URL Google Maps khóa cứng thứ tự Waypoints 1-2-3.',
                              primaryHref: '/maps/?vehicle=0&mode=navigate',
                              primaryText: 'Mở Bản Đồ (/maps Live)',
                            },
                            {
                              label: '4. Galaxy Z Fold · Buồng Lái /maps',
                              file: '24_mockup_samsung_zfold_tablet_cockpit.png',
                              role: 'In-Cab Tablet Cockpit (/maps)',
                              desc: 'Màn hình gập 7.6" gắn taplo xe tải hiển thị đồng thời lộ trình OSRM thực tế, vùng đỏ cấm tải QĐ 23 và telemetry nhiên liệu / CO₂ thời gian thực.',
                              primaryHref: '/maps/?vehicle=0&mode=navigate',
                              primaryText: 'Mở Buồng Lái (/maps)',
                            },
                          ];
                          const currentDevice = FIELD_DEVICES[activeFieldDeviceIdx] ?? FIELD_DEVICES[0];
                          return (
                            <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/90 p-5 space-y-4">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                                  4 Thiết Bị Thực Địa &amp; Buồng Lái Tạo Nên Lợi Thế $0 Map API
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {FIELD_DEVICES.map((dev, idx) => (
                                    <button
                                      key={dev.label}
                                      type="button"
                                      onClick={() => setActiveFieldDeviceIdx(idx)}
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                                        activeFieldDeviceIdx === idx
                                          ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                                          : 'bg-slate-900 text-slate-300 border-white/10 hover:text-white'
                                      }`}
                                    >
                                      {dev.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                                <div className="lg:col-span-6 flex flex-col items-center justify-center rounded-xl border border-white/10 bg-slate-900/70 p-3">
                                  <button
                                    type="button"
                                    onClick={() => setLightboxAsset(currentDevice.file)}
                                    className="group cursor-zoom-in"
                                  >
                                    <img
                                      src={`/pitch-deck-screenshots/${currentDevice.file}`}
                                      alt={currentDevice.label}
                                      className="max-h-[240px] w-auto object-contain mx-auto rounded-lg drop-shadow-2xl"
                                    />
                                    <span className="mt-1.5 block text-[10px] font-mono text-slate-400 group-hover:text-emerald-300">
                                      🔍 Bấm để phóng to 2.4K ({currentDevice.file})
                                    </span>
                                  </button>
                                </div>
                                <div className="lg:col-span-6 space-y-3">
                                  <span className="inline-block rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10.5px] font-mono font-bold text-emerald-300">
                                    {currentDevice.role}
                                  </span>
                                  <h4 className="text-base font-black text-white">{currentDevice.label}</h4>
                                  <p className="text-xs text-slate-300 leading-relaxed">{currentDevice.desc}</p>
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    <a
                                      href={currentDevice.primaryHref}
                                      className="px-3.5 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-extrabold transition"
                                    >
                                      {currentDevice.primaryText} ↗
                                    </a>
                                    <a
                                      href="/maps/?vehicle=0&mode=navigate"
                                      className="px-3.5 py-1.5 rounded-xl border border-white/15 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold transition"
                                    >
                                      Bản Đồ Xe Tải (/maps) ↗
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* SLIDE 8 */}
                    {slide.id === 8 && (
                      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-10 shadow-2xl space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="rounded-2xl border border-emerald-500/30 bg-slate-950 p-5 text-center">
                            <span className="text-xs uppercase font-bold text-slate-400">Thời Gian Hoàn Vốn</span>
                            <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono mt-1">
                              1.68 Năm
                            </div>
                            <span className="text-[11px] text-emerald-300/80 mt-1 block">
                              Payback Period (Nhanh)
                            </span>
                          </div>

                          <div className="rounded-2xl border border-cyan-500/30 bg-slate-950 p-5 text-center">
                            <span className="text-xs uppercase font-bold text-slate-400">Tỷ Suất Sinh Lời Nội Bộ</span>
                            <div className="text-3xl sm:text-4xl font-black text-cyan-400 font-mono mt-1">
                              28.0%
                            </div>
                            <span className="text-[11px] text-cyan-300/80 mt-1 block">
                              IRR (Vượt xa lãi suất 15%)
                            </span>
                          </div>

                          <div className="rounded-2xl border border-amber-500/30 bg-slate-950 p-5 text-center">
                            <span className="text-xs uppercase font-bold text-slate-400">Giá Trị Hiện Tại Ròng</span>
                            <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono mt-1">
                              185.5 Tr
                            </div>
                            <span className="text-[11px] text-amber-300/80 mt-1 block">
                              NPV Dương (Khả thi cao)
                            </span>
                          </div>

                          <div className="rounded-2xl border border-purple-500/30 bg-slate-950 p-5 text-center">
                            <span className="text-xs uppercase font-bold text-slate-400">Dòng Tiền Tự Do</span>
                            <div className="text-3xl sm:text-4xl font-black text-purple-400 font-mono mt-1">
                              Năm 2
                            </div>
                            <span className="text-[11px] text-purple-300/80 mt-1 block">
                              Lợi nhuận dương bền vững
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div className="rounded-2xl bg-slate-950 border border-white/10 p-5">
                            <div className="text-xs font-bold text-emerald-400 uppercase">1. B2B SaaS Thuê Bao</div>
                            <div className="text-xl font-black text-white mt-1">199.000đ - 399.000đ</div>
                            <div className="text-xs text-slate-400 mt-1">trên mỗi xe / tháng</div>
                            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                              Chi phí cực thấp cho doanh nghiệp SME (so với tiết kiệm được 3 - 5 triệu tiền dầu/tháng). Dễ dàng chuyển đổi từ dùng thử miễn phí sang trả phí.
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-950 border border-white/10 p-5">
                            <div className="text-xs font-bold text-cyan-400 uppercase">2. Báo Cáo Kiểm Toán ESG</div>
                            <div className="text-xl font-black text-white mt-1">Gói Doanh Nghiệp</div>
                            <div className="text-xs text-slate-400 mt-1">Báo cáo tham chiếu GLEC/GHG (chưa chứng nhận)</div>
                            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                              Cung cấp dữ liệu ước tính phát thải khí nhà kính theo khung GLEC cho các công ty logistics làm việc với khách hàng FDI hoặc sàn TMĐT quốc tế.
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-950 border border-white/10 p-5">
                            <div className="text-xs font-bold text-amber-400 uppercase">3. Hoa Hồng Ghép Chuyến</div>
                            <div className="text-xl font-black text-white mt-1">1.5% Phí Giao Dịch</div>
                            <div className="text-xs text-slate-400 mt-1">Trên mỗi đơn chiều về</div>
                            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                              Thu phí khi kết nối thành công chuyến hàng chiều về giữa các chủ hàng và đội xe rỗng, tạo thêm nguồn doanh thu tuần hoàn.
                            </p>
                          </div>
                        </div>

                        {/* 7-Device Zero-Knowledge Endpoint Matrix */}
                        <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/90 p-5 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                            <div>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                                Ma Trận 7 Thiết Bị Đầu Cuối &amp; Kiểm Toán Zero-Knowledge (AES-256-GCM)
                              </span>
                              <span className="text-xs text-slate-300">
                                Toàn bộ 7 thiết bị phần cứng chỉ tốn 0đ phí bản đồ API và được cách ly khóa KMS theo từng doanh nghiệp
                              </span>
                            </div>
                            <a
                              href="/portal/audit/"
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-extrabold transition shrink-0"
                            >
                              Mở Cổng Kiểm Toán (/portal/audit) ↗
                            </a>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                            {[
                              { name: 'MacBook Pro 16"', file: '26_mockup_macbook_pro_16_b2b_tms.png', role: 'B2B TMS', zk: 'RBAC · TLS 1.3' },
                              { name: 'Windows 11 XPS 16', file: '27_mockup_windows_xps_16_evsim_dual.png', role: 'EVSIM Lab', zk: 'GLEC Hash' },
                              { name: 'Galaxy Z Fold', file: '24_mockup_samsung_zfold_tablet_cockpit.png', role: 'Cockpit /maps', zk: 'Zero-PII' },
                              { name: 'iPad Pro M4', file: '25_mockup_ipad_pro_tablet_tms.png', role: 'Depot Hub', zk: 'Signed QR' },
                              { name: 'iPhone Duo', file: '23_mockup_iphone_duo_dual_screen.png', role: '2-Tier App', zk: 'PIN 0000' },
                              { name: 'iPhone 18 Pro Max', file: '21_mockup_iphone_18_pro_max_driver.png', role: 'Middle-Mile', zk: 'PoD Stamp' },
                              { name: 'Galaxy S26 Ultra', file: '22_mockup_samsung_s26_ultra_maps_live.png', role: 'Waypoints', zk: '$0 Map API' },
                            ].map((ep) => (
                              <button
                                key={ep.name}
                                type="button"
                                onClick={() => setLightboxAsset(ep.file)}
                                className="group rounded-xl border border-white/10 bg-slate-900/90 p-2 text-left hover:border-emerald-400/50 transition-all cursor-zoom-in flex flex-col justify-between"
                              >
                                <img
                                  src={`/pitch-deck-screenshots/${ep.file}`}
                                  alt={ep.name}
                                  className="w-full h-20 object-contain rounded-lg bg-slate-950/80 p-1"
                                  loading="lazy"
                                />
                                <div className="mt-1.5 min-w-0">
                                  <div className="text-[10.5px] font-bold text-white truncate">{ep.name}</div>
                                  <div className="text-[9.5px] text-emerald-400 font-semibold truncate">{ep.role}</div>
                                  <div className="text-[9px] font-mono text-slate-400 truncate">{ep.zk}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SLIDE 9 */}
                    {slide.id === 9 && (
                      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-10 shadow-2xl space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-4">
                              <Leaf className="w-6 h-6" />
                            </div>
                            <h4 className="text-base font-bold text-white">Hơi Thở Cho Thành Phố</h4>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                              Một tuyến đường không chạy rỗng là hàng trăm lít dầu không bị đốt cháy, giảm khói bụi mịn PM2.5 và giảm ùn tắc giao thông tại các trục huyết mạch đô thị.
                            </p>
                          </div>

                          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-6 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto mb-4">
                              <Users className="w-6 h-6" />
                            </div>
                            <h4 className="text-base font-bold text-white">Nhân Văn Cho Tài Xế</h4>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                              Có lộ trình rõ ràng, tài xế không còn căng thẳng chạy vòng tìm địa chỉ, không sợ dính phạt cấm tải, tan ca sớm hơn 45 phút để về với gia đình.
                            </p>
                          </div>

                          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-4">
                              <TrendingUp className="w-6 h-6" />
                            </div>
                            <h4 className="text-base font-bold text-white">Bền Vững Cho Doanh Nghiệp</h4>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                              Giảm chi phí vận hành mà không phải bỏ hàng tỷ đồng thay xe điện ngay lập tức. Kinh tế và môi trường hoàn toàn có thể song hành!
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-slate-950 p-5 flex flex-wrap items-center justify-between gap-4">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                            Đóng Góp Trực Tiếp Vào 4 Mục Tiêu Phát Triển Bền Vững (UN SDGs):
                          </span>
                          <div className="flex flex-wrap gap-2 text-xs font-bold">
                            <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                              SDG 9: Đổi Mới &amp; Hạ Tầng
                            </span>
                            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              SDG 11: Đô Thị Bền Vững
                            </span>
                            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              SDG 12: Tiêu Dùng Trách Nhiệm
                            </span>
                            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                              SDG 13: Hành Động Vì Khí Hậu
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SLIDE 10 */}
                    {slide.id === 10 && (
                      <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40 p-6 sm:p-12 shadow-2xl text-center space-y-8">
                        <div className="max-w-3xl mx-auto space-y-4">
                          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-4 py-1.5 text-xs font-bold text-emerald-400">
                            <Sparkles className="w-4 h-4" />
                            <span>OLYMPIC KHỞI NGHIỆP 2026 (SO 2026) · BAN GIÁM KHẢO &amp; NHÀ ĐẦU TƯ</span>
                          </div>

                          <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                            “Tối Ưu Vận Chuyển · Tiết Kiệm Chi Phí · Kiến Tạo Tương Lai Xanh”
                          </h3>

                          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
                            EcoMiles sẵn sàng hợp tác cùng các Quỹ Đầu Tư, Vườn Ươm Khởi Nghiệp và các Doanh Nghiệp Vận Tải tiên phong để xanh hoá logistics Việt Nam ngay từ hôm nay.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto pt-4">
                          <a
                            href="/app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20"
                          >
                            <Monitor className="w-5 h-5" />
                            <span>Mở Bàn Điều Hành</span>
                            <span className="text-[10px] opacity-80">Dispatcher Console (Live)</span>
                          </a>

                          <a
                            href="/driver/?plate=51C-000.01"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-2 transition"
                          >
                            <Smartphone className="w-5 h-5" />
                            <span>App Tài Xế Di Động</span>
                            <span className="text-[10px] text-slate-400">PWA 51C-000.01</span>
                          </a>

                          <a
                            href="/slides/EcoMiles_Pitch_Deck_SO2026_No_Subtitles.pdf"
                            download="EcoMiles_Pitch_Deck_SO2026_No_Subtitles.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-2 transition"
                          >
                            <Download className="w-5 h-5 text-cyan-400" />
                            <span>Tải Pitch Deck PDF</span>
                            <span className="text-[10px] text-slate-400">16:9 Không Phụ Đề</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              if (onBackToHome) {
                                onBackToHome();
                              } else {
                                window.location.href = '/#pilot';
                              }
                            }}
                            className="p-4 rounded-2xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-2 transition shadow-lg shadow-ecomiles-lime/20"
                          >
                            <Zap className="w-5 h-5" />
                            <span>Đăng Ký Pilot 4 - 6 Tuần</span>
                            <span className="text-[10px] opacity-80">Miễn Phí Thử Nghiệm</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Voice-over Presenter Transcript Box */}
                {showCaptions && (
                  <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl transition-all print:hidden">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Lời Thoại Thuyết Minh (Voice-Over Script) · {slide.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleVoiceoverSpeech(slide.id)}
                          className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                        >
                          {isPlayingAudio && isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          <span>{isPlayingAudio && isActive ? 'Tạm dừng' : 'Đọc mẫu'}</span>
                        </button>
                      </div>
                    </div>
                    <blockquote className="text-sm sm:text-base leading-relaxed text-slate-200 font-serif italic border-l-2 border-emerald-400 pl-4 py-1">
                      {slide.voiceover}
                    </blockquote>
                  </div>
                )}
              </div>
            </section>
          );
        })}

        {/* Complete 28-Asset Pitch Deck & Multi-Device Screenshot Gallery (00..27) */}
        <section id="pitch-deck-screenshots" className="mx-auto max-w-6xl px-4 sm:px-6 pt-12 pb-8">
          <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/90 p-6 sm:p-10 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-ecomiles-lime">
                  PHỤ LỤC HÌNH ẢNH PITCH DECK · 28 RETINA PNG ASSETS (00..27)
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  Bộ Ảnh Chụp Màn Hình &amp; Mockup 7 Thiết Bị (Desktop · Tablet · Mobile)
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-xl p-1 bg-slate-950 border border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setGalleryStageMode('studio_24k')}
                    className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                      galleryStageMode === 'studio_24k'
                        ? 'bg-ecomiles-lime text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    1. Ảnh Bìa Studio 2.4K (PNG)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGalleryStageMode('webgl_3d')}
                    className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                      galleryStageMode === 'webgl_3d'
                        ? 'bg-ecomiles-lime text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    2. Sân Khấu 3D WebGL (7 Thiết Bị)
                  </button>
                </div>
                <a
                  href="/pitch-deck-screenshots/00_ecomiles_flagship_cover_banner.png"
                  download="00_ecomiles_flagship_cover_banner.png"
                  className="px-4 py-2 rounded-xl bg-ecomiles-lime text-slate-950 font-extrabold text-xs"
                >
                  Tải Ảnh Bìa 7 Thiết Bị (2400x1260 PNG)
                </a>
              </div>
            </div>

            {/* Featured Master Cover Banners (00 & 00_clean) + 7 Hardware Mockups (21..27) + 4 Slide Composites (17..20) */}
            <div className="space-y-6">
              {galleryStageMode === 'webgl_3d' ? (
                <div className="rounded-2xl border border-ecomiles-lime/40 bg-slate-950 p-3">
                  <ThreeDeviceEcosystemBanner
                    selectedDeviceId={deckWebglFocusId}
                    onSelectDevice={setDeckWebglFocusId}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setLightboxAsset('00_ecomiles_clean_devices_hero_stage.png')}
                    className="text-left block rounded-2xl overflow-hidden border border-ecomiles-lime/40 bg-slate-950 p-2 hover:border-ecomiles-lime transition-colors cursor-zoom-in"
                  >
                    <img
                      src="/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png"
                      alt="00_clean - Pure 7-Device Studio Stage with Floor Reflections (2400x1120)"
                      className="w-full h-auto rounded-xl"
                      loading="lazy"
                    />
                    <div className="text-[11px] font-mono text-ecomiles-lime mt-2 px-1 truncate">
                      00_ecomiles_clean_devices_hero_stage.png (Bấm để phóng to High-DPI · 2400×1120)
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxAsset('00_ecomiles_flagship_cover_banner.png')}
                    className="text-left block rounded-2xl overflow-hidden border border-white/15 bg-slate-950 p-2 hover:border-ecomiles-lime/50 transition-colors cursor-zoom-in"
                  >
                    <img
                      src="/pitch-deck-screenshots/00_ecomiles_flagship_cover_banner.png"
                      alt="00 - Master 7-Device Flagship Cover Banner (2400x1260)"
                      className="w-full h-auto rounded-xl"
                      loading="lazy"
                    />
                    <div className="text-[11px] font-mono text-slate-300 mt-2 px-1 truncate">
                      00_ecomiles_flagship_cover_banner.png (Bấm để phóng to High-DPI · 2400×1260)
                    </div>
                  </button>
                </div>
              )}

              {/* 7 Individual Hardware Mockups (21..27) */}
              <div>
                <h3 className="text-sm font-bold text-ecomiles-lime uppercase tracking-wider mb-3">
                  7 Mockup Thiết Bị Độc Lập (MacBook Pro · Windows XPS · Z Fold · iPad Pro · iPhone Duo · 18 Pro Max · S26 Ultra)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {[
                    '26_mockup_macbook_pro_16_b2b_tms.png',
                    '27_mockup_windows_xps_16_evsim_dual.png',
                    '24_mockup_samsung_zfold_tablet_cockpit.png',
                    '25_mockup_ipad_pro_tablet_tms.png',
                    '23_mockup_iphone_duo_dual_screen.png',
                    '21_mockup_iphone_18_pro_max_driver.png',
                    '22_mockup_samsung_s26_ultra_maps_live.png',
                  ].map((fname) => (
                    <button
                      key={fname}
                      type="button"
                      onClick={() => setLightboxAsset(fname)}
                      className="text-left flex flex-col justify-between rounded-2xl overflow-hidden border border-white/10 bg-slate-950 p-2 hover:border-ecomiles-lime/50 transition-colors cursor-zoom-in"
                    >
                      <img
                        src={`/pitch-deck-screenshots/${fname}`}
                        alt={fname}
                        className="w-full h-28 object-contain mx-auto"
                        loading="lazy"
                      />
                      <div className="text-[10px] font-mono text-slate-300 mt-2 px-1 truncate">{fname}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 Slide Composites (17..20) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  '17_slide_composite_all_devices_hero_trio.png',
                  '18_slide_composite_driver_and_maps_mobile_tablet.png',
                  '19_slide_composite_dispatcher_and_evsim_benchmark.png',
                  '20_slide_composite_4role_enterprise_architecture.png',
                ].map((fname) => (
                  <button
                    key={fname}
                    type="button"
                    onClick={() => setLightboxAsset(fname)}
                    className="text-left block rounded-2xl overflow-hidden border border-white/10 bg-slate-950 p-2 hover:border-ecomiles-lime/50 transition-colors cursor-zoom-in"
                  >
                    <img
                      src={`/pitch-deck-screenshots/${fname}`}
                      alt={fname}
                      className="w-full h-auto rounded-xl"
                      loading="lazy"
                    />
                    <div className="text-[11px] font-mono text-slate-300 mt-2 px-1 truncate">{fname}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Persistent Bottom Presenter Bar */}
      <footer className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-xl px-4 py-3 shadow-2xl print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 font-black text-xs">
              {activeSlide < 10 ? `0${activeSlide}` : activeSlide}
            </span>
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-white block">
                {SLIDES[activeSlide - 1]?.title}
              </span>
              <span className="text-[10px] text-slate-400">
                {SLIDES[activeSlide - 1]?.tag}
              </span>
            </div>
          </div>

          <div className="flex-1 max-w-md hidden md:block">
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-ecomiles-lime transition-all duration-300"
                style={{ width: `${(activeSlide / SLIDES.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={activeSlide <= 1}
              onClick={() => scrollToSlide(Math.max(1, activeSlide - 1))}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Slide trước
            </button>
            <button
              type="button"
              disabled={activeSlide >= SLIDES.length}
              onClick={() => scrollToSlide(Math.min(SLIDES.length, activeSlide + 1))}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <span>Tiếp theo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>

      {lightboxAsset && (
        <div
          onClick={() => setLightboxAsset(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-6 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-6xl w-full bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 cursor-default"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10 text-xs">
              <span className="font-mono font-bold text-ecomiles-lime truncate">{lightboxAsset}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const idx = GALLERY_LIGHTBOX_ASSETS.indexOf(
                      lightboxAsset as (typeof GALLERY_LIGHTBOX_ASSETS)[number]
                    );
                    const nextIdx =
                      (idx - 1 + GALLERY_LIGHTBOX_ASSETS.length) % GALLERY_LIGHTBOX_ASSETS.length;
                    setLightboxAsset(GALLERY_LIGHTBOX_ASSETS[nextIdx]);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer"
                >
                  ‹ Ảnh trước
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const idx = GALLERY_LIGHTBOX_ASSETS.indexOf(
                      lightboxAsset as (typeof GALLERY_LIGHTBOX_ASSETS)[number]
                    );
                    const nextIdx = (idx + 1) % GALLERY_LIGHTBOX_ASSETS.length;
                    setLightboxAsset(GALLERY_LIGHTBOX_ASSETS[nextIdx]);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer"
                >
                  Ảnh tiếp ›
                </button>
                <a
                  href={`/pitch-deck-screenshots/${lightboxAsset}`}
                  download={lightboxAsset}
                  className="px-3 py-1 rounded-lg bg-ecomiles-lime text-slate-950 font-extrabold"
                >
                  Tải PNG
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxAsset(null)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
                >
                  ✕ Đóng
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center max-h-[78vh] overflow-auto">
              <img
                src={`/pitch-deck-screenshots/${lightboxAsset}`}
                alt={lightboxAsset}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
