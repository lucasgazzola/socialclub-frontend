import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EstadoDocumentoBadge, EstadoHabilitacionBadge } from './EstadoBadges';

describe('US-25 · EstadoBadges', () => {
  describe('EstadoDocumentoBadge (CA2 / CA3)', () => {
    it('renderiza "Vigente" para estado VIGENTE', () => {
      render(<EstadoDocumentoBadge estado="VIGENTE" />);
      expect(screen.getByText('Vigente')).toBeInTheDocument();
    });

    it('renderiza "Por vencer" para estado POR_VENCER (vence en <= 30 días)', () => {
      render(<EstadoDocumentoBadge estado="POR_VENCER" />);
      expect(screen.getByText('Por vencer')).toBeInTheDocument();
    });

    it('renderiza "Vencido" para estado VENCIDO', () => {
      render(<EstadoDocumentoBadge estado="VENCIDO" />);
      expect(screen.getByText('Vencido')).toBeInTheDocument();
    });

    it('renderiza "Faltante" para estado FALTANTE', () => {
      render(<EstadoDocumentoBadge estado="FALTANTE" />);
      expect(screen.getByText('Faltante')).toBeInTheDocument();
    });
  });

  describe('EstadoHabilitacionBadge (CA5)', () => {
    it('renderiza "Habilitado" para estado HABILITADO', () => {
      render(<EstadoHabilitacionBadge estado="HABILITADO" />);
      expect(screen.getByText('Habilitado')).toBeInTheDocument();
    });

    it('renderiza "Pendiente de documentación" para estado PENDIENTE', () => {
      render(<EstadoHabilitacionBadge estado="PENDIENTE" />);
      expect(screen.getByText('Pendiente de documentación')).toBeInTheDocument();
    });

    it('renderiza "Bloqueado" para estado BLOQUEADO', () => {
      render(<EstadoHabilitacionBadge estado="BLOQUEADO" />);
      expect(screen.getByText('Bloqueado')).toBeInTheDocument();
    });
  });
});
