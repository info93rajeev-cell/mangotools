import type { z } from 'zod';

/** One validation problem, always tied to a repository file and, when known, a data path. */
export interface Issue {
  file: string;
  path?: string;
  message: string;
  hint?: string;
}

export function issue(file: string, message: string, extra: Omit<Issue, 'file' | 'message'> = {}) {
  return { file, message, ...extra } satisfies Issue;
}

export function zodIssues(file: string, error: z.ZodError, hint?: string): Issue[] {
  return error.issues.map((i) => ({
    file,
    path: i.path.map(String).join('.') || undefined,
    message: i.message,
    ...(hint ? { hint } : {}),
  }));
}

export function formatIssue(i: Issue): string {
  const where = i.path ? `${i.file} › ${i.path}` : i.file;
  return `✗ ${where}\n    ${i.message}${i.hint ? `\n    fix: ${i.hint}` : ''}`;
}
