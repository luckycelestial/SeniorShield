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
                <Sparkles size={18} color="#B45309" />
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
              <X size={18} color="#8E8E93" />
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
                        borderColor: isDanger ? '#FECACA' : '#A7F3D0',
                      },
                    ]}
                    activeOpacity={0.88}
                    onPress={() => {
                      onSelectScenario(scenario);
                      onClose();
                    }}
                  >
                    {/* Scenario Top Title & Badge */}
                    <View style={styles.scenarioHeader}>
                      <View style={styles.scenarioTitleLeft}>
                        {isDanger ? (
                          <AlertTriangle size={18} color="#FF383C" />
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
                            backgroundColor: isDanger ? '#FEF2F2' : '#ECFDF5',
                            borderColor: isDanger ? '#FECACA' : '#A7F3D0',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.threatTagText,
                            { color: isDanger ? '#DC2626' : '#059669' },
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
                        <Layers size={13} color="#8E8E93" />
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawerContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
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
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1F1F1F',
  },
  drawerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionsText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 14,
    lineHeight: 18,
  },
  scrollView: {
    maxHeight: 480,
  },
  scenariosList: {
    gap: 10,
    paddingBottom: 24,
  },
  scenarioCard: {
    backgroundColor: '#FCFCFC',
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  scenarioTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  scenarioTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F1F1F',
    flex: 1,
  },
  threatTag: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
  },
  threatTagText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF383C',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F1F1F',
    lineHeight: 16,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E6E6E6',
    paddingTop: 8,
  },
  eventsCountGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  eventsCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
  },
  simulateButton: {
    backgroundColor: '#FF383C',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  simulateButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
