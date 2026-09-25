import { canonicalHash } from '@mangotools/core';
import { getWorkerHost } from '@mangotools/runtime';
import { useEffect, useState } from 'preact/hooks';

export interface DeterminismCase {
  id: string;
  operation: string;
  input: unknown;
  params: unknown;
}

/**
 * Development-only: runs every engine fixture through the real module workers and prints the
 * canonical SHA-256 of each outcome. tests/determinism compares these with Node.
 */
export function DeterminismHarness({ cases }: { cases: DeterminismCase[] }) {
  const [results, setResults] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    const run = async () => {
      const host = getWorkerHost();
      const out: Record<string, string> = {};
      for (const c of cases) {
        const outcome = await host.run(c.operation, c.input, c.params);
        out[c.id] = await canonicalHash(outcome);
      }
      setResults(out);
    };
    void run();
  }, [cases]);
  return (
    <pre id="determinism-results" data-done={results ? 'true' : 'false'}>
      {results ? JSON.stringify(results, null, 2) : `Running ${cases.length} fixtures…`}
    </pre>
  );
}
