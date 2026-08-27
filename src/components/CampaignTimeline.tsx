import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MessageSquare, PhoneIncoming, Clock, GitCommit, Flame } from 'lucide-react-native';
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
        <Text style={styles.emptyText}>
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
          textColor: '#FDA4AF',
          bgColor: 'rgba(76, 5, 25, 0.6)',
          borderColor: 'rgba(244, 63, 94, 0.5)',
          iconColor: '#F43F5E',
        };
      case 'URGENCY_ESCALATION':
        return {
          label: 'URGENCY ESCALATION',
          textColor: '#FDE68A',
          bgColor: 'rgba(69, 36, 6, 0.6)',
          borderColor: 'rgba(245, 158, 11, 0.5)',
          iconColor: '#F59E0B',
        };
      case 'RECONNAISSANCE':
        return {
          label: 'INITIAL PROBING',
          textColor: '#BAE6FD',
          bgColor: 'rgba(12, 74, 110, 0.6)',
          borderColor: 'rgba(56, 189, 248, 0.5)',
          iconColor: '#38BDF8',
        };
      default:
        return {
          label: 'DORMANT / SAFE',
          textColor: '#A7F3D0',
          bgColor: 'rgba(6, 78, 59, 0.6)',
          borderColor: 'rgba(16, 185, 129, 0.5)',
          iconColor: '#10B981',
        };
    }
  };

  const stageInfo = getStageInfo(stage);

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <GitCommit size={20} color="#38BDF8" />
          <Text style={styles.sectionTitle}>Campaign Progression Chain</Text>
        </View>

        <View
          style={[
            styles.stageBadge,
            {
              backgroundColor: stageInfo.bgColor,
              borderColor: stageInfo.borderColor,
            },
          ]}
        >
          <Flame size={12} color={stageInfo.iconColor} />
          <Text style={[styles.stageBadgeText, { color: stageInfo.textColor }]}>
            {stageInfo.label}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionSubtitle}>
        Scammers coordinate across calls and SMS over time. Here is the chronological correlation:
      </Text>

      {/* Timeline Steps */}
      <View style={styles.timelineList}>
        {events.map((event, index) => {
          const isSMS = event.type === 'SMS';
          const timeAgoMins = Math.max(
            1,
            Math.round((Date.now() - event.timestamp) / (1000 * 60))
          );

          return (
            <View key={event.id || index} style={styles.timelineItem}>
              {/* Left Step Node Column */}
              <View style={styles.nodeColumn}>
                <View
                  style={[
                    styles.nodeCircle,
                    {
                      backgroundColor: isSMS ? '#082F49' : '#4C0519',
                      borderColor: isSMS ? '#0EA5E9' : '#F43F5E',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.nodeNumber,
                      { color: isSMS ? '#7DD3FC' : '#FDA4AF' },
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                {index < events.length - 1 && <View style={styles.connectorLine} />}
              </View>

              {/* Event Content Card */}
              <View style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <View
                    style={[
                      styles.eventTypeBadge,
                      {
                        backgroundColor: isSMS
                          ? 'rgba(8, 47, 73, 0.7)'
                          : 'rgba(76, 5, 25, 0.7)',
                        borderColor: isSMS
                          ? 'rgba(14, 165, 233, 0.3)'
                          : 'rgba(244, 63, 94, 0.3)',
                      },
                    ]}
                  >
                    {isSMS ? (
                      <MessageSquare size={13} color="#38BDF8" />
                    ) : (
                      <PhoneIncoming size={13} color="#F43F5E" />
                    )}
                    <Text
                      style={[
                        styles.eventTypeText,
                        { color: isSMS ? '#7DD3FC' : '#FDA4AF' },
                      ]}
                    >
                      {event.type}
                    </Text>
                  </View>
                  <Text style={styles.timeAgoText}>{timeAgoMins}m ago</Text>
                </View>

                <Text style={styles.senderText}>
                  Sender: <Text style={styles.senderHighlight}>{event.senderOrNumber}</Text>
                </Text>
                <Text style={styles.contentDetailsText}>
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

const styles = StyleSheet.create({
  emptyContainer: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    marginVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  container: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  stageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  stageBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 16,
    lineHeight: 18,
  },
  timelineList: {
    marginTop: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  nodeColumn: {
    alignItems: 'center',
    marginRight: 12,
    width: 32,
  },
  nodeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  nodeNumber: {
    fontSize: 12,
    fontWeight: '900',
  },
  connectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#1E293B',
    marginVertical: 4,
    borderRadius: 1,
  },
  eventCard: {
    flex: 1,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  eventTypeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeAgoText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  senderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 4,
  },
  senderHighlight: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  contentDetailsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CBD5E1',
    lineHeight: 20,
  },
});
