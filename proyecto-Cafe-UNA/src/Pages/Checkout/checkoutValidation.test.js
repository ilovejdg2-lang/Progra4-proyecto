import { describe, expect, it, vi } from 'vitest';
import {
  confirmarCompraEnBackend,
  MAX_COMPROBANTE_BYTES,
  validarComprobante,
} from './checkoutValidation';

describe('checkout comprobante flow', () => {
  it('accepts supported image types within the size limit', () => {
    expect(validarComprobante(new File(['receipt'], 'receipt.png', { type: 'image/png' }))).toBeNull();
  });

  it('rejects unsupported file types', () => {
    expect(validarComprobante(new File(['receipt'], 'receipt.pdf', { type: 'application/pdf' }))).toBe(
      'El comprobante debe ser una imagen JPG, PNG o WEBP.',
    );
  });

  it('rejects files larger than 10 MB', () => {
    const file = new File([new Uint8Array(MAX_COMPROBANTE_BYTES + 1)], 'receipt.png', {
      type: 'image/png',
    });
    expect(validarComprobante(file)).toBe('El comprobante debe pesar máximo 10 MB.');
  });

  it('propagates backend failures instead of treating the order as local success', async () => {
    const failure = new Error('backend unavailable');
    const registrarCompraFn = vi.fn().mockRejectedValue(failure);

    await expect(
      confirmarCompraEnBackend({ registrarCompraFn, payload: { items: [] }, archivo: null }),
    ).rejects.toBe(failure);
  });

  it('returns the backend purchase when registration succeeds', async () => {
    const purchase = { id: 'purchase-1' };
    const registrarCompraFn = vi.fn().mockResolvedValue(purchase);

    await expect(
      confirmarCompraEnBackend({ registrarCompraFn, payload: { items: [] }, archivo: null }),
    ).resolves.toBe(purchase);
  });
});
