import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  X,
  BookOpen,
  Sparkles,
  Share2,
  Calendar as CalendarIcon,
  Quote,
  Flame,
} from 'lucide-react-native';
import { homeApi } from '../api/home';
import { JftData } from '../api/types';
import { useAppTheme } from '../theme';
import { AppText, Badge, Skeleton } from './ui';
import { haptic } from '../utils/haptics';

interface JftModalProps {
  visible: boolean;
  onClose: () => void;
}

export const JftModal: React.FC<JftModalProps> = ({ visible, onClose }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { colors, borderRadius, shadows } = useAppTheme();

  const [jft, setJft] = useState<JftData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchJft = async () => {
    setLoading(true);
    try {
      const data = await homeApi.getJft();
      if (data && (data.title || data.quote || data.thought_for_the_day)) {
        setJft(data);
      } else {
        // Fallback default reading
        setJft({
          page_date: isAr ? 'قراءة اليوم' : 'Daily Reading',
          title: isAr ? 'الامتنان والتعافي اليومي' : 'Gratitude & Daily Recovery',
          quote: isAr
            ? 'إن امتناننا هو ما يحفظ تعافينا حياً ونابضاً بالروح.'
            : 'Our gratitude speaks when we care and when we share with others the NA way.',
          quote_source: isAr ? 'النص الأساسي لزمالة NA' : 'NA Basic Text',
          content: isAr
            ? [
                'في تعافينا، نكتشف كل يوم أن البقاء ممتنعين عن المخدرات ليوم واحد هو هبة عظيمة.',
                'عندما نشارك خبرتنا وأملنا وقوتنا مع المدمن الذي لا يزال يعاني، نكتشف معنى الحرية الحقيقية.',
              ]
            : [
                'In our recovery, we discover each day that staying clean for just today is a profound gift.',
                'When we share our experience, strength, and hope with the addict who still suffers, we find true freedom.',
              ],
          thought_for_the_day: isAr
            ? 'لليوم فقط: سأكون ممتناً لتعافيي، وسأبذل قصارى جهدي لمساعدة زميل آخر.'
            : 'Just For Today: I will be grateful for my recovery and reach out to help another fellow.',
        });
      }
    } catch {
      // Local fallback in case offline
      setJft({
        page_date: isAr ? 'قراءة اليوم' : 'Daily Reading',
        title: isAr ? 'لليوم فقط' : 'Just For Today',
        quote: isAr
          ? 'لليوم فقط ستكون أفكاري منصبة على تعافيي، والحياة دون تعاطي المخدرات والتمتع بها.'
          : 'Just for today my thoughts will be on my recovery, living and enjoying life without the use of drugs.',
        quote_source: isAr ? 'كتيب لليوم فقط' : 'Just For Today Book',
        content: isAr
          ? [
              'لا داعي للقلق بشأن الغد أو التفكير في أخطاء الأمس. كل ما نملكه هو هذه الـ 24 ساعة الحالية لنعيشها بنقاء وسلام.',
            ]
          : [
              'There is no need to worry about tomorrow or live in the regret of yesterday. We only have these current 24 hours to live in peace and clarity.',
            ],
        thought_for_the_day: isAr
          ? 'لليوم فقط: لن أخاف، وسأثق في قوتي العظمى وأعضاء الزمالة.'
          : 'Just For Today: I will be unafraid, trusting my Higher Power and my NA fellowship.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchJft();
    }
  }, [visible]);

  const handleShare = async () => {
    if (!jft) return;
    haptic.selection();
    try {
      const shareMessage = `📖 ${jft.title || 'لليوم فقط'}\n${jft.page_date ? `📅 ${jft.page_date}\n` : ''}\n"${jft.quote || ''}"\n— ${jft.quote_source || 'زمالة NA'}\n\n${(jft.content || []).join('\n\n')}\n\n✨ ${jft.thought_for_the_day || ''}\n\n📱 تطبيق زمالة NA مصر\nhttps://egyptna.org`;
      await Share.share({
        message: shareMessage,
        title: jft.title || 'لليوم فقط - NA Egypt',
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.cardBorder }]}>
          <View style={styles.headerTitleRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accentLight }]}>
              <Sparkles size={18} color={colors.accentDark} />
            </View>
            <View>
              <AppText variant="h3" color={colors.textPrimary} weight="800">
                {isAr ? 'لليوم فقط (Just For Today)' : 'Just For Today Reading'}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {isAr ? 'التأمل الروحي والتعافي اليومي' : 'Daily Spiritual Reflection'}
              </AppText>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleShare}
              style={[styles.actionBtn, { backgroundColor: colors.bgSecondary }]}
              accessibilityRole="button"
              accessibilityLabel="Share"
            >
              <Share2 size={18} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                haptic.light();
                onClose();
              }}
              style={[styles.actionBtn, { backgroundColor: colors.bgSecondary }]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Body Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Skeleton width="40%" height={24} borderRadius={12} style={{ marginBottom: 12 }} />
            <Skeleton width="80%" height={28} style={{ marginBottom: 16 }} />
            <Skeleton width="100%" height={90} borderRadius={14} style={{ marginBottom: 20 }} />
            <Skeleton width="100%" height={140} borderRadius={14} style={{ marginBottom: 20 }} />
            <Skeleton width="100%" height={80} borderRadius={14} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Date Badge & Title Card */}
            <View
              style={[
                styles.titleCard,
                shadows.card,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                  borderRadius: borderRadius.card,
                },
              ]}
            >
              <View style={styles.dateRow}>
                {jft?.page_date ? (
                  <Badge
                    label={jft.page_date}
                    variant="accent"
                    size="md"
                    icon={<CalendarIcon size={13} color={colors.accentDark} />}
                  />
                ) : null}
                <Badge
                  label={isAr ? 'زمالة NA مصر' : 'NA Egypt'}
                  variant="neutral"
                  size="sm"
                />
              </View>

              <AppText variant="h2" color={colors.primary} weight="800" style={styles.readingTitle}>
                {jft?.title}
              </AppText>
            </View>

            {/* Quote Box */}
            {jft?.quote ? (
              <View
                style={[
                  styles.quoteBox,
                  shadows.card,
                  {
                    backgroundColor: colors.primaryDark,
                    borderRadius: borderRadius.card,
                  },
                ]}
              >
                <Quote size={24} color={colors.accent} style={{ marginBottom: 6, opacity: 0.8 }} />
                <AppText variant="body" color="#ffffff" weight="600" style={styles.quoteText}>
                  "{jft.quote}"
                </AppText>
                {jft.quote_source ? (
                  <AppText variant="caption" color="rgba(224, 248, 252, 0.8)" weight="700" style={styles.quoteSource}>
                    — {jft.quote_source}
                  </AppText>
                ) : null}
              </View>
            ) : null}

            {/* Paragraphs */}
            {jft?.content && jft.content.length > 0 ? (
              <View
                style={[
                  styles.paragraphsCard,
                  shadows.card,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                    borderRadius: borderRadius.card,
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <BookOpen size={16} color={colors.primary} style={{ marginEnd: 6 }} />
                  <AppText variant="label" color={colors.primary} weight="700">
                    {isAr ? 'التأمل اليومي' : 'Daily Reflection'}
                  </AppText>
                </View>

                {jft.content.map((paragraph, index) => (
                  <AppText
                    key={index}
                    variant="body"
                    color={colors.textPrimary}
                    style={styles.paragraphText}
                  >
                    {paragraph}
                  </AppText>
                ))}
              </View>
            ) : null}

            {/* Thought for the Day */}
            {jft?.thought_for_the_day ? (
              <View
                style={[
                  styles.thoughtCard,
                  shadows.card,
                  {
                    backgroundColor: colors.accentLight,
                    borderColor: colors.accent + '40',
                    borderRadius: borderRadius.card,
                  },
                ]}
              >
                <View style={styles.thoughtHeader}>
                  <Flame size={18} color={colors.accentDark} style={{ marginEnd: 6 }} />
                  <AppText variant="label" color={colors.accentDark} weight="800">
                    {isAr ? 'فكرة اليوم (Thought for Today)' : 'Thought For Today'}
                  </AppText>
                </View>
                <AppText variant="body" color={colors.accentDark} weight="700" style={styles.thoughtText}>
                  {jft.thought_for_the_day}
                </AppText>
              </View>
            ) : null}
          </ScrollView>
        )}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: 20,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  titleCard: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  readingTitle: {
    lineHeight: 28,
  },
  quoteBox: {
    padding: 18,
    marginBottom: 14,
  },
  quoteText: {
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  quoteSource: {
    marginTop: 10,
    textAlign: 'right',
  },
  paragraphsCard: {
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  paragraphText: {
    marginBottom: 12,
    lineHeight: 24,
  },
  thoughtCard: {
    padding: 16,
    borderWidth: 1,
  },
  thoughtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  thoughtText: {
    lineHeight: 22,
  },
});
