from __future__ import annotations

import importlib
import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path: Path) -> TestClient:
    db_path = tmp_path / "test.sqlite3"
    os.environ["CREDIT_SCORE_DATABASE_URL"] = f"sqlite:///{db_path}"
    os.environ["CREDIT_SCORE_ENVIRONMENT"] = "test"

    # Reload modules that bind settings/engine at import time
    import credit_score.core.config as config

    importlib.reload(config)

    import credit_score.core.db as db

    importlib.reload(db)

    import credit_score.api.main as main

    importlib.reload(main)

    with TestClient(main.app) as c:
        yield c

