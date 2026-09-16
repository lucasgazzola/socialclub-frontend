import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FileCheck } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { env } from '@/config/env';
import { ROUTES } from '@/routes/paths';
import { useBuscarParticipante } from '@/features/inscripcion/hooks/useBuscarParticipante';
import { BuscarParticipanteDni } from '@/features/inscripcion/components/buscarParticipanteDni';
import { useCrearDocumentacion, useDocumentacionPorPersona } from '../hooks/useDocumentacion';
import { documentacionSchema, type DocumentacionFormValues } from '../schemas/documentacion.schema';

/** Fecha local de hoy (YYYY-MM-DD) para el atributo min del input date. */
function hoyISO(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/**
 * US-24 — El delegado carga documentación obligatoria de un participante.
 * Paso 1: buscar al participante por DNI. Paso 2: cargar el documento.
 */
export function CargarDocumentacionPage() {
  const navigate = useNavigate();
  const busqueda = useBuscarParticipante();
  const participante = busqueda.participante;
  const crear = useCrearDocumentacion();
  const { data: documentos } = useDocumentacionPorPersona(participante?.id ?? null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DocumentacionFormValues>({ resolver: zodResolver(documentacionSchema) });

  const onSubmit = handleSubmit(async (values) => {
    if (!participante) return;
    try {
      await crear.mutateAsync({ payload: { ...values, personaId: participante.id }, archivo });
      toast.success('Documentación cargada correctamente');
      reset({ tipo: '', fechaVencimiento: '' });
      setArchivo(null);
      setFileKey((k) => k + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cargar la documentación');
    }
  });

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <FileCheck size={22} /> Cargar documentación obligatoria
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Buscá al participante por DNI y cargá su documentación con la fecha de vencimiento.
        </p>
      </header>

      <BuscarParticipanteDni
        cargando={busqueda.cargando}
        noEncontrado={busqueda.noEncontrado}
        error={busqueda.error}
        onBuscar={(dni) => void busqueda.buscar(dni)}
        onRegistrarNuevo={() => navigate(ROUTES.inscripcion)}
      />

      {busqueda.noEncontrado && (
        <p className="mt-3 text-sm text-slate-500">
          No se encontró un participante con ese DNI. Registralo primero desde Inscripción.
        </p>
      )}

      {participante && (
        <div className="mt-6 space-y-6">
          <Card className="p-4">
            <p className="text-sm text-slate-500">Participante</p>
            <p className="font-medium text-slate-900">
              {participante.nombre} {participante.apellido} · DNI {participante.dni}
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-base font-semibold text-slate-800">Nuevo documento</h2>
            <form className="space-y-4" onSubmit={onSubmit} noValidate>
              <Input
                id="tipo"
                label="Tipo de documento"
                placeholder="Ej: Apto físico"
                error={errors.tipo?.message}
                {...register('tipo')}
              />
              <Input
                id="fechaVencimiento"
                type="date"
                label="Fecha de vencimiento"
                min={hoyISO()}
                error={errors.fechaVencimiento?.message}
                {...register('fechaVencimiento')}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Archivo (PDF o imagen, opcional)
                </label>
                <input
                  key={fileKey}
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Cargando…' : 'Cargar documento'}
              </Button>
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-base font-semibold text-slate-800">Documentación cargada</h2>
            {documentos && documentos.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {documentos.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-slate-700">
                      {doc.tipo}
                      {doc.archivoNombre && (
                        <a
                          href={`${env.apiUrl}/documentacion/${doc.id}/archivo`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-brand-700 hover:underline"
                        >
                          (ver archivo)
                        </a>
                      )}
                    </span>
                    <span className="text-slate-500">
                      Vence: {new Date(doc.fechaVencimiento).toLocaleDateString('es-AR')}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Todavía no hay documentación cargada.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
