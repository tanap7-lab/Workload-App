import React from 'react';
import { cn } from '../../utils/helpers';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const Card = ({ children, className, ...props }: any) => {
  return (
    <div 
      className={cn(
        "bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
};
