import React, { useEffect } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { cyberpunkTheme } from '../../constants/theme';


type Props = {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
};

export default function Slider({ min, max, step, value, onChange }: Props) {
  const [inputValue, setInputValue] = React.useState(value.toString());

  // Sync input value when prop value changes
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleTextChange = (text: string) => {
    setInputValue(text);
    
    // Allow empty string while typing
    if (text === '' || text === '-') {
      return;
    }

    const numValue = parseFloat(text);
    if (!isNaN(numValue)) {
      // Clamp value to min/max range
      const clampedValue = Math.max(min, Math.min(max, numValue));
      // Only call onChange if value is valid and clamped
      if (onChange && typeof onChange === 'function') {
        onChange(clampedValue);
      }
    }
  };

  const handleBlur = () => {
    Keyboard.dismiss();
    // On blur, ensure value is clamped and synced
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || numValue < min || numValue > max) {
      const clampedValue = Math.max(min, Math.min(max, numValue || value));
      setInputValue(clampedValue.toString());
      if (onChange && typeof onChange === 'function') {
        onChange(clampedValue);
      }
    } else {
      // Value is valid, sync it
      if (onChange && typeof onChange === 'function') {
        onChange(numValue);
      }
    }
  };

  const handleOutsidePress = () => {
    Keyboard.dismiss();
    // Clamp and confirm the current input value
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue));
      setInputValue(clampedValue.toString());
      if (onChange && typeof onChange === 'function') {
        onChange(clampedValue);
      }
    } else {
      // Invalid input, revert to current value
      const clampedValue = Math.max(min, Math.min(max, value));
      setInputValue(clampedValue.toString());
      if (onChange && typeof onChange === 'function') {
        onChange(clampedValue);
      }
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <View style={styles.container}>
        <Text style={styles.label}>{Math.round(value)} Hz</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.minMax}>{min} Hz</Text>
          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={handleTextChange}
            onBlur={handleBlur}
            keyboardType="numeric"
            placeholder={`${min}-${max}`}
            placeholderTextColor={cyberpunkTheme.textSecondary}
          />
          <Text style={styles.minMax}>{max} Hz</Text>
        </View>
        <View style={styles.placeholder} />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
    gap: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: cyberpunkTheme.textNeon,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: cyberpunkTheme.background,
    borderWidth: 1,
    borderColor: cyberpunkTheme.acidGreen,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: cyberpunkTheme.textNeon,
    fontSize: 16,
    textAlign: 'center',
  },
  minMax: {
    fontSize: 12,
    color: cyberpunkTheme.textSecondary,
  },
  placeholder: {
    height: 4,
    backgroundColor: cyberpunkTheme.textSecondary,
    borderRadius: 2,
    marginTop: 8,
  },
});