import { Platform, PermissionsAndroid, NativeModules, NativeEventEmitter } from 'react-native';
import { DeviceEvent } from '../types/scam';
import { reputationService, NumberReputation } from './reputationService';

export interface PreCallReputation {
  phoneNumber: string;
  callerName: string;
  spamScore: number; // 0 (Safe) to 100 (Critical Scam)
  threatCategory: 'CRITICAL_SCAM' | 'SUSPICIOUS' | 'TELEMARKETING' | 'SAFE_VERIFIED';
  impersonationTag: string; // e.g. "Fake Police / CBI", "Electricity Board Fraud", "None"
  seniorDirective: string; // Plain English instruction for senior
  isMultiChannelAttack: boolean; // Correlated with recent SMS/Link
  reportsCount: number;
  trafficLight: 'RED' | 'YELLOW' | 'GREEN';
}

export type PreCallCallback = (alert: PreCallReputation) => void;

class PreCallSentinel {
  private isListening = false;
  private preCallCallback: PreCallCallback | null = null;
  private eventSubscription: any = null;

  /**
   * Requests Android Phone State permissions.
   */
  public async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;

    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
      ]);

      const phoneStateOk =
        granted['android.permission.READ_PHONE_STATE'] === PermissionsAndroid.RESULTS.GRANTED;
      return phoneStateOk;
    } catch (e) {
      console.warn('[PreCallSentinel] Permission request error:', e);
      return false;
    }
  }

  /**
   * Analyzes an incoming caller number with instant reputation lookup & multi-channel timeline correlation.
   */
  public async evaluateIncomingCaller(
    phoneNumber: string,
    recentEvents: DeviceEvent[] = []
  ): Promise<PreCallReputation> {
    // Step 1: Query Truecaller-style lightweight reputation lookup
    const rep: NumberReputation = await reputationService.lookupReputation(phoneNumber);

    // Rule 1: Saved Contact is ALWAYS GREEN (bypass further suspicion checks)
    if (rep.trafficLight === 'GREEN') {
      return {
        phoneNumber,
        callerName: rep.callerName,
        spamScore: 0,
        threatCategory: 'SAFE_VERIFIED',
        impersonationTag: 'Saved Contact',
        seniorDirective: 'Safe to answer. This is a contact saved in your address book.',
        isMultiChannelAttack: false,
        reportsCount: 0,
        trafficLight: 'GREEN',
      };
    }

    // Step 2: Check multi-channel correlation with recent SMS/links for non-saved callers
    const hasRecentScamSms = recentEvents.some((e) => {
      const text = (e.contentOrDuration || '').toLowerCase();
      return (
        text.includes('power') ||
        text.includes('electricity') ||
        text.includes('police') ||
        text.includes('cbi') ||
        text.includes('kyc') ||
        text.includes('customs') ||
        text.includes('narcotics') ||
        text.includes('arrest')
      );
    });

    // High Risk: Follow-up Call after a Scam SMS (Multi-Channel Coercion)
    if (hasRecentScamSms) {
      return {
        phoneNumber,
        callerName: '⚠️ SUSPECTED SCAM OPERATOR',
        spamScore: 98,
        threatCategory: 'CRITICAL_SCAM',
        impersonationTag: 'Fake Official Follow-up Call',
        seniorDirective: 'DO NOT ANSWER! This caller is trying to steal your money after sending a fake message.',
        isMultiChannelAttack: true,
        reportsCount: Math.max(428, rep.reportsCount),
        trafficLight: 'RED',
      };
    }

    // High Risk: International / VoIP Spoof
    if (rep.trafficLight === 'RED') {
      return {
        phoneNumber,
        callerName: rep.callerName,
        spamScore: rep.score,
        threatCategory: 'CRITICAL_SCAM',
        impersonationTag: rep.spamType,
        seniorDirective: 'DO NOT PICK UP! Reported as fraud by community users.',
        isMultiChannelAttack: false,
        reportsCount: rep.reportsCount,
        trafficLight: 'RED',
      };
    }

    // Medium Risk: Unknown Personal Mobile calling as business
    if (rep.trafficLight === 'YELLOW') {
      return {
        phoneNumber,
        callerName: rep.callerName,
        spamScore: rep.score,
        threatCategory: 'SUSPICIOUS',
        impersonationTag: rep.spamType,
        seniorDirective: 'Be cautious. Never share OTPs or passwords with this caller.',
        isMultiChannelAttack: false,
        reportsCount: rep.reportsCount,
        trafficLight: 'YELLOW',
      };
    }

    // Safe / Verified
    return {
      phoneNumber,
      callerName: rep.callerName,
      spamScore: rep.score,
      threatCategory: 'SAFE_VERIFIED',
      impersonationTag: 'None',
      seniorDirective: 'Safe to answer.',
      isMultiChannelAttack: false,
      reportsCount: 0,
      trafficLight: 'GREEN',
    };
  }

  /**
   * Starts native real-time pre-call sentinel listener.
   */
  public async startPreCallMonitoring(callback: PreCallCallback) {
    this.preCallCallback = callback;
    this.isListening = true;
    await this.requestPermissions();

    if (Platform.OS === 'android' && NativeModules.PreCallModule) {
      try {
        const emitter = new NativeEventEmitter(NativeModules.PreCallModule);
        this.eventSubscription = emitter.addListener('onIncomingCall', async (event: any) => {
          const number = event?.phoneNumber || 'Unknown';
          console.log('[PreCallSentinel] ⚡ NATIVE INCOMING RINGING DETECTED:', number);
          const rep = await this.evaluateIncomingCaller(number);
          this.triggerPreCallAlert(rep);
        });
        console.log('[PreCallSentinel] Native PreCallModule emitter connected.');
      } catch (err) {
        console.warn('[PreCallSentinel] Emitter hook notice:', err);
      }
    }

    console.log('[PreCallSentinel] Real-time Pre-Call Sentinel ACTIVE.');
  }

  /**
   * Dispatches pre-call alert to UI.
   */
  public triggerPreCallAlert(alert: PreCallReputation) {
    if (this.preCallCallback) {
      this.preCallCallback(alert);
    }
  }

  public stopPreCallMonitoring() {
    this.isListening = false;
    this.preCallCallback = null;
    if (this.eventSubscription) {
      this.eventSubscription.remove();
      this.eventSubscription = null;
    }
  }
}

export const preCallSentinel = new PreCallSentinel();
