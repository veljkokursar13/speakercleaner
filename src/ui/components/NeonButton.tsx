import { cyberpunkTheme } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'accent';

export interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  glowIntensity?: number; // 0-1, controls glow strength
}

export default function NeonButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
  glowIntensity = 0.8,
}: Props) {
  const getGradientColors = () => {
    switch (variant) {
      case 'primary':
        return cyberpunkTheme.neonPrimary;
      case 'secondary':
        return cyberpunkTheme.neonSecondary;
      case 'accent':
        return cyberpunkTheme.neonAccent;
      default:
        return cyberpunkTheme.neonPrimary;
    }
  };

  const getShadowColor = () => {
    switch (variant) {
      case 'primary':
        return cyberpunkTheme.acidGreen;
      case 'secondary':
        return cyberpunkTheme.magenta;
      case 'accent':
        return '#FFD600';
      default:
        return cyberpunkTheme.acidGreen;
    }
  };

  const gradientColors = getGradientColors();
  const shadowColor = getShadowColor();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          shadowColor,
          shadowOpacity: disabled ? 0 : glowIntensity,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 0 },
          elevation: disabled ? 0 : 12,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      <LinearGradient
        colors={disabled ? ['#333333', '#1a1a1a'] : gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={[styles.text, textStyle]}>
          {label.toUpperCase()}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});
