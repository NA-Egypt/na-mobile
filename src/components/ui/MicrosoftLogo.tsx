import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface MicrosoftLogoProps {
  size?: number;
  gap?: number;
  style?: ViewStyle;
}

export const MicrosoftLogo: React.FC<MicrosoftLogoProps> = ({
  size = 18,
  gap = 2,
  style,
}) => {
  const squareSize = (size - gap) / 2;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
        style,
      ]}
      accessibilityLabel="Microsoft Logo"
    >
      <View style={styles.row}>
        <View
          style={{
            width: squareSize,
            height: squareSize,
            backgroundColor: '#F25022',
            marginRight: gap,
            marginBottom: gap,
          }}
        />
        <View
          style={{
            width: squareSize,
            height: squareSize,
            backgroundColor: '#7FBA00',
            marginBottom: gap,
          }}
        />
      </View>
      <View style={styles.row}>
        <View
          style={{
            width: squareSize,
            height: squareSize,
            backgroundColor: '#00A4EF',
            marginRight: gap,
          }}
        />
        <View
          style={{
            width: squareSize,
            height: squareSize,
            backgroundColor: '#FFB900',
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
});
