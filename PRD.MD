# PRD.md — SeniorShield: Autonomous Digital Scam & Fraud Protection for Senior Citizens

> **Problem Statement Alignment:** Challenge 04 — Digital Scam Protection for Senior Citizens (PS5)  
> **Platform & Target:** Android (optimized for budget/lower-end devices) | React Native Client  
> **Hackathon Scope:** 24-Hour MVP Focus with Full Architecture Blueprint  

---

## 1. Problem Statement & Executive Summary

### 1.1 The Challenge
Senior citizens are disproportionately victimized by sophisticated digital scams (fake KYC, digital arrest, electricity bill disconnection, fake investment schemes, OTP/credential theft, and rogue remote-access tools like AnyDesk/QuickSupport). 

Scammers execute multi-step **fraud campaigns** spanning phone calls, SMS, messaging apps, phishing links, and payment requests over hours or days—where each step seems harmless in isolation. Existing security tools fail seniors because they output complex technical jargon and place the burden of judgment on an anxious user during high-stress manipulation.

### 1.2 The Solution: SeniorShield
**SeniorShield** is an autonomous, senior-first protection companion that:
1. **Tracks Multi-Touch Fraud Campaigns:** Correlates SMS, call logs, and links across time rather than treating events in silos.
2. **Understands Regional & Mixed Languages:** Detects manufactured urgency, fear tactics, and impersonation across regional languages and mixed scripts (e.g., Hinglish, Tanglish).
3. **Assesses Cumulative Threat & Value at Stake:** Computes real-time interaction risk and estimates potential financial, credential, or device compromise.
4. **Delivers Tiered Interventions & Guardian Escalation:** Explains threats in plain 1–2 sentence language and alerts a trusted family guardian when high-risk actions are imminent.
5. **Runs on Budget Hardware:** Lightweight, zero-backend or lightweight edge AI processing designed for affordable Android smartphones with minimal configuration.

---

## 2. Core Pillars & Functional Requirements

```
                                  ┌───────────────────────────────┐
                                  │   SeniorShield Core Engine    │
                                  └───────────────┬───────────────┘
                                                  │
         ┌────────────────────────────────────────┼────────────────────────────────────────┐
         │                                        │                                        │
┌────────▼────────┐                     ┌─────────▼─────────┐                    ┌─────────▼─────────┐
│ Ingestion Layer │                     │ Reasoning Engine  │                    │ Senior-First UX   │
├─────────────────┤                     ├───────────────────┤                    ├───────────────────┤
│ • SMS Inflow    │                     │ • Gemini AI Flash │                    │ • 18px+ Big Text  │
│ • Call Logs     │ ──(Raw Events)───►  │ • Intent Analysis │  ──(Scam Result)──►│ • Plain Language  │
│ • Link Scraper  │                     │ • Urgency Detect  │                    │ • Audio Alert     │
│ • App Perms     │                     │ • Campaign Graph  │                    │ • Guardian Sync   │
└─────────────────┘                     └───────────────────┘                    └───────────────────┘
```

### 2.1 Multi-Channel Ingestion & Event Correlation
- **SMS & Messaging Analyzer:** Read incoming SMS for keywords, suspicious shortcodes, urgent payment links, and fake utility notices.
- **Call Log & Telecom Telemetry:** Scan recent incoming/outgoing calls, flag repeat unknown international/VoIP patterns, and detect call bursts preceding scam SMS.
- **Campaign Timeline Tracker:** Maintain a local rolling 7-day threat graph that correlates a phone call with a subsequent SMS and payment link from the same suspected campaign.

### 2.2 Vernacular & NLP Scam Detection
- **Regional & Mixed Script Intelligence:** Evaluate Romanized vernacular (Hinglish/Tanglish/etc.) to catch colloquial coercion ("_turant kyc karo nahi to account band_").
- **Intent & Coercion Recognition:** Flag psychological triggers:
  - *Manufactured Urgency* ("within 30 mins", "power will be cut tonight")
  - *Authority Impersonation* (Police, CBI, RBI, Telecom Department, Electricity Board)
  - *Credential / Screen Harvesting* (Requests for OTP, CVV, APK installation, remote desktop tools)

### 2.3 Tiered Risk Scoring & Interventions
- **Interaction Risk Score:** `0 to 100` with discrete categories: `SAFE`, `SUSPICIOUS`, `CRITICAL`.
- **Cumulative Exposure Metric:** Tracks escalation over multi-hour campaigns.
- **Dynamic Interventions:**
  1. **Low / Info:** Subtle green badge ("Verified Bank Message").
  2. **Medium / Suspicious:** Yellow warning banner with plain-language advice ("Do not call back this unknown number").
  3. **Critical / Danger:** Full-screen high-contrast modal barrier blocking immediate action, playing voice explanation, and requiring confirmation.
  4. **Guardian Escalation:** Automatic SMS/WhatsApp notification to a designated trusted family member when a `CRITICAL` scam campaign is active.

### 2.4 Legitimate Entity Whitelist & Anti-False-Alarm System
- Pre-built verifiable patterns for official government portals, genuine utility shortcodes, and verified banking communication.
- Low cognitive overhead: seniors do not configure firewall rules or technical filters.

### 2.5 Post-Incident Recovery & 1-Tap Incident Report
- **1-Tap Cyber Helpline (1930 / National Portal Format):** Formats the collected evidence (sender number, timestamp, message transcript, payment link) for quick reporting.
- **Emergency Remediation Checklist:** Plain-language steps ("Call your bank to freeze card ending in 1234", "Uninstall AnyDesk now").

---

## 3. Technical Architecture & Constraints

### 3.1 Architecture Overview
- **Client Application:** React Native (Android native bridges for SMS & Call logs).
- **Inference Engine:** Direct streaming / batching to Google Gemini API (`gemini-2.5-flash`) via secure client `fetch()` with strict structured JSON output.
- **Storage:** Local encrypted AsyncStorage / SQLite for campaign history and trusted contact configuration. Zero cloud PII storage to preserve user privacy.

### 3.2 Key Dependencies & Native Modules
- `react-native-get-sms-android` — Device SMS inbox reader.
- `react-native-call-log` — Recent incoming/outgoing telecom activity.
- `react-native-tts` or Expo Speech — Audio narration for senior readability.
- `lucide-react-native` — High-visibility accessibility icons.
- `StyleSheet.create()` — Vanilla React Native styling (no heavy UI kits).

---

## 4. Gemini AI Specification & Structured Schema

### 4.1 API Endpoint
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}
```

### 4.2 Structured Output Schema (`ScamAnalysisResult`)
```typescript
export interface ScamAnalysisResult {
  is_scam: boolean;
  threat_level: 'SAFE' | 'SUSPICIOUS' | 'CRITICAL';
  scam_type: 
    | 'ELECTRICITY_DISCONNECTION'
    | 'DIGITAL_ARREST_POLICE'
    | 'BANK_KYC_EXPIRY'
    | 'LOTTERY_REWARD'
    | 'REMOTE_ACCESS_APK'
    | 'COURIER_CUSTOMS'
    | 'GENUINE_COMMUNICATION'
    | 'OTHER';
  confidence_score: number; // 0 to 100
  language_detected: string; // e.g. "Hinglish", "English", "Tamil", "Hindi"
  
  // Senior-Friendly Explanations
  senior_headline: string; // e.g. "🚨 DO NOT PAY: Fake Electricity Message"
  senior_explanation: string; // 1-2 simple sentences without technical jargon
  action_required: string; // e.g. "Do not click any link. Delete this message."
  
  // Fraud Mechanics & Risk Estimation
  threat_indicators: string[]; // ["Impersonation", "Urgency", "Unverified APK link"]
  potential_loss_type: 'MONEY' | 'CREDENTIALS' | 'FULL_DEVICE_ACCESS' | 'NONE';
  estimated_risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'SEVERE';
  
  // Guardian & Escalation Triggers
  notify_family_guardian: boolean;
  guardian_alert_message?: string;
}
```

---

## 5. Senior-Centric UX & Accessibility Guidelines

| UI Element | Requirement | Target |
| :--- | :--- | :--- |
| **Typography** | Sans-serif, High Legibility | Body: `18px+`, Headers: `24px–32px`, Bold weights |
| **Touch Targets** | Ergonomic buttons for trembling hands | Minimum height `56px`, full-width primary actions |
| **Color Palette** | WCAG AAA High Contrast | Danger: `#DC2626`, Safe: `#16A34A`, Warning: `#F59E0B`, Dark: `#0F172A`, Light: `#F8FAFC` |
| **Cognitive Load** | Zero jargon (no "phishing", "malware", "payload") | Use "Fake Message", "Dangerous Link", "Thief trying to steal money" |
| **Voice Assist** | 1-Tap Text-to-Speech | Reads out the simplified explanation in the senior's preferred language |

---

## 6. MVP Scope Breakdown (24-Hour Hackathon)

### 🌟 Phase 1: Core MVP (Must Have for Demo)
- [x] Android SMS inbox live scanning loop.
- [x] Call log ingest and correlation.
- [x] Direct Gemini 2.5 Flash analysis with vernacular & urgency prompt engineering.
- [x] Senior-friendly high-contrast dashboard with live threat badges.
- [x] Threat detail screen with 1-tap plain language explanation and clear "What to do" action.
- [x] Trusted Family Contact setup (Guardian phone number).

### 🚀 Phase 2: Enhanced Capabilities (Demo Differentiators)
- [ ] Voice explanation playback (TTS for seniors).
- [ ] 1-Tap National Cyber Crime Helpline (1930) reporting summary generation.
- [ ] Multi-message campaign timeline view (linking previous suspicious calls with follow-up SMS).
- [ ] Simulated Guardian WhatsApp/SMS alert dispatch.
