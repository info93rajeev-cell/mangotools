---
lastReviewed: 2026-09-27
---

## How to use

1. **Choose one PDF.** Drag and drop a PDF file onto the box, or select one from your device.
2. **Enter a start page and an end page** — the range of pages (1-based, inclusive) you want to keep in
   the new PDF.
3. Select **Download split PDF**. The file is read, the selected pages are copied into a new PDF, and the
   result downloads immediately — nothing is uploaded anywhere.

**What PDF Split does:** it extracts a page range from a single PDF into a brand-new PDF, entirely on your
device, with no sign-up and no branding added to the result. It does not modify your original
file.

## Method

**Page range examples.** A 10-page PDF with a start page of 3 and an end page of 7 produces a new 5-page
PDF containing pages 3, 4, 5, 6, and 7, in their original order. A start page equal to the end page (for
example, 4 to 4) extracts a single page. A start page of 1 and an end page equal to the document's own
page count extracts every page into a new file.

**Extracting pages vs. splitting every page.** This tool extracts one page range into one output PDF per
run — it does not split a document into one file per page. If you need several different page ranges from
the same PDF, run the tool again for each range you want.

**Browser-based processing.** No file upload is required for this tool — the PDF you select is read and
processed on your own device, and the result downloads without ever leaving it.

**File limits and encrypted PDFs.** Files up to 25 MB are supported. Password-protected (encrypted) PDFs
are not supported in this version — a clear error explains this rather than silently failing. Bookmarks,
form fields, annotations, and other advanced PDF features from the original file may not be preserved in
the extracted result.

**What this tool does not do.** It handles one PDF and one page range per run — there is no batch
splitting, no ZIP download of multiple ranges, and no page reordering. It does not merge its own output
with another file (use [PDF Merge](tool:pdf-merge) afterward if you need that). It does not add a
watermark of any kind, and it does not perform OCR or read the document's text content.

**Common errors.** A specific, plain-English message explains exactly what went wrong: no file selected, a
file that isn't a PDF, a file over the size limit, a password-protected PDF, a corrupted or unreadable
file, an invalid start or end page, an end page before the start page, or a page range that extends beyond
the document's own page count (stated with the actual page count). Do not use this tool for documents you
are not allowed to process.

## FAQ

### How do I split a PDF?

Select your PDF, enter a start page and an end page, and select Download split PDF. The pages in that
range are copied into a new PDF.

### Can I extract only pages 3 to 7?

Yes — enter 3 as the start page and 7 as the end page. The new PDF will contain exactly those five pages,
in order.

### Does this split every page into separate PDFs?

No, not in this version. This tool extracts one page range into one PDF per run. To get several ranges
from the same document, run the tool again for each range.

### Can I split multiple PDFs at once?

Not in this version. This tool works on one PDF at a time.

### Does the PDF upload to a server?

No. The file you select is read and processed in this browser. Nothing is uploaded anywhere.

### Can it handle password-protected PDFs?

Not in this version. A password-protected (encrypted) PDF shows a clear error instead of being processed.

### Can I reorder pages?

Not in this version. The extracted pages keep their original order from the source document.

### Can I merge the result with another PDF?

Not directly in this tool, but you can download the split result and then use [PDF Merge](tool:pdf-merge)
to combine it with another PDF.

### Does this tool add a watermark?

No. The extracted PDF contains only the pages you selected — no branding or watermark is added.

### Do I need to sign up?

No. This tool works without an account, sign-up, or login.
