import type { RunFn } from '@mangotools/runtime';
import { useState } from 'preact/hooks';
import { Toast, useToast } from '../../primitives/feedback.tsx';
import { SurveyBenchmarkCard } from './SurveyBenchmarkCard.tsx';
import { SurveyProfilePlaceholder } from './SurveyProfilePlaceholder.tsx';
import { SurveyResultsCard } from './SurveyResultsCard.tsx';
import s from './surveyLeveling.module.css';
import { surveyStrings } from './surveyLevelingStrings.ts';
import { useSurveyLeveling } from './useSurveyLeveling.ts';

export interface SurveyLevelingLayoutProps {
  customRun?: RunFn;
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

export function SurveyLevelingLayout({ customRun }: SurveyLevelingLayoutProps) {
  const survey = useSurveyLeveling(customRun);
  const [message, notify] = useToast();

  const handleCopyBook = () => {
    if (!survey.result) return;
    const header = ['Station', 'BS', 'IS', 'FS', 'Rise', 'Fall', 'RL'].join('\t');
    const lines = survey.result.rows.map((r) =>
      [r.station ?? '', r.bs ?? '', r.is ?? '', r.fs ?? '', r.rise ?? '', r.fall ?? '', r.rl].join(
        '\t',
      ),
    );
    void navigator.clipboard?.writeText([header, ...lines].join('\n'));
    notify(surveyStrings.copiedToast);
  };

  return (
    <div class={s.root} data-survey-workbench="">
      <div class={s.titleBar}>
        <div>
          <h1 class={s.title}>{surveyStrings.title}</h1>
          <p class={s.subtitle}>{surveyStrings.subtitle}</p>
        </div>
        <div class={s.pills}>
          <span class={s.pill}>💡 {surveyStrings.guide}</span>
          <span class={s.pill}>⛶ {surveyStrings.fullScreen}</span>
          <span class={`${s.pill} ${s.pillSuccess}`}>🔒 {surveyStrings.privacyBadge}</span>
        </div>
      </div>

      <div class={s.grid}>
        <div>
          <SurveyBenchmarkCard
            startRL={survey.startRL}
            setStartRL={survey.setStartRL}
            closingRL={survey.closingRL}
            setClosingRL={survey.setClosingRL}
            rows={survey.rows}
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
          <SurveyProfilePlaceholder result={survey.result} />
          <SurveyResultsCard
            phase={survey.phase}
            result={survey.result}
            closingRL={survey.closingRL}
            onCopyBook={handleCopyBook}
          />
        </div>
      </div>

      <AccordionCard title={`⚠️ ${surveyStrings.accWarningsTitle}`}>
        {surveyStrings.accWarningsBody}
      </AccordionCard>

      <div class={s.bottomGrid}>
        <AccordionCard title="ⓘ Disclaimer">Estimation aid for civil surveying.</AccordionCard>
        <AccordionCard title="📖 How to use">Enter starting BM RL and observations.</AccordionCard>
        <AccordionCard title="⚙ Method">Rise & Fall reduction per BS 5606 / NPTEL.</AccordionCard>
        <AccordionCard title="❓ FAQ">Calculations run 100% locally on your device.</AccordionCard>
        <AccordionCard title="🔗 Related tools">
          Explore other civil and surveying tools.
        </AccordionCard>
      </div>

      <Toast message={message} />
    </div>
  );
}
