import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface TeamMember {
  name: string;
  tag: string;
  image: string;
  imagePosition: string;
}

const members: TeamMember[] = [
  {
    name: 'Nguyễn Thu Thuỷ',
    tag: 'Logistics & Chuỗi cung ứng',
    image: '/team/thuy.jpg',
    imagePosition: 'center 24%',
  },
  {
    name: 'Phạm Quốc Thanh',
    tag: 'Công nghệ & Kiến trúc hệ thống',
    image: '/team/thanh.jpg',
    imagePosition: 'center 32%',
  },
  {
    name: 'Nguyễn Ngọc Khánh Phương',
    tag: 'Thị trường & Phát triển bền vững',
    image: '/team/phuong.jpg',
    imagePosition: 'center 18%',
  },
  {
    name: 'Nguyễn Hồng Phúc',
    tag: 'Tài chính & Kế hoạch vốn',
    image: '/team/phuc.jpg',
    imagePosition: 'center 24%',
  },
  {
    name: 'Lê Thị Hoàng Ngân',
    tag: 'Thị trường & TMĐT',
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
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.45,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
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
      className="relative isolate overflow-hidden em-grid-varden text-[#003049] px-4 py-20 sm:px-6 sm:py-24 lg:px-8 scroll-mt-20 border-b-4 border-[#003049]"
    >
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#003049] pb-6">
          <h2
            id="team-heading"
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#003049] tracking-tight leading-tight"
          >
            Đội ngũ liên ngành EcoMiles
          </h2>
          <span className="inline-flex items-center px-3 py-1.5 rounded-md bg-[#003049] text-[#FDF0D5] font-mono text-xs font-bold uppercase shrink-0">
            5 THÀNH VIÊN · ĐẠI SỨ GEN G 2026
          </span>
        </div>

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {members.map((member, index) => (
            <article key={member.name} className="gsap-team-card group text-center">
              <div className="relative mx-auto aspect-square w-full max-w-[180px]">
                <div className="relative h-full overflow-hidden rounded-2xl border-2 border-[#003049] bg-[#003049] shadow-md transition duration-300 group-hover:-translate-y-1 group-hover:border-[#C1121F]">
                  <img
                    src={member.image}
                    alt={`Chân dung ${member.name}`}
                    width="400"
                    height="400"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover saturate-[0.95] transition duration-300 group-hover:scale-[1.03] group-hover:saturate-100"
                    style={{ objectPosition: member.imagePosition }}
                  />
                </div>

                <span className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#FDF0D5] bg-[#C1121F] font-mono text-xs font-black text-[#FDF0D5] shadow">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              <div className="mx-auto mt-4 space-y-1.5">
                <h3 className="font-display text-base font-extrabold text-[#003049] leading-snug">
                  {member.name}
                </h3>
                <span className="inline-block rounded bg-[#003049] px-2.5 py-1 text-[11px] font-bold text-[#FDF0D5]">
                  {member.tag}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
