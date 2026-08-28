import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MessageSquare, PhoneIncoming, Clock, GitCommit, Flame } from 'lucide-react-native';
import { CampaignStage, DeviceEvent } from '../types/scam';

interface CampaignTimelineProps {
  events: DeviceEvent[];
  stage: CampaignStage;
  onSelectCallEvent?: (event: DeviceEvent) => void;
}

export const CampaignTimeline: React.FC<CampaignTimelineProps> = ({ events, stage, onSelectCallEvent }) => {
  if (!events || events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Clock size={26} color="#8E8E93" />
        <Text style={styles.emptyText}>
          No recent threat events in timeline.
        </Text>
      </View>
    );
  }

  // Solid semantic stage badge colors
  const getStageInfo = (currStage: CampaignStage) => {
    switch (currStage) {
      case 'EXTRACTION_ATTEMPT':
        return {
          label: 'CRITICAL ATTACK STAGE',
          bgColor: '#FF383C', // Solid Red
          textColor: '#FFFFFF',
          iconColor: '#FFFFFF',
        };
      case 'URGENCY_ESCALATION':
        return {
          label: 'URGENCY ESCALATION',
          bgColor: '#F59E0B', // Solid Amber
          textColor: '#FFFFFF',
          iconColor: '#FFFFFF',
        };
      case 'RECONNAISSANCE':
        return {
          label: 'INITIAL PROBING',
          bgColor: '#0284C7', // Solid Sky Blue
          textColor: '#FFFFFF',
          iconColor: '#FFFFFF',
        };
      default:
        return {
          label: 'DORMANT / SAFE',
          bgColor: '#10B981', // Solid Emerald
          textColor: '#FFFFFF',
          iconColor: '#FFFFFF',
        };
    }
  };

  const stageInfo = getStageInfo(stage);

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <GitCommit size={18} color="#1F1F1F" />
          <Text style={styles.sectionTitle}>Campaign Progression Chain</Text>
        </View>

        {/* Solid Stage Pill */}
        <View
          style={[
            styles.stageBadge,
            { backgroundColor: stageInfo.bgColor },
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
                      backgroundColor: isSMS ? '#0284C7' : '#FF383C',
                    },
                  ]}
                >
                  <Text style={styles.nodeNumber}>{index + 1}</Text>
                </View>
                {index < events.length - 1 && <View style={styles.connectorLine} />}
              </View>

              {/* Event Content Card */}
              <View style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  {/* Solid Event Type Pill */}
                  <View
                    style={[
                      styles.eventTypeBadge,
                      {
                        backgroundColor: isSMS ? '#0284C7' : '#FF383C',
                      },
                    ]}
                  >
                    {isSMS ? (
                      <MessageSquare size={12} color="#FFFFFF" />
                    ) : (
                      <PhoneIncoming size={12} color="#FFFFFF" />
                    )}
                    <Text style={styles.eventTypeText}>
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

                {!isSMS && onSelectCallEvent && (
                  <TouchableOpacity
                    style={styles.debriefButton}
                    onPress={() => onSelectCallEvent(event)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.debriefButtonText}>View Post-Call Debrief & Transcript →</Text>
                  </TouchableOpacity>
                )}
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 24,
    padding: 24,
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 24,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1F1F1F',
  },
  stageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  stageBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 14,
    lineHeight: 17,
  },
  timelineList: {
    marginTop: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  nodeColumn: {
    alignItems: 'center',
    marginRight: 10,
    width: 28,
  },
  nodeCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeNumber: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  connectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E6E6E6',
    marginVertical: 3,
    borderRadius: 1,
  },
  eventCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 16,
    padding: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  eventTypeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  timeAgoText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
  },
  senderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F1F1F',
    marginBottom: 3,
  },
  senderHighlight: {
    color: '#1F1F1F',
    fontWeight: '800',
  },
  contentDetailsText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F1F1F',
    lineHeight: 18,
  },
  debriefButton: {
    marginTop: 8,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  debriefButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E11D48',
  },
});
