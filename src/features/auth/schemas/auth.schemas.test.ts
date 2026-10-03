import { describe, it, expect } from 'vitest';
import { loginSchema } from './login.schema';
import { registerSchema } from './register.schema';

describe('Auth Schemas', () => {
  describe('loginSchema', () => {
    it('valida credenciales válidas', () => {
      const valid = { email: 'user@club.com', password: 'password123' };
      const res = loginSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it('falla con email inválido o password menor a 8 caracteres', () => {
      const invalid = { email: 'no-es-email', password: '123' };
      const res = loginSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('valida datos de registro completos cumpliendo los requisitos de contraseña', () => {
      const valid = {
        nombre: 'Juan',
        apellido: 'Perez',
        email: 'juan@club.com',
        password: 'Password123!',
      };
      const res = registerSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it('rechaza registros con contraseñas que no cumplen complejidad o campos vacíos', () => {
      const invalid = {
        nombre: '',
        apellido: '',
        email: 'juan@club.com',
        password: 'password', // sin mayuscula ni simbolo ni numero
      };
      const res = registerSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });
});
