import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

/** Elementos que pueden recibir foco dentro del modal. */
const FOCUSABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  open: boolean;
  title: ReactNode;
  description?: string;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Modal del design system.
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
  className = '',
}: ModalProps) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const contenidoRef = useRef<HTMLDivElement | null>(null);
  const tituloId = useId();
  const descripcionId = useId();

  // Guardamos quién tenía el foco para devolvérselo al cerrar: si no, el foco
  // vuelve al <body> y quien navega con teclado pierde el lugar en la página.
  const elementoPrevioRef = useRef<HTMLElement | null>(null);

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
        onClose();
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
  }, [open, onClose, manejarTab]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Cerrar modal"
        tabIndex={-1}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={description ? descripcionId : undefined}
        tabIndex={-1}
        className={`relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl focus:outline-none ${className}`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 id={tituloId} className="text-xl font-semibold text-slate-900">
              {title}
            </h2>
            {description ? (
              <p id={descripcionId} className="mt-1 text-sm text-slate-500">
                {description}
              </p>
            ) : null}
          </div>

          <Button type="button" variant="ghost" size="sm" aria-label="Cerrar" onClick={onClose}>
            <X size={16} />
          </Button>
        </header>

        {children ? (
          <div
            ref={contenidoRef}
            className="max-h-[calc(100vh-240px)] overflow-y-auto px-6 py-5"
          >
            {children}
          </div>
        ) : null}

        {footer ? <footer className="border-t border-slate-200 px-6 py-4">{footer}</footer> : null}
      </section>
    </div>,
    document.body,
  );
}
