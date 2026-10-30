import type { ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { PdfDocumentStudioProps } from './PdfDocumentStudioLayout.tsx';

export function DynamicPdfDocumentLayout(props: PdfDocumentStudioProps) {
  const [Comp, setComp] = useState<ComponentType<PdfDocumentStudioProps> | null>(null);

  useEffect(() => {
    void import('./PdfDocumentStudioLayout.tsx').then((m) => {
      setComp(() => m.PdfDocumentStudioLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}
