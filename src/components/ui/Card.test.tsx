import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card';

describe('Card components', () => {
  it('renderiza Card y sus subcomponentes correctamente con estilos y clases adicionales', () => {
    render(
      <Card className="custom-card" data-testid="card">
        <CardHeader className="custom-header">
          <CardTitle className="custom-title">Título de la Tarjeta</CardTitle>
          <CardDescription className="custom-desc">Descripción de la tarjeta</CardDescription>
        </CardHeader>
        <CardContent className="custom-content">Contenido de la tarjeta</CardContent>
        <CardFooter className="custom-footer">Pie de la tarjeta</CardFooter>
      </Card>,
    );

    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('custom-card');

    expect(screen.getByRole('heading', { level: 3, name: 'Título de la Tarjeta' })).toHaveClass(
      'custom-title',
    );
    expect(screen.getByText('Descripción de la tarjeta')).toHaveClass('custom-desc');
    expect(screen.getByText('Contenido de la tarjeta')).toHaveClass('custom-content');
    expect(screen.getByText('Pie de la tarjeta')).toHaveClass('custom-footer');
  });
});

