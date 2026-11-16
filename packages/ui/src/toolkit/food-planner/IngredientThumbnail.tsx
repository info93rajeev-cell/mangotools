import styles from './foodPlanner.module.css';
import { getDistinctIngredientVisual } from './ingredientIconsRegistry.ts';

interface IngredientThumbnailProps {
  id: string;
  name: string;
  aisle?: string;
  size?: number;
  className?: string;
}

export function IngredientThumbnail({
  id,
  name,
  aisle = 'other',
  size = 32,
  className,
}: IngredientThumbnailProps) {
  const visual = getDistinctIngredientVisual(id, name, aisle);

  return (
    <div
      role="img"
      class={className || styles.tableThumb}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        borderRadius: '6px',
        background: visual.bg,
        color: visual.color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${Math.round(size * 0.54)}px`,
        lineHeight: 1,
        userSelect: 'none',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
        flexShrink: 0,
      }}
      title={`${name} (${aisle})`}
      aria-label={name}
    >
      <span aria-hidden="true">{visual.icon}</span>
    </div>
  );
}
