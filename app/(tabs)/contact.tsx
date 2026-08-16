import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  Paperclip,
  Send,
  CheckCircle2,
  Clock,
  MessageSquare,
  X,
  Image as ImageIcon,
  FileText,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { addOutboxAction } from '../../src/database/outboxWorker';
import { database } from '../../src/database';
import OutboxAction from '../../src/database/models/OutboxAction';
import { useAppTheme } from '../../src/theme';
import { AppText, Badge, AppButton, LanguageSwitcher } from '../../src/components/ui';
import { haptic } from '../../src/utils/haptics';

export default function ContactScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { colors, borderRadius, shadows } = useAppTheme();

  const [senderName, setSenderName] = useState('');
  const [senderContact, setSenderContact] = useState('');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [attachment, setAttachment] = useState<{ uri: string; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [outboxItems, setOutboxItems] = useState<OutboxAction[]>([]);

  useEffect(() => {
    const loadOutbox = async () => {
      const collection = database.get<OutboxAction>('outbox_actions');
      const items = await collection.query().fetch();
      setOutboxItems(items);
    };

    loadOutbox();

    const subscription = database
      .get<OutboxAction>('outbox_actions')
      .query()
      .observe()
      .subscribe((items) => {
        setOutboxItems(items);
      });

    return () => subscription.unsubscribe();
  }, []);

  const handlePickDocument = async () => {
    haptic.selection();
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        setAttachment({ uri: file.uri, name: file.name });
        haptic.light();
      }
    } catch (e) {
      console.warn('Document Picker error:', e);
    }
  };

  const handlePickImage = async () => {
    haptic.selection();
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const img = res.assets[0];
        setAttachment({ uri: img.uri, name: img.fileName || 'attached_photo.jpg' });
        haptic.light();
      }
    } catch (e) {
      console.warn('Image Picker error:', e);
    }
  };

  const handleSubmit = async () => {
    if (!details.trim()) {
      haptic.warning();
      Alert.alert(
        isAr ? 'تنبيه' : 'Notice',
        isAr ? 'يرجى كتابة رسالتك أو استفسارك قبل الإرسال.' : 'Please enter your message or inquiry.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: senderName.trim() || 'عضو زمالة NA',
        contact: senderContact.trim() || null,
        subject: subject.trim() || 'استفسار عام من تطبيق الهاتف',
        message: details.trim(),
        attachment_name: attachment?.name || null,
        attachment_uri: attachment?.uri || null,
        submitted_at: new Date().toISOString(),
      };

      await addOutboxAction('/contact-us', 'POST', payload);
      haptic.success();

      Alert.alert(
        isAr ? 'تم حفظ الرسالة' : 'Message Saved',
        isAr
          ? 'تم حفظ استفسارك بنجاح، وسيتم إرساله للجنة العلاقات العامة والخدمة فور توفر الاتصال بالإنترنت.'
          : 'Your message has been saved and will send automatically when online.'
      );

      setSenderName('');
      setSenderContact('');
      setSubject('');
      setDetails('');
      setAttachment(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.screenWrapper, { backgroundColor: colors.primaryDark }]}>
      <SafeAreaView style={[styles.safeHeader, { backgroundColor: colors.primaryDark }]} edges={['top']}>
        <View style={styles.headerBanner}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight + '40' }]}>
            <MessageSquare size={20} color={colors.accent} />
          </View>
          <View style={styles.headerTextCol}>
            <AppText variant="h3" color="#ffffff" weight="800">
              {isAr ? 'اتصل بنا • الاستفسارات العامة' : 'Contact Us • General Inquiries'}
            </AppText>
            <AppText variant="caption" color="rgba(224, 248, 252, 0.75)">
              {isAr
                ? 'تواصل مع لجنة الخدمة والعلاقات العامة لزمالة NA مصر'
                : 'Get in touch with NA Egypt PR & Service Committee'}
            </AppText>
          </View>
          <LanguageSwitcher />
        </View>
      </SafeAreaView>

      <View style={[styles.contentBody, { backgroundColor: colors.bgPrimary }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Contact Form Card */}
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
              <AppText variant="label" color={colors.primary} weight="700" style={styles.label}>
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

            {/* Contact (Phone / Email) */}
            <View style={styles.inputGroup}>
              <AppText variant="label" color={colors.primary} weight="700" style={styles.label}>
                {isAr ? 'رقم الهاتف أو البريد الإلكتروني (اختياري للرد)' : 'Phone or Email (Optional)'}
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
                placeholder={isAr ? '010xxxxxxx أو example@email.com' : 'Phone number or email...'}
                placeholderTextColor={colors.textMuted}
                value={senderContact}
                onChangeText={setSenderContact}
                keyboardType="email-address"
              />
            </View>

            {/* Subject Field */}
            <View style={styles.inputGroup}>
              <AppText variant="label" color={colors.primary} weight="700" style={styles.label}>
                {isAr ? 'موضوع الاستفسار' : 'Subject'}
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
                placeholder={isAr ? 'مثال: استفسار عن مواعيد الاجتماعات أو الخدمة' : 'e.g. Question about meetings or service'}
                placeholderTextColor={colors.textMuted}
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            {/* Message Details */}
            <View style={styles.inputGroup}>
              <AppText variant="label" color={colors.primary} weight="700" style={styles.label}>
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

            {/* Attachment Selector */}
            <View style={styles.attachmentSection}>
              <AppText variant="label" color={colors.primary} weight="700" style={styles.label}>
                {isAr ? 'إرفاق ملف أو صورة (اختياري)' : 'Attach File or Image (Optional)'}
              </AppText>
              <View style={styles.attachButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.attachBtn,
                    {
                      backgroundColor: colors.bgSecondary,
                      borderColor: colors.cardBorder,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                  onPress={handlePickDocument}
                  activeOpacity={0.8}
                >
                  <FileText size={15} color={colors.primary} style={{ marginEnd: 6 }} />
                  <AppText variant="labelSmall" color={colors.primary} weight="600">
                    {isAr ? 'مستند / PDF' : 'Document / PDF'}
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.attachBtn,
                    {
                      backgroundColor: colors.bgSecondary,
                      borderColor: colors.cardBorder,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                  onPress={handlePickImage}
                  activeOpacity={0.8}
                >
                  <ImageIcon size={15} color={colors.primary} style={{ marginEnd: 6 }} />
                  <AppText variant="labelSmall" color={colors.primary} weight="600">
                    {isAr ? 'صورة من الهاتف' : 'Photo'}
                  </AppText>
                </TouchableOpacity>
              </View>

              {attachment && (
                <View
                  style={[
                    styles.selectedAttachmentBox,
                    {
                      backgroundColor: colors.accentLight,
                      borderRadius: borderRadius.sm,
                    },
                  ]}
                >
                  <Paperclip size={15} color={colors.accentDark} style={{ marginEnd: 6 }} />
                  <AppText variant="caption" color={colors.accentDark} weight="600" numberOfLines={1} style={{ flex: 1 }}>
                    {attachment.name}
                  </AppText>
                  <TouchableOpacity
                    onPress={() => {
                      haptic.light();
                      setAttachment(null);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <AppButton
              title={isAr ? 'إرسال الرسالة' : 'Send Message'}
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              loading={isSubmitting}
              icon={<Send size={17} color="#ffffff" />}
              fullWidth
            />
          </View>

          {/* Offline Outbox Queue */}
          {outboxItems.length > 0 && (
            <View style={styles.outboxSection}>
              <AppText variant="h4" color={colors.textPrimary} weight="700" style={{ marginBottom: 10 }}>
                {isAr ? 'حالة الإرسال وقائمة الانتظار' : 'Transmission Status & Queue'}
              </AppText>
              {outboxItems.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.outboxCard,
                    shadows.card,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.cardBorder,
                      borderRadius: borderRadius.card,
                    },
                  ]}
                >
                  <View style={styles.outboxHeader}>
                    <AppText variant="body" color={colors.textPrimary} weight="700">
                      {item.endpoint}
                    </AppText>
                    <Badge
                      label={item.status === 'synced' ? (isAr ? 'تم الإرسال' : 'Sent') : (isAr ? 'معلق' : 'Pending')}
                      variant={item.status === 'synced' ? 'success' : 'warning'}
                      size="sm"
                      icon={
                        item.status === 'synced' ? (
                          <CheckCircle2 size={11} color={colors.success} />
                        ) : (
                          <Clock size={11} color={colors.warning} />
                        )
                      }
                    />
                  </View>
                  <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 4 }}>
                    {new Date(item.createdAt || Date.now()).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                  </AppText>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
  },
  safeHeader: {
    paddingBottom: 4,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 10,
  },
  headerTextCol: {
    flex: 1,
  },
  contentBody: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 16,
  },
  formCard: {
    padding: 18,
    marginBottom: 16,
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
  attachmentSection: {
    marginBottom: 20,
  },
  attachButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  attachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
  },
  selectedAttachmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginTop: 10,
  },
  outboxSection: {
    marginTop: 8,
  },
  outboxCard: {
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  outboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
