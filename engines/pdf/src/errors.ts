/** English messages for every error and warning code this engine can return. */
export const messages: Readonly<Record<string, string>> = {
  PDF_NO_FILES_SELECTED: 'Select at least one PDF file to merge.',
  PDF_TOO_MANY_FILES: 'You can merge up to {max} files at a time.',
  PDF_INVALID_FILE_TYPE: '"{name}" is not a PDF file.',
  PDF_FILE_TOO_LARGE: '"{name}" is larger than the {max} MB limit for a single file.',
  PDF_TOTAL_SIZE_EXCEEDED:
    'The combined size of the selected files is larger than the {max} MB limit.',
  PDF_ENCRYPTED_UNSUPPORTED: '"{name}" is password-protected and cannot be processed here.',
  PDF_UNREADABLE: '"{name}" could not be read as a PDF. It may be corrupted or damaged.',
  PDF_MERGE_FAILED: 'The files could not be merged. Please try again with different files.',
  PDF_MERGE_VERIFY_OUTPUT: 'Verify the merged PDF before sending, printing, filing, or publishing.',
  PDF_MERGE_FEATURES_MAY_NOT_BE_PRESERVED:
    'Bookmarks, forms, annotations, signatures, attachments, layers, or advanced PDF features may not be preserved.',
  PDF_MERGE_LARGE_OR_PROTECTED_MAY_FAIL:
    'Very large, encrypted, password-protected, or corrupted PDFs may fail in the browser.',
  PDF_MERGE_AUTHORIZED_USE_ONLY:
    'Do not use this tool for documents you are not allowed to process.',
};
