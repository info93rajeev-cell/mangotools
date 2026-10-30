import type { ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { ImageBackgroundRemoverLayoutProps } from './ImageBackgroundRemoverLayout.tsx';
import type { ImageCompressLayoutProps } from './ImageCompressLayout.tsx';
import type { ImageCropLayoutProps } from './ImageCropLayout.tsx';
import type { ImageEnlargerLayoutProps } from './ImageEnlargerLayout.tsx';
import type { ImageFormatConverterLayoutProps } from './ImageFormatConverterLayout.tsx';
import type { ImageMetadataLayoutProps } from './ImageMetadataLayout.tsx';
import type { ImageResizeLayoutProps } from './ImageResizeLayout.tsx';
import type { ImageToPdfStudioProps } from './ImageToPdfStudio.tsx';
import type { ImageWatermarkLayoutProps } from './ImageWatermarkLayout.tsx';
import type { PassportPhotoLayoutProps } from './PassportPhotoLayout.tsx';
import type { PhotoSizeReducerLayoutProps } from './PhotoSizeReducerLayout.tsx';
import type { SignatureResizerLayoutProps } from './SignatureResizerLayout.tsx';

export function DynamicImageCropLayout(props: ImageCropLayoutProps) {
  const [Comp, setComp] = useState<ComponentType<ImageCropLayoutProps> | null>(null);

  useEffect(() => {
    void import('./ImageCropLayout.tsx').then((m) => {
      setComp(() => m.ImageCropLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}

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

export function DynamicImageToPdfLayout(props: ImageToPdfStudioProps) {
  const [Comp, setComp] = useState<ComponentType<ImageToPdfStudioProps> | null>(null);

  useEffect(() => {
    void import('./ImageToPdfStudio.tsx').then((m) => {
      setComp(() => m.ImageToPdfStudio);
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

export function DynamicImageEnlargerLayout(props: ImageEnlargerLayoutProps) {
  const [Comp, setComp] = useState<ComponentType<ImageEnlargerLayoutProps> | null>(null);

  useEffect(() => {
    void import('./ImageEnlargerLayout.tsx').then((m) => {
      setComp(() => m.ImageEnlargerLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}

export function DynamicPhotoSizeReducerLayout(props: PhotoSizeReducerLayoutProps) {
  const [Comp, setComp] = useState<ComponentType<PhotoSizeReducerLayoutProps> | null>(null);

  useEffect(() => {
    void import('./PhotoSizeReducerLayout.tsx').then((m) => {
      setComp(() => m.PhotoSizeReducerLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}

export function DynamicPassportPhotoLayout(props: PassportPhotoLayoutProps) {
  const [Comp, setComp] = useState<ComponentType<PassportPhotoLayoutProps> | null>(null);

  useEffect(() => {
    void import('./PassportPhotoLayout.tsx').then((m) => {
      setComp(() => m.PassportPhotoLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}

export function DynamicSignatureResizerLayout(props: SignatureResizerLayoutProps) {
  const [Comp, setComp] = useState<ComponentType<SignatureResizerLayoutProps> | null>(null);

  useEffect(() => {
    void import('./SignatureResizerLayout.tsx').then((m) => {
      setComp(() => m.SignatureResizerLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}

export function DynamicImageMetadataRemoverLayout(props: ImageMetadataLayoutProps) {
  const [Comp, setComp] = useState<ComponentType<ImageMetadataLayoutProps> | null>(null);

  useEffect(() => {
    void import('./ImageMetadataLayout.tsx').then((m) => {
      setComp(() => m.ImageMetadataLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}

export function DynamicImageWatermarkLayout(props: ImageWatermarkLayoutProps) {
  const [Comp, setComp] = useState<ComponentType<ImageWatermarkLayoutProps> | null>(null);

  useEffect(() => {
    void import('./ImageWatermarkLayout.tsx').then((m) => {
      setComp(() => m.ImageWatermarkLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}
