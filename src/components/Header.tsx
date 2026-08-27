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

  // Strict semantic colors: Green = Safe, Yellow = Warning, Red = Emergency
  const statusBgColor = isCritical
    ? '#FEF2F2'
    : isSuspicious
    ? '#FFFBEB'
    : '#ECFDF5';

  const statusBorderColor = isCritical
    ? '#FECACA'
    : isSuspicious
    ? '#FDE68A'
    : '#A7F3D0';

  const statusTextColor = isCritical
    ? '#DC2626'
    : isSuspicious
    ? '#D97706'
    : '#059669';

  const dotColor = isCritical ? '#FF383C' : isSuspicious ? '#F59E0B' : '#10B981';

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
                  ? '#FEF2F2'
                  : isSuspicious
                  ? '#FFFBEB'
                  : '#ECFDF5',
                borderColor: statusBorderColor,
              },
            ]}
          >
            {isCritical ? (
              <ShieldAlert size={26} color="#FF383C" />
            ) : (
              <ShieldCheck size={26} color="#10B981" />
            )}
          </View>

          <View>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.appTitle}>SeniorShield</Text>
              {/* Neutral AI Badge */}
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
          <SlidersHorizontal size={15} color="#1F1F1F" />
          <Text style={styles.settingsText}>Setup</Text>
        </TouchableOpacity>
      </View>

      {/* Semantic Protection Status Pill */}
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

      {/* Emergency Cyber Helpline (1930) Capsule Button — RED ONLY FOR EMERGENCY */}
      <TouchableOpacity
        style={styles.helplineButton}
        onPress={onCallHelpline}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel="Call Cyber Crime Helpline 1930"
      >
        <PhoneCall size={18} color="#FFFFFF" />
        <Text style={styles.helplineText}>
          Emergency Cyber Helpline (1930)
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FCFCFC',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
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
    width: 44,
    height: 44,
    borderRadius: 14,
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
    fontSize: 21,
    fontWeight: '900',
    color: '#1F1F1F',
    letterSpacing: -0.5,
  },
  aiBadge: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 1,
  },
  settingsButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  settingsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: 1,
    marginBottom: 10,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusRightText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
  },
  helplineButton: {
    backgroundColor: '#FF383C', // Strictly for Emergency
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 9999,
    shadowColor: '#FF383C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  helplineText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
