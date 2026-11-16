export type TipoEspacio = 'DEPORTIVO' | 'SOCIAL' | 'MULTIUSO';
export type ModalidadReserva = 'POR_HORA' | 'DIA_COMPLETO';
export type TipoBloqueo = 'RECURRENTE' | 'PUNTUAL';
export type EstadoEspacioFiltro = 'todos' | 'activos' | 'inactivos';

export const TIPO_ESPACIO_LABELS: Record<TipoEspacio, string> = {
  DEPORTIVO: 'Deportivo',
  SOCIAL: 'Social',
  MULTIUSO: 'Multiuso',
};

export const MODALIDAD_RESERVA_LABELS: Record<ModalidadReserva, string> = {
  POR_HORA: 'Por hora',
  DIA_COMPLETO: 'Día completo',
};

export const DIAS_SEMANA = [
  { valor: 1, etiqueta: 'Lun', nombre: 'Lunes' },
  { valor: 2, etiqueta: 'Mar', nombre: 'Martes' },
  { valor: 3, etiqueta: 'Mié', nombre: 'Miércoles' },
  { valor: 4, etiqueta: 'Jue', nombre: 'Jueves' },
  { valor: 5, etiqueta: 'Vie', nombre: 'Viernes' },
  { valor: 6, etiqueta: 'Sáb', nombre: 'Sábado' },
  { valor: 0, etiqueta: 'Dom', nombre: 'Domingo' },
] as const;

export interface BloqueoAgenda {
  id: number;
  espacioId: number;
  eventoId?: number | null;
  tipo: TipoBloqueo;
  diasSemana: number[];
  fecha: string | null;
  horaInicio: string | null;
  horaFin: string | null;
  vigenteDesde: string | null;
  vigenteHasta: string | null;
  disciplinaId: number | null;
  disciplina?: { id: number; nombre: string } | null;
  motivo: string | null;
  activo: boolean;
}

export interface EspacioDisciplinaRel {
  disciplina: { id: number; nombre: string };
}

export interface SubespacioResumen {
  id: number;
  nombre: string;
  capacidadMaxima: number;
  precio: number | string;
  descuentoSocio?: number;
  precioSocio: number | string | null;
  montoSena: number | string;
  activo: boolean;
}

export interface Espacio {
  id: number;
  nombre: string;
  tipo: TipoEspacio;
  capacidadMaxima: number;
  modalidad: ModalidadReserva;
  ubicacion: string | null;
  descripcion: string | null;
  espacioPadreId?: number | null;
  espacioPadre?: { id: number; nombre: string; ubicacion?: string | null } | null;
  subespacios?: SubespacioResumen[];
  precio: number | string;
  descuentoSocio?: number;
  precioSocio: number | string | null;
  montoSena: number | string;
  activo: boolean;
  disciplinas?: EspacioDisciplinaRel[];
  bloqueos?: BloqueoAgenda[];
  _count?: {
    bloqueos: number;
    reservas: number;
    subespacios?: number;
  };
}

export function obtenerDescuentoSocio(espacio: {
  precio: number | string;
  descuentoSocio?: number | null;
  precioSocio?: number | string | null;
}): number {
  if (espacio.descuentoSocio !== undefined && espacio.descuentoSocio !== null) {
    return Number(espacio.descuentoSocio);
  }
  const precioGral = Number(espacio.precio);
  const precioSocio =
    espacio.precioSocio !== null && espacio.precioSocio !== undefined
      ? Number(espacio.precioSocio)
      : null;
  if (precioSocio !== null && precioGral > 0 && precioSocio < precioGral) {
    return Math.round(((precioGral - precioSocio) / precioGral) * 100);
  }
  return 0;
}

export function calcularPrecioSocio(
  precio: number | string,
  descuentoSocio?: number | null,
  precioSocio?: number | string | null,
): number {
  const precioNum = Number(precio);
  if (descuentoSocio !== undefined && descuentoSocio !== null && descuentoSocio > 0) {
    return Math.max(0, Math.round(precioNum * (1 - descuentoSocio / 100)));
  }
  if (precioSocio !== undefined && precioSocio !== null) {
    return Number(precioSocio);
  }
  return precioNum;
}

export interface CreateSubespacioPayload {
  nombre: string;
  capacidadMaxima?: number;
  descripcion?: string;
  precio?: number;
  descuentoSocio?: number;
  precioSocio?: number;
  montoSena?: number;
}

export interface CreateBloqueoPayload {
  tipo: TipoBloqueo;
  diasSemana?: number[];
  fecha?: string;
  horaInicio?: string;
  horaFin?: string;
  vigenteDesde?: string;
  vigenteHasta?: string;
  disciplinaId?: number;
  motivo?: string;
}

export interface CreateEspacioPayload {
  nombre: string;
  tipo: TipoEspacio;
  capacidadMaxima: number;
  modalidad: ModalidadReserva;
  ubicacion?: string;
  descripcion?: string;
  precio: number;
  descuentoSocio?: number;
  precioSocio?: number;
  montoSena: number;
  espacioPadreId?: number;
  cantidadSubespacios?: number;
  prefijoSubespacio?: string;
  capacidadSubespacio?: number;
  subespacios?: CreateSubespacioPayload[];
  disciplinaIds?: number[];
  bloqueos?: CreateBloqueoPayload[];
}

export type UpdateEspacioPayload = Partial<CreateEspacioPayload>;
export type UpdateBloqueoPayload = Partial<CreateBloqueoPayload>;

export interface FindEspaciosQuery {
  tipo?: TipoEspacio;
  modalidad?: ModalidadReserva;
  capacidadMin?: number;
  capacidadMax?: number;
  estado?: EstadoEspacioFiltro;
  activo?: boolean;
  busqueda?: string;
  espacioPadreId?: number;
  soloRaiz?: boolean;
  pagina?: number;
  porPagina?: number;
  ordenarPor?: string;
  orden?: 'asc' | 'desc';
}

export interface EspaciosPaginatedResponse {
  items: Espacio[];
  total: number;
  pagina: number;
  porPagina: number;
  counts: {
    todos: number;
    activos: number;
    inactivos: number;
  };
}
