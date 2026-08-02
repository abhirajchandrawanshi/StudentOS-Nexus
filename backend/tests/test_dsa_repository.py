from __future__ import annotations

import pytest

from app.dsa.repository import DSARepository, DSAStatelessModeError


@pytest.mark.asyncio
async def test_repository_stateless_mode_noop_behaviour() -> None:
    repo = DSARepository(session=None)

    with pytest.raises(DSAStatelessModeError):
        await repo.save_question_completion(
            username="demo",
            question_id=1,
            status="completed",
        )

    rows = await repo.get_question_history(username="demo")
    assert rows == []

    with pytest.raises(DSAStatelessModeError):
        await repo.save_roadmap_progress(
            username="demo",
            roadmap_id="rm1",
            roadmap_payload={"weeks": []},
        )

    latest = await repo.get_latest_roadmap(username="demo")
    assert latest is None

    with pytest.raises(DSAStatelessModeError):
        await repo.save_company_readiness(
            username="demo",
            company="Amazon",
            domain="Backend",
            readiness_score=50.0,
            explanation="ok",
            factors={},
        )
