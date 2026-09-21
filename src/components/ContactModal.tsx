import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  X,
  Send,
  Mail,
  HeartHandshake,
  ShieldCheck,
  Lock,
  FileText,
  Image as ImageIcon,
  Paperclip,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderGit2,
  UserCheck,
  RefreshCw,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { addOutboxAction } from '../database/outboxWorker';
import { apiClient } from '../api/client';
import { changeRequestsApi } from '../api/changeRequests';
import { ChangeRequest, ChangeRequestType } from '../api/types';
import { authApi, UserProfile } from '../api/auth';
import { azureAuthService } from '../services/azureAuthService';
import { useAppTheme } from '../theme';
import { AppText, AppButton, Badge, MicrosoftLogo } from './ui';
import { haptic } from '../utils/haptics';

interface ContactModalProps {
  visible: boolean;
  onClose: () => void;
}

type MainTab = 'inquiry' | 'change_request';
type ChangeRequestSubTab = 'new' | 'history';

export const ContactModal: React.FC<ContactModalProps> = ({ visible, onClose }) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const router = useRouter();
  const { colors, borderRadius, shadows, isDark } = useAppTheme();

  // Tab State
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('inquiry');
  const [activeSubTab, setActiveSubTab] = useState<ChangeRequestSubTab>('new');

  // Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // General Inquiry State
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryContact, setInquiryContact] = useState('');
  const [inquirySubject, setInquirySubject] = useState('');
  const [inquiryDetails, setInquiryDetails] = useState('');
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

  // Change Request Form State
  const [requestType, setRequestType] = useState<ChangeRequestType>('meetings_groups');
  const [requestSubject, setRequestSubject] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [attachment, setAttachment] = useState<{ uri: string; name: string; type?: string } | null>(null);
  const [isSubmittingChangeRequest, setIsSubmittingChangeRequest] = useState(false);

  // Change Request History State
  const [myRequests, setMyRequests] = useState<ChangeRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  useEffect(() => {
    if (visible) {
      checkAuth();
    }
  }, [visible]);

  useEffect(() => {
    if (visible && user && activeMainTab === 'change_request' && activeSubTab === 'history') {
      loadMyRequests();
    }
  }, [visible, user, activeMainTab, activeSubTab]);

  const checkAuth = async () => {
    setIsCheckingAuth(true);
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
      // Guest mode
    } finally {
      setIsCheckingAuth(false);
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

  const handleClose = () => {
    haptic.light();
    onClose();
  };

  // Attachment Pickers
  const handlePickDocument = async () => {
    haptic.selection();
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        setAttachment({ uri: file.uri, name: file.name, type: file.mimeType });
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
        setAttachment({
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
        isAr ? 'يرجى كتابة رسالتك أو استفسارك قبل الإرسال.' : 'Please enter your message or inquiry before sending.'
      );
      return;
    }

    setIsSubmittingInquiry(true);
    haptic.selection();

    const payload = {
      name: inquiryName.trim() || (isAr ? 'عضو زمالة المدمنين المجهولين' : 'NA Member'),
      email: inquiryContact.trim() || null,
      contact: inquiryContact.trim() || null,
      subject: inquirySubject.trim() || (isAr ? 'استفسار من تطبيق الهاتف' : 'Mobile App Inquiry'),
      message: inquiryDetails.trim(),
      recipient: 'hello@naegypt.org',
      submitted_at: new Date().toISOString(),
    };

    try {
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

      setInquiryName('');
      setInquiryContact('');
      setInquirySubject('');
      setInquiryDetails('');
      onClose();
    } catch (e) {
      Alert.alert(
        isAr ? 'تنبيه' : 'Notice',
        isAr ? 'تعذر إرسال الرسالة، يرجى المحاولة لاحقاً.' : 'Failed to send message, please try again.'
      );
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
        isAr ? 'يرجى كتابة تفاصيل التعديلات المطلوبة بدقة.' : 'Please enter the detailed description of the changes.'
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
        attachment_name: attachment?.name || null,
        attachment_uri: attachment?.uri || null,
        attachment_type: attachment?.type || null,
      });

      haptic.success();

      if (res.queued) {
        Alert.alert(
          isAr ? 'تم الحفظ في الانتظار' : 'Saved to Queue',
          t('contact.offline_notice')
        );
      } else {
        Alert.alert(
          isAr ? 'تم إرسال طلب التعديل' : 'Change Request Submitted',
          isAr
            ? 'تم إرسال طلب التعديل بنجاح للجنة تقنية المعلومات وسيقوم الخدام بمراجعته.'
            : 'Your change request has been submitted to the IT Committee for review.'
        );
      }

      setRequestSubject('');
      setRequestDescription('');
      setAttachment(null);
      setActiveSubTab('history');
      loadMyRequests();
    } catch (err: any) {
      console.warn('Submit change request error:', err);
      Alert.alert(
        isAr ? 'خطأ' : 'Error',
        isAr
          ? 'تعذر إرسال طلب التعديل حالياً. يرجى التحقق من اتصالك بالإنترنت.'
          : 'Failed to submit change request. Please check your internet connection.'
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
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top', 'bottom']}>
        {/* Modal Top Header */}
        <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.cardBorder }]}>
          <View style={styles.headerTitleRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accentLight }]}>
              <Mail size={18} color={colors.accentDark} />
            </View>
            <View>
              <AppText variant="h3" color={colors.textPrimary} weight="800">
                {t('contact.title')}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {t('contact.subtitle')}
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

        {/* Segmented Type Bar (General Inquiry vs IT Change Request) */}
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

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* TAB 1: General Inquiry */}
            {activeMainTab === 'inquiry' && (
              <>
                {/* Confidential Public Banner */}
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
                  <HeartHandshake size={24} color={colors.accent} style={{ marginBottom: 6 }} />
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

                {/* Inquiry Form Card */}
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
                      value={inquiryName}
                      onChangeText={setInquiryName}
                    />
                  </View>

                  {/* Contact */}
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
                      value={inquiryContact}
                      onChangeText={setInquiryContact}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  {/* Subject */}
                  <View style={styles.inputGroup}>
                    <AppText
                      variant="label"
                      color={colors.primary}
                      weight="700"
                      style={[styles.label, { textAlign: isAr ? 'right' : 'left' }]}
                    >
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
                      placeholder={isAr ? 'مثال: استفسار عن مواعيد أو أماكن الاجتماعات' : 'e.g. Question about meetings or service'}
                      placeholderTextColor={colors.textMuted}
                      value={inquirySubject}
                      onChangeText={setInquirySubject}
                    />
                  </View>

                  {/* Details */}
                  <View style={styles.inputGroup}>
                    <AppText
                      variant="label"
                      color={colors.primary}
                      weight="700"
                      style={[styles.label, { textAlign: isAr ? 'right' : 'left' }]}
                    >
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

                  {/* Submit Inquiry Button */}
                  <AppButton
                    title={t('contact.submit_inquiry')}
                    onPress={handleSubmitInquiry}
                    variant="primary"
                    size="lg"
                    loading={isSubmittingInquiry}
                    icon={<Send size={16} color="#ffffff" />}
                    fullWidth
                    style={{ marginTop: 8 }}
                  />
                </View>
              </>
            )}

            {/* TAB 2: IT Change Request */}
            {activeMainTab === 'change_request' && (
              <>
                {/* 2A: If NOT Logged In => Show Gated Lock Card */}
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
                      onPress={() => {
                        onClose();
                        router.push('/login');
                      }}
                      style={styles.moreLoginLink}
                    >
                      <AppText variant="caption" color={colors.accent} weight="600">
                        {isAr ? 'أو الانتقال لصفحة تسجيل الدخول الكاملة' : 'Or open dedicated Login page'}
                      </AppText>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* 2B: User is Authenticated => Servant View */
                  <>
                    {/* Logged-In Servant Banner */}
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

                    {/* Sub Tab: New Request vs My Requests */}
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

                    {/* SUBTAB A: Submit New Request */}
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
                              onPress={handlePickDocument}
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
                              onPress={handlePickImage}
                              activeOpacity={0.8}
                            >
                              <ImageIcon size={15} color={colors.primary} style={{ marginEnd: 6 }} />
                              <AppText variant="labelSmall" color={colors.primary} weight="600">
                                {t('contact.select_photo')}
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
                          title={t('contact.submit_change_request')}
                          onPress={handleSubmitChangeRequest}
                          variant="primary"
                          size="lg"
                          loading={isSubmittingChangeRequest}
                          icon={<Send size={16} color="#ffffff" />}
                          fullWidth
                          style={{ marginTop: 8 }}
                        />
                      </View>
                    )}

                    {/* SUBTAB B: My Change Requests History */}
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
  mainTabBar: {
    flexDirection: 'row',
    padding: 4,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
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
    marginBottom: 16,
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
  lockCard: {
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 10,
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
  attachmentSection: {
    marginBottom: 16,
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
  historyContainer: {
    marginTop: 4,
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
});
