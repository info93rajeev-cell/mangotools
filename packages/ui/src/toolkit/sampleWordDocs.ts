import type { DocxBlock } from './docxZipPacker.ts';

/**
 * Sample Word files for Word to PDF, built in the browser. Sized like the approved reference
 * (a 12-page proposal and an 8-page annexure) so the page previews have pages to show.
 */

const PROPOSAL_SECTIONS = [
  'Executive Summary',
  'Background',
  'Objectives',
  'Scope of Work',
  'Approach and Method',
  'Deliverables',
  'Project Plan',
  'Team and Roles',
  'Budget',
  'Risks and Mitigation',
  'Quality and Acceptance',
  'Terms and Next Steps',
];

const ANNEXURE_SECTIONS = [
  'Annexure A: Site Details',
  'Annexure B: Equipment List',
  'Annexure C: Delivery Schedule',
  'Annexure D: Payment Milestones',
  'Annexure E: Contacts',
  'Annexure F: Reporting Format',
  'Annexure G: Service Levels',
  'Annexure H: Sign-off Sheet',
];

const BODY = [
  'This section sets out what the client and the supplier have agreed for this part of the project, written in plain language so that every reader can follow it.',
  'Work is planned in short stages. Each stage ends with a review in which both sides confirm what was delivered, what changed and what comes next.',
  'Dates, quantities and amounts in this sample are illustrative. In a real proposal they come from the agreed quotation and the purchase order.',
  'Any change to the scope is recorded in writing, with its effect on the schedule and the price, before the work on it begins.',
  'The supplier keeps a simple log of decisions and open questions, shared with the client every week, so nothing is lost between meetings.',
];

function pages(title: string, sections: string[]): DocxBlock[] {
  const out: DocxBlock[] = [];
  sections.forEach((section, i) => {
    if (i > 0) out.push({ kind: 'page' });
    if (i === 0) out.push({ kind: 'h1', text: title });
    out.push({ kind: 'h2', text: `${i + 1}. ${section}` });
    for (const p of BODY) out.push({ kind: 'p', text: p });
  });
  return out;
}

export const SAMPLE_WORD_DOCS: { name: string; blocks: DocxBlock[] }[] = [
  { name: 'Proposal-Final.docx', blocks: pages('Project Proposal (Sample)', PROPOSAL_SECTIONS) },
  { name: 'Annexure-Notes.docx', blocks: pages('Annexure Notes (Sample)', ANNEXURE_SECTIONS) },
];
