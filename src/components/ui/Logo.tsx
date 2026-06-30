import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  dark?: boolean;
}

export default function Logo({ className, iconOnly, dark }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <rect width="36" height="36" rx="8" fill={dark ? '#C9A84C' : '#1B2A4A'} />
        <text
          x="18"
          y="24"
          textAnchor="middle"
          fill={dark ? '#1B2A4A' : '#C9A84C'}
          fontFamily="Georgia, serif"
          fontSize="18"
          fontWeight="bold"
        >
          AJ
        </text>
      </svg>
      {!iconOnly && (
        <div>
          <span
            className={cn(
              'text-xl font-bold tracking-tight',
              dark ? 'text-white' : 'text-ajin-primary'
            )}
            style={{ fontFamily: 'Georgia, serif' }}
          >
            AJ
            <span className={dark ? 'text-ajin-accent' : 'text-ajin-accent'}>IN</span>
          </span>
        </div>
      )}
    </div>
  );
}
