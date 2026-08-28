import React from 'react';
import { StyleSheet, Text, Pressable, View, ScrollView } from 'react-native';
import {
  PhoneCall,
  Brain,
  AlertTriangle,
  Bell,
  ShieldCheck,
  ArrowRight,
  BookOpen,
} from 'lucide-react-native';

interface Step8Props {
  onContinue: () => void;
}

export const Step8HowItWorks: React.FC<Step8Props> = ({ onContinue }) => {
  const steps = [
    {
      stepNum: 1,
      icon: PhoneCall,
      title: '1. We Monitor',
      desc: 'We check calls, messages & links in real-time',
      color: '#0284C7',
      bgColor: '#E0F2FE',
    },
    {
      stepNum: 2,
      icon: Brain,
      title: '2. We Analyze',
      desc: 'Our AI detects patterns and red flags',
      color: '#7E22CE',
      bgColor: '#F3E8FF',
    },
    {
      stepNum: 3,
      icon: AlertTriangle,
      title: '3. We Alert',
      desc: 'We warn you instantly if something looks risky',
      color: '#DC2626',
      bgColor: '#FEE2E2',
    },
    {
      stepNum: 4,
      icon: Bell,
      title: '4. You Decide',
      desc: 'You stay in control. We guide, you decide.',
      color: '#D97706',
      bgColor: '#FEF3C7',
    },
    {
      stepNum: 5,
      icon: ShieldCheck,
      title: '5. You\'re Safe',
      desc: 'We help keep you and your loved ones protected',
      color: '#16A34A',
      bgColor: '#DCFCE7',
    },
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
          <BookOpen size={14} color="#0369A1" />
          <Text style={styles.badgeText}>STEP 7: HOW IT WORKS</Text>
        </View>

        <View style={styles.headerRow}>
          <BookOpen size={26} color="#0369A1" />
          <Text style={styles.title}>A Quick Guide</Text>
        </View>

        <View style={styles.chainList}>
          {steps.map((item) => {
            const IconComponent = item.icon;
            return (
              <View key={item.stepNum} style={styles.chainRow}>
                <View style={[styles.iconCircle, { backgroundColor: item.bgColor }]}>
                  <IconComponent size={22} color={item.color} />
                </View>

                <View style={styles.textColumn}>
                  <Text style={[styles.stepTitle, { color: item.color }]}>
                    {item.title}
                  </Text>
                  <Text style={styles.stepDesc}>{item.desc}</Text>
                </View>
              </View>
            );
          })}
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
          <Text style={styles.continueButtonText}>CONTINUE</Text>
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
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E0F2FE',
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
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
    letterSpacing: 0.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  chainList: {
    gap: 14,
    marginBottom: 24,
  },
  chainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    lineHeight: 16,
  },
  continueButton: {
    backgroundColor: '#0284C7',
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
