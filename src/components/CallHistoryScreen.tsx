import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  PhoneOff,
  UserX,
  Clock,
  Send,
  Building,
  AlertTriangle,
  FileAudio,
  ChevronRight,
  Info,
  CheckCircle,
  RefreshCw,
  FolderOpen,
  Sparkles,
} from 'lucide-react-native';
import { ProcessedCallRecord } from '../types/callLog';
import { callRecordingService, DeviceRecordingFile } from '../services/callRecordingService';
import { TRANSLATIONS } from '../constants/languages';

interface CallHistoryScreenProps {
  visible: boolean;
  calls: ProcessedCallRecord[];
  selectedLanguage: string;
  onClose: () => void;
  onBlockNumber: (phoneNumber: string) => void;
  onAlertGuardian: (phoneNumber: string) => void;
  onAddProcessedRecord?: (record: ProcessedCallRecord) => void;
}

export const CallHistoryScreen: React.FC<CallHistoryScreenProps> = ({
  visible,
  calls,
  selectedLanguage,
  onClose,
  onBlockNumber,
  onAlertGuardian,
  onAddProcessedRecord,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'THREATS' | 'SAFE' | 'RAW_FILES'>('ALL');
  const [selectedCall, setSelectedCall] = useState<ProcessedCallRecord | null>(null);
  const [deviceFiles, setDeviceFiles] = useState<DeviceRecordingFile[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [analyzingFilePath, setAnalyzingFilePath] = useState<string | null>(null);

  const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;

  useEffect(() => {
    if (visible) {
      scanRecordings();
    }
  }, [visible]);

  const scanRecordings = async () => {
    setIsScanning(true);
    try {
      const files = await callRecordingService.scanDeviceRecordings(20);
      setDeviceFiles(files);
    } catch (e) {
      console.error('Error scanning device recordings:', e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAnalyzeFile = async (file: DeviceRecordingFile) => {
    setAnalyzingFilePath(file.filePath);
    try {
      const record = await callRecordingService.analyzeRecordedAudioWithAi(
        file.filePath,
        file.callerOrContact
      );

      if (record) {
        if (onAddProcessedRecord) {
          onAddProcessedRecord(record);
        }
        setSelectedCall(record);
      }
    } catch (e: any) {
      Alert.alert(
        'Analysis Failed',
        e?.message || 'Could not analyze this audio file with Gemini AI.'
      );
    } finally {
      setAnalyzingFilePath(null);
    }
  };

  if (!visible) return null;

  const filteredCalls = calls.filter((c) => {
    if (filter === 'THREATS') return c.threatLevel === 'CRITICAL' || c.threatLevel === 'SUSPICIOUS';
    if (filter === 'SAFE') return c.threatLevel === 'SAFE';
    return true;
  });

  const threatCount = calls.filter((c) => c.threatLevel === 'CRITICAL' || c.threatLevel === 'SUSPICIOUS').length;
  const safeCount = calls.filter((c) => c.threatLevel === 'SAFE').length;

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const mins = Math.max(1, Math.round((Date.now() - timestamp) / (1000 * 60)));
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose} activeOpacity={0.7}>
            <ArrowLeft size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>In-Call Audio Shield Logs</Text>
            <Text style={styles.headerSubtitle}>Real Audio Recordings Processed by Gemini AI</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={scanRecordings}
            disabled={isScanning}
            activeOpacity={0.7}
          >
            {isScanning ? (
              <ActivityIndicator size="small" color="#0284C7" />
            ) : (
              <RefreshCw size={18} color="#0284C7" />
            )}
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, filter === 'ALL' && styles.filterPillActive]}
            onPress={() => setFilter('ALL')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillText, filter === 'ALL' && styles.filterPillTextActive]}>
              Processed ({calls.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filter === 'RAW_FILES' && styles.filterPillActiveBlue]}
            onPress={() => setFilter('RAW_FILES')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillText, filter === 'RAW_FILES' && styles.filterPillTextActiveBlue]}>
              📁 Device Files ({deviceFiles.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filter === 'THREATS' && styles.filterPillActiveRed]}
            onPress={() => setFilter('THREATS')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillText, filter === 'THREATS' && styles.filterPillTextActiveRed]}>
              🚨 Threats ({threatCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filter === 'SAFE' && styles.filterPillActiveGreen]}
            onPress={() => setFilter('SAFE')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillText, filter === 'SAFE' && styles.filterPillTextActiveGreen]}>
              🟢 Safe ({safeCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sentinel Rule Reminder Banner */}
        <View style={styles.ruleBanner}>
          <Info size={16} color="#0284C7" />
          <Text style={styles.ruleBannerText}>
            <Text style={styles.ruleBannerBold}>Real Audio Pipeline: </Text>
            Audio recordings are loaded directly from device storage (`/sdcard/Recordings/Record/Call`), transcribed by Gemini 2.5 Flash Lite, and evaluated dynamically.
          </Text>
        </View>

        {/* Content List */}
        <ScrollView style={styles.callsList} showsVerticalScrollIndicator={false}>
          {filter === 'RAW_FILES' ? (
            /* Device Recordings File Browser */
            <View>
              <Text style={styles.sectionHeader}>
                CALL RECORDING FILES DETECTED ON DEVICE ({deviceFiles.length})
              </Text>
              {deviceFiles.length === 0 ? (
                <View style={styles.emptyBox}>
                  <FolderOpen size={36} color="#64748B" />
                  <Text style={styles.emptyTitle}>No Audio Recordings Found</Text>
                  <Text style={styles.emptySubtitle}>
                    Enable call recording in your phone dialer or record a call to see it here.
                  </Text>
                </View>
              ) : (
                deviceFiles.map((file) => {
                  const isProcessing = analyzingFilePath === file.filePath;

                  return (
                    <View key={file.filePath} style={styles.fileCard}>
                      <View style={styles.fileHeader}>
                        <View style={styles.fileInfo}>
                          <Text style={styles.fileNameText}>{file.callerOrContact}</Text>
                          <Text style={styles.filePathText} numberOfLines={1}>
                            {file.fileName}
                          </Text>
                          <View style={styles.fileMetaRow}>
                            <Text style={styles.fileMetaText}>
                              {(file.fileSizeBytes / 1024).toFixed(0)} KB • {formatDuration(file.durationSeconds)}
                            </Text>
                            <Text style={styles.fileMetaDot}>•</Text>
                            <Text style={styles.fileMetaText}>{formatTimeAgo(file.lastModified)}</Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={[styles.aiAnalyzeBtn, isProcessing && styles.aiAnalyzeBtnLoading]}
                          onPress={() => handleAnalyzeFile(file)}
                          disabled={isProcessing}
                          activeOpacity={0.85}
                        >
                          {isProcessing ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Sparkles size={14} color="#FFFFFF" />
                              <Text style={styles.aiAnalyzeBtnText}>Analyze AI</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          ) : (
            /* Processed Calls List */
            <View>
              {filteredCalls.length === 0 ? (
                <View style={styles.emptyBox}>
                  <CheckCircle size={36} color="#10B981" />
                  <Text style={styles.emptyTitle}>No Processed Calls Yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Tap "Device Files" above to run Gemini AI on your existing call recordings, or receive a live phone call to analyze automatically.
                  </Text>
                  <TouchableOpacity
                    style={styles.scanFilesBtn}
                    onPress={() => setFilter('RAW_FILES')}
                    activeOpacity={0.85}
                  >
                    <FolderOpen size={16} color="#FFFFFF" />
                    <Text style={styles.scanFilesBtnText}>Browse Device Audio Recordings</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                filteredCalls.map((call) => {
                  const isThreat = call.threatLevel === 'CRITICAL' || call.threatLevel === 'SUSPICIOUS';

                  return (
                    <TouchableOpacity
                      key={call.id}
                      style={[styles.callCard, isThreat ? styles.callCardRed : styles.callCardGreen]}
                      onPress={() => setSelectedCall(call)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.callCardHeader}>
                        <View style={styles.callerInfo}>
                          <Text style={styles.callerNumber}>{call.phoneNumber}</Text>
                          <View style={styles.callerBadgeRow}>
                            <View style={styles.strangerBadge}>
                              <UserX size={11} color="#E11D48" />
                              <Text style={styles.strangerBadgeText}>Real Call Recording</Text>
                            </View>
                            <View style={styles.durationBadge}>
                              <Clock size={11} color="#64748B" />
                              <Text style={styles.durationBadgeText}>{formatDuration(call.durationSeconds)}</Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.cardHeaderRight}>
                          <View style={[styles.threatPill, isThreat ? styles.threatPillRed : styles.threatPillGreen]}>
                            {isThreat ? <ShieldAlert size={12} color="#FFFFFF" /> : <ShieldCheck size={12} color="#FFFFFF" />}
                            <Text style={styles.threatPillText}>
                              {isThreat ? `${call.threatLevel} (${call.confidenceScore}%)` : 'SAFE'}
                            </Text>
                          </View>
                          <Text style={styles.timeAgoText}>{formatTimeAgo(call.timestamp)}</Text>
                        </View>
                      </View>

                      {/* Impersonation & Scam Type */}
                      <View style={styles.scamTypeBox}>
                        <Text style={styles.scamTypeTitle}>{call.scamType}</Text>
                        {call.impersonatedEntity && call.impersonatedEntity !== 'None' && (
                          <View style={styles.entityTagRow}>
                            <Building size={13} color="#0284C7" />
                            <Text style={styles.entityTagText}>
                              {call.impersonatedEntity}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Speech Transcript Snippet */}
                      <View style={styles.snippetBox}>
                        <FileAudio size={14} color="#64748B" />
                        <Text style={styles.snippetText} numberOfLines={2}>
                          {call.chunkTranscripts?.[0]?.text || call.fullTranscript || 'Transcript generated by Gemini AI'}
                        </Text>
                      </View>

                      {/* Drilldown Arrow Action */}
                      <View style={styles.cardFooter}>
                        <Text style={styles.cardFooterText}>View Full Gemini Speech Debrief & Chunks</Text>
                        <ChevronRight size={16} color="#E11D48" />
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}
          <View style={{ height: 50 }} />
        </ScrollView>

        {/* Detailed Drill-down Debrief Modal for Single Call */}
        {selectedCall && (
          <Modal
            visible={!!selectedCall}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setSelectedCall(null)}
          >
            <View style={styles.drillOverlay}>
              <View style={styles.drillContent}>
                {/* Drill Header */}
                <View style={styles.drillHeader}>
                  <View style={styles.drillHeaderLeft}>
                    <View
                      style={[
                        styles.drillIconBox,
                        selectedCall.threatLevel === 'CRITICAL'
                          ? styles.headerIconBoxRed
                          : styles.headerIconBoxGreen,
                      ]}
                    >
                      {selectedCall.threatLevel === 'CRITICAL' ? (
                        <ShieldAlert size={22} color="#FFFFFF" />
                      ) : (
                        <ShieldCheck size={22} color="#FFFFFF" />
                      )}
                    </View>
                    <View>
                      <Text style={styles.drillTitle}>{selectedCall.phoneNumber}</Text>
                      <Text style={styles.drillSubtitle}>
                        Duration: {formatDuration(selectedCall.durationSeconds)} • Analyzed with Gemini 2.5 Flash Lite
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.drillClose}
                    onPress={() => setSelectedCall(null)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.drillCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.drillBody} showsVerticalScrollIndicator={false}>
                  {/* Scam Verdict Card */}
                  <View
                    style={[
                      styles.drillVerdictCard,
                      selectedCall.threatLevel === 'CRITICAL'
                        ? styles.verdictCardRed
                        : styles.verdictCardGreen,
                    ]}
                  >
                    <Text
                      style={[
                        styles.drillVerdictTag,
                        selectedCall.threatLevel === 'CRITICAL'
                          ? styles.verdictTagRed
                          : styles.verdictTagGreen,
                      ]}
                    >
                      {selectedCall.threatLevel === 'CRITICAL'
                        ? `🚨 CRITICAL SCAM (${selectedCall.confidenceScore}% Confidence)`
                        : '🟢 SAFE CALL'}
                    </Text>
                    <Text style={styles.drillScamTitle}>{selectedCall.scamType}</Text>
                  </View>

                  {/* Impersonated Entity */}
                  {selectedCall.impersonatedEntity && selectedCall.impersonatedEntity !== 'None' && (
                    <View style={styles.entityCard}>
                      <View style={styles.entityHeader}>
                        <Building size={16} color="#0284C7" />
                        <Text style={styles.entityLabel}>IMPERSONATED ENTITY</Text>
                      </View>
                      <Text style={styles.entityName}>{selectedCall.impersonatedEntity}</Text>
                    </View>
                  )}

                  {/* Senior Action Directives */}
                  <View style={styles.directiveCard}>
                    <View style={styles.directiveHeader}>
                      <AlertTriangle size={16} color="#E11D48" />
                      <Text style={styles.directiveTitle}>ACTION DIRECTIVE FOR SENIOR:</Text>
                    </View>
                    <Text style={styles.directiveText}>{selectedCall.seniorActionDirective}</Text>
                  </View>

                  {/* Audio Chunks Sequence */}
                  <Text style={styles.chunkSectionTitle}>AI AUDIO TRANSCRIPTION BREAKDOWN</Text>
                  {selectedCall.chunkTranscripts?.map((chunk, idx) => (
                    <View key={chunk.chunkIndex || idx} style={styles.chunkCard}>
                      <View style={styles.chunkHeader}>
                        <View style={styles.chunkPill}>
                          <Text style={styles.chunkPillText}>Chunk #{chunk.chunkIndex || idx + 1}</Text>
                        </View>
                        {chunk.intent && (
                          <Text style={styles.chunkIntentText}>Intent: {chunk.intent}</Text>
                        )}
                      </View>
                      <Text style={styles.chunkSpeechText}>"{chunk.text}"</Text>
                    </View>
                  ))}

                  {/* Scam Markers / Indicators */}
                  {selectedCall.scamMarkers && selectedCall.scamMarkers.length > 0 && (
                    <View style={styles.markersCard}>
                      <Text style={styles.markersHeader}>THREAT INDICATORS DETECTED BY AI:</Text>
                      <View style={styles.markerChipsRow}>
                        {selectedCall.scamMarkers.map((marker, mIdx) => (
                          <View key={mIdx} style={styles.markerChip}>
                            <Text style={styles.markerChipText}>{marker}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </ScrollView>

                {/* Drill Footer Action Buttons */}
                <View style={styles.drillFooter}>
                  <TouchableOpacity
                    style={styles.drillBlockBtn}
                    onPress={() => {
                      const num = selectedCall.phoneNumber;
                      setSelectedCall(null);
                      onBlockNumber(num);
                    }}
                    activeOpacity={0.85}
                  >
                    <PhoneOff size={15} color="#FFFFFF" />
                    <Text style={styles.drillBtnText}>Block Number</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.drillGuardianBtn}
                    onPress={() => {
                      const num = selectedCall.phoneNumber;
                      setSelectedCall(null);
                      onAlertGuardian(num);
                    }}
                    activeOpacity={0.85}
                  >
                    <Send size={15} color="#FFFFFF" />
                    <Text style={styles.drillBtnText}>Alert Guardian</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 54,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleGroup: {
    flex: 1,
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
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterPill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: '#0F172A',
  },
  filterPillActiveBlue: {
    backgroundColor: '#0284C7',
  },
  filterPillActiveRed: {
    backgroundColor: '#E11D48',
  },
  filterPillActiveGreen: {
    backgroundColor: '#10B981',
  },
  filterPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterPillTextActiveBlue: {
    color: '#FFFFFF',
  },
  filterPillTextActiveRed: {
    color: '#FFFFFF',
  },
  filterPillTextActiveGreen: {
    color: '#FFFFFF',
  },
  ruleBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 6,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 10,
  },
  ruleBannerText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0369A1',
    lineHeight: 16,
  },
  ruleBannerBold: {
    fontWeight: '800',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 8,
  },
  callsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  scanFilesBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    marginTop: 16,
  },
  scanFilesBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  fileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
    marginRight: 10,
  },
  fileNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  filePathText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  fileMetaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  fileMetaDot: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  aiAnalyzeBtn: {
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  aiAnalyzeBtnLoading: {
    backgroundColor: '#64748B',
  },
  aiAnalyzeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  callCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  callCardRed: {
    borderColor: '#FECDD3',
  },
  callCardGreen: {
    borderColor: '#BBF7D0',
  },
  callCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  callerInfo: {
    flex: 1,
  },
  callerNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  callerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  strangerBadge: {
    backgroundColor: '#FFE4E6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  strangerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E11D48',
  },
  durationBadge: {
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  durationBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
  },
  threatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  threatPillRed: {
    backgroundColor: '#E11D48',
  },
  threatPillGreen: {
    backgroundColor: '#10B981',
  },
  threatPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  timeAgoText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 3,
  },
  scamTypeBox: {
    marginBottom: 8,
  },
  scamTypeTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  entityTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  entityTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  snippetBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  snippetText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  cardFooterText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E11D48',
  },
  // Drill-down Modal
  drillOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  drillContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: 24,
  },
  drillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  drillHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drillIconBox: {
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
  drillTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  drillSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  drillClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drillCloseText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  drillBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  drillVerdictCard: {
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
  drillVerdictTag: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  verdictTagRed: {
    color: '#E11D48',
  },
  verdictTagGreen: {
    color: '#15803D',
  },
  drillScamTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
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
    marginBottom: 16,
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
    fontSize: 13.5,
    fontWeight: '700',
    color: '#78350F',
    lineHeight: 19,
  },
  chunkSectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  chunkCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chunkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chunkPill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chunkPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#334155',
  },
  chunkIntentText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#E11D48',
  },
  chunkSpeechText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  markersCard: {
    backgroundColor: '#FFF1F2',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  markersHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E11D48',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  markerChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  markerChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDA4AF',
  },
  markerChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BE123C',
  },
  drillFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
  },
  drillBlockBtn: {
    flex: 1,
    backgroundColor: '#E11D48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 9999,
  },
  drillGuardianBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 9999,
  },
  drillBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
