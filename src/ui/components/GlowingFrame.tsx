import { cyberpunkTheme } from '@/constants/theme';
import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'glass';
  style?: ViewStyle | ViewStyle[];
  glowIntensity?: number;
};

/**
 * GlowingFrame - Cyberpunk-styled container with neon borders and glow effects
 */
export default function GlowingFrame({
  children,
  variant = 'primary',
  style,
  glowIntensity = 0.6,
}: Props) {
  const getBorderColor = () => {
    switch (variant) {
      case 'primary':
        return cyberpunkTheme.borderNeon;
      case 'secondary':
        return cyberpunkTheme.borderGlow;
      case 'glass':
        return cyberpunkTheme.glassBorder;
      default:
        return cyberpunkTheme.borderNeon;
    }
  };

  const getShadowColor = () => {
    switch (variant) {
      case 'primary':
        return cyberpunkTheme.acidGreen;
      case 'secondary':
        return cyberpunkTheme.electricCyan;
      case 'glass':
        return 'transparent';
      default:
        return cyberpunkTheme.acidGreen;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: getBorderColor(),
          backgroundColor: variant === 'glass' ? cyberpunkTheme.glassLight : cyberpunkTheme.glassDark,
          shadowColor: getShadowColor(),
          shadowOpacity: variant === 'glass' ? 0 : glowIntensity * 0.5,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 0 },
          elevation: variant === 'glass' ? 0 : 8,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
  },
});

