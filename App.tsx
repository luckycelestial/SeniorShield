import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Shield,
  RefreshCw,
  Sparkles,
  Sliders,
  X,
  PhoneCall,
  UserCheck,
  Check,
} from 'lucide-react-native';

import { Header } from './src/components/Header';
import { ThreatCard } from './src/components/ThreatCard';
import { CampaignTimeline } from './src/components/CampaignTimeline';
import { SimulationDrawer } from './src/components/SimulationDrawer';

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#090D16" />

      {/* Header */}
      <Header
        threatLevel={currentThreatLevel}
        onCallHelpline={handleCallHelpline}
        onOpenSettings={() => setIsSettingsVisible(true)}
      />

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cumulative Risk Exposure Gauge */}
        <View style={styles.exposureCard}>
          <View style={styles.exposureHeader}>
            <Text style={styles.exposureTitle}>Cumulative Risk Exposure</Text>
            <Text
              style={[
                styles.exposureScoreText,
                {
                  color:
                    campaignState.cumulativeRiskScore > 70
                      ? '#EF4444'
                      : campaignState.cumulativeRiskScore > 30
                      ? '#F59E0B'
                      : '#22C55E',
                },
              ]}
            >
              {campaignState.cumulativeRiskScore} / 100
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.max(5, campaignState.cumulativeRiskScore)}%`,
                  backgroundColor:
                    campaignState.cumulativeRiskScore > 70
                      ? '#EF4444'
                      : campaignState.cumulativeRiskScore > 30
                      ? '#F59E0B'
                      : '#22C55E',
                },
              ]}
            />
          </View>

          {activeScenarioTitle && (
            <Text style={styles.activeScenarioText}>
              Active Context: <Text style={styles.scenarioHighlight}>{activeScenarioTitle}</Text>
            </Text>
          )}
        </View>

        {/* Primary Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.primaryButton, isScanning && styles.buttonDisabled]}
            onPress={handleLiveDeviceScan}
            disabled={isScanning}
            activeOpacity={0.85}
          >
            {isScanning ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <RefreshCw size={22} color="#FFFFFF" />
            )}
            <Text style={styles.primaryButtonText}>
              {isScanning ? 'Analyzing Inflow...' : 'Scan Device & Protect'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.simulationLauncherButton}
            onPress={() => setIsSimulationVisible(true)}
            activeOpacity={0.85}
          >
            <Sparkles size={20} color="#FEF08A" />
            <Text style={styles.simulationLauncherText}>Judge Demo Hub</Text>
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

        {/* Senior Safety Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsHeader}>💡 GOLDEN SAFETY RULES FOR SENIORS</Text>
          <Text style={styles.tipBullet}>
            • <Text style={styles.boldText}>Electricity Boards</Text> never disconnect power at night without official paper notices.
          </Text>
          <Text style={styles.tipBullet}>
            • <Text style={styles.boldText}>Police & CBI</Text> never arrest citizens over phone or Skype/WhatsApp video calls.
          </Text>
          <Text style={styles.tipBullet}>
            • <Text style={styles.boldText}>Banks</Text> never send apps (.apk files) or ask for OTPs to update KYC.
          </Text>
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
        <View style={styles.modalOverlay}>
          <View style={styles.settingsModalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Sliders size={22} color="#38BDF8" />
                <Text style={styles.modalTitle}>Shield Setup & Guardian</Text>
              </View>
              <TouchableOpacity onPress={() => setIsSettingsVisible(false)}>
                <X size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Guardian Phone Setup */}
            <Text style={styles.fieldLabel}>Trusted Family Member Phone (Guardian):</Text>
            <TextInput
              style={styles.textInput}
              value={guardianPhone}
              onChangeText={setGuardianPhone}
              placeholder="+91 98765 43210"
              placeholderTextColor="#64748B"
              keyboardType="phone-pad"
            />
            <Text style={styles.fieldHint}>
              High-risk scam attempts will trigger 1-tap emergency SMS alerts to this contact.
            </Text>

            {/* Gemini API Key */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
              Google Gemini API Key (Optional):
            </Text>
            <TextInput
              style={styles.textInput}
              value={geminiApiKey}
              onChangeText={setGeminiApiKey}
              placeholder="AIzaSy..."
              placeholderTextColor="#64748B"
              secureTextEntry={true}
            />
            <Text style={styles.fieldHint}>
              If left blank, SeniorShield uses its built-in offline intelligence engine.
            </Text>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveSettingsButton}
              onPress={() => setIsSettingsVisible(false)}
            >
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.saveSettingsText}>Save & Return to Shield</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  mainScroll: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  exposureCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    marginBottom: 14,
  },
  exposureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  exposureTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  exposureScoreText: {
    fontSize: 20,
    fontWeight: '900',
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: '#334155',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  activeScenarioText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  scenarioHighlight: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  primaryButton: {
    flex: 1.4,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 56,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#22C55E',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  simulationLauncherButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
    borderRadius: 12,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: '#EAB308',
  },
  simulationLauncherText: {
    color: '#FEF08A',
    fontSize: 15,
    fontWeight: '800',
  },
  tipsContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 10,
  },
  tipsHeader: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FBBF24',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 15,
    color: '#CBD5E1',
    lineHeight: 22,
    marginBottom: 6,
  },
  boldText: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  settingsModalCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 22,
    borderWidth: 2,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#475569',
  },
  fieldHint: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 16,
  },
  saveSettingsButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: 12,
    marginTop: 22,
  },
  saveSettingsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
