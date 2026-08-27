/**
 * Type definitions for SeniorShield Scam Detection and Telemetry System.
 */

export type ThreatLevel = 'SAFE' | 'SUSPICIOUS' | 'CRITICAL';

export type EventType = 'SMS' | 'CALL';

export type CampaignStage =
  | 'DORMANT'
  | 'RECONNAISSANCE'
  | 'URGENCY_ESCALATION'
  | 'EXTRACTION_ATTEMPT';

export interface ScamReport {
  is_scam: boolean;
  threat_level: ThreatLevel;
  scam_type: string; // e.g. "Electricity Bill Fraud", "Digital Arrest", "Bank KYC APK Link", "Legitimate Bank Notice"
  confidence_score: number; // 0 to 100
  senior_explanation: string; // 1-2 short, crystal-clear sentences without technical jargon
  action_required: string; // Unambiguous directive, e.g. "Do not click the link. Block this number."
  assets_at_risk: string[]; // e.g. ["Bank Account Balance", "Device Screen & OTPs", "Personal ID"]
  impersonated_entity: string; // e.g. "Electricity Department (EB)", "CBI / Police", "State Bank of India", "None"
  language_detected?: string; // e.g. "English", "Hinglish", "Tamil", "Hindi"
  threat_indicators?: string[]; // e.g. ["Urgency tactic", "Unverified APK link", "Threat of immediate arrest"]
  notify_family_guardian?: boolean;
  guardian_alert_message?: string;
}

export interface DeviceEvent {
  id: string;
  timestamp: number;
  type: EventType;
  senderOrNumber: string;
  contentOrDuration: string; // Message body text or call duration description (e.g. "Duration: 4m 12s (Incoming)")
  rawPayload?: Record<string, any>;
}

export interface CampaignState {
  cumulativeRiskScore: number; // 0 to 100 aggregate score
  events: DeviceEvent[];
  activeThreats: string[];
  latestReport: ScamReport | null;
  campaignStage: CampaignStage;
  lastUpdated: number;
}

export interface MockScenario {
  id: string;
  title: string;
  category: string;
  description: string;
  events: DeviceEvent[];
  expectedThreatLevel: ThreatLevel;
  expectedScamType: string;
}

export interface GuardianContact {
  name: string;
  phone: string;
  relationship: string;
}
