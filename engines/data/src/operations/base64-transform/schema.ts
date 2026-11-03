import { z } from 'zod';

export const base64Input = z.strictObject({ text: z.string() });

export const base64Params = z.strictObject({
  direction: z.enum(['encode', 'decode']).default('encode'),
  variant: z.enum(['standard', 'url-safe', 'auto']).default('standard'),
  padding: z.boolean().default(true),
  lineLength: z.enum(['0', '76']).default('0'),
  /**
   * How text maps to bytes. utf-8: Unicode text. latin1: ISO-8859-1, one character per byte
   * (0–255); also how a file's raw bytes are passed in and how decoded bytes are returned.
   */
  charset: z.enum(['utf-8', 'latin1']).default('utf-8'),
  /** Encode: when set, the result is a data URI `data:<mime>;base64,…`. */
  dataUriMime: z
    .string()
    .max(100)
    .regex(/^([a-z]+\/[a-z0-9.+-]+(;charset=[a-z0-9-]+)?)?$/i)
    .default(''),
  /** Decode: accept a `data:…;base64,` prefix and report its MIME type. */
  stripDataUri: z.boolean().default(false),
});

export const base64Output = z.strictObject({
  text: z.string(),
  byteLength: z.int(),
  isUtf8: z.boolean(),
  hexPreview: z.string().optional(),
  /** Decode: the bytes as a latin1 string (one character per byte) when they are not UTF-8 text
   *  or charset is latin1, so a viewer can preview or download them. */
  binary: z.string().optional(),
  /** Decode: file type recognised from the first bytes, or from a data URI prefix. */
  mime: z.string().optional(),
  /** Bytes of the input side: encoded bytes for encode, Base64 characters for decode. */
  inputByteLength: z.int(),
});

export type Base64Params = z.infer<typeof base64Params>;
