import { cn } from '@/lib/utils';
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label htmlFor={id} className="block text-sm font-medium text-ajin-gray-700">
          {label}
        </label>
        <input
          id={id}
          ref={ref}
          className={cn(
            'w-full rounded-xl border border-ajin-gray-200 px-4 py-2.5 text-sm',
            'focus:border-ajin-green focus:ring-2 focus:ring-ajin-green/20 focus:outline-none',
            'placeholder:text-ajin-gray-300',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label htmlFor={id} className="block text-sm font-medium text-ajin-gray-700">
          {label}
        </label>
        <textarea
          id={id}
          ref={ref}
          className={cn(
            'w-full rounded-xl border border-ajin-gray-200 px-4 py-2.5 text-sm min-h-[120px]',
            'focus:border-ajin-green focus:ring-2 focus:ring-ajin-green/20 focus:outline-none',
            'placeholder:text-ajin-gray-300 resize-y',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
}

import { SelectHTMLAttributes } from 'react';

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label htmlFor={id} className="block text-sm font-medium text-ajin-gray-700">
          {label}
        </label>
        <select
          id={id}
          ref={ref}
          className={cn(
            'w-full rounded-xl border border-ajin-gray-200 px-4 py-2.5 text-sm',
            'focus:border-ajin-green focus:ring-2 focus:ring-ajin-green/20 focus:outline-none',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
