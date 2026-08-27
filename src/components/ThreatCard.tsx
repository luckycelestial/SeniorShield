import React from 'react';
import {
  Alert,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertTriangle,
  CheckCircle,
  AlertOctagon,
  Shield,
  BellRing,
  Ban,
  Building2,
  Lock,
} from 'lucide-react-native';
import { ScamReport } from '../types/scam';

interface ThreatCardProps {
  report: ScamReport | null;
  guardianPhone: string;
  onBlockNumber?: () => void;
}

export const ThreatCard: React.FC<ThreatCardProps> = ({
  report,
  guardianPhone,
  onBlockNumber,
}) => {
  if (!report) {
    return (
      <View className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 my-3 items-center">
        <View className="w-16 h-16 rounded-full bg-slate-800/80 items-center justify-center mb-3">
          <Shield size={34} color="#94A3B8" />
        </View>
        <Text className="text-xl font-bold text-slate-100">Ready to Scan</Text>
        <Text className="text-sm font-medium text-slate-400 text-center mt-2 leading-5 px-3">
          Tap "Scan Device & Protect" below or launch a simulation from the Demo Hub to analyze recent calls and messages.
        </Text>
      </View>
    );
  }

  const isCritical = report.threat_level === 'CRITICAL';
  const isSuspicious = report.threat_level === 'SUSPICIOUS';
  const isSafe = report.threat_level === 'SAFE';

  const handleAlertGuardian = () => {
    const alertMessage =
      report.guardian_alert_message ||
      `SeniorShield Alert: We detected a potential scam attempt (${report.scam_type}). Please check on your family member.`;
    const targetUrl = `sms:${guardianPhone}?body=${encodeURIComponent(alertMessage)}`;
    Linking.openURL(targetUrl).catch(() => {
      Alert.alert(
        'Guardian SMS Alert',
        `Message for Guardian (${guardianPhone}):\n\n${alertMessage}`
      );
    });
  };

  const handleBlockNumber = () => {
    if (onBlockNumber) {
      onBlockNumber();
    }
    Alert.alert(
      'Security Action Completed',
      'The sender number has been added to your local blocklist and suspicious link access has been restricted.'
    );
  };

  return (
    <View
      className={`rounded-3xl p-5 my-3 border ${
        isCritical
          ? 'bg-rose-950/30 border-rose-500/50 shadow-xl shadow-rose-950/40'
          : isSuspicious
          ? 'bg-amber-950/30 border-amber-500/50 shadow-xl shadow-amber-950/40'
          : 'bg-emerald-950/30 border-emerald-500/50 shadow-xl shadow-emerald-950/40'
      }`}
    >
      {/* Top Header: Badge & Confidence */}
      <View className="flex-row items-center justify-between mb-3.5">
        <View
          className={`flex-row items-center gap-2 px-3.5 py-1.5 rounded-full border ${
            isCritical
              ? 'bg-rose-500/20 border-rose-500/40'
              : isSuspicious
              ? 'bg-amber-500/20 border-amber-500/40'
              : 'bg-emerald-500/20 border-emerald-500/40'
          }`}
        >
          {isCritical && <AlertOctagon size={20} color="#F43F5E" />}
          {isSuspicious && <AlertTriangle size={20} color="#F59E0B" />}
          {isSafe && <CheckCircle size={20} color="#10B981" />}
          <Text
            className={`text-xs font-black tracking-wider ${
              isCritical
                ? 'text-rose-300'
                : isSuspicious
                ? 'text-amber-300'
                : 'text-emerald-300'
            }`}
          >
            {report.threat_level} THREAT
          </Text>
        </View>

        <View className="bg-slate-900/90 border border-slate-700/60 px-3 py-1 rounded-full">
          <Text className="text-xs font-bold text-slate-300">{report.confidence_score}% Confidence</Text>
        </View>
      </View>

      {/* Scam Category Title */}
      <Text className="text-2xl font-black text-white leading-tight mb-3">
        {report.scam_type}
      </Text>

      {/* Impersonated Entity Banner */}
      {report.impersonated_entity && report.impersonated_entity !== 'None' && (
        <View className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3 flex-row items-center gap-2.5 mb-3.5">
          <Building2 size={20} color="#38BDF8" />
          <View className="flex-1">
            <Text className="text-[11px] font-bold text-sky-400 uppercase tracking-wide">
              Impersonated Entity
            </Text>
            <Text className="text-sm font-bold text-slate-100">{report.impersonated_entity}</Text>
          </View>
        </View>
      )}

      {/* Senior Plain Language Explanation Box */}
      <View className="bg-slate-900/95 border border-slate-800/80 rounded-2xl p-4 mb-3.5">
        <Text className="text-[11px] font-black text-sky-400 tracking-wider uppercase mb-1.5">
          What this means for you:
        </Text>
        <Text className="text-lg font-bold text-slate-100 leading-6">
          {report.senior_explanation}
        </Text>
      </View>

      {/* Action Directive Box */}
      <View
        className={`rounded-2xl p-4 border-l-4 mb-3.5 ${
          isCritical
            ? 'bg-rose-950/40 border-rose-500'
            : isSuspicious
            ? 'bg-amber-950/40 border-amber-500'
            : 'bg-emerald-950/40 border-emerald-500'
        }`}
      >
        <Text
          className={`text-xs font-black tracking-wider uppercase mb-1 ${
            isCritical ? 'text-rose-300' : isSuspicious ? 'text-amber-300' : 'text-emerald-300'
          }`}
        >
          ⚡ What you must do now:
        </Text>
        <Text className="text-lg font-extrabold text-white leading-6">
          {report.action_required}
        </Text>
      </View>

      {/* Targeted Assets Chips */}
      {report.assets_at_risk && report.assets_at_risk.length > 0 && (
        <View className="mb-4">
          <View className="flex-row items-center gap-1.5 mb-2">
            <Lock size={14} color="#CBD5E1" />
            <Text className="text-xs font-bold text-slate-300">Targeted Assets at Stake:</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {report.assets_at_risk.map((asset, idx) => (
              <View
                key={idx}
                className="bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-xl flex-row items-center gap-1.5"
              >
                <Text className="text-xs font-bold text-amber-200">⚠️ {asset}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      {(isCritical || isSuspicious) && (
        <View className="gap-2.5 mt-1">
          <TouchableOpacity
            className="bg-rose-600 active:bg-rose-700 flex-row items-center justify-center gap-2.5 min-h-[54px] rounded-2xl border border-rose-400/40 shadow-lg shadow-rose-950/60"
            onPress={handleBlockNumber}
            activeOpacity={0.85}
          >
            <Ban size={22} color="#FFFFFF" />
            <Text className="text-white text-base font-black tracking-wide">
              Hang Up & Block Sender
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-blue-600 active:bg-blue-700 flex-row items-center justify-center gap-2.5 min-h-[54px] rounded-2xl border border-blue-400/40 shadow-lg shadow-blue-950/60"
            onPress={handleAlertGuardian}
            activeOpacity={0.85}
          >
            <BellRing size={22} color="#FFFFFF" />
            <Text className="text-white text-base font-black tracking-wide">
              Alert Family Guardian (SMS)
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
