import { ThreatLevel, ScamReport } from './scam';

export interface ProcessedCallRecord {
  id: string;
  phoneNumber: string;
  timestamp: number;
  durationSeconds: number;
  totalChunks: number;
  threatLevel: ThreatLevel;
  confidenceScore: number;
  scamType: string;
  impersonatedEntity: string;
  seniorActionDirective: string;
  fullTranscript: string;
  chunkTranscripts: {
    chunkIndex: number;
    text: string;
    intent?: string;
  }[];
  scamMarkers: string[];
  report?: ScamReport | null;
}
