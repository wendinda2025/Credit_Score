from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

from credit_score.core.config import settings
from credit_score.schemas import ApplicationCreate

Recommendation = Literal["approve", "review", "reject"]


@dataclass(frozen=True)
class ScoreResult:
    total: float
    recommendation: Recommendation
    details: dict[str, Any]


def _clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def _frequency_to_months(freq: str) -> int:
    f = freq.strip().lower()
    if "mois" in f or "mens" in f or f in {"m", "monthly"}:
        return 1
    if "trim" in f or "quarter" in f:
        return 3
    if "sem" in f or "six" in f:
        return 6
    if "ann" in f or "year" in f:
        return 12
    # fallback: assume monthly
    return 1


def score_application(app: ApplicationCreate) -> ScoreResult:
    """
    Scoring "sûr par défaut":
    - On ne suppose pas de taux d'intérêt (0%) tant qu'il n'est pas défini.
    - Si des données manquent, on pénalise (robustesse: pas d'approbation aveugle).
    """

    amount = app.loan.amount
    duration_months = app.loan.duration_months
    freq_months = _frequency_to_months(app.loan.repayment_frequency)
    periods = max(1, duration_months // freq_months)
    installment = amount / periods

    fin = app.financials
    net_business = fin.net_monthly_business_income if fin else None
    other_income = fin.other_monthly_income if fin else None
    family_exp = fin.monthly_family_expenses if fin else None
    collateral = fin.retained_collateral_value if fin else None
    years_business = fin.years_in_business if fin else None
    years_address = app.client.years_at_address

    # DSCR-ish (net available / installment per period)
    dscr: float | None = None
    if net_business is not None:
        monthly_available = net_business
        if other_income is not None:
            monthly_available += other_income
        if family_exp is not None:
            monthly_available -= family_exp
        period_available = monthly_available * freq_months
        dscr = period_available / installment if installment > 0 else None

    # Subscores normalized to 0..100
    if dscr is None:
        dscr_score = 0.0
    elif dscr >= 1.6:
        dscr_score = 100.0
    elif dscr >= 1.2:
        dscr_score = 75.0
    elif dscr >= 1.0:
        dscr_score = 55.0
    elif dscr >= 0.8:
        dscr_score = 35.0
    else:
        dscr_score = 10.0

    collateral_ratio: float | None = None
    if collateral is not None and amount > 0:
        collateral_ratio = collateral / amount
    if collateral_ratio is None:
        collateral_score = 0.0
    elif collateral_ratio >= 1.5:
        collateral_score = 100.0
    elif collateral_ratio >= 1.0:
        collateral_score = 80.0
    elif collateral_ratio >= 0.8:
        collateral_score = 55.0
    else:
        collateral_score = 20.0

    stability_points = 0.0
    if years_business is not None:
        stability_points += _clamp(years_business / 10.0, 0.0, 1.0)
    if years_address is not None:
        stability_points += _clamp(years_address / 10.0, 0.0, 1.0)
    stability_score = (stability_points / 2.0) * 100.0

    total = (
        settings.score_weight_dscr * dscr_score
        + settings.score_weight_collateral * collateral_score
        + settings.score_weight_stability * stability_score
    )
    total = float(_clamp(total, 0.0, 100.0))

    if total >= 75:
        rec: Recommendation = "approve"
    elif total >= 50:
        rec = "review"
    else:
        rec = "reject"

    details: dict[str, Any] = {
        "inputs": {
            "amount": amount,
            "duration_months": duration_months,
            "repayment_frequency": app.loan.repayment_frequency,
            "installment_per_period": installment,
            "period_months": freq_months,
        },
        "dscr": {"value": dscr, "score": dscr_score},
        "collateral": {"ratio": collateral_ratio, "score": collateral_score},
        "stability": {
            "years_in_business": years_business,
            "years_at_address": years_address,
            "score": stability_score,
        },
        "weights": {
            "dscr": settings.score_weight_dscr,
            "collateral": settings.score_weight_collateral,
            "stability": settings.score_weight_stability,
        },
    }
    return ScoreResult(total=total, recommendation=rec, details=details)

