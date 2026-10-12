import { describe, expect, it } from 'vitest';
import { initialState, isDemoState, totals, referenceFor, money } from '@/lib/demo-data';
describe('FLOW MASTER demo data', () => {
  it('preloads realistic demo documents and validates saved state', () => {
    const state = initialState();
    expect(state.documents).toHaveLength(10);
    expect(isDemoState(JSON.parse(JSON.stringify(state)))).toBe(true);
    expect(new Set(state.documents.map(d => d.status)).size).toBe(5);
    expect(isDemoState({ version: 1, documents: [{}], events: [] })).toBe(false);
  });
  it('calculates mixed VAT and quantities consistently', () => {
    const state = initialState(); const line = state.documents[0]?.lines[0];
    if (!line) throw new Error('Missing seed line');
    const result = totals([{ ...line, quantity: 2, price: 10000, vat: 19 }, { ...line, quantity: 3, price: 1000, vat: 9 }]);
    expect(result).toEqual({ subtotal: 23000, vat: 4070, total: 27070 });
    expect(money(result.total)).toBe('27 070 DA');
  });
  it('generates unique references by type', () => {
    const state = initialState();
    expect(referenceFor('Devis', state.documents)).toBe('DEV-2026-025');
    expect(referenceFor('Facture', state.documents)).toBe('FAC-2026-019');
    expect(referenceFor('Bon de livraison', state.documents)).toBe('BL-2026-013');
  });
});