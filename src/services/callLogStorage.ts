import { ProcessedCallRecord } from '../types/callLog';

export const INITIAL_PROCESSED_CALLS: ProcessedCallRecord[] = [
  {
    id: 'call_rec_001',
    phoneNumber: '+91 98765 43210',
    timestamp: Date.now() - 1000 * 60 * 18, // 18 mins ago
    durationSeconds: 94, // 1m 34s
    totalChunks: 9,
    threatLevel: 'CRITICAL',
    confidenceScore: 98,
    scamType: 'Electricity Bill Cutoff & Remote APK Extortion',
    impersonatedEntity: 'Tamil Nadu Electricity Board (TNEB)',
    seniorActionDirective: 'DO NOT PAY! Hang up and block this number. Electricity boards never call demanding immediate payment or APK installations.',
    fullTranscript: `[0-10s]: "Dear sir, this is Junior Officer Verma from Electricity Head Office. Your bill from previous cycle is unpaid."\n[10-20s]: "Your power line is scheduled for automatic permanent cutoff tonight at 9:30 PM."\n[20-30s]: "To stop disconnection, download our official TNEB Quick-Pay APK right now from the SMS link sent to you."\n[30-40s]: "Once installed, pay a nominal ₹10 server verification fee so your meter status updates immediately."\n[40-50s]: "Do not disconnect this call, keep line active while completing payment on your screen."`,
    chunkTranscripts: [
      { chunkIndex: 1, text: 'Dear sir, this is Junior Officer Verma from Electricity Head Office. Your bill from previous cycle is unpaid.', intent: 'Authority Impersonation & False Debt' },
      { chunkIndex: 2, text: 'Your power line is scheduled for automatic permanent cutoff tonight at 9:30 PM.', intent: 'Manufactured Urgency (9:30 PM Cutoff)' },
      { chunkIndex: 3, text: 'To stop disconnection, download our official TNEB Quick-Pay APK right now from the SMS link sent to you.', intent: 'Malicious APK Delivery' },
      { chunkIndex: 4, text: 'Once installed, pay a nominal ₹10 server verification fee so your meter status updates immediately.', intent: 'Credential Extraction / Test Charge' },
      { chunkIndex: 5, text: 'Do not disconnect this call, keep line active while completing payment on your screen.', intent: 'Coercive Line Holding & Screen Spying' },
    ],
    scamMarkers: [
      'Nighttime Cutoff Threat (9:30 PM)',
      'Unverified APK Download Request',
      'Authority Impersonation (EB Officer)',
      'Urgent Remote Payment Coercion',
    ],
  },
  {
    id: 'call_rec_002',
    phoneNumber: '+91 88823 11990',
    timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
    durationSeconds: 145, // 2m 25s
    totalChunks: 14,
    threatLevel: 'CRITICAL',
    confidenceScore: 99,
    scamType: 'Digital Arrest & Customs Parcel Intimidation',
    impersonatedEntity: 'CBI & Mumbai Police Cyber Crime Branch',
    seniorActionDirective: 'Police and CBI never conduct arrests, warrants, or asset verification over phone or Skype. Hang up and contact family immediately.',
    fullTranscript: `[0-10s]: "This is Sub-Inspector Rakesh Sharma from Cyber Crime Investigation Wing Mumbai."\n[10-20s]: "A FedEx parcel with your Aadhaar number containing illegal narcotics and 5 fake passports was intercepted at Delhi International Airport."\n[20-30s]: "You are placed under immediate 24-hour Digital Arrest. Do not tell anyone or leave your room."\n[30-40s]: "Transfer your savings to the Supreme Court verification vault account to clear your name."`,
    chunkTranscripts: [
      { chunkIndex: 1, text: 'This is Sub-Inspector Rakesh Sharma from Cyber Crime Investigation Wing Mumbai.', intent: 'Police Authority Impersonation' },
      { chunkIndex: 2, text: 'A FedEx parcel with your Aadhaar number containing illegal narcotics and 5 fake passports was intercepted at Delhi International Airport.', intent: 'Fabricated Crime & Intimidation' },
      { chunkIndex: 3, text: 'You are placed under immediate 24-hour Digital Arrest. Do not tell anyone or leave your room.', intent: 'Coercive Digital Arrest Isolation' },
      { chunkIndex: 4, text: 'Transfer your savings to the Supreme Court verification vault account to clear your name.', intent: 'Demanding Large Fund Exfiltration' },
    ],
    scamMarkers: [
      'Digital Arrest Coercion',
      'CBI / Police Impersonation',
      'Aadhaar / Narcotic Threat',
      'Demand for Bank Vault Transfer',
    ],
  },
  {
    id: 'call_rec_003',
    phoneNumber: '+91 94450 88231',
    timestamp: Date.now() - 1000 * 60 * 60 * 26, // 1 day ago
    durationSeconds: 52, // 52s
    totalChunks: 5,
    threatLevel: 'SAFE',
    confidenceScore: 92,
    scamType: 'Delivery Logistics Coordination',
    impersonatedEntity: 'None (Local Delivery Agent)',
    seniorActionDirective: 'Normal delivery interaction. No financial details or OTPs requested.',
    fullTranscript: `[0-10s]: "Hello sir, I am from BlueDart courier. I am outside your apartment gate."\n[10-20s]: "Is it Flat 302? Please come downstairs to collect your medicine package."\n[20-30s]: "Okay sir, handing over to the security guard."`,
    chunkTranscripts: [
      { chunkIndex: 1, text: 'Hello sir, I am from BlueDart courier. I am outside your apartment gate.', intent: 'Courier Delivery Notification' },
      { chunkIndex: 2, text: 'Is it Flat 302? Please come downstairs to collect your medicine package.', intent: 'Address Verification' },
      { chunkIndex: 3, text: 'Okay sir, handing over to the security guard.', intent: 'Safe Handover' },
    ],
    scamMarkers: [],
  },
];
