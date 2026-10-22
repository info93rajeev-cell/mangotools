import type { ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { ImageBackgroundRemoverLayoutProps } from './ImageBackgroundRemoverLayout.tsx';
import type { ImageCompressLayoutProps } from './ImageCompressLayout.tsx';
import type { ImageFormatConverterLayoutProps } from './ImageFormatConverterLayout.tsx';
import type { ImageResizeLayoutProps } from './ImageResizeLayout.tsx';

export function DynamicImageResizeLayout(props: ImageResizeLayoutProps) {
  const [Comp, setComp] = useState<ComponentType<ImageResizeLayoutProps> | null>(null);

  useEffect(() => {
    void import('./ImageResizeLayout.tsx').then((m) => {
      setComp(() => m.ImageResizeLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}

export function DynamicImageFormatConverterLayout(props: ImageFormatConverterLayoutProps) {
  const [Comp, setComp] = useState<ComponentType<ImageFormatConverterLayoutProps> | null>(null);

  useEffect(() => {
    void import('./ImageFormatConverterLayout.tsx').then((m) => {
      setComp(() => m.ImageFormatConverterLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}

export function DynamicImageCompressLayout(props: ImageCompressLayoutProps) {
  const [Comp, setComp] = useState<ComponentType<ImageCompressLayoutProps> | null>(null);

  useEffect(() => {
    void import('./ImageCompressLayout.tsx').then((m) => {
      setComp(() => m.ImageCompressLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}

export function DynamicImageBackgroundRemoverLayout(props: ImageBackgroundRemoverLayoutProps) {
  const [Comp, setComp] = useState<ComponentType<ImageBackgroundRemoverLayoutProps> | null>(null);

  useEffect(() => {
    void import('./ImageBackgroundRemoverLayout.tsx').then((m) => {
      setComp(() => m.ImageBackgroundRemoverLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}
