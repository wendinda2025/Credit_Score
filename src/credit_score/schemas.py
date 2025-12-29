from __future__ import annotations

import datetime as dt
from typing import Any, Literal

from pydantic import BaseModel, Field


class ClientInfo(BaseModel):
    client_number: str | None = Field(default=None, max_length=64)
    last_name: str | None = Field(default=None, max_length=128)
    first_name: str | None = Field(default=None, max_length=128)
    sex: Literal["M", "F"] | None = None
    date_of_birth: dt.date | None = None
    years_at_address: int | None = Field(default=None, ge=0, le=80)


class LoanRequest(BaseModel):
    amount: float = Field(..., gt=0)
    duration_months: int = Field(..., gt=0, le=240)
    repayment_frequency: str = Field(..., min_length=1, max_length=64)
    purpose: str | None = Field(default=None, max_length=512)


class FinancialSnapshot(BaseModel):
    # Extremely simplified fields; can be extended to match the Excel sheets
    net_monthly_business_income: float | None = Field(default=None)
    other_monthly_income: float | None = Field(default=None)
    monthly_family_expenses: float | None = Field(default=None)
    retained_collateral_value: float | None = Field(default=None)
    years_in_business: int | None = Field(default=None, ge=0, le=80)


class ApplicationCreate(BaseModel):
    client: ClientInfo
    loan: LoanRequest
    financials: FinancialSnapshot | None = None
    raw: dict[str, Any] | None = None


class ApplicationOut(BaseModel):
    id: int
    status: str

    client_number: str | None
    applicant_last_name: str | None
    applicant_first_name: str | None

    requested_amount: float | None
    duration_months: int | None
    repayment_frequency: str | None

    score_total: float | None = None
    score_recommendation: str | None = None
    created_at: dt.datetime
    updated_at: dt.datetime


class ScoreOut(BaseModel):
    total: float
    recommendation: Literal["approve", "review", "reject"]
    details: dict[str, Any]

