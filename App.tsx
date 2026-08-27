import React, { useState, useEffect } from 'react';
import {
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
  Sparkles,
  Sliders,
  X,
  Check,
  Activity,
  ShieldCheck,
  AlertCircle,
  Lightbulb,
  Radio,
} from 'lucide-react-native';

import { Header } from './src/components/Header';
import { ThreatCard } from './src/components/ThreatCard';
import { CampaignTimeline } from './src/components/CampaignTimeline';
import { SimulationDrawer } from './src/components/SimulationDrawer';
import { PreCallAlertCard } from './src/components/PreCallAlertCard';

import {
  CampaignState,
  DeviceEvent,
  MockScenario,
  ScamReport,
} from './src/types/scam';
import {
  createInitialCampaignState,
  updateCampaignState,
} from './src/services/campaignTracker';
import { analyzeMultiChannelCampaign } from './src/services/gemini';
import {
  requestNotificationPermissions,
  setupNotificationListener,
} from './src/services/notificationReader';
import { autonomousSmsWatcher } from './src/services/autonomousSmsWatcher';
import { preCallSentinel, PreCallReputation } from './src/services/preCallSentinel';
import { MOCK_SCAM_SCENARIOS } from './src/constants/mockScams';

export default function App() {
  // Core Campaign & Defense State
  const [campaignState, setCampaignState] = useState<CampaignState>(
    createInitialCampaignState()
  );
  const [activeScenarioTitle, setActiveScenarioTitle] = useState<string | null>(
    null
  );
  const [preCallAlert, setPreCallAlert] = useState<PreCallReputation | null>(null);

  // Settings & Configuration
  const [guardianPhone, setGuardianPhone] = useState<string>('+919876543210');
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [isSettingsVisible, setIsSettingsVisible] = useState<boolean>(false);
  const [isSimulationVisible, setIsSimulationVisible] = useState<boolean>(false);

  // Initial Auto-Analysis, Notification Reader, and Autonomous SMS Inbox Watcher
  useEffect(() => {
    runInitialBaseline();
    initializeNotificationReader();
    startAutonomousSmsMonitoring();
    startPreCallMonitoring();

    return () => {
      autonomousSmsWatcher.stopWatching();
      preCallSentinel.stopPreCallMonitoring();
    };
  }, []);

  const startPreCallMonitoring = async () => {
    await preCallSentinel.startPreCallMonitoring((alert: PreCallReputation) => {
      setPreCallAlert(alert);
    });
  };

  const startAutonomousSmsMonitoring = async () => {
    await autonomousSmsWatcher.startWatching(
      (event: DeviceEvent, report: ScamReport) => {
        setActiveScenarioTitle(`Live SMS: ${event.senderOrNumber}`);
        setCampaignState((prevState) =>
          updateCampaignState(prevState, [event], report)
        );

        if (report.is_scam && report.threat_level === 'CRITICAL') {
          Alert.alert(
            '⚠️ SCAM THREAT DETECTED BY AI',
            `SeniorShield AI analyzed an incoming message from ${event.senderOrNumber}.\n\nVerdict: ${report.senior_explanation}\n\nAction: ${report.action_required}`,
            [{ text: 'Understood & Shielded', style: 'default' }]
          );
        }
      },
      geminiApiKey
    );
  };

  const initializeNotificationReader = async () => {
    await requestNotificationPermissions();

    // Subscribe to incoming OS notifications
    const unsubscribe = setupNotificationListener(async (event: DeviceEvent) => {
      setActiveScenarioTitle(`Live Notification: ${event.senderOrNumber}`);

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
      }
    });

    return () => {
      unsubscribe();
    };
  };

  const runInitialBaseline = async () => {
    const defaultScenario = MOCK_SCAM_SCENARIOS[3]; // Safe Benchmark
    try {
      const initialReport = await analyzeMultiChannelCampaign(
        defaultScenario.events,
        geminiApiKey
      );
      setCampaignState(
        updateCampaignState(campaignState, defaultScenario.events, initialReport)
      );
      setActiveScenarioTitle(defaultScenario.title);
    } catch (e) {
      console.error('[App] Baseline initialization error:', e);
    }
  };

  /**
   * Executes a simulated mock scenario for hackathon presentations.
   */
  const handleSelectMockScenario = async (scenario: MockScenario) => {
    setActiveScenarioTitle(scenario.title);

    try {
      // If Pre-Call scenario, trigger pre-call reputation banner
      if (scenario.id === 'scenario_pre_call_scam') {
        const callAlert: PreCallReputation = {
          phoneNumber: '+91 98841 00999',
          callerName: '⚠️ FAKE TELECOM OFFICER (REPORTED)',
          spamScore: 98,
          threatCategory: 'CRITICAL_SCAM',
          impersonationTag: 'Fake TRAI / Telecom Official',
          seniorDirective: 'DO NOT ANSWER! Known scammer with 428 fraud reports. Let it ring.',
          isMultiChannelAttack: true,
          reportsCount: 428,
          trafficLight: 'RED',
        };
        setPreCallAlert(callAlert);
      } else {
        setPreCallAlert(null);
      }

      const report = await analyzeMultiChannelCampaign(
        scenario.events,
        geminiApiKey
      );
      setCampaignState(
        updateCampaignState(campaignState, scenario.events, report)
      );
    } catch (error) {
      console.error('[App] Simulation error:', error);
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
            {/* Live Autonomous Sentinel Active Pill */}
            <View style={styles.sentinelBanner}>
              <Radio size={14} color="#10B981" />
              <Text style={styles.sentinelText}>
                Autonomous Sentinel: <Text style={styles.sentinelHighlight}>Active (SMS & Pre-Call Guard)</Text>
              </Text>
            </View>

            {/* Pre-Call Incoming Scammer Alert Banner */}
            <PreCallAlertCard
              alert={preCallAlert}
              onDismiss={() => setPreCallAlert(null)}
              onBlockCaller={(number) => {
                setPreCallAlert(null);
                Alert.alert('Number Blocked', `${number} has been blocked and flagged in community database.`);
              }}
            />

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

            {/* Demo Hub Button */}
            <TouchableOpacity
              style={styles.demoHubButton}
              onPress={() => setIsSimulationVisible(true)}
              activeOpacity={0.88}
            >
              <Sparkles size={16} color="#B45309" />
              <Text style={styles.demoHubButtonText}>Demo Hub (Simulate Attack Vectors)</Text>
            </TouchableOpacity>

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
                  If left blank, SeniorShield uses the configured Gemini 3.5 Flash Lite engine.
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
  sentinelBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sentinelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  sentinelHighlight: {
    fontWeight: '900',
    color: '#15803D',
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
  demoHubButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 9999,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  demoHubButtonText: {
    color: '#1F1F1F',
    fontSize: 14,
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
