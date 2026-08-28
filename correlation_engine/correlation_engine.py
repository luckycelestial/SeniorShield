import csv
import json
from collections import defaultdict, deque
from datetime import datetime
from dataclasses import dataclass, field
from typing import List, Dict, Set, Any, Optional

@dataclass
class Event:
    event_id: str
    timestamp: str
    channel: str
    phone: str
    sender: str
    domain: str
    app: str
    risk_score: float
    intent: str

    @classmethod
    def from_dict(cls, d: Dict[str, str]) -> "Event":
        return cls(
            event_id=d["event_id"],
            timestamp=d["timestamp"],
            channel=d["channel"],
            phone=d.get("phone", "").strip(),
            sender=d.get("sender", "").strip(),
            domain=d.get("domain", "").strip(),
            app=d.get("app", "").strip(),
            risk_score=float(d.get("risk_score", 0.0)),
            intent=d.get("intent", "").strip()
        )

    def extract_entities(self) -> List[str]:
        entities = []
        if self.phone:
            entities.append(f"phone:{self.phone}")
        if self.sender:
            entities.append(f"sender:{self.sender}")
        if self.domain:
            entities.append(f"domain:{self.domain}")
        return entities


class DisjointSet:
    def __init__(self):
        self.parent = {}

    def find(self, item: str) -> str:
        if item not in self.parent:
            self.parent[item] = item
            return item
        if self.parent[item] != item:
            self.parent[item] = self.find(self.parent[item])
        return self.parent[item]

    def union(self, item1: str, item2: str):
        root1 = self.find(item1)
        root2 = self.find(item2)
        if root1 != root2:
            self.parent[root1] = root2


class CampaignCorrelationEngine:
    def __init__(self, min_risk_threshold: float = 0.50, min_cluster_events: int = 3):
        self.min_risk_threshold = min_risk_threshold
        self.min_cluster_events = min_cluster_events

    def load_events_from_csv(self, csv_filepath: str) -> List[Event]:
        events = []
        with open(csv_filepath, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                events.append(Event.from_dict(row))
        return events

    def analyze(self, events: List[Event]) -> Dict[str, Any]:
        """
        Correlates events into campaign clusters based on shared entities and temporal proximity.
        """
        dset = DisjointSet()

        # Step 1: Connect entities shared across events
        for evt in events:
            entities = evt.extract_entities()
            if not entities:
                continue
            # Union all entities present in the same event
            first_entity = entities[0]
            for other_entity in entities[1:]:
                dset.union(first_entity, other_entity)

        # Step 2: Map each event to entity cluster root
        cluster_to_events = defaultdict(list)
        unclustered_events = []

        for evt in events:
            entities = evt.extract_entities()
            if not entities:
                unclustered_events.append(evt)
                continue
            # Pick primary root
            root = dset.find(entities[0])
            cluster_to_events[root].append(evt)

        # Step 3: Classify Clusters into Scam Campaigns vs Benign Noise
        scam_campaigns = []
        benign_clusters = []

        campaign_idx = 1
        for root_entity, cluster_events in cluster_to_events.items():
            avg_risk = sum(e.risk_score for e in cluster_events) / len(cluster_events)
            max_risk = max(e.risk_score for e in cluster_events)

            # High risk or multi-event cluster indicates a campaign
            is_scam = (avg_risk >= self.min_risk_threshold) and (len(cluster_events) >= self.min_cluster_events or max_risk >= 0.70)

            if is_scam:
                campaign_summary = self._build_campaign_summary(f"CAMPAIGN_{campaign_idx:02d}", cluster_events)
                scam_campaigns.append(campaign_summary)
                campaign_idx += 1
            else:
                benign_clusters.append({
                    "event_count": len(cluster_events),
                    "event_ids": [e.event_id for e in cluster_events],
                    "avg_risk_score": round(avg_risk, 3)
                })

        # Sort campaigns by cumulative threat / total events
        scam_campaigns.sort(key=lambda c: c["cumulative_risk_score"], reverse=True)

        return {
            "total_events_analyzed": len(events),
            "detected_scam_campaigns_count": len(scam_campaigns),
            "benign_unclustered_count": len(unclustered_events) + sum(b["event_count"] for b in benign_clusters),
            "campaigns": scam_campaigns,
            "benign_clusters": benign_clusters
        }

    def _build_campaign_summary(self, campaign_id: str, events: List[Event]) -> Dict[str, Any]:
        # Sort chronologically
        events_sorted = sorted(events, key=lambda x: x.timestamp)
        
        phones = sorted(list({e.phone for e in events if e.phone}))
        senders = sorted(list({e.sender for e in events if e.sender}))
        domains = sorted(list({e.domain for e in events if e.domain}))
        channels = sorted(list({e.channel for e in events}))
        apps = sorted(list({e.app for e in events}))
        intents = sorted(list({e.intent for e in events}))

        avg_risk = sum(e.risk_score for e in events) / len(events)
        max_risk = max(e.risk_score for e in events)
        cumulative_risk = sum(e.risk_score for e in events)

        # Determine threat level
        if max_risk >= 0.85 or avg_risk >= 0.75:
            threat_level = "CRITICAL"
        elif max_risk >= 0.65 or avg_risk >= 0.50:
            threat_level = "HIGH"
        else:
            threat_level = "MEDIUM"

        # Determine primary intent / archetype based on intent frequency
        intent_counts = defaultdict(int)
        for e in events:
            intent_counts[e.intent] += 1
        primary_intent = max(intent_counts, key=intent_counts.get) if intent_counts else "unknown"

        # Build temporal flow timeline
        timeline = []
        for e in events_sorted:
            timeline.append({
                "event_id": e.event_id,
                "timestamp": e.timestamp,
                "channel": e.channel,
                "app": e.app,
                "phone": e.phone,
                "sender": e.sender,
                "domain": e.domain,
                "risk_score": e.risk_score,
                "intent": e.intent
            })

        return {
            "campaign_id": campaign_id,
            "threat_level": threat_level,
            "primary_intent": primary_intent,
            "total_events": len(events),
            "avg_risk_score": round(avg_risk, 3),
            "max_risk_score": max_risk,
            "cumulative_risk_score": round(cumulative_risk, 2),
            "channels_involved": channels,
            "apps_targeted": apps,
            "shared_identifiers": {
                "phones": phones,
                "senders": senders,
                "domains": domains
            },
            "intents_detected": intents,
            "first_seen": events_sorted[0].timestamp,
            "last_seen": events_sorted[-1].timestamp,
            "timeline": timeline
        }

if __name__ == "__main__":
    import sys
    csv_file = sys.argv[1] if len(sys.argv) > 1 else "events.csv"
    engine = CampaignCorrelationEngine()
    events = engine.load_events_from_csv(csv_file)
    results = engine.analyze(events)
    print(json.dumps(results, indent=2))
