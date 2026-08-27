import React from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PlayCircle, X, Sparkles, AlertTriangle, ShieldCheck, Layers } from 'lucide-react-native';
import { MOCK_SCAM_SCENARIOS } from '../constants/mockScams';
import { MockScenario } from '../types/scam';

interface SimulationDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelectScenario: (scenario: MockScenario) => void;
}

export const SimulationDrawer: React.FC<SimulationDrawerProps> = ({
  visible,
  onClose,
  onSelectScenario,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/85 justify-end">
        <View className="bg-obsidian-900 border-t-2 border-slate-700/80 rounded-t-[32px] max-h-[85%] p-5 shadow-2xl">
          {/* Drawer Header */}
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2.5">
              <View className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 items-center justify-center">
                <Sparkles size={20} color="#F59E0B" />
              </View>
              <View>
                <Text className="text-xl font-black text-white">Judge Demo & Simulation Hub</Text>
                <Text className="text-[11px] font-semibold text-slate-400">Offline Social Engineering Scenarios</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-slate-800/80 items-center justify-center active:bg-slate-700"
            >
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text className="text-xs font-medium text-slate-400 mb-4 leading-5">
            Select any real-world Indian fraud scenario below to simulate live telemetry ingestion, multi-channel correlation, and Gemini 2.5 Flash reasoning:
          </Text>

          <ScrollView className="max-h-[500px]" showsVerticalScrollIndicator={false}>
            <View className="gap-3 pb-6">
              {MOCK_SCAM_SCENARIOS.map((scenario) => {
                const isDanger = scenario.expectedThreatLevel === 'CRITICAL';

                return (
                  <TouchableOpacity
                    key={scenario.id}
                    className={`rounded-2xl p-4 border active:scale-[0.99] ${
                      isDanger
                        ? 'bg-slate-900/90 border-rose-500/40 shadow-md shadow-rose-950/30'
                        : 'bg-slate-900/90 border-emerald-500/40 shadow-md shadow-emerald-950/30'
                    }`}
                    activeOpacity={0.85}
                    onPress={() => {
                      onSelectScenario(scenario);
                      onClose();
                    }}
                  >
                    {/* Scenario Top Title & Badge */}
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center gap-2 flex-1 pr-2">
                        {isDanger ? (
                          <AlertTriangle size={18} color="#F43F5E" />
                        ) : (
                          <ShieldCheck size={18} color="#10B981" />
                        )}
                        <Text className="text-base font-extrabold text-white flex-1" numberOfLines={1}>
                          {scenario.title}
                        </Text>
                      </View>
                      <View
                        className={`px-2.5 py-0.5 rounded-full border ${
                          isDanger
                            ? 'bg-rose-950/80 border-rose-500/60'
                            : 'bg-emerald-950/80 border-emerald-500/60'
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-black tracking-wider ${
                            isDanger ? 'text-rose-300' : 'text-emerald-300'
                          }`}
                        >
                          {scenario.expectedThreatLevel}
                        </Text>
                      </View>
                    </View>

                    {/* Category Label */}
                    <Text className="text-xs font-bold text-sky-400 mb-1.5">{scenario.category}</Text>
                    <Text className="text-xs font-medium text-slate-300 leading-4 mb-3">
                      {scenario.description}
                    </Text>

                    {/* Footer Row */}
                    <View className="flex-row items-center justify-between border-t border-slate-800/80 pt-2.5">
                      <View className="flex-row items-center gap-1.5">
                        <Layers size={13} color="#94A3B8" />
                        <Text className="text-[11px] font-semibold text-slate-400">
                          {scenario.events.length} Event(s) ({scenario.events.map((e) => e.type).join(' + ')})
                        </Text>
                      </View>

                      <View className="bg-blue-600 flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl shadow-sm">
                        <PlayCircle size={14} color="#FFFFFF" />
                        <Text className="text-white text-xs font-extrabold">Simulate</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
