import { formatSigned } from './surveyLevelingModel.ts';
import { surveyStrings } from './surveyLevelingStrings.ts';
import type { SurveyCalculationOutput } from './surveyLevelingTypes.ts';
import s from './surveyResults.module.css';

export interface SurveyArithmeticChecksProps {
  result: SurveyCalculationOutput | null;
}

export function SurveyArithmeticChecks({ result }: SurveyArithmeticChecksProps) {
  if (!result) return null;

  const bsFsCheck = result.checks.find((c) => c.id === 'arithmetic-first-last');
  const riseFallCheck = result.checks.find((c) => c.id === 'arithmetic-rise-fall');

  const deltaBSFS = formatSigned(result.bsFsDelta);
  const deltaRiseFall = formatSigned(result.riseFallDelta);
  const deltaRL = formatSigned(result.rlDelta);

  const check1Pass = bsFsCheck?.status === 'pass';
  const check2Pass = riseFallCheck?.status === 'pass';

  return (
    <div data-arithmetic-checks="">
      <div class={s.gradientBar} />
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
        {surveyStrings.checksSubtitle}
      </div>

      <ul class={s.checksList}>
        <li class={s.checkItem}>
          <span class={`${s.checkDot} ${check1Pass ? s.checkDotPass : s.checkDotFail}`}>
            {check1Pass ? '✓' : '✕'}
          </span>
          <span>
            {surveyStrings.checkBsFs
              .replace('{bs}', result.sumBS)
              .replace('{fs}', result.sumFS)
              .replace('{delta}', deltaBSFS)}
          </span>
          <span class={`${s.checkValue} ${check1Pass ? '' : s.checkValueMismatch}`}>
            {deltaBSFS} m
          </span>
        </li>

        <li class={s.checkItem}>
          <span class={`${s.checkDot} ${check1Pass ? s.checkDotPass : s.checkDotFail}`}>
            {check1Pass ? '✓' : '✕'}
          </span>
          <span>
            {surveyStrings.checkRiseFall
              .replace('{rise}', result.sumRise)
              .replace('{fall}', result.sumFall)
              .replace('{delta}', deltaRiseFall)}
          </span>
          <span class={`${s.checkValue} ${check1Pass ? '' : s.checkValueMismatch}`}>
            {deltaRiseFall} m
          </span>
        </li>

        <li class={s.checkItem}>
          <span class={`${s.checkDot} ${check2Pass ? s.checkDotPass : s.checkDotFail}`}>
            {check2Pass ? '✓' : '✕'}
          </span>
          <span>
            {surveyStrings.checkFirstLast
              .replace('{last}', result.endingRL)
              .replace('{first}', result.startingRL)
              .replace('{delta}', deltaRL)}
          </span>
          <span class={`${s.checkValue} ${check2Pass ? '' : s.checkValueMismatch}`}>
            {deltaRL} m
          </span>
        </li>
      </ul>
    </div>
  );
}
