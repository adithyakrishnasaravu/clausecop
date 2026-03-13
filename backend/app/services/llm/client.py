from __future__ import annotations

import json
import logging

from openai import OpenAI

from app.core.config import settings
from app.services.llm.prompts import CLASSIFY_SYSTEM, RISK_ANALYSIS_SYSTEM, CLASSIFY_AND_ANALYZE_SYSTEM, VALID_CATEGORIES
from dataclasses import dataclass
from app.services.llm.schemas import ClassifyResult, RiskAnalysisResult, RiskSignals

log = logging.getLogger(__name__)

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=settings.openai_api_key)
    return _client


def _chat(model: str, system: str, user: str) -> str:
    """Send a single chat completion request and return the assistant content."""
    response = _get_client().chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.0,
    )
    return response.choices[0].message.content.strip()


def classify_clause(text: str) -> ClassifyResult:
    """Classify a clause into a SaaS/MSA category."""
    raw = _chat(
        model=settings.openai_model_classify,
        system=CLASSIFY_SYSTEM,
        user=text,
    )

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        log.warning("classify_clause: failed to parse JSON, raw=%s", raw)
        return ClassifyResult(category="other", confidence=0.0)

    category = data.get("category", "other").lower().strip()
    if category not in VALID_CATEGORIES:
        log.warning("classify_clause: unknown category '%s', defaulting to 'other'", category)
        category = "other"

    confidence = float(data.get("confidence", 0.0))
    return ClassifyResult(category=category, confidence=min(max(confidence, 0.0), 1.0))


def analyze_risk(text: str, category: str) -> RiskAnalysisResult:
    """Analyze a clause for risk signals from the customer's perspective."""
    user_msg = f"Category: {category}\n\nClause text:\n{text}"

    raw = _chat(
        model=settings.openai_model_reasoning,
        system=RISK_ANALYSIS_SYSTEM,
        user=user_msg,
    )

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        log.warning("analyze_risk: failed to parse JSON, raw=%s", raw)
        return RiskAnalysisResult(
            signals=RiskSignals(),
            severity="low",
            summary="Unable to analyze this clause.",
            recommendation="Review manually.",
        )

    signals = RiskSignals.from_dict(data.get("signals", {}))
    severity = data.get("severity", "low").lower().strip()
    if severity not in ("low", "medium", "high", "critical"):
        severity = "medium"

    return RiskAnalysisResult(
        signals=signals,
        severity=severity,
        summary=data.get("summary", ""),
        recommendation=data.get("recommendation", ""),
    )


@dataclass
class CombinedAnalysisResult:
    """Combined classification + risk analysis result."""
    category: str
    confidence: float
    signals: RiskSignals
    severity: str
    summary: str
    recommendation: str


def classify_and_analyze(text: str) -> CombinedAnalysisResult:
    """Classify and analyze a clause in a single LLM call (2x faster)."""
    raw = _chat(
        model=settings.openai_model_reasoning,
        system=CLASSIFY_AND_ANALYZE_SYSTEM,
        user=text,
    )

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        log.warning("classify_and_analyze: failed to parse JSON, raw=%s", raw)
        return CombinedAnalysisResult(
            category="other",
            confidence=0.0,
            signals=RiskSignals(),
            severity="low",
            summary="Unable to analyze this clause.",
            recommendation="Review manually.",
        )

    category = data.get("category", "other").lower().strip()
    if category not in VALID_CATEGORIES:
        category = "other"

    confidence = float(data.get("confidence", 0.0))
    signals = RiskSignals.from_dict(data.get("signals", {}))
    severity = data.get("severity", "low").lower().strip()
    if severity not in ("low", "medium", "high", "critical"):
        severity = "medium"

    return CombinedAnalysisResult(
        category=category,
        confidence=min(max(confidence, 0.0), 1.0),
        signals=signals,
        severity=severity,
        summary=data.get("summary", ""),
        recommendation=data.get("recommendation", ""),
    )
