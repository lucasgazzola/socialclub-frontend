import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CategoriaForm } from './CategoriaForm';
import type { CategoriaDisciplinaDetalle, RequerimientoDoc, Restricciones } from '../types';

const deDisciplina: RequerimientoDoc[] = [
  { id: 1, tipoDocumento: 'CERTIFICADO_MEDICO_APTITUD_FISICA', plazoDiasTolerancia: 30 },
];
const futbolInfantil: Restricciones = { genero: null, edadMinima: 6, edadMaxima: 18 };
const sinRestriccion: Restricciones = { genero: null, edadMinima: null, edadMaxima: null };

describe('US-48/49 · CategoriaForm', () => {
  it('muestra como solo lectura la documentación que ya exige la disciplina y no la ofrece de nuevo', () => {
    render(<CategoriaForm requerimientosDisciplina={deDisciplina} restriccionesDisciplina={futbolInfantil} onSubmit={vi.fn()} onCancel={vi.fn()} />);

    const heredada = screen.getByRole('region', { name: 'Documentación que exige la disciplina' });
    expect(within(heredada).getByText('Certificado médico de aptitud física')).toBeInTheDocument();
    expect(within(heredada).getByText('30 días para presentarlo')).toBeInTheDocument();
    expect(within(heredada).queryByRole('button')).not.toBeInTheDocument();

    const selector = screen.getByLabelText('Documentación adicional de la categoría');
    expect(within(selector).queryByRole('option', { name: 'Certificado médico de aptitud física' })).not.toBeInTheDocument();
    expect(within(selector).getByRole('option', { name: 'Autorización de padres/tutores' })).toBeInTheDocument();
  });

  it('crea una categoría con documentación adicional y su plazo', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<CategoriaForm requerimientosDisciplina={deDisciplina} restriccionesDisciplina={futbolInfantil} onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText('Nombre'), 'Sub-15');
    await user.selectOptions(screen.getByLabelText('Documentación adicional de la categoría'), 'AUTORIZACION_PADRES_TUTORES');
    const plazo = screen.getByLabelText('Plazo en días para presentar el documento');
    await user.clear(plazo);
    await user.type(plazo, '15');
    await user.click(screen.getByRole('button', { name: 'Agregar tipo' }));
    await user.click(screen.getByRole('button', { name: 'Crear categoría' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        {
          nombre: 'Sub-15',
          genero: null,
          edadMinima: null,
          edadMaxima: null,
          requerimientosDocumentacion: [{ tipoDocumento: 'AUTORIZACION_PADRES_TUTORES', plazoDiasTolerancia: 15 }],
        },
        expect.anything(),
      );
    });
  });

  it('no envía el formulario si el nombre está vacío', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CategoriaForm requerimientosDisciplina={[]} restriccionesDisciplina={sinRestriccion} onSubmit={onSubmit} onCancel={vi.fn()} />);

    expect(screen.getByText('La disciplina no exige documentación.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Crear categoría' }));

    expect(await screen.findByText('El nombre de la categoría es obligatorio')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('al editar precarga los datos y permite quitar documentación adicional', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const categoria: CategoriaDisciplinaDetalle = {
      id: 7,
      disciplinaId: 1,
      nombre: 'Sub-15',
      genero: null,
      edadMinima: 13,
      edadMaxima: 15,
      activo: true,
      creadoEn: '2026-10-01T00:00:00.000Z',
      requerimientosDoc: [{ id: 3, tipoDocumento: 'AUTORIZACION_PADRES_TUTORES', plazoDiasTolerancia: 15, creadoEn: '2026-10-01T00:00:00.000Z' }],
      _count: { inscripciones: 4 },
    };
    render(<CategoriaForm categoria={categoria} requerimientosDisciplina={deDisciplina} restriccionesDisciplina={futbolInfantil} onSubmit={onSubmit} onCancel={vi.fn()} />);

    expect(screen.getByLabelText('Nombre')).toHaveValue('Sub-15');
    expect(screen.getByText(/se exige también a los participantes ya inscriptos/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Quitar Autorización de padres/tutores' }));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        { nombre: 'Sub-15', genero: null, edadMinima: 13, edadMaxima: 15, requerimientosDocumentacion: [] },
        expect.anything(),
      );
    });
  });

  it('define restricciones propias y muestra los años de nacimiento que abarcan', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-06-01T12:00:00'));
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<CategoriaForm requerimientosDisciplina={[]} restriccionesDisciplina={futbolInfantil} onSubmit={onSubmit} onCancel={vi.fn()} />);

    expect(screen.getByText(/Rige: cualquier género · 6 a 18 años · Nacidos 2008–2020/)).toBeInTheDocument();

    await user.type(screen.getByLabelText('Nombre'), 'Sub-15 Femenino');
    await user.selectOptions(screen.getByLabelText('Género'), 'FEMENINO');
    await user.type(screen.getByLabelText('Edad mínima'), '13');
    await user.type(screen.getByLabelText('Edad máxima'), '15');

    expect(screen.getByText(/Rige: Femenino · 13 a 15 años · Nacidos 2011–2013 \(temporada 2026\)/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Crear categoría' }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        { nombre: 'Sub-15 Femenino', genero: 'FEMENINO', edadMinima: 13, edadMaxima: 15, requerimientosDocumentacion: [] },
        expect.anything(),
      );
    });
    vi.useRealTimers();
  });

  it('si la disciplina restringe el género, solo permite heredarlo', () => {
    render(
      <CategoriaForm
        requerimientosDisciplina={[]}
        restriccionesDisciplina={{ genero: 'FEMENINO', edadMinima: null, edadMaxima: null }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const opciones = within(screen.getByLabelText('Género')).getAllByRole('option');
    expect(opciones).toHaveLength(1);
    expect(opciones[0]).toHaveTextContent('Igual que la disciplina (Femenino)');
  });

  it('no envía si la edad máxima es menor que la mínima', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CategoriaForm requerimientosDisciplina={[]} restriccionesDisciplina={sinRestriccion} onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText('Nombre'), 'Sub-15');
    await user.type(screen.getByLabelText('Edad mínima'), '15');
    await user.type(screen.getByLabelText('Edad máxima'), '13');
    await user.click(screen.getByRole('button', { name: 'Crear categoría' }));

    expect(await screen.findByText('La edad máxima no puede ser menor que la edad mínima')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
