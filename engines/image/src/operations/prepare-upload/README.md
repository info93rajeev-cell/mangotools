# Upload preparation and bounded search

Issue #184 implements private `findUploadCandidate`; #185 adds the public descriptor
`image.prepare-upload@1`. No tool is published by either engine change. Market-ready Signature
Resizer/Photo Size Reducer contracts are recorded in #185. Existing Resize/Compress stays unchanged.

## Public operation

Input reuses the Resize file/target dimensions/filename shape, but accepts only aspect preservation
(`keepAspectRatio: true`, default), JPEG/PNG output and quality 50–100 (default 90). Optional
`maxFileSizeKB` is an integer 1–25000; **1 KB = 1000 bytes**. `padToTarget` and
`allowDimensionReduction` default false and cannot both be true. Params reuse filename suffix/fallback.

Contained output fits within target dimensions without content upscaling. Padded output uses the
exact requested canvas, centers contained content and never stretches/upscales it. JPEG uses white;
PNG retains alpha. The original bitmap is decoded once, sampled afresh for every candidate, and closed
on success/failure. Input uses the existing 25 MiB, 20000-axis and 40 MP limits. Padded output is capped
before decoding; contained output cannot exceed the already checked source pixel count.

Success is the existing downloadable Resize output plus nullable `targetFileSizeBytes` and
`encodeAttempts` (1–32). Actual encoded bytes must meet the target. Failure is
`IMAGE_SIZE_TARGET_UNREACHABLE` with only numeric smallest-tested bytes/dimensions/attempts: no
output bytes or partial success. This prevents the existing UI from auto-downloading an oversized
file. A cancellation between encodes returns `ABORTED`; decode/encode errors reuse the image catalogue.
Standing inspection/metadata/memory notices and relevant alpha/size/downscale notices are retained.

No encoded-byte pass-through: re-encoding can enlarge an already-small input and strips metadata.
This is neither lossless/perceptual-quality assurance nor portal acceptance/crop/background cleanup.
Use Image Crop explicitly first when needed. Even an unattainable target is bounded, not guaranteed.

## Search policy

The caller supplies already validated initial dimensions, maximum quality (50–100), JPG/PNG,
an optional byte ceiling, explicit dimension-reduction permission and an asynchronous encoder.
The encoder must sample the original decoded source, not the last lossy candidate; the subsequent
operation owns decoding, canvas/memory limits, format verification and bitmap cleanup.

At each resolution, JPG tests eight qualities descending from the configured maximum to 50.
PNG tests once because canvas PNG ignores quality. Without a byte target, the first encode returns.
Every successful candidate is accepted only by its actual encoded length; encoder sizes are not
assumed monotonic. This is not an exhaustive search or a globally optimal-quality guarantee.

When authorized, the next resolution uses the measured smallest length at that stage to choose a
reduction factor, capped at 0.85 with a 0.9 safety factor and a 64-pixel short-side floor. Dimensions
never grow; aspect differences are limited to integer-pixel rounding. Inputs already at/below that
floor are not downscaled. Four resolution stages and eight JPG candidates cap work at 32 encodes.

Failure returns `met: false` and the globally smallest **tested** candidate with its own dimensions
and total attempt count. Encoder rejection propagates; the public operation maps it to
typed errors and must not silently download an oversized result. No time/randomness/network or
new dependency is used. Synthetic tests establish policy bounds, not perceptual quality or browser
codec parity. The existing image exception still prohibits encoded-byte equality assertions.

## Evidence

Synthetic pre-decode fixtures cite #185; Node tests cover strict schema, limits, contain arithmetic
and the search policy. Real worker tests bundle the actual public image/core exports with the
existing in-memory harness, independently decode outputs and check bytes/format/dimensions/padding,
without a production route or copied implementation. Browser encoder results may differ. Node
cannot execute canvas work; browser tests, not synthetic fixture bytes, establish that capability.

Capability baseline: ResizePixel's KB/MB reducer, Simple Image Resizer's KB and signature workflows,
and RedKetchup's documented padding/file-size modes. These are functionality references, not
official portal dimensions, copied implementation or acceptance guarantees. Exact primary URLs
and both tools' concise A–F acceptance contracts are preserved in issues #184/#185.
