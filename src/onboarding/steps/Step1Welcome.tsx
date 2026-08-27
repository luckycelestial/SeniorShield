import React from 'react';
import { StyleSheet, Text, Pressable, View, ScrollView } from 'react-native';
import { Smartphone, Shield, ArrowRight } from 'lucide-react-native';

interface Step1Props {
  onStartProtection: () => void;
  isDarkMode?: boolean;
}

export const Step1Welcome: React.FC<Step1Props> = ({
  onStartProtection,
  isDarkMode = false,
}) => {
  return (
    <View style={[styles.screenWrapper, isDarkMode && styles.screenWrapperDark]}>
      <View style={[styles.cardFrame, isDarkMode && styles.cardFrameDark]}>
        <ScrollView
          style={styles.cardInnerScroll}
          contentContainerStyle={styles.cardInnerScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.badge, isDarkMode && styles.badgeDark]}>
            <Smartphone size={16} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
            <Text style={[styles.badgeText, isDarkMode && styles.badgeTextDark]}>
              WELCOME SCREEN
            </Text>
          </View>

          <View style={[styles.iconCircle, isDarkMode && styles.iconCircleDark]}>
            <Shield size={48} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
          </View>

          <Text style={[styles.title, isDarkMode && styles.titleDark]}>
            "Welcome to Your Digital Shield"
          </Text>
          <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
            "Protecting You from Scams, Simply & Safely"
          </Text>
        </ScrollView>

        <View style={[styles.cardFooter, isDarkMode && styles.cardFooterDark]}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={onStartProtection}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
            hitSlop={12}
          >
            <Text style={styles.primaryButtonText}>START PROTECTION</Text>
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
    padding: 20,
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0F2FE',
    overflow: 'hidden',
  },
  cardFrameDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  cardInnerScroll: {
    flex: 1,
    width: '100%',
  },
  cardInnerScrollContent: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 20,
  },
  badgeDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  badgeTextDark: {
    color: '#38BDF8',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconCircleDark: {
    backgroundColor: '#0F172A',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  titleDark: {
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  subtitleDark: {
    color: '#CBD5E1',
  },
  cardFooter: {
    width: '100%',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardFooterDark: {
    borderTopColor: '#334155',
  },
  primaryButton: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 52,
    borderRadius: 9999,
    width: '100%',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
