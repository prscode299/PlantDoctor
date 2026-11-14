import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

const TabLabel = ({ title, focused, color }: { title: string; focused: boolean; color: any }) => (
  <Text
    style={[
      styles.tabBarLabel,
      { color },
      focused && { fontWeight: '800' },
    ]}
    numberOfLines={1}
  >
    {title}
  </Text>
);

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : Platform.OS === 'web' ? 14 : 10);
  const tabHeight = 66 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? colors.primary : colors.primaryContainer,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: isDark ? colors.surfaceContainerLowest : '#FFFFFF',
            borderTopColor: colors.borderLight,
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
          title: 'باغچه من',
          tabBarLabel: ({ focused, color }) => <TabLabel title="باغچه من" focused={focused} color={color} />,
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrapper,
                focused && {
                  backgroundColor: isDark ? colors.surfaceContainer : '#E6F8E8',
                },
              ]}
            >
              <Ionicons
                name={focused ? 'leaf' : 'leaf-outline'}
                size={21}
                color={focused ? (isDark ? colors.primary : colors.primaryContainer) : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'تقویم شمسی',
          tabBarLabel: ({ focused, color }) => <TabLabel title="تقویم شمسی" focused={focused} color={color} />,
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrapper,
                focused && {
                  backgroundColor: isDark ? colors.surfaceContainer : '#E6F8E8',
                },
              ]}
            >
              <Ionicons
                name={focused ? 'calendar' : 'calendar-outline'}
                size={21}
                color={focused ? (isDark ? colors.primary : colors.primaryContainer) : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ai-doctor"
        options={{
          title: 'دکتر هوشمند ✨',
          tabBarLabel: ({ focused, color }) => <TabLabel title="دکتر هوشمند ✨" focused={focused} color={color} />,
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrapper,
                focused && {
                  backgroundColor: isDark ? colors.surfaceContainer : '#E6F8E8',
                },
              ]}
            >
              <Ionicons
                name={focused ? 'sparkles' : 'sparkles-outline'}
                size={21}
                color={focused ? (isDark ? colors.primary : colors.primaryContainer) : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'تنظیمات',
          tabBarLabel: ({ focused, color }) => <TabLabel title="تنظیمات" focused={focused} color={color} />,
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrapper,
                focused && {
                  backgroundColor: isDark ? colors.surfaceContainer : '#E6F8E8',
                },
              ]}
            >
              <Ionicons
                name={focused ? 'settings' : 'settings-outline'}
                size={21}
                color={focused ? (isDark ? colors.primary : colors.primaryContainer) : color}
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
    borderTopWidth: 1,
    paddingTop: 8,
    shadowColor: 'rgba(30, 94, 58, 0.08)',
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
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarLabel: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
    marginBottom: 2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
