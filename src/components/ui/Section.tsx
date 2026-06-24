import { cn } from '@/lib/utils';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
  id?: string;
}

export function Section({ children, className, dark, id }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'section-padding',
        dark && 'bg-ajin-black text-white',
        className
      )}
    >
      <div className="container-ajin">{children}</div>
    </section>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeader({ title, subtitle, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-12 text-center', className)}>
      <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl">{title}</h2>
      {subtitle && (
        <p className="mt-4 text-lg text-ajin-gray-400 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
