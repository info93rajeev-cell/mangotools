import type { ResolvedPreset } from '@mangotools/schemas';
import { renderTemplate } from '../format/template.ts';
import { t } from '../strings/en.ts';
import { presetCurrency } from './presentation.ts';
import styles from './toolkit.module.css';

export interface WorkingStep {
  ref: string;
  formulaKey: string;
  variables: Record<string, string>;
  result: string;
}

export interface WorkingStepsProps {
  preset: ResolvedPreset;
  steps: WorkingStep[];
}

/** "Show calculation": each step rendered from the preset's work.* template. */
export function WorkingSteps({ preset, steps }: WorkingStepsProps) {
  if (steps.length === 0) return null;
  const currency = presetCurrency(preset);
  return (
    <details class={styles.working} open>
      <summary>{t('action.showWorking')}</summary>
      <ol class={styles.steps}>
        {steps.map((step) => {
          const template =
            preset.strings[`work.${step.formulaKey}`] ?? `${step.formulaKey} = {result}`;
          const parts = renderTemplate(
            template,
            { ...step.variables, result: step.result },
            { currency },
          );
          return (
            <li key={`${step.ref}-${step.formulaKey}`}>
              {parts.map((part, i) =>
                part.kind === 'value' ? (
                  <strong key={i} class={styles.stepValue}>
                    {part.text}
                  </strong>
                ) : (
                  <span key={i}>{part.text}</span>
                ),
              )}
            </li>
          );
        })}
      </ol>
    </details>
  );
}
