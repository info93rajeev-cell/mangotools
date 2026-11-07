import { useEffect, useRef } from 'preact/hooks';

export const FOCUSABLE_SELECTOR =
  'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const nodes = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  return Array.from(nodes).filter((el) => {
    if (el.hasAttribute('disabled')) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    return el.tabIndex >= 0;
  });
}

export function handleTabNavigation(e: KeyboardEvent, container: HTMLElement): void {
  const items = getFocusableElements(container);
  if (items.length === 0) {
    e.preventDefault();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement as HTMLElement | null;
  const isInside = active ? items.includes(active) : false;

  if (e.shiftKey) {
    if (!isInside || active === first) {
      e.preventDefault();
      last?.focus();
    }
  } else {
    if (!isInside || active === last) {
      e.preventDefault();
      first?.focus();
    }
  }
}

export interface UseDialogFocusTrapOptions {
  isOpen: boolean;
  modalRef: { current: HTMLElement | null };
  initialFocusRef?: { current: HTMLElement | null };
  onClose: () => void;
  fallbackOpenerSelector?: string;
}

export function useDialogFocusTrap({
  isOpen,
  modalRef,
  initialFocusRef,
  onClose,
  fallbackOpenerSelector = '[data-paste-excel]',
}: UseDialogFocusTrapOptions) {
  const openerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const restoreFocus = () => {
    const target =
      (openerRef.current?.isConnected ? openerRef.current : null) ??
      document.querySelector<HTMLElement>(fallbackOpenerSelector);
    openerRef.current = null;
    if (target) {
      target.focus();
      setTimeout(() => {
        if (document.activeElement !== target && target.isConnected) {
          target.focus();
        }
      }, 0);
    }
  };

  const handleClose = () => {
    restoreFocus();
    onCloseRef.current();
  };

  useEffect(() => {
    if (isOpen) {
      if (document.activeElement instanceof HTMLElement) {
        openerRef.current = document.activeElement;
      }
      const timer = setTimeout(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else if (modalRef.current) {
          const items = getFocusableElements(modalRef.current);
          items[0]?.focus();
        }
      }, 50);

      const handleFocusIn = (e: FocusEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          const items = getFocusableElements(modalRef.current);
          items[0]?.focus();
        }
      };

      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          handleClose();
        } else if (e.key === 'Tab' && modalRef.current) {
          handleTabNavigation(e, modalRef.current);
        }
      };

      document.addEventListener('focusin', handleFocusIn);
      window.addEventListener('keydown', handleKey);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('focusin', handleFocusIn);
        window.removeEventListener('keydown', handleKey);
      };
    }
    if (openerRef.current) {
      restoreFocus();
    }
  }, [isOpen]);

  return {
    handleClose,
    restoreFocus,
  };
}
