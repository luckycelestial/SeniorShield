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
import { Users, Plus, Trash2, CheckCircle2, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react-native';
import { EmergencyContact } from '../types';

interface Step6Props {
  contacts: EmergencyContact[];
  onAddContact: (contact: EmergencyContact) => void;
  onRemoveContact: (id: string) => void;
  onContinue: () => void;
  isDarkMode?: boolean;
}

export const Step6Contacts: React.FC<Step6Props> = ({
  contacts,
  onAddContact,
  onRemoveContact,
  onContinue,
  isDarkMode = false,
}) => {
  const [name, setName] = useState<string>('');
  const [relationship, setRelationship] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const relationshipOptions = [
    'Brother',
    'Sister',
    'Son',
    'Daughter',
    'Spouse',
    'Husband',
    'Wife',
    'Mother',
    'Father',
    'Grandmother',
    'Grandfather',
    'Grandson',
    'Granddaughter',
    'Uncle',
    'Aunt',
    'Nephew',
    'Niece',
    'Cousin',
    'Friend',
    'Best Friend',
    'Neighbor',
    'Caregiver / Nurse',
    'Guardian',
    'Lawyer / Legal Advisor',
    'Doctor / Physician',
  ];

  const handleAdd = () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter contact name.');
      return;
    }
    if (!relationship.trim()) {
      Alert.alert('Required Field', 'Please specify or select a relationship.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      Alert.alert(
        'Invalid Phone Number',
        `Emergency contact phone number must be exactly 10 digits. Current length: ${cleanPhone.length} digits.`
      );
      return;
    }

    const newContact: EmergencyContact = {
      id: Date.now().toString(),
      name: name.trim(),
      relationship: relationship.trim(),
      phone: cleanPhone,
    };
    onAddContact(newContact);
    setName('');
    setRelationship('');
    setPhone('');
    setIsDropdownOpen(false);
  };

  const handleContinueClick = () => {
    if (contacts.length === 0) {
      Alert.alert(
        'Emergency Contact Required',
        'Please add at least one emergency contact before continuing.'
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
            <Users size={14} color={isDarkMode ? '#38BDF8' : '#0369A1'} />
            <Text style={[styles.badgeText, isDarkMode && styles.badgeTextDark]}>
              STEP 5: EMERGENCY CONTACTS
            </Text>
          </View>

          <View style={styles.headerRow}>
            <Users size={24} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
            <Text style={[styles.title, isDarkMode && styles.titleDark]}>
              People We Can Alert in Case of Trouble
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
          {/* Side Info Card: We Will */}
          <View style={[styles.infoBox, isDarkMode && styles.infoBoxDark]}>
            <Text style={[styles.infoTitle, isDarkMode && styles.infoTitleDark]}>
              🛡️ We will:
            </Text>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <CheckCircle2 size={15} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
                <Text style={[styles.infoText, isDarkMode && styles.infoTextDark]}>
                  Alert them if we detect danger
                </Text>
              </View>
              <View style={styles.infoItem}>
                <CheckCircle2 size={15} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
                <Text style={[styles.infoText, isDarkMode && styles.infoTextDark]}>
                  Share location (if needed)
                </Text>
              </View>
              <View style={styles.infoItem}>
                <CheckCircle2 size={15} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
                <Text style={[styles.infoText, isDarkMode && styles.infoTextDark]}>
                  Notify about critical scams
                </Text>
              </View>
            </View>
          </View>

          {/* Add Contact Form Card */}
          <View style={[styles.formDashedCard, isDarkMode && styles.formDashedCardDark]}>
            <Text style={[styles.formHeader, isDarkMode && styles.formHeaderDark]}>
              Add Emergency Contacts:
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Contact Name *:</Text>
              <TextInput
                style={[styles.input, isDarkMode && styles.inputDark]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Ravi Sharma"
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
              />
            </View>

            {/* Relationship: Dropdown Arrow + Typable Input + Scrollable Picker */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Relationship (Type or Select) *:</Text>
              <View style={styles.dropdownInputWrapper}>
                <TextInput
                  style={[styles.dropdownInput, isDarkMode && styles.dropdownInputDark]}
                  value={relationship}
                  onChangeText={setRelationship}
                  placeholder="Select or type relationship..."
                  placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                />
                <Pressable
                  style={styles.dropdownArrowBtn}
                  onPress={() => setIsDropdownOpen((prev) => !prev)}
                  hitSlop={8}
                >
                  {isDropdownOpen ? (
                    <ChevronUp size={18} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
                  ) : (
                    <ChevronDown size={18} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
                  )}
                </Pressable>
              </View>

              {/* Scrollable Dropdown Options Container */}
              {isDropdownOpen && (
                <ScrollView
                  style={[styles.dropdownListContainer, isDarkMode && styles.dropdownListContainerDark]}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="always"
                  showsVerticalScrollIndicator={true}
                >
                  {relationshipOptions.map((opt) => (
                    <Pressable
                      key={opt}
                      style={({ pressed }) => [
                        styles.dropdownOptionItem,
                        isDarkMode && styles.dropdownOptionItemDark,
                        relationship === opt && styles.dropdownOptionSelected,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={() => {
                        setRelationship(opt);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          isDarkMode && styles.dropdownOptionTextDark,
                          relationship === opt && styles.dropdownOptionTextSelected,
                        ]}
                      >
                        {opt}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Phone Number (10 Digits) *:</Text>
              <TextInput
                style={[styles.input, isDarkMode && styles.inputDark]}
                value={phone}
                onChangeText={setPhone}
                placeholder="9876543210"
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.addContactBtn,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleAdd}
              hitSlop={8}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addContactBtnText}>ADD CONTACT</Text>
            </Pressable>
          </View>

          {/* Contacts List */}
          <View style={styles.contactsSection}>
            <Text style={[styles.contactsHeader, isDarkMode && styles.contactsHeaderDark]}>
              Your Emergency Contacts ({contacts.length}):
            </Text>
            {contacts.map((c) => (
              <View key={c.id} style={[styles.contactItem, isDarkMode && styles.contactItemDark]}>
                <View style={styles.contactItemLeft}>
                  <View style={[styles.contactAvatar, isDarkMode && styles.contactAvatarDark]}>
                    <Users size={16} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
                  </View>
                  <View>
                    <Text style={[styles.contactName, isDarkMode && styles.contactNameDark]}>
                      {c.name} ({c.relationship})
                    </Text>
                    <Text style={[styles.contactPhone, isDarkMode && styles.contactPhoneDark]}>
                      {c.phone}
                    </Text>
                  </View>
                </View>
                <Pressable onPress={() => onRemoveContact(c.id)} style={styles.deleteBtn} hitSlop={10}>
                  <Trash2 size={16} color="#EF4444" />
                </Pressable>
              </View>
            ))}
          </View>
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
  infoBox: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  infoBoxDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
    marginBottom: 6,
  },
  infoTitleDark: {
    color: '#38BDF8',
  },
  infoList: {
    gap: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
  },
  infoTextDark: {
    color: '#94A3B8',
  },
  formDashedCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
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
    color: '#0F172A',
  },
  formHeaderDark: {
    color: '#F8FAFC',
  },
  fieldGroup: {
    gap: 3,
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
  dropdownInputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingRight: 36,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  dropdownInputDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    color: '#F8FAFC',
  },
  dropdownArrowBtn: {
    position: 'absolute',
    right: 8,
    padding: 6,
  },
  dropdownListContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    marginTop: 4,
    maxHeight: 180,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  dropdownListContainerDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  dropdownOptionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownOptionItemDark: {
    borderBottomColor: '#1E293B',
  },
  dropdownOptionSelected: {
    backgroundColor: '#F0F9FF',
  },
  dropdownOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  dropdownOptionTextDark: {
    color: '#CBD5E1',
  },
  dropdownOptionTextSelected: {
    color: '#0284C7',
    fontWeight: '800',
  },
  addContactBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 42,
    borderRadius: 10,
    marginTop: 4,
  },
  addContactBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  contactsSection: {
    gap: 6,
    marginBottom: 8,
  },
  contactsHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  contactsHeaderDark: {
    color: '#F8FAFC',
  },
  contactItem: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactItemDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  contactItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactAvatarDark: {
    backgroundColor: '#1E293B',
  },
  contactName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  contactNameDark: {
    color: '#F8FAFC',
  },
  contactPhone: {
    fontSize: 11,
    color: '#64748B',
  },
  contactPhoneDark: {
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
