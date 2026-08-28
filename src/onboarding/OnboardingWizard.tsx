import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  View,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Shield, Sun, Moon } from 'lucide-react-native';
import {
  OnboardingState,
  UserProfileData,
  BankInfo,
  EmergencyContact,
  ScamPreferences,
  NotificationPreferences,
  PermissionState,
} from './types';
import { Step1Welcome } from './steps/Step1Welcome';
import { Step3Permissions } from './steps/Step3Permissions';
import { Step4Profile } from './steps/Step4Profile';
import { Step5Banking } from './steps/Step5Banking';
import { Step6Contacts } from './steps/Step6Contacts';
import { Step7Preferences } from './steps/Step7Preferences';
import { Step9StayInformed } from './steps/Step9StayInformed';
import { Step10AllSet } from './steps/Step10AllSet';

interface OnboardingWizardProps {
  onComplete: (data: OnboardingState) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Form State
  const [profile, setProfile] = useState<UserProfileData>({
    fullName: '',
    email: '',
    dob: '',
    state: '',
    city: '',
    phone: '',
    language: 'English',
  });

  const [banks, setBanks] = useState<BankInfo[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);

  const [scamPreferences, setScamPreferences] = useState<ScamPreferences>({
    suspiciousCalls: true,
    scamMessages: true,
    fraudLinks: true,
    bankingFraud: true,
    impersonationCalls: true,
    fakeDocuments: true,
    sensitivity: 'Medium',
  });

  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    scamAlerts: true,
    safetyTips: true,
    securityUpdates: true,
    frequency: 'Weekly',
  });

  const [permissions, setPermissions] = useState<PermissionState>({
    phone: true,
    sms: true,
    mic: true,
    camera: false,
    notifications: true,
  });

  const TOTAL_STEPS = 8;

  const handleNext = () => {
    console.log('[SeniorShield Onboarding] Advancing from Step', currentStep);
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    console.log('[SeniorShield Onboarding] Going back from Step', currentStep);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const finishOnboarding = () => {
    console.log('[SeniorShield Onboarding] Completing Onboarding Wizard!');
    onComplete({
      profile,
      banks,
      emergencyContacts,
      scamPreferences,
      notificationPreferences,
      permissions,
    });
  };

  const handleTogglePermission = (key: keyof PermissionState) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChangeProfile = (updated: Partial<UserProfileData>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  };

  const handleAddBank = (bank: BankInfo) => {
    setBanks((prev) => [...prev, bank]);
  };

  const handleRemoveBank = (id: string) => {
    setBanks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleAddContact = (contact: EmergencyContact) => {
    setEmergencyContacts((prev) => [...prev, contact]);
  };

  const handleRemoveContact = (id: string) => {
    setEmergencyContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleTogglePreference = (key: keyof Omit<ScamPreferences, 'sensitivity'>) => {
    setScamPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleNotificationType = (
    key: keyof Omit<NotificationPreferences, 'frequency'>
  ) => {
    setNotificationPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.safeAreaDark]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F172A' : '#F8FAFC'}
      />

      {/* Onboarding Top Header */}
      <View style={[styles.topHeader, isDarkMode && styles.topHeaderDark]}>
        {currentStep > 1 ? (
          <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={12}>
            <ChevronLeft size={20} color={isDarkMode ? '#F8FAFC' : '#0F172A'} />
            <Text style={[styles.backText, isDarkMode && styles.backTextDark]}>Back</Text>
          </Pressable>
        ) : (
          <View style={styles.logoRow}>
            <Shield size={22} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
            <Text style={[styles.appName, isDarkMode && styles.appNameDark]}>SeniorShield</Text>
          </View>
        )}

        <View style={styles.headerRightSection}>
          <View style={[styles.stepCounterBadge, isDarkMode && styles.stepCounterBadgeDark]}>
            <Text style={[styles.stepCounterText, isDarkMode && styles.stepCounterTextDark]}>
              Step {currentStep} of {TOTAL_STEPS}
            </Text>
          </View>

          {/* Prominent Dark/Light Mode Switch Toggle */}
          <Pressable
            style={[styles.themeToggleSwitch, isDarkMode && styles.themeToggleSwitchDark]}
            onPress={() => setIsDarkMode((prev) => !prev)}
            hitSlop={8}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
          >
            <View style={[styles.switchTrack, isDarkMode && styles.switchTrackDark]}>
              <View style={[styles.switchThumb, isDarkMode && styles.switchThumbDark]}>
                {isDarkMode ? (
                  <Moon size={14} color="#0F172A" />
                ) : (
                  <Sun size={14} color="#FFFFFF" />
                )}
              </View>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Progress Track */}
      <View style={[styles.progressTrack, isDarkMode && styles.progressTrackDark]}>
        <View
          style={[
            styles.progressBar,
            { width: `${(currentStep / TOTAL_STEPS) * 100}%` },
            isDarkMode && styles.progressBarDark,
          ]}
        />
      </View>

      {/* Keyboard-Aware Dynamic Step Container */}
      <KeyboardAvoidingView
        style={styles.stepContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {currentStep === 1 && (
          <Step1Welcome
            isDarkMode={isDarkMode}
            onStartProtection={() => {
              console.log('[Step1] START PROTECTION -> going to Permissions (Step 2)');
              setCurrentStep(2);
            }}
          />
        )}
        {currentStep === 2 && (
          <Step3Permissions
            isDarkMode={isDarkMode}
            permissions={permissions}
            onTogglePermission={handleTogglePermission}
            onContinue={handleNext}
          />
        )}
        {currentStep === 3 && (
          <Step4Profile
            isDarkMode={isDarkMode}
            profile={profile}
            onChangeProfile={handleChangeProfile}
            onContinue={handleNext}
          />
        )}
        {currentStep === 4 && (
          <Step5Banking
            isDarkMode={isDarkMode}
            banks={banks}
            onAddBank={handleAddBank}
            onRemoveBank={handleRemoveBank}
            onContinue={handleNext}
          />
        )}
        {currentStep === 5 && (
          <Step6Contacts
            isDarkMode={isDarkMode}
            contacts={emergencyContacts}
            onAddContact={handleAddContact}
            onRemoveContact={handleRemoveContact}
            onContinue={handleNext}
          />
        )}
        {currentStep === 6 && (
          <Step7Preferences
            isDarkMode={isDarkMode}
            preferences={scamPreferences}
            onTogglePreference={handleTogglePreference}
            onChangeSensitivity={(sensitivity) =>
              setScamPreferences((prev) => ({ ...prev, sensitivity }))
            }
            onContinue={handleNext}
          />
        )}
        {currentStep === 7 && (
          <Step9StayInformed
            isDarkMode={isDarkMode}
            notifications={notificationPreferences}
            onToggleType={handleToggleNotificationType}
            onChangeFrequency={(frequency) =>
              setNotificationPreferences((prev) => ({ ...prev, frequency }))
            }
            onContinue={handleNext}
          />
        )}
        {currentStep === 8 && (
          <Step10AllSet
            isDarkMode={isDarkMode}
            onGetStarted={finishOnboarding}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeAreaDark: {
    backgroundColor: '#0F172A',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    zIndex: 10,
  },
  topHeaderDark: {
    backgroundColor: '#0F172A',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingRight: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  backTextDark: {
    color: '#F8FAFC',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  appNameDark: {
    color: '#F8FAFC',
  },
  headerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepCounterBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  stepCounterBadgeDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  stepCounterText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
  },
  stepCounterTextDark: {
    color: '#38BDF8',
  },
  // Prominent Dark/Light Mode Switch Toggle Button
  themeToggleSwitch: {
    padding: 2,
  },
  themeToggleSwitchDark: {},
  switchTrack: {
    width: 54,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#BAE6FD',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#0284C7',
  },
  switchTrackDark: {
    backgroundColor: '#334155',
    borderColor: '#38BDF8',
    alignItems: 'flex-end',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbDark: {
    backgroundColor: '#38BDF8',
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    width: '100%',
  },
  progressTrackDark: {
    backgroundColor: '#1E293B',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0284C7',
  },
  progressBarDark: {
    backgroundColor: '#38BDF8',
  },
  stepContainer: {
    flex: 1,
    width: '100%',
  },
});
