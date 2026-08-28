/**
 * SeniorShield WhatsApp Sentinel Bridge (Neonize Client Integration)
 */

export interface WhatsAppThreat {
  id: string;
  timestamp: number;
  sender: string;
  message_preview?: string;
  type: 'WHATSAPP_MESSAGE' | 'WHATSAPP_CALL';
  threat_level: 'CRITICAL' | 'SUSPICIOUS' | 'SAFE';
  scam_type: string;
  confidence_score: number;
  plain_english_explanation: string;
  senior_action_directive: string;
}

export interface WhatsAppSentinelStatus {
  connected: boolean;
  scanned_count: number;
  threats_count: number;
  latest_threat: WhatsAppThreat | null;
}

const BASE_URL = 'http://127.0.0.1:5005/api/whatsapp';

class WhatsAppSentinelService {
  /**
   * Fetches current WhatsApp Sentinel connection and threat telemetry.
   */
  public async getStatus(): Promise<WhatsAppSentinelStatus> {
    try {
      const response = await fetch(`${BASE_URL}/status`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (e) {
      return {
        connected: false,
        scanned_count: 0,
        threats_count: 0,
        latest_threat: null,
      };
    }
  }

  /**
   * Fetches all detected WhatsApp scam records.
   */
  public async getThreats(): Promise<WhatsAppThreat[]> {
    try {
      const response = await fetch(`${BASE_URL}/threats`);
      if (!response.ok) return [];
      return await response.json();
    } catch (e) {
      return [];
    }
  }

  /**
   * Simulates an incoming WhatsApp coercion message for live demonstrations.
   */
  public async simulateWhatsAppThreat(text?: string, sender?: string): Promise<WhatsAppThreat | null> {
    try {
      const response = await fetch(`${BASE_URL}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sender }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.record || null;
    } catch (e) {
      return null;
    }
  }
}

export const whatsappSentinel = new WhatsAppSentinelService();
