import math
from collections import defaultdict
from datetime import datetime

import igraph as ig
import leidenalg


# ============================================================
# SeniorShield — Weighted Leiden Campaign Correlation
# ============================================================

ENTITY_WEIGHTS = {
    "phone": 1.00,
    "domain": 0.90,
    "sender": 0.85,
    "app": 0.80,
}

TEMPORAL_WEIGHT = 0.35

MAX_TIME_HOURS = 24.0


def parse_timestamp(value):
    """Parse ISO-8601 timestamps."""
    value = str(value).replace("Z", "+00:00")
    return datetime.fromisoformat(value)


def _to_dict(event):
    """Ensure event is a dict whether passed as a dict or dataclass instance."""
    if isinstance(event, dict):
        return event
    if hasattr(event, "__dict__"):
        return event.__dict__
    return dict(event)


def event_entities(event):
    """
    Return normalized threat infrastructure identifiers for an event.
    Note: Generic client apps (Phone, Messages, Chrome) are runtime applications
    and not threat actor infrastructure, so they are excluded from correlation entity matching.
    """
    event = _to_dict(event)
    entities = set()

    if event.get("phone"):
        entities.add(("phone", str(event["phone"]).strip()))

    if event.get("sender"):
        entities.add(("sender", str(event["sender"]).strip()))

    if event.get("domain"):
        entities.add(("domain", str(event["domain"]).strip()))

    return entities


def temporal_score(delta_hours):
    """
    Convert temporal distance into a score.

    0 hours  -> 1.0
    72 hours -> close to 0
    """

    if delta_hours < 0:
        delta_hours = abs(delta_hours)

    if delta_hours > MAX_TIME_HOURS:
        return 0.0

    return max(
        0.0,
        1.0 - (delta_hours / MAX_TIME_HOURS)
    )


def calculate_edge_weight(event_a, event_b):
    """
    SeniorShield campaign-correlation score.

    Strong evidence:
        shared phone
        shared domain
        shared sender
        shared app

    Supporting evidence:
        temporal proximity
        cross-channel relationship

    Same-channel activity alone is NOT sufficient.
    """
    event_a = _to_dict(event_a)
    event_b = _to_dict(event_b)

    entities_a = event_entities(event_a)
    entities_b = event_entities(event_b)

    shared_entities = entities_a.intersection(
        entities_b
    )

    # --------------------------------------------------------
    # No shared infrastructure → no campaign edge
    # --------------------------------------------------------

    if not shared_entities:
        return 0.0

    # --------------------------------------------------------
    # Infrastructure evidence
    # --------------------------------------------------------

    entity_score = 0.0

    for entity_type, _ in shared_entities:
        entity_score += ENTITY_WEIGHTS.get(
            entity_type,
            0.0
        )

    # --------------------------------------------------------
    # Temporal evidence
    # --------------------------------------------------------

    dt_a = parse_timestamp(
        event_a["timestamp"]
    )

    dt_b = parse_timestamp(
        event_b["timestamp"]
    )

    delta_hours = abs(
        (dt_b - dt_a).total_seconds()
    ) / 3600.0

    if delta_hours > MAX_TIME_HOURS:
        return 0.0

    time_score = (
        TEMPORAL_WEIGHT
        * temporal_score(delta_hours)
    )

    # --------------------------------------------------------
    # Cross-channel evidence
    # --------------------------------------------------------

    channel_a = str(
        event_a.get("channel", "")
    ).lower()

    channel_b = str(
        event_b.get("channel", "")
    ).lower()

    cross_channel_bonus = 0.0

    if channel_a != channel_b:

        cross_channel_bonus = 0.40

    # --------------------------------------------------------
    # Same-channel penalty
    #
    # Same-channel events are allowed only when they
    # share infrastructure, but they should not dominate
    # cross-channel relationships.
    # --------------------------------------------------------

    same_channel_adjustment = 0.0

    if channel_a == channel_b:
        same_channel_adjustment = -0.10

    # --------------------------------------------------------
    # Final score
    # --------------------------------------------------------

    score = (
        entity_score
        + time_score
        + cross_channel_bonus
        + same_channel_adjustment
    )

    return round(
        max(0.0, score),
        6
    )


def build_event_graph(events):
    """
    Build an undirected weighted event graph.

    Node:
        Event

    Edge:
        Two events are connected when they have
        meaningful campaign similarity.
    """

    events = [_to_dict(evt) for evt in events]

    graph = ig.Graph(
        n=len(events),
        directed=False
    )

    graph.vs["event_id"] = [
        str(event["event_id"])
        for event in events
    ]

    edges = []
    weights = []

    for i in range(len(events)):

        for j in range(i + 1, len(events)):

            weight = calculate_edge_weight(
                events[i],
                events[j]
            )

            # Ignore weak/noisy connections.
            if weight < 0.75:
                continue

            edges.append((i, j))
            weights.append(weight)

    if edges:
        graph.add_edges(edges)
        graph.es["weight"] = weights

    return graph


def run_leiden(events, resolution=1.0, seed=42):
    """
    Run Leiden community detection on the weighted
    event-correlation graph.
    """

    events = [_to_dict(evt) for evt in events]

    graph = build_event_graph(events)

    if graph.vcount() == 0:
        return [], {
            "node_count": 0,
            "edge_count": 0,
            "community_count": 0,
            "modularity": 0.0,
        }

    if graph.ecount() == 0:
        memberships = list(range(graph.vcount()))

        return memberships, {
            "node_count": graph.vcount(),
            "edge_count": 0,
            "community_count": graph.vcount(),
            "modularity": 0.0,
        }

    partition = leidenalg.find_partition(
        graph,
        leidenalg.RBConfigurationVertexPartition,
        weights="weight",
        resolution_parameter=resolution,
        seed=seed,
    )

    memberships = partition.membership

    stats = {
        "node_count": graph.vcount(),
        "edge_count": graph.ecount(),
        "community_count": len(set(memberships)),
        "modularity": float(partition.modularity),
    }

    return memberships, stats


def attach_communities(events, memberships):
    """
    Add Leiden community ID to each event.
    """

    enriched_events = []

    for event, community_id in zip(events, memberships):

        enriched = dict(_to_dict(event))

        enriched["community_id"] = int(community_id)

        enriched_events.append(enriched)

    return enriched_events


def summarize_campaigns(events):
    """
    Convert Leiden communities into campaign summaries.

    Each community becomes a campaign and retains its complete
    event timeline so it can be visualized and ingested into Neo4j.
    """

    events = [_to_dict(evt) for evt in events]

    groups = defaultdict(list)

    for event in events:
        groups[event["community_id"]].append(event)

    campaigns = []

    for community_id, members in sorted(groups.items()):

        # --------------------------------------------------------
        # Sort events chronologically
        # --------------------------------------------------------

        members = sorted(
            members,
            key=lambda e: parse_timestamp(e["timestamp"])
        )

        # --------------------------------------------------------
        # Risk statistics
        # --------------------------------------------------------

        risk_scores = [
            float(event.get("risk_score", 0.0))
            for event in members
        ]

        avg_risk = (
            sum(risk_scores) / len(risk_scores)
            if risk_scores
            else 0.0
        )

        max_risk = max(
            risk_scores,
            default=0.0
        )

        cumulative_risk = sum(risk_scores)

        # --------------------------------------------------------
        # Channels
        # --------------------------------------------------------

        channels = sorted({
            str(event.get("channel"))
            for event in members
            if event.get("channel")
        })

        # --------------------------------------------------------
        # Shared entities
        # --------------------------------------------------------

        phones = sorted({
            str(event.get("phone")).strip()
            for event in members
            if event.get("phone")
        })

        senders = sorted({
            str(event.get("sender")).strip()
            for event in members
            if event.get("sender")
        })

        domains = sorted({
            str(event.get("domain")).strip()
            for event in members
            if event.get("domain")
        })

        apps = sorted({
            str(event.get("app")).strip()
            for event in members
            if event.get("app")
        })

        # --------------------------------------------------------
        # Primary intent
        # --------------------------------------------------------

        intents = [
            str(event.get("intent")).strip()
            for event in members
            if event.get("intent")
        ]

        if intents:
            primary_intent = max(
                set(intents),
                key=intents.count
            )
        else:
            primary_intent = "unknown"

        # --------------------------------------------------------
        # Threat level
        # --------------------------------------------------------

        if max_risk >= 0.85 or avg_risk >= 0.75:
            threat_level = "CRITICAL"

        elif max_risk >= 0.65 or avg_risk >= 0.50:
            threat_level = "HIGH"

        else:
            threat_level = "MEDIUM"

        # --------------------------------------------------------
        # Campaign object
        # --------------------------------------------------------

        campaigns.append({
            "campaign_id": f"CAMPAIGN_LEIDEN_{community_id}",

            "community_id": int(community_id),

            "threat_level": threat_level,

            "primary_intent": primary_intent,

            "avg_risk_score": round(avg_risk, 3),

            "max_risk_score": round(max_risk, 3),

            "cumulative_risk": round(
                cumulative_risk,
                3
            ),

            "total_events": len(members),

            "channels_involved": channels,

            "shared_identifiers": {
                "phones": phones,
                "senders": senders,
                "domains": domains,
                "apps": apps,
            },

            "event_ids": [
                event["event_id"]
                for event in members
            ],

            # IMPORTANT:
            # Neo4j exporter needs this.
            "timeline": members,
        })

    return campaigns


def classify_community(campaign):
    """
    Decide whether a Leiden community represents
    a meaningful scam campaign or benign/noise activity.
    """

    events = campaign["total_events"]
    avg_risk = campaign["avg_risk_score"]
    max_risk = campaign["max_risk_score"]

    channels = campaign["channels_involved"]
    channel_count = len(channels)

    phones = campaign["shared_identifiers"]["phones"]
    senders = campaign["shared_identifiers"]["senders"]
    domains = campaign["shared_identifiers"]["domains"]

    infrastructure_count = (
        len(phones)
        + len(senders)
        + len(domains)
    )

    # --------------------------------------------------------
    # Strong scam evidence
    # --------------------------------------------------------

    if (
        avg_risk >= 0.60
        and infrastructure_count >= 2
        and (
            channel_count >= 2
            or max_risk >= 0.85
        )
    ):
        return "SCAM_CAMPAIGN"

    # --------------------------------------------------------
    # High-risk even if only one channel
    # --------------------------------------------------------

    if (
        max_risk >= 0.85
        and avg_risk >= 0.65
    ):
        return "SCAM_CAMPAIGN"

    # --------------------------------------------------------
    # Otherwise treat as noise/activity
    # --------------------------------------------------------

    return "BENIGN_OR_NOISE"


def classify_campaigns(campaigns):
    """
    Classify Leiden communities into scam campaigns
    or benign/noise communities.
    """

    scam_campaigns = []
    benign_communities = []

    for campaign in campaigns:

        classification = classify_community(
            campaign
        )

        campaign["classification"] = classification

        if classification == "SCAM_CAMPAIGN":
            scam_campaigns.append(campaign)

        else:
            benign_communities.append(campaign)

    return scam_campaigns, benign_communities