import { useMutation } from '@tanstack/react-query';
import { sociosApi } from '../api/socios.api';

/** US-09: el backend completa nombre/apellido/email. */
export interface RegistrarmeSocioPayload {
  dni: string;
  categoriaId: number;
}

/** US-09: da de alta al usuario logueado como socio. */
export function useRegistrarmeSocio() {
  return useMutation({
    mutationFn: (payload: RegistrarmeSocioPayload) => sociosApi.registrarme(payload),
  });
}