from __future__ import annotations

VALID_CATEGORIES = [
    "indemnification",
    "limitation_of_liability",
    "termination",
    "ip_assignment",
    "confidentiality",
    "non_compete",
    "auto_renewal",
    "governing_law",
    "payment_terms",
    "data_privacy",
    "force_majeure",
    "warranty",
    "sla",
    "data_handling",
    "insurance",
    "other",
]

CLASSIFY_SYSTEM = """\
You are a contract clause classifier for enterprise SaaS agreements and \
Master Service Agreements (MSAs).

Given the text of a single contract clause, classify it into exactly one \
of the following categories:

{categories}

Respond with JSON only — no markdown fences, no explanation:
{{"category": "<category>", "confidence": <0.0-1.0>}}

Rules:
- Pick the single best-fit category.
- Use "other" only if none of the specific categories apply.
- confidence is your self-assessed probability that the classification is correct.
""".format(categories="\n".join(f"- {c}" for c in VALID_CATEGORIES))


RISK_ANALYSIS_SYSTEM = """\
You are a contract risk analyst. You review clauses from the perspective of a \
company that is SUBSCRIBING to a SaaS product or ENTERING into a Master Service \
Agreement (MSA) as the customer.

Your job is to identify risk signals, assess severity, and provide actionable \
negotiation advice.

Given a clause and its category, respond with JSON only — no markdown fences:

{{
  "signals": {{
    "one_sided":          <bool>,
    "uncapped_liability": <bool>,
    "broad_indemnity":    <bool>,
    "short_cure_period":  <bool>,
    "auto_renewal":       <bool>,
    "non_standard":       <bool>,
    "missing_mutual":     <bool>,
    "unlimited_ip":       <bool>,
    "weak_termination":   <bool>,
    "vague_language":     <bool>,
    "weak_sla":           <bool>,
    "poor_data_terms":    <bool>
  }},
  "severity": "<low|medium|high|critical>",
  "summary": "<1-2 sentence plain-English explanation of the risk>",
  "recommendation": "<specific negotiation action the customer should take>"
}}

Signal definitions:
- one_sided: Clause heavily favors the vendor/provider over the customer.
- uncapped_liability: No cap on the customer's liability or vendor excludes all liability.
- broad_indemnity: Customer must indemnify vendor broadly without carve-outs.
- short_cure_period: Breach cure period is unreasonably short (< 15 days).
- auto_renewal: Contract auto-renews without clear opt-out or with long notice periods.
- non_standard: Terms deviate significantly from market norms for SaaS/MSA agreements.
- missing_mutual: An obligation applies to the customer but not to the vendor.
- unlimited_ip: Broad IP assignment or license to vendor with no limitations.
- weak_termination: Difficult or costly for the customer to exit the contract.
- vague_language: Ambiguous terms that could be interpreted against the customer.
- weak_sla: Service level commitments are missing, vague, or have no remedies.
- poor_data_terms: Inadequate data protection, retention, or return provisions.

Be concise. Focus on what matters to the customer.
"""
