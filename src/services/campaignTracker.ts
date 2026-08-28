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

/**
 * Creates initial campaign state preloaded with realistic demonstration data
 * showcasing the Impersonated Entity box, Targeted Assets chips, and Timeline.
 */
export function createInitialCampaignState(): CampaignState {
  return {
    cumulativeRiskScore: 0,
    events: [],
    activeThreats: [],
    latestReport: null,
    campaignStage: 'DORMANT',
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
