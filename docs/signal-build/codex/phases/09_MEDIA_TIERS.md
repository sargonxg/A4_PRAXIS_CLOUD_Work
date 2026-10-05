# Phase 09 - targeted image, audio and video evidence

Additional required reading: [research/COLLECTOR_ACCESS.md](../../research/COLLECTOR_ACCESS.md), [research/MULTILINGUAL_EVALUATION.md](../../research/MULTILINGUAL_EVALUATION.md). Use these as design inputs; verify current provider/repository contracts in this checkout.

This phase is conditional on permitted input media, current provider capabilities and a budget. Complete the text pilot independently. Enable modalities per desk and source entitlement; do not imply that all discovered social/video URLs can be downloaded or analyzed.

Implement T2 image intake with hash, dimensions, original representation, OCR text/regions and derived interpretation. A caption-versus-visible-content mismatch is a review candidate. Visual resemblance, absent C2PA credentials or a model label cannot establish authenticity, location or deceptive intent. Store actual credential verification outcomes if supported, with their limits.

Implement T3 audio intake with aligned transcript segments, speaker labels/uncertainty, language and translation lineage. Important claims must point to timestamp ranges in the retained audio and exact transcript revisions. Critical names, numbers, conditions and negation need review. Identify transcript gaps and low-quality regions explicitly.

Implement T4 selected-video processing with bounded duration, sampling rationale, frame timestamps, aligned audio/transcript and scoped discrepancy proposals. Review important moments in the original retained media. Model/provider descriptions of capabilities are candidates: verify the exact Vertex/API path available through the existing gateway. No silent direct-provider bypass.

Add per-media job budgets, cancellation, size/duration/MIME checks, signed private playback and derived-object retention. Duplicate/media reuse matching returns candidates with evidence, not an automated campaign graph. Disabled or unsupported tiers show honest states.

Acceptance: image region, audio timestamp and video frame locators resolve against pinned bytes; mismatched hashes or out-of-range times fail; translations cannot become original evidence; access restrictions and deletion propagate to derived files. Use owned synthetic fixtures and at least one authorized real sample per enabled modality. Document exact tested provider/model/input path, latency, spend and failures. Unverified tiers remain disabled in the released pilot.
