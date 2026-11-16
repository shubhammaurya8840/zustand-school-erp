'use client';

import React from 'react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  className = '',
  variant = 'secondary',
  disabled,
  type = 'button',
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
    secondary: 'bg-white/80 text-slate-800 hover:bg-white border border-slate-200/80 shadow-2xs',
    ghost: 'bg-transparent text-slate-800 hover:bg-white/50',
    danger: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

