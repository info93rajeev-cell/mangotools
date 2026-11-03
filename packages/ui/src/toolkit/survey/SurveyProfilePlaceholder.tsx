import { surveyStrings } from './surveyLevelingStrings.ts';
import type { SurveyCalculationOutput } from './surveyLevelingTypes.ts';
import s from './surveyProfile.module.css';

export interface SurveyProfilePlaceholderProps {
  result: SurveyCalculationOutput | null;
}

export function SurveyProfilePlaceholder({ result }: SurveyProfilePlaceholderProps) {
  let highest = '—';
  let lowest = '—';

  if (result && result.rows.length > 0) {
    const rls = result.rows.map((r) => Number(r.rl)).filter((n) => !Number.isNaN(n));
    if (rls.length > 0) {
      highest = `${Math.max(...rls).toFixed(3)} m`;
      lowest = `${Math.min(...rls).toFixed(3)} m`;
    }
  }

  return (
    <div class={s.card} data-profile-card="">
      <div class={s.cardHead}>
        <div class={s.iconWrap}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 17l5-5 4 3 8-8" />
            <path d="M3 21h18" />
          </svg>
        </div>
        <h2 class={s.cardTitle}>{surveyStrings.profileTitle}</h2>
        <span class={s.cardHeadRight}>Illustrative, not to scale</span>
      </div>
      <div class={s.cardBody}>
        <div class={s.notice}>{surveyStrings.profileNotice}</div>

        <div class={s.chipsGrid}>
          <div class={s.chip}>
            <span class={s.chipLabel}>{surveyStrings.profileHighestRL}</span>
            <b class={s.chipValue}>{highest}</b>
          </div>
          <div class={s.chip}>
            <span class={s.chipLabel}>{surveyStrings.profileLowestRL}</span>
            <b class={s.chipValue}>{lowest}</b>
          </div>
          <div class={s.chip}>
            <span class={s.chipLabel}>{surveyStrings.profileLineLength}</span>
            <b class={s.chipValue}>—</b>
          </div>
        </div>
      </div>
    </div>
  );
}
