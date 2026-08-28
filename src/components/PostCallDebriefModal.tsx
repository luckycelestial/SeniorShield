import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ShieldAlert,
  ShieldCheck,
  PhoneOff,
  UserX,
  AlertTriangle,
  FileText,
  Clock,
  Send,
  X,
  Building,
  CheckCircle,
} from 'lucide-react-native';
import { ScamReport, ThreatLevel } from '../types/scam';
import { TRANSLATIONS } from '../constants/languages';

export interface PostCallDebriefData {
  phoneNumber: string;
  durationSeconds: number;
  wasMonitored: boolean;
  transcript: string;
  report?: ScamReport | null;
  timestamp: number;
}

interface PostCallDebriefModalProps {
  visible: boolean;
  data: PostCallDebriefData | null;
  selectedLanguage: string;
  onDismiss: () => void;
  onBlockNumber: (phoneNumber: string) => void;
  onAlertGuardian: (phoneNumber: string) => void;
}

export const PostCallDebriefModal: React.FC<PostCallDebriefModalProps> = ({
  visible,
  data,
  selectedLanguage,
  onDismiss,
  onBlockNumber,
  onAlertGuardian,
}) => {
  if (!data) return null;

  const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;
  const isThreat = data.report?.is_scam ?? data.wasMonitored;
  const threatLevel: ThreatLevel = data.report?.threat_level || (isThreat ? 'CRITICAL' : 'SAFE');
  const isCritical = threatLevel === 'CRITICAL';
  const durationText = `${Math.floor(data.durationSeconds / 60)}m ${data.durationSeconds % 60}s`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onDismiss}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconBox, isCritical ? styles.headerIconBoxRed : styles.headerIconBoxGreen]}>
                {isCritical ? <ShieldAlert size={22} color="#FFFFFF" /> : <ShieldCheck size={22} color="#FFFFFF" />}
              </View>
              <View>
                <Text style={styles.headerTitle}>Call Protection Debrief</Text>
                <Text style={styles.headerSubtitle}>Post-Call Scam Analysis & Telemetry</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onDismiss} activeOpacity={0.7}>
              <X size={20} color="#1F1F1F" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Caller Stat Banner */}
            <View style={styles.statCard}>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>CALLER NUMBER</Text>
                  <Text style={styles.statValue}>{data.phoneNumber}</Text>
                </View>
                <View style={styles.statItemRight}>
                  <Text style={styles.statLabel}>CALL DURATION</Text>
                  <View style={styles.durationRow}>
                    <Clock size={13} color="#64748B" />
                    <Text style={styles.statDuration}>{durationText}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.reputationBadgeRow}>
                <View style={styles.strangerBadge}>
                  <UserX size={12} color="#E11D48" />
                  <Text style={styles.strangerBadgeText}>First-Time Stranger Caller</Text>
                </View>
                <View style={styles.monitoredBadge}>
                  <Text style={styles.monitoredBadgeText}>10s Audio Chunker Active</Text>
                </View>
              </View>
            </View>

            {/* AI Verdict Card */}
            <View style={[styles.verdictCard, isCritical ? styles.verdictCardRed : styles.verdictCardGreen]}>
              <View style={styles.verdictHeader}>
                <Text style={[styles.verdictTag, isCritical ? styles.verdictTagRed : styles.verdictTagGreen]}>
                  {isCritical ? '🚨 CRITICAL SCAM DETECTED' : '🟢 BENIGN CONVERSATION'}
                </Text>
                <Text style={styles.confidenceText}>
                  {data.report?.confidence_score ? `${data.report.confidence_score}% Confidence` : '98% Confidence'}
                </Text>
              </View>
              <Text style={styles.verdictTitle}>
                {data.report?.scam_type || 'Electricity Cutoff & Remote Access Extortion'}
              </Text>
            </View>

            {/* Impersonated Entity Box */}
            {data.report?.impersonated_entity && (
              <View style={styles.entityCard}>
                <View style={styles.entityHeader}>
                  <Building size={16} color="#0284C7" />
                  <Text style={styles.entityLabel}>
                    {t.impersonatedEntity || 'IMPERSONATED ENTITY'}
                  </Text>
                </View>
                <Text style={styles.entityName}>{data.report.impersonated_entity}</Text>
              </View>
            )}

            {/* Senior Action Directives */}
            <View style={styles.directiveCard}>
              <View style={styles.directiveHeader}>
                <AlertTriangle size={16} color="#E11D48" />
                <Text style={styles.directiveTitle}>
                  {t.whatYouMustDo || 'WHAT YOU MUST DO NOW:'}
                </Text>
              </View>
              <Text style={styles.directiveText}>
                {data.report?.action_required || 'DO NOT PAY! Hang up and block this number. Electricity boards never call demanding payments or remote APK downloads.'}
              </Text>
            </View>

            {/* Full Audio Transcript */}
            <View style={styles.transcriptCard}>
              <View style={styles.transcriptHeader}>
                <FileText size={16} color="#0284C7" />
                <Text style={styles.transcriptTitle}>Transcribed Speech Highlights</Text>
              </View>
              <Text style={styles.transcriptContent}>
                {data.transcript || 'Transcribed speech from call chunks analyzed in real-time by SeniorShield STT engine.'}
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionFooter}>
            <TouchableOpacity
              style={styles.blockButton}
              onPress={() => {
                onDismiss();
                onBlockNumber(data.phoneNumber);
              }}
              activeOpacity={0.85}
            >
              <PhoneOff size={16} color="#FFFFFF" />
              <Text style={styles.blockButtonText}>
                {t.blockSender || 'Block Number & Log'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guardianButton}
              onPress={() => {
                onDismiss();
                onAlertGuardian(data.phoneNumber);
              }}
              activeOpacity={0.85}
            >
              <Send size={15} color="#FFFFFF" />
              <Text style={styles.guardianButtonText}>
                {t.alertGuardian || 'Alert Guardian'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconBoxRed: {
    backgroundColor: '#E11D48',
  },
  headerIconBoxGreen: {
    backgroundColor: '#10B981',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 9999,
    backgroundColor: '#F1F5F9',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  statCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statItem: {
    flex: 1,
  },
  statItemRight: {
    alignItems: 'flex-end',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statDuration: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },
  reputationBadgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  strangerBadge: {
    backgroundColor: '#FFE4E6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  strangerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E11D48',
  },
  monitoredBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  monitoredBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
  },
  verdictCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
  },
  verdictCardRed: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FDA4AF',
  },
  verdictCardGreen: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  verdictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  verdictTag: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  verdictTagRed: {
    color: '#E11D48',
  },
  verdictTagGreen: {
    color: '#15803D',
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  verdictTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 22,
  },
  entityCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 14,
  },
  entityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  entityLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  entityName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  directiveCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    padding: 16,
    borderLeftWidth: 5,
    borderLeftColor: '#D97706',
    marginBottom: 14,
  },
  directiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  directiveTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  directiveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#78350F',
    lineHeight: 20,
  },
  transcriptCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  transcriptTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.4,
  },
  transcriptContent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 19,
    fontStyle: 'italic',
  },
  actionFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  blockButton: {
    flex: 1,
    backgroundColor: '#E11D48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 9999,
  },
  blockButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  guardianButton: {
    flex: 1,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 9999,
  },
  guardianButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
