import { Icon } from '../../primitives/Icon.tsx';
import styles from './foodPlanner.module.css';
import { type ExtendedFoodRecipe, getRecipeVerificationInfo } from './foodReferenceData.ts';

export function SelectedMenuRow({
  recipe,
  idx,
  guests,
  factor,
  onSetPortion,
  onRemove,
  onView,
}: {
  recipe: ExtendedFoodRecipe;
  idx: number;
  guests: number;
  factor: number;
  onSetPortion: (id: string, factor: number) => void;
  onRemove: (id: string) => void;
  onView: (recipe: ExtendedFoodRecipe) => void;
}) {
  const plannedServings = Math.round(guests * factor);
  const verInfo = getRecipeVerificationInfo(recipe);

  return (
    <tr>
      <td>{idx + 1}</td>
      <td>
        <div class={styles.tableItemWithThumb}>
          <button
            type="button"
            class={styles.tableThumbBtn}
            onClick={() => onView(recipe)}
            title={`Inspect ${recipe.name}`}
            aria-label={`Inspect ${recipe.name}`}
          >
            <img
              src={recipe.thumbnailUrl || '/food/recipes/besan-ladoo.jpg'}
              alt=""
              class={styles.tableThumb}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/food/recipes/besan-ladoo.jpg';
              }}
            />
          </button>
          <div>
            <button
              type="button"
              class={styles.tableNameBtn}
              onClick={() => onView(recipe)}
              title={`Inspect ${recipe.name}`}
              aria-label={`Inspect ${recipe.name}`}
            >
              <strong>{recipe.name}</strong>
            </button>
            <span
              class={`${styles.badge} ${styles[verInfo.badgeClass]}`}
              style={{ marginLeft: '6px', fontSize: '10px' }}
              title={verInfo.title}
            >
              {verInfo.label}
            </span>
          </div>
        </div>
      </td>
      <td>{guests}</td>
      <td>
        <div class={styles.stepper}>
          <button
            type="button"
            class={styles.stepperBtn}
            aria-label={`Decrease portion for ${recipe.name}`}
            onClick={() => onSetPortion(recipe.id, Math.max(0.25, factor - 0.25))}
          >
            -
          </button>
          <span class={styles.stepperVal}>
            {plannedServings}
            {factor !== 1 && (
              <small style={{ display: 'block', fontSize: '9px', opacity: 0.75 }}>
                ({Math.round(factor * 100)}%)
              </small>
            )}
          </span>
          <button
            type="button"
            class={styles.stepperBtn}
            aria-label={`Increase portion for ${recipe.name}`}
            onClick={() => onSetPortion(recipe.id, factor + 0.25)}
          >
            +
          </button>
        </div>
      </td>
      <td>
        <select
          class={styles.pageSizeSelect}
          style={{ height: '26px', fontSize: '11.5px', padding: '0 4px' }}
          aria-label={`Unit for ${recipe.name}`}
        >
          <option value="servings">servings</option>
        </select>
      </td>
      <td>
        <button
          type="button"
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: '#ef4444',
          }}
          title="Remove dish"
          aria-label={`Remove ${recipe.name} from menu`}
          onClick={() => onRemove(recipe.id)}
        >
          <Icon name="trash-2" />
        </button>
      </td>
    </tr>
  );
}
