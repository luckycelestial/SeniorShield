import { CampaignStage, CampaignState, DeviceEvent, ScamReport } from '../types/scam';

/**
 * Calculates cumulative risk score (0-100) by evaluating multi-channel correlation patterns.
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

  if (hasSMS && hasCall) {
    baseScore += 20;
    activeThreats.push('Multi-Channel Coordination (SMS + Follow-up Call)');
  }

  // Frequency escalation check
  if (events.length >= 3) {
    baseScore += 10;
  }

  const clampedScore = Math.min(100, Math.max(0, baseScore));

  let stage: CampaignStage = 'DORMANT';
  if (clampedScore > 80) {
    stage = 'EXTRACTION_ATTEMPT';
  } else if (clampedScore > 50) {
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
 * Creates initial clean campaign state.
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
