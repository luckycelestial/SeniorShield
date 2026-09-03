import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';

export type ActiveTab = 'shield' | 'calls' | 'messages' | 'evidence' | 'guardian' | 'guide';

interface BottomNavBarProps {
  activeTab: ActiveTab;
  onTabPress: (tab: ActiveTab) => void;
  unreadCallsCount?: number;
  unreadSmsCount?: number;
  isBackendConnected?: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabPress,
  unreadCallsCount = 0,
  unreadSmsCount = 0,
  isBackendConnected = true,
}) => {
  const tabs = [
    { id: 'shield' as ActiveTab, label: 'Shield', icon: '🛡️' },
    { id: 'calls' as ActiveTab, label: 'Calls', icon: '📞', badge: unreadCallsCount },
    { id: 'messages' as ActiveTab, label: 'SMS', icon: '💬', badge: unreadSmsCount },
    { id: 'evidence' as ActiveTab, label: 'AI Evidence', icon: '🧠', dot: isBackendConnected },
    { id: 'guardian' as ActiveTab, label: 'Guardian', icon: '👨‍👩‍👧' },
    { id: 'guide' as ActiveTab, label: 'Guide', icon: '📖' },
  ];

  return (
    <View style={styles.navContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => {
                console.log('👉 [BottomNavBar] Tab Pressed:', tab.id);
                onTabPress(tab.id);
              }}
              activeOpacity={0.7}
            >
              {isActive && <View style={styles.activeIndicator} />}
              <View style={styles.iconWrapper}>
                <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                  {tab.icon}
                </Text>
                {tab.badge ? tab.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                ) : null}
                {tab.dot && (
                  <View
                    style={[
                      styles.serverDot,
                      { backgroundColor: isBackendConnected ? '#10b981' : '#f59e0b' },
                    ]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: Platform.OS === 'ios' ? 24 : 6,
    paddingTop: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingRight: 28,
    gap: 4,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 12,
    minWidth: 62,
    position: 'relative',
  },
  tabButtonActive: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.75,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 1,
  },
  tabLabelActive: {
    color: '#0284C7',
    fontWeight: '900',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: '#0284C7',
    borderRadius: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  serverDot: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
