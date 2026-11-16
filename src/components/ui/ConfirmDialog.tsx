import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';
import { Spinner } from './Spinner';

interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  /** Qué va a pasar si confirma. Conviene que sea explícito y en una línea. */
  description?: string;
  /** Detalle opcional bajo la descripción (nombre del registro afectado, etc.). */
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` para bajas y borrados; `success` para reactivaciones. */
  variant?: 'primary' | 'danger' | 'success';
  /** Muestra el spinner y bloquea los botones mientras corre la mutación. */
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ICONOS = {
  primary: <HelpCircle />,
  danger: <AlertTriangle />,
  success: <CheckCircle2 />,
} as const;

/**
 * Diálogo de confirmación del design system, para reemplazar `window.confirm`
 * (DT-04). A diferencia del nativo, se puede estilar, es navegable con teclado,
 * distingue una acción destructiva de una que no lo es y puede mostrar el
 * estado de carga de la operación que confirma.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={loading ? () => {} : onCancel}
      size="sm"
      icon={ICONOS[variant]}
      tone={variant === 'primary' ? 'brand' : variant}
      footer={
        <>
          <Button type="button" variant="secondary" disabled={loading} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={variant} disabled={loading} onClick={onConfirm}>
            {loading && <Spinner className="h-4 w-4" />}
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children ?? null}
    </Modal>
  );
}
