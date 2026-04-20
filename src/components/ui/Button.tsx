import React from 'react';
import { cn } from '../../utils/helpers';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  ...props 
}: any) => {
  const variants = {
    primary: "bg-[#FF4208] text-white hover:bg-[#D93807] shadow-sm",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    outline: "border border-slate-200 bg-transparent hover:bg-slate-50 text-slate-700",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs font-medium",
    md: "px-4 py-2 text-sm font-medium",
    lg: "px-6 py-3 text-base font-semibold",
  };

  return (
    <button 
      className={cn(
        "inline-flex items-center justify-center rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )} 
      {...props}
    >
      {children}
    </button>
  );
};
