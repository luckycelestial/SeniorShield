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
  Building2,
  Lock,
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
      <View style={styles.emptyCard}>
        <View style={styles.emptyIconCircle}>
          <Shield size={34} color="#94A3B8" />
        </View>
        <Text style={styles.emptyTitle}>Ready to Scan</Text>
        <Text style={styles.emptySubtitle}>
          Tap "Scan Device & Protect" below or launch a simulation from the Demo Hub to analyze recent calls and messages.
        </Text>
      </View>
    );
  }

  const isCritical = report.threat_level === 'CRITICAL';
  const isSuspicious = report.threat_level === 'SUSPICIOUS';
  const isSafe = report.threat_level === 'SAFE';

  const cardBgColor = isCritical
    ? 'rgba(76, 5, 25, 0.35)'
    : isSuspicious
    ? 'rgba(69, 36, 6, 0.35)'
    : 'rgba(6, 78, 59, 0.35)';

  const cardBorderColor = isCritical
    ? 'rgba(244, 63, 94, 0.5)'
    : isSuspicious
    ? 'rgba(245, 158, 11, 0.5)'
    : 'rgba(16, 185, 129, 0.5)';

  const badgeBg = isCritical
    ? 'rgba(244, 63, 94, 0.2)'
    : isSuspicious
    ? 'rgba(245, 158, 11, 0.2)'
    : 'rgba(16, 185, 129, 0.2)';

  const badgeTextColor = isCritical
    ? '#FDA4AF'
    : isSuspicious
    ? '#FDE68A'
    : '#A7F3D0';

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
      'Security Action Completed',
      'The sender number has been added to your local blocklist and suspicious link access has been restricted.'
    );
  };

  return (
    <View
      style={[
        styles.cardContainer,
        { backgroundColor: cardBgColor, borderColor: cardBorderColor },
      ]}
    >
      {/* Top Header: Badge & Confidence */}
      <View style={styles.headerRow}>
        <View
          style={[
            styles.threatBadge,
            { backgroundColor: badgeBg, borderColor: cardBorderColor },
          ]}
        >
          {isCritical && <AlertOctagon size={20} color="#F43F5E" />}
          {isSuspicious && <AlertTriangle size={20} color="#F59E0B" />}
          {isSafe && <CheckCircle size={20} color="#10B981" />}
          <Text style={[styles.badgeText, { color: badgeTextColor }]}>
            {report.threat_level} THREAT
          </Text>
        </View>

        <View style={styles.confidencePill}>
          <Text style={styles.confidenceText}>
            {report.confidence_score}% Confidence
          </Text>
        </View>
      </View>

      {/* Scam Category Title */}
      <Text style={styles.scamTitle}>{report.scam_type}</Text>

      {/* Impersonated Entity Banner */}
      {report.impersonated_entity && report.impersonated_entity !== 'None' && (
        <View style={styles.entityBanner}>
          <Building2 size={20} color="#38BDF8" />
          <View style={styles.entityInfo}>
            <Text style={styles.entityLabel}>IMPERSONATED ENTITY</Text>
            <Text style={styles.entityValue}>{report.impersonated_entity}</Text>
          </View>
        </View>
      )}

      {/* Senior Plain Language Explanation Box */}
      <View style={styles.explanationBox}>
        <Text style={styles.explanationLabel}>WHAT THIS MEANS FOR YOU:</Text>
        <Text style={styles.explanationText}>{report.senior_explanation}</Text>
      </View>

      {/* Action Directive Box */}
      <View
        style={[
          styles.actionBox,
          {
            backgroundColor: isCritical
              ? 'rgba(136, 19, 55, 0.4)'
              : isSuspicious
              ? 'rgba(120, 53, 15, 0.4)'
              : 'rgba(6, 78, 59, 0.4)',
            borderLeftColor: isCritical
              ? '#F43F5E'
              : isSuspicious
              ? '#F59E0B'
              : '#10B981',
          },
        ]}
      >
        <Text
          style={[
            styles.actionLabel,
            {
              color: isCritical
                ? '#FDA4AF'
                : isSuspicious
                ? '#FDE68A'
                : '#A7F3D0',
            },
          ]}
        >
          ⚡ WHAT YOU MUST DO NOW:
        </Text>
        <Text style={styles.actionText}>{report.action_required}</Text>
      </View>

      {/* Targeted Assets Chips */}
      {report.assets_at_risk && report.assets_at_risk.length > 0 && (
        <View style={styles.assetsSection}>
          <View style={styles.assetsHeader}>
            <Lock size={14} color="#CBD5E1" />
            <Text style={styles.assetsTitle}>Targeted Assets at Stake:</Text>
          </View>
          <View style={styles.chipsRow}>
            {report.assets_at_risk.map((asset, idx) => (
              <View key={idx} style={styles.assetChip}>
                <Text style={styles.assetChipText}>⚠️ {asset}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      {(isCritical || isSuspicious) && (
        <View style={styles.actionButtonsCol}>
          <TouchableOpacity
            style={styles.blockButton}
            onPress={handleBlockNumber}
            activeOpacity={0.85}
          >
            <Ban size={22} color="#FFFFFF" />
            <Text style={styles.blockButtonText}>Hang Up & Block Sender</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guardianButton}
            onPress={handleAlertGuardian}
            activeOpacity={0.85}
          >
            <BellRing size={22} color="#FFFFFF" />
            <Text style={styles.guardianButtonText}>
              Alert Family Guardian (SMS)
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyCard: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    marginVertical: 12,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  cardContainer: {
    borderRadius: 24,
    padding: 20,
    marginVertical: 12,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  threatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  confidencePill: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  scamTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 14,
  },
  entityBanner: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  entityInfo: {
    flex: 1,
  },
  entityLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  entityValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9',
    marginTop: 2,
  },
  explanationBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  explanationLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 24,
  },
  actionBox: {
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 14,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  assetsSection: {
    marginBottom: 16,
  },
  assetsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  assetsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  assetChip: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  assetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FEF08A',
  },
  actionButtonsCol: {
    gap: 10,
    marginTop: 4,
  },
  blockButton: {
    backgroundColor: '#E11D48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.4)',
    elevation: 4,
  },
  blockButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  guardianButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    elevation: 4,
  },
  guardianButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
