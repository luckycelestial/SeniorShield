import { MockScenario } from '../types/scam';

/**
 * Realistic Indian social-engineering scam vectors and benign benchmarks.
 * Designed for offline testing, demos to hackathon judges, and simulated verification.
 */
export const MOCK_SCAM_SCENARIOS: MockScenario[] = [
  {
    id: 'scenario_electricity_eb',
    title: 'Electricity Disconnection Scam',
    category: 'Utility Threat & Urgent Cut-off',
    description: 'High-urgency SMS claiming power will be cut tonight at 9:30 PM, paired with an incoming spoofed call from a fake EB officer.',
    expectedThreatLevel: 'CRITICAL',
    expectedScamType: 'Electricity Bill Disconnection Fraud',
    events: [
      {
        id: 'evt_eb_sms_1',
        timestamp: Date.now() - 1000 * 60 * 45, // 45 mins ago
        type: 'SMS',
        senderOrNumber: '+91 98765 43210',
        contentOrDuration:
          'Dear Consumer, Your Electricity power will be disconnected tonight at 9:30 PM from power office because your previous month bill was not updated. Please immediately call Electricity Officer at +91 98765 43210. TNEB/BESCOM',
      },
      {
        id: 'evt_eb_call_2',
        timestamp: Date.now() - 1000 * 60 * 15, // 15 mins ago
        type: 'CALL',
        senderOrNumber: '+91 98765 43210',
        contentOrDuration: 'Incoming Call (Duration: 3m 42s). Caller claiming to be Junior Engineer demanding ₹10 test recharge via remote APK link.',
      },
    ],
  },
  {
    id: 'scenario_digital_arrest',
    title: 'Digital Arrest / CBI Impersonation',
    category: 'Fear Inducement & State Impersonation',
    description: 'Fake courier notification claiming illegal contraband was found in your name, followed by an aggressive call impersonating Police/CBI.',
    expectedThreatLevel: 'CRITICAL',
    expectedScamType: 'Digital Arrest & Law Enforcement Impersonation',
    events: [
      {
        id: 'evt_da_sms_1',
        timestamp: Date.now() - 1000 * 60 * 120, // 2 hours ago
        type: 'SMS',
        senderOrNumber: 'VD-FEDEX-IND',
        contentOrDuration:
          'FedEx Alert: Parcel #IND-94821 addressed in your name containing 5 Passports and illegal narcotics has been seized by Customs at Mumbai Airport. Police FIR registered.',
      },
      {
        id: 'evt_da_call_2',
        timestamp: Date.now() - 1000 * 60 * 20, // 20 mins ago
        type: 'CALL',
        senderOrNumber: '+91 91234 56789',
        contentOrDuration:
          'Incoming Call (Duration: 8m 15s). Caller claiming to be CBI Inspector Verma, demanding senior stay on video call for digital arrest and transfer savings to RBI verification escrow account.',
      },
    ],
  },
  {
    id: 'scenario_bank_kyc_apk',
    title: 'Bank KYC / Malicious APK Scam',
    category: 'Credential & Screen Harvesting',
    description: 'Deceptive SMS warning account deactivation unless senior clicks an unverified .apk link to update PAN/KYC.',
    expectedThreatLevel: 'CRITICAL',
    expectedScamType: 'Fake Bank KYC & Malicious APK Trojan',
    events: [
      {
        id: 'evt_kyc_sms_1',
        timestamp: Date.now() - 1000 * 60 * 10, // 10 mins ago
        type: 'SMS',
        senderOrNumber: 'VM-SBIKYC-ALERT',
        contentOrDuration:
          'Dear SBI User, your Netbanking account has been suspended due to pending PAN/KYC update. Kindly click http://sbi-kyc-update-portal.apk to complete instant verification within 24 hours to avoid permanent deactivation.',
      },
    ],
  },
  {
    id: 'scenario_legitimate_bank',
    title: 'Legitimate Bank Credit Notification',
    category: 'Safe Routine Transaction',
    description: 'Standard automated bank SMS confirmation of money credited via UPI with no urgent action required.',
    expectedThreatLevel: 'SAFE',
    expectedScamType: 'Legitimate Bank Transaction Notice',
    events: [
      {
        id: 'evt_safe_sms_1',
        timestamp: Date.now() - 1000 * 60 * 30, // 30 mins ago
        type: 'SMS',
        senderOrNumber: 'VK-HDFCBK',
        contentOrDuration:
          'Dear Customer, INR 2,500.00 is credited to your A/C ending XX4912 on 27-Aug-2026 via UPI Ref 623918239102. Available Balance: INR 48,250.00. - HDFC Bank',
      },
      {
        id: 'evt_safe_call_2',
        timestamp: Date.now() - 1000 * 60 * 5, // 5 mins ago
        type: 'CALL',
        senderOrNumber: '+91 94440 12345 (Priya - Daughter)',
        contentOrDuration: 'Incoming Call (Duration: 2m 10s). Routine phone call from saved family contact.',
      },
    ],
  },
  {
    id: 'scenario_pre_call_scam',
    title: 'Pre-Call Truecaller Flagging Alert',
    category: 'Real-Time Pre-Call Telephony Sniffing',
    description: 'Instant reputation lookup flags an incoming call from a known cyber syndicate (428 community fraud reports) before you pick up.',
    expectedThreatLevel: 'CRITICAL',
    expectedScamType: 'Pre-Call Scam Interception & High-Risk Caller',
    events: [
      {
        id: 'evt_precall_1',
        timestamp: Date.now() - 1000 * 60 * 2, // 2 mins ago
        type: 'SMS',
        senderOrNumber: '+91 98841 00999',
        contentOrDuration: 'TRAI Alert: Your mobile SIM number will be permanently disconnected within 2 hours. Call our verification desk immediately.',
      },
      {
        id: 'evt_precall_2',
        timestamp: Date.now(), // Incoming Now
        type: 'CALL',
        senderOrNumber: '+91 98841 00999 (Reported: Fake Telecom Officer)',
        contentOrDuration: 'Incoming Call (Ringing Now). Reputation Score: 98% Spam. Truecaller Community Reports: 428 Fraud Flags.',
      },
    ],
  },
];
