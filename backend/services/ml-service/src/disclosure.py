"""Disclosure constants. Every prediction response MUST embed this string verbatim.

The exact wording matters — it's what the web/mobile UIs key off of when surfacing
the "AI-generated — review before saving." badge.
"""

from __future__ import annotations

AI_DISCLAIMER: str = "AI-generated — review before saving."


def wrap_disclosure(payload: dict) -> dict:
    """Return ``payload`` with the disclaimer string attached.

    Mutates a copy, not the input. Idempotent.
    """
    out = dict(payload)
    out["disclaimer"] = AI_DISCLAIMER
    return out
