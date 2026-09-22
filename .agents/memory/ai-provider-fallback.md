---
name: AI provider fallback
description: External model access can be configured but still fail at runtime because provider quota is exhausted.
---

The assistant should always have an explicit, transparent data-grounded fallback when a configured model provider rejects a request for quota or billing reasons.

**Why:** A valid secret does not guarantee usable provider credits, and a hard failure makes a finance assistant feel broken even when the underlying data is available.

**How to apply:** Keep the fallback model label visible in assistant metadata, use only local workspace facts, and never present heuristic output as if it came from the external model.