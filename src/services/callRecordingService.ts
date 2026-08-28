import { NativeModules, Platform } from 'react-native';
import { ProcessedCallRecord } from '../types/callLog';
import { ThreatLevel } from '../types/scam';

export interface DeviceRecordingFile {
  filePath: string;
  fileName: string;
  callerOrContact: string;
  fileSizeBytes: number;
  lastModified: number;
  durationSeconds: number;
  mimeType: string;
}

export interface AudioAnalysisResult {
  transcript: string;
  chunks: {
    chunkIndex: number;
    text: string;
    intent?: string;
  }[];
  is_scam: boolean;
  threat_level: ThreatLevel;
  scam_type: string;
  confidence_score: number;
  impersonated_entity: string;
  senior_explanation: string;
  action_required: string;
  scam_markers: string[];
  assets_at_risk: string[];
}

const GEMINI_MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash-lite';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

class CallRecordingService {
  /**
   * Scan device storage for real call recordings
   */
  async scanDeviceRecordings(limit: number = 25): Promise<DeviceRecordingFile[]> {
    if (Platform.OS !== 'android' || !NativeModules.PreCallModule) {
      console.warn('⚠️ Native PreCallModule not available on this platform.');
      return [];
    }

    try {
      const files: DeviceRecordingFile[] = await NativeModules.PreCallModule.scanCallRecordings(limit);
      console.log(`📁 [CallRecordingService] Found ${files.length} real audio recording files on device.`);
      return files;
    } catch (e) {
      console.error('❌ [CallRecordingService] Failed to scan audio recordings:', e);
      return [];
    }
  }

  /**
   * Read raw audio file from disk as Base64
   */
  async readAudioFileBase64(filePath: string): Promise<{
    base64: string;
    mimeType: string;
    durationSeconds: number;
    fileName: string;
  } | null> {
    if (Platform.OS !== 'android' || !NativeModules.PreCallModule) {
      return null;
    }

    try {
      const res = await NativeModules.PreCallModule.readAudioFileAsBase64(filePath);
      if (!res?.success || !res?.base64) {
        console.error('❌ Failed to read audio file:', res?.error);
        return null;
      }
      return {
        base64: res.base64,
        mimeType: res.mimeType || 'audio/mp4',
        durationSeconds: res.durationSeconds || 0,
        fileName: res.fileName || '',
      };
    } catch (e) {
      console.error('❌ Error reading audio file:', e);
      return null;
    }
  }

  /**
   * Send real recorded audio directly to Gemini 2.5 Flash Lite Multimodal Audio API
   */
  async analyzeRecordedAudioWithAi(
    filePath: string,
    callerHint?: string,
    apiKeyOverride?: string
  ): Promise<ProcessedCallRecord | null> {
    const apiKey = apiKeyOverride || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
    if (!apiKey) {
      throw new Error('Google Gemini API Key is required for audio transcription.');
    }

    console.log(`🎙️ [CallRecordingService] Loading audio file: ${filePath}`);
    const audioData = await this.readAudioFileBase64(filePath);
    if (!audioData) {
      throw new Error(`Unable to read audio file from path: ${filePath}`);
    }

    const endpoint = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const prompt = `
You are SeniorShield AI, an autonomous cyber defense intelligence engine protecting senior citizens in India from digital fraud, coercive social engineering, and scam campaigns.

YOUR TASK:
Listen to this REAL audio recording from a phone conversation received by a user.
Caller identifier from file: "${callerHint || audioData.fileName}".

Tasks:
1. Transcribe the spoken audio faithfully into normalized text (in English or Romanized Indian languages).
2. Segment the transcription into chronological chunks with speaker intent for each chunk.
3. Determine if the caller is attempting a scam (e.g. Electricity bill disconnection, Digital arrest / CBI intimidation, Bank KYC update APK, Customs courier threat, Investment/Lottery fraud, or Legitimate conversation).
4. Extract specific threat indicators, coercion keywords, and assets targeted.
5. Provide clear, plain-language directives for an elderly senior citizen.

Return ONLY a JSON object strictly matching this schema:
{
  "transcript": "Full transcription of the spoken conversation",
  "chunks": [
    {
      "chunkIndex": 1,
      "text": "Exact text spoken in this segment",
      "intent": "Intent or tactic used (e.g. Authority Claim, Urgency Pressure, APK Link Request, Friendly Chat)"
    }
  ],
  "is_scam": boolean,
  "threat_level": "CRITICAL" | "SUSPICIOUS" | "SAFE",
  "scam_type": "e.g. Electricity Cutoff Fraud | Digital Arrest Scam | Legitimate Call",
  "confidence_score": number between 0 and 100,
  "impersonated_entity": "e.g. Tamil Nadu Electricity Board / CBI Police / State Bank of India / None",
  "senior_explanation": "1-2 crystal clear, simple sentences explaining what happened without jargon",
  "action_required": "Direct command for the senior (e.g. 'Do not click the link or pay any fee. Block this number.')",
  "scam_markers": ["List of red flags or coercive tactics heard"],
  "assets_at_risk": ["Bank Account Balance", "Phone Screen Access", "Personal Identity"]
}
`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: audioData.mimeType,
                data: audioData.base64,
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

    console.log(`🤖 [CallRecordingService] Sending real audio (${(audioData.base64.length / 1024).toFixed(1)} KB Base64) to Gemini API...`);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Gemini API Error ${response.status}:`, errorText);
      throw new Error(`Gemini Audio AI Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Empty response from Gemini Audio AI.');

    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed: AudioAnalysisResult = JSON.parse(cleanJson);

    console.log(`✅ [CallRecordingService] Gemini Analysis Completed for ${audioData.fileName}:`, {
      threatLevel: parsed.threat_level,
      scamType: parsed.scam_type,
      confidence: parsed.confidence_score,
    });

    const record: ProcessedCallRecord = {
      id: `call_rec_${Date.now()}`,
      phoneNumber: callerHint || audioData.fileName.replace(/\.[^/.]+$/, ''),
      timestamp: Date.now(),
      durationSeconds: audioData.durationSeconds || 60,
      totalChunks: parsed.chunks?.length || 1,
      threatLevel: (parsed.threat_level as ThreatLevel) || (parsed.is_scam ? 'CRITICAL' : 'SAFE'),
      confidenceScore: parsed.confidence_score || 95,
      scamType: parsed.scam_type || (parsed.is_scam ? 'Suspicious Call' : 'Benign Call'),
      impersonatedEntity: parsed.impersonated_entity || 'None',
      seniorActionDirective: parsed.action_required || 'No action required.',
      fullTranscript: parsed.transcript || '',
      chunkTranscripts: parsed.chunks || [
        { chunkIndex: 1, text: parsed.transcript || '', intent: 'Speech Analysis' },
      ],
      scamMarkers: parsed.scam_markers || [],
      report: {
        is_scam: parsed.is_scam,
        threat_level: (parsed.threat_level as ThreatLevel) || (parsed.is_scam ? 'CRITICAL' : 'SAFE'),
        scam_type: parsed.scam_type,
        confidence_score: parsed.confidence_score,
        senior_explanation: parsed.senior_explanation,
        action_required: parsed.action_required,
        assets_at_risk: parsed.assets_at_risk || [],
        impersonated_entity: parsed.impersonated_entity,
        threat_indicators: parsed.scam_markers,
      },
    };

    return record;
  }
}

export const callRecordingService = new CallRecordingService();
