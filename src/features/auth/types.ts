export type RoleName = 'ADMIN' | 'COLLABORATOR';

/** User autenticado tal como lo expone el backend en /auth/me y /auth/login. */
export interface AuthenticatedUser {
  id: number;
  email: string;
  name?: string;
  lastName?: string;
  roles: RoleName[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

/** Datos del registro público (US-38). El backend no acepta roles ni dni acá. */
export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  lastName: string;
}
