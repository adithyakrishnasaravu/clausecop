from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ClassifyResult:
    category: str
    confidence: float


@dataclass
class RiskSignals:
    one_sided: bool = False
    uncapped_liability: bool = False
    broad_indemnity: bool = False
    short_cure_period: bool = False
    auto_renewal: bool = False
    non_standard: bool = False
    missing_mutual: bool = False
    unlimited_ip: bool = False
    weak_termination: bool = False
    vague_language: bool = False
    weak_sla: bool = False
    poor_data_terms: bool = False

    def to_dict(self) -> dict[str, bool]:
        return {
            "one_sided": self.one_sided,
            "uncapped_liability": self.uncapped_liability,
            "broad_indemnity": self.broad_indemnity,
            "short_cure_period": self.short_cure_period,
            "auto_renewal": self.auto_renewal,
            "non_standard": self.non_standard,
            "missing_mutual": self.missing_mutual,
            "unlimited_ip": self.unlimited_ip,
            "weak_termination": self.weak_termination,
            "vague_language": self.vague_language,
            "weak_sla": self.weak_sla,
            "poor_data_terms": self.poor_data_terms,
        }

    @classmethod
    def from_dict(cls, d: dict) -> RiskSignals:
        return cls(**{k: bool(v) for k, v in d.items() if k in cls.__dataclass_fields__})


@dataclass
class RiskAnalysisResult:
    signals: RiskSignals
    severity: str
    summary: str
    recommendation: str
