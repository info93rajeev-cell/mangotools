export interface GstCategoryItem {
  id: string;
  icon: string;
  title: string;
  hsn: string;
  rate: number;
  cess: number;
  note: string;
  itcEligible: boolean;
}

export const POPULAR_GST_CATEGORIES: GstCategoryItem[] = [
  {
    id: 'it-software',
    icon: '💻',
    title: 'IT, Software, SaaS & Freelancing',
    hsn: 'SAC 9983',
    rate: 18,
    cess: 0,
    note: 'Standard rate for IT consulting, coding, and digital marketing. Full ITC eligible.',
    itcEligible: true,
  },
  {
    id: 'restaurant',
    icon: '🍽️',
    title: 'Restaurants & Food Catering',
    hsn: 'SAC 9963',
    rate: 5,
    cess: 0,
    note: 'Standalone AC/Non-AC eateries charge 5% flat. No Input Tax Credit (ITC) allowed.',
    itcEligible: false,
  },
  {
    id: 'garments',
    icon: '👕',
    title: 'Apparel & Readymade Clothing',
    hsn: 'HSN 61/62',
    rate: 5,
    cess: 0,
    note: '5% for items under ₹1,000; 12% for items above ₹1,000. Full ITC eligible.',
    itcEligible: true,
  },
  {
    id: 'electronics',
    icon: '📱',
    title: 'Electronics, Laptops & Mobile Phones',
    hsn: 'HSN 84/85',
    rate: 18,
    cess: 0,
    note: 'Laptops, mobile devices, monitors & printers. Full ITC eligible for business.',
    itcEligible: true,
  },
  {
    id: 'pharma',
    icon: '💊',
    title: 'Pharma & Essential Medicines',
    hsn: 'HSN 3004',
    rate: 12,
    cess: 0,
    note: 'Standard medicines 12%; life-saving critical drugs 5%. Exempt for generic health.',
    itcEligible: true,
  },
  {
    id: 'transport',
    icon: '🚚',
    title: 'Goods Transport Agency (GTA Freight)',
    hsn: 'SAC 9965',
    rate: 5,
    cess: 0,
    note: '5% under Reverse Charge (RCM) paid by recipient, or 12% forward charge with ITC.',
    itcEligible: true,
  },
  {
    id: 'commercial-rent',
    icon: '🏢',
    title: 'Commercial Property & Office Rent',
    hsn: 'SAC 9972',
    rate: 18,
    cess: 0,
    note: 'Commercial rent attracts 18% GST. Business tenant can claim full ITC.',
    itcEligible: true,
  },
  {
    id: 'luxury-auto',
    icon: '🚗',
    title: 'Automobiles & Luxury Goods',
    hsn: 'HSN 87',
    rate: 28,
    cess: 15,
    note: '28% GST + Compensation Cess (15%). ITC restricted under Sec 17(5) unless transport.',
    itcEligible: false,
  },
  {
    id: 'exempt-food',
    icon: '🌾',
    title: 'Unbranded Food Grains, Milk & Salt',
    hsn: 'HSN 04/10',
    rate: 0,
    cess: 0,
    note: 'Nil rate / 0% Exempt for unpackaged fresh farm produce, raw grains, and milk.',
    itcEligible: false,
  },
];
