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
        Nghiên Cứu &amp; Cung Cấp Kiến Thức
        <br />
        Logistics &amp; Chuỗi Cung Ứng
      </>
    ),
    image: '/team/thuy.jpg',
    imagePosition: 'center 24%',
  },
  {
    name: 'Phạm Quốc Thanh',
    role: (
      <>
        Phụ Trách Công Nghệ
        <br />
        &amp; Kiến Trúc Hệ Thống
      </>
    ),
    image: '/team/thanh.jpg',
    imagePosition: 'center 32%',
  },
  {
    name: 'Nguyễn Ngọc Khánh Phương',
    role: (
      <>
        Nghiên Cứu Thị Trường
        <br />
        &amp; Phát Triển Bền Vững
      </>
    ),
    image: '/team/phuong.jpg',
    imagePosition: 'center 18%',
  },
  {
    name: 'Nguyễn Hồng Phúc',
    role: (
      <>
        Mô Hình Tài Chính
        <br />
        &amp; Kế Hoạch Vốn
      </>
    ),
    image: '/team/phuc.jpg',
    imagePosition: 'center 24%',
  },
  {
    name: 'Lê Thị Hoàng Ngân',
    role: (
      <>
        Nghiên Cứu Thị Trường
        <br />
        &amp; Thương Mại Điện Tử
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
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
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
      className="relative isolate overflow-hidden bg-ecomiles-ink px-4 py-24 text-white sm:px-6 sm:py-32 lg:px-8 scroll-mt-24"
    >
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid items-end gap-10 border-b border-white/10 pb-12 lg:grid-cols-[1.35fr_0.65fr] lg:pb-16">
          <div>
            <h2
              id="team-heading"
              className="max-w-4xl text-balance text-3xl font-extrabold leading-[1.04] tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl"
            >
              Đội Ngũ Sáng Lập Liên Ngành{' '}
              <span className="block pt-2 text-ecomiles-lime">Từ Nghiên Cứu Đến Khởi Nghiệp 2026</span>
            </h2>
          </div>

          <div className="lg:pb-1">
            <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              Dự án hội tụ năng lực chuyên sâu về kinh tế vận tải, công nghệ phần mềm, phát triển bền vững và vận hành
              giao nhận hàng hóa đô thị.
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap justify-center gap-x-6 gap-y-12 sm:gap-x-8 md:gap-y-14 lg:mt-20 lg:gap-x-10">
          {members.map((member, index) => (
            <article
              key={member.name}
              className="gsap-team-card group min-w-0 w-[calc(50%-0.75rem)] max-w-[230px] text-center max-[359px]:w-full sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1.34rem)] lg:w-[calc(33.333%-1.67rem)] lg:max-w-[280px]"
            >
              <div className="relative mx-auto aspect-square w-full max-w-[220px]">
                <div className="relative h-full overflow-hidden rounded-full border border-white/15 bg-[#e8f0e4] shadow-2xl shadow-black/50 transition duration-300 group-hover:-translate-y-1 group-hover:border-ecomiles-lime/60">
                  <img
                    src={member.image}
                    alt={`Chân dung ${member.name}`}
                    width="440"
                    height="440"
                    loading="eager"
                    decoding="async"
                    className="h-full w-full object-cover saturate-[0.85] transition duration-500 group-hover:scale-[1.03] group-hover:saturate-100"
                    style={{ objectPosition: member.imagePosition }}
                  />
                </div>

                <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border border-ecomiles-lime/40 bg-ecomiles-ink font-mono text-xs font-bold text-ecomiles-lime shadow-lg sm:h-9 sm:w-9">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              <div className="mx-auto mt-5 max-w-[260px] space-y-2">
                <h3 className="font-barlow text-lg font-extrabold uppercase leading-tight tracking-[0.025em] text-white sm:text-xl">
                  {member.name}
                </h3>
                <p className="text-xs font-bold leading-5 text-ecomiles-lime sm:text-sm text-balance">
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
