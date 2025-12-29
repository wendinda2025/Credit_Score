from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from credit_score.core.db import get_db
from credit_score.models import Application
from credit_score.schemas import ApplicationCreate, ApplicationOut, ScoreOut
from credit_score.services.scoring import score_application

router = APIRouter(prefix="/v1/applications", tags=["applications"])


@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def create_application(payload: ApplicationCreate, db: Session = Depends(get_db)) -> ApplicationOut:
    app = Application(
        status="created",
        client_number=payload.client.client_number,
        applicant_last_name=payload.client.last_name,
        applicant_first_name=payload.client.first_name,
        requested_amount=payload.loan.amount,
        duration_months=payload.loan.duration_months,
        repayment_frequency=payload.loan.repayment_frequency,
        payload={
            "client": payload.client.model_dump(),
            "loan": payload.loan.model_dump(),
            "financials": payload.financials.model_dump() if payload.financials else None,
            "raw": payload.raw,
        },
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return ApplicationOut.model_validate(app, from_attributes=True)


@router.get("/{application_id}", response_model=ApplicationOut)
def get_application(application_id: int, db: Session = Depends(get_db)) -> ApplicationOut:
    app = db.get(Application, application_id)
    if app is None:
        raise HTTPException(status_code=404, detail="application_not_found")
    return ApplicationOut.model_validate(app, from_attributes=True)


@router.post("/{application_id}/score", response_model=ScoreOut)
def score_and_store(application_id: int, db: Session = Depends(get_db)) -> ScoreOut:
    app = db.get(Application, application_id)
    if app is None:
        raise HTTPException(status_code=404, detail="application_not_found")

    # reconstruct minimal ApplicationCreate from stored JSON payload
    stored: dict[str, Any] = app.payload or {}
    try:
        app_create = ApplicationCreate.model_validate(
            {
                "client": stored.get("client") or {},
                "loan": stored.get("loan") or {},
                "financials": stored.get("financials"),
                "raw": stored.get("raw"),
            }
        )
    except Exception as e:  # noqa: BLE001 (client-safe API error)
        raise HTTPException(status_code=422, detail=f"invalid_stored_payload: {e}") from e

    result = score_application(app_create)
    app.score_total = result.total
    app.score_recommendation = result.recommendation
    app.score_details_json = json.dumps(result.details, ensure_ascii=False)
    app.status = "scored"
    db.add(app)
    db.commit()
    return ScoreOut(
        total=result.total, recommendation=result.recommendation, details=result.details
    )

