import type { z } from 'zod';
import type { Result } from './result.ts';

/** Structural subset of AbortSignal, so engines need no DOM types. */
export interface ContextSignal {
  readonly aborted: boolean;
}

/** The only way an engine touches the outside world. */
export interface OperationContext {
  /** Current time in milliseconds since the Unix epoch. */
  clock(): number;
  /** Random bytes. Fixtures supply a seeded source. */
  random(byteLength: number): Uint8Array;
  signal: ContextSignal;
  /** Structured log: codes and numbers only, never user content. */
  log(code: string, details?: Record<string, string | number | boolean>): void;
}

export type Runtime = 'worker' | 'node';
export type DataClass = 'public' | 'personal' | 'sensitive';

export interface OperationDescriptor<I = unknown, P = unknown, O = unknown> {
  id: string;
  major: number;
  title: string;
  summary: string;
  input: z.ZodType<I>;
  params: z.ZodType<P>;
  output: z.ZodType<O>;
  errors: readonly string[];
  runtimes: readonly Runtime[];
  cost: { weight: 'light' | 'medium' | 'heavy' };
  exposure: 'internal';
  dataClass: DataClass;
  run(input: I, params: P, ctx: OperationContext): Result<O> | Promise<Result<O>>;
}

// biome-ignore lint/suspicious/noExplicitAny: descriptors are stored heterogeneously in registries.
export type AnyOperation = OperationDescriptor<any, any, any>;

/** What every engine package exports from its index. */
export interface EngineModule {
  engineId: string;
  operations: readonly AnyOperation[];
  /** English messages for every error and warning code, with {placeholders} for details. */
  messages: Readonly<Record<string, string>>;
}

export function defineOperation<I, P, O>(
  descriptor: OperationDescriptor<I, P, O>,
): OperationDescriptor<I, P, O> {
  return descriptor;
}

/** Splits "estimate.tax.gst@1" into its id and major version. */
export function parseOperationRef(ref: string): { id: string; major: number; engineId: string } {
  const match = /^([a-z0-9]+)((?:\.[a-z0-9-]+)+)@([1-9][0-9]*)$/.exec(ref);
  if (!match) throw new Error(`Invalid operation reference: ${ref}`);
  const engineId = match[1] ?? '';
  return { id: `${engineId}${match[2] ?? ''}`, major: Number(match[3]), engineId };
}
