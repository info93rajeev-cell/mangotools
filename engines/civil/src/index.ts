import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { brickworkQuantity } from './operations/brickwork-quantity/operation.ts';
import { brickworkQuantityV2 } from './operations/brickwork-quantity-v2/operation.ts';
import { concreteQuantity } from './operations/concrete-quantity/operation.ts';
import { concreteQuantityV2 } from './operations/concrete-quantity-v2/operation.ts';
import { excavationVolume } from './operations/excavation-volume/operation.ts';
import { excavationVolumeV2 } from './operations/excavation-volume-v2/operation.ts';
import { paintQuantity } from './operations/paint-quantity/operation.ts';
import { paintQuantityV2 } from './operations/paint-quantity-v2/operation.ts';
import { plasterQuantity } from './operations/plaster-quantity/operation.ts';
import { plasterQuantityV2 } from './operations/plaster-quantity-v2/operation.ts';
import { tileQuantity } from './operations/tile-quantity/operation.ts';
import { tileQuantityV2 } from './operations/tile-quantity-v2/operation.ts';

export const engine: EngineModule = {
  engineId: 'civil',
  operations: [
    concreteQuantity,
    concreteQuantityV2,
    excavationVolume,
    excavationVolumeV2,
    brickworkQuantity,
    brickworkQuantityV2,
    plasterQuantity,
    plasterQuantityV2,
    tileQuantity,
    tileQuantityV2,
    paintQuantity,
    paintQuantityV2,
  ],
  messages,
};

export {
  brickworkQuantity,
  brickworkQuantityV2,
  concreteQuantity,
  concreteQuantityV2,
  excavationVolume,
  excavationVolumeV2,
  paintQuantity,
  paintQuantityV2,
  plasterQuantity,
  plasterQuantityV2,
  tileQuantity,
  tileQuantityV2,
};
