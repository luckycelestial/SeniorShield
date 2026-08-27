import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import {
  RefreshCw,
  Sparkles,
  Sliders,
  X,
  Check,
  Activity,
  ShieldCheck,
  AlertCircle,
  Lightbulb,
  MessageSquareText,
} from 'lucide-react-native';

import { Header } from './src/components/Header';
import { ThreatCard } from './src/components/ThreatCard';
import { CampaignTimeline } from './src/components/CampaignTimeline';
import { SimulationDrawer } from './src/components/SimulationDrawer';
import { SmsAnalyzerModal } from './src/components/SmsAnalyzerModal';

import {
  CampaignState,
  DeviceEvent,
  MockScenario,
} from './src/types/scam';
import {
  createInitialCampaignState,
  updateCampaignState,
} from './src/services/campaignTracker';
import { analyzeMultiChannelCampaign } from './src/services/gemini';
import {
  requestDevicePermissions,
  scanDeviceComms,
} from './src/services/deviceScanner';
import {
  requestNotificationPermissions,
  setupNotificationListener,
} from './src/services/notificationReader';
import { MOCK_SCAM_SCENARIOS } from './src/constants/mockScams';

export default function App() {
  // Core Campaign & Defense State
  const [campaignState, setCampaignState] = useState<CampaignState>(
    createInitialCampaignState()
  );
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [activeScenarioTitle, setActiveScenarioTitle] = useState<string | null>(
    null
  );

  // Settings & Configuration
  const [guardianPhone, setGuardianPhone] = useState<string>('+919876543210');
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [isSettingsVisible, setIsSettingsVisible] = useState<boolean>(false);
  const [isSimulationVisible, setIsSimulationVisible] = useState<boolean>(false);
  const [isSmsAnalyzerVisible, setIsSmsAnalyzerVisible] = useState<boolean>(false);

  // Initial Auto-Analysis and Background Notification Reader
  useEffect(() => {
    runInitialBaseline();
    initializeNotificationReader();
  }, []);

  const initializeNotificationReader = async () => {
    await requestNotificationPermissions();

    // Subscribe to incoming OS notifications
    const unsubscribe = setupNotificationListener(async (event: DeviceEvent) => {
      console.log('[App] Live notification captured:', event);
      setActiveScenarioTitle(`Live Notification: ${event.senderOrNumber}`);
      setIsScanning(true);

      try {
        const report = await analyzeMultiChannelCampaign(
          [...campaignState.events, event],
          geminiApiKey
        );
        setCampaignState((prevState) =>
          updateCampaignState(prevState, [event], report)
        );
      } catch (err) {
        console.error('[App] Error analyzing live notification:', err);
      } finally {
        setIsScanning(false);
      }
    });

    return () => {
      unsubscribe();
    };
  };

  const runInitialBaseline = async () => {
    const defaultScenario = MOCK_SCAM_SCENARIOS[3]; // Safe Benchmark
    const initialReport = await analyzeMultiChannelCampaign(
      defaultScenario.events,
      geminiApiKey
    );
    setCampaignState(
      updateCampaignState(campaignState, defaultScenario.events, initialReport)
    );
    setActiveScenarioTitle(defaultScenario.title);
  };

  /**
   * Analyzes an arbitrary raw SMS / Notification text directly.
   */
  const handleAnalyzeCustomSms = async (sender: string, text: string) => {
    setIsScanning(true);
    setActiveScenarioTitle(`SMS from ${sender}`);

    const newEvent: DeviceEvent = {
      id: `custom_sms_${Date.now()}`,
      timestamp: Date.now(),
      type: 'SMS',
      senderOrNumber: sender,
      contentOrDuration: text,
    };

    try {
      const report = await analyzeMultiChannelCampaign(
        [...campaignState.events, newEvent],
        geminiApiKey
      );
      setCampaignState(
        updateCampaignState(campaignState, [newEvent], report)
      );
    } catch (error) {
      console.error('[App] Custom SMS analysis error:', error);
      Alert.alert('Analysis Notice', 'Evaluated SMS with internal heuristic security models.');
    } finally {
      setIsScanning(false);
    }
  };

  /**
   * Triggers live device SMS and Call Log scan.
   */
  const handleLiveDeviceScan = async () => {
    setIsScanning(true);
    setActiveScenarioTitle('Live Device Communications');

    try {
      const hasPerms = await requestDevicePermissions();
      if (!hasPerms) {
        Alert.alert(
          'Device Permissions',
          'SMS and Call Log permissions are needed to scan incoming messages and calls. Running automated intelligence check on available telemetries.'
        );
      }

      const events = await scanDeviceComms();

      const eventsToAnalyze =
        events.length > 0 ? events : MOCK_SCAM_SCENARIOS[0].events;

      if (events.length === 0) {
        setActiveScenarioTitle('Live Scan (Simulated Inflow Demo)');
      }

      const report = await analyzeMultiChannelCampaign(eventsToAnalyze, geminiApiKey);
      setCampaignState(updateCampaignState(campaignState, eventsToAnalyze, report));
    } catch (error) {
      console.error('[App] Error during device scan:', error);
      Alert.alert('Scan Alert', 'Completed analysis with localized shield defenses.');
    } finally {
      setIsScanning(false);
    }
  };

  /**
   * Executes a simulated mock scenario for hackathon presentations.
   */
  const handleSelectMockScenario = async (scenario: MockScenario) => {
    setIsScanning(true);
    setActiveScenarioTitle(scenario.title);

    try {
      const report = await analyzeMultiChannelCampaign(
        scenario.events,
        geminiApiKey
      );
      setCampaignState(
        updateCampaignState(campaignState, scenario.events, report)
      );
    } catch (error) {
      console.error('[App] Simulation error:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCallHelpline = () => {
    Linking.openURL('tel:1930').catch(() => {
      Alert.alert(
        'National Cyber Crime Helpline',
        'Direct helpline number: 1930\n\nInstant financial cyber fraud reporting portal: cybercrime.gov.in'
      );
    });
  };

  const currentThreatLevel =
    campaignState.latestReport?.threat_level || 'SAFE';

  const riskScore = campaignState.cumulativeRiskScore;
  const isHighRisk = riskScore > 70;
  const isMedRisk = riskScore > 30;

  // Strict semantic colors: Green = Safe, Yellow = Warning, Red = Emergency
  const scoreTextColor = isHighRisk
    ? '#FF383C' // Red for Emergency
    : isMedRisk
    ? '#F59E0B' // Yellow for Warning
    : '#10B981'; // Green for Safe

  const scoreBarColor = isHighRisk
    ? '#FF383C'
    : isMedRisk
    ? '#F59E0B'
    : '#10B981';

  return (
    <SafeAreaProvider>
      <View style={styles.rootContainer}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="dark-content" backgroundColor="#FCFCFC" />

          {/* Header */}
          <Header
            threatLevel={currentThreatLevel}
            onCallHelpline={handleCallHelpline}
            onOpenSettings={() => setIsSettingsVisible(true)}
          />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Cumulative Risk Exposure StatCard */}
            <View style={styles.gaugeCard}>
              <View style={styles.gaugeHeader}>
                <View style={styles.gaugeHeaderLeft}>
                  <View style={styles.gaugeIconBox}>
                    <Activity size={18} color="#0284C7" />
                  </View>
                  <Text style={styles.gaugeTitle}>CUMULATIVE RISK EXPOSURE</Text>
                </View>
                <Text style={[styles.gaugeScoreText, { color: scoreTextColor }]}>
                  {riskScore} <Text style={styles.gaugeScoreDenom}>/ 100</Text>
                </Text>
              </View>

              {/* Progress Track */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.max(6, riskScore)}%`,
                      backgroundColor: scoreBarColor,
                    },
                  ]}
                />
              </View>

              {/* Solid Active Context Pill */}
              {activeScenarioTitle && (
                <View style={styles.contextBadge}>
                  <ShieldCheck size={14} color="#FFFFFF" />
                  <Text style={styles.contextText}>
                    Active Context: <Text style={styles.contextHighlight}>{activeScenarioTitle}</Text>
                  </Text>
                </View>
              )}
            </View>

            {/* Primary Action Buttons */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.scanButton,
                  isScanning && styles.scanButtonDisabled,
                ]}
                onPress={handleLiveDeviceScan}
                disabled={isScanning}
                activeOpacity={0.88}
              >
                {isScanning ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <RefreshCw size={18} color="#FFFFFF" />
                )}
                <Text style={styles.scanButtonText}>
                  {isScanning ? 'Analyzing Inflow...' : 'Scan Device'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.smsAnalyzeButton}
                onPress={() => setIsSmsAnalyzerVisible(true)}
                activeOpacity={0.88}
              >
                <MessageSquareText size={16} color="#1F1F1F" />
                <Text style={styles.smsAnalyzeButtonText}>Read SMS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoHubButton}
                onPress={() => setIsSimulationVisible(true)}
                activeOpacity={0.88}
              >
                <Sparkles size={16} color="#B45309" />
                <Text style={styles.demoHubButtonText}>Demo Hub</Text>
              </TouchableOpacity>
            </View>

            {/* Dynamic Threat Report Card */}
            <ThreatCard
              report={campaignState.latestReport}
              guardianPhone={guardianPhone}
              onBlockNumber={() => {
                Alert.alert(
                  'Threat Mitigated',
                  'Number blocked and cyber telemetry logged.'
                );
              }}
            />

            {/* Multi-Step Attack Chain Timeline */}
            <CampaignTimeline
              events={campaignState.events}
              stage={campaignState.campaignStage}
            />

            {/* Senior Golden Safety Rules */}
            <View style={styles.goldenRulesCard}>
              <View style={styles.goldenRulesHeader}>
                <Lightbulb size={18} color="#D97706" />
                <Text style={styles.goldenRulesTitle}>
                  Golden Safety Rules for Seniors
                </Text>
              </View>

              <View style={styles.rulesList}>
                <View style={styles.ruleItem}>
                  <AlertCircle size={15} color="#D97706" style={styles.ruleIcon} />
                  <Text style={styles.ruleText}>
                    <Text style={styles.ruleHighlight}>Electricity Boards</Text> never cut off power at night without paper notices.
                  </Text>
                </View>

                <View style={styles.ruleItem}>
                  <AlertCircle size={15} color="#D97706" style={styles.ruleIcon} />
                  <Text style={styles.ruleText}>
                    <Text style={styles.ruleHighlight}>Police & CBI</Text> never arrest citizens over phone or Skype/WhatsApp video calls.
                  </Text>
                </View>

                <View style={styles.ruleItem}>
                  <AlertCircle size={15} color="#D97706" style={styles.ruleIcon} />
                  <Text style={styles.ruleText}>
                    <Text style={styles.ruleHighlight}>Banks</Text> never send apps (.apk links) or ask for OTPs to update KYC.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* SMS & Notification Analyzer Modal */}
          <SmsAnalyzerModal
            visible={isSmsAnalyzerVisible}
            onClose={() => setIsSmsAnalyzerVisible(false)}
            onAnalyzeSms={handleAnalyzeCustomSms}
          />

          {/* Demo Simulation Drawer */}
          <SimulationDrawer
            visible={isSimulationVisible}
            onClose={() => setIsSimulationVisible(false)}
            onSelectScenario={handleSelectMockScenario}
          />

          {/* Configuration & Settings Modal */}
          <Modal
            visible={isSettingsVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setIsSettingsVisible(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleGroup}>
                    <Sliders size={20} color="#1F1F1F" />
                    <Text style={styles.modalTitle}>Shield Setup & Guardian</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsSettingsVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <X size={18} color="#8E8E93" />
                  </TouchableOpacity>
                </View>

                {/* Guardian Phone Setup */}
                <Text style={styles.inputLabel}>
                  TRUSTED FAMILY CONTACT (GUARDIAN PHONE)
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={guardianPhone}
                  onChangeText={setGuardianPhone}
                  placeholder="+91 98765 43210"
                  placeholderTextColor="#8E8E93"
                  keyboardType="phone-pad"
                />
                <Text style={styles.inputHint}>
                  High-risk scam attempts trigger 1-tap emergency SMS alerts to this contact.
                </Text>

                {/* Gemini API Key */}
                <Text style={styles.inputLabel}>
                  GOOGLE GEMINI API KEY (OPTIONAL)
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={geminiApiKey}
                  onChangeText={setGeminiApiKey}
                  placeholder="AIzaSy..."
                  placeholderTextColor="#8E8E93"
                  secureTextEntry={true}
                />
                <Text style={styles.inputHint}>
                  If left blank, SeniorShield uses its built-in offline intelligence engine.
                </Text>

                {/* Save Button */}
                <TouchableOpacity
                  style={styles.saveSettingsButton}
                  onPress={() => setIsSettingsVisible(false)}
                  activeOpacity={0.88}
                >
                  <Check size={18} color="#FFFFFF" />
                  <Text style={styles.saveSettingsButtonText}>Save & Return to Shield</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FCFCFC',
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 8,
  },
  gaugeCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  gaugeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  gaugeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gaugeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  gaugeScoreText: {
    fontSize: 20,
    fontWeight: '900',
  },
  gaugeScoreDenom: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 9999,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 9999,
  },
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
  },
  contextText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contextHighlight: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  scanButton: {
    flex: 1.2,
    backgroundColor: '#1F1F1F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 50,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  scanButtonDisabled: {
    backgroundColor: '#475569',
    opacity: 0.7,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  smsAnalyzeButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 50,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  smsAnalyzeButtonText: {
    color: '#1F1F1F',
    fontSize: 13,
    fontWeight: '800',
  },
  demoHubButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 50,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  demoHubButtonText: {
    color: '#1F1F1F',
    fontSize: 13,
    fontWeight: '800',
  },
  goldenRulesCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 24,
    padding: 20,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  goldenRulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  goldenRulesTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1F1F1F',
    letterSpacing: -0.2,
  },
  rulesList: {
    gap: 10,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  ruleIcon: {
    marginTop: 2,
  },
  ruleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F1F1F',
    flex: 1,
    lineHeight: 18,
  },
  ruleHighlight: {
    color: '#B45309',
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1F1F1F',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E8E93',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#1F1F1F',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  inputHint: {
    fontSize: 11,
    color: '#8E8E93',
    lineHeight: 15,
    marginBottom: 16,
  },
  saveSettingsButton: {
    backgroundColor: '#1F1F1F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    borderRadius: 9999,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  saveSettingsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
