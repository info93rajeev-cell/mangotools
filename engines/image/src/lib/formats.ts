import { z } from 'zod';

/** File bytes are plain data at every image operation's boundary — never `File`, per AGENTS.md. */
export const imageFile = z.strictObject({
  /** The original file name, used to derive the output name and to identify it in error details. */
  name: z.string().min(1),
  bytes: z.instanceof(Uint8Array),
});

/** `'same'` resolves to the detected input format; used by an operation's own output-format field. */
export const imageOutputFormat = z.enum(['same', 'jpg', 'png', 'webp']);
/** The three formats this engine can actually decode or encode — never `'same'`. */
export const resolvedImageFormat = z.enum(['jpg', 'png', 'webp']);

export type ImageFile = z.infer<typeof imageFile>;
export type ImageOutputFormat = z.infer<typeof imageOutputFormat>;
export type ResolvedImageFormat = z.infer<typeof resolvedImageFormat>;
