import { I18nManager } from 'react-native';

export const isRTL = (lang?: string): boolean => {
  if (lang) {
    return lang === 'ar';
  }
  return I18nManager.isRTL;
};

export const getRTLFlexDirection = (isAr: boolean): 'row' | 'row-reverse' => {
  return isAr ? 'row-reverse' : 'row';
};

export const getRTLTextAlign = (isAr: boolean): 'right' | 'left' => {
  return isAr ? 'right' : 'left';
};

export const getRTLTransformFlip = (isAr: boolean) => {
  return isAr ? [{ scaleX: -1 }] : [];
};
