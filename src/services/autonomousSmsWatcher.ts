import { Platform } from 'react-native';
import { DeviceEvent, ScamReport } from '../types/scam';
import { fetchRecentSMS, requestDevicePermissions } from './deviceScanner';
import { analyzeMultiChannelCampaign } from './gemini';

type AutonomousSmsCallback = (event: DeviceEvent, report: ScamReport) => void;

class AutonomousSmsWatcher {
  private isWatching = false;
  private intervalTimer: NodeJS.Timeout | null = null;
  private processedSmsIds = new Set<string>();
  private callback: AutonomousSmsCallback | null = null;
  private geminiApiKey = '';
  private isAnalyzing = false;

  /**
   * Initializes autonomous watcher with runtime permissions and begins real-time inbox monitoring.
   */
  public async startWatching(
    callback: AutonomousSmsCallback,
    geminiApiKey = ''
  ): Promise<boolean> {
    this.callback = callback;
    this.geminiApiKey = geminiApiKey;

    if (Platform.OS !== 'android') {
      console.log('[AutonomousSmsWatcher] Non-Android environment.');
      return false;
    }

    try {
      await requestDevicePermissions();

      // Populate existing message IDs
      const existing = await fetchRecentSMS(20);
      if (existing.length > 0) {
        existing.forEach((e) => {
          this.processedSmsIds.add(e.id);
        });
      }

      this.isWatching = true;
      this.scheduleNextCheck();
      console.log('[AutonomousSmsWatcher] Autonomous zero-touch SMS sentinel ACTIVE.');
      return true;
    } catch (e) {
      console.error('[AutonomousSmsWatcher] Start error:', e);
      return false;
    }
  }

  public updateApiKey(key: string) {
    this.geminiApiKey = key;
  }

  private scheduleNextCheck() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
    }

    this.intervalTimer = setInterval(() => {
      this.checkLatestInbox();
    }, 2000); // Check every 2 seconds
  }

  /**
   * Autonomous inbox scanner. Checks for fresh SMS and invokes Gemini 3.5 immediately.
   */
  public async checkLatestInbox() {
    if (!this.isWatching || this.isAnalyzing) return;

    try {
      const recent = await fetchRecentSMS(5);
      if (!recent || recent.length === 0) return;

      for (const sms of recent) {
        if (!this.processedSmsIds.has(sms.id)) {
          this.processedSmsIds.add(sms.id);

          console.log(`[AutonomousSmsWatcher] ⚡ NEW INCOMING SMS: from ${sms.senderOrNumber}: "${sms.contentOrDuration}"`);

          // Trigger Gemini 3.5 Flash Lite live analysis immediately
          await this.analyzeIncomingSms(sms);
        }
      }
    } catch (error) {
      console.warn('[AutonomousSmsWatcher] Inbox check error:', error);
    }
  }

  private async analyzeIncomingSms(smsEvent: DeviceEvent) {
    this.isAnalyzing = true;
    try {
      console.log(`[AutonomousSmsWatcher] Calling Gemini 3.5 Flash Lite for ${smsEvent.senderOrNumber}...`);
      const report = await analyzeMultiChannelCampaign([smsEvent], this.geminiApiKey);

      console.log(`[AutonomousSmsWatcher] Gemini 3.5 Verdict: [${report.threat_level}] ${report.scam_type}`);

      if (this.callback) {
        this.callback(smsEvent, report);
      }
    } catch (err) {
      console.error('[AutonomousSmsWatcher] Error during autonomous analysis:', err);
    } finally {
      this.isAnalyzing = false;
    }
  }

  public stopWatching() {
    this.isWatching = false;
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }
}

export const autonomousSmsWatcher = new AutonomousSmsWatcher();
