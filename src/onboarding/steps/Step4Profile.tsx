import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import {
  User,
  ArrowRight,
  Languages,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react-native';
import { UserProfileData } from '../types';

interface Step4Props {
  profile: UserProfileData;
  onChangeProfile: (updated: Partial<UserProfileData>) => void;
  onContinue: () => void;
  isDarkMode?: boolean;
}

export const Step4Profile: React.FC<Step4Props> = ({
  profile,
  onChangeProfile,
  onContinue,
  isDarkMode = false,
}) => {
  const languages = [
    { label: 'हिंदी', value: 'Hindi' },
    { label: 'English', value: 'English' },
    { label: 'தமிழ்', value: 'Tamil' },
    { label: 'తెలుగు', value: 'Telugu' },
    { label: 'मराठी', value: 'Marathi' },
  ];

  const stateCityMap: Record<string, string[]> = {
    'Andaman and Nicobar Islands': ['Port Blair', 'Car Nicobar', 'Mayabunder'],
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Tirupati', 'Kakinada', 'Anantapur', 'Eluru', 'Vizianagaram', 'Kadapa'],
    'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro'],
    'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif', 'Arrah', 'Begusarai', 'Katihar'],
    'Chandigarh': ['Chandigarh'],
    'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Rajnandgaon', 'Jagdalpur', 'Durg'],
    'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Silvassa'],
    'Delhi (NCT)': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Central Delhi', 'Dwarka', 'Rohini'],
    'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Navsari', 'Morbi'],
    'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Hisar', 'Rohtak', 'Sonipat', 'Yamunanagar'],
    'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Mandi', 'Solan', 'Kullu', 'Manali', 'Hamirpur'],
    'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur', 'Kathua'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh', 'Deoghar', 'Giridih'],
    'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Davangere', 'Ballari', 'Kalaburagi', 'Shivamogga', 'Tumakuru'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Kannur', 'Alappuzha', 'Kottayam', 'Kasaragod'],
    'Ladakh': ['Leh', 'Kargil'],
    'Lakshadweep': ['Kavaratti', 'Agatti', 'Amini'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Chhatrapati Sambhajinagar', 'Solapur', 'Amravati', 'Navi Mumbai', 'Kolhapur', 'Akola'],
    'Manipur': ['Imphal', 'Churachandpur', 'Thoubal'],
    'Meghalaya': ['Shillong', 'Tura', 'Jowai'],
    'Mizoram': ['Aizawl', 'Lunglei', 'Champhai'],
    'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak'],
    'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
    'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Bhilwara', 'Alwar', 'Sikar', 'Bharatpur'],
    'Sikkim': ['Gangtok', 'Namchi', 'Geyzing'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Erode', 'Tirunelveli', 'Vellore', 'Thanjavur', 'Tuticorin', 'Dindigul', 'Kanchipuram', 'Tiruppur', 'Nagercoil', 'Cuddalore', 'Karur'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam', 'Mahbubnagar'],
    'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Noida', 'Ghaziabad', 'Prayagraj', 'Meerut', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rishikesh', 'Nainital'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Kharagpur', 'Bardhaman', 'Malda', 'Baharampur'],
  };

  const allStates = Object.keys(stateCityMap);

  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState<boolean>(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState<boolean>(false);

  const filteredStates = allStates.filter((s) =>
    s.toLowerCase().includes((profile.state || '').toLowerCase())
  );

  const availableCitiesForState = profile.state && stateCityMap[profile.state]
    ? stateCityMap[profile.state]
    : Object.values(stateCityMap).flat();

  const filteredCities = availableCitiesForState.filter((c) =>
    c.toLowerCase().includes((profile.city || '').toLowerCase())
  );

  // Calendar Modal State
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();

  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [viewYear, setViewYear] = useState<number>(1965);
  const [viewMonth, setViewMonth] = useState<number>(5); // June
  const [isYearPickerOpen, setIsYearPickerOpen] = useState<boolean>(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const availableYears = Array.from(
    { length: currentYear - 1920 + 1 },
    (_, i) => currentYear - i
  );

  const handleOpenCalendar = () => {
    if (profile.dob) {
      const parts = profile.dob.split('/').map((p) => parseInt(p.trim(), 10));
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        setViewYear(parts[2]);
        setViewMonth(parts[1] - 1);
      }
    }
    setIsCalendarOpen(true);
  };

  const handleSelectDay = (day: number) => {
    const candidateDate = new Date(viewYear, viewMonth, day);
    if (candidateDate > today) {
      Alert.alert('Invalid Date', 'Date of Birth cannot be in the future.');
      return;
    }

    const formattedDay = day < 10 ? `0${day}` : `${day}`;
    const formattedMonth = viewMonth + 1 < 10 ? `0${viewMonth + 1}` : `${viewMonth + 1}`;
    const formattedDob = `${formattedDay} / ${formattedMonth} / ${viewYear}`;

    onChangeProfile({ dob: formattedDob });
    setIsCalendarOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      if (viewYear > 1920) {
        setViewYear((y) => y - 1);
        setViewMonth(11);
      }
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      if (viewYear < currentYear) {
        setViewYear((y) => y + 1);
        setViewMonth(0);
      }
    } else {
      if (viewYear === currentYear && viewMonth >= currentMonth) {
        return;
      }
      setViewMonth((m) => m + 1);
    }
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOffset = new Date(viewYear, viewMonth, 1).getDay();

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const handleContinueClick = () => {
    if (!profile.fullName.trim()) {
      Alert.alert('Required Field', 'Please enter your Full Name.');
      return;
    }

    const cleanEmail = profile.email.trim();
    if (!cleanEmail) {
      Alert.alert('Required Field', 'Please enter your Email address.');
      return;
    }
    if (!emailRegex.test(cleanEmail)) {
      Alert.alert(
        'Invalid Email Address',
        'Please enter a valid email address (e.g. ramesh@example.com).'
      );
      return;
    }

    if (!profile.dob.trim()) {
      Alert.alert('Required Field', 'Please select your Date of Birth.');
      return;
    }

    const phoneDigits = profile.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      Alert.alert(
        'Invalid Phone Number',
        `Phone number must be exactly 10 digits. Current length: ${phoneDigits.length} digits.`
      );
      return;
    }

    if (!profile.state.trim()) {
      Alert.alert('Required Field', 'Please select or type your State.');
      return;
    }
    if (!profile.city.trim()) {
      Alert.alert('Required Field', 'Please select or type your City.');
      return;
    }

    if (!profile.language) {
      Alert.alert('Required Field', 'Please select your Preferred Language.');
      return;
    }

    onContinue();
  };

  const handleSelectState = (selectedState: string) => {
    const currentCities = stateCityMap[selectedState] || [];
    const newCity = currentCities.includes(profile.city) ? profile.city : '';
    onChangeProfile({ state: selectedState, city: newCity });
    setIsStateDropdownOpen(false);
  };

  const handleSelectCity = (selectedCity: string) => {
    onChangeProfile({ city: selectedCity });
    setIsCityDropdownOpen(false);
  };

  return (
    <View style={[styles.screenWrapper, isDarkMode && styles.screenWrapperDark]}>
      {/* Big Fixed Outer Card Frame */}
      <View style={[styles.cardFrame, isDarkMode && styles.cardFrameDark]}>
        {/* Anchored Card Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.badge, isDarkMode && styles.badgeDark]}>
            <User size={14} color={isDarkMode ? '#38BDF8' : '#0369A1'} />
            <Text style={[styles.badgeText, isDarkMode && styles.badgeTextDark]}>
              STEP 3: PROFILE SETUP
            </Text>
          </View>

          <View style={styles.headerRow}>
            <View style={[styles.userIconCircle, isDarkMode && styles.userIconCircleDark]}>
              <User size={22} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
            </View>
            <Text style={[styles.title, isDarkMode && styles.titleDark]}>About You</Text>
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
          <View style={styles.formGrid}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Full Name *:</Text>
              <TextInput
                style={[styles.input, isDarkMode && styles.inputDark]}
                value={profile.fullName}
                onChangeText={(text) => onChangeProfile({ fullName: text })}
                placeholder="e.g. Ramesh Kumar"
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Email Address *:</Text>
              <TextInput
                style={[styles.input, isDarkMode && styles.inputDark]}
                value={profile.email}
                onChangeText={(text) => onChangeProfile({ email: text })}
                placeholder="ramesh@example.com"
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Date of Birth *:</Text>
              <Pressable
                style={[styles.datePickerInput, isDarkMode && styles.datePickerInputDark]}
                onPress={handleOpenCalendar}
                hitSlop={6}
              >
                <Text style={profile.dob ? (isDarkMode ? styles.dateTextSelectedDark : styles.dateTextSelected) : styles.dateTextPlaceholder}>
                  {profile.dob || 'DD / MM / YYYY'}
                </Text>
                <CalendarIcon size={18} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
              </Pressable>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Phone Number (10 Digits) *:</Text>
              <TextInput
                style={[styles.input, isDarkMode && styles.inputDark]}
                value={profile.phone}
                onChangeText={(text) => onChangeProfile({ phone: text })}
                placeholder="9876543210"
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>State / UT *:</Text>
              <View style={styles.dropdownInputWrapper}>
                <TextInput
                  style={[styles.dropdownInput, isDarkMode && styles.dropdownInputDark]}
                  value={profile.state}
                  onChangeText={(text) => {
                    onChangeProfile({ state: text });
                    setIsStateDropdownOpen(true);
                  }}
                  placeholder="Select or type state (e.g. Tamil Nadu)..."
                  placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                />
                <Pressable
                  style={styles.dropdownArrowBtn}
                  onPress={() => setIsStateDropdownOpen((prev) => !prev)}
                  hitSlop={8}
                >
                  {isStateDropdownOpen ? (
                    <ChevronUp size={18} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
                  ) : (
                    <ChevronDown size={18} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
                  )}
                </Pressable>
              </View>

              {isStateDropdownOpen && (
                <ScrollView
                  style={[styles.dropdownListContainer, isDarkMode && styles.dropdownListContainerDark]}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="always"
                  showsVerticalScrollIndicator={true}
                >
                  {filteredStates.length > 0 ? (
                    filteredStates.map((st) => (
                      <Pressable
                        key={st}
                        style={[styles.dropdownOptionItem, isDarkMode && styles.dropdownOptionItemDark, profile.state === st && styles.dropdownOptionSelected]}
                        onPress={() => handleSelectState(st)}
                      >
                        <Text style={[styles.dropdownOptionText, isDarkMode && styles.dropdownOptionTextDark, profile.state === st && styles.dropdownOptionTextSelected]}>
                          {st}
                        </Text>
                      </Pressable>
                    ))
                  ) : (
                    <Text style={styles.noMatchText}>No matching state. Custom text will be saved.</Text>
                  )}
                </ScrollView>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>
                City * {profile.state ? `(${profile.state})` : ''}:
              </Text>
              <View style={styles.dropdownInputWrapper}>
                <TextInput
                  style={[styles.dropdownInput, isDarkMode && styles.dropdownInputDark]}
                  value={profile.city}
                  onChangeText={(text) => {
                    onChangeProfile({ city: text });
                    setIsCityDropdownOpen(true);
                  }}
                  placeholder={
                    profile.state
                      ? `Select or type city in ${profile.state}...`
                      : 'Select or type city...'
                  }
                  placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                />
                <Pressable
                  style={styles.dropdownArrowBtn}
                  onPress={() => setIsCityDropdownOpen((prev) => !prev)}
                  hitSlop={8}
                >
                  {isCityDropdownOpen ? (
                    <ChevronUp size={18} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
                  ) : (
                    <ChevronDown size={18} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
                  )}
                </Pressable>
              </View>

              {isCityDropdownOpen && (
                <ScrollView
                  style={[styles.dropdownListContainer, isDarkMode && styles.dropdownListContainerDark]}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="always"
                  showsVerticalScrollIndicator={true}
                >
                  {filteredCities.length > 0 ? (
                    filteredCities.map((ct) => (
                      <Pressable
                        key={ct}
                        style={[styles.dropdownOptionItem, isDarkMode && styles.dropdownOptionItemDark, profile.city === ct && styles.dropdownOptionSelected]}
                        onPress={() => handleSelectCity(ct)}
                      >
                        <Text style={[styles.dropdownOptionText, isDarkMode && styles.dropdownOptionTextDark, profile.city === ct && styles.dropdownOptionTextSelected]}>
                          {ct}
                        </Text>
                      </Pressable>
                    ))
                  ) : (
                    <Text style={styles.noMatchText}>No matching city. Custom text will be saved.</Text>
                  )}
                </ScrollView>
              )}
            </View>
          </View>

          {/* Language Selection Chips */}
          <View style={[styles.langSection, isDarkMode && styles.langSectionDark]}>
            <View style={styles.langHeader}>
              <Languages size={16} color={isDarkMode ? '#38BDF8' : '#0369A1'} />
              <Text style={[styles.langTitle, isDarkMode && styles.langTitleDark]}>Preferred Language *:</Text>
            </View>
            <View style={styles.chipsRow}>
              {languages.map((lang) => {
                const isSelected = profile.language === lang.value;
                return (
                  <Pressable
                    key={lang.value}
                    style={[styles.chip, isDarkMode && styles.chipDark, isSelected && styles.chipSelected]}
                    onPress={() => onChangeProfile({ language: lang.value })}
                    hitSlop={6}
                  >
                    <Text style={[styles.chipText, isDarkMode && styles.chipTextDark, isSelected && styles.chipTextSelected]}>
                      {lang.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Anchored Card Footer Action Button */}
        <View style={[styles.cardFooter, isDarkMode && styles.cardFooterDark]}>
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              isDarkMode && styles.continueButtonDark,
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

      {/* Interactive Calendar Modal */}
      <Modal
        visible={isCalendarOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsCalendarOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.calendarModalCard, isDarkMode && styles.calendarModalCardDark]}>
            <View style={styles.calendarModalHeader}>
              <View style={styles.calHeaderTitleRow}>
                <CalendarIcon size={20} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
                <Text style={[styles.calModalTitle, isDarkMode && styles.calModalTitleDark]}>Select Date of Birth</Text>
              </View>
              <Pressable onPress={() => setIsCalendarOpen(false)} hitSlop={10}>
                <X size={20} color={isDarkMode ? '#94A3B8' : '#64748B'} />
              </Pressable>
            </View>

            <View style={styles.calNavRow}>
              <Pressable style={styles.navBtn} onPress={handlePrevMonth} hitSlop={8}>
                <ChevronLeft size={20} color={isDarkMode ? '#F8FAFC' : '#0F172A'} />
              </Pressable>

              <View style={styles.monthYearPickers}>
                <Text style={[styles.monthText, isDarkMode && styles.monthTextDark]}>{months[viewMonth]}</Text>

                <Pressable
                  style={[styles.yearBtn, isDarkMode && styles.yearBtnDark]}
                  onPress={() => setIsYearPickerOpen((prev) => !prev)}
                >
                  <Text style={[styles.yearText, isDarkMode && styles.yearTextDark]}>{viewYear} ▼</Text>
                </Pressable>
              </View>

              <Pressable
                style={[
                  styles.navBtn,
                  viewYear === currentYear && viewMonth >= currentMonth && styles.navBtnDisabled,
                ]}
                onPress={handleNextMonth}
                hitSlop={8}
              >
                <ChevronRight
                  size={20}
                  color={viewYear === currentYear && viewMonth >= currentMonth ? '#475569' : (isDarkMode ? '#F8FAFC' : '#0F172A')}
                />
              </Pressable>
            </View>

            {isYearPickerOpen ? (
              <ScrollView style={[styles.yearPickerScroll, isDarkMode && styles.yearPickerScrollDark]} keyboardShouldPersistTaps="always">
                {availableYears.map((yr) => (
                  <Pressable
                    key={yr}
                    style={[styles.yearOption, viewYear === yr && styles.yearOptionSelected]}
                    onPress={() => {
                      setViewYear(yr);
                      setIsYearPickerOpen(false);
                    }}
                  >
                    <Text style={[styles.yearOptionText, isDarkMode && styles.yearOptionTextDark, viewYear === yr && styles.yearOptionTextSelected]}>
                      {yr}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.gridContainer}>
                <View style={styles.weekDaysRow}>
                  {weekDays.map((d) => (
                    <Text key={d} style={[styles.weekDayText, isDarkMode && styles.weekDayTextDark]}>
                      {d}
                    </Text>
                  ))}
                </View>

                <View style={styles.daysGrid}>
                  {Array.from({ length: firstDayOffset }).map((_, i) => (
                    <View key={`empty-${i}`} style={styles.dayCellEmpty} />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const candidate = new Date(viewYear, viewMonth, day);
                    const isFuture = candidate > today;
                    const isToday =
                      viewYear === currentYear &&
                      viewMonth === currentMonth &&
                      day === currentDate;

                    return (
                      <Pressable
                        key={`day-${day}`}
                        style={[
                          styles.dayCell,
                          isToday && styles.dayCellToday,
                          isFuture && styles.dayCellDisabled,
                        ]}
                        onPress={() => !isFuture && handleSelectDay(day)}
                        disabled={isFuture}
                        hitSlop={4}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            isDarkMode && styles.dayTextDark,
                            isToday && styles.dayTextToday,
                            isFuture && styles.dayTextDisabled,
                          ]}
                        >
                          {day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            <Text style={styles.futureNote}>* Dates after today ({currentDate}/{currentMonth + 1}/{currentYear}) are disabled</Text>
          </View>
        </View>
      </Modal>
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
  userIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userIconCircleDark: {
    backgroundColor: '#0F172A',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
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
  formGrid: {
    gap: 12,
    marginBottom: 16,
  },
  fieldGroup: {
    gap: 4,
    width: '100%',
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    width: '100%',
  },
  inputDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    color: '#F8FAFC',
  },
  datePickerInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  datePickerInputDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  dateTextPlaceholder: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  dateTextSelected: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
  },
  dateTextSelectedDark: {
    fontSize: 13,
    color: '#F8FAFC',
    fontWeight: '700',
  },
  dropdownInputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  dropdownInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingRight: 36,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  dropdownInputDark: {
    backgroundColor: '#0F172A',
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
  noMatchText: {
    fontSize: 11,
    color: '#64748B',
    padding: 10,
    fontStyle: 'italic',
  },
  langSection: {
    marginBottom: 8,
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  langSectionDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  langHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  langTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0369A1',
  },
  langTitleDark: {
    color: '#38BDF8',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  chipSelected: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  chipTextDark: {
    color: '#CBD5E1',
  },
  chipTextSelected: {
    color: '#FFFFFF',
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
  continueButtonDark: {
    backgroundColor: '#0284C7',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  calendarModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    elevation: 8,
  },
  calendarModalCardDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  calendarModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  calHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  calModalTitleDark: {
    color: '#F8FAFC',
  },
  calNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    padding: 4,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  monthYearPickers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0369A1',
  },
  monthTextDark: {
    color: '#38BDF8',
  },
  yearBtn: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  yearBtnDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  yearText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
  },
  yearTextDark: {
    color: '#38BDF8',
  },
  yearPickerScroll: {
    maxHeight: 200,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 10,
  },
  yearPickerScrollDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  yearOption: {
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  yearOptionSelected: {
    backgroundColor: '#E0F2FE',
  },
  yearOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  yearOptionTextDark: {
    color: '#CBD5E1',
  },
  yearOptionTextSelected: {
    color: '#0284C7',
    fontWeight: '800',
  },
  gridContainer: {
    marginBottom: 8,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  weekDayTextDark: {
    color: '#94A3B8',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 36,
  },
  dayCell: {
    width: '14.28%',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dayCellToday: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  dayTextDark: {
    color: '#F8FAFC',
  },
  dayTextToday: {
    color: '#0284C7',
    fontWeight: '800',
  },
  dayTextDisabled: {
    color: '#94A3B8',
  },
  futureNote: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
});
