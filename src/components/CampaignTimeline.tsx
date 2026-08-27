import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MessageSquare, PhoneIncoming, Clock, AlertCircle } from 'lucide-react-native';
import { CampaignStage, DeviceEvent } from '../types/scam';

interface CampaignTimelineProps {
  events: DeviceEvent[];
  stage: CampaignStage;
}

export const CampaignTimeline: React.FC<CampaignTimelineProps> = ({ events, stage }) => {
  if (!events || events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Clock size={28} color="#64748B" />
        <Text style={styles.emptyText}>No recent threat events in timeline.</Text>
      </View>
    );
  }

  const getStageBadge = (currStage: CampaignStage) => {
    switch (currStage) {
      case 'EXTRACTION_ATTEMPT':
        return { label: 'CRITICAL ATTACK STAGE', color: '#DC2626', bg: '#450A0A' };
      case 'URGENCY_ESCALATION':
        return { label: 'URGENCY ESCALATION STAGE', color: '#D97706', bg: '#451A03' };
      case 'RECONNAISSANCE':
        return { label: 'PROBING / INITIAL CONTACT', color: '#3B82F6', bg: '#172554' };
      default:
        return { label: 'DORMANT / MONITORING', color: '#16A34A', bg: '#052E16' };
    }
  };

  const stageInfo = getStageBadge(stage);

  return (
    <View style={styles.container}>
      {/* Stage Header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Campaign Progression Chain</Text>
        <View style={[styles.stageBadge, { backgroundColor: stageInfo.bg, borderColor: stageInfo.color }]}>
          <AlertCircle size={14} color={stageInfo.color} />
          <Text style={[styles.stageText, { color: stageInfo.color }]}>{stageInfo.label}</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Scammers unfold multi-step campaigns across calls and messages. Here is how this sequence was correlated:
      </Text>

      {/* Sequential Event Nodes */}
      <View style={styles.timelineList}>
        {events.map((event, index) => {
          const isSMS = event.type === 'SMS';
          const timeAgoMins = Math.max(1, Math.round((Date.now() - event.timestamp) / (1000 * 60)));

          return (
            <View key={event.id || index} style={styles.timelineItem}>
              {/* Left Step Indicator */}
              <View style={styles.stepColumn}>
                <View style={[styles.stepCircle, { backgroundColor: isSMS ? '#3B82F6' : '#EF4444' }]}>
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                </View>
                {index < events.length - 1 && <View style={styles.stepLine} />}
              </View>

              {/* Event Content Card */}
              <View style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <View style={styles.channelTag}>
                    {isSMS ? (
                      <MessageSquare size={16} color="#93C5FD" />
                    ) : (
                      <PhoneIncoming size={16} color="#FCA5A5" />
                    )}
                    <Text style={[styles.channelText, { color: isSMS ? '#93C5FD' : '#FCA5A5' }]}>
                      {event.type}
                    </Text>
                  </View>
                  <Text style={styles.timeAgoText}>{timeAgoMins}m ago</Text>
                </View>

                <Text style={styles.senderText}>Sender: {event.senderOrNumber}</Text>
                <Text style={styles.contentText}>{event.contentOrDuration}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#334155',
    padding: 16,
    marginVertical: 10,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  stageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  stageText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 16,
    lineHeight: 20,
  },
  timelineList: {
    marginTop: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  stepColumn: {
    alignItems: 'center',
    marginRight: 12,
    width: 28,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#334155',
    marginVertical: 4,
  },
  eventCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  channelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  channelText: {
    fontSize: 13,
    fontWeight: '800',
  },
  timeAgoText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  senderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  contentText: {
    fontSize: 15,
    color: '#CBD5E1',
    lineHeight: 22,
  },
});
