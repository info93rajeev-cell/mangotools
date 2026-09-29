/**
 * The tool-page privacy badge. It is shown only when the registry's evidence-based `processing`
 * says the tool runs on the device; any other value shows no badge rather than a weaker claim.
 */
import type { Processing } from '@mangotools/schemas';
import { t } from '../strings/en.ts';

export interface PrivacyBadge {
  label: string;
  detail: string;
}

export function privacyBadge(processing: Processing): PrivacyBadge | null {
  if (processing !== 'device') return null;
  return { label: t('privacy.badge'), detail: t('privacy.detail') };
}
