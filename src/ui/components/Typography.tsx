import React, { PropsWithChildren } from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export function Title({ style, children, ...props }: PropsWithChildren<TextProps>) {
  const theme = useTheme();
  return (
    <Text {...props} style={[theme.titleStyle, style]}>
      {children}
    </Text>
  );
}

export function Subtitle({ style, children, ...props }: PropsWithChildren<TextProps>) {
  const theme = useTheme();
  return (
    <Text {...props} style={[theme.subTitleStyle, style]}>
      {children}
    </Text>
  );
}

export function BodyText({ style, children, ...props }: PropsWithChildren<TextProps>) {
  const theme = useTheme();
  return (
    <Text {...props} style={[theme.textStyle, style]}>
      {children}
    </Text>
  );
}


