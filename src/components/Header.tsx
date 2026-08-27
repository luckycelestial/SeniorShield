import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ShieldCheck, ShieldAlert, PhoneCall } from 'lucide-react-native';
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

  const statusColor = isCritical ? '#DC2626' : isSuspicious ? '#D97706' : '#16A34A';
  const statusLabel = isCritical
    ? 'DANGER DETECTED'
    : isSuspicious
    ? 'CAUTION ADVISED'
    : 'SHIELD ACTIVE';

  return (
    <View style={styles.container}>
      {/* Top Brand & Status Row */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          {isCritical ? (
            <ShieldAlert size={36} color="#DC2626" />
          ) : (
            <ShieldCheck size={36} color="#16A34A" />
          )}
          <View style={styles.titleContainer}>
            <Text style={styles.appTitle}>SeniorShield</Text>
            <Text style={styles.appSubtitle}>Autonomous Elder Protection</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={onOpenSettings}
          accessibilityLabel="Settings and Guardian Config"
        >
          <Text style={styles.settingsButtonText}>⚙️ Setup</Text>
        </TouchableOpacity>
      </View>

      {/* Live Protection Status Bar */}
      <View style={[styles.statusBar, { borderColor: statusColor, backgroundColor: isCritical ? '#450A0A' : '#0F172A' }]}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: isCritical ? '#FECACA' : '#E2E8F0' }]}>
          {statusLabel}
        </Text>
        <Text style={styles.defenseModeText}>• Real-Time AI Monitor</Text>
      </View>

      {/* Emergency Cyber Helpline 1930 Direct Button */}
      <TouchableOpacity
        style={styles.helplineButton}
        onPress={onCallHelpline}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Call Cyber Crime Helpline 1930"
      >
        <PhoneCall size={24} color="#FFFFFF" />
        <Text style={styles.helplineButtonText}>Cyber Helpline (1930)</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#090D16',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#1E293B',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleContainer: {
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  settingsButtonText: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '700',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  defenseModeText: {
    fontSize: 13,
    color: '#94A3B8',
    marginLeft: 6,
    fontWeight: '500',
  },
  helplineButton: {
    backgroundColor: '#991B1B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  helplineButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
