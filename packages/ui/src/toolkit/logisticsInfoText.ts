import type { LogisticsInfo } from './LogisticsInfoCards.tsx';

/** Notes, next steps, FAQ and related tools for the Pallet Loading and Volumetric Weight pages. */

export const palletInfo: LogisticsInfo = {
  notes: [
    'The plan is a simple grid fit: every layer uses the same carton orientation, with turned cartons only in a leftover strip.',
    'The pallet is counted as 25 kg and 14.4 cm high. Check your own pallet and change the height limit if it differs.',
    'Carton strength is not checked. Make sure the bottom layer can carry the layers above it.',
    'Overhang is not allowed: cartons stay within the pallet length and width.',
    'Carriers and warehouses set their own limits for pallet height and weight. Confirm them before shipping.',
  ],
  nextSteps: [
    { href: '/container-loading-calculator', label: 'See how many pallets fit in a container' },
    { href: '/cbm-calculator', label: 'Work out the shipment volume (CBM)' },
    {
      href: '/volumetric-weight-calculator',
      label: 'Check the chargeable weight for air or courier',
    },
  ],
  faq: [
    {
      q: 'Why is the space used below 100%?',
      a: 'Cartons rarely divide the pallet exactly. The gap left along the length and width, and above the top layer, is unused space.',
    },
    {
      q: 'What does Max stack layers do?',
      a: 'It caps the number of layers. On Auto, layers are added until the next one would pass the height limit.',
    },
    {
      q: 'Is the gross weight exact?',
      a: 'It is the carton weight you entered times the number of cartons, plus a 25 kg pallet. Wrapping and labels are not included.',
    },
  ],
  related: [
    { href: '/container-loading-calculator', label: 'Container Loading Calculator' },
    { href: '/cbm-calculator', label: 'CBM Calculator' },
    { href: '/volumetric-weight-calculator', label: 'Volumetric Weight Calculator' },
  ],
};

export const volumetricInfo: LogisticsInfo = {
  notes: [
    'Each carrier sets its own divisor. Use the one in your rate card; 6000 (air, IATA) and 5000 (courier) are only common values.',
    'Some carriers round each dimension up to the next whole centimetre before calculating. Round your sizes the same way if yours does.',
    'Measure the outer size of the packed carton, including any bulge.',
    'Chargeable weight here is for the whole shipment. A few carriers compare actual and volumetric weight per piece instead.',
    'Rates, fuel and other surcharges are not included. Use the cost estimate with your own rate.',
  ],
  nextSteps: [
    { href: '/cbm-calculator', label: 'Work out the shipment volume (CBM) for sea freight' },
    { href: '/pallet-loading-calculator', label: 'Plan how the cartons sit on a pallet' },
    { href: '/container-loading-calculator', label: 'Check how much fits in a container' },
  ],
  faq: [
    {
      q: 'What is chargeable weight?',
      a: 'The higher of the actual weight and the volumetric weight. Carriers bill on it so light but bulky parcels pay for the space they take.',
    },
    {
      q: 'How is volumetric weight worked out?',
      a: 'Length × width × height in cm, times quantity, divided by the divisor. For example 60 × 40 × 40 ÷ 6000 = 16 kg.',
    },
    {
      q: 'Why are my two weights so different?',
      a: 'Light goods in large boxes have a high volumetric weight. Dense goods in small boxes have a high actual weight.',
    },
  ],
  related: [
    { href: '/cbm-calculator', label: 'CBM Calculator' },
    { href: '/pallet-loading-calculator', label: 'Pallet Loading Calculator' },
    { href: '/container-loading-calculator', label: 'Container Loading Calculator' },
  ],
};
