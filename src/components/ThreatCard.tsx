import React from 'react';
import {
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertTriangle,
  CheckCircle,
  AlertOctagon,
  Shield,
  BellRing,
  Ban,
} from 'lucide-react-native';
import { ScamReport } from '../types/scam';

interface ThreatCardProps {
  report: ScamReport | null;
  guardianPhone: string;
  onBlockNumber?: () => void;
}

export const ThreatCard: React.FC<ThreatCardProps> = ({
  report,
  guardianPhone,
  onBlockNumber,
}) => {
  if (!report) {
    return (
      <View style={[styles.card, styles.neutralCard]}>
        <Shield size={42} color="#94A3B8" />
        <Text style={styles.neutralTitle}>Ready to Scan</Text>
        <Text style={styles.neutralBody}>
          Tap "Scan Device & Protect" below or launch a simulation scenario to analyze recent communications.
        </Text>
      </View>
    );
  }

  const isCritical = report.threat_level === 'CRITICAL';
  const isSuspicious = report.threat_level === 'SUSPICIOUS';
  const isSafe = report.threat_level === 'SAFE';

  const badgeColor = isCritical ? '#DC2626' : isSuspicious ? '#D97706' : '#16A34A';
  const cardBorderColor = isCritical ? '#EF4444' : isSuspicious ? '#F59E0B' : '#22C55E';
  const cardBgColor = isCritical ? '#2B0E11' : isSuspicious ? '#261B0B' : '#0B2416';

  const handleAlertGuardian = () => {
    const alertMessage =
      report.guardian_alert_message ||
      `SeniorShield Alert: We detected a potential scam attempt (${report.scam_type}). Please check on your family member.`;
    const targetUrl = `sms:${guardianPhone}?body=${encodeURIComponent(alertMessage)}`;
    Linking.openURL(targetUrl).catch(() => {
      Alert.alert(
        'Guardian SMS Alert',
        `Message for Guardian (${guardianPhone}):\n\n${alertMessage}`
      );
    });
  };

  const handleBlockNumber = () => {
    if (onBlockNumber) {
      onBlockNumber();
    }
    Alert.alert(
      'Action Completed',
      'Sender number has been added to the local blocklist and suspicious link access has been restricted.'
    );
  };

  return (
    <View style={[styles.card, { borderColor: cardBorderColor, backgroundColor: cardBgColor }]}>
      {/* Header Threat Level Badge */}
      <View style={styles.badgeRow}>
        <View style={[styles.threatBadge, { backgroundColor: badgeColor }]}>
          {isCritical && <AlertOctagon size={24} color="#FFFFFF" />}
          {isSuspicious && <AlertTriangle size={24} color="#FFFFFF" />}
          {isSafe && <CheckCircle size={24} color="#FFFFFF" />}
          <Text style={styles.threatBadgeText}>{report.threat_level} THREAT</Text>
        </View>
        <Text style={styles.confidenceText}>{report.confidence_score}% Confidence</Text>
      </View>

      {/* Scam Category Title */}
      <Text style={styles.scamTypeTitle}>{report.scam_type}</Text>

      {/* Impersonated Entity Banner */}
      {report.impersonated_entity && report.impersonated_entity !== 'None' && (
        <View style={styles.impersonationBanner}>
          <Text style={styles.impersonationLabel}>Impersonating:</Text>
          <Text style={styles.impersonationValue}>{report.impersonated_entity}</Text>
        </View>
      )}

      {/* Senior Plain Language Explanation */}
      <View style={styles.explanationBox}>
        <Text style={styles.sectionHeader}>WHAT THIS MEANS FOR YOU:</Text>
        <Text style={styles.seniorExplanationText}>{report.senior_explanation}</Text>
      </View>

      {/* Action Required Banner */}
      <View style={[styles.actionBox, { borderColor: badgeColor }]}>
        <Text style={[styles.actionHeader, { color: badgeColor }]}>⚡ WHAT YOU MUST DO NOW:</Text>
        <Text style={styles.actionBodyText}>{report.action_required}</Text>
      </View>

      {/* Assets at Risk */}
      {report.assets_at_risk && report.assets_at_risk.length > 0 && (
        <View style={styles.assetsContainer}>
          <Text style={styles.assetsTitle}>Targeted Assets:</Text>
          <View style={styles.assetChipContainer}>
            {report.assets_at_risk.map((asset, idx) => (
              <View key={idx} style={styles.assetChip}>
                <Text style={styles.assetChipText}>⚠️ {asset}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* High Visibility Action Buttons */}
      {(isCritical || isSuspicious) && (
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.actionButton, styles.blockButton]}
            onPress={handleBlockNumber}
            activeOpacity={0.8}
          >
            <Ban size={22} color="#FFFFFF" />
            <Text style={styles.buttonText}>Hang Up & Block</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.guardianButton]}
            onPress={handleAlertGuardian}
            activeOpacity={0.8}
          >
            <BellRing size={22} color="#FFFFFF" />
            <Text style={styles.buttonText}>Alert Family Guardian</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 2.5,
    padding: 18,
    marginVertical: 10,
  },
  neutralCard: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    alignItems: 'center',
    paddingVertical: 32,
  },
  neutralTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 12,
  },
  neutralBody: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
    paddingHorizontal: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  threatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 24,
  },
  threatBadgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  confidenceText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '700',
  },
  scamTypeTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 10,
    lineHeight: 30,
  },
  impersonationBanner: {
    backgroundColor: '#00000060',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  impersonationLabel: {
    color: '#FCA5A5',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 6,
  },
  impersonationValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  explanationBox: {
    backgroundColor: '#00000070',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '900',
    color: '#93C5FD',
    letterSpacing: 1,
    marginBottom: 6,
  },
  seniorExplanationText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 28,
  },
  actionBox: {
    backgroundColor: '#00000085',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 6,
    marginBottom: 14,
  },
  actionHeader: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  actionBodyText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 28,
  },
  assetsContainer: {
    marginBottom: 16,
  },
  assetsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  assetChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  assetChip: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  assetChipText: {
    color: '#FEF08A',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonGroup: {
    gap: 12,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  blockButton: {
    backgroundColor: '#DC2626',
  },
  guardianButton: {
    backgroundColor: '#2563EB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
  },
});
