import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { backendAnalysisService, BackendAnalyzeResponse } from '../services/backendAnalysisService';

interface AiEvidenceScreenProps {
  initialText?: string;
}

export const AiEvidenceScreen: React.FC<AiEvidenceScreenProps> = ({ initialText = '' }) => {
  const [inputText, setInputText] = useState<string>(
    initialText ||
      'Hello, this is Inspector Vikram Sharma from Cyber Crime Branch. An arrest warrant is issued. Transfer Rs 50000 to RBI escrow immediately.'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<BackendAnalyzeResponse | null>(null);
  const [isServerOnline, setIsServerOnline] = useState<boolean>(false);
  const [serverUrl, setServerUrl] = useState<string>('');

  useEffect(() => {
    checkServer();
  }, []);

  const checkServer = async () => {
    const online = await backendAnalysisService.checkHealth();
    setIsServerOnline(online);
    setServerUrl(backendAnalysisService.getActiveServerUrl());
  };

  const handleRunAnalysis = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    try {
      const result = await backendAnalysisService.analyzeTextWithBackend(
        inputText,
        'CALL',
        '+919123456789'
      );
      if (result) {
        setAnalysisResult(result.backendRaw);
      }
    } catch (e) {
      console.error('Error running test analysis:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>AI Evidence & XAI</Text>
          <Text style={styles.screenSubtitle}>
            DistilBERT + Integrated Gradients + Rule Engine
          </Text>
        </View>
        <TouchableOpacity style={styles.statusBadge} onPress={checkServer}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isServerOnline ? '#10b981' : '#ef4444' },
            ]}
          />
          <Text style={styles.statusText}>
            {isServerOnline ? 'Server Active' : 'Offline'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Server Info Card */}
      <View style={styles.serverCard}>
        <Text style={styles.serverInfoLabel}>Host Backend Service:</Text>
        <Text style={styles.serverInfoUrl}>{serverUrl || 'http://127.0.0.1:8001'}</Text>
        <Text style={styles.serverInfoSub}>
          Authoritative on-device neural classifier with explainable token heatmaps.
        </Text>
      </View>

      {/* Test Input Box */}
      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>Inspect Spoken or Written Message:</Text>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          multiline
          placeholder="Paste SMS text or spoken call transcript..."
          placeholderTextColor="#64748b"
        />
        <TouchableOpacity
          style={[styles.analyzeButton, isLoading && styles.analyzeButtonDisabled]}
          onPress={handleRunAnalysis}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.analyzeButtonText}>⚡ Run Multi-Stage AI Analysis</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Analysis Results */}
      {analysisResult && (
        <View style={styles.resultsContainer}>
          {/* Classification Banner */}
          <View
            style={[
              styles.decisionBanner,
              analysisResult.classification.label === 'SCAM'
                ? styles.decisionScam
                : styles.decisionSafe,
            ]}
          >
            <View>
              <Text style={styles.decisionLabel}>
                {analysisResult.classification.label === 'SCAM'
                  ? '🚨 FRAUD / COERCION DETECTED'
                  : '✅ SAFE COMMUNICATION'}
              </Text>
              <Text style={styles.fraudType}>
                Category: {analysisResult.analysis?.fraud_type || 'General Flag'}
              </Text>
            </View>
            <View style={styles.confidenceBox}>
              <Text style={styles.confidenceScore}>
                {Math.round(analysisResult.classification.confidence * 100)}%
              </Text>
              <Text style={styles.confidenceLabel}>Confidence</Text>
            </View>
          </View>

          {/* Token-Level XAI Feature Attributions */}
          {analysisResult.evidence?.attribution?.top_features && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                🔬 XAI Token Attributions (Why Model Decided)
              </Text>
              <Text style={styles.sectionDesc}>
                Tokens driving the model decision via Gradient Feature Attribution:
              </Text>
              <View style={styles.tokensRow}>
                {analysisResult.evidence.attribution.top_features.map((feat, idx) => {
                  const isScam = feat.direction === 'toward_scam';
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.tokenPill,
                        isScam ? styles.tokenScam : styles.tokenSafe,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tokenText,
                          isScam ? styles.tokenScamText : styles.tokenSafeText,
                        ]}
                      >
                        {feat.token}
                      </Text>
                      <Text style={styles.tokenScore}>
                        {(feat.contribution * 100).toFixed(1)}%
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Rule Engine Signals */}
          {analysisResult.evidence?.rule_evidence &&
            analysisResult.evidence.rule_evidence.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>⚡ Deterministic Rule Signals</Text>
                {analysisResult.evidence.rule_evidence.map((rule, idx) => (
                  <View key={idx} style={styles.ruleItem}>
                    <View style={styles.ruleHeader}>
                      <Text style={styles.ruleId}>{rule.rule_id}</Text>
                      <Text style={styles.ruleSeverity}>{rule.severity}</Text>
                    </View>
                    <Text style={styles.ruleDesc}>{rule.description}</Text>
                    {rule.matched_text && (
                      <Text style={styles.ruleMatched}>
                        Trigger: "{rule.matched_text}"
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

          {/* Senior & Caregiver Guidance */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>👴 Senior Citizen Directive</Text>
            <Text style={styles.seniorMessage}>
              {analysisResult.explanation?.senior?.message}
            </Text>
            <View style={styles.actionBox}>
              <Text style={styles.actionTitle}>REQUIRED ACTION:</Text>
              <Text style={styles.actionText}>
                {analysisResult.explanation?.senior?.action}
              </Text>
            </View>
          </View>

          {/* Latency Telemetry */}
          {analysisResult.latency_ms && (
            <View style={styles.latencyCard}>
              <Text style={styles.latencyTitle}>⚡ Processing Latency:</Text>
              <Text style={styles.latencyStats}>
                DistilBERT: {Math.round(analysisResult.latency_ms.distilbert)}ms | XAI:{' '}
                {Math.round(analysisResult.latency_ms.explainability)}ms | Total:{' '}
                {Math.round(analysisResult.latency_ms.total)}ms
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '700',
  },
  serverCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  serverInfoLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  serverInfoUrl: {
    fontSize: 13,
    color: '#38bdf8',
    fontFamily: 'monospace',
    fontWeight: '700',
    marginVertical: 2,
  },
  serverInfoSub: {
    fontSize: 11,
    color: '#94a3b8',
  },
  inputCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 12,
    color: '#f8fafc',
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  analyzeButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  resultsContainer: {
    marginTop: 4,
  },
  decisionBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  decisionScam: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
  },
  decisionSafe: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  decisionLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
  },
  fraudType: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 3,
  },
  confidenceBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  confidenceScore: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  confidenceLabel: {
    fontSize: 9,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  sectionCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 10,
  },
  tokensRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tokenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  tokenScam: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#ef4444',
  },
  tokenSafe: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981',
  },
  tokenText: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 6,
  },
  tokenScamText: {
    color: '#fca5a5',
  },
  tokenSafeText: {
    color: '#86efac',
  },
  tokenScore: {
    fontSize: 10,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  ruleItem: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  ruleId: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38bdf8',
  },
  ruleSeverity: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ruleDesc: {
    fontSize: 11,
    color: '#e2e8f0',
  },
  ruleMatched: {
    fontSize: 10,
    color: '#f59e0b',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  seniorMessage: {
    fontSize: 13,
    color: '#e2e8f0',
    lineHeight: 18,
    marginBottom: 10,
  },
  actionBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
    padding: 10,
    borderRadius: 6,
  },
  actionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ef4444',
    marginBottom: 2,
  },
  actionText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
  latencyCard: {
    backgroundColor: '#0a0f1d',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  latencyTitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
  },
  latencyStats: {
    fontSize: 11,
    color: '#38bdf8',
    fontFamily: 'monospace',
    marginTop: 2,
  },
});
