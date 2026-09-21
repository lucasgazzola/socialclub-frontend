import escudoSvg from '@/assets/escudo-definitivo.svg';
import { cn } from '@/lib/utils/cn';

interface ClubLogoProps {
  className?: string;
  size?: number | string;
}

/**
 * Escudo definitivo oficial de C.A. y B.S. Unión en formato SVG
 */
export function ClubLogo({ className, size = 36 }: ClubLogoProps) {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn('relative shrink-0 select-none overflow-hidden flex items-center justify-center', className)}
    >
      <img
        src={escudoSvg}
        alt="Escudo C.A. y B.S. Unión"
        className="h-full w-full object-contain drop-shadow-sm"
        loading="eager"
      />
    </div>
  );
}
