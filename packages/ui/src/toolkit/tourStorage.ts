export interface TourStep {
  id: string;
  targetSelector: string;
  stepNumber: number;
  title: string;
  description: string;
  hint?: string;
  preferredPlacement?: 'top' | 'bottom' | 'left' | 'right';
}

export interface ToolOnboardingTourProps {
  toolId: string;
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const STORAGE_PREFIX = 'mt.tour.';

export function isTourCompleted(toolId: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return true;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${toolId}`);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed.completed);
  } catch {
    return false;
  }
}

export function markTourCompleted(toolId: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(
      `${STORAGE_PREFIX}${toolId}`,
      JSON.stringify({ completed: true, seenAt: Date.now() }),
    );
  } catch {
    // Ignore localStorage write quota issues
  }
}
