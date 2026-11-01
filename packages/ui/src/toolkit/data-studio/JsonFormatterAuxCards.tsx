import { useState } from 'preact/hooks';
import styles from './dataStudio.module.css';
import { SearchInJsonCard, ValidationResultCard } from './JsonSearchAndValidationCards.tsx';
import type { ParseResult } from './useJsonFormatterStudio.ts';

export interface JsonAuxCardsProps {
  indent: '2' | '4' | 'tab' | 'min';
  onIndent: (v: '2' | '4' | 'tab' | 'min') => void;
  keySorting: 'original' | 'asc' | 'desc';
  onKeySorting: (v: 'original' | 'asc' | 'desc') => void;
  syntaxHighlight: boolean;
  onSyntaxHighlight: (v: boolean) => void;
  lineNumbers: boolean;
  onLineNumbers: (v: boolean) => void;
  autoFormatOnPaste: boolean;
  onAutoFormatOnPaste: (v: boolean) => void;
  searchQuery: string;
  onSearch: (v: string) => void;
  searchMatches: number;
  searchMatchCase: boolean;
  onSearchMatchCase: (v: boolean) => void;
  searchRegex: boolean;
  onSearchRegex: (v: boolean) => void;
  detectDuplicates: boolean;
  onDetectDuplicates: (v: boolean) => void;
  validateSchema: boolean;
  onValidateSchema: (v: boolean) => void;
  allowJson5: boolean;
  onAllowJson5: (v: boolean) => void;
  safeBigInt: boolean;
  onSafeBigInt: (v: boolean) => void;
  parsedResult: ParseResult;
  onLoadExample: (key: string) => void;
}

export function JsonAuxCards({
  indent,
  onIndent,
  keySorting,
  onKeySorting,
  syntaxHighlight,
  onSyntaxHighlight,
  lineNumbers,
  onLineNumbers,
  autoFormatOnPaste,
  onAutoFormatOnPaste,
  searchQuery,
  onSearch,
  searchMatches,
  searchMatchCase,
  onSearchMatchCase,
  searchRegex,
  onSearchRegex,
  detectDuplicates,
  onDetectDuplicates,
  validateSchema,
  onValidateSchema,
  allowJson5,
  onAllowJson5,
  safeBigInt,
  onSafeBigInt,
  parsedResult,
  onLoadExample,
}: JsonAuxCardsProps) {
  return (
    <div class={styles.aux}>
      <FormattingOptionsCard
        indent={indent}
        onIndent={onIndent}
        keySorting={keySorting}
        onKeySorting={onKeySorting}
        syntaxHighlight={syntaxHighlight}
        onSyntaxHighlight={onSyntaxHighlight}
        lineNumbers={lineNumbers}
        onLineNumbers={onLineNumbers}
        autoFormatOnPaste={autoFormatOnPaste}
        onAutoFormatOnPaste={onAutoFormatOnPaste}
      />
      <AdvancedOptionsCard
        detectDuplicates={detectDuplicates}
        onDetectDuplicates={onDetectDuplicates}
        validateSchema={validateSchema}
        onValidateSchema={onValidateSchema}
        allowJson5={allowJson5}
        onAllowJson5={onAllowJson5}
        safeBigInt={safeBigInt}
        onSafeBigInt={onSafeBigInt}
      />
      <ValidationResultCard parsedResult={parsedResult} />
      <SearchInJsonCard
        searchQuery={searchQuery}
        onSearch={onSearch}
        searchMatches={searchMatches}
        searchMatchCase={searchMatchCase}
        onSearchMatchCase={onSearchMatchCase}
        searchRegex={searchRegex}
        onSearchRegex={onSearchRegex}
        onLoadExample={onLoadExample}
      />
    </div>
  );
}

function FormattingOptionsCard({
  indent,
  onIndent,
  keySorting,
  onKeySorting,
  syntaxHighlight,
  onSyntaxHighlight,
  lineNumbers,
  onLineNumbers,
  autoFormatOnPaste,
  onAutoFormatOnPaste,
}: {
  indent: '2' | '4' | 'tab' | 'min';
  onIndent: (v: '2' | '4' | 'tab' | 'min') => void;
  keySorting: 'original' | 'asc' | 'desc';
  onKeySorting: (v: 'original' | 'asc' | 'desc') => void;
  syntaxHighlight: boolean;
  onSyntaxHighlight: (v: boolean) => void;
  lineNumbers: boolean;
  onLineNumbers: (v: boolean) => void;
  autoFormatOnPaste: boolean;
  onAutoFormatOnPaste: (v: boolean) => void;
}) {
  return (
    <section class={styles.optcard}>
      <div class={styles.optTitle}>
        <span class={styles.optIcon}>⚙️</span>
        <b>Formatting Options</b>
      </div>
      <div class={styles.optFieldsRow}>
        <label class={styles.optField}>
          <span class={styles.optLabel}>Indentation</span>
          <select
            class={styles.optSelect}
            value={indent}
            onChange={(e) =>
              onIndent((e.target as HTMLSelectElement).value as '2' | '4' | 'tab' | 'min')
            }
          >
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
            <option value="min">Compact</option>
          </select>
        </label>
        <label class={styles.optField}>
          <span class={styles.optLabel}>Key sorting</span>
          <select
            class={styles.optSelect}
            value={keySorting}
            onChange={(e) =>
              onKeySorting((e.target as HTMLSelectElement).value as 'original' | 'asc' | 'desc')
            }
          >
            <option value="original">Keep original order</option>
            <option value="asc">Sort keys (A-Z)</option>
            <option value="desc">Sort keys (Z-A)</option>
          </select>
        </label>
      </div>
      <div class={styles.optCheckboxRow}>
        <label class={styles.optCheckbox}>
          <input
            type="checkbox"
            checked={syntaxHighlight}
            onChange={(e) => onSyntaxHighlight((e.target as HTMLInputElement).checked)}
          />
          Highlight syntax
        </label>
        <label class={styles.optCheckbox}>
          <input
            type="checkbox"
            checked={lineNumbers}
            onChange={(e) => onLineNumbers((e.target as HTMLInputElement).checked)}
          />
          Show line numbers
        </label>
        <label class={styles.optCheckbox}>
          <input
            type="checkbox"
            checked={autoFormatOnPaste}
            onChange={(e) => onAutoFormatOnPaste((e.target as HTMLInputElement).checked)}
          />
          Auto format on paste
        </label>
      </div>
    </section>
  );
}

function AdvancedOptionsCard({
  detectDuplicates,
  onDetectDuplicates,
  validateSchema,
  onValidateSchema,
  allowJson5,
  onAllowJson5,
  safeBigInt,
  onSafeBigInt,
}: {
  detectDuplicates: boolean;
  onDetectDuplicates: (v: boolean) => void;
  validateSchema: boolean;
  onValidateSchema: (v: boolean) => void;
  allowJson5: boolean;
  onAllowJson5: (v: boolean) => void;
  safeBigInt: boolean;
  onSafeBigInt: (v: boolean) => void;
}) {
  const [showMore, setShowMore] = useState(false);

  return (
    <section class={styles.optcard}>
      <div class={styles.optTitle}>
        <span class={styles.optIcon}>🛠️</span>
        <b>Advanced Options</b>
        <button type="button" class={styles.optLinkBtn} onClick={() => setShowMore(!showMore)}>
          {showMore ? 'Show less ∧' : 'Show more ∨'}
        </button>
      </div>
      <div class={styles.switchList}>
        <ToggleSwitchRow
          label="Detect duplicate keys"
          checked={detectDuplicates}
          onChange={onDetectDuplicates}
        />
        <ToggleSwitchRow
          label="Validate against JSON Schema"
          tooltip="Enforce required properties, types, and schema formats"
          checked={validateSchema}
          onChange={onValidateSchema}
        />
        <ToggleSwitchRow
          label="Allow comments (JSON5)"
          checked={allowJson5}
          onChange={onAllowJson5}
        />
        <ToggleSwitchRow
          label="Handle large numbers safely"
          checked={safeBigInt}
          onChange={onSafeBigInt}
        />
      </div>
    </section>
  );
}

function ToggleSwitchRow({
  label,
  tooltip,
  checked,
  onChange,
}: {
  label: string;
  tooltip?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label class={styles.switchRow}>
      <span class={styles.switchLabel}>
        {label}
        {tooltip && (
          <span class={styles.tooltipIcon} title={tooltip}>
            ?
          </span>
        )}
      </span>
      <span class={styles.toggleWrap}>
        <input
          type="checkbox"
          class={styles.toggleInput}
          checked={checked}
          onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
        />
        <span class={styles.toggleSlider} />
      </span>
    </label>
  );
}

export function SideMetricsPanel({
  parsedResult,
}: {
  parsedResult: ParseResult;
  inputLength?: number;
  inputLines?: number;
  activeTab?: 'raw' | 'tree' | 'table';
  onTab?: (t: 'raw' | 'tree' | 'table') => void;
}) {
  return <ValidationResultCard parsedResult={parsedResult} />;
}
