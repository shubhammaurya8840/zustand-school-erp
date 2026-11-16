'use client';

import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  padding = 'md',
  onClick,
  style,
}) => {
  const paddingMap = {
    none: 'p-0',
    sm: 'p-3.5',
    md: 'p-5',
    lg: 'p-6',
    xl: 'p-8',
  };

  return (
    <div
      onClick={onClick}
      style={style}
      className={`glass-card rounded-2xl ${paddingMap[padding]} ${
        hoverEffect ? 'glass-card-hover cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

