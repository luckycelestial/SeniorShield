import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
  ScrollView,
  Alert,
} from 'react-native';
import { Building2, Trash2, Check, ArrowRight } from 'lucide-react-native';
import { BankInfo } from '../types';

interface Step5Props {
  banks: BankInfo[];
  onAddBank: (bank: BankInfo) => void;
  onRemoveBank: (id: string) => void;
  onContinue: () => void;
  isDarkMode?: boolean;
}

export const Step5Banking: React.FC<Step5Props> = ({
  banks,
  onAddBank,
  onRemoveBank,
  onContinue,
  isDarkMode = false,
}) => {
  const [bankName, setBankName] = useState<string>('SBI');
  const [accountType, setAccountType] = useState<'Savings' | 'Current' | 'Salary'>('Savings');
  const [last4, setLast4] = useState<string>('');
  const [ifsc, setIfsc] = useState<string>('');
  const [registeredMobile, setRegisteredMobile] = useState<string>('');

  const commonBanks = ['SBI', 'HDFC', 'ICICI', 'Axis', 'PNB', 'BOB'];

  const handleSaveBank = () => {
    const cleanLast4 = last4.replace(/\D/g, '');
    if (cleanLast4.length !== 4) {
      Alert.alert('Invalid Account Digits', 'Please enter exactly the last 4 digits of your account number.');
      return;
    }
    if (!ifsc.trim()) {
      Alert.alert('Required Field', 'Please enter your bank IFSC code.');
      return;
    }
    const cleanMobile = registeredMobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      Alert.alert('Invalid Mobile Number', 'Registered mobile number must be exactly 10 digits.');
      return;
    }

    const newBank: BankInfo = {
      id: Date.now().toString(),
      bankName,
      accountType,
      last4: cleanLast4,
      ifsc: ifsc.toUpperCase().trim(),
      registeredMobile: cleanMobile,
    };
    onAddBank(newBank);
    setLast4('');
    setIfsc('');
    setRegisteredMobile('');
  };

  const handleContinueClick = () => {
    if (banks.length === 0) {
      Alert.alert(
        'Bank Details Required',
        'Please add at least one bank account to enable fake bank call protection before continuing.'
      );
      return;
    }
    onContinue();
  };

  return (
    <View style={[styles.screenWrapper, isDarkMode && styles.screenWrapperDark]}>
      {/* Big Fixed Outer Card Frame */}
      <View style={[styles.cardFrame, isDarkMode && styles.cardFrameDark]}>
        {/* Anchored Card Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.badge, isDarkMode && styles.badgeDark]}>
            <Building2 size={14} color={isDarkMode ? '#38BDF8' : '#0369A1'} />
            <Text style={[styles.badgeText, isDarkMode && styles.badgeTextDark]}>
              STEP 4: BANKING RELATIONSHIPS
            </Text>
          </View>

          <View style={styles.headerRow}>
            <Building2 size={24} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
            <Text style={[styles.title, isDarkMode && styles.titleDark]}>
              "We'll Help You Spot Fake Bank Calls"
            </Text>
          </View>
        </View>

        {/* Scrollable Content Inside the Big Card */}
        <ScrollView
          style={styles.cardInnerScroll}
          contentContainerStyle={styles.cardInnerScrollContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled={true}
          alwaysBounceVertical={true}
        >
          {/* Add Bank Form Card */}
          <View style={[styles.formDashedCard, isDarkMode && styles.formDashedCardDark]}>
            <Text style={[styles.formHeader, isDarkMode && styles.formHeaderDark]}>
              Add Your Bank(s):
            </Text>

            {/* Bank Quick Selector */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Bank Name *:</Text>
              <View style={styles.chipsRow}>
                {commonBanks.map((b) => (
                  <Pressable
                    key={b}
                    style={[styles.bankChip, isDarkMode && styles.bankChipDark, bankName === b && styles.bankChipSelected]}
                    onPress={() => setBankName(b)}
                    hitSlop={6}
                  >
                    <Text style={[styles.bankChipText, isDarkMode && styles.bankChipTextDark, bankName === b && styles.bankChipTextSelected]}>
                      {b}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Account Type Selector */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Account Type *:</Text>
              <View style={styles.chipsRow}>
                {(['Savings', 'Current', 'Salary'] as const).map((type) => (
                  <Pressable
                    key={type}
                    style={[styles.typeChip, isDarkMode && styles.typeChipDark, accountType === type && styles.typeChipSelected]}
                    onPress={() => setAccountType(type)}
                    hitSlop={6}
                  >
                    <Text style={[styles.typeChipText, isDarkMode && styles.typeChipTextDark, accountType === type && styles.typeChipTextSelected]}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.rowTwo}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.label, isDarkMode && styles.labelDark]}>Last 4 Digits *:</Text>
                <TextInput
                  style={[styles.input, isDarkMode && styles.inputDark]}
                  value={last4}
                  onChangeText={setLast4}
                  placeholder="4321"
                  placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.label, isDarkMode && styles.labelDark]}>IFSC Code *:</Text>
                <TextInput
                  style={[styles.input, isDarkMode && styles.inputDark]}
                  value={ifsc}
                  onChangeText={setIfsc}
                  placeholder="SBIN0001234"
                  placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Registered Mobile (10 Digits) *:</Text>
              <TextInput
                style={[styles.input, isDarkMode && styles.inputDark]}
                value={registeredMobile}
                onChangeText={setRegisteredMobile}
                placeholder="9876543210"
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.saveBankBtn,
                isDarkMode && styles.saveBankBtnDark,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleSaveBank}
              hitSlop={8}
            >
              <Check size={16} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
              <Text style={[styles.saveBankBtnText, isDarkMode && styles.saveBankBtnTextDark]}>
                SAVE BANK
              </Text>
            </Pressable>
          </View>

          {/* Display Saved Banks */}
          {banks.length > 0 && (
            <View style={styles.savedSection}>
              <Text style={[styles.savedTitle, isDarkMode && styles.savedTitleDark]}>
                Saved Banking Shields ({banks.length}):
              </Text>
              {banks.map((b) => (
                <View key={b.id} style={[styles.bankItemCard, isDarkMode && styles.bankItemCardDark]}>
                  <View style={styles.bankItemLeft}>
                    <Building2 size={18} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
                    <View>
                      <Text style={[styles.bankItemName, isDarkMode && styles.bankItemNameDark]}>
                        {b.bankName} ({b.accountType})
                      </Text>
                      <Text style={[styles.bankItemDetails, isDarkMode && styles.bankItemDetailsDark]}>
                        Acc Ending: **** {b.last4} {b.ifsc ? `| IFSC: ${b.ifsc}` : ''}
                      </Text>
                    </View>
                  </View>
                  <Pressable onPress={() => onRemoveBank(b.id)} style={styles.deleteBtn} hitSlop={10}>
                    <Trash2 size={16} color="#EF4444" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Anchored Card Footer Action Button */}
        <View style={[styles.cardFooter, isDarkMode && styles.cardFooterDark]}>
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleContinueClick}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
            hitSlop={12}
          >
            <Text style={styles.continueButtonText}>CONTINUE</Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  screenWrapperDark: {
    backgroundColor: '#0F172A',
  },
  cardFrame: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    width: '100%',
    maxWidth: 480,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    overflow: 'hidden',
  },
  cardFrameDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  cardHeader: {
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 12,
  },
  badgeDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
    letterSpacing: 0.5,
  },
  badgeTextDark: {
    color: '#38BDF8',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    flex: 1,
  },
  titleDark: {
    color: '#F8FAFC',
  },
  cardInnerScroll: {
    flex: 1,
    width: '100%',
  },
  cardInnerScrollContent: {
    flexGrow: 1,
    paddingVertical: 8,
    paddingBottom: 160,
  },
  formDashedCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderStyle: 'dashed',
    gap: 10,
    marginBottom: 16,
  },
  formDashedCardDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  formHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
  },
  formHeaderDark: {
    color: '#38BDF8',
  },
  fieldGroup: {
    gap: 3,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  labelDark: {
    color: '#CBD5E1',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  inputDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    color: '#F8FAFC',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  bankChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  bankChipDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  bankChipSelected: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  bankChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  bankChipTextDark: {
    color: '#CBD5E1',
  },
  bankChipTextSelected: {
    color: '#FFFFFF',
  },
  typeChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  typeChipDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  typeChipSelected: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  typeChipTextDark: {
    color: '#CBD5E1',
  },
  typeChipTextSelected: {
    color: '#FFFFFF',
  },
  saveBankBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 42,
    borderRadius: 10,
    marginTop: 4,
  },
  saveBankBtnDark: {
    backgroundColor: '#1E293B',
    borderColor: '#38BDF8',
  },
  saveBankBtnText: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '900',
  },
  saveBankBtnTextDark: {
    color: '#38BDF8',
  },
  savedSection: {
    gap: 6,
    marginBottom: 8,
  },
  savedTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  savedTitleDark: {
    color: '#F8FAFC',
  },
  bankItemCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bankItemCardDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  bankItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bankItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  bankItemNameDark: {
    color: '#F8FAFC',
  },
  bankItemDetails: {
    fontSize: 11,
    color: '#64748B',
  },
  bankItemDetailsDark: {
    color: '#94A3B8',
  },
  deleteBtn: {
    padding: 4,
  },
  cardFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardFooterDark: {
    borderTopColor: '#334155',
  },
  continueButton: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 50,
    borderRadius: 9999,
    width: '100%',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
