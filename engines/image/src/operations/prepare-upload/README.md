# Upload-preparation search policy — internal foundation

Issue #184 implements only `findUploadCandidate`; it is not exported from the package and is not
an operation descriptor or a published tool. The public integration and market-ready Signature
Resizer/Photo Size Reducer contracts remain in #185. Existing Resize/Compress behavior is unchanged.

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
and total attempt count. Encoder rejection propagates; the later public operation must map it to
typed errors and must not silently download an oversized result. No time/randomness/network or
new dependency is used. Synthetic tests establish policy bounds, not perceptual quality or browser
codec parity. The existing image exception still prohibits encoded-byte equality assertions.

Capability baseline: ResizePixel's KB/MB reducer, Simple Image Resizer's KB and signature workflows,
and RedKetchup's documented padding/file-size modes. These are functionality references, not
official portal dimensions, copied implementation or acceptance guarantees. Exact primary URLs
and both tools' concise A–F acceptance contracts are preserved in issues #184/#185.
