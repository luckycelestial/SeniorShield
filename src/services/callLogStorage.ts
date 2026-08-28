import { ProcessedCallRecord } from '../types/callLog';

export const INITIAL_PROCESSED_CALLS: ProcessedCallRecord[] = [
  {
    id: 'call_init_da_1',
    phoneNumber: '+91 91234 56789',
    timestamp: Date.now() - 1000 * 60 * 25,
    durationSeconds: 312,
    totalChunks: 3,
    threatLevel: 'CRITICAL',
    confidenceScore: 98,
    scamType: 'Digital Arrest & Law Enforcement Impersonation',
    impersonatedEntity: 'Central Bureau of Investigation (CBI) / Cyber Police',
    seniorActionDirective:
      'DO NOT TRANSFER FUNDS OR JOIN VIDEO CALLS! Indian Police & CBI never conduct digital arrests or demand money transfers.',
    fullTranscript:
      'This is Inspector Verma calling from CBI Cyber Crime Mumbai. A courier package containing illegal narcotics and fake passports registered under your Aadhaar card was seized at Mumbai International Airport. You are under immediate Digital Arrest. Do not disconnect this call or tell anyone. You must transfer your savings to RBI escrow account for verification.',
    chunkTranscripts: [
      {
        chunkIndex: 1,
        text: 'This is Inspector Verma from CBI Mumbai Cyber Crime Cell. A customs narcotics parcel in your name was intercepted at Mumbai Airport.',
        intent: 'Authority & Police Impersonation',
      },
      {
        chunkIndex: 2,
        text: 'You are placed under immediate digital arrest under Section 420 IPC. You are not allowed to step out or speak to family members.',
        intent: 'Digital Arrest Fear Inducement & Psychological Isolation',
      },
      {
        chunkIndex: 3,
        text: 'To avoid immediate physical arrest warrant, you must immediately transfer all your bank fixed deposits to RBI clearance escrow.',
        intent: 'Extortion & Financial Extraction Demand',
      },
    ],
    scamMarkers: [
      'Fake CBI Police Authority',
      'Digital Arrest Intimidation',
      'Psychological Isolation Warning',
      'Urgent Escrow Wire Demand',
    ],
  },
];
