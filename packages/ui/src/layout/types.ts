/** A category link in the header menu and footer. */
export interface NavCategory {
  name: string;
  url: string;
}

/** Minimal tool data for cards and recent-tool lists. */
export interface ToolLink {
  id: string;
  name: string;
  summary: string;
  url: string;
  /** True for T1/T2 tools, shown with a "Professional" badge. */
  professional?: boolean;
}
