import type { CategoriaSocio } from '@/features/socios/types';

export type RolNombre = 'ADMIN' | 'COLABORADOR' | 'DELEGADO' | 'SOCIO';

/** Persona vinculada al Usuario logueado (US-09). */
export interface PersonaDeUsuario {
  id: number;
  dni: string;
  email?: string | null;
  telefono?: string | null;
  fechaNacimiento?: string | null;
  categoriaId?: number | null;
  categoria?: CategoriaSocio | null;
  fechaAlta: string;
  activo: boolean;
}

/** Usuario autenticado tal como lo expone el backend en /auth/me y /auth/login. */
export interface UsuarioAutenticado {
  id: number;
  email: string;
  nombre?: string;
  apellido?: string;
  roles: RolNombre[];
  /** Si el usuario ya se hizo socio, su ficha; si no, null/undefined. */
  persona?: PersonaDeUsuario | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

/** Datos del registro público (US-38). El backend no acepta roles ni dni acá. */
export interface RegisterPayload {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
}
