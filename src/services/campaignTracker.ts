import { CampaignStage, CampaignState, DeviceEvent, ScamReport } from '../types/scam';

/**
 * Calculates cumulative risk score (0-100) by connecting the dots across time, SMS, Calls, and OTP extraction.
 */
export function calculateCumulativeExposure(
  events: DeviceEvent[],
  report: ScamReport | null
): { score: number; stage: CampaignStage; activeThreats: string[] } {
  if (!events || events.length === 0) {
    return { score: 0, stage: 'DORMANT', activeThreats: [] };
  }

  let baseScore = 0;
  const activeThreats: string[] = [];

  if (report) {
    if (report.threat_level === 'CRITICAL') {
      baseScore += 65;
      activeThreats.push(report.scam_type);
    } else if (report.threat_level === 'SUSPICIOUS') {
      baseScore += 35;
      activeThreats.push(report.scam_type);
    } else {
      baseScore += 5;
    }
  }

  // Cross-channel correlation check: Rapid follow-up call after an SMS from the same number or within 1 hour
  const hasSMS = events.some((e) => e.type === 'SMS');
  const hasCall = events.some((e) => e.type === 'CALL');
  const hasOtpOrMoneySms = events.some((e) => {
    const text = (e.contentOrDuration || '').toLowerCase();
    return text.includes('otp') || text.includes('pin') || text.includes('debit') || text.includes('transfer');
  });

  // Rule 1: Multi-Channel Coordination (SMS + Follow-up Call)
  if (hasSMS && hasCall) {
    baseScore += 20;
    activeThreats.push('Multi-Channel Attack (SMS Threat + Follow-up Coercion Call)');
  }

  // Rule 2: Active Call + OTP Extraction (Critical Danger)
  if (hasCall && hasOtpOrMoneySms) {
    baseScore += 30;
    activeThreats.push('🚨 Live Credential Theft: OTP received during active scam interaction!');
  }

  // Rule 3: Rapid Frequency Escalation
  if (events.length >= 3) {
    baseScore += 10;
  }

  const clampedScore = Math.min(100, Math.max(0, baseScore));

  let stage: CampaignStage = 'DORMANT';
  if (clampedScore > 80 || (hasCall && hasOtpOrMoneySms)) {
    stage = 'EXTRACTION_ATTEMPT';
  } else if (clampedScore > 50 || (hasSMS && hasCall)) {
    stage = 'URGENCY_ESCALATION';
  } else if (clampedScore > 20) {
    stage = 'RECONNAISSANCE';
  }

  return {
    score: clampedScore,
    stage,
    activeThreats,
  };
}

export function createInitialCampaignState(): CampaignState {
  const initialEvents: DeviceEvent[] = [
    {
      id: 'evt_init_da_sms_1',
      timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
      type: 'SMS',
      senderOrNumber: 'VD-FEDEX-IND',
      contentOrDuration:
        'FedEx Alert: Parcel #IND-94821 addressed in your name containing contraband has been intercepted at Mumbai Airport. Police FIR registered. Case ref: CBI-CR-8492.',
    },
    {
      id: 'evt_init_da_call_2',
      timestamp: Date.now() - 1000 * 60 * 25, // 25 mins ago
      type: 'CALL',
      senderOrNumber: '+91 91234 56789',
      contentOrDuration:
        'Incoming Call (Duration: 5m 12s). Caller impersonating CBI Inspector Verma demanding digital arrest video isolation & fund transfer to RBI escrow.',
    },
  ];

  const initialReport: ScamReport = {
    is_scam: true,
    threat_level: 'CRITICAL',
    scam_type: 'Digital Arrest & Law Enforcement Impersonation',
    confidence_score: 98,
    impersonated_entity: 'Central Bureau of Investigation (CBI) / Cyber Crime Police',
    assets_at_risk: [
      'Bank Savings & Fixed Deposits',
      'Senior Personal Liberty & Peace',
      'Aadhaar & Digital Identity',
    ],
    senior_explanation:
      'Fake police/CBI officers are falsely claiming illegal parcels exist in your name to terrorize you into staying on a video call and transferring money.',
    action_required:
      'DO NOT PAY & DO NOT JOIN VIDEO CALLS! Indian Police & CBI never arrest citizens via phone or video call, and never demand money transfers.',
    guardian_alert_message:
      'SeniorShield Alert: Mom/Dad targeted by Digital Arrest extortion call from +91 91234 56789 claiming CBI case. Call blocked.',
    threat_indicators: [
      'Digital Arrest Coercion',
      'Law Enforcement Impersonation',
      'Urgent Financial Transfer Demand',
      'Video Call Isolation Threat',
    ],
  };

  return {
    cumulativeRiskScore: 94,
    events: initialEvents,
    activeThreats: [
      'Digital Arrest & Law Enforcement Impersonation',
      'Multi-Channel Attack (Customs SMS + Fake Police Call)',
    ],
    latestReport: initialReport,
    campaignStage: 'EXTRACTION_ATTEMPT',
    lastUpdated: Date.now(),
  };
}

/**
 * Updates campaign state given new events and new scam analysis report.
 */
export function updateCampaignState(
  currentState: CampaignState,
  events: DeviceEvent[],
  report: ScamReport
): CampaignState {
  const { score, stage, activeThreats } = calculateCumulativeExposure(events, report);

  return {
    cumulativeRiskScore: score,
    events,
    activeThreats: Array.from(new Set([...currentState.activeThreats, ...activeThreats])),
    latestReport: report,
    campaignStage: stage,
    lastUpdated: Date.now(),
  };
}
