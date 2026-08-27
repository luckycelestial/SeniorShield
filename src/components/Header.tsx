import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ShieldCheck, ShieldAlert, PhoneCall, SlidersHorizontal } from 'lucide-react-native';
import { ThreatLevel } from '../types/scam';

interface HeaderProps {
  threatLevel: ThreatLevel;
  onCallHelpline: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  threatLevel,
  onCallHelpline,
  onOpenSettings,
}) => {
  const isCritical = threatLevel === 'CRITICAL';
  const isSuspicious = threatLevel === 'SUSPICIOUS';

  return (
    <View className="bg-obsidian-950/95 pt-4 px-4 pb-3 border-b border-slate-800/80">
      {/* Top Brand Bar */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-3">
          <View
            className={`w-12 h-12 rounded-2xl items-center justify-center border shadow-lg ${
              isCritical
                ? 'bg-rose-950/70 border-rose-500/50'
                : isSuspicious
                ? 'bg-amber-950/70 border-amber-500/50'
                : 'bg-emerald-950/70 border-emerald-500/50'
            }`}
          >
            {isCritical ? (
              <ShieldAlert size={28} color="#F43F5E" />
            ) : (
              <ShieldCheck size={28} color="#10B981" />
            )}
          </View>
          <View>
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl font-black text-white tracking-tight">SeniorShield</Text>
              <View className="bg-indigo-950/80 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-bold text-indigo-300 tracking-wider">AI 2.5</Text>
              </View>
            </View>
            <Text className="text-xs font-semibold text-slate-400">Autonomous Scam Defense</Text>
          </View>
        </View>

        {/* Settings Pill */}
        <TouchableOpacity
          className="bg-slate-900/90 border border-slate-700/80 flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl active:bg-slate-800"
          onPress={onOpenSettings}
          accessibilityLabel="Setup & Guardian Config"
        >
          <SlidersHorizontal size={16} color="#38BDF8" />
          <Text className="text-xs font-bold text-slate-200">Setup</Text>
        </TouchableOpacity>
      </View>

      {/* Luminous Protection Status Pill */}
      <View
        className={`flex-row items-center justify-between py-2 px-3.5 rounded-xl border mb-2.5 ${
          isCritical
            ? 'bg-rose-950/40 border-rose-500/40'
            : isSuspicious
            ? 'bg-amber-950/40 border-amber-500/40'
            : 'bg-emerald-950/40 border-emerald-500/40'
        }`}
      >
        <View className="flex-row items-center gap-2.5">
          <View
            className={`w-2.5 h-2.5 rounded-full ${
              isCritical
                ? 'bg-rose-500 shadow-rose-500'
                : isSuspicious
                ? 'bg-amber-400 shadow-amber-400'
                : 'bg-emerald-400 shadow-emerald-400'
            }`}
          />
          <Text
            className={`text-sm font-extrabold tracking-wider ${
              isCritical
                ? 'text-rose-200'
                : isSuspicious
                ? 'text-amber-200'
                : 'text-emerald-200'
            }`}
          >
            {isCritical
              ? 'DANGER DETECTED'
              : isSuspicious
              ? 'CAUTION ADVISED'
              : 'SHIELD ACTIVE & MONITORING'}
          </Text>
        </View>
        <Text className="text-[11px] font-semibold text-slate-400">Live Guard</Text>
      </View>

      {/* Direct Cyber Helpline (1930) Bar */}
      <TouchableOpacity
        className="bg-gradient-to-r from-red-600 to-rose-700 bg-rose-600 flex-row items-center justify-center gap-2.5 py-2.5 rounded-xl border border-rose-400/40 active:opacity-90 shadow-md shadow-rose-900/50"
        onPress={onCallHelpline}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Call Cyber Crime Helpline 1930"
      >
        <PhoneCall size={20} color="#FFFFFF" />
        <Text className="text-white text-sm font-extrabold tracking-wide">
          Emergency Cyber Helpline (1930)
        </Text>
      </TouchableOpacity>
    </View>
  );
};
