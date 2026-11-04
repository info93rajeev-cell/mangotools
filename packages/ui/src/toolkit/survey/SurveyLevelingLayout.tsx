import type { RunFn } from '@mangotools/runtime';
import { useState } from 'preact/hooks';
import { Toast, useToast } from '../../primitives/feedback.tsx';
import { SurveyBenchmarkCard } from './SurveyBenchmarkCard.tsx';
import { SurveyProfilePlaceholder } from './SurveyProfilePlaceholder.tsx';
import { SurveyResultsCard } from './SurveyResultsCard.tsx';
import s from './surveyLevelingLayout.module.css';
import { surveyStrings } from './surveyLevelingStrings.ts';
import type { SurveyCalculationOutput } from './surveyLevelingTypes.ts';
import { useSurveyLeveling } from './useSurveyLeveling.ts';

export interface SurveyLevelingLayoutProps {
  customRun?: RunFn;
  showHeader?: boolean;
}

function AccordionCard({ title, children }: { title: string; children: preact.ComponentChildren }) {
  const [open, setOpen] = useState(false);
  return (
    <div class={s.accCard}>
      <button type="button" class={s.accHead} onClick={() => setOpen((prev) => !prev)}>
        <span>{title}</span>
        <span class={s.accPlus}>{open ? '−' : '+'}</span>
      </button>
      {open ? <div class={s.accBody}>{children}</div> : null}
    </div>
  );
}

function buildCopyText(
  rows: SurveyCalculationOutput['rows'],
  method: 'rise-fall' | 'height-of-instrument' = 'rise-fall',
): string {
  if (method === 'height-of-instrument') {
    const header = [
      'Station',
      'Dist (m)',
      'BS',
      'IS',
      'FS',
      'HI',
      'Raw RL',
      'Corr (mm)',
      'Adjusted RL',
    ].join('\t');
    const lines = rows.map((r) =>
      [
        r.station ?? '',
        r.dist ?? '',
        r.bs ?? '',
        r.is ?? '',
        r.fs ?? '',
        r.hi ?? '',
        r.rl,
        r.corr ?? '',
        r.adjustedRL ?? '',
      ].join('\t'),
    );
    return [header, ...lines].join('\n');
  }

  const header = [
    'Station',
    'Dist (m)',
    'BS',
    'IS',
    'FS',
    'Rise',
    'Fall',
    'Raw RL',
    'Corr (mm)',
    'Adjusted RL',
  ].join('\t');
  const lines = rows.map((r) =>
    [
      r.station ?? '',
      r.dist ?? '',
      r.bs ?? '',
      r.is ?? '',
      r.fs ?? '',
      r.rise ?? '',
      r.fall ?? '',
      r.rl,
      r.corr ?? '',
      r.adjustedRL ?? '',
    ].join('\t'),
  );
  return [header, ...lines].join('\n');
}

function SurveyHeaderPills() {
  return (
    <div class={s.titleBar}>
      <div>
        <h2 class={s.title}>{surveyStrings.title}</h2>
        <p class={s.subtitle}>{surveyStrings.subtitle}</p>
      </div>
      <div class={s.pills}>
        <span class={s.pill}>💡 {surveyStrings.guide}</span>
        <span class={s.pill}>⛶ {surveyStrings.fullScreen}</span>
        <span class={`${s.pill} ${s.pillSuccess}`}>🔒 {surveyStrings.privacyBadge}</span>
      </div>
    </div>
  );
}

function SurveyBottomFaq({ method }: { method: 'rise-fall' | 'height-of-instrument' }) {
  const methodText =
    method === 'height-of-instrument' ? surveyStrings.accMethodHI : surveyStrings.accMethodRF;
  return (
    <div class={s.bottomGrid} data-bottom-faq="">
      <AccordionCard title="ⓘ Disclaimer">Estimation aid for civil surveying.</AccordionCard>
      <AccordionCard title="📖 How to use">Enter starting BM RL and observations.</AccordionCard>
      <AccordionCard title={`⚙ ${surveyStrings.accMethodTitle}`}>
        <span data-method-accordion-desc="">{methodText}</span>
      </AccordionCard>
      <AccordionCard title="❓ FAQ">Calculations run 100% locally on your device.</AccordionCard>
      <AccordionCard title="🔗 Related tools">
        Explore other civil and surveying tools.
      </AccordionCard>
    </div>
  );
}

export function SurveyLevelingLayout({ customRun, showHeader = false }: SurveyLevelingLayoutProps) {
  const survey = useSurveyLeveling(customRun);
  const [message, notify] = useToast();

  const handleCopyBook = async () => {
    if (!survey.result || survey.isStale) return;
    const content = buildCopyText(survey.result.rows, survey.method);
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      notify(surveyStrings.copyFailedToast);
      return;
    }
    try {
      await navigator.clipboard.writeText(content);
      notify(surveyStrings.copiedToast);
    } catch {
      notify(surveyStrings.copyFailedToast);
    }
  };

  return (
    <div class={s.root} data-survey-workbench="">
      {showHeader && <SurveyHeaderPills />}

      <div class={s.grid}>
        <div>
          <SurveyBenchmarkCard
            method={survey.method}
            setMethod={survey.setMethod}
            startRL={survey.startRL}
            setStartRL={survey.setStartRL}
            closingRL={survey.closingRL}
            setClosingRL={survey.setClosingRL}
            kConstant={survey.kConstant}
            setKConstant={survey.setKConstant}
            adjBy={survey.adjBy}
            setAdjBy={survey.setAdjBy}
            rows={survey.rows}
            errors={survey.errors}
            cellErrors={survey.cellErrors}
            handleCellChange={survey.handleCellChange}
            handleAddRow={survey.handleAddRow}
            handleRemoveRow={survey.handleRemoveRow}
            calculate={survey.calculate}
            loadSample={survey.loadSample}
            reset={survey.reset}
          />
          <AccordionCard title={`+ ${surveyStrings.accNotesTitle}`}>
            {surveyStrings.accNotesBody}
          </AccordionCard>
          <AccordionCard title={`+ ${surveyStrings.accBookTitle}`}>
            {surveyStrings.accBookBody}
          </AccordionCard>
        </div>

        <div>
          <SurveyProfilePlaceholder result={survey.result} closingRL={survey.closingRL} />
          <SurveyResultsCard
            phase={survey.phase}
            method={survey.method}
            result={survey.result}
            isStale={survey.isStale}
            closingRLInput={survey.closingRL}
            onCopyBook={handleCopyBook}
          />
        </div>
      </div>

      <AccordionCard title={`⚠️ ${surveyStrings.accWarningsTitle}`}>
        {surveyStrings.accWarningsBody}
      </AccordionCard>

      <SurveyBottomFaq method={survey.method} />

      <Toast message={message} />
    </div>
  );
}
