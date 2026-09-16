import type { CategoriaSocio } from '@/features/socios/types';

export type RolNombre = 'ADMIN' | 'COLABORADOR' | 'DELEGADO' | 'SOCIO';

/** Membresía de una persona (período como socio). */
export interface MembresiaDePersona {
  id: number;
  categoriaId: number;
  categoria?: CategoriaSocio | null;
  fechaAlta: string;
  fechaBaja?: string | null;
  activo: boolean;
}

/** Persona vinculada al Usuario logueado. Siempre existe tras el registro. */
export interface PersonaDeUsuario {
  id: number;
  nombre?: string;
  apellido?: string;
  dni?: string | null;
  email?: string | null;
  telefono?: string | null;
  fechaNacimiento?: string | null;
  membresias: MembresiaDePersona[];
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
