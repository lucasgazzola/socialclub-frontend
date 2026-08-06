import { useState, type KeyboardEvent } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { Button, Input, Spinner } from '@/components/ui';

interface BuscarParticipanteDniProps {
  cargando: boolean;
  noEncontrado: boolean;
  error?: string | null;
  onBuscar: (dni: string) => void;
  onRegistrarNuevo: () => void;
}

/**
 * Barra de búsqueda de participante por DNI, primer paso del flujo.
 *
 * OJO: este componente se renderiza DENTRO del <form> principal de
 * InscripcionPage (el que agrupa disciplina/categoría/confirmar), así que
 * NO puede tener su propio <form> anidado — HTML no lo permite y React
 * tira error de hidratación. Por eso "buscar" se dispara con un botón
 * type="button" + Enter capturado a mano en el input, nunca con un submit
 * real. El preventDefault() en handleKeyDown es lo que evita que Enter acá
 * dispare el submit del formulario grande antes de tiempo.
 */
export function BuscarParticipanteDni({
  cargando,
  noEncontrado,
  error,
  onBuscar,
  onRegistrarNuevo,
}: BuscarParticipanteDniProps) {
  const [dni, setDni] = useState('');

  const ejecutarBusqueda = () => {
    if (dni.trim()) onBuscar(dni.trim());
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      ejecutarBusqueda();
    }
  };

  return (
    <div>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Input
            id="buscar-dni"
            label="Buscar participante por DNI"
            placeholder="Ej: 38456123"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            onKeyDown={handleKeyDown}
            inputMode="numeric"
          />
        </div>
        <Button type="button" onClick={ejecutarBusqueda} disabled={cargando || !dni.trim()}>
          {cargando ? <Spinner className="h-4 w-4 text-white" /> : <Search size={16} />}
          Buscar
        </Button>
      </div>

      {noEncontrado && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>No hay ningún participante registrado con ese DNI.</span>
          <Button type="button" variant="secondary" size="sm" onClick={onRegistrarNuevo}>
            <UserPlus size={14} />
            Registrar nuevo
          </Button>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}