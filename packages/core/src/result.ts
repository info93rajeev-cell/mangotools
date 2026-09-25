/** Scalar detail values allowed in errors and warnings. Never user content beyond short enums. */
export type DetailValue = string | number | boolean;

export interface OpError {
  code: string;
  path?: string;
  messageKey: string;
  details?: Record<string, DetailValue>;
}

export type OpWarning = OpError;

export type Result<T> =
  | { ok: true; value: T; warnings: OpWarning[] }
  | { ok: false; error: OpError };

export function ok<T>(value: T, warnings: OpWarning[] = []): Result<T> {
  return { ok: true, value, warnings };
}

export function err<T = never>(
  code: string,
  options: { path?: string; details?: Record<string, DetailValue> } = {},
): Result<T> {
  const error: OpError = { code, messageKey: `errors.${code}` };
  if (options.path !== undefined) error.path = options.path;
  if (options.details !== undefined) error.details = options.details;
  return { ok: false, error };
}

export function warning(
  code: string,
  options: { path?: string; details?: Record<string, DetailValue> } = {},
): OpWarning {
  const w: OpWarning = { code, messageKey: `errors.${code}` };
  if (options.path !== undefined) w.path = options.path;
  if (options.details !== undefined) w.details = options.details;
  return w;
}
