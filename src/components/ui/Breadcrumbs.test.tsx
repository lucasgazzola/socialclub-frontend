import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumbs, resolverBreadcrumbs } from './Breadcrumbs';
import { ROUTES } from '@/routes/paths';

describe('Breadcrumbs & resolverBreadcrumbs', () => {
  describe('resolverBreadcrumbs', () => {
    it('no genera migas de pan en la ruta raíz (Dashboard)', () => {
      const items = resolverBreadcrumbs('/');
      expect(items).toEqual([]);
    });

    it('resuelve rutas de un solo nivel (ej. /socios)', () => {
      const items = resolverBreadcrumbs('/socios');
      expect(items).toEqual([
        { label: 'Inicio', to: ROUTES.dashboard },
        { label: 'Socios' },
      ]);
    });

    it('resuelve jerarquía anidada de cuotas (ej. /cuotas/social/morosos)', () => {
      const items = resolverBreadcrumbs('/cuotas/social/morosos');
      expect(items).toEqual([
        { label: 'Inicio', to: ROUTES.dashboard },
        { label: 'Cuotas', to: ROUTES.cuotas },
        { label: 'Cuota Social', to: ROUTES.cuotaSocial },
        { label: 'Morosos' },
      ]);
    });

    it('resuelve jerarquía anidada de cuotas deportivas (ej. /cuotas/deportiva/cobrar)', () => {
      const items = resolverBreadcrumbs('/cuotas/deportiva/cobrar');
      expect(items).toEqual([
        { label: 'Inicio', to: ROUTES.dashboard },
        { label: 'Cuotas', to: ROUTES.cuotas },
        { label: 'Cuota Deportiva', to: ROUTES.cuotaDeportiva },
        { label: 'Cobrar Cuota' },
      ]);
    });

    it('resuelve rutas dinámicas con IDs (ej. /disciplinas/5/categorias)', () => {
      const items = resolverBreadcrumbs('/disciplinas/5/categorias');
      expect(items).toEqual([
        { label: 'Inicio', to: ROUTES.dashboard },
        { label: 'Disciplinas', to: ROUTES.disciplinas },
        { label: 'Categorías' },
      ]);
    });

    it('resuelve compra de entradas a eventos dinámicos (ej. /eventos/12/entradas)', () => {
      const items = resolverBreadcrumbs('/eventos/12/entradas');
      expect(items).toEqual([
        { label: 'Inicio', to: ROUTES.dashboard },
        { label: 'Eventos', to: ROUTES.eventos },
        { label: 'Comprar Entradas' },
      ]);
    });

    it('genera fallback formateado para rutas no mapeadas explícitamente', () => {
      const items = resolverBreadcrumbs('/modulo-nuevo');
      expect(items).toEqual([
        { label: 'Inicio', to: ROUTES.dashboard },
        { label: 'Modulo Nuevo' },
      ]);
    });
  });

  describe('Componente Breadcrumbs', () => {
    it('no renderiza nada en la raíz Dashboard cuando no hay items', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/']}>
          <Breadcrumbs />
        </MemoryRouter>,
      );

      expect(container.firstChild).toBeNull();
    });

    it('renderiza enlaces para ancestros y texto plano para la página activa', () => {
      render(
        <MemoryRouter initialEntries={['/socios']}>
          <Breadcrumbs />
        </MemoryRouter>,
      );

      const nav = screen.getByRole('navigation', { name: /Ruta de navegación/i });
      expect(nav).toBeInTheDocument();

      const linkInicio = screen.getByRole('link', { name: /Inicio/i });
      expect(linkInicio).toHaveAttribute('href', '/');

      const itemSocios = screen.getByText('Socios');
      expect(itemSocios.closest('[aria-current="page"]')).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Socios/i })).not.toBeInTheDocument();
    });

    it('renderiza jerarquía completa para rutas multinivel', () => {
      render(
        <MemoryRouter initialEntries={['/cuotas/social/morosos']}>
          <Breadcrumbs />
        </MemoryRouter>,
      );

      expect(screen.getByRole('link', { name: /Inicio/i })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: /Cuotas/i })).toHaveAttribute('href', '/cuotas');
      expect(screen.getByRole('link', { name: /Cuota Social/i })).toHaveAttribute(
        'href',
        '/cuotas/social',
      );

      const itemMorosos = screen.getByText('Morosos');
      expect(itemMorosos.closest('[aria-current="page"]')).toBeInTheDocument();
    });

    it('soporta la propiedad items para migas de pan personalizadas', () => {
      const customItems = [
        { label: 'Panel', to: '/panel' },
        { label: 'Sección', to: '/panel/seccion' },
        { label: 'Detalle' },
      ];

      render(
        <MemoryRouter initialEntries={['/']}>
          <Breadcrumbs items={customItems} />
        </MemoryRouter>,
      );

      expect(screen.getByRole('link', { name: /Panel/i })).toHaveAttribute('href', '/panel');
      expect(screen.getByRole('link', { name: /Sección/i })).toHaveAttribute(
        'href',
        '/panel/seccion',
      );
      expect(screen.getByText('Detalle').closest('[aria-current="page"]')).toBeInTheDocument();
    });
  });
});
