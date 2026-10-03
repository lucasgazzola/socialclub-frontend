import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CategoriasDisciplinaPage } from './CategoriasDisciplinaPage';
import { useCategorias } from '../hooks/useCategorias';

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ usuario: { nombre: 'Ana', apellido: 'Admin', roles: ['ADMIN'] } }),
}));

const mutacion = () => ({ mutateAsync: vi.fn(), isPending: false });
vi.mock('../hooks/useCategorias', () => ({
  useCategorias: vi.fn(),
  useCrearCategoria: () => mutacion(),
  useActualizarCategoria: () => mutacion(),
  useDesactivarCategoria: () => mutacion(),
  useReactivarCategoria: () => mutacion(),
}));

const useCategoriasMock = useCategorias as unknown as ReturnType<typeof vi.fn>;

const futbol = {
  id: 1,
  nombre: 'Fútbol',
  activo: true,
  solicitaDocumentacion: true,
  genero: null,
  edadMinima: 6,
  edadMaxima: 18,
  requerimientosDoc: [{ id: 1, tipoDocumento: 'CERTIFICADO_MEDICO_APTITUD_FISICA', plazoDiasTolerancia: 30, creadoEn: '' }],
};

function respuesta(items: unknown[], disciplina = futbol) {
  return { data: { disciplina, items }, isLoading: false, isError: false, error: null, isFetching: false };
}

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={['/disciplinas/1/categorias']}>
      <Routes>
        <Route path="/disciplinas/:id/categorias" element={<CategoriasDisciplinaPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('US-51 · CategoriasDisciplinaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista las categorías con la documentación total exigida (disciplina + categoría) y su estado', () => {
    useCategoriasMock.mockReturnValue(
      respuesta([
        {
          id: 7,
          disciplinaId: 1,
          nombre: 'Sub-15',
          genero: 'FEMENINO',
          edadMinima: 13,
          edadMaxima: 15,
          activo: true,
          creadoEn: '',
          requerimientosDoc: [{ id: 3, tipoDocumento: 'AUTORIZACION_PADRES_TUTORES', plazoDiasTolerancia: 15, creadoEn: '' }],
          _count: { inscripciones: 4 },
        },
      ]),
    );
    renderPagina();

    expect(screen.getByRole('heading', { name: 'Categorías de Fútbol' })).toBeInTheDocument();
    expect(screen.getByText('Sub-15')).toBeInTheDocument();
    expect(screen.getByText('Certificado médico de aptitud física')).toBeInTheDocument();
    expect(screen.getByText('Autorización de padres/tutores')).toBeInTheDocument();
    expect(screen.getByText('Activa')).toBeInTheDocument();
    expect(screen.getByText('Femenino · 13 a 15 años')).toBeInTheDocument();
  });

  it('muestra "No se encontraron resultados" si no hay coincidencias', () => {
    useCategoriasMock.mockReturnValue(respuesta([]));
    renderPagina();

    expect(screen.getByText('No se encontraron resultados')).toBeInTheDocument();
  });

  it('filtra por nombre y por estado', async () => {
    const user = userEvent.setup();
    useCategoriasMock.mockReturnValue(respuesta([]));
    renderPagina();

    await user.type(screen.getByPlaceholderText('Buscar categoría'), 'sub');
    await user.click(screen.getByRole('tab', { name: /Inactivas/ }));

    await waitFor(() => {
      expect(useCategoriasMock).toHaveBeenLastCalledWith(1, { busqueda: 'sub', estado: 'INACTIVA' });
    });
  });

  it('no permite agregar categorías a una disciplina inactiva', () => {
    useCategoriasMock.mockReturnValue(respuesta([], { ...futbol, activo: false }));
    renderPagina();

    expect(screen.getByRole('button', { name: /Nueva categoría/ })).toBeDisabled();
    expect(screen.getByText(/La disciplina está inactiva/)).toBeInTheDocument();
  });
});
