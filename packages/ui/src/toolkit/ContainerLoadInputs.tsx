import s from './containerWorkspace.module.css';
import type { LoadControllerHandle } from './containerWorkspaceController.ts';
import type { LoadSnapshot } from './containerWorkspaceModel.ts';
import { containerChoices, containerText as t } from './containerWorkspaceStrings.ts';
export interface LoadInputProps {
  state: LoadSnapshot;
  controller: LoadControllerHandle;
}
export function ContainerSelection({ state, controller }: LoadInputProps) {
  return (
    <section class={s.card} aria-labelledby="load-selection-title">
      <h2 id="load-selection-title">⚙ {t.selection}</h2>
      <div class={s.containerChoices}>
        {containerChoices.map((c) => (
          <button
            type="button"
            key={c.id}
            aria-pressed={state.settings.containerType === c.id}
            onClick={() => controller.settings({ containerType: c.id })}
          >
            <strong>{c.name}</strong>
            <small>
              {c.id === 'custom' ? t.dimensions : `${c.length} × ${c.width} × ${c.height} cm`}
            </small>
            {c.volume ? <small>{c.volume} m³</small> : null}
          </button>
        ))}
      </div>
      <label class={s.mobileContainer}>
        {t.type}
        <select
          value={state.settings.containerType}
          onChange={(e) => controller.settings({ containerType: e.currentTarget.value })}
        >
          {containerChoices.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      {state.settings.containerType === 'custom' ? (
        <div class={s.constraintFields}>
          {(['containerLength', 'containerWidth', 'containerHeight'] as const).map((key, index) => (
            <label key={key}>
              {[t.length, t.width, t.height][index]} (cm)
              <input
                inputMode="decimal"
                aria-invalid={state.error?.path === key}
                value={state.settings[key]}
                onInput={(e) => controller.settings({ [key]: e.currentTarget.value })}
              />
            </label>
          ))}
        </div>
      ) : null}
      <details class={s.reference}>
        <summary>
          {t.reference}
          <span class={s.referenceWarning}>{t.referenceShort}</span>
        </summary>
        <p>{t.referenceNote}</p>
        <p>{t.source}</p>
      </details>
    </section>
  );
}
export function ContainerConstraints({ state, controller }: LoadInputProps) {
  return (
    <section class={s.card} aria-labelledby="load-constraints-title">
      <h2 id="load-constraints-title">⚙ {t.constraints}</h2>
      <div class={s.constraintFields}>
        <label>
          {t.payload} (kg)
          <input
            inputMode="decimal"
            aria-invalid={state.error?.path === 'maxPayload'}
            value={state.settings.maxPayload}
            onInput={(e) => controller.settings({ maxPayload: e.currentTarget.value })}
          />
        </label>
        <label>
          {t.stack} (cm)
          <input
            inputMode="decimal"
            aria-invalid={state.error?.path === 'maxStackHeight'}
            value={state.settings.maxStackHeight}
            onInput={(e) => controller.settings({ maxStackHeight: e.currentTarget.value })}
          />
        </label>
        <label class={s.switch}>
          {t.rotation}
          <input
            type="checkbox"
            checked={state.settings.allowRotation}
            onChange={(e) => controller.settings({ allowRotation: e.currentTarget.checked })}
          />
        </label>
      </div>
    </section>
  );
}
export function ContainerCostInputs({ state, controller }: LoadInputProps) {
  return (
    <section class={`${s.card} ${s.costInputs}`} aria-labelledby="load-cost-title">
      <div class={s.heading}>
        <h2 id="load-cost-title">♧ {t.cost}</h2>
        <label class={s.switch}>
          <span class={s.sr}>{t.enabled}</span>
          <input
            type="checkbox"
            checked={state.costInput.enabled}
            onChange={(e) => controller.cost({ enabled: e.currentTarget.checked })}
          />
        </label>
      </div>
      {state.costInput.enabled ? (
        <>
          <p>{t.costHelp}</p>
          <div class={s.costFields}>
            <label>
              {t.currency}
              <select
                value={state.costInput.currency}
                onChange={(e) => controller.cost({ currency: e.currentTarget.value })}
              >
                {['INR', 'USD', 'EUR', 'GBP', 'AED'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              {t.basis}
              <input readOnly value={t.perContainer} />
            </label>
            {(['rate', 'minimumCharge', 'otherCharges'] as const).map((key) => (
              <label key={key}>
                {t[key]}
                <span class={s.amountInput}>
                  {key === 'rate' ? (
                    <span aria-hidden="true">
                      {state.costInput.currency === 'INR' ? '₹' : state.costInput.currency}
                    </span>
                  ) : null}
                  <input
                    aria-label={t[key]}
                    inputMode="decimal"
                    maxLength={64}
                    value={state.costInput[key]}
                    aria-invalid={state.costError?.path === key}
                    onInput={(e) => controller.cost({ [key]: e.currentTarget.value })}
                  />
                  {key === 'rate' ? <span aria-hidden="true">{t.rateSuffix}</span> : null}
                </span>
              </label>
            ))}
          </div>
        </>
      ) : null}
      {state.costError ? (
        <p role="alert">
          {t.costError} ({state.costError.code})
        </p>
      ) : null}
    </section>
  );
}
