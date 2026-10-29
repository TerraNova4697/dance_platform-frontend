import React, { useId } from 'react';

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
  const id = useId().replace(/:/g, '');
  const height = Math.round((size * 21) / 31);

  return (
    <div className={`brand-logo-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <svg
        width={size}
        height={height}
        viewBox="0 0 31 21"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
        aria-label="on dance space logo"
      >
        <path
          fill={`url(#linear-left-${id})`}
          d="M15.5 19.6c-1.516.892-3.29 1.4-5.167 1.4C4.633 21 0 16.293 0 10.5S4.633 0 10.333 0c1.878 0 3.651.507 5.167 1.4a10.56 10.56 0 0 0-5.167 9.1c0 3.902 2.084 7.28 5.167 9.1"
        />
        <path
          fill={`url(#radial-left-${id})`}
          fillOpacity=".2"
          d="M15.5 19.6c-1.516.892-3.29 1.4-5.167 1.4C4.633 21 0 16.293 0 10.5S4.633 0 10.333 0c1.878 0 3.651.507 5.167 1.4a10.56 10.56 0 0 0-5.167 9.1c0 3.902 2.084 7.28 5.167 9.1"
        />
        <path
          fill={`url(#linear-right-${id})`}
          d="M15.5 19.6c1.516.892 3.29 1.4 5.167 1.4C26.367 21 31 16.293 31 10.5S26.367 0 20.667 0c-1.878 0-3.651.507-5.167 1.4a10.56 10.56 0 0 1 5.167 9.1c0 3.902-2.084 7.28-5.167 9.1"
        />
        <path
          fill={`url(#radial-right-${id})`}
          fillOpacity=".2"
          d="M15.5 19.6c1.516.892 3.29 1.4 5.167 1.4C26.367 21 31 16.293 31 10.5S26.367 0 20.667 0c-1.878 0-3.651.507-5.167 1.4a10.56 10.56 0 0 1 5.167 9.1c0 3.902-2.084 7.28-5.167 9.1"
        />
        <defs>
          <radialGradient
            id={`radial-left-${id}`}
            cx="0"
            cy="0"
            r="1"
            gradientTransform="matrix(19.3945 11.375 -.97694 13.1382 8.724 -2.188)"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <radialGradient
            id={`radial-right-${id}`}
            cx="0"
            cy="0"
            r="1"
            gradientTransform="matrix(19.3945 11.375 -.97694 13.1382 8.724 -2.188)"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <linearGradient
            id={`linear-left-${id}`}
            x1="15.959"
            x2="26.615"
            y1="-1.37"
            y2="15.895"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#555D64" />
            <stop offset="1" stopColor="#292C2E" />
          </linearGradient>
          <linearGradient
            id={`linear-right-${id}`}
            x1="15.959"
            x2="26.615"
            y1="-1.37"
            y2="15.895"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#555D64" />
            <stop offset="1" stopColor="#292C2E" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <span
          className={`brand-logo-text ${textClassName}`}
          style={{
            fontFamily: "'Urbanist', sans-serif",
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--brand-charcoal)',
            letterSpacing: '-0.02em',
          }}
        >
          on dance space
        </span>
      )}
    </div>
  );
};

