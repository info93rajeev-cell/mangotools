import { useState } from 'preact/hooks';
import styles from './foodPlanner.module.css';

interface IngredientThumbnailProps {
  id: string;
  name: string;
  aisle?: string;
  size?: number;
  className?: string;
}

const DISTINCT_INGREDIENT_ICONS: Record<string, { icon: string; bg: string; color: string }> = {
  // Grains & Flours
  'basmati-rice': { icon: '🍚', bg: '#f8fafc', color: '#334155' },
  rice: { icon: '🍚', bg: '#f8fafc', color: '#334155' },
  besan: { icon: '🥣', bg: '#fef9c3', color: '#854d0e' },
  maida: { icon: '🌾', bg: '#fefce8', color: '#713f12' },
  atta: { icon: '🌾', bg: '#fef3c7', color: '#78350f' },
  semolina: { icon: '🌾', bg: '#fef9c3', color: '#854d0e' },
  poha: { icon: '🥣', bg: '#fefce8', color: '#854d0e' },
  noodles: { icon: '🍜', bg: '#fff7ed', color: '#9a3412' },
  bread: { icon: '🍞', bg: '#ffedd5', color: '#9a3412' },

  // Spices & Condiments
  amchur: { icon: '🥭', bg: '#fef08a', color: '#713f12' },
  'dry-mango-powder': { icon: '🥭', bg: '#fef08a', color: '#713f12' },
  asafoetida: { icon: '🌿', bg: '#f0fdf4', color: '#166534' },
  'bay-leaf': { icon: '🍃', bg: '#ecfdf5', color: '#047857' },
  cardamom: { icon: '🟢', bg: '#dcfce7', color: '#15803d' },
  cloves: { icon: '🌰', bg: '#fef3c7', color: '#78350f' },
  cinnamon: { icon: '🪵', bg: '#fef2f2', color: '#991b1b' },
  dalchini: { icon: '🪵', bg: '#fef2f2', color: '#991b1b' },
  'black-pepper': { icon: '🔘', bg: '#f1f5f9', color: '#0f172a' },
  'cumin-seeds': { icon: '🟤', bg: '#fef3c7', color: '#78350f' },
  'coriander-seeds': { icon: '🟡', bg: '#fef9c3', color: '#854d0e' },
  'coriander-powder': { icon: '🧂', bg: '#fefce8', color: '#854d0e' },
  'coriander-leaves': { icon: '🌿', bg: '#dcfce7', color: '#15803d' },
  turmeric: { icon: '🟡', bg: '#fef08a', color: '#854d0e' },
  'red-chilli-powder': { icon: '🌶️', bg: '#fee2e2', color: '#b91c1c' },
  'fresh-green-chillies': { icon: '🌶️', bg: '#dcfce7', color: '#15803d' },
  'garam-masala': { icon: '🫙', bg: '#fef3c7', color: '#78350f' },
  mustard: { icon: '🟡', bg: '#fef9c3', color: '#854d0e' },
  'mustard-seeds': { icon: '🟡', bg: '#fef9c3', color: '#854d0e' },
  ajwain: { icon: '🟤', bg: '#fef3c7', color: '#78350f' },
  fennel: { icon: '🟢', bg: '#dcfce7', color: '#15803d' },
  fenugreek: { icon: '🌿', bg: '#ecfdf5', color: '#047857' },
  kasuri_methi: { icon: '🌿', bg: '#ecfdf5', color: '#047857' },
  'curry-leaves': { icon: '🍃', bg: '#ecfdf5', color: '#047857' },
  'fresh-mint': { icon: '🌱', bg: '#dcfce7', color: '#15803d' },
  saffron: { icon: '🏵️', bg: '#fff7ed', color: '#c2410c' },
  nutmeg: { icon: '🌰', bg: '#fef3c7', color: '#78350f' },

  // Vegetables & Produce
  ginger: { icon: '🫚', bg: '#fef3c7', color: '#78350f' },
  adrak: { icon: '🫚', bg: '#fef3c7', color: '#78350f' },
  garlic: { icon: '🧄', bg: '#f8fafc', color: '#475569' },
  onion: { icon: '🧅', bg: '#fae8ff', color: '#86198f' },
  potato: { icon: '🥔', bg: '#fef3c7', color: '#78350f' },
  tomato: { icon: '🍅', bg: '#fee2e2', color: '#dc2626' },
  cauliflower: { icon: '🥦', bg: '#f0fdf4', color: '#166534' },
  'green-peas': { icon: '🟢', bg: '#dcfce7', color: '#15803d' },
  spinach: { icon: '🥬', bg: '#dcfce7', color: '#15803d' },
  bell_pepper: { icon: '🫑', bg: '#dcfce7', color: '#15803d' },
  capsicum: { icon: '🫑', bg: '#dcfce7', color: '#15803d' },
  carrot: { icon: '🥕', bg: '#ffedd5', color: '#ea580c' },
  cucumber: { icon: '🥒', bg: '#ecfdf5', color: '#047857' },
  lemon: { icon: '🍋', bg: '#fef9c3', color: '#854d0e' },
  lime: { icon: '🍋', bg: '#ecfdf5', color: '#166534' },
  mushroom: { icon: '🍄', bg: '#fef3c7', color: '#78350f' },
  coconut: { icon: '🥥', bg: '#f8fafc', color: '#475569' },

  // Dairy & Fats
  paneer: { icon: '🧀', bg: '#fefce8', color: '#854d0e' },
  'curd-yogurt': { icon: '🥣', bg: '#eff6ff', color: '#1d4ed8' },
  milk: { icon: '🥛', bg: '#eff6ff', color: '#1d4ed8' },
  butter: { icon: '🧈', bg: '#fef9c3', color: '#854d0e' },
  ghee: { icon: '🧈', bg: '#fef08a', color: '#713f12' },
  'cooking-oil': { icon: '🫒', bg: '#fef9c3', color: '#713f12' },
  'mustard-oil': { icon: '🫒', bg: '#fef08a', color: '#713f12' },
  cream: { icon: '🥛', bg: '#eff6ff', color: '#1d4ed8' },
  cheese: { icon: '🧀', bg: '#fef9c3', color: '#854d0e' },

  // Pulses & Legumes
  chickpeas: { icon: '🫘', bg: '#fef3c7', color: '#78350f' },
  'kidney-beans': { icon: '🫘', bg: '#fee2e2', color: '#991b1b' },
  'toor-dal': { icon: '🫘', bg: '#fef08a', color: '#854d0e' },
  'chana-dal': { icon: '🫘', bg: '#fef9c3', color: '#854d0e' },
  'moong-dal': { icon: '🫘', bg: '#fef08a', color: '#854d0e' },
  'urad-dal': { icon: '🫘', bg: '#f8fafc', color: '#334155' },

  // Dry Goods, Nuts & Sweeteners
  cashew: { icon: '🥜', bg: '#fef9c3', color: '#713f12' },
  almond: { icon: '🥜', bg: '#ffedd5', color: '#9a3412' },
  pistachio: { icon: '🥜', bg: '#ecfdf5', color: '#166534' },
  raisins: { icon: '🍇', bg: '#fae8ff', color: '#86198f' },
  sugar: { icon: '🍬', bg: '#f8fafc', color: '#334155' },
  jaggery: { icon: '🍯', bg: '#fef3c7', color: '#78350f' },
  salt: { icon: '🧂', bg: '#f8fafc', color: '#334155' },
  'baking-soda': { icon: '🧪', bg: '#f0fdf4', color: '#166534' },

  // Non-Veg
  chicken: { icon: '🍗', bg: '#ffe4e6', color: '#9f1239' },
  mutton: { icon: '🥩', bg: '#ffe4e6', color: '#9f1239' },
  fish: { icon: '🐟', bg: '#e0f2fe', color: '#075985' },
  prawns: { icon: '🦐', bg: '#ffedd5', color: '#c2410c' },
  egg: { icon: '🥚', bg: '#fef9c3', color: '#713f12' },
};

const AISLE_ICONS: Record<string, { icon: string; bg: string; color: string }> = {
  produce: { icon: '🥬', bg: '#ecfdf5', color: '#166534' },
  spices: { icon: '🫙', bg: '#fef3c7', color: '#854d0e' },
  'dry-goods': { icon: '🌾', bg: '#fef9c3', color: '#713f12' },
  grains: { icon: '🌾', bg: '#fef9c3', color: '#713f12' },
  dairy: { icon: '🥛', bg: '#dbeafe', color: '#1e40af' },
  'oil-ghee': { icon: '🫒', bg: '#fef08a', color: '#713f12' },
  bakery: { icon: '🍞', bg: '#ffedd5', color: '#9a3412' },
  meat: { icon: '🍗', bg: '#ffe4e6', color: '#9f1239' },
  seafood: { icon: '🐟', bg: '#e0f2fe', color: '#075985' },
  other: { icon: '🍽️', bg: '#f1f5f9', color: '#475569' },
};

export function IngredientThumbnail({
  id,
  name,
  aisle = 'other',
  size = 32,
  className,
}: IngredientThumbnailProps) {
  const [hasError, setHasError] = useState(false);
  const info =
    DISTINCT_INGREDIENT_ICONS[id] ??
    DISTINCT_INGREDIENT_ICONS[id.toLowerCase()] ??
    AISLE_ICONS[aisle] ??
    AISLE_ICONS.other;

  if (hasError) {
    return (
      <div
        class={className || styles.tableThumb}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          borderRadius: '6px',
          background: info.bg,
          color: info.color,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${Math.round(size * 0.52)}px`,
          lineHeight: 1,
          userSelect: 'none',
        }}
        title={`${name} (${aisle})`}
      >
        <span aria-hidden="true">{info.icon}</span>
      </div>
    );
  }

  return (
    <img
      src={`/food/ingredients/${id}.svg`}
      alt={name}
      class={className || styles.tableThumb}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        borderRadius: '6px',
        objectFit: 'contain',
        background: '#f8fafc',
      }}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}
