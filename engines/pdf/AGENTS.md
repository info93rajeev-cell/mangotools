# engines/pdf — lane rules

- File bytes are plain data (`Uint8Array`), never `File`, `Blob`, or any other DOM type. Selecting
  files, drag-and-drop, and triggering a download belong in `packages/ui`, not here.
- Never attempt to decrypt, guess, or prompt for a password. A password-protected or otherwise
  encrypted PDF is a typed error (`PDF_ENCRYPTED_UNSUPPORTED`), not a feature to support.
- Validate file count, size and type before parsing a single byte with `pdf-lib` — the size and
  count limits must never depend on successfully loading the file first.
- Every failure to load or process a file becomes a typed error with a `path` identifying which
  file, never a thrown exception.
- `pdf-lib` is the only third-party dependency this engine may import, besides `zod` and
  `@mangotools/core`. Do not add a renderer, an OCR library, a compression library, or server-side
  processing of any kind.
