import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PhoneOff, AlertTriangle, ShieldAlert, X } from 'lucide-react-native';
import { PreCallReputation } from '../services/preCallSentinel';

interface PreCallAlertCardProps {
  alert: PreCallReputation | null;
  onDismiss: () => void;
  onBlockCaller: (phoneNumber: string) => void;
}

export const PreCallAlertCard: React.FC<PreCallAlertCardProps> = ({
  alert,
  onDismiss,
  onBlockCaller,
}) => {
  if (!alert || alert.threatCategory === 'SAFE_VERIFIED') {
    return null;
  }

  const isCritical = alert.threatCategory === 'CRITICAL_SCAM';
  const cardBorderColor = isCritical ? '#FF383C' : '#F59E0B';
  const bannerBg = isCritical ? '#FF383C' : '#F59E0B';

  return (
    <View style={[styles.card, { borderColor: cardBorderColor }]}>
      {/* Top Banner */}
      <View style={[styles.topBanner, { backgroundColor: bannerBg }]}>
        <View style={styles.bannerLeft}>
          <ShieldAlert size={18} color="#FFFFFF" />
          <Text style={styles.bannerTitle}>
            {isCritical ? '🚨 PRE-CALL SCAM ALERT' : '⚠️ SUSPICIOUS CALL INCOMING'}
          </Text>
        </View>
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <X size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardBody}>
        {/* Caller Info */}
        <View style={styles.callerHeader}>
          <View>
            <Text style={styles.callerName}>{alert.callerName}</Text>
            <Text style={styles.callerNumber}>{alert.phoneNumber}</Text>
          </View>

          <View style={styles.spamBadge}>
            <Text style={styles.spamBadgeText}>{alert.spamScore}% Spam Score</Text>
          </View>
        </View>

        {/* Impersonation Tag */}
        {alert.impersonationTag !== 'None' && (
          <View style={styles.impersonationPill}>
            <AlertTriangle size={13} color="#991B1B" />
            <Text style={styles.impersonationText}>
              Flagged Vector: <Text style={styles.impersonationHighlight}>{alert.impersonationTag}</Text>
            </Text>
          </View>
        )}

        {/* Multi-Channel Linked Pill */}
        {alert.isMultiChannelAttack && (
          <View style={styles.multiChannelPill}>
            <Text style={styles.multiChannelText}>
              ⚡ Linked to Recent Fake SMS Received Minutes Ago
            </Text>
          </View>
        )}

        {/* Directive Box */}
        <View style={styles.directiveBox}>
          <Text style={styles.directiveLabel}>WHAT YOU MUST DO NOW:</Text>
          <Text style={styles.directiveText}>{alert.seniorDirective}</Text>
        </View>

        {/* Mitigation Action */}
        <TouchableOpacity
          style={styles.blockButton}
          onPress={() => onBlockCaller(alert.phoneNumber)}
          activeOpacity={0.88}
        >
          <PhoneOff size={18} color="#FFFFFF" />
          <Text style={styles.blockButtonText}>Block Number & Reject Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#FF383C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 5,
  },
  topBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dismissButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 16,
  },
  callerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  callerName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1F1F1F',
  },
  callerNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E93',
    marginTop: 2,
  },
  spamBadge: {
    backgroundColor: '#1F1F1F',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  spamBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  impersonationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  impersonationText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
  },
  impersonationHighlight: {
    fontWeight: '900',
  },
  multiChannelPill: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  multiChannelText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '800',
  },
  directiveBox: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 4,
    borderLeftColor: '#FF383C',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  directiveLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  directiveText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F1F1F',
    lineHeight: 19,
  },
  blockButton: {
    backgroundColor: '#FF383C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 9999,
    shadowColor: '#FF383C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  blockButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
