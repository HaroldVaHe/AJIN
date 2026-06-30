import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className, ...props }: InputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ajin-gray-200 mb-1.5">
        {label}
      </label>
      <input
        id={id}
        className={cn(
          'w-full rounded-xl border border-ajin-gray-700 bg-white px-4 py-2.5 text-sm text-ajin-gray-100 placeholder:text-ajin-gray-500 focus:border-ajin-accent focus:ring-2 focus:ring-ajin-accent/20 focus:outline-none',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function Textarea({ label, error, id, className, ...props }: TextareaProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ajin-gray-200 mb-1.5">
        {label}
      </label>
      <textarea
        id={id}
        className={cn(
          'w-full rounded-xl border border-ajin-gray-700 bg-white px-4 py-2.5 text-sm text-ajin-gray-100 placeholder:text-ajin-gray-500 focus:border-ajin-accent focus:ring-2 focus:ring-ajin-accent/20 focus:outline-none min-h-[120px]',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  children?: React.ReactNode;
  options?: { value: string; label: string }[];
}

export function Select({ label, error, id, children, options, className, ...props }: SelectProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ajin-gray-200 mb-1.5">
        {label}
      </label>
      <select
        id={id}
        className={cn(
          'w-full rounded-xl border border-ajin-gray-700 bg-white px-4 py-2.5 text-sm text-ajin-gray-100 focus:border-ajin-accent focus:ring-2 focus:ring-ajin-accent/20 focus:outline-none',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          className
        )}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
