import {
  type ContentFrontMatter,
  type ContentSection,
  contentFrontMatterSchema,
  type FaqItem,
  REQUIRED_SECTIONS,
} from '@mangotools/schemas';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { parse } from 'yaml';
import { type Issue, issue, zodIssues } from './issues.ts';

/** The subset of mdast this module reads. */
interface MdNode {
  type: string;
  children?: MdNode[];
  depth?: number;
  value?: string;
  url?: string;
  ordered?: boolean;
  data?: Record<string, unknown>;
  position?: { start: { line: number } };
}

export const SECTION_ORDER = [
  'How to use',
  'Method',
  'Worked example',
  'FAQ',
  'References',
] as const;

export interface ParsedContent {
  frontMatter: ContentFrontMatter;
  sections: ContentSection[];
  faq: FaqItem[];
}

export interface ContentContext {
  file: string;
  tier: keyof typeof REQUIRED_SECTIONS;
  /** Tool id → URL path, for resolving tool:<id> links. */
  toolUrls: Map<string, string>;
}

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;
const markdown = unified().use(remarkParse).use(remarkGfm);
const html = unified().use(remarkRehype).use(rehypeStringify);

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

export function plainText(node: MdNode): string {
  if (node.type === 'text' || node.type === 'inlineCode') return node.value ?? '';
  return (node.children ?? []).map(plainText).join('');
}

const at = (node: MdNode) => (node.position ? `line ${node.position.start.line}` : undefined);

const DISALLOWED: Record<string, string> = {
  html: 'Raw HTML is not allowed in content.',
  image: 'Images are not supported in tool content.',
  linkReference: 'Use inline links.',
  definition: 'Use inline links.',
};

/** Rewrites tool:<id> links to site paths. Outbound links are not used in Phase 1 content. */
function checkLink(node: MdNode, ctx: ContentContext): string | null {
  const url = node.url ?? '';
  if (url.startsWith('tool:')) {
    const target = ctx.toolUrls.get(url.slice(5));
    if (!target) return `Unknown tool reference "${url}".`;
    node.url = target;
    return null;
  }
  return url.startsWith('#')
    ? null
    : `Link "${url}" must be tool:<id>, an https:// URL or #anchor.`;
}

function nodeProblem(node: MdNode, ctx: ContentContext): { message: string; hint?: string } | null {
  const disallowed = DISALLOWED[node.type];
  if (disallowed) return { message: disallowed };
  const isText = node.type === 'text' || node.type === 'inlineCode';
  if (isText && /\bTODO\b/.test(node.value ?? '')) {
    return { message: 'Placeholder text left by the scaffolder.', hint: 'Replace the TODO text.' };
  }
  const linkProblem = node.type === 'link' ? checkLink(node, ctx) : null;
  return linkProblem ? { message: linkProblem } : null;
}

/** Checks links, raw HTML and placeholders in the whole tree. */
function checkNodes(node: MdNode, ctx: ContentContext, issues: Issue[]) {
  const problem = nodeProblem(node, ctx);
  if (problem)
    issues.push(
      issue(ctx.file, problem.message, {
        path: at(node),
        ...(problem.hint ? { hint: problem.hint } : {}),
      }),
    );
  for (const child of node.children ?? []) checkNodes(child, ctx, issues);
}

async function toHtml(nodes: MdNode[]): Promise<string> {
  const tree = await html.run({ type: 'root', children: nodes } as never);
  return String(html.stringify(tree as never));
}

function splitSections(root: MdNode, ctx: ContentContext, issues: Issue[]) {
  const sections: { title: string; nodes: MdNode[]; node: MdNode }[] = [];
  for (const node of root.children ?? []) {
    if (node.type === 'heading' && node.depth === 1) {
      issues.push(
        issue(ctx.file, 'Use ## for sections; the page provides the H1.', { path: at(node) }),
      );
    } else if (node.type === 'heading' && node.depth === 2) {
      sections.push({ title: plainText(node).trim(), nodes: [], node });
    } else if (sections.length === 0) {
      issues.push(
        issue(ctx.file, 'Content must start with a ## section heading.', { path: at(node) }),
      );
    } else sections[sections.length - 1]?.nodes.push(node);
  }
  return sections;
}

function checkSectionOrder(titles: string[], ctx: ContentContext, issues: Issue[]) {
  const known: readonly string[] = SECTION_ORDER;
  for (const title of titles) {
    if (!known.includes(title)) {
      issues.push(
        issue(ctx.file, `Unknown section "${title}".`, {
          hint: `Allowed: ${SECTION_ORDER.join(', ')}.`,
        }),
      );
    }
  }
  for (const required of REQUIRED_SECTIONS[ctx.tier]) {
    if (!titles.includes(required)) {
      issues.push(
        issue(ctx.file, `Missing required section "## ${required}" for tier ${ctx.tier}.`),
      );
    }
  }
  const positions = titles.filter((t) => known.includes(t)).map((t) => known.indexOf(t));
  if (positions.some((p, i) => i > 0 && p <= (positions[i - 1] ?? -1))) {
    issues.push(
      issue(ctx.file, 'Sections are out of order or repeated.', {
        hint: `Use this order: ${SECTION_ORDER.join(', ')}.`,
      }),
    );
  }
}

async function parseFaq(nodes: MdNode[], ctx: ContentContext, issues: Issue[]): Promise<FaqItem[]> {
  const items: { question: string; nodes: MdNode[] }[] = [];
  for (const node of nodes) {
    if (node.type === 'heading' && node.depth === 3)
      items.push({ question: plainText(node).trim(), nodes: [] });
    else if (items.length === 0)
      issues.push(issue(ctx.file, 'FAQ text must follow a ### question.', { path: at(node) }));
    else items[items.length - 1]?.nodes.push(node);
  }
  if (items.length < 2) issues.push(issue(ctx.file, 'FAQ needs at least two ### questions.'));
  const faq: FaqItem[] = [];
  for (const item of items) {
    if (!item.question.endsWith('?'))
      issues.push(issue(ctx.file, `FAQ heading "${item.question}" must be a question.`));
    if (item.nodes.length === 0)
      issues.push(issue(ctx.file, `FAQ "${item.question}" has no answer.`));
    faq.push({
      id: `faq-${slugify(item.question)}`,
      question: item.question,
      answerHtml: await toHtml(item.nodes),
      answerText: item.nodes.map(plainText).join('\n\n').trim(),
    });
  }
  return faq;
}

function readFrontMatter(text: string, ctx: ContentContext, issues: Issue[]) {
  const match = FRONT_MATTER.exec(text);
  if (!match) {
    issues.push(
      issue(ctx.file, 'Missing front matter.', {
        hint: 'Start with ---, lastReviewed: YYYY-MM-DD, ---.',
      }),
    );
    return { frontMatter: null, body: text };
  }
  const parsed = contentFrontMatterSchema.safeParse(parse(match[1] ?? '', { version: '1.2' }));
  if (!parsed.success) issues.push(...zodIssues(ctx.file, parsed.error));
  return { frontMatter: parsed.success ? parsed.data : null, body: text.slice(match[0].length) };
}

/** Parses and validates a tool's content.md. */
export async function parseContent(text: string, ctx: ContentContext) {
  const issues: Issue[] = [];
  const { frontMatter, body } = readFrontMatter(text, ctx, issues);
  const root = markdown.parse(body) as unknown as MdNode;
  checkNodes(root, ctx, issues);
  const raw = splitSections(root, ctx, issues);
  checkSectionOrder(
    raw.map((s) => s.title),
    ctx,
    issues,
  );
  const sections: ContentSection[] = [];
  let faq: FaqItem[] = [];
  for (const s of raw) {
    if (s.title === 'FAQ') faq = await parseFaq(s.nodes, ctx, issues);
    if (s.title === 'How to use' && !s.nodes.some((n) => n.type === 'list' && n.ordered)) {
      issues.push(
        issue(ctx.file, '"How to use" needs a numbered list of steps.', { path: at(s.node) }),
      );
    }
    sections.push({
      id: slugify(s.title),
      title: s.title,
      html: s.title === 'FAQ' ? '' : await toHtml(s.nodes),
    });
  }
  const content: ParsedContent | null = frontMatter ? { frontMatter, sections, faq } : null;
  return { content, issues };
}
