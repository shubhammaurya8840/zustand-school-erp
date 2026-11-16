'use client';

import React from 'react';
import Link from 'next/link';

interface SchoolLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  showText?: boolean;
  href?: string;
  className?: string;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  size = 'md',
  showTagline = true,
  showText = true,
  href = '/',
  className = '',
}) => {
  const sizeMap = {
    sm: { img: 36, title: 'text-sm', tag: 'text-[9px]' },
    md: { img: 44, title: 'text-base font-bold', tag: 'text-[10px]' },
    lg: { img: 56, title: 'text-xl font-extrabold', tag: 'text-xs' },
    xl: { img: 72, title: 'text-2xl font-black', tag: 'text-xs tracking-wider' },
  };

  const currentSize = sizeMap[size];

  const content = (
    <div className={`flex items-center gap-3 select-none group ${className}`}>
      <div className="relative flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
        {/* Soft Golden Ambient Glow */}
        <div className="absolute inset-0 bg-amber-400/25 blur-md rounded-full -z-10" />
        <img
          src="/school-logo.svg"
          alt="Zustand Public School Crest"
          width={currentSize.img}
          height={currentSize.img}
          className="drop-shadow-sm object-contain"
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`${currentSize.title} tracking-tight text-slate-800 leading-tight group-hover:text-slate-900 transition-colors`}
            >
              Zustand Public School
            </span>
          </div>
          {showTagline && (
            <span
              className={`${currentSize.tag} uppercase font-semibold text-amber-700/80 tracking-widest mt-0.5 leading-none`}
            >
              Knowledge • Character • Bright Future
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
};

