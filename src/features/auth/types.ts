export type RolNombre = 'ADMIN' | 'COLABORADOR' | 'DELEGADO';

/** Usuario autenticado tal como lo expone el backend en /auth/me y /auth/login. */
export interface UsuarioAutenticado {
  id: number;
  email: string;
  nombre?: string;
  apellido?: string;
  roles: RolNombre[];
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
