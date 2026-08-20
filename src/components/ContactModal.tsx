import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  X,
  Send,
  Mail,
  HeartHandshake,
  ShieldCheck,
} from 'lucide-react-native';
import { addOutboxAction } from '../database/outboxWorker';
import { apiClient } from '../api/client';
import { useAppTheme } from '../theme';
import { AppText, AppButton } from './ui';
import { haptic } from '../utils/haptics';

interface ContactModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ visible, onClose }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { colors, borderRadius, shadows } = useAppTheme();

  const [senderName, setSenderName] = useState('');
  const [senderContact, setSenderContact] = useState('');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    haptic.light();
    onClose();
  };

  const handleSubmit = async () => {
    if (!details.trim()) {
      haptic.warning();
      Alert.alert(
        isAr ? 'تنبيه' : 'Notice',
        isAr ? 'يرجى كتابة رسالتك أو استفسارك قبل الإرسال.' : 'Please enter your message or inquiry before sending.'
      );
      return;
    }

    setIsSubmitting(true);
    haptic.selection();

    const payload = {
      name: senderName.trim() || (isAr ? 'عضو زمالة NA' : 'NA Member'),
      email: senderContact.trim() || null,
      contact: senderContact.trim() || null,
      subject: subject.trim() || (isAr ? 'استفسار من تطبيق الهاتف' : 'Mobile App Inquiry'),
      message: details.trim(),
      recipient: 'hello@naegypt.org',
      submitted_at: new Date().toISOString(),
    };

    try {
      // 1. Try sending directly to API
      let sentDirectly = false;
      try {
        await apiClient.post('/contact-requests', payload);
        sentDirectly = true;
      } catch (err: any) {
        if (err.response && err.response.status === 404) {
          try {
            await apiClient.post('/contact-us', payload);
            sentDirectly = true;
          } catch {
            sentDirectly = false;
          }
        }
      }

      // 2. If network offline or direct send failed, queue to outbox
      if (!sentDirectly) {
        await addOutboxAction('/contact-requests', 'POST', payload);
      }

      haptic.success();
      Alert.alert(
        isAr ? 'تم الإرسال بنجاح' : 'Message Sent',
        isAr
          ? 'تم إرسال رسالتك بنجاح إلى لجنة العلاقات العامة بالزمالة (hello@naegypt.org). شكراً لتواصلك.'
          : 'Your message has been sent successfully to the Public Relations committee (hello@naegypt.org). Thank you for reaching out.'
      );

      setSenderName('');
      setSenderContact('');
      setSubject('');
      setDetails('');
      onClose();
    } catch (e) {
      Alert.alert(
        isAr ? 'تنبيه' : 'Notice',
        isAr ? 'تعذر إرسال الرسالة، يرجى المحاولة لاحقاً.' : 'Failed to send message, please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.cardBorder }]}>
          <View style={styles.headerTitleRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accentLight }]}>
              <Mail size={18} color={colors.accentDark} />
            </View>
            <View>
              <AppText variant="h3" color={colors.textPrimary} weight="800">
                {isAr ? 'اتصل بنا' : 'Contact Us'}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {isAr ? 'لجنة العلاقات العامة • hello@naegypt.org' : 'PR Committee • hello@naegypt.org'}
              </AppText>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleClose}
            style={[styles.closeBtn, { backgroundColor: colors.bgSecondary }]}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Banner */}
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
              <HeartHandshake size={26} color={colors.accent} style={{ marginBottom: 6 }} />
              <AppText variant="body" color="#ffffff" weight="700" style={styles.bannerText}>
                {isAr
                  ? 'يسعدنا دائماً تلقي استفساراتكم وملاحظاتكم الخدمية، ويتم الرد والتواصل بكل سرية.'
                  : 'We are glad to receive your inquiries and feedback. All communications are confidential.'}
              </AppText>
              <View style={styles.bannerBadge}>
                <ShieldCheck size={14} color={colors.accent} style={{ marginEnd: 4 }} />
                <AppText variant="caption" color="rgba(224, 248, 252, 0.85)" weight="700">
                  {isAr ? 'يصل مباشرة إلى: hello@naegypt.org' : 'Sent to: hello@naegypt.org'}
                </AppText>
              </View>
            </View>

            {/* Form Card */}
            <View
              style={[
                styles.formCard,
                shadows.card,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                  borderRadius: borderRadius.card,
                },
              ]}
            >
              {/* Name Field */}
              <View style={styles.inputGroup}>
                <AppText
                  variant="label"
                  color={colors.primary}
                  weight="700"
                  style={[styles.label, { textAlign: isAr ? 'right' : 'left' }]}
                >
                  {isAr ? 'الاسم (اختياري)' : 'Name (Optional)'}
                </AppText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.bgSecondary,
                      borderColor: colors.cardBorder,
                      borderRadius: borderRadius.md,
                      color: colors.textPrimary,
                      textAlign: isAr ? 'right' : 'left',
                    },
                  ]}
                  placeholder={isAr ? 'أدخل اسمك الأول أو كنيتك...' : 'Enter your name...'}
                  placeholderTextColor={colors.textMuted}
                  value={senderName}
                  onChangeText={setSenderName}
                />
              </View>

              {/* Email / Contact Field */}
              <View style={styles.inputGroup}>
                <AppText
                  variant="label"
                  color={colors.primary}
                  weight="700"
                  style={[styles.label, { textAlign: isAr ? 'right' : 'left' }]}
                >
                  {isAr ? 'البريد الإلكتروني أو الهاتف (للرد)' : 'Email or Phone (For Reply)'}
                </AppText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.bgSecondary,
                      borderColor: colors.cardBorder,
                      borderRadius: borderRadius.md,
                      color: colors.textPrimary,
                      textAlign: isAr ? 'right' : 'left',
                    },
                  ]}
                  placeholder={isAr ? 'example@email.com أو 010xxxxxxx' : 'example@email.com or phone...'}
                  placeholderTextColor={colors.textMuted}
                  value={senderContact}
                  onChangeText={setSenderContact}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Subject Field */}
              <View style={styles.inputGroup}>
                <AppText
                  variant="label"
                  color={colors.primary}
                  weight="700"
                  style={[styles.label, { textAlign: isAr ? 'right' : 'left' }]}
                >
                  {isAr ? 'موضوع الرسالة' : 'Subject'}
                </AppText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.bgSecondary,
                      borderColor: colors.cardBorder,
                      borderRadius: borderRadius.md,
                      color: colors.textPrimary,
                      textAlign: isAr ? 'right' : 'left',
                    },
                  ]}
                  placeholder={isAr ? 'مثال: استفسار عن مواعيد أو أماكن الاجتماعات' : 'e.g. Inquiries about meetings or service'}
                  placeholderTextColor={colors.textMuted}
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>

              {/* Message Details */}
              <View style={styles.inputGroup}>
                <AppText
                  variant="label"
                  color={colors.primary}
                  weight="700"
                  style={[styles.label, { textAlign: isAr ? 'right' : 'left' }]}
                >
                  {isAr ? 'نص الرسالة / تفاصيل الاستفسار *' : 'Message Details *'}
                </AppText>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: colors.bgSecondary,
                      borderColor: colors.cardBorder,
                      borderRadius: borderRadius.md,
                      color: colors.textPrimary,
                      textAlign: isAr ? 'right' : 'left',
                    },
                  ]}
                  placeholder={
                    isAr
                      ? 'اكتب رسالتك أو استفسارك هنا بكل وضوح...'
                      : 'Write your message or inquiry here...'
                  }
                  placeholderTextColor={colors.textMuted}
                  value={details}
                  onChangeText={setDetails}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Submit Button */}
              <AppButton
                title={isAr ? 'إرسال الرسالة الآن' : 'Send Message'}
                onPress={handleSubmit}
                variant="primary"
                size="lg"
                loading={isSubmitting}
                icon={<Send size={17} color="#ffffff" />}
                fullWidth
                style={{ marginTop: 8 }}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    paddingBottom: 36,
  },
  bannerBox: {
    padding: 16,
    marginBottom: 16,
  },
  bannerText: {
    lineHeight: 22,
    marginBottom: 8,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formCard: {
    padding: 18,
    borderWidth: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 110,
    textAlignVertical: 'top',
  },
});
