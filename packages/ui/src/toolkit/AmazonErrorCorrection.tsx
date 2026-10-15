import type { FieldValues, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect } from 'preact/hooks';
import type { AmazonErrorTarget } from './amazonFormFeedback.tsx';
import { rowCellError } from './repeatableRows.ts';

/** Open only presentation state, then focus the existing labelled field/row after it renders. */
export function AmazonErrorCorrection({
  target,
  preset,
  values,
  store,
  idPrefix,
}: {
  target: AmazonErrorTarget;
  preset: ResolvedPreset;
  values: FieldValues;
  store: ToolStore;
  idPrefix: string;
}) {
  const { field, path, section } = target;
  const closed = section !== undefined && String(values[section]) !== 'true';
  const spec = preset.fields[field]?.rows;
  const selected = values[field];
  const firstOption = preset.fields[field]?.options?.[0]?.value;
  useEffect(() => {
    if (closed && section) {
      store.set(section, 'true');
      return;
    }
    if (typeof document === 'undefined') return;
    const id = `${idPrefix}-${field}`;
    const cell = spec && rowCellError(field, spec, path);
    const first = Object.keys(spec?.columns ?? {})[0];
    const control =
      (cell && document.getElementById(`${id}-${cell.index}-${cell.column}`)) ||
      (first && document.getElementById(`${id}-0-${first}`)) ||
      document.getElementById(spec ? `${id}-add` : id) ||
      document.getElementById(`${id}-${selected}`) ||
      document.getElementById(`${id}-${firstOption}`);
    control?.focus();
  }, [field, path, section, closed, spec, store, idPrefix, selected, firstOption]);
  return null;
}
