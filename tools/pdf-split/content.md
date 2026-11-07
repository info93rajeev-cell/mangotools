---
lastReviewed: 2026-11-02
---

## How to use

1. **Open or drop one PDF**, or try a sample: a 124-page report, or a 1,600-page book split into
   100-page chapters. Samples are generated in your browser.
2. **Choose how to split:**
   - **Page ranges** — type ranges such as `1-12, 13-42`; each range becomes its own PDF. A new
     file starts as two halves.
   - **Extract pages** — type pages such as `1, 3, 5-10` (or click page thumbnails); they go into
     one new PDF, in the order you typed them.
   - **Every page** — one PDF per page.
   - **Fixed chunks** — a new PDF every N pages.
3. Optionally set the file name pattern (`{n}` is the part number) and whether several files
   download as one ZIP.
4. Select **Split PDF**, then download. One file downloads as a PDF; several download as a ZIP or as
   separate PDFs.

## Method

**What is split.** Pages are copied from your PDF into new PDF files exactly as they are; their
content is not changed. Ranges or pages outside the document are listed as "not used" instead of
causing an error, and the summary always shows how many files and pages will be created.

**Browser-based processing.** The PDF is read and the new files are written on your own device;
nothing is uploaded.

**Limits.** Files up to 25 MB. Password-protected PDFs are refused with a clear message; remove the
password in your PDF reader first. Bookmarks, form fields, annotations and other advanced features
of the original may not carry over into the split files. Output sizes are estimates until the files
are created.

**Related tools.** Combine the results again with [PDF Merge](tool:pdf-merge), or reduce their size
with [Compress PDF](tool:compress-pdf).

## FAQ

### How do I split a PDF?

Open the PDF, choose a split mode, check the summary and select Split PDF.

### Can I extract only pages 3 to 7?

Yes. Use Extract pages and type `3-7`, or use Page ranges with the single range `3-7`.

### Can I split every page into separate PDFs?

Yes. Choose Every page. You get one PDF per page, downloaded together as a ZIP or separately.

### Can I split several PDFs at once?

No. The tool works on one PDF at a time.

### Does the PDF upload to a server?

No. Everything runs in your browser.

### Can it handle password-protected PDFs?

No. You will see a clear message instead of an empty or broken result.

### Does this tool add a watermark?

No. The new PDFs contain only the pages you chose.
