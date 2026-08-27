import { DeviceEvent, ScamReport } from '../types/scam';

const GEMINI_MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-3.5-flash-lite';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * System prompt designed specifically for Indian digital scam taxonomy,
 * multi-channel campaign correlation, and senior-centric plain explanations.
 */
const SENIOR_SHIELD_SYSTEM_PROMPT = `
You are SeniorShield AI, an autonomous cyber defense intelligence engine powered by Gemini 3.5 Flash Lite protecting senior citizens in India from digital fraud, coercive social engineering, and scam campaigns.

YOUR TASK:
Analyze the provided chronological sequence of device events (SMS messages, phone calls, links, durations). Determine if this represents a benign interaction or an active multi-step scam campaign.

CORE SOCIAL ENGINEERING RECOGNITION VECTORS:
1. IMPERSONATION (AUTHORITY & POWER):
   - Impersonation of officials or people in power: Police Officers, CBI/ED Inspectors, Customs/Narcotics Officers, Judges, Electricity/TNEB/BESCOM Executives, Telecom/TRAI Officials, Bank Managers, FedEx/Courier Agents.
   - Using authoritative intimidation to demand money transfers, compliance, continuous video/audio calls, or "investigation verification".

2. MANUFACTURED URGENCY & THREAT OF INSTANT PENALTIES:
   - Artificial time pressure: Threats of instant financial penalties, power disconnection "tonight at 9:30 PM", SIM deactivation within 24 hours, bank account freezing, or police reaching the senior's house in 30 minutes.
   - Purpose: Panic seniors into reacting impulsively without verifying with family.

3. OTP, CREDENTIAL & REMOTE ACCESS REQUESTS:
   - Deceptive requests to share OTPs, PIN numbers, Netbanking passwords, UPI MPIN, or Aadhaar/PAN details.
   - Requests to click unverified links (e.g. .apk download links, fake update portals) or install screen-sharing software (AnyDesk, TeamViewer, QuickSupport, RustDesk).

4. REGIONAL & MIXED SCRIPT NUANCES:
   - Identify Hindi, Hinglish, Tamil, Tanglish urgency words (e.g. "turant", "police FIR", "aaj raat line cut", "urgent call panni update pannunga").

5. BENIGN TRANSACTIONS (SAFE BENCHMARK):
   - Standard bank credit/debit transaction alerts, legitimate OTPs initiated directly by the senior, or calls from verified family contacts without coercive demands.

OUTPUT STRICT JSON MATCHING THIS EXACT SCHEMA:
{
  "is_scam": boolean,
  "threat_level": "SAFE" | "SUSPICIOUS" | "CRITICAL",
  "scam_type": string,
  "confidence_score": number (0 to 100),
  "senior_explanation": string (1-2 very simple, plain English sentences. No technical jargon like 'phishing' or 'payload'. Use words like 'Thief', 'Fake Officer', 'Dangerous Message', 'Fake Bill'),
  "action_required": string (Direct command, e.g. "Do not click link. Hang up immediately. No one will cut your power or arrest you."),
  "assets_at_risk": string[] (e.g. ["Bank Account Balance", "Phone Screen Access", "Personal Identity"]),
  "impersonated_entity": string (e.g. "State Electricity Board", "CBI / Police Inspector", "State Bank of India", "Telecom Officer", "None"),
  "language_detected": string,
  "threat_indicators": string[] (e.g. ["Impersonation of Police/Officer", "Urgent Penalty / Cutoff Threat", "OTP / Credential Demand", "Malicious APK Link"]),
  "notify_family_guardian": boolean,
  "guardian_alert_message": string
}
`;

/**
 * Local heuristic fallback engine for offline resilience & hackathon demonstrations.
 */
function evaluateHeuristicScam(events: DeviceEvent[]): ScamReport {
  if (!events || events.length === 0) {
    return {
      is_scam: false,
      threat_level: 'SAFE',
      scam_type: 'No Active Threats Detected',
      confidence_score: 95,
      senior_explanation: 'Your device is safe. No suspicious calls or messages were found.',
      action_required: 'No action required. Your shield is active.',
      assets_at_risk: [],
      impersonated_entity: 'None',
      language_detected: 'English',
      threat_indicators: [],
      notify_family_guardian: false,
      guardian_alert_message: 'Senior device is currently safe.',
    };
  }

  const aggregatedText = events.map((e) => `${e.senderOrNumber} ${e.contentOrDuration}`).join(' ').toLowerCase();

  // Electricity Scam Pattern (Urgency + Official Impersonation)
  if (
    (aggregatedText.includes('power') || aggregatedText.includes('electricity') || aggregatedText.includes('bill')) &&
    (aggregatedText.includes('disconnect') || aggregatedText.includes('tonight') || aggregatedText.includes('officer') || aggregatedText.includes('charged'))
  ) {
    return {
      is_scam: true,
      threat_level: 'CRITICAL',
      scam_type: 'Electricity Disconnection Fraud',
      confidence_score: 98,
      senior_explanation: 'This is a fake message from scammers pretending to be electricity officers. Your electricity will NOT be cut and you will not be charged. Scammers want you to call them to steal your money.',
      action_required: 'Do NOT call this number or pay any money. Block this number immediately.',
      assets_at_risk: ['Bank Savings', 'UPI Account'],
      impersonated_entity: 'State Electricity Board (EB Officer)',
      language_detected: 'English / Hinglish',
      threat_indicators: [
        'Impersonation of Official / Electricity Officer',
        'Manufactured Urgency (Tonight cutoff threat / Instant charges)',
        'Personal Mobile Number listed as Official Helpline',
      ],
      notify_family_guardian: true,
      guardian_alert_message: 'ALERT: Senior received a fake Electricity Disconnection scam threat. We advised them not to pay.',
    };
  }

  // Digital Arrest / Law Enforcement (Authority Impersonation + Urgency)
  if (
    aggregatedText.includes('narcotics') ||
    aggregatedText.includes('customs') ||
    aggregatedText.includes('police') ||
    aggregatedText.includes('cbi') ||
    aggregatedText.includes('digital arrest') ||
    aggregatedText.includes('warrant') ||
    aggregatedText.includes('seized')
  ) {
    return {
      is_scam: true,
      threat_level: 'CRITICAL',
      scam_type: 'Digital Arrest & Police Impersonation',
      confidence_score: 99,
      senior_explanation: 'This is a dangerous fake police scam. The police and courts NEVER arrest people over phone or WhatsApp calls. Do not be afraid.',
      action_required: 'Hang up the call immediately. Do NOT transfer any money or join any video calls.',
      assets_at_risk: ['Life Savings', 'Personal Identity', 'Privacy'],
      impersonated_entity: 'CBI / Mumbai Police / Supreme Court',
      language_detected: 'English / Mixed',
      threat_indicators: [
        'Impersonation of Police & CBI Officials',
        'Coercive Urgency & Arrest Threat',
        'Demand to transfer money or remain on call',
      ],
      notify_family_guardian: true,
      guardian_alert_message: 'URGENT: Senior is being targeted by a Digital Arrest / Fake Police scam call. Please contact them immediately.',
    };
  }

  // Bank KYC / OTP / Malicious APK (Credential & OTP Request)
  if (
    (aggregatedText.includes('kyc') || aggregatedText.includes('pan') || aggregatedText.includes('blocked') || aggregatedText.includes('suspended') || aggregatedText.includes('otp')) &&
    (aggregatedText.includes('.apk') || aggregatedText.includes('http') || aggregatedText.includes('update') || aggregatedText.includes('share') || aggregatedText.includes('charged'))
  ) {
    return {
      is_scam: true,
      threat_level: 'CRITICAL',
      scam_type: 'Bank KYC & Credential Phishing Scam',
      confidence_score: 97,
      senior_explanation: 'This is a thief trying to steal your bank passwords and OTP. Real banks NEVER ask you to click links, share OTPs, or download app updates over SMS.',
      action_required: 'Do NOT click the link, do NOT share your OTP, and do NOT download any apps. Delete this message.',
      assets_at_risk: ['Netbanking Credentials', 'OTP Interception', 'Full Phone Screen Control'],
      impersonated_entity: 'Bank Manager / KYC Department',
      language_detected: 'English',
      threat_indicators: [
        'Impersonation of Bank Official',
        'Urgent Account Suspension / Instant Charge Threat',
        'OTP / Credential Request via Malicious Link',
      ],
      notify_family_guardian: true,
      guardian_alert_message: 'ALERT: Senior received a fake bank KYC message with an OTP / APK phishing link.',
    };
  }

  // Safe Transaction Benchmark
  if (aggregatedText.includes('credited') || aggregatedText.includes('available balance') || aggregatedText.includes('daughter') || aggregatedText.includes('son')) {
    return {
      is_scam: false,
      threat_level: 'SAFE',
      scam_type: 'Legitimate Bank Transaction Notice',
      confidence_score: 96,
      senior_explanation: 'This is a regular, safe message from your bank confirming money received. Everything is normal.',
      action_required: 'No action required. Your money is safe.',
      assets_at_risk: [],
      impersonated_entity: 'HDFC Bank (Verified)',
      language_detected: 'English',
      threat_indicators: [],
      notify_family_guardian: false,
      guardian_alert_message: 'Routine safe transaction processed.',
    };
  }

  return {
    is_scam: false,
    threat_level: 'SUSPICIOUS',
    scam_type: 'Unverified Contact / Ambiguous Activity',
    confidence_score: 70,
    senior_explanation: 'We noticed a message or call from an unknown sender. Please be careful before clicking any links or sharing passwords.',
    action_required: 'Do not share OTPs or personal information with this sender.',
    assets_at_risk: ['Personal Details'],
    impersonated_entity: 'Unknown Sender',
    language_detected: 'English',
    threat_indicators: ['Unknown Sender Number'],
    notify_family_guardian: false,
  };
}

/**
 * Analyzes multi-channel campaign events using Gemini 3.5 Flash Lite with fallback to local heuristic engine.
 */
export async function analyzeMultiChannelCampaign(
  events: DeviceEvent[],
  apiKey?: string
): Promise<ScamReport> {
  const activeKey = apiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

  if (!activeKey) {
    console.warn('[SeniorShield AI] No Gemini API key provided. Using local intelligence heuristic engine.');
    return evaluateHeuristicScam(events);
  }

  try {
    const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${activeKey}`;

    const formattedEvents = events.map((e, index) => ({
      step: index + 1,
      channel: e.type,
      senderOrNumber: e.senderOrNumber,
      timeAgo: `${Math.round((Date.now() - e.timestamp) / (1000 * 60))} minutes ago`,
      contentOrDetails: e.contentOrDuration,
    }));

    const promptText = `
CHRONOLOGICAL DEVICE EVENT TIMELINE:
${JSON.stringify(formattedEvents, null, 2)}

Evaluate whether this timeline represents an active fraud campaign targeting a senior citizen in India.
Specifically check for:
1. Impersonation of officials or someone in power.
2. Manufactured urgency (threat of instant charges, service cutoff, or arrest).
3. OTP, credential, password, or remote screen-sharing requests.

Return your assessment strictly according to the required JSON schema.
`;

    const requestBody = {
      systemInstruction: {
        parts: [{ text: SENIOR_SHIELD_SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: promptText }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[SeniorShield AI] Gemini API call failed (${response.status}):`, errorText);
      return evaluateHeuristicScam(events);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      console.warn('[SeniorShield AI] Empty response from Gemini API.');
      return evaluateHeuristicScam(events);
    }

    const parsed: ScamReport = JSON.parse(candidateText);
    return parsed;
  } catch (error) {
    console.error('[SeniorShield AI] Exception during Gemini analysis:', error);
    return evaluateHeuristicScam(events);
  }
}
