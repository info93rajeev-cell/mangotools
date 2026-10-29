import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import type { ComponentChildren } from 'preact';
import {
  DynamicBase64Layout,
  DynamicCsvToJsonLayout,
  DynamicJsonFormatterLayout,
  DynamicJsonToCsvLayout,
  DynamicTimestampConverterLayout,
  DynamicUrlEncoderLayout,
} from './DynamicDataToolLayouts.tsx';

export interface DataStudioDispatchProps {
  idPrefix: string;
  toolId: string;
  preset: ResolvedPreset;
  snapshot: ToolSnapshot;
  store: ToolStore;
  notify: (msg: string) => void;
}

export function renderDataStudioLayout(props: DataStudioDispatchProps): ComponentChildren | null {
  const { preset, toolId } = props;
  const id = preset.id;

  if (id === 'data/json.format' || toolId === 'json-formatter') {
    return <DynamicJsonFormatterLayout {...props} />;
  }

  if (id === 'data/base64' || toolId === 'base64-encode-decode') {
    return <DynamicBase64Layout {...props} />;
  }

  if (id === 'data/url' || toolId === 'url-encode-decode') {
    return <DynamicUrlEncoderLayout {...props} />;
  }

  if (id === 'data/csv.to-json' || toolId === 'csv-to-json') {
    return <DynamicCsvToJsonLayout {...props} />;
  }

  if (id === 'data/json.to-csv' || toolId === 'json-to-csv') {
    return <DynamicJsonToCsvLayout {...props} />;
  }

  if (id === 'data/timestamp.convert' || toolId === 'timestamp-converter') {
    return <DynamicTimestampConverterLayout {...props} />;
  }

  return null;
}
