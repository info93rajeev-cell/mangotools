import {
  COUNTRIES,
  type CountryProfile,
  type DiscountType,
  type TaxComponentBreakdown,
  type TaxSlab,
  type UniversalTaxCalculationResult,
  type UniversalTaxInputParams,
} from './universalTaxTypes';

export * from './universalTaxTypes';

function computeDiscountAndNet(
  amount: number,
  qty: number,
  discountType: DiscountType,
  discountVal: number,
) {
  const safeQty = Math.max(1, qty || 1);
  const rawSubtotal = Math.max(0, (amount || 0) * safeQty);
  let discountAmount = 0;
  if (discountType === 'percent') {
    discountAmount = (rawSubtotal * Math.min(100, Math.max(0, discountVal || 0))) / 100;
  } else {
    discountAmount = Math.min(rawSubtotal, Math.max(0, discountVal || 0));
  }
  const netAmount = Math.max(0, rawSubtotal - discountAmount);
  return { rawSubtotal, discountAmount, netAmount };
}

function resolveTotalRate(params: UniversalTaxInputParams, profile: CountryProfile): number {
  if (params.country === 'in') {
    return params.isComposition ? 1.0 : params.gstRate + params.cessRate;
  }
  if (params.country === 'us') {
    const stateObj = profile.subdivisions?.[params.selectedStateIndex] ?? profile.subdivisions?.[0];
    const stateRate = stateObj?.rate ?? profile.defaultRate;
    return stateRate + Math.max(0, params.localTaxRate || 0);
  }
  return params.gstRate || profile.defaultRate;
}

function computeCustomSlabsTax(baseVal: number, slabs: TaxSlab[]) {
  let accumulatedTax = 0;
  const components: TaxComponentBreakdown[] = [];
  for (const slab of slabs) {
    if (slab.minAmount > baseVal) continue;
    const upper = slab.maxAmount !== null ? Math.min(baseVal, slab.maxAmount) : baseVal;
    const taxablePortion = Math.max(0, upper - slab.minAmount);
    const slabTax = (taxablePortion * slab.rate) / 100;
    accumulatedTax += slabTax;
    if (slabTax > 0) {
      components.push({
        name: `${slab.taxType} @ ${slab.rate}% (${slab.notes || `Slab ${slab.minAmount}-${upper}`})`,
        rate: slab.rate,
        amount: Math.round(slabTax * 100) / 100,
        percentage: 0,
        color: '#7c3aed',
      });
    }
  }
  return { totalTax: accumulatedTax, components };
}

function buildIndiaComponents(params: UniversalTaxInputParams, taxable: number, totalTax: number) {
  const cessRate = params.isComposition ? 0 : params.cessRate;
  const baseGstRate = params.isComposition ? 1.0 : params.gstRate;
  const cessAmount = (taxable * cessRate) / 100;
  const gstAmount = totalTax - cessAmount;
  const comps: TaxComponentBreakdown[] = [];

  if (params.supplyType === 'intra') {
    const halfGst = gstAmount / 2;
    comps.push({
      name: `CGST @ ${baseGstRate / 2}%`,
      rate: baseGstRate / 2,
      amount: Math.round(halfGst * 100) / 100,
      percentage: totalTax > 0 ? (halfGst / totalTax) * 100 : 50,
      color: '#2563eb',
    });
    comps.push({
      name: `SGST @ ${baseGstRate / 2}%`,
      rate: baseGstRate / 2,
      amount: Math.round(halfGst * 100) / 100,
      percentage: totalTax > 0 ? (halfGst / totalTax) * 100 : 50,
      color: '#9333ea',
    });
  } else {
    comps.push({
      name: `IGST @ ${baseGstRate}%`,
      rate: baseGstRate,
      amount: Math.round(gstAmount * 100) / 100,
      percentage: totalTax > 0 ? (gstAmount / totalTax) * 100 : 100,
      color: '#2563eb',
    });
  }
  if (cessAmount > 0) {
    comps.push({
      name: `CESS @ ${cessRate}%`,
      rate: cessRate,
      amount: Math.round(cessAmount * 100) / 100,
      percentage: totalTax > 0 ? (cessAmount / totalTax) * 100 : 0,
      color: '#ec4899',
    });
  }
  return comps;
}

function buildUsComponents(
  params: UniversalTaxInputParams,
  profile: CountryProfile,
  taxable: number,
  totalTax: number,
) {
  const stateObj = profile.subdivisions?.[params.selectedStateIndex] ?? profile.subdivisions?.[0];
  const stateRate = stateObj?.rate ?? profile.defaultRate;
  const localRate = Math.max(0, params.localTaxRate || 0);
  const stateTax = (taxable * stateRate) / 100;
  const localTax = (taxable * localRate) / 100;
  const comps: TaxComponentBreakdown[] = [
    {
      name: `State Sales Tax (${stateObj?.name ?? 'State'} @ ${stateRate}%)`,
      rate: stateRate,
      amount: Math.round(stateTax * 100) / 100,
      percentage: totalTax > 0 ? (stateTax / totalTax) * 100 : 100,
      color: '#2563eb',
    },
  ];
  if (localRate > 0) {
    comps.push({
      name: `Local / City Tax @ ${localRate}%`,
      rate: localRate,
      amount: Math.round(localTax * 100) / 100,
      percentage: totalTax > 0 ? (localTax / totalTax) * 100 : 0,
      color: '#059669',
    });
  }
  return comps;
}

function calculateFlatTaxMode(
  params: UniversalTaxInputParams,
  profile: CountryProfile,
  netAmount: number,
  shipping: number,
) {
  const totalRate = resolveTotalRate(params, profile);
  const isExclusive = params.priceMode === 'exclusive';
  const totalEntered = netAmount + shipping;
  const taxableAmount = isExclusive ? totalEntered : totalEntered / (1 + totalRate / 100);
  const totalTax = isExclusive ? (taxableAmount * totalRate) / 100 : totalEntered - taxableAmount;
  const finalAmount = isExclusive ? taxableAmount + totalTax : totalEntered;

  let components: TaxComponentBreakdown[] = [];
  if (params.country === 'in') {
    components = buildIndiaComponents(params, taxableAmount, totalTax);
  } else if (params.country === 'us') {
    components = buildUsComponents(params, profile, taxableAmount, totalTax);
  } else {
    components = [
      {
        name: `${profile.defaultTaxSystem.toUpperCase()} @ ${totalRate}%`,
        rate: totalRate,
        amount: Math.round(totalTax * 100) / 100,
        percentage: 100,
        color: '#2563eb',
      },
    ];
  }

  normalizeComponentPercentages(components);
  const sym = profile.currencySymbol;
  const formulaNote = isExclusive
    ? `Exclusive: Final = Taxable (${sym}${taxableAmount.toFixed(2)}) + Tax (${totalRate}% = ${sym}${totalTax.toFixed(2)})`
    : `Inclusive: Taxable Base = Total (${sym}${finalAmount.toFixed(2)}) ÷ (1 + ${totalRate}/100) = ${sym}${taxableAmount.toFixed(2)}`;

  return { taxableAmount, totalTax, finalAmount, components, formulaNote };
}

export function calculateUniversalTax(
  params: UniversalTaxInputParams,
): UniversalTaxCalculationResult {
  const profile = COUNTRIES.find((c) => c.id === params.country) ?? COUNTRIES[0];
  const { rawSubtotal, discountAmount, netAmount } = computeDiscountAndNet(
    params.amount,
    params.quantity,
    params.discountType,
    params.discountValue,
  );
  const shipping = Math.max(0, params.shippingCharges || 0);

  if (params.taxSystem === 'custom_slabs' && params.taxSlabs.length > 0) {
    const taxableAmount = netAmount + shipping;
    const { totalTax, components } = computeCustomSlabsTax(taxableAmount, params.taxSlabs);
    normalizeComponentPercentages(components);
    const effectiveRate =
      taxableAmount > 0 ? Math.round((totalTax / taxableAmount) * 10000) / 100 : 0;
    return {
      currencySymbol: profile.currencySymbol,
      rawSubtotal: Math.round(rawSubtotal * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      shippingCharges: Math.round(shipping * 100) / 100,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      finalAmount: Math.round((taxableAmount + totalTax) * 100) / 100,
      effectiveRate,
      components,
      savings: Math.round(discountAmount * 100) / 100,
      formulaNote: `Custom Slabs Progressive Formula: evaluated across ${params.taxSlabs.length} tax brackets.`,
    };
  }

  const flat = calculateFlatTaxMode(params, profile, netAmount, shipping);
  const effectiveRate =
    flat.taxableAmount > 0 ? Math.round((flat.totalTax / flat.taxableAmount) * 10000) / 100 : 0;

  return {
    currencySymbol: profile.currencySymbol,
    rawSubtotal: Math.round(rawSubtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    shippingCharges: Math.round(shipping * 100) / 100,
    taxableAmount: Math.round(flat.taxableAmount * 100) / 100,
    totalTax: Math.round(flat.totalTax * 100) / 100,
    finalAmount: Math.round(flat.finalAmount * 100) / 100,
    effectiveRate,
    components: flat.components,
    savings: Math.round(discountAmount * 100) / 100,
    formulaNote: flat.formulaNote,
  };
}

function normalizeComponentPercentages(components: TaxComponentBreakdown[]) {
  const sumAmounts = components.reduce((acc, c) => acc + c.amount, 0) || 1;
  for (const c of components) {
    c.percentage = Math.round((c.amount / sumAmounts) * 100);
  }
}

export function formatCurrencyNumber(num: number, symbol: string): string {
  const parts = num.toFixed(2).split('.');
  const intPart = parts[0];
  const decPart = parts[1];
  let formattedInt = '';
  if (symbol === '₹') {
    const last3 = intPart.slice(-3);
    const other = intPart.slice(0, -3);
    formattedInt = other !== '' ? `${other.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}` : last3;
  } else {
    formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  return `${symbol} ${formattedInt}.${decPart}`;
}
