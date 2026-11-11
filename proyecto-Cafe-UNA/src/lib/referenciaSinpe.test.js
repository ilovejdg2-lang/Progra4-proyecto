import { describe, expect, it } from 'vitest';
import { referenciaSinpeCompra } from './referenciaSinpe';

describe('referenciaSinpeCompra', () => {
  it('usa el id numérico de la compra', () => {
    expect(referenciaSinpeCompra({ id: 42 })).toBe('caféUNA42');
  });

  it('acepta Id en PascalCase', () => {
    expect(referenciaSinpeCompra({ Id: '7' })).toBe('caféUNA7');
  });

  it('no usa el Numero con timestamp', () => {
    expect(referenciaSinpeCompra({ numero: 'C-1731345678901-456' })).toBe('');
  });

  it('devuelve vacío sin id válido', () => {
    expect(referenciaSinpeCompra(null)).toBe('');
    expect(referenciaSinpeCompra({})).toBe('');
    expect(referenciaSinpeCompra({ id: '0' })).toBe('');
  });
});
