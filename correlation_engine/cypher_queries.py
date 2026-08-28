import os
import json
from typing import Dict, List, Any, Optional
from neo4j_exporter import Neo4jScamGraphStore

QUERY_1_LIST_CAMPAIGNS = """
MATCH (c:Campaign)
OPTIONAL MATCH (e:Event)-[:BELONGS_TO]->(c)
RETURN c.campaign_id AS campaign_id,
       c.threat_level AS threat_level,
       count(e) AS event_count,
       c.cumulative_risk AS cumulative_risk,
       c.avg_risk_score AS avg_risk_score,
       c.max_risk_score AS max_risk_score
ORDER BY c.cumulative_risk DESC
"""

QUERY_2_EVENTS_BY_PHONE = """
MATCH (p:PhoneNumber {number: $phone_number})<-[:INVOLVES]-(e:Event)
OPTIONAL MATCH (e)-[:BELONGS_TO]->(c:Campaign)
OPTIONAL MATCH (e)-[:INVOLVES]->(s:SenderID)
OPTIONAL MATCH (e)-[:INVOLVES]->(d:Domain)
RETURN e.event_id AS event_id,
       e.timestamp AS timestamp,
       e.channel AS channel,
       e.app AS app,
       e.risk_score AS risk_score,
       e.intent AS intent,
       c.campaign_id AS campaign_id,
       s.sender_id AS sender_id,
       d.domain_name AS domain_name
ORDER BY e.timestamp ASC
"""

QUERY_3_CROSS_CHANNEL_PATH = """
MATCH (c:Campaign)<-[:BELONGS_TO]-(callEvent:Event {channel: 'call'})
MATCH (callEvent)-[r1:TEMPORAL_LINK]->(smsEvent:Event {channel: 'SMS'})
MATCH (smsEvent)-[r2:TEMPORAL_LINK]->(urlEvent:Event {channel: 'URL'})
WHERE ($campaign_id IS NULL OR c.campaign_id = $campaign_id)
RETURN c.campaign_id AS campaign_id,
       callEvent.event_id AS call_event_id,
       callEvent.timestamp AS call_time,
       callEvent.intent AS call_intent,
       r1.delta_hours AS call_to_sms_hours,
       smsEvent.event_id AS sms_event_id,
       smsEvent.timestamp AS sms_time,
       smsEvent.intent AS sms_intent,
       r2.delta_hours AS sms_to_url_hours,
       urlEvent.event_id AS url_event_id,
       urlEvent.timestamp AS url_time,
       urlEvent.intent AS url_intent
ORDER BY call_time ASC
"""

def execute_and_print_scam_queries(
    store: Neo4jScamGraphStore,
    target_phone: str = "+919876543210",
    target_campaign: Optional[str] = None
):
    print("=" * 75)
    print("           SeniorShield — Neo4j Cypher Graph Analytics")
    print("=" * 75)

    with store.driver.session(database=store.database) as session:
        # ---------------------------------------------------------------------
        # Query 1: List all campaigns with event counts and cumulative risk
        # ---------------------------------------------------------------------
        print("\n[QUERY 1] All Campaigns with Event Counts & Cumulative Risk")
        print("-" * 75)
        res1 = session.run(QUERY_1_LIST_CAMPAIGNS).data()
        
        if res1:
            print(f"{'Campaign ID':<24} {'Threat':<10} {'Event Count':<12} {'Cumulative Risk':<18} {'Avg Risk':<10}")
            print("-" * 75)
            for row in res1:
                print(f"{row['campaign_id']:<24} {str(row['threat_level']):<10} {row['event_count']:<12} {float(row['cumulative_risk'] or 0.0):<18.3f} {float(row['avg_risk_score'] or 0.0):<10.3f}")
        else:
            print("No Campaign nodes found in database.")

        # ---------------------------------------------------------------------
        # Query 2: Find all events connected to a given phone number
        # ---------------------------------------------------------------------
        print(f"\n[QUERY 2] All Events Connected to Phone Number: '{target_phone}'")
        print("-" * 75)
        res2 = session.run(QUERY_2_EVENTS_BY_PHONE, phone_number=target_phone).data()
        
        if res2:
            print(f"{'Event ID':<10} {'Channel':<8} {'Timestamp':<22} {'Risk':<6} {'Intent':<25} {'Campaign':<20}")
            print("-" * 75)
            for row in res2:
                camp = row.get("campaign_id") or "N/A"
                print(f"{row['event_id']:<10} {row['channel']:<8} {row['timestamp']:<22} {float(row['risk_score']):<6.2f} {row['intent']:<25} {camp:<20}")
        else:
            print(f"No events connected to phone number '{target_phone}'.")

        # ---------------------------------------------------------------------
        # Query 3: Show cross-channel attack path (call -> SMS -> URL)
        # ---------------------------------------------------------------------
        print("\n[QUERY 3] Cross-Channel Campaign Attack Path (call -> SMS -> URL)")
        print("-" * 75)
        res3 = session.run(QUERY_3_CROSS_CHANNEL_PATH, campaign_id=target_campaign).data()
        
        if res3:
            for i, row in enumerate(res3, start=1):
                print(f"Path #{i} (Campaign: {row['campaign_id']}):")
                print(f"  1. CALL : {row['call_event_id']} ({row['call_time']}) - Intent: {row['call_intent']}")
                print(f"        |-----> (+{row['call_to_sms_hours']:.2f} hrs)")
                print(f"  2. SMS  : {row['sms_event_id']} ({row['sms_time']}) - Intent: {row['sms_intent']}")
                print(f"        |-----> (+{row['sms_to_url_hours']:.2f} hrs)")
                print(f"  3. URL  : {row['url_event_id']} ({row['url_time']}) - Intent: {row['url_intent']}\n")
        else:
            print("No cross-channel (call -> SMS -> URL) attack paths matching the criteria.")

    print("=" * 75)

if __name__ == "__main__":
    store = Neo4jScamGraphStore()

    # Create mock session execution demonstration if live DB not connected
    try:
        store.connect()
        execute_and_print_scam_queries(store)
    except Exception as e:
        print(f"[NOTE] Live database connection error: {e}")
        print("\nDisplaying exact Cypher Query templates:")
        print("\n1. List all campaigns with event counts and cumulative risk:\n", QUERY_1_LIST_CAMPAIGNS)
        print("\n2. Find all events connected to phone number:\n", QUERY_2_EVENTS_BY_PHONE)
        print("\n3. Cross-channel path (call -> SMS -> URL):\n", QUERY_3_CROSS_CHANNEL_PATH)
