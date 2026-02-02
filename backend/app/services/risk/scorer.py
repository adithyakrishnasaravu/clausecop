from __future__ import annotations

# ---------------------------------------------------------------------------
# Hardcoded risk weights tuned for SaaS / MSA contracts from the CUSTOMER
# perspective.  These encode an opinionated view of what matters when a
# company subscribes to a SaaS product or enters an MSA.
# ---------------------------------------------------------------------------

# Base risk by clause category — reflects how inherently consequential
# a clause type is in SaaS / MSA deals.
CATEGORY_BASE: dict[str, float] = {
    "indemnification":        30,
    "limitation_of_liability": 28,
    "data_privacy":           27,
    "data_handling":          25,
    "ip_assignment":          25,
    "termination":            22,
    "sla":                    20,
    "auto_renewal":           18,
    "payment_terms":          15,
    "warranty":               15,
    "insurance":              12,
    "confidentiality":        12,
    "non_compete":            12,
    "force_majeure":          10,
    "governing_law":          8,
    "other":                  5,
}

# Additive weight per active signal.
SIGNAL_WEIGHT: dict[str, float] = {
    "uncapped_liability": 25,
    "one_sided":          20,
    "broad_indemnity":    20,
    "poor_data_terms":    18,
    "unlimited_ip":       15,
    "weak_sla":           15,
    "missing_mutual":     12,
    "vague_language":     10,
    "short_cure_period":  10,
    "non_standard":       10,
    "weak_termination":   10,
    "auto_renewal":       8,
}

# Severity tiers mapped from score ranges.
_TIERS: list[tuple[float, str]] = [
    (25, "low"),
    (50, "medium"),
    (75, "high"),
]


def compute_risk_score(category: str, signals: dict[str, bool]) -> tuple[float, str]:
    """Compute a 0-100 risk score and severity tier.

    Args:
        category: The classified clause category.
        signals:  Dict of signal_name → bool.

    Returns:
        (score, severity) where severity is one of low/medium/high/critical.
    """
    base = CATEGORY_BASE.get(category, CATEGORY_BASE["other"])
    signal_total = sum(
        SIGNAL_WEIGHT.get(name, 0) for name, active in signals.items() if active
    )
    score = min(max(base + signal_total, 0), 100)

    severity = "critical"
    for threshold, label in _TIERS:
        if score <= threshold:
            severity = label
            break

    return round(score, 1), severity
