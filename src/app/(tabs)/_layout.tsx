import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  // Ensure enough bottom clearance on Android (especially devices with 3-button system bars)
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);
  const tabHeight = 60 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabHeight,
            paddingBottom: bottomPadding,
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'گیاهان من',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Ionicons
                name={focused ? 'leaf' : 'leaf-outline'}
                size={22}
                color={focused ? Colors.primary : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'تقویم شمسی',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Ionicons
                name={focused ? 'calendar' : 'calendar-outline'}
                size={22}
                color={focused ? Colors.primary : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ai-doctor"
        options={{
          title: 'دکتر گیاه ✨',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Ionicons
                name={focused ? 'sparkles' : 'sparkles-outline'}
                size={22}
                color={focused ? Colors.primary : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'تنظیمات',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Ionicons
                name={focused ? 'settings' : 'settings-outline'}
                size={22}
                color={focused ? Colors.primary : color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderTopColor: Colors.borderLight,
    paddingTop: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
  iconWrapper: {
    width: 36,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: Colors.primarySubtle,
  },
  tabBarLabel: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
});
