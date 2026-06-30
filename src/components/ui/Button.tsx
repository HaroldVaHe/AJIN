'use client';

import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ajin-accent disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' && 'bg-ajin-accent text-ajin-primary hover:bg-ajin-accent-dark hover:text-white',
        variant === 'secondary' && 'bg-ajin-primary text-white hover:bg-ajin-primary-light',
        variant === 'outline' && 'border-2 border-ajin-primary text-ajin-primary hover:bg-ajin-primary hover:text-white',
        variant === 'ghost' && 'text-ajin-gray-300 hover:bg-ajin-surface',
        size === 'sm' && 'px-4 py-2 text-sm',
        size === 'md' && 'px-6 py-3 text-sm',
        size === 'lg' && 'px-8 py-4 text-base',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
