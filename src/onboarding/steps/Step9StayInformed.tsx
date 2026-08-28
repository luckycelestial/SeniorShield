import React from 'react';
import { StyleSheet, Text, Pressable, View, ScrollView } from 'react-native';
import {
  Megaphone,
  Square,
  ArrowRight,
  Check,
} from 'lucide-react-native';
import { NotificationPreferences } from '../types';

interface Step9Props {
  notifications: NotificationPreferences;
  onToggleType: (key: keyof Omit<NotificationPreferences, 'frequency'>) => void;
  onChangeFrequency: (freq: 'Daily' | 'Weekly' | 'Only Important') => void;
  onContinue: () => void;
  isDarkMode?: boolean;
}

export const Step9StayInformed: React.FC<Step9Props> = ({
  notifications,
  onToggleType,
  onChangeFrequency,
  onContinue,
  isDarkMode = false,
}) => {
  const options = [
    {
      key: 'scamAlerts' as const,
      label: 'Scam Alerts & Warnings',
    },
    {
      key: 'safetyTips' as const,
      label: 'Safety Tips & Awareness',
    },
    {
      key: 'securityUpdates' as const,
      label: 'Important Security Updates',
    },
  ];

  return (
    <View style={[styles.screenWrapper, isDarkMode && styles.screenWrapperDark]}>
      {/* Big Fixed Outer Card Frame */}
      <View style={[styles.cardFrame, isDarkMode && styles.cardFrameDark]}>
        {/* Anchored Card Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.badge, isDarkMode && styles.badgeDark]}>
            <Megaphone size={14} color={isDarkMode ? '#38BDF8' : '#0369A1'} />
            <Text style={[styles.badgeText, isDarkMode && styles.badgeTextDark]}>
              STEP 7: STAY INFORMED
            </Text>
          </View>

          <View style={styles.headerRow}>
            <Megaphone size={24} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
            <Text style={[styles.title, isDarkMode && styles.titleDark]}>
              Get Timely Updates & Awareness
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
            Would you like to receive?
          </Text>

          <View style={styles.checkboxList}>
            {options.map((opt) => {
              const isChecked = notifications[opt.key];
              return (
                <Pressable
                  key={opt.key}
                  style={[styles.checkRow, isDarkMode && styles.checkRowDark, isChecked && (isDarkMode ? styles.checkRowCheckedDark : styles.checkRowChecked)]}
                  onPress={() => onToggleType(opt.key)}
                  hitSlop={6}
                >
                  <View style={[styles.box, isChecked && styles.boxChecked]}>
                    {isChecked ? (
                      <Check size={12} color="#FFFFFF" />
                    ) : (
                      <Square size={14} color="#94A3B8" />
                    )}
                  </View>
                  <Text style={[styles.checkLabel, isDarkMode && styles.checkLabelDark, isChecked && (isDarkMode ? styles.checkLabelCheckedDark : styles.checkLabelChecked)]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.freqBox, isDarkMode && styles.freqBoxDark]}>
            <Text style={[styles.freqLabel, isDarkMode && styles.freqLabelDark]}>Frequency:</Text>
            <View style={styles.radiosRow}>
              {(['Daily', 'Weekly', 'Only Important'] as const).map((freq) => {
                const isSelected = notifications.frequency === freq;
                return (
                  <Pressable
                    key={freq}
                    style={[styles.radioItem, isSelected && styles.radioItemSelected]}
                    onPress={() => onChangeFrequency(freq)}
                    hitSlop={6}
                  >
                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <Text style={[styles.radioText, isDarkMode && styles.radioTextDark, isSelected && styles.radioTextSelected]}>
                      {freq}
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
            onPress={onContinue}
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
    marginBottom: 10,
  },
  sectionHeaderDark: {
    color: '#CBD5E1',
  },
  checkboxList: {
    gap: 8,
    marginBottom: 16,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  checkRowDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  checkRowChecked: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
  },
  checkRowCheckedDark: {
    backgroundColor: '#0F2942',
    borderColor: '#0284C7',
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  checkLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  checkLabelDark: {
    color: '#CBD5E1',
  },
  checkLabelChecked: {
    color: '#0369A1',
    fontWeight: '800',
  },
  checkLabelCheckedDark: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  freqBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 6,
  },
  freqBoxDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  freqLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  freqLabelDark: {
    color: '#F8FAFC',
  },
  radiosRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
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
    borderColor: '#0284C7',
  },
  radioInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284C7',
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
    color: '#0369A1',
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
