import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'water';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return '#E2E8F0';
    switch (variant) {
      case 'primary':
        return Colors.primary;
      case 'secondary':
        return Colors.primarySubtle;
      case 'water':
        return Colors.waterBlue;
      case 'danger':
        return Colors.danger;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return Colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return '#94A3B8';
    switch (variant) {
      case 'primary':
      case 'water':
      case 'danger':
        return '#FFFFFF';
      case 'secondary':
        return Colors.primaryDark;
      case 'outline':
        return Colors.primary;
      case 'ghost':
        return Colors.textSecondary;
      default:
        return '#FFFFFF';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[size],
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && styles.outlineBorder,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <View style={styles.content}>
          <Text style={[styles.text, styles[`${size}Text`], { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
          {icon && (
            <Ionicons
              name={icon}
              size={size === 'small' ? 15 : 18}
              color={getTextColor()}
              style={{ marginLeft: 6 }}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
  },
  small: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  smallText: {
    fontSize: 12,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
  },
  mediumText: {
    fontSize: 14,
  },
  large: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  largeText: {
    fontSize: 16,
  },
  outlineBorder: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  disabled: {
    opacity: 0.6,
  },
});
