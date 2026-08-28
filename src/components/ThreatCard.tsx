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
import { TRANSLATIONS } from '../constants/languages';

interface ThreatCardProps {
  report: ScamReport | null;
  guardianPhone: string;
  selectedLanguage?: string;
  onBlockNumber?: () => void;
}

export const ThreatCard: React.FC<ThreatCardProps> = ({
  report,
  guardianPhone,
  selectedLanguage = 'en',
  onBlockNumber,
}) => {
  const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;
  if (!report) {
    return (
      <View style={styles.emptyCard}>
        <View style={styles.emptyIconCircle}>
          <Shield size={32} color="#8E8E93" />
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

  // Solid semantic badge backgrounds
  const solidBadgeBg = isCritical
    ? '#FF383C' // Solid Red
    : isSuspicious
    ? '#F59E0B' // Solid Amber
    : '#10B981'; // Solid Emerald

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
    <View style={styles.cardContainer}>
      {/* Top Header: Solid Threat Badge & Solid Confidence Pill */}
      <View style={styles.headerRow}>
        <View
          style={[
            styles.threatBadge,
            { backgroundColor: solidBadgeBg },
          ]}
        >
          {isCritical && <AlertOctagon size={16} color="#FFFFFF" />}
          {isSuspicious && <AlertTriangle size={16} color="#FFFFFF" />}
          {isSafe && <CheckCircle size={16} color="#FFFFFF" />}
          <Text style={styles.badgeText}>
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
          <Building2 size={18} color="#0284C7" />
          <View style={styles.entityInfo}>
            <Text style={styles.entityLabel}>{t.impersonatedEntity || 'IMPERSONATED ENTITY'}</Text>
            <Text style={styles.entityValue}>{report.impersonated_entity}</Text>
          </View>
        </View>
      )}

      {/* Senior Plain Language Explanation Box */}
      <View style={styles.explanationBox}>
        <Text style={styles.explanationLabel}>{t.whatThisMeans || 'WHAT THIS MEANS FOR YOU'}</Text>
        <Text style={styles.explanationText}>{report.senior_explanation}</Text>
      </View>

      {/* Action Directive Box */}
      <View
        style={[
          styles.actionBox,
          {
            backgroundColor: '#F8FAFC',
            borderLeftColor: isCritical
              ? '#FF383C' // Red for Emergency
              : isSuspicious
              ? '#F59E0B' // Yellow for Warning
              : '#10B981', // Green for Safe
          },
        ]}
      >
        <Text
          style={[
            styles.actionLabel,
            {
              color: isCritical
                ? '#DC2626'
                : isSuspicious
                ? '#D97706'
                : '#059669',
            },
          ]}
        >
          ⚡ {t.whatYouMustDo || 'WHAT YOU MUST DO NOW:'}
        </Text>
        <Text style={styles.actionText}>{report.action_required}</Text>
      </View>

      {/* Targeted Assets Chips (Solid Pills) */}
      {report.assets_at_risk && report.assets_at_risk.length > 0 && (
        <View style={styles.assetsSection}>
          <View style={styles.assetsHeader}>
            <Lock size={14} color="#8E8E93" />
            <Text style={styles.assetsTitle}>{t.targetedAssets || 'Targeted Assets at Stake:'}</Text>
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
          {/* Red ONLY for emergency block */}
          <TouchableOpacity
            style={styles.blockButton}
            onPress={handleBlockNumber}
            activeOpacity={0.88}
          >
            <Ban size={20} color="#FFFFFF" />
            <Text style={styles.blockButtonText}>{t.blockSender || 'Hang Up & Block Sender'}</Text>
          </TouchableOpacity>

          {/* Solid Charcoal for SMS notification */}
          <TouchableOpacity
            style={styles.guardianButton}
            onPress={handleAlertGuardian}
            activeOpacity={0.88}
          >
            <BellRing size={20} color="#FFFFFF" />
            <Text style={styles.guardianButtonText}>
              {t.alertGuardian || 'Alert Family Guardian (SMS)'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 24,
    padding: 24,
    marginVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#1F1F1F',
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    paddingHorizontal: 10,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  threatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF', // High contrast white on solid color
    letterSpacing: 0.5,
  },
  confidencePill: {
    backgroundColor: '#1F1F1F', // Solid Dark Pill
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scamTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#1F1F1F',
    lineHeight: 27,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  entityBanner: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  entityInfo: {
    flex: 1,
  },
  entityLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  entityValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0369A1',
    marginTop: 2,
  },
  explanationBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  explanationLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#8E8E93',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1F1F',
    lineHeight: 23,
  },
  actionBox: {
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F1F1F',
    lineHeight: 23,
  },
  assetsSection: {
    marginBottom: 14,
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
    color: '#8E8E93',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  assetChip: {
    backgroundColor: '#F1F5F9', // Solid clean pill
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  assetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  actionButtonsCol: {
    gap: 10,
    marginTop: 4,
  },
  blockButton: {
    backgroundColor: '#FF383C', // Solid Emergency Red
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 9999,
    shadowColor: '#FF383C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  blockButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  guardianButton: {
    backgroundColor: '#1F1F1F', // Solid Charcoal
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  guardianButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
