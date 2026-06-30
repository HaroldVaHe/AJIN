import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  dark?: boolean;
}

export default function Logo({ className, dark }: LogoProps) {
  return (
    <Image
      src="/images/LogoAJINwithoutBG.png"
      alt="AJIN"
      width={1024}
      height={1024}
      className={cn('object-contain', className)}
      priority
    />
  );
}
