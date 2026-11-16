import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClubLogo } from './ClubLogo';

describe('ClubLogo', () => {
  it('renderiza la imagen del logo con su texto alternativo y tamaño por defecto', () => {
    render(<ClubLogo />);

    const img = screen.getByAltText('Logo SocialClub');
    expect(img).toBeInTheDocument();
  });

  it('aplica tamaño y clases personalizadas', () => {
    const { container } = render(<ClubLogo size={50} className="mi-clase-logo" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('mi-clase-logo');
    expect(wrapper).toHaveStyle({ width: '50px', height: '50px' });
  });
});

