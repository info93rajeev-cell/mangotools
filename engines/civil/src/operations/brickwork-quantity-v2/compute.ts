import { ok, type Result } from '@mangotools/core';
import { add, div, mul, sub } from '@mangotools/engine-numeric';
import { checkDeductions, openingsArea } from '../../lib/openings.ts';
import { areaInM2, inMetres, ratioWithAllowance } from '../../lib/quantities.ts';
import type { Measured } from './measure.ts';

/** Exact (unrounded) values; the operation formats each output once. */
export interface Computed {
  grossAreaPerWallM2: string;
  openingAreaPerWallM2: string;
  grossWallAreaM2: string;
  openingAreaM2: string;
  netWallAreaM2: string;
  brickFaceM2: string;
  baseBricks: string;
  adjustedBricks: string;
  wastageBricks: string;
}

/**
 * Face-area brick count: net wall area ÷ ((brick length + joint) × (brick height + joint)), × the
 * number of brick skins (wythes), then the wastage allowance.
 */
export function computeBrickwork(m: Measured): Result<Computed> {
  const grossAreaPerWallM2 = mul(inMetres(m.wallLength, m.unit), inMetres(m.wallHeight, m.unit));
  const openingAreaPerWallM2 = areaInM2(openingsArea(m.openings), m.unit);
  const fits = checkDeductions(grossAreaPerWallM2, openingAreaPerWallM2);
  if (!fits.ok) return fits;
  const grossWallAreaM2 = mul(grossAreaPerWallM2, m.quantity);
  const openingAreaM2 = mul(openingAreaPerWallM2, m.quantity);
  const netWallAreaM2 = sub(grossWallAreaM2, openingAreaM2);
  const joint = m.mortarJoint;
  const brickFaceM2 = mul(
    inMetres(add(m.brickLength, joint), m.brickUnit),
    inMetres(add(m.brickHeight, joint), m.brickUnit),
  );
  const faces = mul(netWallAreaM2, m.wythes);
  const baseBricks = div(faces, brickFaceM2, 20);
  const adjustedBricks = ratioWithAllowance(faces, brickFaceM2, m.wastagePercent);
  return ok({
    grossAreaPerWallM2,
    openingAreaPerWallM2,
    grossWallAreaM2,
    openingAreaM2,
    netWallAreaM2,
    brickFaceM2,
    baseBricks,
    adjustedBricks,
    wastageBricks: sub(adjustedBricks, baseBricks),
  });
}
