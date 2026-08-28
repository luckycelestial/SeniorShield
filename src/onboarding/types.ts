export interface UserProfileData {
  fullName: string;
  email: string;
  dob: string;
  state: string;
  city: string;
  phone: string;
  language: string;
}

export interface BankInfo {
  id: string;
  bankName: string;
  accountType: 'Savings' | 'Current' | 'Salary';
  last4: string;
  ifsc: string;
  registeredMobile: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

export interface ScamPreferences {
  suspiciousCalls: boolean;
  scamMessages: boolean;
  fraudLinks: boolean;
  bankingFraud: boolean;
  impersonationCalls: boolean;
  fakeDocuments: boolean;
  sensitivity: 'Low' | 'Medium' | 'High';
}

export interface NotificationPreferences {
  scamAlerts: boolean;
  safetyTips: boolean;
  securityUpdates: boolean;
  frequency: 'Daily' | 'Weekly' | 'Only Important';
}

export interface PermissionState {
  phone: boolean;
  sms: boolean;
  mic: boolean;
  camera: boolean;
  notifications: boolean;
}

export interface OnboardingState {
  profile: UserProfileData;
  banks: BankInfo[];
  emergencyContacts: EmergencyContact[];
  scamPreferences: ScamPreferences;
  notificationPreferences: NotificationPreferences;
  permissions: PermissionState;
}
