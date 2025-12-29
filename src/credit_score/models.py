from __future__ import annotations

import datetime as dt
from typing import Any

from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    status: Mapped[str] = mapped_column(String(32), default="created", index=True)

    # Minimal search fields (the full form is kept in payload)
    client_number: Mapped[str | None] = mapped_column(String(64), index=True)
    applicant_last_name: Mapped[str | None] = mapped_column(String(128))
    applicant_first_name: Mapped[str | None] = mapped_column(String(128))

    requested_amount: Mapped[float | None] = mapped_column(Float)
    duration_months: Mapped[int | None] = mapped_column(Integer)
    repayment_frequency: Mapped[str | None] = mapped_column(String(64))

    payload: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

    score_total: Mapped[float | None] = mapped_column(Float, nullable=True)
    score_recommendation: Mapped[str | None] = mapped_column(String(32), nullable=True)
    score_details_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

