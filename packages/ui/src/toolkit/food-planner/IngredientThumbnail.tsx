import { useState } from 'preact/hooks';
import styles from './foodPlanner.module.css';

interface IngredientThumbnailProps {
  id: string;
  name: string;
  aisle?: string;
  size?: number;
  className?: string;
}

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
  const info = AISLE_ICONS[aisle] ?? AISLE_ICONS.other;

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
