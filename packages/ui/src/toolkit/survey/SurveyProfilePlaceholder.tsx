import s from './surveyLeveling.module.css';
import { surveyStrings } from './surveyLevelingStrings.ts';
import type { SurveyCalculationOutput } from './surveyLevelingTypes.ts';

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
        <div class={s.iconWrap} style={{ background: '#1a6ef5' }}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 17l5-5 4 3 8-8" />
            <path d="M3 21h18" />
          </svg>
        </div>
        <h2 class={s.cardTitle}>{surveyStrings.profileTitle}</h2>
        <span class={s.cardHeadRight}>Illustrative, not to scale</span>
      </div>
      <div class={s.cardBody}>
        <div
          style={{
            padding: '16px',
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#475569',
            lineHeight: 1.5,
            marginBottom: '12px',
            textAlign: 'center',
          }}
        >
          {surveyStrings.profileNotice}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <div
            style={{
              background: '#f8fafc',
              borderRadius: '6px',
              padding: '8px',
              textAlign: 'center',
            }}
          >
            <span style={{ display: 'block', fontSize: '10.5px', color: '#64748b' }}>
              {surveyStrings.profileHighestRL}
            </span>
            <b style={{ fontSize: '14px', color: '#0b1b3f' }}>{highest}</b>
          </div>
          <div
            style={{
              background: '#f8fafc',
              borderRadius: '6px',
              padding: '8px',
              textAlign: 'center',
            }}
          >
            <span style={{ display: 'block', fontSize: '10.5px', color: '#64748b' }}>
              {surveyStrings.profileLowestRL}
            </span>
            <b style={{ fontSize: '14px', color: '#0b1b3f' }}>{lowest}</b>
          </div>
          <div
            style={{
              background: '#f8fafc',
              borderRadius: '6px',
              padding: '8px',
              textAlign: 'center',
            }}
          >
            <span style={{ display: 'block', fontSize: '10.5px', color: '#64748b' }}>
              {surveyStrings.profileLineLength}
            </span>
            <b style={{ fontSize: '13px', color: '#94a3b8' }}>—</b>
          </div>
        </div>
      </div>
    </div>
  );
}
