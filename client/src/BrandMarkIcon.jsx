import React from 'react';

export default function BrandMarkIcon({ size = 22, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ResumeMatch Brand Icon"
    >
      <defs>
        <linearGradient id="brandSparkleGrad" x1="16" y1="14" x2="29" y2="27" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E292A6" />
          <stop offset="100%" stopColor="#B87587" />
        </linearGradient>
      </defs>
      {/* Document Sheet */}
      <rect x="4.5" y="2.5" width="18" height="26" rx="3.5" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="0.5" />
      <rect x="4.5" y="2.5" width="18" height="26" rx="3.5" fill="none" stroke="#405F75" strokeWidth="1.8" />

      {/* Header bar */}
      <rect x="8" y="7" width="8" height="2.2" rx="1.1" fill="#405F75" />
      {/* Content lines */}
      <rect x="8" y="11.5" width="11" height="1.6" rx="0.8" fill="#8FA4B5" />
      <rect x="8" y="15" width="9.5" height="1.6" rx="0.8" fill="#8FA4B5" />
      <rect x="8.5" y="18.5" width="7" height="1.6" rx="0.8" fill="#8FA4B5" />
      <rect x="8.5" y="22" width="10" height="1.6" rx="0.8" fill="#BDCFDB" />

      {/* Matching Sparkle Badge */}
      <circle cx="23" cy="21" r="7" fill="url(#brandSparkleGrad)" stroke="#FFFFFF" strokeWidth="1.5" />
      <path
        d="M23 16.5 C23 19 23 19 25.5 21 C23 21 23 21 23 25.5 C23 21 23 21 20.5 21 C23 19 23 19 23 16.5 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

