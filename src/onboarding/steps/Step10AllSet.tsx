import React from 'react';
import { StyleSheet, Text, Pressable, View, ScrollView } from 'react-native';
import { CheckCircle2, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react-native';

interface Step10Props {
  onGetStarted: () => void;
  isDarkMode?: boolean;
}

export const Step10AllSet: React.FC<Step10Props> = ({ onGetStarted, isDarkMode = false }) => {
  return (
    <View style={[styles.screenWrapper, isDarkMode && styles.screenWrapperDark]}>
      <View style={[styles.cardFrame, isDarkMode && styles.cardFrameDark]}>
        <ScrollView
          style={styles.cardInnerScroll}
          contentContainerStyle={styles.cardInnerScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.badge, isDarkMode && styles.badgeDark]}>
            <Sparkles size={14} color={isDarkMode ? '#4ADE80' : '#15803D'} />
            <Text style={[styles.badgeText, isDarkMode && styles.badgeTextDark]}>
              STEP 8: YOU'RE ALL SET!
            </Text>
          </View>

          <View style={styles.headerRow}>
            <HeartHandshake size={28} color={isDarkMode ? '#4ADE80' : '#15803D'} />
            <Text style={[styles.title, isDarkMode && styles.titleDark]}>Let's Keep You Safe</Text>
          </View>

          <View style={[styles.completeCard, isDarkMode && styles.completeCardDark]}>
            <View style={styles.checkCircleBig}>
              <CheckCircle2 size={56} color={isDarkMode ? '#4ADE80' : '#16A34A'} />
            </View>

            <Text style={[styles.completeTitle, isDarkMode && styles.completeTitleDark]}>Setup Complete!</Text>
            <Text style={[styles.completeSubtitle, isDarkMode && styles.completeSubtitleDark]}>
              Your Digital Shield is now active.{'\n'}We're always here to protect you.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.cardFooter, isDarkMode && styles.cardFooterDark]}>
          <Pressable
            style={({ pressed }) => [
              styles.getStartedBtn,
              pressed && styles.buttonPressed,
            ]}
            onPress={onGetStarted}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
            hitSlop={12}
          >
            <Text style={styles.getStartedText}>GET STARTED</Text>
            <ShieldCheck size={20} color="#FFFFFF" />
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
    borderColor: '#DCFCE7',
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
  badgeDark: {
    backgroundColor: '#064E3B',
    borderColor: '#047857',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  badgeTextDark: {
    color: '#4ADE80',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  titleDark: {
    color: '#F8FAFC',
  },
  completeCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    marginBottom: 10,
  },
  completeCardDark: {
    backgroundColor: '#064E3B',
    borderColor: '#047857',
  },
  checkCircleBig: {
    marginBottom: 12,
  },
  completeTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#15803D',
    marginBottom: 6,
  },
  completeTitleDark: {
    color: '#4ADE80',
  },
  completeSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    textAlign: 'center',
    lineHeight: 20,
  },
  completeSubtitleDark: {
    color: '#DCFCE7',
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
  getStartedBtn: {
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
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
