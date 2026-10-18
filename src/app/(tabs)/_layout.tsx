import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';

const TabLabel = ({ title, focused }: { title: string; focused: boolean }) => (
  <Text
    style={[
      styles.tabBarLabel,
      { color: focused ? Colors.primary : Colors.textMuted },
    ]}
    numberOfLines={1}
  >
    {title}
  </Text>
);

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  // Ensure enough bottom clearance on Android and Web inside the phone frame
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : Platform.OS === 'web' ? 14 : 10);
  const tabHeight = 68 + bottomPadding;

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
          tabBarLabel: ({ focused }) => <TabLabel title="گیاهان من" focused={focused} />,
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
          tabBarLabel: ({ focused }) => <TabLabel title="تقویم شمسی" focused={focused} />,
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
          tabBarLabel: ({ focused }) => <TabLabel title="دکتر گیاه ✨" focused={focused} />,
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
          tabBarLabel: ({ focused }) => <TabLabel title="تنظیمات" focused={focused} />,
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
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 3,
    marginBottom: 2,
    lineHeight: 18,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
