import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BuscarParticipanteDni } from './buscarParticipanteDni';

vi.mock('@/components/ui', () => ({
  Input: ({ label, ...props }: any) => (
    <div>
      <label>{label}</label>
      <input {...props} />
    </div>
  ),
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Spinner: ({ className }: any) => <span className={className} aria-label="spinner" />,
}));

describe('BuscarParticipanteDni', () => {
  it('muestra un aviso de No hay resultados y mantiene el flujo en búsqueda cuando no encuentra coincidencias', async () => {
    const user = userEvent.setup();
    const onBuscar = vi.fn();
    const onRegistrarNuevo = vi.fn();

    render(
      <BuscarParticipanteDni
        cargando={false}
        noEncontrado={true}
        onBuscar={onBuscar}
        onRegistrarNuevo={onRegistrarNuevo}
      />,
    );

    expect(screen.getAllByText(/No hay resultados/i).length).toBeGreaterThan(0);
    const boton = screen.getByRole('button', { name: /Inscribir nuevo participante/i });
    expect(boton).toBeInTheDocument();

    await user.click(boton);
    expect(onRegistrarNuevo).toHaveBeenCalledTimes(1);
  });
});
