"""Backward-compatible import for the canonical SIH feature router.

The active endpoints and persistence models live in
``app.final_features.routes`` and ``app.final_features.models``. Keep this
module as a thin alias so older imports do not pull in the retired model set.
"""

from app.final_features.routes import router

__all__ = ["router"]
