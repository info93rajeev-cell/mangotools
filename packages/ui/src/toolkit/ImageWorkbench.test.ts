import type { VNode } from 'preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Button } from '../primitives/Button.tsx';
import { ImageWorkbench, type ImageWorkbenchProps } from './ImageWorkbench.tsx';
import { handleMoveKey, handleResizeKey, useWorkbenchDrag } from './imageWorkbenchDrag.ts';

const hooks = vi.hoisted(() => ({
  values: [] as unknown[],
  effects: [] as (() => void)[],
  index: 0,
}));

vi.mock('preact/hooks', () => ({
  useRef: (initial: unknown) => ({ current: initial }),
  useMemo: (fn: () => unknown) => fn(),
  useState: (initial: unknown) => {
    const index = hooks.index++;
    if (!(index in hooks.values)) {
      hooks.values[index] = typeof initial === 'function' ? (initial as () => unknown)() : initial;
    }
    return [
      hooks.values[index],
      (next: unknown) => {
        hooks.values[index] =
          typeof next === 'function'
            ? (next as (prev: unknown) => unknown)(hooks.values[index])
            : next;
      },
    ];
  },
  useEffect: (effect: () => void) => hooks.effects.push(effect),
}));

type ElementNode = VNode<Record<string, unknown>>;

function collectNodes(node: unknown): ElementNode[] {
  if (Array.isArray(node)) return node.flatMap(collectNodes);
  if (!node || typeof node !== 'object' || !('type' in node)) return [];
  const el = node as ElementNode;
  if (typeof el.type === 'function' && el.type !== Button) {
    return [el, ...collectNodes((el.type as (p: unknown) => unknown)(el.props))];
  }
  const children = el.props?.children ? collectNodes(el.props.children) : [];
  return [el, ...children];
}

describe('ImageWorkbench Component & Interactions', () => {
  const bounds = { width: 1000, height: 800 };
  const baseProps: ImageWorkbenchProps = {
    imageSrc: 'blob:http://localhost/test-image.jpg',
    imageAlt: 'Test uploaded photo',
    sourceWidth: 1000,
    sourceHeight: 800,
  };

  beforeEach(() => {
    hooks.values = [];
    hooks.effects = [];
    hooks.index = 0;
  });

  describe('Component VNode rendering', () => {
    it('renders workbench structure with image, selection, and 8 handles', () => {
      hooks.index = 0;
      const vnode = ImageWorkbench(baseProps) as VNode;
      const nodes = collectNodes(vnode);

      const img = nodes.find((n) => n.type === 'img');
      expect(img).toBeDefined();
      expect(img?.props.src).toBe(baseProps.imageSrc);
      expect(img?.props.alt).toBe(baseProps.imageAlt);

      const selection = nodes.find((n) => n.type === 'section');
      expect(selection).toBeDefined();

      const handles = nodes.filter((n) => n.props?.role === 'slider');
      expect(handles).toHaveLength(8);
    });

    it('renders aspect ratio controls and reset button by default', () => {
      hooks.index = 0;
      const vnode = ImageWorkbench(baseProps) as VNode;
      const nodes = collectNodes(vnode);

      const fieldset = nodes.find((n) => n.type === 'fieldset');
      expect(fieldset).toBeDefined();

      const buttons = nodes.filter((n) => n.type === 'button' || n.type === Button);
      // 5 ratio buttons (free, 1:1, 4:3, 16:9, 35:45) + 1 Button (reset button)
      expect(buttons.length).toBeGreaterThanOrEqual(6);
    });

    it('renders custom selection and image overlays when provided', () => {
      hooks.index = 0;
      const selectionOverlaySpy = vi.fn(() => ({
        type: 'div',
        props: { 'data-testid': 'custom-face-oval' },
      }));
      const imageOverlaySpy = vi.fn(() => ({
        type: 'div',
        props: { 'data-testid': 'custom-ink-bounds' },
      }));

      const vnode = ImageWorkbench({
        ...baseProps,
        renderSelectionOverlay: selectionOverlaySpy,
        renderImageOverlay: imageOverlaySpy,
      }) as VNode;

      const nodes = collectNodes(vnode);
      expect(selectionOverlaySpy).toHaveBeenCalled();
      expect(imageOverlaySpy).toHaveBeenCalled();
      expect(nodes.some((n) => n.props?.['data-testid'] === 'custom-face-oval')).toBe(true);
      expect(nodes.some((n) => n.props?.['data-testid'] === 'custom-ink-bounds')).toBe(true);
    });

    it('renders with controlled value and updates displayed position', () => {
      hooks.index = 0;
      const controlledRect = { x: 50, y: 60, width: 300, height: 400 };
      const vnode = ImageWorkbench({
        ...baseProps,
        value: controlledRect,
      }) as VNode;
      const nodes = collectNodes(vnode);

      const selection = nodes.find((n) => n.type === 'section');
      expect(selection?.props?.style).toMatchObject({
        left: '50px',
        top: '60px',
        width: '300px',
        height: '400px',
      });
    });
  });

  describe('Keyboard accessibility navigation', () => {
    it('moves selection by 1px with plain arrow keys', () => {
      const rect = { x: 100, y: 100, width: 200, height: 200 };
      const onUpdate = vi.fn();

      const eventRight = {
        key: 'ArrowRight',
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;
      handleMoveKey(eventRight, rect, bounds, onUpdate);
      expect(onUpdate).toHaveBeenCalledWith({ x: 101, y: 100, width: 200, height: 200 });

      const eventDown = {
        key: 'ArrowDown',
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;
      handleMoveKey(eventDown, rect, bounds, onUpdate);
      expect(onUpdate).toHaveBeenCalledWith({ x: 100, y: 101, width: 200, height: 200 });
    });

    it('moves selection by 10px with Shift + arrow keys', () => {
      const rect = { x: 100, y: 100, width: 200, height: 200 };
      const onUpdate = vi.fn();

      const eventLeft = {
        key: 'ArrowLeft',
        shiftKey: true,
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;
      handleMoveKey(eventLeft, rect, bounds, onUpdate);
      expect(onUpdate).toHaveBeenCalledWith({ x: 90, y: 100, width: 200, height: 200 });
    });

    it('resizes selection with arrow keys on focused handles', () => {
      const rect = { x: 100, y: 100, width: 200, height: 200 };
      const onUpdate = vi.fn();

      const eventRight = {
        key: 'ArrowRight',
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;
      handleResizeKey(eventRight, 'se', rect, bounds, 'free', 10, onUpdate);
      expect(onUpdate).toHaveBeenCalledWith({ x: 100, y: 100, width: 201, height: 200 });
    });
  });

  describe('Pointer dragging & resizing session', () => {
    it('handles moving selection via pointer session', () => {
      const rect = { x: 100, y: 100, width: 200, height: 200 };
      const onUpdate = vi.fn();

      const target = {
        setPointerCapture: vi.fn(),
        releasePointerCapture: vi.fn(),
      } as unknown as HTMLElement;

      const drag = useWorkbenchDrag({
        rect,
        scale: 1,
        bounds,
        ratio: 'free',
        minSize: 10,
        onUpdate,
      });

      const down = {
        pointerId: 1,
        clientX: 150,
        clientY: 150,
        currentTarget: target,
        stopPropagation: vi.fn(),
      } as unknown as PointerEvent;
      drag.onMoveStart(down);
      expect(target.setPointerCapture).toHaveBeenCalledWith(1);

      const move = {
        pointerId: 1,
        clientX: 180,
        clientY: 170,
      } as unknown as PointerEvent;
      drag.onPointerMove(move);
      expect(onUpdate).toHaveBeenCalledWith({ x: 130, y: 120, width: 200, height: 200 });

      const up = {
        pointerId: 1,
        currentTarget: target,
      } as unknown as PointerEvent;
      drag.onPointerUp(up);
      expect(target.releasePointerCapture).toHaveBeenCalledWith(1);
    });

    it('handles resizing handle via pointer session', () => {
      const rect = { x: 100, y: 100, width: 200, height: 200 };
      const onUpdate = vi.fn();

      const target = {
        setPointerCapture: vi.fn(),
        releasePointerCapture: vi.fn(),
      } as unknown as HTMLElement;

      const drag = useWorkbenchDrag({
        rect,
        scale: 0.5,
        bounds,
        ratio: 'free',
        minSize: 10,
        onUpdate,
      });

      const down = {
        pointerId: 2,
        clientX: 200,
        clientY: 200,
        currentTarget: target,
        stopPropagation: vi.fn(),
      } as unknown as PointerEvent;
      drag.onHandleStart(down, 'se');

      // Pointer moves 20px in display space at scale 0.5 -> 40px in source space
      const move = {
        pointerId: 2,
        clientX: 220,
        clientY: 210,
      } as unknown as PointerEvent;
      drag.onPointerMove(move);
      expect(onUpdate).toHaveBeenCalledWith({ x: 100, y: 100, width: 240, height: 220 });
    });

    it('ignores pointer events when disabled', () => {
      const rect = { x: 100, y: 100, width: 200, height: 200 };
      const onUpdate = vi.fn();
      const target = { setPointerCapture: vi.fn() } as unknown as HTMLElement;

      const drag = useWorkbenchDrag({
        rect,
        scale: 1,
        bounds,
        ratio: 'free',
        minSize: 10,
        disabled: true,
        onUpdate,
      });

      const down = {
        pointerId: 1,
        clientX: 150,
        clientY: 150,
        currentTarget: target,
        stopPropagation: vi.fn(),
      } as unknown as PointerEvent;
      drag.onMoveStart(down);
      expect(target.setPointerCapture).not.toHaveBeenCalled();
    });
  });
});
