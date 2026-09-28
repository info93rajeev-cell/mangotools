/** English messages for every error and warning code this engine can return. */
export const messages: Readonly<Record<string, string>> = {
  EXPORT_MISSING_INPUT: 'Enter a value here.',
  EXPORT_TEXT_TOO_LONG: 'Use at most {max} characters.',
  EXPORT_INVALID_NUMBER: 'Enter a number such as 4 or 4.5.',
  EXPORT_TOO_MANY_DECIMALS: 'Use at most {max} decimal places.',
  EXPORT_NOT_POSITIVE: 'This must be greater than zero.',
  EXPORT_NOT_NEGATIVE: 'This cannot be negative.',
  EXPORT_NOT_WHOLE: 'This must be a whole number.',
  EXPORT_INVALID_DATE: 'Enter a date in YYYY-MM-DD format, such as 2026-09-27.',
  EXPORT_GSTIN_INVALID_FORMAT:
    'Enter a 15-character GSTIN in the standard format (e.g. 27ABCDE1234F1Z5). Verify with your CA if unsure.',
  EXPORT_HSN_INVALID_FORMAT:
    'Enter a numeric HSN code, usually 4, 6 or 8 digits. Verify the exact HSN with your CA or customs broker if unsure.',
  EXPORT_DOCUMENT_PREPARATION_HELPER_ONLY:
    'This is a document preparation helper. It does not file anything with Customs, India Post, DGFT, ICEGATE, DNK, ECCS, or any bank or government portal.',
  EXPORT_VERIFY_BEFORE_FILING:
    'Verify all details and confirm final documents with India Post, your courier, customs broker, CA, bank, or the official portal before filing or shipping.',
  EXPORT_NOT_LEGAL_TAX_ADVICE:
    'This tool does not provide legal, tax, or FEMA/bank compliance advice.',
  EXPORT_INVOICE_SCOPE_LIMIT:
    'This invoice draft does not calculate tax, duty, or foreign-exchange conversion, and is not a government-approved format.',
  EXPORT_PACKING_LIST_SCOPE_LIMIT:
    'This packing list draft does not calculate duties, taxes, freight, forex, customs value, or regulatory eligibility, and is not an official or government-approved packing list.',
  EXPORT_GROSS_WEIGHT_BELOW_NET: 'Gross weight cannot be less than net weight.',
  EXPORT_INVALID_ITEMS: 'The item rows could not be read. Try removing and re-adding the item.',
  EXPORT_TOO_FEW_ITEMS: 'Add at least one item.',
  EXPORT_TOO_MANY_ITEMS: 'This invoice supports at most {max} items.',
};
