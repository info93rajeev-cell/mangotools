import type { WorkingStep } from '@mangotools/core';
import {
  add,
  div,
  isZero,
  mul,
  type RoundingMode,
  sub,
  toFixedString,
} from '@mangotools/engine-numeric';
import type { GstOutput } from './schema.ts';

interface GstNumbers {
  amount: string;
  rate: string;
  mode: 'add' | 'remove';
  supply: 'intra' | 'inter';
  rounding: RoundingMode;
}

const money = (value: string, mode: RoundingMode) => toFixedString(value, 2, mode);

/** GST split per the method documented in README.md. All values are decimal strings. */
export function computeGst(n: GstNumbers): GstOutput {
  const r = (v: string) => money(v, n.rounding);
  const halfRate = div(n.rate, '2');
  const working: WorkingStep[] = [];
  let taxable: string;
  let cgst = '0.00';
  let sgst = '0.00';
  let igst = '0.00';
  let totalTax: string;
  let gross: string;

  if (n.mode === 'add') {
    taxable = r(n.amount);
    if (n.supply === 'intra') {
      cgst = r(div(mul(taxable, halfRate), '100'));
      sgst = cgst;
      working.push(step('cgst', 'gst.add.cgst', { taxable, halfRate }, cgst));
      working.push(step('sgst', 'gst.add.sgst', { taxable, halfRate }, sgst));
    } else {
      igst = r(div(mul(taxable, n.rate), '100'));
      working.push(step('igst', 'gst.add.igst', { taxable, rate: n.rate }, igst));
    }
    totalTax = r(add(add(cgst, sgst), igst));
    gross = r(add(taxable, totalTax));
    working.push(step('totalTax', `gst.total.${n.supply}`, { cgst, sgst, igst }, totalTax));
    working.push(step('grossAmount', 'gst.add.gross', { taxable, totalTax }, gross));
  } else {
    gross = r(n.amount);
    taxable = r(div(mul(gross, '100'), add('100', n.rate)));
    totalTax = r(sub(gross, taxable));
    working.push(step('taxableValue', 'gst.remove.taxable', { gross, rate: n.rate }, taxable));
    working.push(step('totalTax', 'gst.remove.totalTax', { gross, taxable }, totalTax));
    if (n.supply === 'intra') {
      cgst = r(div(totalTax, '2'));
      sgst = r(sub(totalTax, cgst));
      working.push(step('cgst', 'gst.remove.cgst', { totalTax }, cgst));
      working.push(step('sgst', 'gst.remove.sgst', { totalTax, cgst }, sgst));
    } else {
      igst = totalTax;
      working.push(step('igst', 'gst.remove.igst', { totalTax }, igst));
    }
  }
  const effectiveRate = isZero(taxable)
    ? '0.0000'
    : toFixedString(mul(div(totalTax, taxable), '100'), 4);
  return {
    taxableValue: taxable,
    cgst,
    sgst,
    igst,
    totalTax,
    grossAmount: gross,
    effectiveRate,
    working,
  };
}

function step(
  ref: string,
  formulaKey: string,
  variables: Record<string, string>,
  result: string,
): WorkingStep {
  return { ref, formulaKey, variables, result };
}
