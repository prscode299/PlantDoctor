import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

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
  const getColors = () => {
    switch (variant) {
      case 'water':
        return { bg: Colors.waterLight, text: Colors.waterBlue };
      case 'fertilizer':
        return { bg: Colors.fertilizerLight, text: Colors.fertilizerDark };
      case 'danger':
        return { bg: Colors.dangerLight, text: Colors.danger };
      case 'warning':
        return { bg: Colors.warningLight, text: Colors.warning };
      case 'neutral':
        return { bg: Colors.surfaceSubtle, text: Colors.textMuted };
      case 'primary':
      default:
        return { bg: Colors.primarySubtle, text: Colors.primaryDark };
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
