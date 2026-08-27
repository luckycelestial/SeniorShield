import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MessageSquare, X, Sparkles, Send, Bell } from 'lucide-react-native';
import { triggerTestSMSNotification } from '../services/notificationReader';

interface SmsAnalyzerModalProps {
  visible: boolean;
  onClose: () => void;
  onAnalyzeSms: (sender: string, text: string) => void;
}

const PRESET_SMS_TEMPLATES = [
  {
    label: '⚡ Electricity Bill Threat (High Risk)',
    sender: 'VM-TNEBPO',
    text: 'Dear consumer electricity power will be disconnected tonight at 9:30 pm from electricity office because your previous month bill was not updated. Please immediately contact our electricity officer 9876543210. Thank you.',
  },
  {
    label: '👮 CBI Digital Arrest Order (Critical)',
    sender: '+91 99887 76655',
    text: 'URGENT: Supreme Court & CBI arrest warrant issued against your Aadhaar card for money laundering. Join video call immediately on WhatsApp or police will reach your address in 30 mins.',
  },
  {
    label: '🏦 SBI KYC Pan Suspension (Critical)',
    sender: 'VK-SBINB',
    text: 'Your SBI YONO account has been suspended due to expired PAN card. Click link http://sbi-kyc-update.apk to update immediately and avoid permanent block.',
  },
  {
    label: '✅ Legitimate HDFC Bank Credit (Safe)',
    sender: 'VK-HDFCBK',
    text: 'INR 2,500.00 is credited to your A/C ending 4589 on 27-Aug-2026 by UPI. Available balance: INR 48,230.50. - HDFC Bank',
  },
];

export const SmsAnalyzerModal: React.FC<SmsAnalyzerModalProps> = ({
  visible,
  onClose,
  onAnalyzeSms,
}) => {
  const [sender, setSender] = useState<string>('VM-TNEBPO');
  const [smsText, setSmsText] = useState<string>(PRESET_SMS_TEMPLATES[0].text);

  const handleApplyPreset = (preset: typeof PRESET_SMS_TEMPLATES[0]) => {
    setSender(preset.sender);
    setSmsText(preset.text);
  };

  const handleAnalyze = () => {
    if (!smsText.trim()) return;
    onAnalyzeSms(sender.trim() || 'Unknown Sender', smsText.trim());
    onClose();
  };

  const handleSimulateNotification = async () => {
    if (!smsText.trim()) return;
    await triggerTestSMSNotification(sender.trim() || 'SMS Alert', smsText.trim());
    onAnalyzeSms(sender.trim() || 'Unknown Sender', smsText.trim());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <View style={styles.iconBox}>
                <MessageSquare size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.modalTitle}>SMS & Notification Analyzer</Text>
                <Text style={styles.modalSubtitle}>Read & Analyze Raw Inflow Content</Text>
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

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* 1-Tap Quick Presets */}
            <Text style={styles.sectionLabel}>QUICK TEST SCENARIOS</Text>
            <View style={styles.presetsContainer}>
              {PRESET_SMS_TEMPLATES.map((preset, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.presetButton}
                  onPress={() => handleApplyPreset(preset)}
                  activeOpacity={0.85}
                >
                  <Sparkles size={14} color="#1F1F1F" />
                  <Text style={styles.presetText} numberOfLines={1}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sender / Header Input */}
            <Text style={styles.inputLabel}>SENDER HEADER / NUMBER</Text>
            <TextInput
              style={styles.senderInput}
              value={sender}
              onChangeText={setSender}
              placeholder="e.g. VK-HDFCBK or +919876543210"
              placeholderTextColor="#8E8E93"
            />

            {/* Message Body Input */}
            <Text style={styles.inputLabel}>SMS / NOTIFICATION MESSAGE CONTENT</Text>
            <TextInput
              style={styles.bodyInput}
              value={smsText}
              onChangeText={setSmsText}
              placeholder="Paste SMS content or notification text here..."
              placeholderTextColor="#8E8E93"
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.analyzeButton}
                onPress={handleAnalyze}
                activeOpacity={0.88}
              >
                <Send size={16} color="#FFFFFF" />
                <Text style={styles.analyzeButtonText}>Analyze SMS & Get Verdict</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.notifyButton}
                onPress={handleSimulateNotification}
                activeOpacity={0.88}
              >
                <Bell size={16} color="#1F1F1F" />
                <Text style={styles.notifyButtonText}>Push Real Notification & Analyze</Text>
              </TouchableOpacity>
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
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#1F1F1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1F1F1F',
  },
  modalSubtitle: {
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
  scrollView: {
    maxHeight: 520,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  presetsContainer: {
    gap: 6,
    marginBottom: 14,
  },
  presetButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F1F1F',
    flex: 1,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  senderInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#1F1F1F',
    marginBottom: 12,
  },
  bodyInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#1F1F1F',
    minHeight: 90,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionsContainer: {
    gap: 10,
    paddingBottom: 24,
  },
  analyzeButton: {
    backgroundColor: '#1F1F1F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  notifyButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 9999,
  },
  notifyButtonText: {
    color: '#1F1F1F',
    fontSize: 13,
    fontWeight: '800',
  },
});
