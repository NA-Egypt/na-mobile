import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface NALogoProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export const NALogo: React.FC<NALogoProps> = ({ size = 36, style }) => {
  return (
    <Image
      source={require('../../assets/logo.png')}
      style={[{ width: size, height: size, resizeMode: 'contain' }, style]}
    />
  );
};
