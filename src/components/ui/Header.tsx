import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { formatToJalali, getTodayIso, toPersianDigits } from '@/utils/jalali';
import { useTheme } from '@/context/ThemeContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showDate?: boolean;
  showBrandHeader?: boolean;
  showClimateSensor?: boolean;
  cityName?: string;
  temperature?: number;
  humidity?: number;
  notificationCount?: number;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showDate = false,
  showBrandHeader = false,
  showClimateSensor = false,
  cityName = 'مشهد',
  temperature = 25,
  humidity = 58,
  notificationCount = 0,
  rightAction,
  onNotificationPress,
  onProfilePress,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      {showBrandHeader && (
        <View style={styles.topRow}>
          {/* User Profile Avatar with Emerald Ring */}
          <TouchableOpacity
            style={[styles.avatarButton, { borderColor: colors.primary, backgroundColor: colors.surfaceContainerLow }]}
            onPress={onProfilePress}
            activeOpacity={0.7}
          >
            <Ionicons name="person" size={18} color={colors.primary} />
          </TouchableOpacity>

          {/* Center / Brand Logo & Name */}
          <View style={styles.brandContainer}>
            <View style={[styles.brandLogoBg, { backgroundColor: colors.primaryContainer }]}>
              <Ionicons name="leaf" size={16} color={colors.onPrimaryContainer || '#92F7C3'} />
            </View>
            <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>گیاه‌یار</Text>
          </View>

          {/* Notification Bell */}
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            onPress={onNotificationPress}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
            {notificationCount > 0 && (
              <View style={[styles.pulseBadge, { backgroundColor: colors.danger }]}>
                <Text style={styles.pulseText}>{toPersianDigits(notificationCount)}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.mainRow}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          ) : showDate ? (
            <View style={[styles.dateBadge, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight }]}>
              <Ionicons name="calendar-outline" size={13} color={colors.primary} style={{ marginLeft: 5 }} />
              <Text style={[styles.dateText, { color: colors.primary }]}>{formatToJalali(getTodayIso())}</Text>
            </View>
          ) : null}
        </View>

        {showClimateSensor ? (
          <TouchableOpacity
            style={[styles.climatePill, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            onPress={onProfilePress}
            activeOpacity={0.75}
          >
            {cityName ? (
              <View style={styles.cityItem}>
                <Ionicons name="location" size={12} color={colors.primary} style={{ marginLeft: 3 }} />
                <Text style={[styles.cityNameText, { color: colors.primary }]}>{cityName}</Text>
                <View style={[styles.climateDivider, { backgroundColor: colors.borderLight }]} />
              </View>
            ) : null}
            <View style={styles.climateItem}>
              <Ionicons name="sunny-outline" size={13} color={colors.fertilizerAmber} />
              <Text style={[styles.climateText, { color: colors.textSecondary }]}>{toPersianDigits(temperature)}°C</Text>
            </View>
            <View style={[styles.climateDivider, { backgroundColor: colors.borderLight }]} />
            <View style={styles.climateItem}>
              <Ionicons name="water-outline" size={13} color={colors.tertiary} />
              <Text style={[styles.climateText, { color: colors.textSecondary }]}>{toPersianDigits(humidity)}%</Text>
            </View>
          </TouchableOpacity>
        ) : rightAction ? (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            onPress={rightAction.onPress}
            activeOpacity={0.7}
          >
            <Ionicons name={rightAction.icon} size={22} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brandContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  brandLogoBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  pulseText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 9.5,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  mainRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    alignItems: 'flex-end',
    flex: 1,
  },
  title: {
    fontFamily: 'IRANSansWeb',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    marginTop: 3,
    fontWeight: '500',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  dateBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 4.5,
    borderRadius: 16,
    marginTop: 6,
  },
  dateText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  climatePill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 20,
    gap: 7,
  },
  cityItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  cityNameText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    fontWeight: '800',
  },
  climateItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3.5,
  },
  climateDivider: {
    width: 1,
    height: 12,
  },
  climateText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    fontWeight: '700',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});
