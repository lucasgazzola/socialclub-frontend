import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils/cn';
import { Button } from './Button';

/** Elementos que pueden recibir foco dentro del modal. */
const FOCUSABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Anchos estándar (DT-20). sm: confirmaciones · md: formularios cortos · lg: formularios · xl: fichas con secciones. */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const ANCHOS: Record<ModalSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

interface ModalProps {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  children?: ReactNode;
  /** Acciones fijas al pie (ver también `ModalActions` para formularios). */
  footer?: ReactNode;
  size?: ModalSize;
  /** Ícono del encabezado (lucide), en el chip de marca. */
  icon?: ReactNode;
  /** Tono del chip del ícono: `danger` para bajas, `success` para reactivaciones. */
  tone?: 'brand' | 'danger' | 'success' | 'warning';
  className?: string;
}

const TONOS: Record<NonNullable<ModalProps['tone']>, string> = {
  brand: 'bg-brand-50 text-brand-600 ring-brand-100',
  danger: 'bg-rose-50 text-rose-600 ring-rose-100',
  success: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  warning: 'bg-amber-50 text-amber-600 ring-amber-100',
};

/**
 * Modal del design system (DT-20: único patrón para altas, ediciones y
 * confirmaciones). Anatomía estándar: encabezado (ícono opcional + título +
 * descripción + cerrar), cuerpo con scroll y pie de acciones alineadas a la
 * derecha. En pantallas chicas se muestra como hoja inferior a todo el ancho.
 *
 * Además de mostrar el contenido en un portal sobre el resto de la pantalla,
 * se encarga de lo que hace que un modal sea navegable con teclado:
 * cierra con Escape, mantiene el foco adentro mientras está abierto, lo
 * devuelve al elemento que lo abrió al cerrarse y bloquea el scroll del fondo.
 */
export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = 'lg',
  icon,
  tone = 'brand',
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const contenidoRef = useRef<HTMLDivElement | null>(null);
  const tituloId = useId();
  const descripcionId = useId();

  // Guardamos quién tenía el foco para devolvérselo al cerrar: si no, el foco
  // vuelve al <body> y quien navega con teclado pierde el lugar en la página.
  const elementoPrevioRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const manejarTab = useCallback((evento: KeyboardEvent) => {
    const dialogo = dialogRef.current;
    if (!dialogo) {
      return;
    }

    const focusables = Array.from(dialogo.querySelectorAll<HTMLElement>(FOCUSABLES));
    if (focusables.length === 0) {
      evento.preventDefault();
      return;
    }

    const primero = focusables[0];
    const ultimo = focusables[focusables.length - 1];
    const activo = document.activeElement;

    // Ciclamos el foco en los extremos para que no se escape al fondo.
    if (evento.shiftKey && (activo === primero || !dialogo.contains(activo))) {
      evento.preventDefault();
      ultimo.focus();
      return;
    }

    if (!evento.shiftKey && activo === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    elementoPrevioRef.current = document.activeElement as HTMLElement | null;

    function manejarTeclado(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        evento.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (evento.key === 'Tab') {
        manejarTab(evento);
      }
    }

    document.addEventListener('keydown', manejarTeclado);

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // El foco arranca en el primer control del CONTENIDO —el primer campo del
    // formulario—, no en el primer enfocable del diálogo, que en orden DOM es
    // el botón de cerrar del encabezado. Si no hay contenido enfocable (p. ej.
    // una confirmación), se enfoca el contenedor para que los lectores de
    // pantalla anuncien el diálogo y el Tab siga hacia los botones.
    const dialogo = dialogRef.current;
    const primerFocusable = contenidoRef.current?.querySelector<HTMLElement>(FOCUSABLES);
    (primerFocusable ?? dialogo)?.focus();

    return () => {
      document.removeEventListener('keydown', manejarTeclado);
      document.body.style.overflow = overflowPrevio;
      elementoPrevioRef.current?.focus();
    };
  }, [open, manejarTab]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:px-4 sm:py-6">
      <button
        type="button"
        aria-label="Cerrar modal"
        tabIndex={-1}
        className="modal-fondo absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={description ? descripcionId : undefined}
        tabIndex={-1}
        className={cn(
          'modal-panel relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200/80 bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)] focus:outline-none sm:max-h-[88vh] sm:rounded-2xl',
          ANCHOS[size],
          className,
        )}
      >
        <header className="flex shrink-0 items-start gap-3 border-b border-slate-200/80 px-5 py-4 sm:px-6">
          {icon ? (
            <span
              aria-hidden="true"
              className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 [&_svg]:size-[18px]', TONOS[tone])}
            >
              {icon}
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <h2 id={tituloId} className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
              {title}
            </h2>
            {description ? (
              <p id={descripcionId} className="mt-0.5 text-sm text-slate-500">
                {description}
              </p>
            ) : null}
          </div>

          <Button type="button" variant="ghost" size="icon" aria-label="Cerrar" onClick={onClose} className="-mr-2 -mt-1 shrink-0">
            <X size={18} />
          </Button>
        </header>

        {children ? (
          <div ref={contenidoRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {children}
          </div>
        ) : null}

        {footer ? (
          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200/80 bg-slate-50/70 px-5 py-3.5 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </footer>
        ) : null}
      </section>
    </div>,
    document.body,
  );
}

interface ModalActionsProps {
  children: ReactNode;
  className?: string;
}

/**
 * Pie de acciones para formularios que viven dentro del cuerpo del modal
 * (DT-20): queda fijo abajo mientras se hace scroll y se ve igual que el
 * `footer` del modal. Orden estándar: Cancelar (secundario) y después la
 * acción principal, alineadas a la derecha; en móvil, apiladas.
 */
export function ModalActions({ children, className }: ModalActionsProps) {
  return (
    <div
      className={cn(
        'sticky -bottom-5 z-10 -mx-5 -mb-5 mt-6 flex flex-col-reverse gap-2 border-t border-slate-200/80 bg-slate-50/95 px-5 py-3.5 backdrop-blur sm:-mx-6 sm:flex-row sm:justify-end sm:px-6',
        className,
      )}
    >
      {children}
    </div>
  );
}
