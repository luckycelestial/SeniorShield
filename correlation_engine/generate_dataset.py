import csv
import random
from datetime import datetime, timedelta

def generate_events(output_file="events.csv", total_events=200, seed=42):
    random.seed(seed)
    base_time = datetime(2026, 8, 20, 9, 0, 0)
    
    events = []
    
    # ---------------------------------------------------------
    # Campaign 1: Electricity Bill Disconnection Scam (50 events)
    # Shared Entities: Phones, Senders, Domains linked via cross-channel co-occurrence
    # ---------------------------------------------------------
    c1_phones = ["+919876543210", "+919876543211"]
    c1_senders = ["EB-NOTIF", "PWR-ALERT"]
    c1_domains = ["pay-elec-bill-now.com", "electricity-update.in"]
    c1_intents = ["urgency_coercion", "fake_utility_disconnection", "phishing_payment", "credential_harvesting"]
    
    # ---------------------------------------------------------
    # Campaign 2: CBI / Police Digital Arrest Extortion Scam (50 events)
    # Shared Entities: Phones, Senders, Domains linked via cross-channel co-occurrence
    # ---------------------------------------------------------
    c2_phones = ["+919123456789", "+919123456790"]
    c2_senders = ["CBI-NOTICE", "POLICE-DEPT"]
    c2_domains = ["cbi-verification-portal.com", "cyber-dept-verify.net"]
    c2_intents = ["authority_impersonation", "extortion_fear", "fake_arrest_warrant", "remote_access_harvest"]

    # ---------------------------------------------------------
    # Campaign 3: Fake Bank KYC / Account Block Phishing (50 events)
    # Shared Entities: Phones, Senders, Domains linked via cross-channel co-occurrence
    # ---------------------------------------------------------
    c3_phones = ["+919988776655", "+919988776644"]
    c3_senders = ["SBI-UPDATE", "HDFC-KYC"]
    c3_domains = ["sbi-kyc-update-portal.org", "verify-bank-account.info"]
    c3_intents = ["kyc_harvesting", "account_block_panic", "phishing_login", "unauthorized_transfer"]

    # ---------------------------------------------------------
    # Benign Events (50 events)
    # ---------------------------------------------------------
    benign_phones = ["+919820012345", "+919820054321", "+919870011223", "+919711009988"]
    benign_senders = ["HDFCBK", "AMAZON", "SWIGGY", "ZOMATO", "IRCTC"]
    benign_domains = ["amazon.in", "hdfcbank.com", "zomato.com", "swiggy.com", "irctc.co.in"]
    benign_intents = ["benign_social", "otp_notification", "delivery_update", "regular_payment", "personal_call"]

    campaign_configs = [
        ("CAMPAIGN_ELEC", 50, c1_phones, c1_senders, c1_domains, c1_intents, (0.75, 0.98), "Phone", "Messages", "Chrome", "GPay"),
        ("CAMPAIGN_CBI", 50, c2_phones, c2_senders, c2_domains, c2_intents, (0.85, 0.99), "Phone", "WhatsApp", "Chrome", "PhonePe"),
        ("CAMPAIGN_KYC", 50, c3_phones, c3_senders, c3_domains, c3_intents, (0.70, 0.95), "Phone", "Messages", "Chrome", "Paytm"),
    ]

    all_raw_events = []
    
    # Build campaign events with interconnected entities
    for camp_id, count, phones, senders, domains, intents, risk_range, call_app, sms_app, url_app, pay_app in campaign_configs:
        channels = ["call", "SMS", "URL", "payment"]
        for idx in range(count):
            ch = channels[idx % len(channels)]
            
            phone = random.choice(phones)
            sender = random.choice(senders)
            domain = random.choice(domains)
            
            if ch == "call":
                app = call_app
                # Call events link phone, and 60% of time include sender/domain in log metadata
                sender_val = sender if random.random() > 0.4 else ""
                domain_val = domain if random.random() > 0.6 else ""
                phone_val = phone
            elif ch == "SMS":
                app = sms_app
                # SMS events link sender, phone (callback), and domain (phishing link)
                sender_val = sender
                phone_val = phone if random.random() > 0.3 else ""
                domain_val = domain if random.random() > 0.4 else ""
            elif ch == "URL":
                app = url_app
                # URL events link domain, phone, and sender
                domain_val = domain
                phone_val = phone if random.random() > 0.4 else ""
                sender_val = sender if random.random() > 0.5 else ""
            else: # payment
                app = pay_app
                # Payment events link domain and phone
                domain_val = domain
                phone_val = phone
                sender_val = sender if random.random() > 0.5 else ""

            risk_score = round(random.uniform(*risk_range), 2)
            intent = random.choice(intents)
            
            all_raw_events.append({
                "channel": ch,
                "phone": phone_val,
                "sender": sender_val,
                "domain": domain_val,
                "app": app,
                "risk_score": risk_score,
                "intent": intent,
                "campaign_label": camp_id
            })

    # Build benign events
    for _ in range(50):
        ch = random.choice(["call", "SMS", "URL", "payment"])
        if ch == "call":
            app = "Phone"
            phone = random.choice(benign_phones)
            sender = ""
            domain = ""
        elif ch == "SMS":
            app = "Messages"
            phone = ""
            sender = random.choice(benign_senders)
            domain = ""
        elif ch == "URL":
            app = "Chrome"
            phone = ""
            sender = ""
            domain = random.choice(benign_domains)
        else: # payment
            app = random.choice(["GPay", "PhonePe", "Paytm"])
            phone = ""
            sender = ""
            domain = random.choice(benign_domains)
            
        risk_score = round(random.uniform(0.00, 0.20), 2)
        intent = random.choice(benign_intents)
        
        all_raw_events.append({
            "channel": ch,
            "phone": phone,
            "sender": sender,
            "domain": domain,
            "app": app,
            "risk_score": risk_score,
            "intent": intent,
            "campaign_label": "BENIGN"
        })

    # Shuffle and assign timestamps & event IDs
    random.shuffle(all_raw_events)
    
    current_time = base_time
    fieldnames = ["event_id", "timestamp", "channel", "phone", "sender", "domain", "app", "risk_score", "intent"]
    
    for i, raw in enumerate(all_raw_events, start=1):
        current_time += timedelta(minutes=random.randint(1, 45))
        event = {
            "event_id": f"EVT_{i:03d}",
            "timestamp": current_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "channel": raw["channel"],
            "phone": raw["phone"],
            "sender": raw["sender"],
            "domain": raw["domain"],
            "app": raw["app"],
            "risk_score": raw["risk_score"],
            "intent": raw["intent"]
        }
        events.append(event)

    # Write CSV
    with open(output_file, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(events)
        
    print(f"[SUCCESS] Generated {len(events)} synthetic events saved to '{output_file}'.")
    return events

if __name__ == "__main__":
    generate_events()
