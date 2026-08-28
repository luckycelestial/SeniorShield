import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { PhoneCall, Globe, ChevronDown, Check, Mic } from 'lucide-react-native';
import { ThreatLevel } from '../types/scam';
import { SUPPORTED_LANGUAGES, LanguageOption, TRANSLATIONS } from '../constants/languages';

interface HeaderProps {
  threatLevel: ThreatLevel;
  selectedLanguage: string;
  onSelectLanguage: (langCode: string) => void;
  onCallHelpline: () => void;
  onOpenOnboarding?: () => void;
  onOpenCallLogs?: () => void;
  callLogsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  threatLevel,
  selectedLanguage,
  onSelectLanguage,
  onCallHelpline,
  onOpenOnboarding,
  onOpenCallLogs,
  callLogsCount = 0,
}) => {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) ||
    SUPPORTED_LANGUAGES[0];

  const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;

  const handleLanguageSelect = (lang: LanguageOption) => {
    onSelectLanguage(lang.code);
    setIsDropdownVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Top Brand Bar */}
      <View style={styles.topRow}>
        <View style={styles.brandGroup}>
          <View style={styles.titleBadgeRow}>
            <Text style={styles.appTitle}>{t.appTitle || 'SeniorShield'}</Text>
            {/* Solid AI 3.5 Badge */}
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI 3.5</Text>
            </View>
          </View>
          <Text style={styles.appSubtitle}>{t.appSubtitle || 'Autonomous Scam Defense'}</Text>
        </View>

        <View style={styles.headerRightActions}>
          {onOpenCallLogs && (
            <TouchableOpacity
              style={styles.callLogsHeaderButton}
              onPress={onOpenCallLogs}
              activeOpacity={0.7}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Mic size={13} color="#E11D48" />
              <Text style={styles.callLogsHeaderText}>Logs</Text>
              {callLogsCount > 0 && (
                <View style={styles.callLogsBadge}>
                  <Text style={styles.callLogsBadgeText}>{callLogsCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {onOpenOnboarding && (
            <TouchableOpacity
              style={styles.onboardingHeaderButton}
              onPress={onOpenOnboarding}
              activeOpacity={0.8}
            >
              <Text style={styles.onboardingHeaderText}>Guide</Text>
            </TouchableOpacity>
          )}

          {/* Language Dropdown Selector Button */}
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setIsDropdownVisible(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            accessibilityLabel="Select Language"
          >
            <Globe size={14} color="#0284C7" />
            <Text style={styles.languageButtonText}>{currentLang.nativeName}</Text>
            <ChevronDown size={14} color="#1F1F1F" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Emergency Cyber Helpline (1930) Solid Capsule Button */}
      <TouchableOpacity
        style={styles.helplineButton}
        onPress={onCallHelpline}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel="Call Cyber Crime Helpline 1930"
      >
        <PhoneCall size={18} color="#FFFFFF" />
        <Text style={styles.helplineText}>{t.helpline || 'Emergency Cyber Helpline (1930)'}</Text>
      </TouchableOpacity>

      {/* Language Selection Modal Dropdown */}
      <Modal
        visible={isDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsDropdownVisible(false)}
          />
          <View style={styles.dropdownMenu}>
            <View style={styles.dropdownHeader}>
              <Globe size={16} color="#0284C7" />
              <Text style={styles.dropdownHeaderText}>Select Senior Language</Text>
            </View>

            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === selectedLanguage;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.langItem,
                    isSelected && styles.langItemSelected,
                  ]}
                  onPress={() => handleLanguageSelect(lang)}
                  activeOpacity={0.8}
                >
                  <View style={styles.langItemLeft}>
                    <Text style={styles.flagIcon}>{lang.flag}</Text>
                    <View>
                      <Text style={[styles.langNativeName, isSelected && styles.langSelectedText]}>
                        {lang.nativeName}
                      </Text>
                      <Text style={styles.langEnglishName}>{lang.name}</Text>
                    </View>
                  </View>
                  {isSelected && <Check size={18} color="#0284C7" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FCFCFC',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brandGroup: {
    justifyContent: 'center',
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1F1F1F',
    letterSpacing: -0.5,
  },
  aiBadge: {
    backgroundColor: '#1F1F1F',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onboardingHeaderButton: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  onboardingHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  callLogsHeaderButton: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  callLogsHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E11D48',
  },
  callLogsBadge: {
    backgroundColor: '#E11D48',
    borderRadius: 9999,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  callLogsBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  languageButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  languageButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F1F1F',
  },
  helplineButton: {
    backgroundColor: '#FF383C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 9999,
    shadowColor: '#FF383C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  helplineText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  dropdownHeaderText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1F1F1F',
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginVertical: 2,
  },
  langItemSelected: {
    backgroundColor: '#F0F9FF',
  },
  langItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flagIcon: {
    fontSize: 18,
  },
  langNativeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F1F1F',
  },
  langEnglishName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 1,
  },
  langSelectedText: {
    color: '#0284C7',
  },
});
