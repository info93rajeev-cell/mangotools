import { type OpWarning, warning } from '@mangotools/core';

import type { ReadContainer } from './read-container.ts';

const info = (code: string) => warning(code, { details: { severity: 'info' } });

export interface NoticeFacts {
  container: ReadContainer;
  status: 'complete' | 'partial' | 'none';
  unloadedPieces: number;
  containers: number;
  weightStatus: 'complete' | 'partial' | 'none';
  weightLimitReached: boolean;
}

/** Standing planning notices first, then the notices this particular result needs. */
export function loadNotices(f: NoticeFacts): OpWarning[] {
  const notices: OpWarning[] = [info('LOGISTICS_LOAD_PLANNING_AID')];
  if (f.container.type !== 'custom') notices.push(info('LOGISTICS_CONTAINER_NOMINAL_REFERENCE'));
  notices.push(info('LOGISTICS_CONTAINER_VERIFY_PROFESSIONAL'));
  if (f.status !== 'complete') {
    notices.push(warning('LOGISTICS_LOAD_PARTIAL', { details: { unloaded: f.unloadedPieces } }));
  }
  if (f.containers > 1) {
    notices.push(
      warning('LOGISTICS_LOAD_MULTIPLE_CONTAINERS', { details: { containers: f.containers } }),
    );
  }
  if (f.weightLimitReached) notices.push(warning('LOGISTICS_LOAD_WEIGHT_LIMIT_REACHED'));
  if (f.container.stackHeightAboveContainer)
    notices.push(warning('LOGISTICS_LOAD_STACK_HEIGHT_ABOVE_CONTAINER'));
  if (f.container.payloadKg !== null && f.weightStatus === 'partial') {
    notices.push(warning('LOGISTICS_LOAD_WEIGHTS_INCOMPLETE'));
  }
  if (f.container.payloadKg === null && f.weightStatus !== 'none') {
    notices.push(info('LOGISTICS_LOAD_PAYLOAD_NOT_CHECKED'));
  }
  return notices;
}
