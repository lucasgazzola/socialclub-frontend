import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import QRCodeLib from 'qrcode';
import { QRCode } from './QRCode';

vi.mock('qrcode', () => ({
  default: {
    toCanvas: vi.fn(),
  },
}));

describe('QRCode', () => {
  it('renderiza canvas con aria-label y llama a QRCodeLib.toCanvas', () => {
    render(<QRCode value="test-token-123" size={200} className="custom-qr" />);

    const canvas = screen.getByLabelText('QR: test-token-123');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveClass('custom-qr');

    expect(QRCodeLib.toCanvas).toHaveBeenCalledWith(
      canvas,
      'test-token-123',
      expect.objectContaining({
        width: 200,
        margin: 1,
        errorCorrectionLevel: 'M',
      }),
    );
  });
});

