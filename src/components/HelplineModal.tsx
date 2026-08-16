import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  X,
  PhoneCall,
  MessageCircle,
  Mail,
  Share2,
  ExternalLink,
  ShieldCheck,
  HeartHandshake,
} from 'lucide-react-native';
import { homeApi } from '../api/home';
import { HelplineItem, SocialLinks } from '../api/types';
import { useAppTheme } from '../theme';
import { AppText, Badge } from './ui';
import { haptic } from '../utils/haptics';

interface HelplineModalProps {
  visible: boolean;
  onClose: () => void;
}

export const HelplineModal: React.FC<HelplineModalProps> = ({ visible, onClose }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { colors, borderRadius, shadows } = useAppTheme();

  const [helplines, setHelplines] = useState<HelplineItem[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinks | null>(null);

  useEffect(() => {
    if (visible) {
      homeApi
        .getHomeData()
        .then((data) => {
          if (data?.helplines?.length) {
            setHelplines(data.helplines);
          } else {
            setHelplines(defaultHelplines);
          }
          if (data?.social_links) {
            setSocialLinks(data.social_links);
          } else {
            setSocialLinks(defaultSocialLinks);
          }
        })
        .catch(() => {
          setHelplines(defaultHelplines);
          setSocialLinks(defaultSocialLinks);
        });
    }
  }, [visible]);

  const defaultHelplines: HelplineItem[] = [
    {
      region: 'Cairo & Giza',
      region_ar: 'القاهرة والجيزة',
      phones: ['+201006979198', '+201060933888'],
      whatsapp: 'https://wa.me/201060933888',
    },
    {
      region: 'Alexandria & North Coast',
      region_ar: 'الإسكندرية والساحل الشمالي',
      phones: ['+201288220038', '+201006979198'],
      whatsapp: 'https://wa.me/201288220038',
    },
    {
      region: 'Delta & Canal Cities',
      region_ar: 'الدلتا ومدن القناة',
      phones: ['+201060933888'],
      whatsapp: 'https://wa.me/201060933888',
    },
    {
      region: 'Upper Egypt & Red Sea',
      region_ar: 'الصعيد والبحر الأحمر',
      phones: ['+201006979198'],
      whatsapp: 'https://wa.me/201006979198',
    },
  ];

  const defaultSocialLinks: SocialLinks = {
    facebook: 'https://www.facebook.com/OfficialNAEgyPage',
    instagram: 'https://www.instagram.com/narcoticsanonymousegy',
    tiktok: 'https://www.tiktok.com/@narcoticsanonymousegypt',
    whatsapp: 'https://wa.me/201060933888',
    email: 'pr@naegypt.org',
  };

  const handleCall = (phone: string) => {
    haptic.selection();
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert(isAr ? 'تنبيه' : 'Notice', isAr ? 'تعذر فتح تطبيق الهاتف.' : 'Could not open phone dialer.');
    });
  };

  const handleWhatsApp = (url?: string) => {
    haptic.selection();
    const target = url || defaultSocialLinks.whatsapp || 'https://wa.me/201060933888';
    Linking.openURL(target).catch(() => {
      Alert.alert(isAr ? 'تنبيه' : 'Notice', isAr ? 'تعذر فتح واتساب.' : 'Could not open WhatsApp.');
    });
  };

  const handleOpenLink = (url?: string) => {
    if (!url) return;
    haptic.selection();
    Linking.openURL(url).catch(() => {
      Alert.alert(isAr ? 'تنبيه' : 'Notice', isAr ? 'تعذر فتح الرابط.' : 'Could not open URL.');
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.cardBorder }]}>
          <View style={styles.headerTitleRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accentLight }]}>
              <PhoneCall size={18} color={colors.accentDark} />
            </View>
            <View>
              <AppText variant="h3" color={colors.textPrimary} weight="800">
                {isAr ? 'خطوط المساعدة والتواصل' : 'Helplines & Official Channels'}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {isAr ? 'نحن متواجدون لمساعدتك ومساعدة من تحب' : 'We are here to help you and your loved ones'}
              </AppText>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              haptic.light();
              onClose();
            }}
            style={[styles.closeBtn, { backgroundColor: colors.bgSecondary }]}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Fellowship Message Banner */}
          <View
            style={[
              styles.bannerBox,
              shadows.card,
              {
                backgroundColor: colors.primaryDark,
                borderRadius: borderRadius.card,
              },
            ]}
          >
            <HeartHandshake size={28} color={colors.accent} style={{ marginBottom: 6 }} />
            <AppText variant="body" color="#ffffff" weight="700" style={styles.bannerText}>
              {isAr
                ? 'هل تعاني أو يعاني شخص قريب منك من مشكلة مع المخدرات؟ لست وحدك، زمالة NA تمد لك يد المساعدة بكل سرية ومجانية.'
                : 'Are you or a loved one struggling with drugs? You are not alone. NA offers confidential, free support.'}
            </AppText>
            <View style={styles.bannerBadge}>
              <ShieldCheck size={14} color={colors.accent} style={{ marginEnd: 4 }} />
              <AppText variant="caption" color="rgba(224, 248, 252, 0.85)" weight="700">
                {isAr ? 'السرية التامة مضمونة دائماً' : 'Complete Confidentiality Guaranteed'}
              </AppText>
            </View>
          </View>

          {/* Regional Helplines Section */}
          <AppText variant="h4" color={colors.textPrimary} weight="800" style={styles.sectionTitle}>
            {isAr ? 'أرقام خطوط المساعدة حسب المحافظة' : 'Regional Helpline Numbers'}
          </AppText>

          {helplines.map((item, index) => (
            <View
              key={index}
              style={[
                styles.helplineCard,
                shadows.card,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                  borderRadius: borderRadius.card,
                },
              ]}
            >
              <View style={styles.helplineHeader}>
                <AppText variant="h4" color={colors.textPrimary} weight="700">
                  {isAr ? item.region_ar || item.region : item.region}
                </AppText>
                <Badge
                  label={isAr ? 'متاح يومياً' : 'Daily Support'}
                  variant="success"
                  size="sm"
                />
              </View>

              <View style={styles.phoneList}>
                {item.phones.map((phone, pIdx) => (
                  <TouchableOpacity
                    key={pIdx}
                    style={[styles.phoneButton, { backgroundColor: colors.bgSecondary, borderColor: colors.cardBorder }]}
                    onPress={() => handleCall(phone)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.btnIconCircle, { backgroundColor: colors.accentLight }]}>
                      <PhoneCall size={14} color={colors.accentDark} />
                    </View>
                    <AppText variant="body" color={colors.primary} weight="700" style={styles.phoneText}>
                      {phone}
                    </AppText>
                    <Badge label={isAr ? 'اتصال مباشر' : 'Call'} variant="accent" size="sm" />
                  </TouchableOpacity>
                ))}
              </View>

              {item.whatsapp ? (
                <TouchableOpacity
                  style={[styles.whatsappButton, { backgroundColor: '#25D366' }]}
                  onPress={() => handleWhatsApp(item.whatsapp)}
                  activeOpacity={0.85}
                >
                  <MessageCircle size={18} color="#ffffff" style={{ marginEnd: 8 }} />
                  <AppText variant="body" color="#ffffff" weight="700">
                    {isAr ? 'تواصل عبر واتساب فوراً' : 'Chat on WhatsApp'}
                  </AppText>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}

          {/* Official Social Media Channels */}
          <AppText variant="h4" color={colors.textPrimary} weight="800" style={[styles.sectionTitle, { marginTop: 16 }]}>
            {isAr ? 'القنوات والمنصات الرسمية' : 'Official Fellowship Channels'}
          </AppText>

          <View
            style={[
              styles.socialCard,
              shadows.card,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
                borderRadius: borderRadius.card,
              },
            ]}
          >
            {socialLinks?.facebook ? (
              <TouchableOpacity
                style={styles.socialItem}
                onPress={() => handleOpenLink(socialLinks.facebook)}
                activeOpacity={0.7}
              >
                <View style={[styles.socialIconBox, { backgroundColor: '#1877F2' }]}>
                  <Share2 size={16} color="#ffffff" />
                </View>
                <View style={styles.socialTextCol}>
                  <AppText variant="body" color={colors.textPrimary} weight="700">
                    Facebook
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {isAr ? 'الصفحة الرسمية لزمالة NA مصر' : 'Official Facebook Page'}
                  </AppText>
                </View>
                <ExternalLink size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}

            {socialLinks?.instagram ? (
              <TouchableOpacity
                style={styles.socialItem}
                onPress={() => handleOpenLink(socialLinks.instagram)}
                activeOpacity={0.7}
              >
                <View style={[styles.socialIconBox, { backgroundColor: '#E4405F' }]}>
                  <Share2 size={16} color="#ffffff" />
                </View>
                <View style={styles.socialTextCol}>
                  <AppText variant="body" color={colors.textPrimary} weight="700">
                    Instagram
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    @narcoticsanonymousegy
                  </AppText>
                </View>
                <ExternalLink size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}

            {socialLinks?.email ? (
              <TouchableOpacity
                style={styles.socialItem}
                onPress={() => Linking.openURL(`mailto:${socialLinks.email}`)}
                activeOpacity={0.7}
              >
                <View style={[styles.socialIconBox, { backgroundColor: colors.primary }]}>
                  <Mail size={16} color="#ffffff" />
                </View>
                <View style={styles.socialTextCol}>
                  <AppText variant="body" color={colors.textPrimary} weight="700">
                    {isAr ? 'البريد الإلكتروني للجنة العلاقات العامة' : 'PR Committee Email'}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {socialLinks.email}
                  </AppText>
                </View>
                <ExternalLink size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  bannerBox: {
    padding: 18,
    marginBottom: 16,
  },
  bannerText: {
    lineHeight: 24,
    marginBottom: 10,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 4,
  },
  helplineCard: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  helplineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  phoneList: {
    gap: 8,
    marginBottom: 10,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  btnIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 10,
  },
  phoneText: {
    flex: 1,
    fontSize: 15,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  socialCard: {
    padding: 8,
    borderWidth: 1,
  },
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  socialIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 12,
  },
  socialTextCol: {
    flex: 1,
  },
});
