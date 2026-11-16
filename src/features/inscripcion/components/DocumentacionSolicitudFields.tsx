import type { ChangeEvent } from 'react';
import { FileText, Upload } from 'lucide-react';
import type { DocumentoRequeridoCatalogo } from '../types';
import { requiereVencimiento, type TipoDocumentacionDisciplina } from '@/features/disciplinas/types';

export interface DocumentoSolicitudValue {
  archivo: File | null;
  fechaVencimiento: string;
}

export type DocumentosSolicitudValues = Partial<
  Record<TipoDocumentacionDisciplina, DocumentoSolicitudValue>
>;

interface Props {
  documentos: DocumentoRequeridoCatalogo[];
  valores: DocumentosSolicitudValues;
  onChange: (
    tipoDocumento: TipoDocumentacionDisciplina,
    cambio: Partial<DocumentoSolicitudValue>,
  ) => void;
}

export function DocumentacionSolicitudFields({ documentos, valores, onChange }: Props) {
  if (documentos.length === 0) {
    return (
      <p className="text-xs text-slate-400">
        Esta disciplina no exige documentación obligatoria.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {documentos.map((documento) => {
        const valor = valores[documento.tipoDocumento] ?? {
          archivo: null,
          fechaVencimiento: '',
        };
        const necesitaVencimiento = requiereVencimiento(documento.tipoDocumento);

        return (
          <div
            key={documento.tipoDocumento}
            className="space-y-3 rounded-[2px] border border-white/[0.10] bg-[#070b14] p-3"
            data-testid={`tarjeta-documento-${documento.tipoDocumento}`}
          >
            <div className="flex items-start gap-2">
              <FileText size={16} className="mt-0.5 shrink-0 text-blue-400" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-white">{documento.nombre}</p>
                <p className="text-[11px] text-slate-400">
                  {documento.plazoDiasTolerancia === 0
                    ? 'Requerido al inicio'
                    : `${documento.plazoDiasTolerancia} días de tolerancia`}
                </p>
              </div>
            </div>

            {necesitaVencimiento && (
              <label className="block text-xs font-medium text-slate-300">
                Fecha de vencimiento
                <input
                  type="date"
                  value={valor.fechaVencimiento}
                  onChange={(event) =>
                    onChange(documento.tipoDocumento, { fechaVencimiento: event.target.value })
                  }
                  className="mt-1 block h-10 w-full rounded-[2px] border border-white/[0.13] bg-[#050912] px-3 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  data-testid={`fecha-vencimiento-${documento.tipoDocumento}`}
                />
              </label>
            )}

            <div>
              <label
                htmlFor={`archivo-${documento.tipoDocumento}`}
                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[2px] border border-blue-400/40 bg-blue-600 px-3 text-xs font-medium text-white transition-colors hover:bg-blue-500"
              >
                <Upload size={14} aria-hidden="true" />
                Elegir archivo
              </label>
              <input
                id={`archivo-${documento.tipoDocumento}`}
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange(documento.tipoDocumento, {
                    archivo: event.target.files?.[0] ?? null,
                  })
                }
              />
              <p className="mt-1 text-[11px] text-slate-400">
                {valor.archivo?.name ?? 'PDF o imagen'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
