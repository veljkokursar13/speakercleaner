import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export interface QuantumButtonProps {
  title: string;
  colors: string[]; // gradient outline colors
  onPress?: () => void;
  style?: ViewStyle;
}

export const QuantumButton = ({ title, colors, onPress, style }: QuantumButtonProps) => {
  const theme = useTheme();
  return (
    <LinearGradient
      colors={colors as [string, string] | [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.gradientBorder, style]}
    >
      <TouchableOpacity onPress={onPress} style={styles.buttonInner}>
        <Text style={[theme.textStyle, styles.text]}>{title}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default function NeonButton(props: QuantumButtonProps) {
  return <QuantumButton {...props} />;
}

const styles = StyleSheet.create({
  gradientBorder: {
    borderRadius: 50,
    padding: 2,               // controls outline thickness
    marginVertical: 8,
  },
  buttonInner: {
    backgroundColor: 'rgba(0,0,0,0.3)', // transparent/blurred look
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 1,
  },
});
