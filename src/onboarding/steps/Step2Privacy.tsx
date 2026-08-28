import React from 'react';
import { StyleSheet, Text, Pressable, View, ScrollView } from 'react-native';
import { Lock, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react-native';

interface Step2Props {
  onContinue: () => void;
}

export const Step2Privacy: React.FC<Step2Props> = ({ onContinue }) => {
  const privacyPoints = [
    'We never store your passwords',
    'All data stays on YOUR phone',
    'You control what\'s shared',
    'No recordings are saved',
  ];

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
    >
      <View style={styles.card}>
        <View style={styles.badge}>
          <Lock size={15} color="#15803D" />
          <Text style={styles.badgeText}>STEP 1: PRIVACY PROMISE</Text>
        </View>

        <View style={styles.headerRow}>
          <ShieldCheck size={32} color="#15803D" />
          <Text style={styles.title}>"Your Privacy is Our Priority"</Text>
        </View>

        <View style={styles.checklist}>
          {privacyPoints.map((point, index) => (
            <View key={index} style={styles.checkItem}>
              <CheckCircle2 size={22} color="#16A34A" style={styles.checkIcon} />
              <Text style={styles.checkText}>{point}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={onContinue}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
          hitSlop={12}
        >
          <Text style={styles.continueButtonText}>I UNDERSTAND - CONTINUE</Text>
          <ArrowRight size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    flex: 1,
  },
  checklist: {
    gap: 16,
    marginBottom: 28,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkIcon: {
    flexShrink: 0,
  },
  checkText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  continueButton: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 56,
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
