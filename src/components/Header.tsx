import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ShieldCheck, ShieldAlert, PhoneCall, SlidersHorizontal } from 'lucide-react-native';
import { ThreatLevel } from '../types/scam';

interface HeaderProps {
  threatLevel: ThreatLevel;
  onCallHelpline: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  threatLevel,
  onCallHelpline,
  onOpenSettings,
}) => {
  const isCritical = threatLevel === 'CRITICAL';
  const isSuspicious = threatLevel === 'SUSPICIOUS';

  const statusBgColor = isCritical
    ? 'rgba(76, 5, 25, 0.45)'
    : isSuspicious
    ? 'rgba(69, 36, 6, 0.45)'
    : 'rgba(6, 78, 59, 0.45)';

  const statusBorderColor = isCritical
    ? 'rgba(244, 63, 94, 0.5)'
    : isSuspicious
    ? 'rgba(245, 158, 11, 0.5)'
    : 'rgba(16, 185, 129, 0.5)';

  const statusTextColor = isCritical
    ? '#FECDD3'
    : isSuspicious
    ? '#FEF3C7'
    : '#D1FAE5';

  const dotColor = isCritical ? '#F43F5E' : isSuspicious ? '#F59E0B' : '#10B981';

  return (
    <View style={styles.container}>
      {/* Top Brand Bar */}
      <View style={styles.topRow}>
        <View style={styles.brandGroup}>
          <View
            style={[
              styles.shieldIconContainer,
              {
                backgroundColor: isCritical
                  ? 'rgba(136, 19, 55, 0.4)'
                  : isSuspicious
                  ? 'rgba(120, 53, 15, 0.4)'
                  : 'rgba(6, 78, 59, 0.4)',
                borderColor: statusBorderColor,
              },
            ]}
          >
            {isCritical ? (
              <ShieldAlert size={28} color="#F43F5E" />
            ) : (
              <ShieldCheck size={28} color="#10B981" />
            )}
          </View>

          <View>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.appTitle}>SeniorShield</Text>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>AI 2.5</Text>
              </View>
            </View>
            <Text style={styles.appSubtitle}>Autonomous Scam Defense</Text>
          </View>
        </View>

        {/* Settings Pill */}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={onOpenSettings}
          activeOpacity={0.8}
          accessibilityLabel="Setup & Guardian Config"
        >
          <SlidersHorizontal size={16} color="#38BDF8" />
          <Text style={styles.settingsText}>Setup</Text>
        </TouchableOpacity>
      </View>

      {/* Luminous Protection Status Pill */}
      <View
        style={[
          styles.statusPill,
          { backgroundColor: statusBgColor, borderColor: statusBorderColor },
        ]}
      >
        <View style={styles.statusLeft}>
          <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
          <Text style={[styles.statusText, { color: statusTextColor }]}>
            {isCritical
              ? 'DANGER DETECTED'
              : isSuspicious
              ? 'CAUTION ADVISED'
              : 'SHIELD ACTIVE & MONITORING'}
          </Text>
        </View>
        <Text style={styles.statusRightText}>Live Guard</Text>
      </View>

      {/* Direct Cyber Helpline (1930) Bar */}
      <TouchableOpacity
        style={styles.helplineButton}
        onPress={onCallHelpline}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Call Cyber Crime Helpline 1930"
      >
        <PhoneCall size={20} color="#FFFFFF" />
        <Text style={styles.helplineText}>
          Emergency Cyber Helpline (1930)
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#030712',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shieldIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  aiBadge: {
    backgroundColor: 'rgba(49, 46, 129, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A5B4FC',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  settingsButton: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  settingsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusRightText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  helplineButton: {
    backgroundColor: '#E11D48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.4)',
    elevation: 4,
  },
  helplineText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
