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
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ajin-green disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' && 'bg-ajin-green text-black hover:bg-ajin-green-dark hover:text-white',
        variant === 'secondary' && 'bg-ajin-gray-100 text-ajin-bg hover:bg-ajin-text hover:text-ajin-bg',
        variant === 'outline' && 'border-2 border-ajin-text text-ajin-text hover:bg-ajin-text hover:text-ajin-bg',
        variant === 'ghost' && 'text-ajin-gray-200 hover:bg-ajin-surface',
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
