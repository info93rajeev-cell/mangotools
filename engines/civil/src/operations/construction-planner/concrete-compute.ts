/**
 * Geometric concrete volume calculations using exact decimal arithmetic.
 */
import { div, mul } from '@mangotools/engine-numeric';
import type { ConstructionMemberInput } from './types.ts';

/**
 * Computes member volume in cubic metres (m3) for a single member instance.
 */
export function computeSingleMemberConcreteVolumeM3(member: ConstructionMemberInput): string {
  switch (member.memberType) {
    case 'footing': {
      const l = div(String(member.lengthMm.value), '1000', 10);
      const w = div(String(member.widthMm.value), '1000', 10);
      const d = div(String(member.depthMm.value), '1000', 10);
      return mul(mul(l, w), d);
    }
    case 'column': {
      const w = div(String(member.widthMm.value), '1000', 10);
      const d = div(String(member.depthMm.value), '1000', 10);
      const h = div(String(member.heightMm.value), '1000', 10);
      return mul(mul(w, d), h);
    }
    case 'beam': {
      const w = div(String(member.widthMm.value), '1000', 10);
      const d = div(String(member.depthMm.value), '1000', 10);
      const l = div(String(member.lengthMm.value), '1000', 10);
      return mul(mul(w, d), l);
    }
    case 'slab': {
      const l = div(String(member.lengthMm.value), '1000', 10);
      const w = div(String(member.widthMm.value), '1000', 10);
      const t = div(String(member.thicknessMm.value), '1000', 10);
      return mul(mul(l, w), t);
    }
  }
}

/**
 * Computes total concrete volume for all instances of a member.
 */
export function computeTotalMemberConcreteVolumeM3(
  member: ConstructionMemberInput,
  volumePerMemberM3: string,
): string {
  return mul(volumePerMemberM3, String(member.count.value));
}
