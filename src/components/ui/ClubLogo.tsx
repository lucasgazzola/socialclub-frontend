import logoPng from '@/assets/Logo SocialClub 2.png';
import { cn } from '@/lib/utils/cn';

interface ClubLogoProps {
  className?: string;
  size?: number | string;
}

/**
 * Escudo oficial SocialClub
 */
export function ClubLogo({ className, size = 36 }: ClubLogoProps) {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn('relative shrink-0 select-none overflow-hidden flex items-center justify-center', className)}
    >
      <img
        src={logoPng}
        alt="Logo SocialClub"
        className="h-full w-full object-contain drop-shadow-sm"
        loading="eager"
      />
    </div>
  );
}
