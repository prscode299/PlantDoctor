import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface BadgeProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'water' | 'fertilizer' | 'danger' | 'warning' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  icon,
  variant = 'primary',
}) => {
  const { colors } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'water':
        return { bg: colors.waterLight, text: colors.waterDark };
      case 'fertilizer':
        return { bg: colors.fertilizerLight, text: colors.fertilizerDark };
      case 'danger':
        return { bg: colors.dangerLight, text: colors.danger };
      case 'warning':
        return { bg: colors.warningLight, text: colors.warning };
      case 'neutral':
        return { bg: colors.surfaceSubtle, text: colors.textMuted };
      case 'primary':
      default:
        return { bg: colors.primarySubtle, text: colors.primaryDark };
    }
  };

  const { bg, text } = getColors();

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {icon && (
        <Ionicons
          name={icon}
          size={13}
          color={text}
          style={{ marginLeft: 4 }}
        />
      )}
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
});
