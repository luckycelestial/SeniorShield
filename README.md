# 🛡️ SeniorShield
### Autonomous Digital Scam & Multi-Channel Campaign Protection for Senior Citizens

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![DistilBERT](https://img.shields.io/badge/ML-DistilBERT--scam--v1-FF6F00.svg?style=flat&logo=huggingface)](https://huggingface.co)
[![Groq](https://img.shields.io/badge/LLM-Groq--Llama%203.3-F55036.svg?style=flat)](https://groq.com)
[![Neo4j](https://img.shields.io/badge/Graph_DB-Neo4j-008CC1.svg?style=flat&logo=neo4j)](https://neo4j.com)
[![React Native](https://img.shields.io/badge/Mobile-React_Native_%7C_Expo_54-61DAFB.svg?style=flat&logo=react)](https://reactnative.dev)
[![Kotlin](https://img.shields.io/badge/Android_Native-Kotlin-7F52FF.svg?style=flat&logo=kotlin)](https://kotlinlang.org)

---

## 📌 1. Overview & Problem Statement

Senior citizens are disproportionately targeted by complex digital fraud operations spanning **fake bank KYC updates, digital arrest intimidation, utility disconnection threats, OTP/credential harvesting, and malicious remote-desktop tools (AnyDesk/TeamViewer/APK droppers)**.

Modern scammers execute **multi-step, multi-channel fraud campaigns** across phone calls, SMS messages, and phishing URLs over hours or days. Existing security tools fail senior citizens because they:
1. Output complex technical jargon (e.g., *"SSL certificate domain mismatch"*).
2. Place the cognitive burden of decision-making on an anxious senior during active psychological manipulation.
3. Treat each event in isolation rather than connecting incoming phone calls to subsequent scam messages.

**SeniorShield** solves this by providing:
- **Zero-Jargon Senior Explanations:** 1–2 plain-language sentences focusing strictly on safe actions.
- **Detailed Caretaker Audits:** Formal, evidence-grounded incident summaries for family members and guardians.
- **Deterministic Multi-Signal Defense:** Fine-tuned DistilBERT inference, token-level attribution (XAI), contextual rule validation, and threat intelligence.
- **Native Android Pre-Call Floating Overlay:** Truecaller-style real-time warning before a senior answers a flagged incoming call.
- **Graph Correlation Layer:** Ingestion of fraud events into Neo4j for multi-channel campaign tracking.

---

## 🏗️ 2. Core Detection & Analysis Architecture

SeniorShield separates detection, reasoning, and explanation into strictly isolated, authoritative layers:

```
                                  NORMALIZED TEXT & METADATA
                                               │
                                               ▼
                                      POST /api/analyze
                                               │
                      ┌────────────────────────┼────────────────────────┐
                      ▼                        ▼                        ▼
                DistilBERT                Rule Engine           Entity Extraction
            (distilbert-scam-v1)     (Negation-Aware Rules)    (URLs, Phones, Amounts)
                      │                        │                        │
                      ▼                        ▼                        ▼
               Probability &             Rule Evidence         Threat Intelligence
               Classification                  │               (Reputation Lookup)
                      │                        │                        │
                      ▼                        │                        ▼
             Integrated Gradients              │                TI Verification
             (Feature Attribution)             │                        │
                      │                        │                        │
                      └────────────────────────┼────────────────────────┘
                                               ▼
                                         EvidenceObject
                                  (Single Source of Ground Truth)
                                               │
                                               ▼
                                        Grounded Groq LLM
                                               │
                               ┌───────────────┴───────────────┐
                               ▼                               ▼
                      SENIOR CITIZEN                      CARETAKER / FAMILY
                         EXPLANATION                         AUDIT REPORT
                               │                               │
                               └───────────────┬───────────────┘
                                               ▼
                                      Grounding Validator
                                    (Zero Hallucination Gate)
                                               │
                                               ▼
                                      POST /api/analyze JSON
                                               │
                                               ▼
                                       POST /api/events
                                               │
                                               ▼
                                      Neo4j Graph Database
                                   (Campaign & Entity Graph)
```

### Subsystem Responsibilities:
- **DistilBERT (`distilbert-scam-v1`):** Fast, authoritative sequence classification returning prediction (`SCAM` vs `SAFE`) and probabilities. Loaded once at server lifespan startup.
- **Explainability (Integrated Gradients):** Computes token-level attribution to identify exact suspicious keywords contributing toward the prediction.
- **Deterministic Rule Engine:** High-precision regex with contextual negation handling (e.g., *"Bank will never ask for OTP"* is recognized as legitimate advisory and does not trigger false alerts).
- **Threat Intelligence & Entity Extractor:** Normalizes and inspects URLs, domains, Indian phone numbers (`+91XXXXXXXXXX`), and extracted transaction amounts with strict timeout guards.
- **Canonical `EvidenceObject`:** Immutable structured payload uniting all model facts, rule signals, and threat intel.
- **Groq LLM Explanations:** Formats evidence into two distinct human-readable representations:
  - **Senior:** Short, reassuring, action-first, 0% AI jargon.
  - **Caretaker:** Formal, auditable summary with grounded evidence bullets and recommended interventions.
- **Grounding Validator:** Verifies that no LLM hallucination (fabricated entities, unverified banks, altered classifications) reaches the user.
- **Neo4j Event Repository:** Ingests structured fraud events and links `(:User)-[:RECEIVED]->(:Event)-[:FROM]->(:Phone)`, `(:Event)-[:CONTAINS]->(:URL)`, and `(:Event)-[:TARGETS]->(:FraudType)`.

---

## 📱 3. Mobile App & Native Android Sentinel

SeniorShield runs an autonomous protection layer on Android:

* **Truecaller-Style Floating Overlay (`PreCallPopupActivity`):** Launches a floating high-contrast warning card directly over incoming calls from suspicious or coordinated numbers before the call is answered.
* **Persistent Sentinel Service (`SentinelForegroundService`):** Background monitor ensuring 24/7 autonomous protection on budget devices.
* **Native Broadcast Interceptor (`CallReceiver.kt`):** Native Kotlin receiver for immediate telecom state interception.
* **Senior-Friendly UI:** High-contrast OLED dark mode, 18px+ typography, large touch targets, and vernacular audio playback.

---

## 🔌 4. Backend API Reference

### `POST /api/analyze`
Primary AI analysis endpoint. Receives raw or normalized text and produces a complete grounded fraud analysis report.

#### Request Payload
```json
{
  "text": "Your KYC will expire today. Share your OTP immediately.",
  "channel": "SMS",
  "user_id": "usr_001",
  "source_id": "+919876543210",
  "timestamp": "2026-08-28T05:30:00Z"
}
```

#### Response Payload
```json
{
  "event": {
    "event_id": "evt_3dd93812de48",
    "user_id": "usr_001",
    "channel": "SMS",
    "source_id": "+919876543210",
    "timestamp": "2026-08-28T05:30:00Z"
  },
  "input": {
    "text": "Your KYC will expire today. Share your OTP immediately."
  },
  "classification": {
    "label": "SCAM",
    "confidence": 0.7608
  },
  "model": {
    "name": "distilbert",
    "version": "distilbert-scam-v1"
  },
  "analysis": {
    "fraud_type": "BANK_KYC",
    "intent": [
      "OTP_THEFT"
    ],
    "asset_at_risk": [
      "CREDENTIALS"
    ]
  },
  "evidence": {
    "model": {
      "name": "distilbert",
      "version": "distilbert-scam-v1",
      "status": "fine-tuned",
      "preprocessing_version": "v1.0"
    },
    "prediction": {
      "label": "SCAM",
      "probability": 0.7608,
      "probabilities": {
        "SAFE": 0.2392,
        "SCAM": 0.7608
      }
    },
    "attribution": {
      "method": "Integrated Gradients",
      "top_features": [
        { "token": "your", "contribution": 0.1907, "direction": "toward_scam" },
        { "token": "today", "contribution": 0.1140, "direction": "toward_scam" },
        { "token": "kyc", "contribution": 0.0772, "direction": "toward_scam" },
        { "token": "immediately", "contribution": 0.0492, "direction": "toward_scam" }
      ]
    },
    "rule_evidence": [
      {
        "source": "RULE",
        "rule_id": "OTP_REQUEST",
        "category": "credential_request",
        "description": "The message requests a one-time password (OTP) or security verification code.",
        "severity": "HIGH",
        "matched_text": "Share your OTP"
      },
      {
        "source": "RULE",
        "rule_id": "KYC_CONTEXT",
        "category": "identity_verification",
        "description": "The message references KYC, Aadhaar, PAN, or account identity verification.",
        "severity": "MEDIUM",
        "matched_text": "KYC"
      },
      {
        "source": "RULE",
        "rule_id": "URGENCY_SIGNAL",
        "category": "urgency",
        "description": "The message uses urgent or coercive language to pressure immediate action.",
        "severity": "HIGH",
        "matched_text": "expire today"
      }
    ],
    "threat_intelligence": [],
    "entities": {
      "urls": [],
      "domains": [],
      "phone_numbers": [],
      "emails": [],
      "amounts": []
    }
  },
  "explanation": {
    "senior": {
      "headline": "Be Careful",
      "message": "This looks like a scam. Do not share your OTP, password, or send money.",
      "action": "Do not reply or click any link. Ask your family member first."
    },
    "caretaker": {
      "headline": "High-Risk Interaction Detected",
      "summary": "The incoming interaction was flagged as a potential fraud attempt.",
      "why_flagged": [
        "The model classified the interaction as SCAM with 76.1% confidence.",
        "The rule engine detected: The message requests a one-time password (OTP) or security verification code.",
        "The rule engine detected: The message references KYC, Aadhaar, PAN, or account identity verification.",
        "The rule engine detected: The message uses urgent or coercive language to pressure immediate action."
      ],
      "recommended_action": "Advise the senior citizen not to share codes or transfer money. Verify the sender through official contact channels."
    }
  },
  "latency_ms": {
    "preprocessing": 0.018,
    "distilbert": 58.492,
    "explainability": 156.059,
    "rules": 0.138,
    "threat_intelligence": 0.035,
    "groq": 820.144,
    "total": 1034.886
  },
  "status": {
    "analysis": "complete",
    "grounding": "passed"
  }
}
```

---

### `POST /api/events`
Ingests completed analysis events into the Neo4j Graph Database.

#### Request Payload
Accepts the structured JSON output from `/api/analyze`.

#### Response Payload
```json
{
  "status": "stored",
  "storage": "neo4j_live",
  "event_id": "evt_3dd93812de48",
  "user_id": "usr_001",
  "stored_at": "2026-08-28T06:14:31Z",
  "graph_summary": {
    "phones_linked": 1,
    "urls_linked": 0,
    "domains_linked": 0,
    "fraud_type": "BANK_KYC"
  }
}
```

---

### `GET /health`
```json
{
  "status": "healthy",
  "service": "SeniorShield Backend",
  "version": "1.0.0"
}
```

---

## 📂 5. Repository Structure

```
SeniorShield/
├── android/                     # Native Android Gradle project & Kotlin modules
│   └── app/src/main/java/com/seniorshield/app/
│       ├── CallReceiver.kt               # Native telephony broadcast receiver
│       ├── PreCallOverlayManager.kt      # Floating window overlay manager
│       ├── PreCallPopupActivity.kt       # High-priority pre-call alert activity
│       └── SentinelForegroundService.kt  # 24/7 background security service
│
├── backend/                     # Modular Python / FastAPI Backend
│   ├── main.py                  # Server entrypoint with lifespan startup
│   ├── api/
│   │   ├── analysis.py          # Unified POST /api/analyze endpoint
│   │   ├── events.py            # POST /api/events Neo4j distributor
│   │   └── health.py            # GET /health healthcheck
│   ├── ai/
│   │   ├── classifier/          # DistilBERT wrapper, tokenizer, and XAI attributor
│   │   └── llm/                 # Grounded Groq service (Senior & Caretaker)
│   ├── rules/                   # Deterministic contextual rule engine
│   ├── threat_intelligence/     # Entity extractor, TTL cache, provider lookups
│   ├── evidence/                # Canonical EvidenceObject schema & validator
│   ├── neo4j/                   # Neo4j connection pool and graph repository
│   ├── models/                  # Fine-tuned DistilBERT tokenizer configs
│   ├── data/                    # Scam & Safe evaluation datasets
│   └── tests/                   # Automated E2E and unit test suites
│
├── src/                         # React Native Frontend
│   ├── components/              # UI components (ThreatCard, PreCallAlertCard)
│   ├── services/                # Pre-call sentinel, reputation, campaign tracker
│   └── constants/               # Mock data and system constants
│
├── App.tsx                      # Main React Native Application Root
├── package.json                 # Mobile dependencies
└── README.md                    # Project documentation
```

---

## 🚀 6. Setup & Installation

### Prerequisites
- **Python 3.10+** (Backend)
- **Node.js 20+** & **JDK 17** (Mobile Client)
- **Android SDK (API 34)** & **ADB**

---

### A. Backend Setup

1. **Navigate to the backend folder & create a virtual environment:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate    # Linux / macOS
   venv\Scripts\activate       # Windows
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```ini
   APP_HOST=0.0.0.0
   APP_PORT=8001
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=groq/compound-mini
   THREAT_INTEL_PROVIDER=mock_dev_provider
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USERNAME=neo4j
   NEO4J_PASSWORD=your_neo4j_password_here
   ```

4. **Start the FastAPI backend:**
   ```bash
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001
   ```
   * Swagger Documentation: `http://localhost:8001/docs`
   * Health Check: `http://localhost:8001/health`

5. **Run the production test suite:**
   ```bash
   python tests/test_production_pipeline.py
   ```

---

### B. Mobile App Setup (React Native + Expo)

1. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Connect Android device via USB and reverse ports:**
   ```bash
   adb devices
   adb reverse tcp:8081 tcp:8081
   adb reverse tcp:8001 tcp:8001
   ```

3. **Start the Expo development server:**
   ```bash
   npx expo start --localhost --port 8081
   ```

---

## 🧪 7. Automated Test Suite

SeniorShield includes a 17-point test suite covering all resilience scenarios:

| Test Case | Description |
| :--- | :--- |
| **Test 1–2** | Standard `SAFE` message and clear `SCAM` SMS classification |
| **Test 3–4** | `OTP_REQUEST` detection & advisory negation resistance (`"Never share your OTP"`) |
| **Test 5–6** | `KYC_CONTEXT` entity mapping & `URGENCY_SIGNAL` artificial deadline triggers |
| **Test 7–8** | `PAYMENT_REQUEST` monetary amount extraction & `REMOTE_ACCESS_SIGNAL` detection |
| **Test 9–10** | Malicious URL threat intel enrichment & `unknown` reputation preservation |
| **Test 11–13** | Pipeline resilience during Threat Intel, Groq, or XAI outages |
| **Test 14** | Grounding validator rejection of hallucinated entities |
| **Test 15–16** | Minimal request handling & complete metadata preservation |
| **Test 17** | `POST /api/events` Neo4j graph persistence |

---

## 🔒 8. Security & Privacy Philosophy

1. **Strict Authoritative Separation:** DistilBERT is the classifier. The LLM cannot alter the risk label, confidence, or evidence facts.
2. **Zero Hallucinations:** The grounding validator rejects any explanation containing entities, organizations, or monetary amounts not present in the canonical `EvidenceObject`.
3. **Fail-Safe Operation:** Outages in external APIs (Threat Intelligence or Groq) trigger deterministic fallback templates without interrupting protection.
4. **Data Privacy:** Sensitive credentials (API keys, passwords, database URIs) are kept server-side only and never committed to version control.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
