import React from 'react';
import { StyleSheet, Text, Pressable, View, ScrollView, Alert } from 'react-native';
import {
  Phone,
  MessageSquare,
  Mic,
  Bell,
  Check,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import { PermissionState } from '../types';

interface Step3Props {
  permissions: PermissionState;
  onTogglePermission: (key: keyof PermissionState) => void;
  onContinue: () => void;
  isDarkMode?: boolean;
}

export const Step3Permissions: React.FC<Step3Props> = ({
  permissions,
  onTogglePermission,
  onContinue,
  isDarkMode = false,
}) => {
  const items = [
    {
      key: 'phone' as keyof PermissionState,
      icon: Phone,
      name: 'PHONE ACCESS',
      desc: '"To screen calls and detect impersonation"',
    },
    {
      key: 'sms' as keyof PermissionState,
      icon: MessageSquare,
      name: 'SMS ACCESS',
      desc: '"To scan for scam messages and OTP theft"',
    },
    {
      key: 'mic' as keyof PermissionState,
      icon: Mic,
      name: 'MICROPHONE ACCESS',
      desc: '"To analyze voices during calls (no recordings stored)"',
    },
    {
      key: 'notifications' as keyof PermissionState,
      icon: Bell,
      name: 'NOTIFICATIONS',
      desc: '"To send you scam alerts"',
    },
  ];

  const handleContinueClick = () => {
    const unallowed = items.filter((item) => !permissions[item.key]);
    if (unallowed.length > 0) {
      Alert.alert(
        'Permissions Required',
        `Please allow all access permissions to enable complete scam protection. Missing: ${unallowed
          .map((i) => i.name)
          .join(', ')}.`
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
            <ShieldCheck size={14} color={isDarkMode ? '#38BDF8' : '#0369A1'} />
            <Text style={[styles.badgeText, isDarkMode && styles.badgeTextDark]}>
              STEP 2: PERMISSIONS (Explained)
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
          <View style={styles.itemsList}>
            {items.map((item) => {
              const IconComponent = item.icon;
              const isAllowed = permissions[item.key];

              return (
                <View key={item.key} style={[styles.itemRow, isDarkMode && styles.itemRowDark]}>
                  <View style={styles.itemLeft}>
                    <View style={[styles.iconBox, isDarkMode && styles.iconBoxDark, isAllowed && (isDarkMode ? styles.iconBoxActiveDark : styles.iconBoxActive)]}>
                      <IconComponent size={20} color={isAllowed ? (isDarkMode ? '#38BDF8' : '#0284C7') : (isDarkMode ? '#64748B' : '#64748B')} />
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={[styles.itemName, isDarkMode && styles.itemNameDark]}>{item.name}</Text>
                      <Text style={[styles.itemDesc, isDarkMode && styles.itemDescDark]}>{item.desc}</Text>
                    </View>
                  </View>

                  <View style={styles.actionCol}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.allowBtn,
                        isAllowed && styles.allowBtnActive,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={() => onTogglePermission(item.key)}
                      hitSlop={8}
                    >
                      {isAllowed ? (
                        <View style={styles.allowedState}>
                          <Check size={14} color="#FFFFFF" />
                          <Text style={styles.allowedText}>ALLOWED</Text>
                        </View>
                      ) : (
                        <Text style={styles.allowText}>ALLOW</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              );
            })}
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
  cardInnerScroll: {
    flex: 1,
    width: '100%',
  },
  cardInnerScrollContent: {
    flexGrow: 1,
    paddingVertical: 8,
    paddingBottom: 120,
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemRowDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 6,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxDark: {
    backgroundColor: '#1E293B',
  },
  iconBoxActive: {
    backgroundColor: '#E0F2FE',
  },
  iconBoxActiveDark: {
    backgroundColor: '#0F172A',
  },
  textContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2,
  },
  itemNameDark: {
    color: '#F8FAFC',
  },
  itemDesc: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 15,
  },
  itemDescDark: {
    color: '#94A3B8',
  },
  actionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  allowBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  allowBtnActive: {
    backgroundColor: '#16A34A',
  },
  allowText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  allowedState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  allowedText: {
    color: '#FFFFFF',
    fontSize: 11,
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
