export type RolNombre = 'ADMIN' | 'COLABORADOR';

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
