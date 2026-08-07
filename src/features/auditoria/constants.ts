export type AccionAuditoria =
  | 'CREAR'
  | 'EDITAR'
  | 'BAJA'
  | 'REACTIVAR'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FALLIDO';

export const ACCIONES_AUDITORIA: { value: AccionAuditoria; label: string }[] = [
  { value: 'CREAR', label: 'Crear' },
  { value: 'EDITAR', label: 'Editar' },
  { value: 'BAJA', label: 'Baja' },
  { value: 'REACTIVAR', label: 'Reactivar' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'LOGIN_FALLIDO', label: 'Login fallido' },
];