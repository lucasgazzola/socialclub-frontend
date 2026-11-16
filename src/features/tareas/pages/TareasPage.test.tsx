import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { TareasPage } from './TareasPage';
import { useEjecuciones, useEjecutarTarea, useTareas } from '../hooks/useTareas';
import type { EjecucionTarea, TareaAutomatica } from '../types';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock('../hooks/useTareas', () => ({
  useTareas: vi.fn(),
  useEjecuciones: vi.fn(),
  useEjecutarTarea: vi.fn(),
}));

const mock = (hook: unknown) => hook as ReturnType<typeof vi.fn>;
const mutateAsync = vi.fn();

const ejecucion = (extra: Partial<EjecucionTarea> = {}): EjecucionTarea => ({
  id: 1,
  tarea: 'vencimientos-documentacion',
  origen: 'PROGRAMADA',
  usuarioId: null,
  usuario: null,
  estado: 'EXITOSA',
  inicio: '2026-10-03T11:00:05.000Z',
  fin: '2026-10-03T11:00:06.000Z',
  resultado: { alertas: 10, nuevas: 2, enviadas: 1 },
  error: null,
  ...extra,
});

const tareas: TareaAutomatica[] = [
  {
    nombre: 'reintentar-notificaciones',
    descripcion: 'Reenvía las notificaciones pendientes o fallidas.',
    horario: 'Cada 6 horas',
    ultimaEjecucion: null,
  },
  {
    nombre: 'vencimientos-documentacion',
    descripcion: 'Avisa por email a los delegados la documentación que vence.',
    horario: 'Todos los días a las 08:00',
    ultimaEjecucion: ejecucion(),
  },
];

describe('DT-22 · TareasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mock(useTareas).mockReturnValue({ data: tareas, isLoading: false, isError: false });
    mock(useEjecuciones).mockReturnValue({ data: [], isLoading: false });
    mock(useEjecutarTarea).mockReturnValue({ mutateAsync, isPending: false });
  });

  it('lista las tareas con su horario, última ejecución, estado y resultado', () => {
    render(<TareasPage />);

    const filas = screen.getAllByRole('row').slice(1);
    const nunca = within(filas[0]);
    expect(nunca.getByText('reintentar-notificaciones')).toBeInTheDocument();
    expect(nunca.getByText('Cada 6 horas')).toBeInTheDocument();
    expect(nunca.getByText('Nunca')).toBeInTheDocument();

    const venc = within(filas[1]);
    expect(venc.getByText('Todos los días a las 08:00')).toBeInTheDocument();
    expect(venc.getByText('Programada')).toBeInTheDocument();
    expect(venc.getByText('Exitosa')).toBeInTheDocument();
    expect(venc.getByText('Alertas:')).toBeInTheDocument();
    expect(venc.getByText('10')).toBeInTheDocument();
  });

  it('"Ejecutar ahora" pide confirmación y avisa el resultado', async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue(ejecucion({ origen: 'MANUAL' }));
    render(<TareasPage />);

    await user.click(screen.getByRole('button', { name: 'Ejecutar vencimientos-documentacion' }));
    expect(screen.getByText(/queda registrada a tu nombre en Auditoría/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ejecutar' }));

    expect(mutateAsync).toHaveBeenCalledWith('vencimientos-documentacion');
    expect(toast.success).toHaveBeenCalledWith('«vencimientos-documentacion» se ejecutó correctamente');
  });

  it('si la ejecución falla muestra el error', async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue(ejecucion({ estado: 'FALLIDA', error: 'SMTP caído' }));
    render(<TareasPage />);

    await user.click(screen.getByRole('button', { name: 'Ejecutar vencimientos-documentacion' }));
    await user.click(screen.getByRole('button', { name: 'Ejecutar' }));

    expect(toast.error).toHaveBeenCalledWith('«vencimientos-documentacion» falló: SMTP caído');
  });

  it('si ya se estaba ejecutando lo informa', async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue(ejecucion({ estado: 'OMITIDA', error: 'La tarea ya se estaba ejecutando' }));
    render(<TareasPage />);

    await user.click(screen.getByRole('button', { name: 'Ejecutar vencimientos-documentacion' }));
    await user.click(screen.getByRole('button', { name: 'Ejecutar' }));

    expect(toast.info).toHaveBeenCalledWith('La tarea ya se estaba ejecutando');
  });

  it('"Historial" muestra las ejecuciones con origen y resultado', async () => {
    const user = userEvent.setup();
    mock(useEjecuciones).mockReturnValue({
      data: [
        ejecucion({
          id: 2,
          origen: 'MANUAL',
          usuario: { id: 1, nombre: 'Marta', apellido: 'Secretaría' },
          estado: 'FALLIDA',
          resultado: null,
          error: 'SMTP caído',
        }),
      ],
      isLoading: false,
    });
    render(<TareasPage />);

    await user.click(screen.getByRole('button', { name: 'Historial de vencimientos-documentacion' }));

    const dialogo = screen.getByRole('dialog', { name: 'Historial de vencimientos-documentacion' });
    expect(within(dialogo).getByText('Manual · Marta Secretaría')).toBeInTheDocument();
    expect(within(dialogo).getByText('Fallida')).toBeInTheDocument();
    expect(within(dialogo).getByText('SMTP caído')).toBeInTheDocument();
  });

  it('avisa si no se pudieron cargar', () => {
    mock(useTareas).mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<TareasPage />);
    expect(screen.getByText('No se pudieron cargar las tareas automáticas.')).toBeInTheDocument();
  });
});
