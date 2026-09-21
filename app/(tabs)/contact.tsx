import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Paperclip,
  Send,
  CheckCircle2,
  Clock,
  Mail,
  X,
  Image as ImageIcon,
  FileText,
  Lock,
  HeartHandshake,
  ShieldCheck,
  FolderGit2,
  UserCheck,
  RefreshCw,
  AlertCircle,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { addOutboxAction } from '../../src/database/outboxWorker';
import { database } from '../../src/database';
import OutboxAction from '../../src/database/models/OutboxAction';
import { apiClient } from '../../src/api/client';
import { changeRequestsApi } from '../../src/api/changeRequests';
import { ChangeRequest, ChangeRequestType } from '../../src/api/types';
import { authApi, UserProfile } from '../../src/api/auth';
import { azureAuthService } from '../../src/services/azureAuthService';
import { useAppTheme } from '../../src/theme';
import { AppText, Badge, AppButton, AppHeader, MicrosoftLogo } from '../../src/components/ui';
import { haptic } from '../../src/utils/haptics';

type MainTab = 'inquiry' | 'change_request';
type ChangeRequestSubTab = 'new' | 'history';

export default function ContactScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const router = useRouter();
  const { colors, borderRadius, shadows, isDark } = useAppTheme();

  // Tabs
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('inquiry');
  const [activeSubTab, setActiveSubTab] = useState<ChangeRequestSubTab>('new');

  // Auth
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // General Inquiry Form
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryContact, setInquiryContact] = useState('');
  const [inquirySubject, setInquirySubject] = useState('');
  const [inquiryDetails, setInquiryDetails] = useState('');
  const [inquiryAttachment, setInquiryAttachment] = useState<{ uri: string; name: string } | null>(null);
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

  // IT Change Request Form
  const [requestType, setRequestType] = useState<ChangeRequestType>('meetings_groups');
  const [requestSubject, setRequestSubject] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [requestAttachment, setRequestAttachment] = useState<{ uri: string; name: string; type?: string } | null>(null);
  const [isSubmittingChangeRequest, setIsSubmittingChangeRequest] = useState(false);

  // IT Change Request History
  const [myRequests, setMyRequests] = useState<ChangeRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Outbox actions
  const [outboxItems, setOutboxItems] = useState<OutboxAction[]>([]);

  useEffect(() => {
    checkAuth();

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

  useEffect(() => {
    if (user && activeMainTab === 'change_request' && activeSubTab === 'history') {
      loadMyRequests();
    }
  }, [user, activeMainTab, activeSubTab]);

  const checkAuth = async () => {
    try {
      const stored = await authApi.getStoredUser();
      if (stored) {
        setUser(stored);
      }
      const fresh = await azureAuthService.checkSilentAuth();
      if (fresh) {
        setUser(fresh);
      }
    } catch {
      // Guest
    }
  };

  const handleLogin = async () => {
    haptic.selection();
    setIsLoggingIn(true);
    try {
      const res = await azureAuthService.loginInteractive();
      if (res.success && res.user) {
        setUser(res.user);
        haptic.success();
      } else if (res.error) {
        Alert.alert(
          isAr ? 'خطأ في تسجيل الدخول' : 'Sign In Error',
          res.error
        );
      }
    } catch (e: any) {
      console.warn('Login error:', e);
      Alert.alert(
        isAr ? 'خطأ' : 'Error',
        isAr
          ? 'تعذر إتمام تسجيل الدخول عبر مايكروسوفت. يرجى المحاولة مرة أخرى.'
          : 'Could not complete sign in. Please try again.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loadMyRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const list = await changeRequestsApi.getChangeRequests({ per_page: 50 });
      setMyRequests(list);
    } catch (e) {
      console.warn('Failed to load change requests:', e);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Pickers for Inquiry
  const handlePickInquiryDocument = async () => {
    haptic.selection();
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        setInquiryAttachment({ uri: file.uri, name: file.name });
        haptic.light();
      }
    } catch (e) {
      console.warn('Document Picker error:', e);
    }
  };

  const handlePickInquiryImage = async () => {
    haptic.selection();
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const img = res.assets[0];
        setInquiryAttachment({ uri: img.uri, name: img.fileName || 'attached_photo.jpg' });
        haptic.light();
      }
    } catch (e) {
      console.warn('Image Picker error:', e);
    }
  };

  // Pickers for Change Request
  const handlePickRequestDocument = async () => {
    haptic.selection();
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        setRequestAttachment({ uri: file.uri, name: file.name, type: file.mimeType });
        haptic.light();
      }
    } catch (e) {
      console.warn('Document Picker error:', e);
    }
  };

  const handlePickRequestImage = async () => {
    haptic.selection();
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const img = res.assets[0];
        setRequestAttachment({
          uri: img.uri,
          name: img.fileName || 'attached_photo.jpg',
          type: img.mimeType || 'image/jpeg',
        });
        haptic.light();
      }
    } catch (e) {
      console.warn('Image Picker error:', e);
    }
  };

  // Submit General Inquiry
  const handleSubmitInquiry = async () => {
    if (!inquiryDetails.trim()) {
      haptic.warning();
      Alert.alert(
        isAr ? 'تنبيه' : 'Notice',
        isAr ? 'يرجى كتابة رسالتك أو استفسارك قبل الإرسال.' : 'Please enter your message or inquiry.'
      );
      return;
    }

    setIsSubmittingInquiry(true);
    try {
      const payload = {
        name: inquiryName.trim() || (isAr ? 'عضو زمالة المدمنين المجهولين' : 'NA Member'),
        contact: inquiryContact.trim() || null,
        subject: inquirySubject.trim() || (isAr ? 'استفسار عام من تطبيق الهاتف' : 'Mobile App Inquiry'),
        message: inquiryDetails.trim(),
        attachment_name: inquiryAttachment?.name || null,
        attachment_uri: inquiryAttachment?.uri || null,
        submitted_at: new Date().toISOString(),
      };

      await addOutboxAction('/contact-requests', 'POST', payload);
      haptic.success();

      Alert.alert(
        isAr ? 'تم حفظ الرسالة' : 'Message Saved',
        isAr
          ? 'تم حفظ استفسارك بنجاح، وسيتم إرساله للجنة العلاقات العامة فور توفر الاتصال بالإنترنت.'
          : 'Your message has been saved and will send automatically when online.'
      );

      setInquiryName('');
      setInquiryContact('');
      setInquirySubject('');
      setInquiryDetails('');
      setInquiryAttachment(null);
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  // Submit IT Change Request
  const handleSubmitChangeRequest = async () => {
    if (!requestSubject.trim()) {
      haptic.warning();
      Alert.alert(
        isAr ? 'تنبيه' : 'Notice',
        isAr ? 'يرجى كتابة موضوع طلب التعديل.' : 'Please enter the subject of the change request.'
      );
      return;
    }

    if (!requestDescription.trim()) {
      haptic.warning();
      Alert.alert(
        isAr ? 'تنبيه' : 'Notice',
        isAr ? 'يرجى كتابة تفاصيل التعديلات المطلوبة بدقة.' : 'Please enter the description of the change request.'
      );
      return;
    }

    setIsSubmittingChangeRequest(true);
    haptic.selection();

    try {
      const res = await changeRequestsApi.submitChangeRequest({
        request_type: requestType,
        subject: requestSubject.trim(),
        description: requestDescription.trim(),
        attachment_name: requestAttachment?.name || null,
        attachment_uri: requestAttachment?.uri || null,
        attachment_type: requestAttachment?.type || null,
      });

      haptic.success();

      if (res.queued) {
        Alert.alert(
          isAr ? 'تم الحفظ في قائمة الانتظار' : 'Saved to Queue',
          t('contact.offline_notice')
        );
      } else {
        Alert.alert(
          isAr ? 'تم إرسال طلب التعديل' : 'Change Request Submitted',
          isAr
            ? 'تم إرسال طلب التعديل بنجاح للجنة تقنية المعلومات وسيتم مراجعته والعمل عليه.'
            : 'Your change request has been submitted to the IT Committee for review.'
        );
      }

      setRequestSubject('');
      setRequestDescription('');
      setRequestAttachment(null);
      setActiveSubTab('history');
      loadMyRequests();
    } catch (err: any) {
      console.warn('Submit change request error:', err);
      Alert.alert(
        isAr ? 'خطأ' : 'Error',
        isAr
          ? 'تعذر إرسال طلب التعديل حالياً. يرجى التحقق من اتصالك بالإنترنت.'
          : 'Failed to submit change request. Please verify your connection.'
      );
    } finally {
      setIsSubmittingChangeRequest(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          label: t('contact.status_completed'),
          variant: 'success' as const,
          icon: <CheckCircle2 size={12} color={colors.success} />,
        };
      case 'in_progress':
        return {
          label: t('contact.status_in_progress'),
          variant: 'primary' as const,
          icon: <Clock size={12} color={colors.primary} />,
        };
      case 'rejected':
        return {
          label: t('contact.status_rejected'),
          variant: 'danger' as const,
          icon: <AlertCircle size={12} color={colors.danger} />,
        };
      case 'pending':
      default:
        return {
          label: t('contact.status_pending'),
          variant: 'warning' as const,
          icon: <Clock size={12} color={colors.warning} />,
        };
    }
  };

  const getCategoryLabel = (type: string) => {
    switch (type) {
      case 'meetings_groups':
        return t('contact.cat_meetings_groups');
      case 'committee_info':
        return t('contact.cat_committee_info');
      case 'general':
        return t('contact.cat_general');
      case 'other':
      default:
        return t('contact.cat_other');
    }
  };

  return (
    <View style={[styles.screenWrapper, { backgroundColor: isDark ? colors.bgDark : colors.primaryDark }]}>
      <AppHeader
        title={t('contact.title')}
        subtitle={t('contact.subtitle')}
      />

      <View style={[styles.contentBody, { backgroundColor: colors.bgPrimary }]}>
        {/* Main Segmented Tab Switcher */}
        <View style={[styles.mainTabBar, { backgroundColor: colors.bgSecondary }]}>
          <TouchableOpacity
            style={[
              styles.mainTabBtn,
              activeMainTab === 'inquiry' && [styles.activeMainTabBtn, { backgroundColor: colors.cardBg }],
            ]}
            onPress={() => {
              haptic.selection();
              setActiveMainTab('inquiry');
            }}
          >
            <Mail
              size={15}
              color={activeMainTab === 'inquiry' ? colors.primary : colors.textMuted}
              style={{ marginEnd: 6 }}
            />
            <AppText
              variant="labelSmall"
              weight={activeMainTab === 'inquiry' ? '700' : '500'}
              color={activeMainTab === 'inquiry' ? colors.primary : colors.textMuted}
            >
              {t('contact.tab_inquiry')}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.mainTabBtn,
              activeMainTab === 'change_request' && [styles.activeMainTabBtn, { backgroundColor: colors.cardBg }],
            ]}
            onPress={() => {
              haptic.selection();
              setActiveMainTab('change_request');
            }}
          >
            {user ? (
              <FolderGit2
                size={15}
                color={activeMainTab === 'change_request' ? colors.primary : colors.textMuted}
                style={{ marginEnd: 6 }}
              />
            ) : (
              <Lock
                size={14}
                color={activeMainTab === 'change_request' ? colors.warning : colors.textMuted}
                style={{ marginEnd: 6 }}
              />
            )}
            <AppText
              variant="labelSmall"
              weight={activeMainTab === 'change_request' ? '700' : '500'}
              color={activeMainTab === 'change_request' ? colors.primary : colors.textMuted}
            >
              {t('contact.tab_change_request')}
            </AppText>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* TAB 1: General Inquiry Form */}
          {activeMainTab === 'inquiry' && (
            <>
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
                {/* Name */}
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
                    value={inquiryName}
                    onChangeText={setInquiryName}
                  />
                </View>

                {/* Contact */}
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
                    value={inquiryContact}
                    onChangeText={setInquiryContact}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Subject */}
                <View style={styles.inputGroup}>
                  <AppText variant="label" color={colors.primary} weight="700" style={styles.label}>
                    {t('contact.subject')}
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
                    value={inquirySubject}
                    onChangeText={setInquirySubject}
                  />
                </View>

                {/* Details */}
                <View style={styles.inputGroup}>
                  <AppText variant="label" color={colors.primary} weight="700" style={styles.label}>
                    {t('contact.details')} *
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
                    value={inquiryDetails}
                    onChangeText={setInquiryDetails}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                {/* Attachment Selector */}
                <View style={styles.attachmentSection}>
                  <AppText variant="label" color={colors.primary} weight="700" style={styles.label}>
                    {t('contact.attachment')}
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
                      onPress={handlePickInquiryDocument}
                      activeOpacity={0.8}
                    >
                      <FileText size={15} color={colors.primary} style={{ marginEnd: 6 }} />
                      <AppText variant="labelSmall" color={colors.primary} weight="600">
                        {t('contact.select_doc')}
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
                      onPress={handlePickInquiryImage}
                      activeOpacity={0.8}
                    >
                      <ImageIcon size={15} color={colors.primary} style={{ marginEnd: 6 }} />
                      <AppText variant="labelSmall" color={colors.primary} weight="600">
                        {t('contact.select_photo')}
                      </AppText>
                    </TouchableOpacity>
                  </View>

                  {inquiryAttachment && (
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
                        {inquiryAttachment.name}
                      </AppText>
                      <TouchableOpacity
                        onPress={() => {
                          haptic.light();
                          setInquiryAttachment(null);
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
                  title={t('contact.submit_inquiry')}
                  onPress={handleSubmitInquiry}
                  variant="primary"
                  size="lg"
                  loading={isSubmittingInquiry}
                  icon={<Send size={16} color="#ffffff" />}
                  fullWidth
                />
              </View>
            </>
          )}

          {/* TAB 2: IT Change Request */}
          {activeMainTab === 'change_request' && (
            <>
              {/* 2A: Unauthenticated Lock Banner */}
              {!user ? (
                <View
                  style={[
                    styles.lockCard,
                    shadows.card,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.cardBorder,
                      borderRadius: borderRadius.card,
                    },
                  ]}
                >
                  <View style={[styles.lockIconCircle, { backgroundColor: colors.accentLight }]}>
                    <Lock size={32} color={colors.accentDark} />
                  </View>

                  <AppText variant="h3" color={colors.textPrimary} weight="800" style={styles.lockTitle}>
                    {t('contact.login_required_title')}
                  </AppText>

                  <AppText variant="body" color={colors.textSecondary} style={styles.lockDesc}>
                    {t('contact.login_required_desc')}
                  </AppText>

                  <TouchableOpacity
                    style={[
                      styles.azureLoginBtn,
                      {
                        backgroundColor: '#0078D4',
                        borderRadius: borderRadius.md,
                      },
                    ]}
                    onPress={handleLogin}
                    disabled={isLoggingIn}
                    activeOpacity={0.85}
                  >
                    {isLoggingIn ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <MicrosoftLogo size={18} style={{ marginEnd: 10 }} />
                        <AppText variant="label" color="#ffffff" weight="700">
                          {t('contact.login_btn')}
                        </AppText>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => router.push('/login')}
                    style={styles.moreLoginLink}
                  >
                    <AppText variant="caption" color={colors.accent} weight="600">
                      {isAr ? 'أو الانتقال لصفحة تسجيل الدخول الكاملة' : 'Or open dedicated Login page'}
                    </AppText>
                  </TouchableOpacity>
                </View>
              ) : (
                /* 2B: Authenticated Servant View */
                <>
                  <View
                    style={[
                      styles.servantBanner,
                      shadows.sm,
                      {
                        backgroundColor: colors.accentLight,
                        borderRadius: borderRadius.md,
                        borderColor: colors.cardBorder,
                      },
                    ]}
                  >
                    <UserCheck size={18} color={colors.accentDark} style={{ marginEnd: 8 }} />
                    <View style={{ flex: 1 }}>
                      <AppText variant="caption" color={colors.accentDark} weight="700">
                        {t('contact.logged_in_as')} {user.name || user.email}
                      </AppText>
                    </View>
                  </View>

                  {/* Sub-tab: New vs History */}
                  <View style={[styles.subTabBar, { backgroundColor: colors.bgSecondary }]}>
                    <TouchableOpacity
                      style={[
                        styles.subTabBtn,
                        activeSubTab === 'new' && [styles.activeSubTabBtn, { backgroundColor: colors.cardBg }],
                      ]}
                      onPress={() => {
                        haptic.selection();
                        setActiveSubTab('new');
                      }}
                    >
                      <AppText
                        variant="caption"
                        weight={activeSubTab === 'new' ? '700' : '500'}
                        color={activeSubTab === 'new' ? colors.primary : colors.textMuted}
                      >
                        {t('contact.tab_new_request')}
                      </AppText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.subTabBtn,
                        activeSubTab === 'history' && [styles.activeSubTabBtn, { backgroundColor: colors.cardBg }],
                      ]}
                      onPress={() => {
                        haptic.selection();
                        setActiveSubTab('history');
                      }}
                    >
                      <AppText
                        variant="caption"
                        weight={activeSubTab === 'history' ? '700' : '500'}
                        color={activeSubTab === 'history' ? colors.primary : colors.textMuted}
                      >
                        {t('contact.tab_my_requests')}
                      </AppText>
                    </TouchableOpacity>
                  </View>

                  {/* SUBTAB A: New Change Request */}
                  {activeSubTab === 'new' && (
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
                      {/* Category Selector */}
                      <View style={styles.inputGroup}>
                        <AppText variant="label" color={colors.primary} weight="700" style={styles.label}>
                          {t('contact.request_type')} *
                        </AppText>
                        <View style={styles.categoryRow}>
                          {(
                            [
                              { key: 'meetings_groups', label: t('contact.cat_meetings_groups') },
                              { key: 'committee_info', label: t('contact.cat_committee_info') },
                              { key: 'general', label: t('contact.cat_general') },
                              { key: 'other', label: t('contact.cat_other') },
                            ] as { key: ChangeRequestType; label: string }[]
                          ).map((cat) => {
                            const isSelected = requestType === cat.key;
                            return (
                              <TouchableOpacity
                                key={cat.key}
                                style={[
                                  styles.categoryChip,
                                  {
                                    backgroundColor: isSelected ? colors.primary : colors.bgSecondary,
                                    borderColor: isSelected ? colors.primary : colors.cardBorder,
                                    borderRadius: borderRadius.sm,
                                  },
                                ]}
                                onPress={() => {
                                  haptic.selection();
                                  setRequestType(cat.key);
                                }}
                              >
                                <AppText
                                  variant="caption"
                                  weight={isSelected ? '700' : '500'}
                                  color={isSelected ? '#ffffff' : colors.textPrimary}
                                >
                                  {cat.label}
                                </AppText>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      {/* Subject */}
                      <View style={styles.inputGroup}>
                        <AppText variant="label" color={colors.primary} weight="700" style={styles.label}>
                          {t('contact.subject')} *
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
                          placeholder={t('contact.subject_placeholder')}
                          placeholderTextColor={colors.textMuted}
                          value={requestSubject}
                          onChangeText={setRequestSubject}
                        />
                      </View>

                      {/* Description */}
                      <View style={styles.inputGroup}>
                        <AppText variant="label" color={colors.primary} weight="700" style={styles.label}>
                          {t('contact.details')} *
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
                          placeholder={t('contact.details_placeholder')}
                          placeholderTextColor={colors.textMuted}
                          value={requestDescription}
                          onChangeText={setRequestDescription}
                          multiline
                          numberOfLines={4}
                        />
                      </View>

                      {/* Attachment Buttons */}
                      <View style={styles.attachmentSection}>
                        <AppText variant="label" color={colors.primary} weight="700" style={styles.label}>
                          {t('contact.attachment')}
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
                            onPress={handlePickRequestDocument}
                            activeOpacity={0.8}
                          >
                            <FileText size={15} color={colors.primary} style={{ marginEnd: 6 }} />
                            <AppText variant="labelSmall" color={colors.primary} weight="600">
                              {t('contact.select_doc')}
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
                            onPress={handlePickRequestImage}
                            activeOpacity={0.8}
                          >
                            <ImageIcon size={15} color={colors.primary} style={{ marginEnd: 6 }} />
                            <AppText variant="labelSmall" color={colors.primary} weight="600">
                              {t('contact.select_photo')}
                            </AppText>
                          </TouchableOpacity>
                        </View>

                        {requestAttachment && (
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
                              {requestAttachment.name}
                            </AppText>
                            <TouchableOpacity
                              onPress={() => {
                                haptic.light();
                                setRequestAttachment(null);
                              }}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <X size={16} color={colors.danger} />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>

                      {/* Submit Change Request Button */}
                      <AppButton
                        title={t('contact.submit_change_request')}
                        onPress={handleSubmitChangeRequest}
                        variant="primary"
                        size="lg"
                        loading={isSubmittingChangeRequest}
                        icon={<Send size={16} color="#ffffff" />}
                        fullWidth
                      />
                    </View>
                  )}

                  {/* SUBTAB B: My Requests History */}
                  {activeSubTab === 'history' && (
                    <View style={styles.historyContainer}>
                      <View style={styles.historyHeaderRow}>
                        <AppText variant="h4" color={colors.textPrimary} weight="700">
                          {t('contact.tab_my_requests')}
                        </AppText>
                        <TouchableOpacity
                          onPress={loadMyRequests}
                          disabled={isLoadingRequests}
                          style={styles.refreshBtn}
                        >
                          <RefreshCw
                            size={16}
                            color={colors.accent}
                            style={isLoadingRequests ? { opacity: 0.5 } : undefined}
                          />
                        </TouchableOpacity>
                      </View>

                      {isLoadingRequests ? (
                        <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
                      ) : myRequests.length === 0 ? (
                        <View
                          style={[
                            styles.emptyCard,
                            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderRadius: borderRadius.card },
                          ]}
                        >
                          <FolderGit2 size={32} color={colors.textMuted} style={{ marginBottom: 10 }} />
                          <AppText variant="body" color={colors.textSecondary} weight="600">
                            {t('contact.no_requests')}
                          </AppText>
                        </View>
                      ) : (
                        myRequests.map((req) => {
                          const badge = getStatusBadge(req.status);
                          return (
                            <View
                              key={req.id}
                              style={[
                                styles.historyCard,
                                shadows.card,
                                {
                                  backgroundColor: colors.cardBg,
                                  borderColor: colors.cardBorder,
                                  borderRadius: borderRadius.card,
                                },
                              ]}
                            >
                              <View style={styles.historyCardHeader}>
                                <Badge
                                  label={badge.label}
                                  variant={badge.variant}
                                  size="sm"
                                  icon={badge.icon}
                                />
                                <AppText variant="caption" color={colors.textMuted}>
                                  {req.created_at
                                    ? new Date(req.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')
                                    : ''}
                                </AppText>
                              </View>

                              <AppText variant="body" color={colors.textPrimary} weight="700" style={{ marginTop: 8 }}>
                                {req.subject}
                              </AppText>

                              <View style={styles.catBadgeRow}>
                                <AppText variant="caption" color={colors.accentDark} weight="600">
                                  {getCategoryLabel(req.request_type)}
                                </AppText>
                              </View>

                              <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 6 }}>
                                {req.description}
                              </AppText>

                              {req.admin_notes && (
                                <View
                                  style={[
                                    styles.adminNotesBox,
                                    {
                                      backgroundColor: colors.bgSecondary,
                                      borderRadius: borderRadius.sm,
                                      borderLeftColor: colors.primary,
                                    },
                                  ]}
                                >
                                  <AppText variant="caption" color={colors.textPrimary} weight="600">
                                    {isAr ? 'ملاحظات الإدارة: ' : 'Admin Notes: '}
                                    {req.admin_notes}
                                  </AppText>
                                </View>
                              )}
                            </View>
                          );
                        })
                      )}
                    </View>
                  )}
                </>
              )}
            </>
          )}

          {/* Offline Outbox Queue Section */}
          {outboxItems.length > 0 && (
            <View style={styles.outboxSection}>
              <AppText variant="h4" color={colors.textPrimary} weight="700" style={{ marginBottom: 10 }}>
                {t('contact.outbox_status_title')}
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
                      {item.endpoint === '/change-requests'
                        ? t('contact.tab_change_request')
                        : t('contact.tab_inquiry')}
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
  contentBody: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  mainTabBar: {
    flexDirection: 'row',
    padding: 4,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    borderRadius: 12,
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeMainTabBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
  lockCard: {
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  lockIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  lockTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  lockDesc: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  azureLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
  },
  moreLoginLink: {
    marginTop: 16,
    padding: 4,
  },
  servantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  subTabBar: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    marginBottom: 14,
  },
  subTabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 7,
  },
  activeSubTabBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  historyContainer: {
    marginTop: 4,
    marginBottom: 16,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshBtn: {
    padding: 6,
  },
  historyCard: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catBadgeRow: {
    marginTop: 4,
  },
  adminNotesBox: {
    marginTop: 10,
    padding: 10,
    borderLeftWidth: 3,
  },
  emptyCard: {
    padding: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
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
