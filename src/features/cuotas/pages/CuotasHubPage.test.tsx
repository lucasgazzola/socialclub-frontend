import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CuotasHubPage } from './CuotasHubPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CuotasHubPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderComponent() {
    return render(
      <MemoryRouter>
        <CuotasHubPage />
      </MemoryRouter>,
    );
  }

  it('renderiza las opciones de cuota social y cuota deportiva', () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: /^Cuotas$/i })).toBeInTheDocument();
    expect(screen.getByText('Cuota social')).toBeInTheDocument();
    expect(screen.getByText('Cuota deportiva')).toBeInTheDocument();
  });

  it('navega a cuota social al hacer click o presionar Enter', async () => {
    const user = userEvent.setup();
    renderComponent();

    const cuotaSocialCard = screen.getByText('Cuota social').closest('[role="button"]')!;
    await user.click(cuotaSocialCard);
    expect(mockNavigate).toHaveBeenCalledWith('/cuotas/social');

    await user.keyboard('{Enter}');
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('navega a cuota deportiva al hacer click', async () => {
    const user = userEvent.setup();
    renderComponent();

    const cuotaDeportivaCard = screen.getByText('Cuota deportiva').closest('[role="button"]')!;
    await user.click(cuotaDeportivaCard);
    expect(mockNavigate).toHaveBeenCalledWith('/cuotas/deportiva');
  });
});

