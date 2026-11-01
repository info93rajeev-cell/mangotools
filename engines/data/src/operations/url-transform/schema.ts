import { z } from 'zod';

export const urlInput = z.strictObject({ text: z.string() });

export const urlParams = z.strictObject({
  direction: z.enum(['encode', 'decode']).default('encode'),
  mode: z.enum(['component', 'full-url', 'form']).default('component'),
  /** Encode: a space as the mode writes it (form +, else %20), always %20, or always +.
   *  Decode: `plus` also turns + into a space outside form mode. */
  space: z.enum(['default', 'percent', 'plus']).default('default'),
  /** Encode ! ' ( ) * in component and form modes (RFC 3986 strict). */
  encodeSubDelims: z.boolean().default(true),
  /** Encode: leave valid %XX escapes as they are, so encoded text is not encoded twice. */
  keepEscapes: z.boolean().default(false),
  /** Encode: turn LF and lone CR line breaks into CRLF first (HTML form submission). */
  crlf: z.boolean().default(false),
  /** Encode or decode each line on its own and keep the line breaks. */
  perLine: z.boolean().default(false),
  /** text: the input as is. pairs: a JSON array of [key, value] pairs, encoded into a query. */
  source: z.enum(['text', 'pairs']).default('text'),
});

export const urlOutput = z.strictObject({
  text: z.string(),
  changedCount: z.int(),
  /** Query parameters of the encoded side (output for encode, input for decode). */
  params: z.array(z.strictObject({ key: z.string(), value: z.string() })),
});

export type UrlParams = z.infer<typeof urlParams>;
