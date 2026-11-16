import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { RedirigirRutaVieja } from './RedirigirRutaVieja';

function Destino() {
  const { pathname, search } = useLocation();
  return <p data-testid="destino">{`${pathname}${search}`}</p>;
}

function renderEn(ruta: string) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/" element={<Destino />} />
        <Route path="/admin/*" element={<Destino />} />
        <Route path="/mi-club/*" element={<Destino />} />
        <Route path="*" element={<RedirigirRutaVieja />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('TASK-60 · RedirigirRutaVieja', () => {
  it('lleva una ruta vieja del panel a /admin conservando la query', () => {
    renderEn('/participantes?nueva=1');
    expect(screen.getByTestId('destino')).toHaveTextContent('/admin/participantes?nueva=1');
  });

  it('lleva una ruta personal vieja a Mi club', () => {
    renderEn('/mis-reservas');
    expect(screen.getByTestId('destino')).toHaveTextContent('/mi-club/reservas');
  });

  it('una ruta desconocida vuelve a la landing', () => {
    renderEn('/no-existe');
    expect(screen.getByTestId('destino')).toHaveTextContent(/^\/$/);
  });
});
