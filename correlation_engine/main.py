import json
import os
try:
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    load_dotenv(dotenv_path=env_path)
    load_dotenv()
except ImportError:
    pass

from generate_dataset import generate_events
from correlation_engine import CampaignCorrelationEngine
from visualizer import generate_html_visualization

from campaign_clustering import (
    run_leiden,
    attach_communities,
    summarize_campaigns,
    classify_campaigns,
)

def main():
    print("=" * 70)
    print("      SeniorShield — Scam Campaign Correlation Engine Pipeline")
    print("=" * 70)

    # 1. Dataset Generation
    csv_file = "events.csv"
    print(f"\n[STEP 1] Generating 200 synthetic events across channels...")
    generate_events(output_file=csv_file, total_events=200, seed=42)

    # Also save a copy at parent directory level if running inside SeniorShield
    parent_csv = os.path.join("..", "events.csv")
    try:
        generate_events(output_file=parent_csv, total_events=200, seed=42)
    except Exception:
        pass

    # 2. Correlation Engine Execution
    engine = CampaignCorrelationEngine(
        min_risk_threshold=0.50,
        min_cluster_events=3
    )

    events = engine.load_events_from_csv(csv_file)

    # ============================================================
    # LEIDEN CAMPAIGN CORRELATION
    # ============================================================

    print("\n[STEP 2] Building weighted event-correlation graph...")

    leiden_memberships, leiden_stats = run_leiden(
        events,
        resolution=1.0,
        seed=42
    )

    print(
        f"[LEIDEN] Nodes: "
        f"{leiden_stats['node_count']}"
    )

    print(
        f"[LEIDEN] Correlation edges: "
        f"{leiden_stats['edge_count']}"
    )

    print(
        f"[LEIDEN] Communities detected: "
        f"{leiden_stats['community_count']}"
    )

    print(
        f"[LEIDEN] Modularity: "
        f"{leiden_stats['modularity']:.4f}"
    )

    # Attach Leiden community IDs to events
    events_with_communities = attach_communities(
        events,
        leiden_memberships
    )

    # Convert communities into campaigns
    all_leiden_communities = summarize_campaigns(
        events_with_communities
    )

    scam_campaigns, benign_communities = classify_campaigns(
        all_leiden_communities
    )

    # ============================================================
    # BUILD FINAL RESULTS OBJECT
    # ============================================================

    scam_event_ids = {
        event_id
        for campaign in scam_campaigns
        for event_id in campaign["event_ids"]
    }

    benign_event_count = (
        len(events) - len(scam_event_ids)
    )

    results = {
        "total_events_analyzed": len(events),

        "detected_scam_campaigns_count": len(
            scam_campaigns
        ),

        "benign_unclustered_count": benign_event_count,

        "leiden": leiden_stats,

        "campaigns": scam_campaigns,

        "benign_communities": benign_communities,
    }

    # 3. Export Summary JSON
    summary_file = "campaign_summary.json"
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"[SUCCESS] Analysis results exported to '{summary_file}'.")

    # 4. Generate Interactive Visualizer Report
    vis_file = "campaign_visualization.html"
    print(f"\n[STEP 3] Rendering interactive visualizer report...")
    generate_html_visualization(results, output_path=vis_file)

    # 5. Optional Neo4j AuraDB Ingestion
    print(f"\n[STEP 4] Neo4j AuraDB Graph Store Ingestion...")
    neo4j_uri = os.getenv("NEO4J_URI")
    if neo4j_uri:
        try:
            from neo4j_exporter import Neo4jScamGraphStore
            print(f"Connecting to Neo4j AuraDB instance at '{neo4j_uri}'...")
            with Neo4jScamGraphStore() as store:
                store.ingest_campaign_results(results)
            print("[SUCCESS] Campaign graph successfully ingested into Neo4j AuraDB.")
        except Exception as e:
            print(f"[WARNING] Failed to ingest into Neo4j: {e}")
    else:
        print("[INFO] NEO4J_URI env variable not set. Skipping live Neo4j upload.")
        print("       To enable Neo4j sync: set NEO4J_URI=bolt://... NEO4J_USER=... NEO4J_PASSWORD=...")

    # 5. Output Console Summary Table
    print("\n" + "=" * 70)
    print("                    CAMPAIGN DETECTION SUMMARY REPORT")
    print("=" * 70)
    print(f"Total Ingested Events       : {results['total_events_analyzed']}")
    print(f"Leiden Communities Detected : {leiden_stats['community_count']}")
    print(f"Qualified Scam Campaigns    : {len(scam_campaigns)}")
    print(f"Benign / Noise Events       : {benign_event_count}")
    print("-" * 70)

    for camp in results["campaigns"]:
        print(f"\n[+] [{camp['campaign_id']}] Threat Level: {camp['threat_level']}")
        print(f"  • Primary Vector    : {camp['primary_intent']}")
        print(f"  • Total Events      : {camp['total_events']}")
        print(f"  • Avg Risk Score    : {camp['avg_risk_score']} | Cumulative Risk: {camp.get('cumulative_risk_score', camp.get('cumulative_risk', 0.0))}")
        print(f"  • Channels          : {', '.join(camp['channels_involved'])}")
        print(f"  • Shared Phones     : {', '.join(camp['shared_identifiers']['phones']) or 'None'}")
        print(f"  • Shared Senders    : {', '.join(camp['shared_identifiers']['senders']) or 'None'}")
        print(f"  • Shared Domains    : {', '.join(camp['shared_identifiers']['domains']) or 'None'}")

    print("\n" + "=" * 70)
    print(f"Pipeline Completed Successfully! All output files generated in working directory.")
    print("=" * 70)

if __name__ == "__main__":
    main()
