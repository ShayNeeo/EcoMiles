import React from 'react';

interface IconProps {
  className?: string;
}

export const ReturnMMark: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 54 V14 L32 38 L52 14 V54 H12"
      stroke="currentColor"
      strokeWidth="7.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
  </svg>
);

export const EcoMilesWordmark: React.FC<{ dark?: boolean; showTagline?: boolean }> = ({
  dark = false,
  showTagline = false,
}) => (
  <span className="inline-flex items-center gap-2.5">
    <span
      className={`flex h-8 w-8 items-center justify-center border ${
        dark
          ? 'bg-[#F6F1E7] text-[#101418] border-[#F6F1E7]'
          : 'bg-[#101418] text-[#F6F1E7] border-[#101418]'
      }`}
    >
      <ReturnMMark className="w-5 h-5" />
    </span>
    <span className="flex flex-col leading-none">
      <span
        className={`font-extrabold text-base sm:text-lg tracking-[-0.04em] ${
          dark ? 'text-[#F6F1E7]' : 'text-[#101418]'
        }`}
        style={{ fontFamily: "'Archivo', 'IBM Plex Sans', sans-serif" }}
      >
        ECOMILES
        <span
          className={`inline-block w-[6px] h-[6px] ml-1 align-baseline ${
            dark ? 'bg-[#0B7A3B]' : 'bg-[#1B45D7]'
          }`}
          aria-hidden="true"
        />
      </span>
      {showTagline && (
        <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#5B5F66] mt-1">
          Đường về không trống.
        </span>
      )}
    </span>
  </span>
);

export const BackhaulMatchIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M3 7H17.5L14 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
    <path d="M21 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeDasharray="2.5 2.5" />
    <path d="M12 17H6.5L10 20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
    <circle cx="12" cy="17" r="2.2" fill="currentColor" />
    <rect x="19" y="5.5" width="3" height="3" fill="currentColor" />
  </svg>
);

export const Qd23WindowIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="2.5" y="4" width="19" height="16" stroke="currentColor" strokeWidth="1.8" />
    <rect x="5" y="7" width="4" height="10" fill="currentColor" />
    <rect x="15" y="7" width="4" height="10" fill="currentColor" />
    <path d="M12 7.5V16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
  </svg>
);

export const IsoLedgerIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M4 3H15.5L20 7.5V21H4V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter" />
    <path d="M15 3V8H20" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="miter" />
    <path d="M7.5 10.5H16.5M7.5 14H13M7.5 17.5H11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
    <rect x="13.5" y="15" width="4" height="4" fill="currentColor" />
  </svg>
);

export const Co2AuditIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="4" y="4" width="5" height="13" stroke="currentColor" strokeWidth="1.8" />
    <rect x="15" y="9" width="5" height="8" fill="currentColor" />
    <path d="M2.5 20H21.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
  </svg>
);

export const RouteLoopDivider: React.FC<{ className?: string }> = ({ className = 'w-full h-5' }) => (
  <svg viewBox="0 0 960 20" fill="none" className={className} aria-hidden="true">
    <path d="M0 10 H420" stroke="#BDB5A3" strokeWidth="2" strokeDasharray="8 8" />
    <path d="M420 10 H948" stroke="#101418" strokeWidth="2" />
    <circle cx="420" cy="10" r="4" fill="#1B45D7" />
    <rect x="948" y="5" width="10" height="10" fill="#0B7A3B" />
  </svg>
);
