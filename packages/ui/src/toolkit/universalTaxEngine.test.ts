import { describe, expect, it } from 'vitest';
import { calculateUniversalTax, formatCurrencyNumber } from './universalTaxEngine';
import type { UniversalTaxInputParams } from './universalTaxTypes';

describe('Universal Tax Engine', () => {
  it('calculates India intra-state GST correctly with CGST and SGST split', () => {
    const params: UniversalTaxInputParams = {
      country: 'in',
      taxSystem: 'gst',
      priceMode: 'exclusive',
      amount: 1000,
      quantity: 1,
      discountType: 'currency',
      discountValue: 0,
      shippingCharges: 0,
      supplyType: 'intra',
      gstRate: 18,
      cessRate: 0,
      isComposition: false,
      selectedStateIndex: 0,
      localTaxRate: 0,
      taxSlabs: [],
    };

    const res = calculateUniversalTax(params);
    expect(res.taxableAmount).toBe(1000);
    expect(res.totalTax).toBe(180);
    expect(res.finalAmount).toBe(1180);
    expect(res.components).toHaveLength(2);
    expect(res.components[0].name).toContain('CGST @ 9%');
    expect(res.components[0].amount).toBe(90);
    expect(res.components[1].name).toContain('SGST @ 9%');
    expect(res.components[1].amount).toBe(90);
  });

  it('calculates India inter-state GST with IGST', () => {
    const params: UniversalTaxInputParams = {
      country: 'in',
      taxSystem: 'gst',
      priceMode: 'exclusive',
      amount: 2000,
      quantity: 1,
      discountType: 'currency',
      discountValue: 0,
      shippingCharges: 100,
      supplyType: 'inter',
      gstRate: 12,
      cessRate: 0,
      isComposition: false,
      selectedStateIndex: 0,
      localTaxRate: 0,
      taxSlabs: [],
    };

    const res = calculateUniversalTax(params);
    // 2000 + 100 shipping = 2100 taxable
    expect(res.taxableAmount).toBe(2100);
    // 12% of 2100 = 252
    expect(res.totalTax).toBe(252);
    expect(res.finalAmount).toBe(2352);
    expect(res.components[0].name).toContain('IGST @ 12%');
    expect(res.components[0].amount).toBe(252);
  });

  it('calculates inclusive tax (reverse calculation)', () => {
    const params: UniversalTaxInputParams = {
      country: 'in',
      taxSystem: 'gst',
      priceMode: 'inclusive',
      amount: 1180,
      quantity: 1,
      discountType: 'currency',
      discountValue: 0,
      shippingCharges: 0,
      supplyType: 'intra',
      gstRate: 18,
      cessRate: 0,
      isComposition: false,
      selectedStateIndex: 0,
      localTaxRate: 0,
      taxSlabs: [],
    };

    const res = calculateUniversalTax(params);
    expect(res.finalAmount).toBe(1180);
    expect(res.taxableAmount).toBe(1000);
    expect(res.totalTax).toBe(180);
  });

  it('calculates US state and local sales tax', () => {
    const params: UniversalTaxInputParams = {
      country: 'us',
      taxSystem: 'sales_tax',
      priceMode: 'exclusive',
      amount: 500,
      quantity: 2, // 1000 raw subtotal
      discountType: 'percent',
      discountValue: 10, // 100 discount -> 900 net
      shippingCharges: 50, // 950 taxable
      supplyType: 'intra',
      gstRate: 0,
      cessRate: 0,
      isComposition: false,
      selectedStateIndex: 0, // California 7.25%
      localTaxRate: 2.0, // 2% local
      taxSlabs: [],
    };

    const res = calculateUniversalTax(params);
    expect(res.rawSubtotal).toBe(1000);
    expect(res.discountAmount).toBe(100);
    expect(res.taxableAmount).toBe(950);
    // 9.25% total tax on 950 = 87.875 -> 87.88
    expect(res.totalTax).toBe(87.88);
    expect(res.finalAmount).toBe(1037.88);
    expect(res.components).toHaveLength(2);
    expect(res.components[0].name).toContain('California');
    expect(res.components[1].name).toContain('Local / City Tax');
  });

  it('evaluates progressive custom tax slabs', () => {
    const params: UniversalTaxInputParams = {
      country: 'custom',
      taxSystem: 'custom_slabs',
      priceMode: 'exclusive',
      amount: 100000,
      quantity: 1,
      discountType: 'currency',
      discountValue: 0,
      shippingCharges: 0,
      supplyType: 'intra',
      gstRate: 0,
      cessRate: 0,
      isComposition: false,
      selectedStateIndex: 0,
      localTaxRate: 0,
      taxSlabs: [
        { id: '1', minAmount: 0, maxAmount: 50000, rate: 5, taxType: 'VAT', notes: 'Tier 1' },
        { id: '2', minAmount: 50000, maxAmount: 150000, rate: 10, taxType: 'VAT', notes: 'Tier 2' },
      ],
    };

    const res = calculateUniversalTax(params);
    // Slab 1: 50,000 * 5% = 2,500
    // Slab 2: 50,000 * 10% = 5,000
    // Total = 7,500
    expect(res.taxableAmount).toBe(100000);
    expect(res.totalTax).toBe(7500);
    expect(res.finalAmount).toBe(107500);
    expect(res.effectiveRate).toBe(7.5);
  });

  it('formats Indian and Western currency numbers correctly', () => {
    expect(formatCurrencyNumber(1234567.89, '₹')).toBe('₹ 12,34,567.89');
    expect(formatCurrencyNumber(1234567.89, '$')).toBe('$ 1,234,567.89');
  });
});
