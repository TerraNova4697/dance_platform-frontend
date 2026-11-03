import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textClassName?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 28,
  showText = false,
  textClassName = '',
}) => {
  const logoHeight = size <= 30 ? 38 : 44;
  const logoWidth = Math.round((logoHeight * 1218) / 428);
  const rawBase = import.meta.env.BASE_URL || '/frontend/';
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  const logoSrc = `${base}logo.svg`;

  return (
    <div
      className={`brand-logo-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '14px',
      }}
    >
      <img
        src={logoSrc}
        width={logoWidth}
        height={logoHeight}
        alt="ON — The World of Dancesport"
        style={{
          height: `${logoHeight}px`,
          width: 'auto',
          flexShrink: 0,
          display: 'block',
          filter: 'drop-shadow(0 2px 10px rgba(212, 175, 140, 0.18))',
        }}
      />
      {showText && (
        <>
          <span
            aria-hidden="true"
            className="brand-logo-divider"
            style={{
              width: '1px',
              height: `${Math.round(logoHeight * 0.72)}px`,
              background: 'linear-gradient(180deg, rgba(212, 175, 140, 0.1) 0%, rgba(212, 175, 140, 0.48) 50%, rgba(212, 175, 140, 0.1) 100%)',
              flexShrink: 0,
            }}
          />
          <span
            className={`brand-logo-text ${textClassName}`}
            style={{
              fontFamily: 'var(--font-sans, "Inter", sans-serif)',
              fontSize: '9.5px',
              fontWeight: 500,
              color: 'var(--text-secondary, #C4B9AC)',
              letterSpacing: '0.22em',
              lineHeight: 1.45,
              textTransform: 'uppercase',
              display: 'inline-flex',
              flexDirection: 'column',
              textAlign: 'left',
              whiteSpace: 'nowrap',
            }}
          >
            <span>THE WORLD OF</span>
            <span style={{ color: 'var(--text-primary, #F7F3EE)', fontWeight: 600 }}>DANCESPORT</span>
          </span>
        </>
      )}
    </div>
  );
};
