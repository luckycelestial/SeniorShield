import { ScamReport, ThreatLevel } from '../types/scam';

// ─── Primary Backend (DistilBERT + XAI + Rules + TI) ─────────────────────────

export interface BackendAnalyzeResponse {
  event: {
    event_id: string;
    user_id?: string;
    channel: string;
    source_id?: string;
    timestamp: string;
  };
  input: { text: string };
  classification: { label: 'SCAM' | 'SAFE'; confidence: number };
  model: { name: string; version: string };
  analysis: { fraud_type: string; intent: string[]; asset_at_risk: string[] };
  evidence: {
    model: { name: string; version: string; status: string };
    prediction: { label: string; probability: number };
    attribution: {
      method: string;
      top_features: { token: string; contribution: number; direction: 'toward_scam' | 'toward_safe' }[];
    };
    rule_evidence: {
      source: string; rule_id: string; category: string;
      description: string; severity: string; matched_text: string; confidence: number;
    }[];
    threat_intelligence: {
      source: string;
      entity: { type: string; value: string };
      provider: string; status: string; reputation: string; confidence: number; evidence: string;
    }[];
    entities: {
      urls: string[]; domains: string[]; phone_numbers: string[];
      emails: string[]; amounts: { value: number; currency: string; raw_text: string }[];
    };
  };
  explanation: {
    senior: { headline: string; message: string; action: string };
    caretaker: { headline: string; summary: string; why_flagged: string[]; recommended_action: string };
  };
  latency_ms: {
    preprocessing: number; distilbert: number; explainability: number;
    rules: number; threat_intelligence: number; groq: number; total: number;
  };
  status: { analysis: string };
}

// ─── Leiden Campaign Correlation Engine ───────────────────────────────────────

export interface CorrelationEngineResponse {
  event_id: string;
  campaign: {
    campaign_id: string;
    community_id: number;
    threat_level: string;
    risk_score: number;
    confidence: number;
    total_events: number;
    channels: string[];
  };
  evidence: {
    phones: string[];
    senders: string[];
    domains: string[];
    apps: string[];
    cross_channel: boolean;
  };
  decision: {
    classification: string; // 'SCAM_CAMPAIGN' | 'BENIGN_OR_NOISE'
    action: string;         // 'ALERT' | 'MONITOR'
  };
}

// All endpoints — DistilBERT (/api/analyze) + Leiden (/api/v1/correlate) — on port 8001
// adb reverse tcp:8001 tcp:8001  (physical Android device)
const BACKEND_BASE_URLS = [
  'http://127.0.0.1:8001',
  'http://172.16.41.43:8001',
  'http://10.0.2.2:8001',
];

// ─── Service Class ────────────────────────────────────────────────────────────

class BackendAnalysisService {
  private activeUrl: string = BACKEND_BASE_URLS[0];
  private isServerOnline: boolean = false;

  constructor() {
    this.checkHealth();
  }

  // --- Primary backend health ---

  async checkHealth(): Promise<boolean> {
    for (const url of BACKEND_BASE_URLS) {
      try {
        const res = await fetch(`${url}/health`, { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'ok') {
            this.activeUrl = url;
            this.isServerOnline = true;
            console.log(`✅ [BackendAnalysisService] Connected to AI Backend at ${url}`);
            return true;
          }
        }
      } catch (_) { /* try next */ }
    }
    this.isServerOnline = false;
    console.warn('⚠️ [BackendAnalysisService] Backend AI Server offline or unreachable.');
    return false;
  }

  // --- Correlation engine health ---

  getIsServerOnline(): boolean { return this.isServerOnline; }
  getIsCorrelationEngineOnline(): boolean { return this.isServerOnline; } // same server now
  getActiveServerUrl(): string { return this.activeUrl; }

  // ─── Correlation Engine: single-event graph correlate ──────────────────────

  /**
   * Posts one event to the Leiden correlation engine at POST /api/v1/correlate.
   * Maps the app's channel enum to the engine's valid channels (call|SMS|URL|payment).
   * Returns null gracefully when the engine is offline.
   */
  async correlateEventWithGraph(
    eventId: string,
    channel: 'SMS' | 'CALL' | 'NOTIFICATION' | 'MESSAGE',
    sender: string,
    text: string,
    riskScore: number,
    intent: string = ''
  ): Promise<CorrelationEngineResponse | null> {
    if (!this.isServerOnline) return null;

    const channelMap: Record<string, string> = {
      SMS: 'SMS', CALL: 'call', NOTIFICATION: 'SMS', MESSAGE: 'SMS',
    };
    const engineChannel = channelMap[channel] ?? 'SMS';

    try {
      const body = {
        event_id: eventId,
        timestamp: new Date().toISOString(),
        channel: engineChannel,
        text,
        phone: engineChannel === 'call' ? sender : '',
        sender: engineChannel !== 'call' ? sender : '',
        domain: '',
        app: '',
        risk_score: Math.max(0.0, Math.min(1.0, riskScore)),
        intent,
      };

      console.log(`🔗 [CorrelationEngine] Sending event ${eventId} (${engineChannel}, risk=${body.risk_score.toFixed(2)})...`);

      // Uses same activeUrl as DistilBERT — merged into port 8001
      const res = await fetch(`${this.activeUrl}/api/v1/correlate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.warn(`⚠️ [CorrelationEngine] HTTP ${res.status}`);
        return null;
      }

      const data: CorrelationEngineResponse = await res.json();
      console.log(
        `✅ [CorrelationEngine] ${eventId}: [${data.decision.classification}] ` +
        `threat=${data.campaign.threat_level} cross-channel=${data.evidence.cross_channel}`
      );
      return data;
    } catch (err) {
      console.warn('⚠️ [CorrelationEngine] Request failed:', err);
      return null;
    }
  }

  // ─── Primary Analysis + Correlation Enrichment ─────────────────────────────

  /**
   * Sends text to the DistilBERT backend (/api/analyze).
   * Then automatically enriches the result with the Leiden campaign graph
   * via /api/v1/correlate — upgrading threat level if a SCAM_CAMPAIGN is found.
   * Falls back to null (caller can use Gemini) if the primary backend is offline.
   */
  async analyzeTextWithBackend(
    text: string,
    channel: 'SMS' | 'CALL' | 'NOTIFICATION' | 'MESSAGE' = 'SMS',
    sourceId?: string,
    userId: string = 'usr_senior_01'
  ): Promise<{
    report: ScamReport;
    backendRaw: BackendAnalyzeResponse;
    correlationRaw?: CorrelationEngineResponse | null;
  } | null> {
    const isOnline = await this.checkHealth();
    if (!isOnline) {
      console.warn('⚠️ [BackendAnalysisService] Backend offline. Caller should fall back to Gemini.');
      return null;
    }

    try {
      console.log(`🚀 [BackendAnalysisService] → ${this.activeUrl}/api/analyze (${channel})`);
      const response = await fetch(`${this.activeUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          channel,
          user_id: userId,
          source_id: sourceId || 'Unknown',
          include_evidence: true,
          include_rules: true,
          include_threat_intel: true,
          include_llm: true,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data: BackendAnalyzeResponse = await response.json();
      console.log(`✅ [BackendAnalysisService] label=${data.classification.label} fraud=${data.analysis?.fraud_type}`);

      // Build canonical ScamReport from DistilBERT response
      const isScam = data.classification.label === 'SCAM';
      const threatLevel: ThreatLevel = isScam ? 'CRITICAL' : 'SAFE';

      const indicators: string[] = [];
      data.evidence?.rule_evidence?.forEach((r) =>
        indicators.push(`${r.rule_id}: ${r.description}`)
      );
      data.evidence?.threat_intelligence?.forEach((ti) => {
        if (ti.reputation === 'malicious')
          indicators.push(`Threat Intel: ${ti.entity.value} flagged (${ti.evidence})`);
      });

      const report: ScamReport = {
        is_scam: isScam,
        threat_level: threatLevel,
        scam_type: data.analysis?.fraud_type || (isScam ? 'Suspicious Coercion' : 'Safe Interaction'),
        confidence_score: Math.round(data.classification.confidence * 100),
        senior_explanation: data.explanation?.senior?.message || 'Please be cautious with unsolicited requests.',
        action_required: data.explanation?.senior?.action || 'Do not transfer money or share private codes.',
        assets_at_risk: data.analysis?.asset_at_risk || ['Personal Privacy', 'Bank Credentials'],
        threat_indicators: indicators.length > 0 ? indicators : ['Automated DistilBERT text classification'],
        impersonated_entity:
          data.evidence?.rule_evidence?.find((r) => r.category === 'impersonation_authority')?.matched_text ||
          'None detected',
      };

      // ── Second pass: Leiden Campaign Correlation Engine ──────────────────
      const eventId = data.event?.event_id || `evt_${Date.now()}`;
      const riskScore = data.classification.confidence; // already 0.0–1.0
      const intent = data.analysis?.fraud_type || '';

      const correlationRaw = await this.correlateEventWithGraph(
        eventId,
        channel,
        sourceId || 'unknown',
        text,
        riskScore,
        intent
      );

      // Merge Leiden graph intelligence into the report
      if (correlationRaw?.decision.classification === 'SCAM_CAMPAIGN') {
        report.threat_level = 'CRITICAL';
        report.is_scam = true;
        report.confidence_score = Math.round(
          Math.max(report.confidence_score, correlationRaw.campaign.confidence * 100)
        );

        const campaignIndicators: string[] = [
          `Campaign Graph: ${correlationRaw.campaign.campaign_id} (${correlationRaw.campaign.total_events} correlated events)`,
        ];
        if (correlationRaw.evidence.cross_channel) {
          campaignIndicators.push(
            `Cross-Channel Attack: ${correlationRaw.campaign.channels.join(' + ')}`
          );
        }
        if (correlationRaw.evidence.phones.length > 0) {
          campaignIndicators.push(`Shared Scam Numbers: ${correlationRaw.evidence.phones.join(', ')}`);
        }
        if (correlationRaw.evidence.domains.length > 0) {
          campaignIndicators.push(`Malicious Domains: ${correlationRaw.evidence.domains.join(', ')}`);
        }
        report.threat_indicators = [...(report.threat_indicators ?? []), ...campaignIndicators];
      }

      return { report, backendRaw: data, correlationRaw };
    } catch (err) {
      console.error('❌ [BackendAnalysisService] Analysis failed:', err);
      return null;
    }
  }
}

export const backendAnalysisService = new BackendAnalysisService();
