import { DeviceEvent, ScamReport } from '../types/scam';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * System prompt designed specifically for Indian digital scam taxonomy,
 * multi-channel campaign correlation, and senior-centric plain explanations.
 */
const SENIOR_SHIELD_SYSTEM_PROMPT = `
You are SeniorShield AI, an autonomous cyber defense intelligence engine protecting senior citizens in India from digital fraud, coercive social engineering, and scam campaigns.

YOUR TASK:
Analyze the provided chronological sequence of device events (SMS messages, phone calls, links, durations). Determine if this represents a benign interaction or an active multi-step scam campaign.

RECOGNITION RULES & SOCIAL ENGINEERING VECTORS:
1. Electricity / Utility Disconnection Scams (TNEB, BESCOM, Mahavitaran, UPPCL): Claims power will be cut tonight, instructs to call a personal mobile number, or requests ₹10 test payment via remote APK/link.
2. Digital Arrest / Law Enforcement Impersonation: Claims courier/FedEx containing narcotics/passports seized at customs; threats of CBI/Police arrest; coercive demands to remain on continuous video/audio call or transfer money to "RBI verification escrow".
3. Bank KYC / APK Link Scams: Deceptive alerts regarding SBI YONO, HDFC, ICICI KYC suspension; asks to download unverified ".apk" apps or visit phishing portals.
4. Remote Access Screen Sharing: Requests to install AnyDesk, TeamViewer, QuickSupport, or RustDesk.
5. Regional & Mixed Script Nuance: Identify Hindi, Hinglish, Tamil, Tanglish urgency words (e.g. "turant", "police FIR", "aaj raat line cut").
6. Benign Transactions: Standard bank credit/debit alerts, OTPs requested by the user themselves, or calls from verified family contacts.

OUTPUT STRICT JSON MATCHING THIS EXACT SCHEMA:
{
  "is_scam": boolean,
  "threat_level": "SAFE" | "SUSPICIOUS" | "CRITICAL",
  "scam_type": string,
  "confidence_score": number (0 to 100),
  "senior_explanation": string (1-2 very simple, plain English sentences. No technical jargon like 'phishing' or 'payload'. Use words like 'Thief', 'Fake Message', 'Dangerous Link'),
  "action_required": string (Direct command, e.g. "Do not click link. Hang up immediately. Your power will NOT be cut."),
  "assets_at_risk": string[] (e.g. ["Bank Account Balance", "Phone Screen Access", "Personal Identity"]),
  "impersonated_entity": string (e.g. "State Electricity Board", "CBI / Police Inspector", "State Bank of India", "None"),
  "language_detected": string,
  "threat_indicators": string[],
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

  // Electricity Scam Pattern
  if (
    (aggregatedText.includes('power') || aggregatedText.includes('electricity') || aggregatedText.includes('bill')) &&
    (aggregatedText.includes('disconnect') || aggregatedText.includes('tonight') || aggregatedText.includes('officer'))
  ) {
    return {
      is_scam: true,
      threat_level: 'CRITICAL',
      scam_type: 'Electricity Disconnection Fraud',
      confidence_score: 98,
      senior_explanation: 'This is a fake warning from scammers. Your electricity will NOT be disconnected. Scammers want you to call them to steal your money.',
      action_required: 'Do NOT call this number or pay any money. Block this number immediately.',
      assets_at_risk: ['Bank Savings', 'UPI Account'],
      impersonated_entity: 'State Electricity Board (EB)',
      language_detected: 'English / Hinglish',
      threat_indicators: ['Manufactured Urgency (Tonight cutoff)', 'Personal Mobile Number listed as Official', 'Coercive Follow-up Call'],
      notify_family_guardian: true,
      guardian_alert_message: 'ALERT: Senior received a fake Electricity Disconnection scam threat and follow-up call. We advised them not to pay.',
    };
  }

  // Digital Arrest / Law Enforcement
  if (
    aggregatedText.includes('narcotics') ||
    aggregatedText.includes('customs') ||
    aggregatedText.includes('police') ||
    aggregatedText.includes('cbi') ||
    aggregatedText.includes('digital arrest') ||
    aggregatedText.includes('seized')
  ) {
    return {
      is_scam: true,
      threat_level: 'CRITICAL',
      scam_type: 'Digital Arrest & Police Impersonation',
      confidence_score: 99,
      senior_explanation: 'This is a dangerous fake police scam. The police and customs NEVER arrest people over phone or video calls. Do not be afraid.',
      action_required: 'Hang up the call immediately. Do NOT transfer any money or show your face on video call.',
      assets_at_risk: ['Life Savings', 'Personal Identity', 'Privacy'],
      impersonated_entity: 'CBI / Mumbai Police / Customs',
      language_detected: 'English / Mixed',
      threat_indicators: ['Fear Tactics & Arrest Threat', 'Demand for Continuous Video Call', 'Fake Escrow Account Transfer'],
      notify_family_guardian: true,
      guardian_alert_message: 'URGENT: Senior is being targeted by a Digital Arrest / Fake Police scam call. Please contact them immediately.',
    };
  }

  // Bank KYC / Malicious APK
  if (
    (aggregatedText.includes('kyc') || aggregatedText.includes('pan') || aggregatedText.includes('blocked') || aggregatedText.includes('suspended')) &&
    (aggregatedText.includes('.apk') || aggregatedText.includes('http') || aggregatedText.includes('update'))
  ) {
    return {
      is_scam: true,
      threat_level: 'CRITICAL',
      scam_type: 'Bank KYC APK Trojan Scam',
      confidence_score: 97,
      senior_explanation: 'This is a thief trying to steal your bank password. Real banks NEVER send apps (.apk links) or ask for quick KYC over SMS.',
      action_required: 'Do NOT click the link and do NOT download any application. Delete this message.',
      assets_at_risk: ['Netbanking Credentials', 'OTP Interception', 'Full Phone Screen Control'],
      impersonated_entity: 'Bank KYC Department',
      language_detected: 'English',
      threat_indicators: ['Unverified .apk download link', 'Urgent Account Suspension Threat'],
      notify_family_guardian: true,
      guardian_alert_message: 'ALERT: Senior received a fake bank KYC message with a malicious APK download link.',
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
 * Analyzes multi-channel campaign events using Gemini 2.5 Flash with fallback to local heuristic engine.
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

Evaluate whether this timeline represents an active multi-channel fraud campaign targeting a senior citizen in India.
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
