import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { SeccionDisciplinas } from './SeccionDisciplinas';

describe('TASK-60 · Sección Disciplinas de Mi club', () => {
  it.each([
    ['/mi-club/disciplinas/solicitudes', 'Inscripciones'],
    ['/mi-club/disciplinas/solicitar', 'Inscripciones'],
    ['/mi-club/disciplinas/documentacion', 'Documentación'],
  ])('en %s marca «%s» como actual', (ruta, activa) => {
    renderWithProviders(<SeccionDisciplinas />, { ruta });
    expect(screen.getByRole('link', { name: activa })).toHaveAttribute('aria-current', 'page');
    const otra = activa === 'Inscripciones' ? 'Documentación' : 'Inscripciones';
    expect(screen.getByRole('link', { name: otra })).not.toHaveAttribute('aria-current');
  });
});
