import { formatSigned } from './surveyLevelingModel.ts';
import { surveyStrings } from './surveyLevelingStrings.ts';
import type { SurveyCalculationOutput } from './surveyLevelingTypes.ts';
import s from './surveyResults.module.css';

export interface SurveyArithmeticChecksProps {
  result: SurveyCalculationOutput | null;
  method?: 'rise-fall' | 'height-of-instrument';
}

interface CheckItemProps {
  pass: boolean;
  text: string;
  value: string;
}

function CheckItem({ pass, text, value }: CheckItemProps) {
  return (
    <li class={s.checkItem}>
      <span class={`${s.checkDot} ${pass ? s.checkDotPass : s.checkDotFail}`}>
        {pass ? '✓' : '✕'}
      </span>
      <span>{text}</span>
      <span class={`${s.checkValue} ${pass ? '' : s.checkValueMismatch}`}>{value}</span>
    </li>
  );
}

function HIChecksList({ result }: { result: SurveyCalculationOutput }) {
  const check = result.checks.find((c) => c.id === 'arithmetic-first-last');
  const pass = check?.status === 'pass';
  const deltaBSFS = formatSigned(result.bsFsDelta);
  const deltaRL = formatSigned(result.rlDelta);

  const bsFsText = surveyStrings.checkBsFs
    .replace('{bs}', result.sumBS)
    .replace('{fs}', result.sumFS)
    .replace('{delta}', deltaBSFS);

  const firstLastText = surveyStrings.checkFirstLast
    .replace('{last}', result.endingRL)
    .replace('{first}', result.startingRL)
    .replace('{delta}', deltaRL);

  return (
    <>
      <div class={s.checksSubtitle}>{surveyStrings.checksSubtitleHI}</div>
      <ul class={s.checksList}>
        <CheckItem pass={pass} text={bsFsText} value={`${deltaBSFS} m`} />
        <CheckItem pass={pass} text={firstLastText} value={`${deltaRL} m`} />
      </ul>
    </>
  );
}

function RiseFallChecksList({ result }: { result: SurveyCalculationOutput }) {
  const bsFsCheck = result.checks.find((c) => c.id === 'arithmetic-first-last');
  const riseFallCheck = result.checks.find((c) => c.id === 'arithmetic-rise-fall');

  const check1Pass = bsFsCheck?.status === 'pass';
  const check2Pass = riseFallCheck?.status === 'pass';

  const deltaBSFS = formatSigned(result.bsFsDelta);
  const deltaRiseFall = formatSigned(result.riseFallDelta);
  const deltaRL = formatSigned(result.rlDelta);

  const bsFsText = surveyStrings.checkBsFs
    .replace('{bs}', result.sumBS)
    .replace('{fs}', result.sumFS)
    .replace('{delta}', deltaBSFS);

  const riseFallText = surveyStrings.checkRiseFall
    .replace('{rise}', result.sumRise ?? '—')
    .replace('{fall}', result.sumFall ?? '—')
    .replace('{delta}', deltaRiseFall);

  const firstLastText = surveyStrings.checkFirstLast
    .replace('{last}', result.endingRL)
    .replace('{first}', result.startingRL)
    .replace('{delta}', deltaRL);

  return (
    <>
      <div class={s.checksSubtitle}>{surveyStrings.checksSubtitle}</div>
      <ul class={s.checksList}>
        <CheckItem pass={check1Pass} text={bsFsText} value={`${deltaBSFS} m`} />
        <CheckItem pass={check1Pass} text={riseFallText} value={`${deltaRiseFall} m`} />
        <CheckItem pass={check2Pass} text={firstLastText} value={`${deltaRL} m`} />
      </ul>
    </>
  );
}

export function SurveyArithmeticChecks({
  result,
  method = 'rise-fall',
}: SurveyArithmeticChecksProps) {
  if (!result) return null;

  return (
    <div data-arithmetic-checks="">
      <div class={s.gradientBar} />
      {method === 'height-of-instrument' ? (
        <HIChecksList result={result} />
      ) : (
        <RiseFallChecksList result={result} />
      )}
    </div>
  );
}
