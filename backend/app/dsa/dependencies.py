from __future__ import annotations

import logging
import os
from typing import AsyncGenerator, Optional

from fastapi import Depends

from app.dsa.repository import DSARepository, get_session_factory

logger = logging.getLogger("dsa.dependencies")

_gemini_model = None


async def get_db_session() -> AsyncGenerator:
    factory = get_session_factory()
    if factory is None:
        yield None
        return

    async with factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


async def get_dsa_repo(session=Depends(get_db_session)) -> DSARepository:
    return DSARepository(session=session)


def get_dsa_gemini_client() -> Optional[object]:
    global _gemini_model
    if _gemini_model is not None:
        return _gemini_model

    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        logger.info("GEMINI_API_KEY not set for DSA mentor. Falling back to deterministic mentor output.")
        return None

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        _gemini_model = genai.GenerativeModel("gemini-2.5-flash")
        return _gemini_model
    except Exception as exc:
        logger.warning("Failed to initialize DSA Gemini client: %s", exc)
        return None
