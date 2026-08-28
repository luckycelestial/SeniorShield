import React from 'react';
import { StyleSheet, Text, Pressable, View, ScrollView, Alert } from 'react-native';
import {
  PhoneCall,
  MessageSquare,
  Shield,
  CreditCard,
  UserCheck,
  FileText,
  Square,
  ArrowRight,
  Sliders,
  Check,
} from 'lucide-react-native';
import { ScamPreferences } from '../types';

interface Step7Props {
  preferences: ScamPreferences;
  onTogglePreference: (key: keyof Omit<ScamPreferences, 'sensitivity'>) => void;
  onChangeSensitivity: (sensitivity: 'Low' | 'Medium' | 'High') => void;
  onContinue: () => void;
  isDarkMode?: boolean;
}

export const Step7Preferences: React.FC<Step7Props> = ({
  preferences,
  onTogglePreference,
  onChangeSensitivity,
  onContinue,
  isDarkMode = false,
}) => {
  const items = [
    {
      key: 'suspiciousCalls' as const,
      icon: PhoneCall,
      label: 'Suspicious Calls',
    },
    {
      key: 'scamMessages' as const,
      icon: MessageSquare,
      label: 'Scam Messages',
    },
    {
      key: 'fraudLinks' as const,
      icon: Shield,
      label: 'Fraud Links',
    },
    {
      key: 'bankingFraud' as const,
      icon: CreditCard,
      label: 'Banking Fraud',
    },
    {
      key: 'impersonationCalls' as const,
      icon: UserCheck,
      label: 'Impersonation Calls',
    },
    {
      key: 'fakeDocuments' as const,
      icon: FileText,
      label: 'Fake Documents',
    },
  ];

  const handleContinueClick = () => {
    const hasAnySelected = items.some((item) => preferences[item.key]);
    if (!hasAnySelected) {
      Alert.alert(
        'Selection Required',
        'Please select at least one threat type you would like us to monitor.'
      );
      return;
    }
    onContinue();
  };

  return (
    <View style={[styles.screenWrapper, isDarkMode && styles.screenWrapperDark]}>
      {/* Big Fixed Outer Card Frame */}
      <View style={[styles.cardFrame, isDarkMode && styles.cardFrameDark]}>
        {/* Anchored Card Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.badge, isDarkMode && styles.badgeDark]}>
            <Sliders size={14} color={isDarkMode ? '#38BDF8' : '#0369A1'} />
            <Text style={[styles.badgeText, isDarkMode && styles.badgeTextDark]}>
              STEP 6: SCAM DETECTION PREFERENCES
            </Text>
          </View>

          <View style={styles.headerRow}>
            <Sliders size={24} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
            <Text style={[styles.title, isDarkMode && styles.titleDark]}>
              Help Us Protect You Better
            </Text>
          </View>
        </View>

        {/* Scrollable Content Inside the Big Card */}
        <ScrollView
          style={styles.cardInnerScroll}
          contentContainerStyle={styles.cardInnerScrollContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="always"
        >
          <Text style={[styles.sectionHeader, isDarkMode && styles.sectionHeaderDark]}>
            What would you like us to monitor? *
          </Text>

          <View style={styles.grid}>
            {items.map((item) => {
              const IconComponent = item.icon;
              const isChecked = preferences[item.key];

              return (
                <Pressable
                  key={item.key}
                  style={[styles.gridCard, isDarkMode && styles.gridCardDark, isChecked && (isDarkMode ? styles.gridCardCheckedDark : styles.gridCardChecked)]}
                  onPress={() => onTogglePreference(item.key)}
                  hitSlop={6}
                >
                  <IconComponent size={22} color={isChecked ? (isDarkMode ? '#4ADE80' : '#16A34A') : (isDarkMode ? '#64748B' : '#64748B')} />
                  <Text style={[styles.gridLabel, isDarkMode && styles.gridLabelDark, isChecked && (isDarkMode ? styles.gridLabelCheckedDark : styles.gridLabelChecked)]}>
                    {item.label}
                  </Text>
                  <View style={styles.checkPos}>
                    {isChecked ? (
                      <View style={styles.checkedBox}>
                        <Check size={11} color="#FFFFFF" />
                      </View>
                    ) : (
                      <Square size={14} color="#94A3B8" />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Sensitivity Selector */}
          <View style={[styles.sensBox, isDarkMode && styles.sensBoxDark]}>
            <Text style={[styles.sensLabel, isDarkMode && styles.sensLabelDark]}>
              Alert Sensitivity:
            </Text>
            <View style={styles.radiosRow}>
              {(['Low', 'Medium', 'High'] as const).map((level) => {
                const isSelected = preferences.sensitivity === level;
                return (
                  <Pressable
                    key={level}
                    style={[styles.radioItem, isSelected && styles.radioItemSelected]}
                    onPress={() => onChangeSensitivity(level)}
                    hitSlop={6}
                  >
                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <Text style={[styles.radioText, isDarkMode && styles.radioTextDark, isSelected && styles.radioTextSelected]}>
                      {level}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Anchored Card Footer Action Button */}
        <View style={[styles.cardFooter, isDarkMode && styles.cardFooterDark]}>
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleContinueClick}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
            hitSlop={12}
          >
            <Text style={styles.continueButtonText}>CONTINUE</Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  screenWrapperDark: {
    backgroundColor: '#0F172A',
  },
  cardFrame: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    width: '100%',
    maxWidth: 480,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    overflow: 'hidden',
  },
  cardFrameDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  cardHeader: {
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 12,
  },
  badgeDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
    letterSpacing: 0.5,
  },
  badgeTextDark: {
    color: '#38BDF8',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    flex: 1,
  },
  titleDark: {
    color: '#F8FAFC',
  },
  cardInnerScroll: {
    flex: 1,
    width: '100%',
  },
  cardInnerScrollContent: {
    flexGrow: 1,
    paddingVertical: 8,
    paddingBottom: 120,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 12,
  },
  sectionHeaderDark: {
    color: '#CBD5E1',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88,
    position: 'relative',
    gap: 6,
  },
  gridCardDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  gridCardChecked: {
    backgroundColor: '#F0FDF4',
    borderColor: '#16A34A',
  },
  gridCardCheckedDark: {
    backgroundColor: '#064E3B',
    borderColor: '#16A34A',
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
  gridLabelDark: {
    color: '#CBD5E1',
  },
  gridLabelChecked: {
    color: '#15803D',
    fontWeight: '800',
  },
  gridLabelCheckedDark: {
    color: '#4ADE80',
    fontWeight: '800',
  },
  checkPos: {
    position: 'absolute',
    bottom: 6,
    right: 6,
  },
  checkedBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sensBoxDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  sensLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  sensLabelDark: {
    color: '#F8FAFC',
  },
  radiosRow: {
    flexDirection: 'row',
    gap: 10,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  radioItemSelected: {},
  radioOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#16A34A',
  },
  radioInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  radioText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  radioTextDark: {
    color: '#94A3B8',
  },
  radioTextSelected: {
    color: '#15803D',
    fontWeight: '800',
  },
  cardFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardFooterDark: {
    borderTopColor: '#334155',
  },
  continueButton: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 50,
    borderRadius: 9999,
    width: '100%',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
