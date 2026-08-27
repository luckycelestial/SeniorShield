import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
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
      <View style={styles.backdrop}>
        <View style={styles.drawerContent}>
          {/* Drawer Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.sparkleBox}>
                <Sparkles size={20} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.drawerTitle}>Judge Demo & Simulation Hub</Text>
                <Text style={styles.drawerSubtitle}>Offline Social Engineering Scenarios</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.8}
            >
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.instructionsText}>
            Select any real-world Indian fraud scenario below to simulate live telemetry ingestion, multi-channel correlation, and Gemini 2.5 Flash reasoning:
          </Text>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.scenariosList}>
              {MOCK_SCAM_SCENARIOS.map((scenario) => {
                const isDanger = scenario.expectedThreatLevel === 'CRITICAL';

                return (
                  <TouchableOpacity
                    key={scenario.id}
                    style={[
                      styles.scenarioCard,
                      {
                        borderColor: isDanger
                          ? 'rgba(244, 63, 94, 0.4)'
                          : 'rgba(16, 185, 129, 0.4)',
                      },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => {
                      onSelectScenario(scenario);
                      onClose();
                    }}
                  >
                    {/* Scenario Top Title & Badge */}
                    <View style={styles.scenarioHeader}>
                      <View style={styles.scenarioTitleLeft}>
                        {isDanger ? (
                          <AlertTriangle size={18} color="#F43F5E" />
                        ) : (
                          <ShieldCheck size={18} color="#10B981" />
                        )}
                        <Text style={styles.scenarioTitle} numberOfLines={1}>
                          {scenario.title}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.threatTag,
                          {
                            backgroundColor: isDanger
                              ? 'rgba(136, 19, 55, 0.8)'
                              : 'rgba(6, 78, 59, 0.8)',
                            borderColor: isDanger
                              ? 'rgba(244, 63, 94, 0.6)'
                              : 'rgba(16, 185, 129, 0.6)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.threatTagText,
                            { color: isDanger ? '#FDA4AF' : '#A7F3D0' },
                          ]}
                        >
                          {scenario.expectedThreatLevel}
                        </Text>
                      </View>
                    </View>

                    {/* Category Label */}
                    <Text style={styles.categoryLabel}>{scenario.category}</Text>
                    <Text style={styles.descriptionText}>
                      {scenario.description}
                    </Text>

                    {/* Footer Row */}
                    <View style={styles.cardFooter}>
                      <View style={styles.eventsCountGroup}>
                        <Layers size={13} color="#94A3B8" />
                        <Text style={styles.eventsCountText}>
                          {scenario.events.length} Event(s) ({scenario.events.map((e) => e.type).join(' + ')})
                        </Text>
                      </View>

                      <View style={styles.simulateButton}>
                        <PlayCircle size={14} color="#FFFFFF" />
                        <Text style={styles.simulateButtonText}>Simulate</Text>
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  drawerContent: {
    backgroundColor: '#0B0F19',
    borderTopWidth: 2,
    borderTopColor: '#334155',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sparkleBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  drawerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionsText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 16,
    lineHeight: 18,
  },
  scrollView: {
    maxHeight: 500,
  },
  scenariosList: {
    gap: 12,
    paddingBottom: 24,
  },
  scenarioCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scenarioTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  scenarioTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  threatTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  threatTagText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#CBD5E1',
    lineHeight: 16,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 10,
  },
  eventsCountGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventsCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  simulateButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  simulateButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
