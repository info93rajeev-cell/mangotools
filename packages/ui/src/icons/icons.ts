/**
 * Lucide icons (ISC) inlined as SVG strings. Only the icons listed here are bundled. Stroke width
 * is set to 1.5 and the SVG is hidden from assistive technology; labels go on the control.
 */
import {
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  Box,
  Braces,
  Briefcase,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  ClipboardPaste,
  Coins,
  Container,
  Copy,
  Download,
  Ellipsis,
  FileOutput,
  FileText,
  FileUp,
  GripVertical,
  HardHat,
  Image,
  Info,
  LayoutGrid,
  Link,
  Lock,
  Monitor,
  Moon,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Route,
  Ruler,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  TriangleAlert,
  Weight,
  Wrench,
  X,
} from 'lucide-static';

const RAW = {
  'book-open': BookOpen,
  'circle-help': CircleHelp,
  link: Link,
  weight: Weight,
  'arrow-left-right': ArrowLeftRight,
  'arrow-right': ArrowRight,
  box: Box,
  braces: Braces,
  briefcase: Briefcase,
  check: Check,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  'circle-alert': CircleAlert,
  'circle-check': CircleCheck,
  'clipboard-paste': ClipboardPaste,
  coins: Coins,
  container: Container,
  copy: Copy,
  download: Download,
  ellipsis: Ellipsis,
  'file-output': FileOutput,
  'file-text': FileText,
  'file-up': FileUp,
  'grip-vertical': GripVertical,
  'hard-hat': HardHat,
  image: Image,
  info: Info,
  'layout-grid': LayoutGrid,
  lock: Lock,
  monitor: Monitor,
  moon: Moon,
  plus: Plus,
  printer: Printer,
  'refresh-cw': RefreshCw,
  'rotate-ccw': RotateCcw,
  route: Route,
  ruler: Ruler,
  search: Search,
  settings: Settings,
  'shield-check': ShieldCheck,
  sparkles: Sparkles,
  sun: Sun,
  'trash-2': Trash2,
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
