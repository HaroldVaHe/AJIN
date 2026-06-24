'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-200 cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ajin-green',
          'disabled:pointer-events-none disabled:opacity-50',
          variant === 'primary' && 'bg-ajin-green text-black hover:bg-ajin-green-dark hover:text-white',
          variant === 'secondary' && 'bg-black text-white hover:bg-ajin-gray-800',
          variant === 'outline' && 'border-2 border-black text-black hover:bg-black hover:text-white',
          variant === 'ghost' && 'text-ajin-gray-800 hover:bg-ajin-gray-50',
          size === 'sm' && 'h-9 px-4 text-sm rounded-lg',
          size === 'md' && 'h-11 px-6 text-base rounded-xl',
          size === 'lg' && 'h-13 px-8 text-lg rounded-xl',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export default Button;
