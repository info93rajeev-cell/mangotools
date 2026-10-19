import type { AspectRatioPreset, PixelRect } from '@mangotools/ui';
import { Button, ImageWorkbench } from '@mangotools/ui';
import { useState } from 'preact/hooks';

const IMG_STANDARD =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="800" viewBox="0 0 1000 800"><rect width="1000" height="800" fill="%2338bdf8"/><circle cx="500" cy="400" r="200" fill="%23f43f5e"/></svg>';

const IMG_HIGHRES =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4032" height="3024" viewBox="0 0 4032 3024"><rect width="4032" height="3024" fill="%230284c7"/><circle cx="2016" cy="1512" r="800" fill="%2310b981"/></svg>';

const IMG_ALT =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="%23a855f7"/></svg>';

type Scenario = 'standard' | 'highres' | 'alt';

function FaceOverlay() {
  return (
    <div
      data-testid="overlay-face-oval"
      style={{
        position: 'absolute',
        inset: 0,
        border: '2px dashed #38bdf8',
        borderRadius: '50%',
        pointerEvents: 'none',
      }}
    />
  );
}

function InkOverlay() {
  return (
    <div
      data-testid="overlay-ink-box"
      style={{
        position: 'absolute',
        left: '10px',
        top: '10px',
        width: '80px',
        height: '40px',
        border: '2px solid red',
        pointerEvents: 'none',
      }}
    />
  );
}

interface ControlsProps {
  onScenario: (s: Scenario) => void;
  isControlled: boolean;
  onToggleControlled: () => void;
  onSetRect: () => void;
  onSetRatio: () => void;
}

function HarnessControls({
  onScenario,
  isControlled,
  onToggleControlled,
  onSetRect,
  onSetRatio,
}: ControlsProps) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
      <Button size="sm" onClick={() => onScenario('standard')} data-testid="btn-standard">
        Standard 1000x800
      </Button>
      <Button size="sm" onClick={() => onScenario('highres')} data-testid="btn-highres">
        Highres 4032x3024
      </Button>
      <Button size="sm" onClick={() => onScenario('alt')} data-testid="btn-alt">
        Alt Image
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={onToggleControlled}
        data-testid="btn-toggle-controlled"
      >
        {isControlled ? 'Mode: Controlled' : 'Mode: Uncontrolled'}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={onSetRect}
        data-testid="btn-set-controlled-rect"
      >
        Set External Rect
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={onSetRatio}
        data-testid="btn-set-controlled-ratio-1-1"
      >
        Set External 1:1
      </Button>
    </div>
  );
}

export function ImageWorkbenchHarness() {
  const [scenario, setScenario] = useState<Scenario>('standard');
  const [isControlled, setIsControlled] = useState(false);
  const [controlledRect, setControlledRect] = useState<PixelRect>({
    x: 100,
    y: 100,
    width: 300,
    height: 300,
  });
  const [controlledRatio, setControlledRatio] = useState<AspectRatioPreset>('free');

  const [currentRect, setCurrentRect] = useState<PixelRect>({ x: 0, y: 0, width: 0, height: 0 });
  const [activeRatio, setActiveRatio] = useState<AspectRatioPreset>('free');
  const [updateCount, setUpdateCount] = useState(0);

  const imageSrc =
    scenario === 'highres' ? IMG_HIGHRES : scenario === 'alt' ? IMG_ALT : IMG_STANDARD;
  const sourceWidth = scenario === 'highres' ? 4032 : scenario === 'alt' ? 600 : 1000;
  const sourceHeight = scenario === 'highres' ? 3024 : scenario === 'alt' ? 600 : 800;

  const handleChange = (next: PixelRect) => {
    setCurrentRect(next);
    setUpdateCount((c) => c + 1);
    if (isControlled) setControlledRect(next);
  };

  const activeRect = isControlled ? controlledRect : currentRect;

  return (
    <div
      data-testid="workbench-harness"
      data-scenario={scenario}
      data-source-x={activeRect.x}
      data-source-y={activeRect.y}
      data-source-w={activeRect.width}
      data-source-h={activeRect.height}
      data-active-ratio={isControlled ? controlledRatio : activeRatio}
      data-update-count={updateCount}
      data-controlled={String(isControlled)}
    >
      <HarnessControls
        onScenario={setScenario}
        isControlled={isControlled}
        onToggleControlled={() => setIsControlled(!isControlled)}
        onSetRect={() => setControlledRect({ x: 120, y: 140, width: 350, height: 280 })}
        onSetRatio={() => setControlledRatio('1:1')}
      />

      <ImageWorkbench
        imageSrc={imageSrc}
        imageAlt="Test workbench source"
        sourceWidth={sourceWidth}
        sourceHeight={sourceHeight}
        value={isControlled ? controlledRect : undefined}
        aspectRatio={isControlled ? controlledRatio : undefined}
        onChange={handleChange}
        onAspectRatioChange={setActiveRatio}
        renderSelectionOverlay={FaceOverlay}
        renderImageOverlay={InkOverlay}
      />
    </div>
  );
}
