import type { AnyOperation, OperationContext } from './contract.ts';
import { err, type Result } from './result.ts';

function issuePath(path: readonly PropertyKey[]): string {
  return path.map((p) => String(p)).join('.');
}

/**
 * Validates input and params against the descriptor, runs it, and validates the output.
 * The single execution path used by workers, fixture runners and the registry pipeline.
 */
export async function executeOperation(
  op: AnyOperation,
  rawInput: unknown,
  rawParams: unknown,
  ctx: OperationContext,
): Promise<Result<unknown>> {
  const input = op.input.safeParse(rawInput);
  if (!input.success) {
    const first = input.error.issues[0];
    return err('INVALID_INPUT', { path: first ? issuePath(first.path) : '' });
  }
  const params = op.params.safeParse(rawParams ?? {});
  if (!params.success) {
    const first = params.error.issues[0];
    return err('INVALID_PARAMS', { path: first ? issuePath(first.path) : '' });
  }
  let result: Result<unknown>;
  try {
    result = await op.run(input.data, params.data, ctx);
  } catch {
    return err('INTERNAL_ERROR');
  }
  if (result.ok && !op.output.safeParse(result.value).success) {
    return err('INTERNAL_ERROR', { details: { reason: 'output-schema' } });
  }
  return result;
}

export const PLATFORM_MESSAGES: Readonly<Record<string, string>> = {
  INVALID_INPUT: 'Some input is missing or has the wrong format.',
  INVALID_PARAMS: 'An option has an unsupported value.',
  INTERNAL_ERROR: 'Something went wrong while calculating. Please report this.',
  ABORTED: 'The calculation was cancelled.',
};
