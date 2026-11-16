import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ExternalLink,
  Plus,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { Button, Modal, ModalActions, Select, Spinner } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import { useDisciplinasActivas } from '../../disciplinas/hooks/useDisciplinasActivas';
import { categoriasDisponibles } from '../../disciplinas/types';
import { preEvaluarAltaParticipante } from '../api/inscripcion.api';
import { useActivarParticipante } from '../hooks/useActivarParticipante';
import type {
  ActivarParticipanteDisciplinaPayload,
  ParticipanteConDisciplinas,
  PreAltaInscripcionAnterior,
} from '../types';

interface DarDeAltaParticipanteModalProps {
  participante: ParticipanteConDisciplinas | null;
  onClose: () => void;
}

interface NuevaDisciplinaRow {
  disciplinaId: number;
  categoriaDisciplinaId?: number;
}

function formatearMoneda(monto: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(monto);
}

function nombreDisciplinaAnterior(item: PreAltaInscripcionAnterior): string {
  return item.disciplina?.nombre ?? item.disciplinaNombre ?? `Disciplina #${item.disciplinaId}`;
}

function nombreCategoriaAnterior(item: PreAltaInscripcionAnterior): string | null {
  return item.categoriaDisciplina?.nombre ?? item.categoriaNombre ?? null;
}

export function DarDeAltaParticipanteModal({
  participante,
  onClose,
}: DarDeAltaParticipanteModalProps) {
  return (
    <Modal
      open={participante !== null}
      onClose={onClose}
      size="lg"
      tone="success"
      icon={<UserCheck size={20} />}
      title="Dar de alta participante"
      description={
        participante
          ? `${participante.persona.apellido}, ${participante.persona.nombre}`
          : undefined
      }
    >
      {participante && (
        <DarDeAltaContenido participante={participante} onClose={onClose} />
      )}
    </Modal>
  );
}

function DarDeAltaContenido({
  participante,
  onClose,
}: {
  participante: ParticipanteConDisciplinas;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const {
    data: preAlta,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['inscripcion', 'pre-alta', participante.personaId],
    queryFn: () => preEvaluarAltaParticipante(participante.personaId),
  });

  const { disciplinas: disciplinasActivas, cargando: cargandoDisciplinas } =
    useDisciplinasActivas();
  const { mutateAsync: activar, isPending: activando } = useActivarParticipante();

  // Claves de inscripciones anteriores tildadas tal cual estaban.
  const [anterioresSeleccionadas, setAnterioresSeleccionadas] = useState<Set<string>>(
    () => new Set(),
  );
  // Categoría alternativa elegida para una inscripción anterior bloqueada.
  const [categoriasAlternativas, setCategoriasAlternativas] = useState<
    Record<string, number | undefined>
  >({});
  // Disciplinas nuevas agregadas manualmente.
  const [nuevasDisciplinas, setNuevasDisciplinas] = useState<NuevaDisciplinaRow[]>([]);

  const toggleAnterior = (key: string) => {
    setAnterioresSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleAgregarDisciplina = () => {
    setNuevasDisciplinas((prev) => [
      ...prev,
      { disciplinaId: 0, categoriaDisciplinaId: undefined },
    ]);
  };

  const handleDisciplinaNuevaChange = (index: number, disciplinaId: number) => {
    setNuevasDisciplinas((prev) => {
      const next = [...prev];
      next[index] = { disciplinaId, categoriaDisciplinaId: undefined };
      return next;
    });
  };

  const handleCategoriaNuevaChange = (
    index: number,
    categoriaDisciplinaId: number | undefined,
  ) => {
    setNuevasDisciplinas((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], categoriaDisciplinaId };
      return next;
    });
  };

  const handleEliminarNueva = (index: number) => {
    setNuevasDisciplinas((prev) => prev.filter((_, i) => i !== index));
  };

  const faltaCategoriaEnNueva = useMemo(() => {
    return nuevasDisciplinas.some((row) => {
      if (!row.disciplinaId) return false;
      const disc = disciplinasActivas.find((d) => d.id === row.disciplinaId);
      const tieneCategorias = (disc?.categorias ?? []).length > 0;
      return tieneCategorias && !row.categoriaDisciplinaId;
    });
  }, [nuevasDisciplinas, disciplinasActivas]);

  const disciplinasFinales = useMemo<ActivarParticipanteDisciplinaPayload[]>(() => {
    const mapa = new Map<string, ActivarParticipanteDisciplinaPayload>();

    if (preAlta) {
      preAlta.inscripcionesAnteriores.forEach((item, index) => {
        const key = String(item.inscripcionId ?? `${item.disciplinaId}-${index}`);
        if (item.cumpleRestricciones && anterioresSeleccionadas.has(key)) {
          const catId = item.categoriaDisciplinaId ?? undefined;
          mapa.set(`${item.disciplinaId}-${catId ?? 'none'}`, {
            disciplinaId: item.disciplinaId,
            categoriaDisciplinaId: catId,
          });
        } else if (!item.cumpleRestricciones) {
          const altCatId = categoriasAlternativas[key];
          if (altCatId) {
            mapa.set(`${item.disciplinaId}-${altCatId}`, {
              disciplinaId: item.disciplinaId,
              categoriaDisciplinaId: altCatId,
            });
          }
        }
      });
    }

    for (const row of nuevasDisciplinas) {
      if (row.disciplinaId > 0) {
        mapa.set(`${row.disciplinaId}-${row.categoriaDisciplinaId ?? 'none'}`, {
          disciplinaId: row.disciplinaId,
          categoriaDisciplinaId: row.categoriaDisciplinaId,
        });
      }
    }

    return Array.from(mapa.values());
  }, [preAlta, anterioresSeleccionadas, categoriasAlternativas, nuevasDisciplinas]);

  const handleConfirmar = async () => {
    if (disciplinasFinales.length === 0 || faltaCategoriaEnNueva) return;
    try {
      await activar({
        personaId: participante.personaId,
        payload: { disciplinas: disciplinasFinales },
      });
      onClose();
    } catch {
      // El hook ya muestra el toast de error; el modal queda abierto para reintentar.
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (isError || !preAlta) {
    return (
      <div className="space-y-4 py-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          No se pudo verificar el estado previo del participante para el alta.
        </div>
        <ModalActions>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="button" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </ModalActions>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {preAlta.tieneDeuda && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold">
                  Deuda deportiva pendiente: {formatearMoneda(preAlta.deudaDeportivaTotal)}
                </p>
                <p className="mt-0.5 text-xs text-amber-800">
                  El participante registra cuotas deportivas impagas de períodos anteriores.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0"
              onClick={() => {
                onClose();
                navigate(ROUTES.cobrarCuotaDeportivaDe(participante.persona.dni));
              }}
            >
              <ExternalLink size={14} />
              Ir a cobrar cuota deportiva
            </Button>
          </div>

          {preAlta.cuotasPendientes.length > 0 && (
            <ul className="mt-3 divide-y divide-amber-200/70 rounded-lg border border-amber-200/80 bg-white/70 px-3">
              {preAlta.cuotasPendientes.map((cuota, idx) => {
                const discNombre =
                  typeof cuota.disciplina === 'string'
                    ? cuota.disciplina
                    : (cuota.disciplina?.nombre ?? cuota.disciplinaNombre);
                return (
                  <li
                    key={cuota.id ?? `${cuota.periodo}-${idx}`}
                    className="flex items-center justify-between py-1.5 text-xs"
                  >
                    <span className="font-medium text-slate-800">
                      {cuota.periodo}
                      {discNombre ? ` · ${discNombre}` : ''}
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-amber-900">
                      {formatearMoneda(cuota.monto)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {preAlta.inscripcionesAnteriores.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Inscripciones anteriores</h3>
            <p className="text-xs text-slate-500">
              Tildá las disciplinas en las que ya estuvo inscripto para reincorporarlo.
            </p>
          </div>

          <div className="space-y-2">
            {preAlta.inscripcionesAnteriores.map((item, index) => {
              const key = String(item.inscripcionId ?? `${item.disciplinaId}-${index}`);
              const discNombre = nombreDisciplinaAnterior(item);
              const catNombre = nombreCategoriaAnterior(item);
              const checked = item.cumpleRestricciones && anterioresSeleccionadas.has(key);

              const discActiva = disciplinasActivas.find((d) => d.id === item.disciplinaId);
              const categoriasValidas = discActiva
                ? categoriasDisponibles(discActiva, undefined, participante.persona)
                : [];

              return (
                <div
                  key={key}
                  className={`rounded-xl border p-3 transition-colors ${
                    item.cumpleRestricciones
                      ? checked
                        ? 'border-emerald-300 bg-emerald-50/50'
                        : 'border-slate-200 bg-white hover:bg-slate-50/60'
                      : 'border-rose-200 bg-rose-50/40'
                  }`}
                >
                  <label
                    className={`flex items-start gap-3 ${
                      item.cumpleRestricciones ? 'cursor-pointer' : 'cursor-not-allowed'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!item.cumpleRestricciones}
                      onChange={() => toggleAnterior(key)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 disabled:opacity-50"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-medium ${
                            item.cumpleRestricciones ? 'text-slate-900' : 'text-slate-500'
                          }`}
                        >
                          {discNombre}
                        </span>
                        {catNombre && (
                          <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            {catNombre}
                          </span>
                        )}
                      </div>

                      {!item.cumpleRestricciones && item.motivosBloqueo.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5 text-xs text-rose-700">
                          {item.motivosBloqueo.map((motivo) => (
                            <li key={motivo}>• {motivo}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </label>

                  {!item.cumpleRestricciones && categoriasValidas.length > 0 && (
                    <div className="mt-3 border-t border-rose-200/60 pt-2.5 pl-7">
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Elegir otra categoría habilitada en {discNombre}
                      </label>
                      <Select
                        value={categoriasAlternativas[key] ?? ''}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : undefined;
                          setCategoriasAlternativas((prev) => ({
                            ...prev,
                            [key]: val,
                          }));
                        }}
                      >
                        <option value="">No reinscribir en {discNombre}</option>
                        {categoriasValidas.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nombre}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3 border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Agregar otra disciplina</h3>
            <p className="text-xs text-slate-500">
              Podés sumar cualquier disciplina activa del club.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAgregarDisciplina}
            disabled={cargandoDisciplinas}
          >
            <Plus size={14} />
            Agregar disciplina
          </Button>
        </div>

        {nuevasDisciplinas.length > 0 && (
          <div className="space-y-2.5">
            {nuevasDisciplinas.map((row, index) => {
              const disc = disciplinasActivas.find((d) => d.id === row.disciplinaId);
              const categorias = disc
                ? categoriasDisponibles(disc, undefined, participante.persona)
                : [];
              const tieneCategorias = (disc?.categorias ?? []).length > 0;

              return (
                <div
                  key={`nueva-alta-${index}`}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-end"
                >
                  <div className="min-w-0 flex-1">
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Disciplina
                    </label>
                    <Select
                      value={row.disciplinaId || ''}
                      onChange={(e) =>
                        handleDisciplinaNuevaChange(
                          index,
                          e.target.value ? Number(e.target.value) : 0,
                        )
                      }
                    >
                      <option value="">Seleccioná una disciplina</option>
                      {disciplinasActivas.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nombre}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {tieneCategorias && (
                    <div className="min-w-0 flex-1">
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Categoría
                      </label>
                      <Select
                        value={row.categoriaDisciplinaId ?? ''}
                        disabled={categorias.length === 0}
                        onChange={(e) =>
                          handleCategoriaNuevaChange(
                            index,
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                      >
                        <option value="">
                          {categorias.length === 0
                            ? 'Sin categorías habilitadas'
                            : 'Seleccioná una categoría'}
                        </option>
                        {categorias.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Quitar disciplina"
                    onClick={() => handleEliminarNueva(index)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {disciplinasFinales.length === 0 && (
        <p className="text-xs text-slate-500">
          Seleccioná al menos una disciplina para confirmar el alta.
        </p>
      )}
      {faltaCategoriaEnNueva && (
        <p className="text-xs text-rose-600">
          Seleccioná una categoría para cada disciplina agregada que la requiera.
        </p>
      )}

      <ModalActions>
        <Button type="button" variant="secondary" onClick={onClose} disabled={activando}>
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={() => void handleConfirmar()}
          disabled={disciplinasFinales.length === 0 || faltaCategoriaEnNueva || activando}
        >
          {activando ? 'Confirmando...' : 'Confirmar alta'}
        </Button>
      </ModalActions>
    </div>
  );
}
