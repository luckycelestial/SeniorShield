import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PlayCircle, X, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react-native';
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
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Sparkles size={24} color="#FBBF24" />
              <Text style={styles.headerTitle}>Judge Demo & Simulation Hub</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.instructionText}>
            Select any real-world Indian fraud scenario below to simulate live ingestion, multi-channel correlation, and Gemini 2.5 Flash plain-language reasoning:
          </Text>

          <ScrollView style={styles.scenarioList} contentContainerStyle={styles.scenarioListContent}>
            {MOCK_SCAM_SCENARIOS.map((scenario) => {
              const isDanger = scenario.expectedThreatLevel === 'CRITICAL';

              return (
                <TouchableOpacity
                  key={scenario.id}
                  style={[
                    styles.scenarioCard,
                    { borderColor: isDanger ? '#EF4444' : '#22C55E' },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    onSelectScenario(scenario);
                    onClose();
                  }}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.titleTagRow}>
                      {isDanger ? (
                        <AlertTriangle size={20} color="#EF4444" />
                      ) : (
                        <ShieldCheck size={20} color="#22C55E" />
                      )}
                      <Text style={styles.scenarioTitle}>{scenario.title}</Text>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: isDanger ? '#7F1D1D' : '#14532D' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          { color: isDanger ? '#FCA5A5' : '#86EFAC' },
                        ]}
                      >
                        {scenario.expectedThreatLevel}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.categoryLabel}>{scenario.category}</Text>
                  <Text style={styles.descriptionText}>{scenario.description}</Text>

                  <View style={styles.eventCountRow}>
                    <Text style={styles.eventCountText}>
                      📦 Includes {scenario.events.length} Simulated Event(s) (
                      {scenario.events.map((e) => e.type).join(' + ')})
                    </Text>
                    <View style={styles.runButton}>
                      <PlayCircle size={18} color="#FFFFFF" />
                      <Text style={styles.runButtonText}>Simulate</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
    borderTopWidth: 2,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  closeButton: {
    padding: 4,
  },
  instructionText: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 16,
    lineHeight: 20,
  },
  scenarioList: {
    maxHeight: 480,
  },
  scenarioListContent: {
    gap: 12,
    paddingBottom: 24,
  },
  scenarioCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  scenarioTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
    marginBottom: 12,
  },
  eventCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
  },
  eventCountText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  runButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  runButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
