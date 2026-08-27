import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PhoneCall, SlidersHorizontal } from 'lucide-react-native';
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
  return (
    <View style={styles.container}>
      {/* Top Brand Bar */}
      <View style={styles.topRow}>
        <View style={styles.brandGroup}>
          <View style={styles.titleBadgeRow}>
            <Text style={styles.appTitle}>SeniorShield</Text>
            {/* Solid AI 3.5 Badge */}
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI 3.5</Text>
            </View>
          </View>
          <Text style={styles.appSubtitle}>Autonomous Scam Defense</Text>
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

      {/* Emergency Cyber Helpline (1930) Solid Capsule Button */}
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
    justifyContent: 'center',
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1F1F1F',
    letterSpacing: -0.5,
  },
  aiBadge: {
    backgroundColor: '#1F1F1F',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 2,
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
  helplineButton: {
    backgroundColor: '#FF383C',
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
