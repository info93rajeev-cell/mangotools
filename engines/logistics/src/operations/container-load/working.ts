import type { WorkingStep } from '@mangotools/core';
import type { ReadContainer } from './read-container.ts';
import type { Totals } from './summarize.ts';

const step = (
  ref: string,
  formulaKey: string,
  variables: Record<string, string>,
  result: string,
): WorkingStep => ({ ref, formulaKey, variables, result });

/** Volume and weight working steps, with full-precision values. */
export function loadWorkingSteps(container: ReadContainer, totals: Totals): WorkingStep[] {
  const [length, width, height] = container.dimsCm;
  const steps = [
    step('containerVolume', 'cl.containerVolume', { length, width, height }, container.volumeM3),
    step(
      'requestedVolume',
      'cl.requestedVolume',
      { pieces: String(totals.totalPieces) },
      totals.requestedVolume,
    ),
    step(
      'loadedVolume',
      'cl.loadedVolume',
      { pieces: String(totals.loadedPieces) },
      totals.loadedVolume,
    ),
    step(
      'availableVolume',
      'cl.availableVolume',
      { containers: String(totals.containers), containerVolume: container.volumeM3 },
      totals.availableVolume,
    ),
    step(
      'volumeUtilization',
      'cl.volumeUtilization',
      { loadedVolume: totals.loadedVolume, availableVolume: totals.availableVolume },
      totals.volumeUtilization,
    ),
  ];
  if (totals.weightUtilization !== null && totals.loadedWeight && totals.payloadCapacity) {
    steps.push(
      step(
        'weightUtilization',
        'cl.weightUtilization',
        { loadedWeight: totals.loadedWeight, payloadCapacity: totals.payloadCapacity },
        totals.weightUtilization,
      ),
    );
  }
  return steps;
}
