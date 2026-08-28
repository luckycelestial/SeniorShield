import { ProcessedCallRecord } from '../types/callLog';

// Clean initial store with 0 hardcoded fake calls.
// All records are dynamically scanned and processed from real device call recording files via Gemini AI.
export const INITIAL_PROCESSED_CALLS: ProcessedCallRecord[] = [];
