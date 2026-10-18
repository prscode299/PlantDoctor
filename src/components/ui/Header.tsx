import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { formatToJalali, getTodayIso } from '@/utils/jalali';
import { useTheme } from '@/context/ThemeContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showDate?: boolean;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showDate = false,
  rightAction,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        ) : showDate ? (
          <View style={[styles.dateBadge, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Ionicons name="calendar-outline" size={13} color={colors.primary} style={{ marginLeft: 4 }} />
            <Text style={[styles.dateText, { color: colors.primary }]}>{formatToJalali(getTodayIso())}</Text>
          </View>
        ) : null}
      </View>

      {rightAction && (
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
          onPress={rightAction.onPress}
          activeOpacity={0.7}
        >
          <Ionicons name={rightAction.icon} size={22} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.background,
  },
  textContainer: {
    alignItems: 'flex-end',
  },
  title: {
    fontFamily: 'IRANSansWeb',
    fontSize: 23,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13.5,
    color: Colors.textMuted,
    marginTop: 3,
    fontWeight: '500',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  dateBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginTop: 6,
  },
  dateText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12.5,
    color: Colors.primaryDark,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
