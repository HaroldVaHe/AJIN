import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  dark?: boolean;
}

export default function Logo({ className, dark }: LogoProps) {
  return (
    <div className={cn('flex items-center', className)}>
      <Image
        src="/images/LogoAJINwithoutBG.png"
        alt="AJIN"
        width={140}
        height={40}
        className="h-10 w-auto object-contain"
        priority
      />
    </div>
  );
}
