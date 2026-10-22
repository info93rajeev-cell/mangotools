import { initialLoadState, type LoadSnapshot } from './containerWorkspaceModel.ts';

const sample = initialLoadState();
/** Only the untouched numeric sample may use the approved illustrative artwork. */
export function matchesContainerReference(state: LoadSnapshot) {
  const fields = ['length', 'width', 'height', 'unit', 'quantity', 'weight', 'weightUnit'] as const;
  return (
    state.packages.length === sample.packages.length &&
    state.packages.every((row, index) =>
      fields.every((key) => row[key] === sample.packages[index]?.[key]),
    ) &&
    Object.entries(sample.settings).every(
      ([key, value]) => state.settings[key as keyof typeof sample.settings] === value,
    )
  );
}
export const containerReferenceImage = new URL('./container-reference-sample.png', import.meta.url)
  .href;
