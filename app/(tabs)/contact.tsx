import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Paperclip, Send, CheckCircle2, Clock, MessageSquare, X, Mail, Phone, User } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { addOutboxAction } from '../../src/database/outboxWorker';
import { database } from '../../src/database';
import OutboxAction from '../../src/database/models/OutboxAction';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/theme';

export default function ContactScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [senderName, setSenderName] = useState('');
  const [senderContact, setSenderContact] = useState('');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [attachment, setAttachment] = useState<{ uri: string; name: string } | null>(null);

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
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        setAttachment({ uri: file.uri, name: file.name });
      }
    } catch (e) {
      console.warn('Document Picker error:', e);
    }
  };

  const handlePickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const img = res.assets[0];
        setAttachment({ uri: img.uri, name: img.fileName || 'attached_photo.jpg' });
      }
    } catch (e) {
      console.warn('Image Picker error:', e);
    }
  };

  const handleSubmit = async () => {
    if (!details.trim()) {
      Alert.alert(
        isAr ? 'تنبيه' : 'Notice',
        isAr ? 'يرجى كتابة رسالتك أو استفسارك قبل الإرسال.' : 'Please enter your message or inquiry.'
      );
      return;
    }

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
  };

  return (
    <View style={styles.screenWrapper}>
      <SafeAreaView style={styles.safeHeader} edges={['top']}>
        <View style={styles.headerBanner}>
          <View style={styles.iconCircle}>
            <MessageSquare size={22} color="#ffffff" />
          </View>
          <View style={styles.headerTextCol}>
            <Text style={[styles.headerTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
              {isAr ? 'اتصل بنا • الاستفسارات العامة' : 'Contact Us • General Inquiries'}
            </Text>
            <Text style={[styles.headerSubtitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
              {isAr
                ? 'تواصل مع لجنة الخدمة والعلاقات العامة لزمالة NA مصر'
                : 'Get in touch with NA Egypt Public Relations & Service Committee'}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Contact Form Card */}
        <View style={[styles.formCard, shadows.card]}>
          {/* Name Field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
              {isAr ? 'الاسم (اختياري)' : 'Name (Optional)'}
            </Text>
            <TextInput
              style={[
                styles.input,
                { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' },
              ]}
              placeholder={isAr ? 'أدخل اسمك الأول أو كنيتك...' : 'Enter your name...'}
              placeholderTextColor={colors.textMuted}
              value={senderName}
              onChangeText={setSenderName}
            />
          </View>

          {/* Contact (Phone / Email) */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
              {isAr ? 'رقم الهاتف أو البريد الإلكتروني (اختياري للرد)' : 'Phone or Email (Optional)'}
            </Text>
            <TextInput
              style={[
                styles.input,
                { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' },
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
            <Text style={[styles.label, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
              {isAr ? 'موضوع الاستفسار' : 'Subject'}
            </Text>
            <TextInput
              style={[
                styles.input,
                { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' },
              ]}
              placeholder={isAr ? 'مثال: استفسار عن مواعيد الاجتماعات أو الخدمة' : 'e.g. Question about meetings or service'}
              placeholderTextColor={colors.textMuted}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          {/* Message Details */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
              {isAr ? 'نص الرسالة / تفاصيل الاستفسار *' : 'Message Details *'}
            </Text>
            <TextInput
              style={[
                styles.textArea,
                { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' },
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
            <Text style={[styles.label, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
              {isAr ? 'إرفاق ملف أو صورة (اختياري)' : 'Attach File or Image (Optional)'}
            </Text>
            <View style={styles.attachButtonsRow}>
              <TouchableOpacity
                style={styles.attachBtn}
                onPress={handlePickDocument}
                activeOpacity={0.8}
              >
                <Paperclip size={16} color={colors.primary} style={{ marginEnd: 6 }} />
                <Text style={styles.attachBtnText}>{isAr ? 'مستند / PDF' : 'Document / PDF'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.attachBtn}
                onPress={handlePickImage}
                activeOpacity={0.8}
              >
                <Paperclip size={16} color={colors.primary} style={{ marginEnd: 6 }} />
                <Text style={styles.attachBtnText}>{isAr ? 'صورة من الهاتف' : 'Photo'}</Text>
              </TouchableOpacity>
            </View>

            {attachment && (
              <View style={styles.selectedAttachmentBox}>
                <Paperclip size={16} color={colors.primary} style={{ marginEnd: 6 }} />
                <Text style={styles.selectedAttachmentText} numberOfLines={1}>
                  {attachment.name}
                </Text>
                <TouchableOpacity onPress={() => setAttachment(null)} hitSlop={8}>
                  <X size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
            <Send size={18} color="#ffffff" style={{ marginEnd: 8 }} />
            <Text style={styles.submitBtnText}>{isAr ? 'إرسال الرسالة' : 'Send Message'}</Text>
          </TouchableOpacity>
        </View>

        {/* Offline Outbox Queue */}
        {outboxItems.length > 0 && (
          <View style={styles.outboxSection}>
            <Text style={[styles.outboxHeaderTitle, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
              {isAr ? 'حالة الإرسال وقائمة الانتظار' : 'Transmission Status & Queue'}
            </Text>
            {outboxItems.map((item) => (
              <View key={item.id} style={[styles.outboxCard, shadows.card]}>
                <View style={styles.outboxHeader}>
                  <Text style={styles.outboxEndpoint}>{item.endpoint}</Text>
                  <View style={[styles.statusBadge, item.status === 'synced' ? styles.syncedBadge : styles.pendingBadge]}>
                    {item.status === 'synced' ? (
                      <CheckCircle2 size={12} color={colors.success} style={{ marginEnd: 4 }} />
                    ) : (
                      <Clock size={12} color={colors.warning} style={{ marginEnd: 4 }} />
                    )}
                    <Text style={[styles.statusText, item.status === 'synced' ? styles.syncedText : styles.pendingText]}>
                      {item.status === 'synced' ? (isAr ? 'تم الإرسال بنجاح' : 'Sent') : (isAr ? 'معلق (بانتظار الإنترنت)' : 'Pending')}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.outboxDate, { textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }]}>
                  {new Date(item.createdAt || Date.now()).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#f7fbff',
  },
  safeHeader: {
    backgroundColor: colors.primary,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: spacing.sm + 2,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h2,
    color: '#ffffff',
    fontSize: 18,
  },
  headerSubtitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  scrollContent: {
    padding: spacing.md,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(50, 85, 127, 0.10)',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
    fontSize: 13,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: 'rgba(50, 85, 127, 0.12)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...typography.body,
    color: colors.textPrimary,
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: 'rgba(50, 85, 127, 0.12)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  attachmentSection: {
    marginBottom: spacing.lg,
  },
  attachButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  attachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(50, 85, 127, 0.10)',
  },
  attachBtnText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
    fontSize: 12,
  },
  selectedAttachmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e4f7fa',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  selectedAttachmentText: {
    ...typography.caption,
    color: colors.primary,
    flex: 1,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
  },
  submitBtnText: {
    ...typography.body,
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  outboxSection: {
    marginTop: spacing.md,
  },
  outboxHeaderTitle: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  outboxCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(50, 85, 127, 0.10)',
  },
  outboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  outboxEndpoint: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  syncedBadge: {
    backgroundColor: '#e6f4ea',
  },
  pendingBadge: {
    backgroundColor: '#fff7ed',
  },
  statusText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  syncedText: {
    color: colors.success,
  },
  pendingText: {
    color: colors.warning,
  },
  outboxDate: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
});
