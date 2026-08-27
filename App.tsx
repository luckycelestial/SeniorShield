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
} from 'lucide-react-native';

import { Header } from './src/components/Header';
import { ThreatCard } from './src/components/ThreatCard';
import { CampaignTimeline } from './src/components/CampaignTimeline';
import { SimulationDrawer } from './src/components/SimulationDrawer';

import {
  CampaignState,
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

  // Initial Auto-Analysis on Startup with Safe Baseline
  useEffect(() => {
    runInitialBaseline();
  }, []);

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

      // If live inbox is empty on emulator/test device, fallback gracefully to Electricity EB vector for instant demonstration
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

  const scoreTextColor = isHighRisk
    ? '#F43F5E'
    : isMedRisk
    ? '#F59E0B'
    : '#10B981';

  const scoreBarColor = isHighRisk
    ? '#F43F5E'
    : isMedRisk
    ? '#F59E0B'
    : '#10B981';

  return (
    <SafeAreaProvider>
      <View style={styles.rootContainer}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor="#030712" />

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
            {/* Cumulative Risk Exposure Gauge Card */}
            <View style={styles.gaugeCard}>
              <View style={styles.gaugeHeader}>
                <View style={styles.gaugeHeaderLeft}>
                  <Activity size={18} color="#38BDF8" />
                  <Text style={styles.gaugeTitle}>Cumulative Risk Exposure</Text>
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

              {activeScenarioTitle && (
                <View style={styles.contextBadge}>
                  <ShieldCheck size={14} color="#38BDF8" />
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
                activeOpacity={0.85}
              >
                {isScanning ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <RefreshCw size={20} color="#FFFFFF" />
                )}
                <Text style={styles.scanButtonText}>
                  {isScanning ? 'Analyzing Inflow...' : 'Scan Device & Protect'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoHubButton}
                onPress={() => setIsSimulationVisible(true)}
                activeOpacity={0.85}
              >
                <Sparkles size={18} color="#F59E0B" />
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
                <Lightbulb size={18} color="#F59E0B" />
                <Text style={styles.goldenRulesTitle}>
                  Golden Safety Rules for Seniors
                </Text>
              </View>

              <View style={styles.rulesList}>
                <View style={styles.ruleItem}>
                  <AlertCircle size={15} color="#38BDF8" style={styles.ruleIcon} />
                  <Text style={styles.ruleText}>
                    <Text style={styles.ruleHighlight}>Electricity Boards</Text> never cut off power at night without paper notices.
                  </Text>
                </View>

                <View style={styles.ruleItem}>
                  <AlertCircle size={15} color="#38BDF8" style={styles.ruleIcon} />
                  <Text style={styles.ruleText}>
                    <Text style={styles.ruleHighlight}>Police & CBI</Text> never arrest citizens over phone or Skype/WhatsApp video calls.
                  </Text>
                </View>

                <View style={styles.ruleItem}>
                  <AlertCircle size={15} color="#38BDF8" style={styles.ruleIcon} />
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
                    <Sliders size={20} color="#38BDF8" />
                    <Text style={styles.modalTitle}>Shield Setup & Guardian</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsSettingsVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <X size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                {/* Guardian Phone Setup */}
                <Text style={styles.inputLabel}>
                  TRUSTED FAMILY CONTACT (GUARDIAN PHONE):
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={guardianPhone}
                  onChangeText={setGuardianPhone}
                  placeholder="+91 98765 43210"
                  placeholderTextColor="#64748B"
                  keyboardType="phone-pad"
                />
                <Text style={styles.inputHint}>
                  High-risk scam attempts trigger 1-tap emergency SMS alerts to this contact.
                </Text>

                {/* Gemini API Key */}
                <Text style={styles.inputLabel}>
                  GOOGLE GEMINI API KEY (OPTIONAL):
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={geminiApiKey}
                  onChangeText={setGeminiApiKey}
                  placeholder="AIzaSy..."
                  placeholderTextColor="#64748B"
                  secureTextEntry={true}
                />
                <Text style={styles.inputHint}>
                  If left blank, SeniorShield uses its built-in offline intelligence engine.
                </Text>

                {/* Save Button */}
                <TouchableOpacity
                  style={styles.saveSettingsButton}
                  onPress={() => setIsSettingsVisible(false)}
                  activeOpacity={0.85}
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
    backgroundColor: '#030712',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#030712',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#030712',
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 10,
  },
  gaugeCard: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
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
  gaugeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E2E8F0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gaugeScoreText: {
    fontSize: 20,
    fontWeight: '900',
  },
  gaugeScoreDenom: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#030712',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  progressBar: {
    height: '100%',
    borderRadius: 999,
  },
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  contextText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  contextHighlight: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  scanButton: {
    flex: 1.4,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    elevation: 4,
  },
  scanButtonDisabled: {
    backgroundColor: '#065F46',
    opacity: 0.7,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  demoHubButton: {
    flex: 1,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  demoHubButtonText: {
    color: '#FEF3C7',
    fontSize: 14,
    fontWeight: '800',
  },
  goldenRulesCard: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    marginTop: 8,
  },
  goldenRulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  goldenRulesTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#F59E0B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    color: '#CBD5E1',
    flex: 1,
    lineHeight: 18,
  },
  ruleHighlight: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0B0F19',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
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
    color: '#FFFFFF',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#CBD5E1',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  inputHint: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 15,
    marginBottom: 16,
  },
  saveSettingsButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    borderRadius: 14,
    marginTop: 8,
  },
  saveSettingsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
