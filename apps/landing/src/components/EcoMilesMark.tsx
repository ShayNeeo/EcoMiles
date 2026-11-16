import React from 'react';

interface IconProps {
  className?: string;
}

export const ReturnMMark: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
    <path
      d="M11 50 V14 L32 37 L53 14 V50"
      stroke="currentColor"
      strokeWidth="7.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
    <path d="M53 50 H11" stroke="#669BBC" strokeWidth="6.5" strokeLinecap="square" />
    <rect x="47" y="44" width="9" height="9" fill="#C1121F" />
  </svg>
);

export const EcoMilesWordmark: React.FC<{
  dark?: boolean;
  showTagline?: boolean;
  className?: string;
}> = ({ dark = false, showTagline = false, className = 'h-6 sm:h-7 w-auto' }) => {
  const strokeMain = dark ? '#FDF0D5' : '#003049';
  const returnBridge = '#669BBC';
  const stopSquare = dark ? '#C1121F' : '#AE1F23';
  return (
    <span className="inline-flex flex-col leading-none">
      <svg
        viewBox="0 0 236 42"
        fill="none"
        className={className}
        role="img"
        aria-label="EcoMiles"
      >
        <g stroke={strokeMain} strokeWidth="4.2" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M21 9.5H6V30.5H21M6 20H18" />
          <path d="M47 9.5H31V30.5H47" />
          <path d="M58 9.5H75V30.5H58Z" />
          <path d="M88 30.5V12.6L103 26.2L118 12.6V30.5" />
          <path d="M132 9.5V30.5" />
          <path d="M145 9.5V30.5H160" />
          <path d="M186 9.5H171V30.5H186M171 20H183" />
          <path d="M213 9.5H197V20H213V30.5H197" />
        </g>
        <path d="M118 30.5H88" stroke={returnBridge} strokeWidth="4.2" strokeLinecap="square" />
        <rect x="85.8" y="28.3" width="4.4" height="4.4" fill="#FDF0D5" />
        <rect x="222" y="24.5" width="8" height="8" fill={stopSquare} />
      </svg>
      {showTagline && (
        <span
          className={`font-mono text-[10px] tracking-[0.14em] uppercase mt-1.5 ${
            dark ? 'text-[#669BBC]' : 'text-[#AE1F23]'
          }`}
        >
          Đường về không trống
        </span>
      )}
    </span>
  );
};

/* 1. Inbound + Outbound Backhaul Loop */
export const BackhaulMatchIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M3 7H17.5L14 3.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="square" strokeLinejoin="miter" />
    <path d="M21 17H13" stroke="#669BBC" strokeWidth="2.1" strokeLinecap="square" strokeDasharray="2.5 2.5" />
    <path d="M12 17H6.5L10 20.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="square" strokeLinejoin="miter" />
    <circle cx="12" cy="17" r="2.4" fill="#669BBC" />
    <rect x="19" y="5.5" width="3" height="3" fill="#C1121F" />
  </svg>
);

/* 2. HCMC QD 23/2018 Ban Gate Strip */
export const Qd23WindowIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="2.5" y="4.5" width="19" height="15" stroke="currentColor" strokeWidth="2" />
    <rect x="4.5" y="7" width="4.5" height="10" fill="#C1121F" />
    <rect x="10.2" y="7" width="3.6" height="10" fill="#669BBC" />
    <rect x="15" y="7" width="4.5" height="10" fill="#C1121F" />
  </svg>
);

/* 3. Van < 950kg HCMC 24/24 Clearance */
export const VanExemptIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M3 8.5H15L19.5 12V16.5H3V8.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter" />
    <circle cx="7" cy="17.5" r="2.2" fill="#669BBC" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="16.5" cy="17.5" r="2.2" fill="#669BBC" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6 12H11" stroke="#669BBC" strokeWidth="2" strokeLinecap="square" />
    <rect x="19.5" y="4.5" width="3" height="3" fill="#C1121F" />
  </svg>
);

/* 4. 2.5T Truck Axle & Bridge Guard */
export const TruckWeightIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="2.5" y="6" width="12.5" height="9" stroke="currentColor" strokeWidth="2" />
    <path d="M15 9H19.2L21.5 12V15H15V9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter" />
    <circle cx="6.5" cy="17" r="2" fill="currentColor" />
    <circle cx="17.5" cy="17" r="2" fill="currentColor" />
    <path d="M2.5 21H21.5" stroke="#C1121F" strokeWidth="2.2" strokeLinecap="square" />
  </svg>
);

/* 5. Hanoi Ring 3 & Dual-City Geofence */
export const HanoiRingIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <polygon points="12,2.5 21,7.5 21,16.5 12,21.5 3,16.5 3,7.5" stroke="currentColor" strokeWidth="1.9" />
    <polygon points="12,6.5 17,9.5 17,14.5 12,17.5 7,14.5 7,9.5" fill="#C1121F" fillOpacity="0.88" stroke="#FDF0D5" strokeWidth="1.2" />
    <circle cx="12" cy="12" r="2" fill="#FDF0D5" />
  </svg>
);

/* 6. ISO 14083 / GLEC 3-Sheet Ledger */
export const IsoLedgerIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M4 3H15.5L20 7.5V21H4V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter" />
    <path d="M15 3V8H20" stroke="#669BBC" strokeWidth="1.8" strokeLinejoin="miter" />
    <path d="M7.5 11H16.5M7.5 14.5H12.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="square" />
    <rect x="13.5" y="14.5" width="4" height="4" fill="#C1121F" />
  </svg>
);

/* 7. CO2 Reduction Delta Bars */
export const Co2AuditIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="4" y="4" width="5" height="14" stroke="#C1121F" strokeWidth="2" />
    <rect x="14.5" y="10" width="5.5" height="8" fill="#669BBC" />
    <path d="M10.5 6L15 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
    <path d="M2.5 20.5H21.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
  </svg>
);

/* 8. Dynamic Payload Fuel Physics Gauge */
export const FuelPhysicsIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M4 18L9.5 12L14 14.5L20 7" stroke="#669BBC" strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter" />
    <circle cx="20" cy="7" r="2.2" fill="#C1121F" />
    <path d="M3 20.5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
  </svg>
);

/* 9. Zero-Knowledge Tenant Shield */
export const ZeroKnowledgeIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M12 3L19.5 6.2V12.4C19.5 16.8 16.2 20 12 21.5C7.8 20 4.5 16.8 4.5 12.4V6.2L12 3Z" stroke="currentColor" strokeWidth="2" />
    <rect x="9.5" y="10.5" width="5" height="4.5" fill="#C1121F" />
    <path d="M10.5 10.5V8.8C10.5 7.9 11.2 7.2 12 7.2C12.8 7.2 13.5 7.9 13.5 8.8V10.5" stroke="#669BBC" strokeWidth="1.8" />
  </svg>
);

export const RouteLoopDivider: React.FC<{ className?: string }> = ({ className = 'w-full h-5' }) => (
  <svg viewBox="0 0 960 20" fill="none" className={className} aria-hidden="true">
    <path d="M0 10 H400" stroke="#780000" strokeWidth="2.5" strokeDasharray="8 8" />
    <path d="M400 10 H948" stroke="#669BBC" strokeWidth="3" />
    <circle cx="400" cy="10" r="5" fill="#C1121F" />
    <rect x="946" y="4" width="12" height="12" fill="#FDF0D5" />
  </svg>
);
