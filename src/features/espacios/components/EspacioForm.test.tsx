import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EspacioForm } from './EspacioForm';

vi.mock('@/features/disciplinas/hooks/useDisciplinasActivas', () => ({
  useDisciplinasActivas: () => ({
    disciplinas: [
      { id: 1, nombre: 'Fútbol', categorias: [] },
      { id: 2, nombre: 'Pádel', categorias: [] },
      { id: 3, nombre: 'Básquet', categorias: [] },
    ],
    cargando: false,
    error: null,
  }),
}));

describe('US-55 · EspacioForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Criterio 6: no permite enviar campos obligatorios vacíos ni valores <= 0', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<EspacioForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /Crear espacio/i }));

    expect(await screen.findByText('El nombre del espacio es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('La capacidad máxima debe ser mayor a cero')).toBeInTheDocument();
    expect(screen.getByText('El precio de alquiler debe ser mayor a cero')).toBeInTheDocument();
    expect(screen.getByText('El monto de la seña debe ser mayor a cero')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('Criterio 2: muestra disciplinas compatibles para DEPORTIVO y MULTIUSO, y las oculta/limpia con aviso si es SOCIAL', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<EspacioForm onSubmit={onSubmit} />);

    // Por defecto es DEPORTIVO -> muestra las disciplinas
    expect(screen.getByText('Disciplinas compatibles')).toBeInTheDocument();
    const checkFutbol = screen.getByLabelText('Fútbol');
    await user.click(checkFutbol);
    expect(checkFutbol).toBeChecked();

    // Cambia a MULTIUSO -> siguen visibles
    await user.selectOptions(screen.getByLabelText(/Tipo de espacio/i), 'MULTIUSO');
    expect(screen.getByText('Disciplinas compatibles')).toBeInTheDocument();

    // Cambia a SOCIAL -> oculta la sección de disciplinas compatibles y muestra aviso informativo
    await user.selectOptions(screen.getByLabelText(/Tipo de espacio/i), 'SOCIAL');
    expect(screen.queryByText('Disciplinas compatibles')).not.toBeInTheDocument();
    expect(screen.getByTestId('aviso-social-sin-disciplinas')).toBeInTheDocument();

    // Completar resto y enviar como SOCIAL
    await user.type(screen.getByLabelText(/Nombre del espacio/i), 'Salón Principal');
    await user.clear(screen.getByLabelText(/Capacidad máxima/i));
    await user.type(screen.getByLabelText(/Capacidad máxima/i), '120');
    await user.selectOptions(screen.getByLabelText(/Modalidad de alquiler/i), 'DIA_COMPLETO');
    await user.clear(screen.getByLabelText(/Precio de alquiler/i));
    await user.type(screen.getByLabelText(/Precio de alquiler/i), '80000');
    await user.clear(screen.getByLabelText(/Seña requerida/i));
    await user.type(screen.getByLabelText(/Seña requerida/i), '30000');

    await user.click(screen.getByRole('button', { name: /Crear espacio/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        nombre: 'Salón Principal',
        tipo: 'SOCIAL',
        capacidadMaxima: 120,
        modalidad: 'DIA_COMPLETO',
        precio: 80000,
        montoSena: 30000,
      });
    });
  }, 15000);

  it('Patrón Composite: permite activar sub-espacios en lote, muestra vista previa y envía cantidadSubespacios y prefijoSubespacio', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<EspacioForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/Nombre del espacio/i), 'Sector Parrillas Belgrano 245');
    await user.selectOptions(screen.getByLabelText(/Tipo de espacio/i), 'SOCIAL');
    await user.clear(screen.getByLabelText(/Capacidad máxima/i));
    await user.type(screen.getByLabelText(/Capacidad máxima/i), '90');
    await user.clear(screen.getByLabelText(/Precio de alquiler/i));
    await user.type(screen.getByLabelText(/Precio de alquiler/i), '20000');
    await user.clear(screen.getByLabelText(/Seña requerida/i));
    await user.type(screen.getByLabelText(/Seña requerida/i), '5000');

    // Activar toggle de Patrón Composite
    await user.click(
      screen.getByLabelText(/¿Este espacio se divide en múltiples unidades o sub-espacios/i),
    );

    expect(screen.getByTestId('seccion-subespacios-composite')).toBeInTheDocument();

    const inputPrefijo = screen.getByLabelText(/Prefijo de cada unidad/i);
    await user.type(inputPrefijo, 'Parrilla');

    // Verifica la vista previa tipo "Se crearán: Parrilla 1, Parrilla 2 ... Parrilla 9"
    expect(screen.getByTestId('vista-previa-subespacios')).toHaveTextContent(
      'Se crearán: Parrilla 1, Parrilla 2 ... Parrilla 9',
    );

    await user.click(screen.getByRole('button', { name: /Crear espacio/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        nombre: 'Sector Parrillas Belgrano 245',
        tipo: 'SOCIAL',
        capacidadMaxima: 90,
        modalidad: 'POR_HORA',
        precio: 20000,
        montoSena: 5000,
        cantidadSubespacios: 9,
        prefijoSubespacio: 'Parrilla',
        capacidadSubespacio: 10,
      });
    });
  }, 15000);

  it(
    'Criterios 1, 2, 3 y 4: envía correctamente un espacio deportivo con disciplinas, bloqueo recurrente y bloqueo puntual',
    async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<EspacioForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/Nombre del espacio/i), 'Cancha de Fútbol 5 Norte');
    await user.clear(screen.getByLabelText(/Capacidad máxima/i));
    await user.type(screen.getByLabelText(/Capacidad máxima/i), '12');
    await user.type(screen.getByLabelText(/Ubicación \/ Sector/i), 'Polideportivo Norte');
    await user.clear(screen.getByLabelText(/Precio de alquiler/i));
    await user.type(screen.getByLabelText(/Precio de alquiler/i), '15000');
    await user.clear(screen.getByLabelText(/Descuento para socios/i));
    await user.type(screen.getByLabelText(/Descuento para socios/i), '20');
    await user.clear(screen.getByLabelText(/Seña requerida/i));
    await user.type(screen.getByLabelText(/Seña requerida/i), '5000');

    // Asociar Fútbol y Pádel
    await user.click(screen.getByLabelText('Fútbol'));
    await user.click(screen.getByLabelText('Pádel'));

    // Criterio 3: Agregar bloqueo recurrente
    await user.click(screen.getByRole('button', { name: /Agregar bloqueo recurrente/i }));
    await user.click(screen.getByRole('button', { name: 'Lunes' }));
    await user.click(screen.getByRole('button', { name: 'Miércoles' }));
    await user.type(screen.getByLabelText(/Vigencia hasta/i), '2026-12-31');
    await user.selectOptions(screen.getByLabelText(/Disciplina asociada/i), '1');
    await user.type(screen.getByLabelText(/Motivo \/ Detalle/i), 'Entrenamiento Primera');

    // Criterio 4: Agregar bloqueo puntual de día completo
    await user.click(screen.getByRole('button', { name: /Agregar bloqueo puntual/i }));
    await user.type(screen.getByLabelText(/Fecha específica/i), '2026-11-25');
    await user.type(screen.getByLabelText(/Motivo del bloqueo/i), 'Torneo Regional');
    await user.click(screen.getByLabelText(/Día completo/i));

    await user.click(screen.getByRole('button', { name: /Crear espacio/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        nombre: 'Cancha de Fútbol 5 Norte',
        tipo: 'DEPORTIVO',
        capacidadMaxima: 12,
        modalidad: 'POR_HORA',
        ubicacion: 'Polideportivo Norte',
        precio: 15000,
        descuentoSocio: 20,
        montoSena: 5000,
        disciplinaIds: [1, 2],
        bloqueos: [
          {
            tipo: 'RECURRENTE',
            diasSemana: [1, 3],
            horaInicio: '18:00',
            horaFin: '20:00',
            vigenteHasta: '2026-12-31',
            disciplinaId: 1,
            motivo: 'Entrenamiento Primera',
          },
          {
            tipo: 'PUNTUAL',
            fecha: '2026-11-25',
            motivo: 'Torneo Regional',
          },
        ],
      });
    });
  }, 15000);

  it('Criterio 5: muestra el mensaje de advertencia con el código de reserva cuando la API responde conflicto 409', async () => {
    const user = userEvent.setup();
    const err409 = Object.assign(
      new Error(
        'El bloqueo entra en conflicto con la reserva particular aprobada RES-SEED01. Debe gestionar la cancelación manual justificada de la reserva antes de bloquear el turno.',
      ),
      { status: 409 },
    );
    const onSubmit = vi.fn().mockRejectedValue(err409);

    render(<EspacioForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/Nombre del espacio/i), 'Cancha 1');
    await user.clear(screen.getByLabelText(/Capacidad máxima/i));
    await user.type(screen.getByLabelText(/Capacidad máxima/i), '10');
    await user.clear(screen.getByLabelText(/Precio de alquiler/i));
    await user.type(screen.getByLabelText(/Precio de alquiler/i), '12000');
    await user.clear(screen.getByLabelText(/Seña requerida/i));
    await user.type(screen.getByLabelText(/Seña requerida/i), '4000');

    await user.click(screen.getByRole('button', { name: /Crear espacio/i }));

    const alerta = await screen.findByTestId('alerta-error-espacio');
    expect(alerta).toHaveTextContent(/Conflicto de agenda con reserva aprobada/i);
    expect(alerta).toHaveTextContent(/RES-SEED01/);
    expect(alerta).toHaveTextContent(/cancelación manual justificada/i);
  });
});
