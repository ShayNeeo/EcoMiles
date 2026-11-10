import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface TeamMember {
  name: string;
  role: React.ReactNode;
  image: string;
  imagePosition: string;
}

const members: TeamMember[] = [
  {
    name: 'Nguyễn Thu Thuỷ',
    role: (
      <>
        Nghiên cứu &amp; Cung cấp kiến thức
        <br />
        Logistics &amp; Chuỗi cung ứng
      </>
    ),
    image: '/team/thuy.jpg',
    imagePosition: 'center 24%',
  },
  {
    name: 'Phạm Quốc Thanh',
    role: (
      <>
        Phụ trách công nghệ
        <br />
        &amp; Kiến trúc hệ thống
      </>
    ),
    image: '/team/thanh.jpg',
    imagePosition: 'center 32%',
  },
  {
    name: 'Nguyễn Ngọc Khánh Phương',
    role: (
      <>
        Nghiên cứu thị trường
        <br />
        &amp; Phát triển bền vững
      </>
    ),
    image: '/team/phuong.jpg',
    imagePosition: 'center 18%',
  },
  {
    name: 'Nguyễn Hồng Phúc',
    role: (
      <>
        Mô hình tài chính
        <br />
        &amp; Kế hoạch vốn
      </>
    ),
    image: '/team/phuc.jpg',
    imagePosition: 'center 24%',
  },
  {
    name: 'Lê Thị Hoàng Ngân',
    role: (
      <>
        Nghiên cứu thị trường
        <br />
        &amp; Thương mại điện tử
      </>
    ),
    image: '/team/ngan.jpg',
    imagePosition: 'center 25%',
  },
];

export const Team: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion || !sectionRef.current) return;

      gsap.fromTo(
        '.gsap-team-card',
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 78%',
            toggleActions: 'play none none none',
          },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="team"
      aria-labelledby="team-heading"
      className="relative isolate overflow-hidden bg-[#F8FAFC] px-4 py-20 sm:px-6 sm:py-28 lg:px-8 scroll-mt-24 border-t border-slate-200/80"
    >
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid items-end gap-8 border-b border-slate-200 pb-10 lg:grid-cols-[1.35fr_0.65fr] lg:pb-12">
          <div>
            <h2
              id="team-heading"
              className="max-w-4xl text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-tight"
            >
              Đội ngũ sáng lập liên ngành{' '}
              <span className="text-[#14532D]">từ nghiên cứu đến khởi nghiệp 2026</span>
            </h2>
          </div>

          <div>
            <p className="max-w-xl text-base text-[#475569] leading-relaxed">
              Dự án hội tụ năng lực chuyên sâu về kinh tế vận tải, công nghệ phần mềm, phát triển bền vững và vận hành giao nhận hàng hóa đô thị.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-10 sm:gap-x-8 md:gap-y-12 lg:gap-x-10">
          {members.map((member, index) => (
            <article
              key={member.name}
              className="gsap-team-card group min-w-0 w-[calc(50%-0.75rem)] max-w-[220px] text-center max-[359px]:w-full sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1.34rem)] lg:w-[calc(20%-1.6rem)]"
            >
              <div className="relative mx-auto aspect-square w-full max-w-[190px]">
                <div className="relative h-full overflow-hidden rounded-full border-2 border-slate-200 bg-[#e8f0e4] shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:border-[#14532D]">
                  <img
                    src={member.image}
                    alt={`Chân dung ${member.name}`}
                    width="400"
                    height="400"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover saturate-[0.9] transition duration-300 group-hover:scale-[1.03] group-hover:saturate-100"
                    style={{ objectPosition: member.imagePosition }}
                  />
                </div>

                <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border border-white bg-[#14532D] font-mono text-xs font-bold text-white shadow-sm sm:h-8 sm:w-8">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              <div className="mx-auto mt-4 space-y-1">
                <h3 className="text-base font-bold text-[#0F172A] leading-snug">
                  {member.name}
                </h3>
                <p className="text-xs font-semibold leading-5 text-[#14532D]">
                  {member.role}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
