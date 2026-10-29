import type { ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { Base64StudioLayoutProps } from './Base64StudioLayout.tsx';
import type { CsvToJsonStudioLayoutProps } from './CsvToJsonStudioLayout.tsx';
import type { JsonFormatterStudioLayoutProps } from './JsonFormatterStudioLayout.tsx';
import type { JsonToCsvStudioLayoutProps } from './JsonToCsvStudioLayout.tsx';
import type { TimestampConverterStudioLayoutProps } from './TimestampConverterStudioLayout.tsx';
import type { UrlEncoderStudioLayoutProps } from './UrlEncoderStudioLayout.tsx';

export function DynamicJsonFormatterLayout(props: JsonFormatterStudioLayoutProps) {
  const [Comp, setComp] = useState<ComponentType<JsonFormatterStudioLayoutProps> | null>(null);

  useEffect(() => {
    void import('./JsonFormatterStudioLayout.tsx').then((m) => {
      setComp(() => m.JsonFormatterStudioLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}

export function DynamicBase64Layout(props: Base64StudioLayoutProps) {
  const [Comp, setComp] = useState<ComponentType<Base64StudioLayoutProps> | null>(null);

  useEffect(() => {
    void import('./Base64StudioLayout.tsx').then((m) => {
      setComp(() => m.Base64StudioLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}

export function DynamicUrlEncoderLayout(props: UrlEncoderStudioLayoutProps) {
  const [Comp, setComp] = useState<ComponentType<UrlEncoderStudioLayoutProps> | null>(null);

  useEffect(() => {
    void import('./UrlEncoderStudioLayout.tsx').then((m) => {
      setComp(() => m.UrlEncoderStudioLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}

export function DynamicCsvToJsonLayout(props: CsvToJsonStudioLayoutProps) {
  const [Comp, setComp] = useState<ComponentType<CsvToJsonStudioLayoutProps> | null>(null);

  useEffect(() => {
    void import('./CsvToJsonStudioLayout.tsx').then((m) => {
      setComp(() => m.CsvToJsonStudioLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}

export function DynamicJsonToCsvLayout(props: JsonToCsvStudioLayoutProps) {
  const [Comp, setComp] = useState<ComponentType<JsonToCsvStudioLayoutProps> | null>(null);

  useEffect(() => {
    void import('./JsonToCsvStudioLayout.tsx').then((m) => {
      setComp(() => m.JsonToCsvStudioLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}

export function DynamicTimestampConverterLayout(props: TimestampConverterStudioLayoutProps) {
  const [Comp, setComp] = useState<ComponentType<TimestampConverterStudioLayoutProps> | null>(null);

  useEffect(() => {
    void import('./TimestampConverterStudioLayout.tsx').then((m) => {
      setComp(() => m.TimestampConverterStudioLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}
