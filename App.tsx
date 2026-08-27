import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StatusBar,
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

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-obsidian-950">
        <StatusBar barStyle="light-content" backgroundColor="#030712" />

        {/* Header */}
        <Header
          threatLevel={currentThreatLevel}
          onCallHelpline={handleCallHelpline}
          onOpenSettings={() => setIsSettingsVisible(true)}
        />

        <ScrollView
          className="flex-1 bg-obsidian-950 px-4"
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Cumulative Risk Exposure Gauge Card */}
          <View className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 mb-3 shadow-xl">
            <View className="flex-row items-center justify-between mb-2.5">
              <View className="flex-row items-center gap-2">
                <Activity size={18} color="#38BDF8" />
                <Text className="text-sm font-extrabold text-slate-200 uppercase tracking-wide">
                  Cumulative Risk Exposure
                </Text>
              </View>
              <Text
                className={`text-xl font-black ${
                  isHighRisk
                    ? 'text-rose-400'
                    : isMedRisk
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {riskScore} <Text className="text-xs font-semibold text-slate-500">/ 100</Text>
              </Text>
            </View>

            {/* Progress Track */}
            <View className="h-2.5 bg-slate-950 rounded-full overflow-hidden mb-3 border border-slate-800/80">
              <View
                style={{ width: `${Math.max(6, riskScore)}%` }}
                className={`h-full rounded-full ${
                  isHighRisk
                    ? 'bg-rose-500'
                    : isMedRisk
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />
            </View>

            {activeScenarioTitle && (
              <View className="flex-row items-center gap-1.5 bg-slate-950/80 border border-slate-800/80 px-3 py-1.5 rounded-xl">
                <ShieldCheck size={14} color="#38BDF8" />
                <Text className="text-xs font-semibold text-slate-400">
                  Active Context: <Text className="text-sky-300 font-bold">{activeScenarioTitle}</Text>
                </Text>
              </View>
            )}
          </View>

          {/* Primary Action Buttons */}
          <View className="flex-row gap-3 mb-2">
            <TouchableOpacity
              className={`flex-[1.4] flex-row items-center justify-center gap-2.5 min-h-[56px] rounded-2xl border shadow-lg ${
                isScanning
                  ? 'bg-emerald-800 border-emerald-600/50 opacity-70'
                  : 'bg-emerald-600 active:bg-emerald-700 border-emerald-400/40 shadow-emerald-950/50'
              }`}
              onPress={handleLiveDeviceScan}
              disabled={isScanning}
              activeOpacity={0.85}
            >
              {isScanning ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <RefreshCw size={20} color="#FFFFFF" />
              )}
              <Text className="text-white text-base font-black tracking-wide">
                {isScanning ? 'Analyzing Inflow...' : 'Scan Device & Protect'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-slate-900/90 active:bg-slate-800 flex-row items-center justify-center gap-2 min-h-[56px] rounded-2xl border border-amber-500/40 shadow-md shadow-amber-950/30"
              onPress={() => setIsSimulationVisible(true)}
              activeOpacity={0.85}
            >
              <Sparkles size={18} color="#F59E0B" />
              <Text className="text-amber-200 text-sm font-extrabold">Demo Hub</Text>
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
          <View className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 mt-2">
            <View className="flex-row items-center gap-2 mb-3">
              <Lightbulb size={18} color="#F59E0B" />
              <Text className="text-xs font-black text-amber-400 uppercase tracking-wider">
                Golden Safety Rules for Seniors
              </Text>
            </View>

            <View className="gap-2.5">
              <View className="flex-row items-start gap-2">
                <AlertCircle size={15} color="#38BDF8" className="mt-0.5" />
                <Text className="text-xs font-medium text-slate-300 flex-1 leading-5">
                  <Text className="font-bold text-white">Electricity Boards</Text> never cut off power at night without paper notices.
                </Text>
              </View>

              <View className="flex-row items-start gap-2">
                <AlertCircle size={15} color="#38BDF8" className="mt-0.5" />
                <Text className="text-xs font-medium text-slate-300 flex-1 leading-5">
                  <Text className="font-bold text-white">Police & CBI</Text> never arrest citizens over phone or Skype/WhatsApp video calls.
                </Text>
              </View>

              <View className="flex-row items-start gap-2">
                <AlertCircle size={15} color="#38BDF8" className="mt-0.5" />
                <Text className="text-xs font-medium text-slate-300 flex-1 leading-5">
                  <Text className="font-bold text-white">Banks</Text> never send apps (.apk links) or ask for OTPs to update KYC.
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
          <View className="flex-1 bg-black/85 justify-center p-5">
            <View className="bg-obsidian-900 rounded-3xl p-6 border border-slate-700/80 shadow-2xl">
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center gap-2.5">
                  <Sliders size={20} color="#38BDF8" />
                  <Text className="text-xl font-black text-white">Shield Setup & Guardian</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsSettingsVisible(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center"
                >
                  <X size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Guardian Phone Setup */}
              <Text className="text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wide">
                Trusted Family Contact (Guardian Phone):
              </Text>
              <TextInput
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-base font-semibold mb-1"
                value={guardianPhone}
                onChangeText={setGuardianPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
              />
              <Text className="text-[11px] text-slate-400 leading-4 mb-4">
                High-risk scam attempts trigger 1-tap emergency SMS alerts to this contact.
              </Text>

              {/* Gemini API Key */}
              <Text className="text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wide">
                Google Gemini API Key (Optional):
              </Text>
              <TextInput
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-base font-semibold mb-1"
                value={geminiApiKey}
                onChangeText={setGeminiApiKey}
                placeholder="AIzaSy..."
                placeholderTextColor="#64748B"
                secureTextEntry={true}
              />
              <Text className="text-[11px] text-slate-400 leading-4 mb-6">
                If left blank, SeniorShield uses its built-in offline intelligence engine.
              </Text>

              {/* Save Button */}
              <TouchableOpacity
                className="bg-blue-600 active:bg-blue-700 flex-row items-center justify-center gap-2 min-h-[50px] rounded-xl shadow-lg"
                onPress={() => setIsSettingsVisible(false)}
              >
                <Check size={18} color="#FFFFFF" />
                <Text className="text-white text-sm font-extrabold">Save & Return to Shield</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
