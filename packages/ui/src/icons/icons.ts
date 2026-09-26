/**
 * Lucide icons (ISC) inlined as SVG strings. Only the icons listed here are bundled. Stroke width
 * is set to 1.5 and the SVG is hidden from assistive technology; labels go on the control.
 */
import {
  ArrowLeftRight,
  ArrowRight,
  Braces,
  Briefcase,
  Check,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  ClipboardPaste,
  Container,
  Copy,
  Download,
  FileText,
  FileUp,
  HardHat,
  Image,
  Info,
  Lock,
  Monitor,
  Moon,
  Printer,
  RotateCcw,
  Ruler,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  TriangleAlert,
  Wrench,
  X,
} from 'lucide-static';

const RAW = {
  'arrow-left-right': ArrowLeftRight,
  'arrow-right': ArrowRight,
  braces: Braces,
  briefcase: Briefcase,
  check: Check,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'circle-alert': CircleAlert,
  'circle-check': CircleCheck,
  'clipboard-paste': ClipboardPaste,
  container: Container,
  copy: Copy,
  download: Download,
  'file-text': FileText,
  'file-up': FileUp,
  'hard-hat': HardHat,
  image: Image,
  info: Info,
  lock: Lock,
  monitor: Monitor,
  moon: Moon,
  printer: Printer,
  'rotate-ccw': RotateCcw,
  ruler: Ruler,
  search: Search,
  'shield-check': ShieldCheck,
  sparkles: Sparkles,
  sun: Sun,
  'triangle-alert': TriangleAlert,
  wrench: Wrench,
  x: X,
} as const;

export type IconName = keyof typeof RAW;

export const ICON_NAMES = Object.keys(RAW) as IconName[];

const cache = new Map<string, string>();

/** Normalised SVG markup for an icon (unknown names fall back to "info"). */
export function iconSvg(name: string): string {
  const cached = cache.get(name);
  if (cached) return cached;
  const raw = (RAW as Record<string, string>)[name] ?? RAW.info;
  const svg = raw
    .replace(/\s+class="[^"]*"/, '')
    .replace(/stroke-width="2"/, 'stroke-width="1.5"')
    .replace('<svg', '<svg aria-hidden="true" focusable="false"')
    .replace(/\n\s*/g, ' ')
    .trim();
  cache.set(name, svg);
  return svg;
}

export const isIconName = (name: string): name is IconName => name in RAW;
