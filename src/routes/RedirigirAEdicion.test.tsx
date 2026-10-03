import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ROUTES } from './paths';
import { RedirigirAEdicion } from './RedirigirAEdicion';

function Destino() {
  const location = useLocation();
  return <p>{`${location.pathname}${location.search}`}</p>;
}

describe('DT-20 · las rutas viejas de edición abren el modal sobre el listado', () => {
  it.each([
    ['/socios/5/editar', 'socios/:id/editar', ROUTES.editarSocio, '/socios?editar=5'],
    ['/cuotas/social/3/editar', 'cuotas/social/:id/editar', ROUTES.editarCuotaSocial, '/cuotas/social?editar=3'],
    ['/participante/10/editar', 'participante/:id/editar', ROUTES.editarParticipante, '/participantes?editar=10'],
  ])('%s → %s', (ruta, patron, destino, esperado) => {
    render(
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path={patron} element={<RedirigirAEdicion a={destino} />} />
          <Route path="*" element={<Destino />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(esperado)).toBeInTheDocument();
  });
});
