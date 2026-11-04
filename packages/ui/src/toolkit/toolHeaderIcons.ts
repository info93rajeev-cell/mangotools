/** Large tinted icon shown left of a tool's H1, as in the approved visual references. */
export interface ToolHeaderIcon {
  name: string;
  tone: 'purple' | 'blue' | 'red' | 'green' | 'amber';
}

const ICONS: Readonly<Record<string, ToolHeaderIcon>> = {
  'compress-pdf': { name: 'file-archive', tone: 'purple' },
  'pdf-merge': { name: 'files', tone: 'purple' },
};

export function toolHeaderIcon(slug: string): ToolHeaderIcon | undefined {
  return ICONS[slug];
}
