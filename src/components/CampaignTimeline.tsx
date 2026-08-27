import React from 'react';
import { Text, View } from 'react-native';
import { MessageSquare, PhoneIncoming, Clock, GitCommit, Flame } from 'lucide-react-native';
import { CampaignStage, DeviceEvent } from '../types/scam';

interface CampaignTimelineProps {
  events: DeviceEvent[];
  stage: CampaignStage;
}

export const CampaignTimeline: React.FC<CampaignTimelineProps> = ({ events, stage }) => {
  if (!events || events.length === 0) {
    return (
      <View className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 my-3 items-center justify-center">
        <Clock size={28} color="#64748B" />
        <Text className="text-slate-400 text-sm font-semibold mt-2">
          No recent threat events in timeline.
        </Text>
      </View>
    );
  }

  const getStageInfo = (currStage: CampaignStage) => {
    switch (currStage) {
      case 'EXTRACTION_ATTEMPT':
        return {
          label: 'CRITICAL ATTACK STAGE',
          textClass: 'text-rose-300',
          bgClass: 'bg-rose-950/60 border-rose-500/50',
          iconColor: '#F43F5E',
        };
      case 'URGENCY_ESCALATION':
        return {
          label: 'URGENCY ESCALATION',
          textClass: 'text-amber-300',
          bgClass: 'bg-amber-950/60 border-amber-500/50',
          iconColor: '#F59E0B',
        };
      case 'RECONNAISSANCE':
        return {
          label: 'INITIAL PROBING',
          textClass: 'text-sky-300',
          bgClass: 'bg-sky-950/60 border-sky-500/50',
          iconColor: '#38BDF8',
        };
      default:
        return {
          label: 'DORMANT / SAFE',
          textClass: 'text-emerald-300',
          bgClass: 'bg-emerald-950/60 border-emerald-500/50',
          iconColor: '#10B981',
        };
    }
  };

  const stageInfo = getStageInfo(stage);

  return (
    <View className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 my-3 shadow-lg">
      {/* Header Row */}
      <View className="flex-row items-center justify-between flex-wrap gap-2 mb-1.5">
        <View className="flex-row items-center gap-2">
          <GitCommit size={20} color="#38BDF8" />
          <Text className="text-lg font-black text-white">Campaign Progression Chain</Text>
        </View>

        <View className={`flex-row items-center gap-1.5 px-3 py-1 rounded-full border ${stageInfo.bgClass}`}>
          <Flame size={12} color={stageInfo.iconColor} />
          <Text className={`text-[10px] font-black tracking-wider ${stageInfo.textClass}`}>
            {stageInfo.label}
          </Text>
        </View>
      </View>

      <Text className="text-xs font-medium text-slate-400 mb-4 leading-5">
        Scammers coordinate across calls and SMS over time. Here is the chronological correlation:
      </Text>

      {/* Timeline Steps */}
      <View className="mt-1">
        {events.map((event, index) => {
          const isSMS = event.type === 'SMS';
          const timeAgoMins = Math.max(1, Math.round((Date.now() - event.timestamp) / (1000 * 60)));

          return (
            <View key={event.id || index} className="flex-row mb-3.5">
              {/* Left Step Node Column */}
              <View className="items-center mr-3 w-8">
                <View
                  className={`w-7 h-7 rounded-full items-center justify-center border ${
                    isSMS ? 'bg-sky-950 border-sky-500' : 'bg-rose-950 border-rose-500'
                  }`}
                >
                  <Text className={`text-xs font-black ${isSMS ? 'text-sky-300' : 'text-rose-300'}`}>
                    {index + 1}
                  </Text>
                </View>
                {index < events.length - 1 && (
                  <View className="w-0.5 flex-1 bg-slate-800 my-1 rounded-full" />
                )}
              </View>

              {/* Event Content Card */}
              <View className="flex-1 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3.5">
                <View className="flex-row justify-between items-center mb-1.5">
                  <View
                    className={`flex-row items-center gap-1.5 px-2.5 py-0.5 rounded-md ${
                      isSMS ? 'bg-sky-950/70 border border-sky-600/30' : 'bg-rose-950/70 border border-rose-600/30'
                    }`}
                  >
                    {isSMS ? (
                      <MessageSquare size={13} color="#38BDF8" />
                    ) : (
                      <PhoneIncoming size={13} color="#F43F5E" />
                    )}
                    <Text
                      className={`text-[11px] font-extrabold uppercase ${
                        isSMS ? 'text-sky-300' : 'text-rose-300'
                      }`}
                    >
                      {event.type}
                    </Text>
                  </View>
                  <Text className="text-[11px] font-semibold text-slate-400">{timeAgoMins}m ago</Text>
                </View>

                <Text className="text-xs font-bold text-slate-200 mb-1">
                  Sender: <Text className="text-sky-400">{event.senderOrNumber}</Text>
                </Text>
                <Text className="text-sm font-medium text-slate-300 leading-5">
                  {event.contentOrDuration}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};
