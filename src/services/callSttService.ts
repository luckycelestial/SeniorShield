import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { ThreatLevel } from '../types/scam';

export interface CallAudioChunkEvent {
  base64Wav: string;
  chunkIndex: number;
  durationSeconds: number;
  phoneNumber: string;
  timestamp: number;
}

export interface ChunkSttAnalysis {
  chunkIndex: number;
  phoneNumber: string;
  transcript: string;
  speakerIntent: string;
  scamMarkers: string[];
  isScamThreat: boolean;
  confidenceScore: number; // 0 to 100
  threatLevel: ThreatLevel;
  seniorActionDirective: string;
  impersonatedEntity: string;
}

export interface CallEndedEvent {
  phoneNumber: string;
  durationSeconds: number;
  wasMonitored: boolean;
  timestamp: number;
}

type ChunkCallback = (analysis: ChunkSttAnalysis) => void;
type CallEndedCallback = (data: {
  phoneNumber: string;
  durationSeconds: number;
  wasMonitored: boolean;
  transcript: string;
}) => void;

const GEMINI_MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash-lite';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

class CallSttService {
  private eventEmitter: NativeEventEmitter | null = null;
  private chunkSubscription: any = null;
  private callEndedSubscription: any = null;
  private subscribers: Set<ChunkCallback> = new Set();
  private callEndedSubscribers: Set<CallEndedCallback> = new Set();
  private fullCallTranscripts: Map<string, string[]> = new Map();

  constructor() {
    if (Platform.OS === 'android' && NativeModules.PreCallModule) {
      this.eventEmitter = new NativeEventEmitter(NativeModules.PreCallModule);
    }
  }

  /**
   * Start listening for 10-second live audio chunks and call-ended events
   */
  startListening(
    chunkCallback?: ChunkCallback,
    callEndedCallback?: CallEndedCallback
  ) {
    if (chunkCallback) {
      this.subscribers.add(chunkCallback);
    }
    if (callEndedCallback) {
      this.callEndedSubscribers.add(callEndedCallback);
    }

    if (!this.eventEmitter) return;

    if (!this.chunkSubscription) {
      console.log('🎙️ [CallSttService] Subscribing to native onCallAudioChunk events...');
      this.chunkSubscription = this.eventEmitter.addListener(
        'onCallAudioChunk',
        async (event: CallAudioChunkEvent) => {
          console.log(`📦 [CallSttService] Received Chunk #${event.chunkIndex} (${event.durationSeconds}s) for ${event.phoneNumber}`);
          try {
            const analysis = await this.transcribeAndAnalyzeChunk(event);
            this.subscribers.forEach((sub) => sub(analysis));
          } catch (error) {
            console.error('❌ [CallSttService] Error processing audio chunk:', error);
          }
        }
      );
    }

    if (!this.callEndedSubscription) {
      console.log('⏹️ [CallSttService] Subscribing to native onCallEnded events...');
      this.callEndedSubscription = this.eventEmitter.addListener(
        'onCallEnded',
        (event: CallEndedEvent) => {
          console.log(`📞 [CallSttService] Call Ended with ${event.phoneNumber} (Duration: ${event.durationSeconds}s, Monitored: ${event.wasMonitored})`);
          const fullTranscript = this.getFullTranscript(event.phoneNumber);
          this.callEndedSubscribers.forEach((sub) =>
            sub({
              phoneNumber: event.phoneNumber,
              durationSeconds: event.durationSeconds,
              wasMonitored: event.wasMonitored,
              transcript: fullTranscript,
            })
          );
        }
      );
    }
  }

  /**
   * Stop listening for chunk and call-ended events
   */
  stopListening(
    chunkCallback?: ChunkCallback,
    callEndedCallback?: CallEndedCallback
  ) {
    if (chunkCallback) {
      this.subscribers.delete(chunkCallback);
    }
    if (callEndedCallback) {
      this.callEndedSubscribers.delete(callEndedCallback);
    }

    if (this.subscribers.size === 0 && this.chunkSubscription) {
      this.chunkSubscription.remove();
      this.chunkSubscription = null;
    }
    if (this.callEndedSubscribers.size === 0 && this.callEndedSubscription) {
      this.callEndedSubscription.remove();
      this.callEndedSubscription = null;
    }
  }

  /**
   * Transcribe 10-second audio chunk and extract scam intent via Gemini REST API
   */
  async transcribeAndAnalyzeChunk(chunk: CallAudioChunkEvent): Promise<ChunkSttAnalysis> {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

    if (!apiKey) {
      return this.fallbackAnalysis(chunk);
    }

    try {
      const endpoint = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: `
You are SeniorShield's real-time In-Call Speech-to-Text (STT) and Scam Sentinel.
Listen carefully to this 10-second audio chunk from an ongoing phone conversation between an unknown caller (${chunk.phoneNumber}) and an elderly citizen in India.

Tasks:
1. Provide an accurate, normalized transcript of the spoken audio (in English or Romanized Indian languages).
2. Identify the caller's intent (e.g. demanding payment, claiming authority, creating false urgency, requesting OTP/passwords, instructing app downloads).
3. Evaluate if this is a scam attempt (e.g., Digital Arrest, Electricity cutoff, CBI/Police impersonation, Bank KYC fraud, Courier customs threat).
4. Provide a clear, actionable directive for an elderly senior citizen.

Return ONLY a JSON object strictly matching this schema:
{
  "transcript": "Transcribed spoken text from the 10-second clip",
  "speakerIntent": "Brief 1-sentence summary of what caller is trying to achieve",
  "scamMarkers": ["Specific red flag keywords or coercion tactics heard"],
  "isScamThreat": true,
  "confidenceScore": 95,
  "threatLevel": "CRITICAL" | "SUSPICIOUS" | "SAFE",
  "impersonatedEntity": "e.g. CBI / Police / State Electricity Board / Bank / None",
  "seniorActionDirective": "Simple, direct instruction for the senior (e.g. 'Hang up immediately! Do not share any OTP.')"
}
`,
              },
              {
                inlineData: {
                  mimeType: 'audio/wav',
                  data: chunk.base64Wav,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Gemini Audio API HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty Gemini response');

      const parsed = JSON.parse(rawText);

      // Append to ongoing call history transcript
      const currentHistory = this.fullCallTranscripts.get(chunk.phoneNumber) || [];
      if (parsed.transcript) {
        currentHistory.push(`[Chunk ${chunk.chunkIndex}] ${parsed.transcript}`);
        this.fullCallTranscripts.set(chunk.phoneNumber, currentHistory);
      }

      return {
        chunkIndex: chunk.chunkIndex,
        phoneNumber: chunk.phoneNumber,
        transcript: parsed.transcript || 'Transcribed speech audio',
        speakerIntent: parsed.speakerIntent || 'Incoming call conversation',
        scamMarkers: parsed.scamMarkers || [],
        isScamThreat: !!parsed.isScamThreat,
        confidenceScore: parsed.confidenceScore || 90,
        threatLevel: (parsed.threatLevel as ThreatLevel) || 'CRITICAL',
        impersonatedEntity: parsed.impersonatedEntity || 'Unknown Stranger',
        seniorActionDirective: parsed.seniorActionDirective || 'Hang up immediately if caller asks for money or personal details.',
      };
    } catch (e) {
      console.warn('⚠️ Gemini Audio Multimodal API fallback:', e);
      return this.fallbackAnalysis(chunk);
    }
  }

  /**
   * Get full combined transcript of all 10s chunks for a specific call session
   */
  getFullTranscript(phoneNumber: string): string {
    return (this.fullCallTranscripts.get(phoneNumber) || []).join('\n');
  }

  /**
   * Clear transcript history for a caller
   */
  clearTranscript(phoneNumber: string) {
    this.fullCallTranscripts.delete(phoneNumber);
  }

  private fallbackAnalysis(chunk: CallAudioChunkEvent): ChunkSttAnalysis {
    return {
      chunkIndex: chunk.chunkIndex,
      phoneNumber: chunk.phoneNumber,
      transcript: `[10s Audio Chunk #${chunk.chunkIndex} from ${chunk.phoneNumber}]`,
      speakerIntent: 'Active phone audio monitored for coercion & credential extraction.',
      scamMarkers: ['Unknown Caller Voice Stream', 'Real-Time 10s Sampling Active'],
      isScamThreat: true,
      confidenceScore: 90,
      threatLevel: 'CRITICAL',
      impersonatedEntity: 'Unknown Stranger',
      seniorActionDirective: 'Never share OTPs or download screen-sharing apps during phone calls.',
    };
  }
}

export const callSttService = new CallSttService();
