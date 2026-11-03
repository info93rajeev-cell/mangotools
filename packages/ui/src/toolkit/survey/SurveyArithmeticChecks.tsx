import s from './surveyLeveling.module.css';
import { formatReading, formatSigned } from './surveyLevelingModel.ts';
import { surveyStrings } from './surveyLevelingStrings.ts';
import type { SurveyCalculationOutput } from './surveyLevelingTypes.ts';

export interface SurveyArithmeticChecksProps {
  result: SurveyCalculationOutput | null;
}

export function SurveyArithmeticChecks({ result }: SurveyArithmeticChecksProps) {
  if (!result) {
    return (
      <div>
        <div style={{ fontWeight: 700, fontSize: '13px', margin: '14px 0 6px' }}>
          {surveyStrings.checksTitle}
        </div>
        <div class={s.gradientBar} />
        <p style={{ fontSize: '12px', color: '#64748b' }}>Press Calculate to run the checks.</p>
      </div>
    );
  }

  const rfCheck = result.checks.find((c) => c.id === 'arithmetic-rise-fall');
  const flCheck = result.checks.find((c) => c.id === 'arithmetic-first-last');
  const rfPass = rfCheck?.status === 'pass';
  const flPass = flCheck?.status === 'pass';

  return (
    <div data-arithmetic-checks="">
      <div style={{ fontWeight: 700, fontSize: '13px', margin: '14px 0 4px' }}>
        {surveyStrings.checksTitle}
      </div>
      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
        {surveyStrings.checksSubtitle}
      </div>
      <div class={s.gradientBar} />
      <ul class={s.checksList}>
        <li class={s.checkItem}>
          <span class={`${s.checkDot} ${s.checkDotPass}`}>✓</span>
          <span>
            {surveyStrings.checkBsFs
              .replace('{bs}', formatReading(result.sumBS))
              .replace('{fs}', formatReading(result.sumFS))
              .replace('{delta}', formatSigned(result.bsFsDelta))}
          </span>
          <span class={s.checkValue} style={{ color: '#16a34a' }}>
            {formatSigned(result.bsFsDelta)} m
          </span>
        </li>
        <li class={s.checkItem}>
          <span class={`${s.checkDot} ${rfPass ? s.checkDotPass : s.checkDotFail}`}>
            {rfPass ? '✓' : '✕'}
          </span>
          <span>
            {surveyStrings.checkRiseFall
              .replace('{rise}', formatReading(result.sumRise))
              .replace('{fall}', formatReading(result.sumFall))
              .replace('{delta}', formatSigned(result.riseFallDelta))}
          </span>
          <span class={s.checkValue} style={{ color: rfPass ? '#16a34a' : '#dc2626' }}>
            {formatSigned(result.riseFallDelta)} m
          </span>
        </li>
        <li class={s.checkItem}>
          <span class={`${s.checkDot} ${flPass ? s.checkDotPass : s.checkDotFail}`}>
            {flPass ? '✓' : '✕'}
          </span>
          <span>
            {surveyStrings.checkFirstLast
              .replace('{last}', formatReading(result.endingRL))
              .replace('{first}', formatReading(result.startingRL))
              .replace('{delta}', formatSigned(result.rlDelta))}
          </span>
          <span class={s.checkValue} style={{ color: flPass ? '#16a34a' : '#dc2626' }}>
            {formatSigned(result.rlDelta)} m
          </span>
        </li>
      </ul>
    </div>
  );
}
