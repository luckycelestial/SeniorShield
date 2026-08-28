"""
threat_intelligence/providers/base.py
======================================
Abstract Base Provider for External Threat Intelligence.
"""

from abc import ABC, abstractmethod
from threat_intelligence.models import Entity, ThreatIntelResult


class ThreatIntelligenceProvider(ABC):
    """
    Abstract interface for Threat Intelligence providers.
    Allows swappable backends (Mock, URLhaus, VirusTotal, etc.).
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Unique identifier of the provider."""
        pass

    @abstractmethod
    def check_entity(self, entity: Entity) -> ThreatIntelResult:
        """
        Check reputation of a single entity (URL, Domain, Phone, Email).
        """
        pass
