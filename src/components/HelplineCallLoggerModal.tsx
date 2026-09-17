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
import {
  X,
  PhoneCall,
  CheckCircle2,
  Clock,
  Calendar,
  User,
  HelpCircle,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react-native';
import { helplineApi } from '../api/helpline';
import {
  HelplineSchemaResponse,
  HelplineVolunteerItem,
  HelplineDurationOption,
  HelplineCallPayload,
} from '../api/types';
import { useAppTheme } from '../theme';
import { AppText, AppButton, Badge } from './ui';
import { haptic } from '../utils/haptics';

interface HelplineCallLoggerModalProps {
  visible: boolean;
  onClose: () => void;
}

const DEFAULT_SHIFTS = [
  '10:00 AM - 12:00 PM',
  '12:00 PM - 2:00 PM',
  '2:00 PM - 4:00 PM',
  '4:00 PM - 6:00 PM',
  '6:00 PM - 8:00 PM',
  '8:00 PM - 10:00 PM',
  '10:00 PM - 12:00 AM',
];

const DEFAULT_CALLER_TYPES = [
  'عضو حالي',
  'أعضاء محتملة',
  'عضو محتمل منعزل',
  'بيانات اجتماعات',
  'معلومات عن الزمالة',
  'أهالي وأقارب المدمنين',
  'عضو حالي منعزل',
  'معلومات عن زمالات أخرى',
  'مكالمة بالخطأ',
  'محولة للجنة العلاقات العامة',
  'أخرى',
];

const DEFAULT_REFERRAL_SOURCES = [
  'جدول الاجتماعات',
  'صديق',
  'الموقع الالكتروني',
  'ملصقات الزمالة',
  'عضو حالي',
  'بحث جوجل',
  'طبيب',
  'مكان علاجي',
  'لجنة المستشفيات',
  'صانع محتوى',
  'Facebook',
  'Instagram',
  'TikTok',
  'أخرى',
];

const DEFAULT_DURATIONS: HelplineDurationOption[] = [
  { value: 'less_than_5', label: 'أقل من 5 دقائق' },
  { value: 'more_than_5', label: 'أكثر من 5 دقائق' },
];

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const HelplineCallLoggerModal: React.FC<HelplineCallLoggerModalProps> = ({
  visible,
  onClose,
}) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { colors, borderRadius, shadows, isDark } = useAppTheme();

  // Schema state
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [shifts, setShifts] = useState<string[]>(DEFAULT_SHIFTS);
  const [callerTypes, setCallerTypes] = useState<string[]>(DEFAULT_CALLER_TYPES);
  const [referralSources, setReferralSources] = useState<string[]>(DEFAULT_REFERRAL_SOURCES);
  const [durations, setDurations] = useState<HelplineDurationOption[]>(DEFAULT_DURATIONS);
  const [volunteers, setVolunteers] = useState<HelplineVolunteerItem[]>([]);

  // Form fields
  const [duration, setDuration] = useState<string>('less_than_5');
  const [callDate, setCallDate] = useState<string>(getTodayString());
  const [callTimeShift, setCallTimeShift] = useState<string>(DEFAULT_SHIFTS[0]);
  const [callerType, setCallerType] = useState<string>(DEFAULT_CALLER_TYPES[0]);
  const [callerTypeOther, setCallerTypeOther] = useState<string>('');
  const [referralSource, setReferralSource] = useState<string>(DEFAULT_REFERRAL_SOURCES[0]);
  const [referralSourceOther, setReferralSourceOther] = useState<string>('');
  const [volunteerName, setVolunteerName] = useState<string>('');
  const [volunteerNameOther, setVolunteerNameOther] = useState<string>('');
  const [isStep12, setIsStep12] = useState<boolean>(false);
  const [callBrief, setCallBrief] = useState<string>('');
  const [discussInMeeting, setDiscussInMeeting] = useState<boolean>(false);
  const [additionalInfo, setAdditionalInfo] = useState<string>('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      loadSchema();
    }
  }, [visible]);

  const loadSchema = async () => {
    setIsLoadingSchema(true);
    try {
      const schema: HelplineSchemaResponse = await helplineApi.getSchema();
      if (schema) {
        if (Array.isArray(schema.shifts) && schema.shifts.length > 0) {
          setShifts(schema.shifts);
          setCallTimeShift((prev) => (schema.shifts.includes(prev) ? prev : schema.shifts[0]));
        }
        if (Array.isArray(schema.caller_types) && schema.caller_types.length > 0) {
          setCallerTypes(schema.caller_types);
          setCallerType((prev) => (schema.caller_types.includes(prev) ? prev : schema.caller_types[0]));
        }
        if (Array.isArray(schema.referral_sources) && schema.referral_sources.length > 0) {
          setReferralSources(schema.referral_sources);
          setReferralSource((prev) =>
            schema.referral_sources.includes(prev) ? prev : schema.referral_sources[0]
          );
        }
        if (Array.isArray(schema.durations) && schema.durations.length > 0) {
          setDurations(schema.durations);
        }
        if (Array.isArray(schema.volunteers) && schema.volunteers.length > 0) {
          setVolunteers(schema.volunteers);
          if (!volunteerName) {
            setVolunteerName(schema.volunteers[0].name);
          }
        }
      }
    } catch (e) {
      console.warn('Could not load dynamic helpline schema live, using fallback schema:', e);
    } finally {
      setIsLoadingSchema(false);
    }
  };

  const handleResetForAnotherCall = () => {
    haptic.selection();
    setIsSubmittedSuccess(false);
    setCallDate(getTodayString());
    setCallBrief('');
    setAdditionalInfo('');
    setIsStep12(false);
    setDiscussInMeeting(false);
    setCallerTypeOther('');
    setReferralSourceOther('');
  };

  const handleClose = () => {
    haptic.light();
    setIsSubmittedSuccess(false);
    onClose();
  };

  const handleSubmit = async () => {
    // Validation
    const effectiveVolunteer = volunteerName === 'أخرى' || volunteerName === 'Other' ? volunteerNameOther.trim() : volunteerName.trim();
    if (!effectiveVolunteer) {
      haptic.warning();
      Alert.alert(
        isAr ? 'تنبيه' : 'Notice',
        isAr ? 'يرجى تحديد أو إدخال اسم المتطوع متلقي المكالمة.' : 'Please select or enter the volunteer name.'
      );
      return;
    }

    if (callerType === 'أخرى' && !callerTypeOther.trim()) {
      haptic.warning();
      Alert.alert(
        isAr ? 'تنبيه' : 'Notice',
        isAr ? 'يرجى توضيح نوع المتصل في الحقل المخصص.' : 'Please specify the caller type.'
      );
      return;
    }

    if (referralSource === 'أخرى' && !referralSourceOther.trim()) {
      haptic.warning();
      Alert.alert(
        isAr ? 'تنبيه' : 'Notice',
        isAr ? 'يرجى توضيح مصدر المعرفة بالزمالة في الحقل المخصص.' : 'Please specify the referral source.'
      );
      return;
    }

    if (!callBrief.trim() || callBrief.trim().length < 3) {
      haptic.warning();
      Alert.alert(
        isAr ? 'تنبيه' : 'Notice',
        isAr ? 'يرجى كتابة ملخص موجز للمكالمة (3 أحرف على الأقل).' : 'Please enter a brief summary of the call (min 3 chars).'
      );
      return;
    }

    const payload: HelplineCallPayload = {
      duration,
      call_date: callDate.trim() || getTodayString(),
      call_time_shift: callTimeShift,
      caller_type: callerType,
      caller_type_other: callerType === 'أخرى' ? callerTypeOther.trim() : null,
      referral_source: referralSource,
      referral_source_other: referralSource === 'أخرى' ? referralSourceOther.trim() : null,
      volunteer_name: effectiveVolunteer,
      volunteer_name_other: volunteerName === 'أخرى' || volunteerName === 'Other' ? volunteerNameOther.trim() : null,
      is_step_12: isStep12,
      call_brief: callBrief.trim(),
      discuss_in_meeting: discussInMeeting,
      additional_info: additionalInfo.trim() || null,
    };

    setIsSubmitting(true);
    haptic.selection();

    try {
      await helplineApi.submitCall(payload);
      haptic.success();
      setIsSubmittedSuccess(true);
    } catch (err: any) {
      console.warn('Failed to submit helpline call:', err);
      haptic.warning();
      const errorMsg =
        err?.response?.data?.message ||
        (isAr
          ? 'تعذر تسجيل المكالمة حالياً. تأكد من اتصال الإنترنت وحاول مرة أخرى.'
          : 'Could not log the call. Please check your connection and try again.');
      Alert.alert(isAr ? 'خطأ في التسجيل' : 'Submission Error', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.bgPrimary }]}
        edges={['top', 'bottom']}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.cardBg,
              borderBottomColor: colors.cardBorder,
              flexDirection: isAr ? 'row-reverse' : 'row',
            },
          ]}
        >
          <View style={[styles.headerTitleRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accentLight }]}>
              <PhoneCall size={18} color={colors.accentDark} />
            </View>
            <View style={{ marginHorizontal: 8 }}>
              <View style={{ flexDirection: isAr ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                <AppText variant="h3" color={colors.textPrimary} weight="800">
                  {isAr ? 'استجابة خط المساعدة' : 'Helpline Call Logger'}
                </AppText>
                <Badge
                  label={isAr ? 'نموذج المتطوعين' : 'Volunteers'}
                  variant="accent"
                  size="sm"
                />
              </View>
              <AppText variant="caption" color={colors.textSecondary}>
                {isAr
                  ? 'تسجيل وتوثيق مكالمات خطوط المساعدة الرسمية'
                  : 'Official NA Egypt Helpline Call Log'}
              </AppText>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: isDark ? '#262626' : '#f3f4f6' }]}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {isSubmittedSuccess ? (
          /* Success Screen */
          <View style={styles.successContainer}>
            <View style={[styles.successIconCircle, { backgroundColor: colors.successLight }]}>
              <CheckCircle2 size={48} color={colors.success} />
            </View>
            <AppText variant="h2" color={colors.textPrimary} weight="800" style={styles.successTitle}>
              {isAr ? 'تم تسجيل المكالمة بنجاح' : 'Call Logged Successfully'}
            </AppText>
            <AppText variant="body" color={colors.textSecondary} style={styles.successSub}>
              {isAr
                ? 'شكراً لخدمتك وتفانيك في حمل رسالة التعافي عبر خطوط مساعدة زمالة المدمنين المجهولين.'
                : 'Thank you for your service and dedication to carrying the message through NA helpline.'}
            </AppText>

            <View style={styles.successActions}>
              <AppButton
                title={isAr ? 'تسجيل مكالمة أخرى' : 'Log Another Call'}
                onPress={handleResetForAnotherCall}
                variant="primary"
                size="md"
                icon={<RotateCcw size={16} color="#ffffff" />}
                style={{ width: '100%', marginBottom: 12 }}
              />
              <AppButton
                title={isAr ? 'إغلاق والعودة' : 'Done'}
                onPress={handleClose}
                variant="outline"
                size="md"
                style={{ width: '100%' }}
              />
            </View>
          </View>
        ) : (
          /* Form Screen */
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {isLoadingSchema ? (
                <View style={styles.schemaLoadingBanner}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <AppText variant="caption" color={colors.textSecondary} style={{ marginStart: 8 }}>
                    {isAr ? 'جاري تحديث الخيارات وقائمة المتطوعين...' : 'Updating dynamic shifts and volunteers...'}
                  </AppText>
                </View>
              ) : null}

              {/* Section 1: Call Time & Volunteer */}
              <View
                style={[
                  styles.formSection,
                  shadows.card,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                    borderRadius: borderRadius.lg,
                  },
                ]}
              >
                <View style={[styles.sectionHeaderRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                  <Clock size={16} color={colors.primary} />
                  <AppText variant="h4" color={colors.textPrimary} weight="700" style={{ marginHorizontal: 6 }}>
                    {isAr ? 'توقيت المكالمة والمتطوع' : 'Call Timing & Volunteer'}
                  </AppText>
                </View>

                {/* Call Date */}
                <AppText variant="label" color={colors.textSecondary} style={styles.inputLabel}>
                  {isAr ? 'تاريخ المكالمة (YYYY-MM-DD)' : 'Call Date (YYYY-MM-DD)'}
                </AppText>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.bgPrimary,
                      borderColor: colors.cardBorder,
                      color: colors.textPrimary,
                      borderRadius: borderRadius.md,
                      textAlign: isAr ? 'right' : 'left',
                    },
                  ]}
                  value={callDate}
                  onChangeText={setCallDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />

                {/* Shift Selector */}
                <AppText variant="label" color={colors.textSecondary} style={styles.inputLabel}>
                  {isAr ? 'فترة الوردية (الشيفت)' : 'Call Shift'}
                </AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  <View style={[styles.chipsContainer, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                    {shifts.map((shift) => {
                      const isSelected = callTimeShift === shift;
                      return (
                        <TouchableOpacity
                          key={shift}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.bgPrimary,
                              borderColor: isSelected ? colors.primary : colors.cardBorder,
                              borderRadius: borderRadius.full,
                            },
                          ]}
                          onPress={() => {
                            haptic.selection();
                            setCallTimeShift(shift);
                          }}
                        >
                          <AppText
                            variant="caption"
                            weight={isSelected ? '700' : '500'}
                            color={isSelected ? '#ffffff' : colors.textPrimary}
                          >
                            {shift}
                          </AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* Call Duration */}
                <AppText variant="label" color={colors.textSecondary} style={styles.inputLabel}>
                  {isAr ? 'مدة المكالمة' : 'Call Duration'}
                </AppText>
                <View style={[styles.chipsContainer, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                  {durations.map((d) => {
                    const isSelected = duration === d.value;
                    return (
                      <TouchableOpacity
                        key={d.value}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? colors.accentDark : colors.bgPrimary,
                            borderColor: isSelected ? colors.accentDark : colors.cardBorder,
                            borderRadius: borderRadius.full,
                          },
                        ]}
                        onPress={() => {
                          haptic.selection();
                          setDuration(d.value);
                        }}
                      >
                        <AppText
                          variant="caption"
                          weight={isSelected ? '700' : '500'}
                          color={isSelected ? '#ffffff' : colors.textPrimary}
                        >
                          {d.label}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Volunteer Name Selection */}
                <AppText variant="label" color={colors.textSecondary} style={styles.inputLabel}>
                  {isAr ? 'اسم المتطوع متلقي المكالمة' : 'Volunteer Name'}
                </AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  <View style={[styles.chipsContainer, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                    {volunteers.map((vol) => {
                      const isSelected = volunteerName === vol.name;
                      return (
                        <TouchableOpacity
                          key={vol.id}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.bgPrimary,
                              borderColor: isSelected ? colors.primary : colors.cardBorder,
                              borderRadius: borderRadius.full,
                            },
                          ]}
                          onPress={() => {
                            haptic.selection();
                            setVolunteerName(vol.name);
                          }}
                        >
                          <AppText
                            variant="caption"
                            weight={isSelected ? '700' : '500'}
                            color={isSelected ? '#ffffff' : colors.textPrimary}
                          >
                            {vol.name}
                          </AppText>
                        </TouchableOpacity>
                      );
                    })}
                    <TouchableOpacity
                      style={[
                        styles.chip,
                        {
                          backgroundColor: volunteerName === 'أخرى' ? colors.primary : colors.bgPrimary,
                          borderColor: volunteerName === 'أخرى' ? colors.primary : colors.cardBorder,
                          borderRadius: borderRadius.full,
                        },
                      ]}
                      onPress={() => {
                        haptic.selection();
                        setVolunteerName('أخرى');
                      }}
                    >
                      <AppText
                        variant="caption"
                        weight={volunteerName === 'أخرى' ? '700' : '500'}
                        color={volunteerName === 'أخرى' ? '#ffffff' : colors.textPrimary}
                      >
                        {isAr ? 'اسم آخر...' : 'Other Name...'}
                      </AppText>
                    </TouchableOpacity>
                  </View>
                </ScrollView>

                {volunteerName === 'أخرى' || volunteerName === 'Other' || volunteers.length === 0 ? (
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.bgPrimary,
                        borderColor: colors.cardBorder,
                        color: colors.textPrimary,
                        borderRadius: borderRadius.md,
                        textAlign: isAr ? 'right' : 'left',
                        marginTop: 8,
                      },
                    ]}
                    value={volunteerNameOther}
                    onChangeText={setVolunteerNameOther}
                    placeholder={isAr ? 'اكتب اسمك كمتطوع...' : 'Enter volunteer name...'}
                    placeholderTextColor={colors.textMuted}
                  />
                ) : null}
              </View>

              {/* Section 2: Caller Profile */}
              <View
                style={[
                  styles.formSection,
                  shadows.card,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                    borderRadius: borderRadius.lg,
                  },
                ]}
              >
                <View style={[styles.sectionHeaderRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                  <User size={16} color={colors.accentDark} />
                  <AppText variant="h4" color={colors.textPrimary} weight="700" style={{ marginHorizontal: 6 }}>
                    {isAr ? 'بيانات المتصل ومصدر المعرفة' : 'Caller & Referral'}
                  </AppText>
                </View>

                {/* Caller Type */}
                <AppText variant="label" color={colors.textSecondary} style={styles.inputLabel}>
                  {isAr ? 'نوع المتصل' : 'Caller Type'}
                </AppText>
                <View style={[styles.chipsWrapContainer, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                  {callerTypes.map((type) => {
                    const isSelected = callerType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? colors.accentDark : colors.bgPrimary,
                            borderColor: isSelected ? colors.accentDark : colors.cardBorder,
                            borderRadius: borderRadius.full,
                          },
                        ]}
                        onPress={() => {
                          haptic.selection();
                          setCallerType(type);
                        }}
                      >
                        <AppText
                          variant="caption"
                          weight={isSelected ? '700' : '500'}
                          color={isSelected ? '#ffffff' : colors.textPrimary}
                        >
                          {type}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {callerType === 'أخرى' || callerType === 'Other' ? (
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.bgPrimary,
                        borderColor: colors.cardBorder,
                        color: colors.textPrimary,
                        borderRadius: borderRadius.md,
                        textAlign: isAr ? 'right' : 'left',
                        marginTop: 8,
                      },
                    ]}
                    value={callerTypeOther}
                    onChangeText={setCallerTypeOther}
                    placeholder={isAr ? 'حدد نوع المتصل الآخر...' : 'Specify other caller type...'}
                    placeholderTextColor={colors.textMuted}
                  />
                ) : null}

                {/* Referral Source */}
                <AppText variant="label" color={colors.textSecondary} style={[styles.inputLabel, { marginTop: 14 }]}>
                  {isAr ? 'مصدر معرفة المتصل بالزمالة' : 'Referral Source'}
                </AppText>
                <View style={[styles.chipsWrapContainer, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                  {referralSources.map((source) => {
                    const isSelected = referralSource === source;
                    return (
                      <TouchableOpacity
                        key={source}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.bgPrimary,
                            borderColor: isSelected ? colors.primary : colors.cardBorder,
                            borderRadius: borderRadius.full,
                          },
                        ]}
                        onPress={() => {
                          haptic.selection();
                          setReferralSource(source);
                        }}
                      >
                        <AppText
                          variant="caption"
                          weight={isSelected ? '700' : '500'}
                          color={isSelected ? '#ffffff' : colors.textPrimary}
                        >
                          {source}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {referralSource === 'أخرى' || referralSource === 'Other' ? (
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.bgPrimary,
                        borderColor: colors.cardBorder,
                        color: colors.textPrimary,
                        borderRadius: borderRadius.md,
                        textAlign: isAr ? 'right' : 'left',
                        marginTop: 8,
                      },
                    ]}
                    value={referralSourceOther}
                    onChangeText={setReferralSourceOther}
                    placeholder={isAr ? 'حدد مصدر المعرفة الآخر...' : 'Specify other referral source...'}
                    placeholderTextColor={colors.textMuted}
                  />
                ) : null}
              </View>

              {/* Section 3: Call Details & Content */}
              <View
                style={[
                  styles.formSection,
                  shadows.card,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                    borderRadius: borderRadius.lg,
                  },
                ]}
              >
                <View style={[styles.sectionHeaderRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                  <FileText size={16} color={colors.success} />
                  <AppText variant="h4" color={colors.textPrimary} weight="700" style={{ marginHorizontal: 6 }}>
                    {isAr ? 'تفاصيل المكالمة والخطوة 12' : 'Call Details & Step 12'}
                  </AppText>
                </View>

                {/* Is Step 12 Toggle */}
                <View style={[styles.toggleRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="body" color={colors.textPrimary} weight="700">
                      {isAr ? 'مكالمة خطوة 12 (طلب تعافي)' : 'Step 12 Call (Recovery)'}
                    </AppText>
                    <AppText variant="caption" color={colors.textSecondary}>
                      {isAr
                        ? 'هل تضمنت المكالمة تقديم رسالة التعافي لشخص راغب في الامتناع؟'
                        : 'Did this call involve carrying the recovery message?'}
                    </AppText>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.switchBtn,
                      {
                        backgroundColor: isStep12 ? colors.success : colors.bgPrimary,
                        borderColor: isStep12 ? colors.success : colors.cardBorder,
                        borderRadius: borderRadius.full,
                      },
                    ]}
                    onPress={() => {
                      haptic.selection();
                      setIsStep12(!isStep12);
                    }}
                  >
                    <AppText
                      variant="caption"
                      weight="700"
                      color={isStep12 ? '#ffffff' : colors.textSecondary}
                    >
                      {isStep12 ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}
                    </AppText>
                  </TouchableOpacity>
                </View>

                {/* Call Brief (Required) */}
                <AppText variant="label" color={colors.textSecondary} style={[styles.inputLabel, { marginTop: 14 }]}>
                  {isAr ? 'ملخص المكالمة (مطلوب)' : 'Call Brief (Required)'}
                </AppText>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: colors.bgPrimary,
                      borderColor: colors.cardBorder,
                      color: colors.textPrimary,
                      borderRadius: borderRadius.md,
                      textAlign: isAr ? 'right' : 'left',
                    },
                  ]}
                  value={callBrief}
                  onChangeText={setCallBrief}
                  placeholder={
                    isAr
                      ? 'اكتب ملخصاً موجزاً عما دار في المكالمة وما تم توجيه المتصل إليه...'
                      : 'Summarize the call discussion and guidance provided...'
                  }
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                {/* Discuss in Committee Meeting Toggle */}
                <View style={[styles.toggleRow, { flexDirection: isAr ? 'row-reverse' : 'row', marginTop: 14 }]}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="body" color={colors.textPrimary} weight="700">
                      {isAr ? 'تطرح في اجتماع لجنة خط المساعدة' : 'Discuss in Committee Meeting'}
                    </AppText>
                    <AppText variant="caption" color={colors.textSecondary}>
                      {isAr
                        ? 'هل تستدعي هذه الحالة مناقشتها مع خدام خطوط المساعدة؟'
                        : 'Does this case require committee discussion?'}
                    </AppText>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.switchBtn,
                      {
                        backgroundColor: discussInMeeting ? colors.accentDark : colors.bgPrimary,
                        borderColor: discussInMeeting ? colors.accentDark : colors.cardBorder,
                        borderRadius: borderRadius.full,
                      },
                    ]}
                    onPress={() => {
                      haptic.selection();
                      setDiscussInMeeting(!discussInMeeting);
                    }}
                  >
                    <AppText
                      variant="caption"
                      weight="700"
                      color={discussInMeeting ? '#ffffff' : colors.textSecondary}
                    >
                      {discussInMeeting ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}
                    </AppText>
                  </TouchableOpacity>
                </View>

                {/* Additional Info (Optional) */}
                <AppText variant="label" color={colors.textSecondary} style={[styles.inputLabel, { marginTop: 14 }]}>
                  {isAr ? 'ملاحظات إضافية (اختياري)' : 'Additional Notes (Optional)'}
                </AppText>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: colors.bgPrimary,
                      borderColor: colors.cardBorder,
                      color: colors.textPrimary,
                      borderRadius: borderRadius.md,
                      textAlign: isAr ? 'right' : 'left',
                    },
                  ]}
                  value={additionalInfo}
                  onChangeText={setAdditionalInfo}
                  placeholder={
                    isAr
                      ? 'أي تفاصيل أخرى تخص الاجتماع المحال إليه أو رقم الهاتف إذا وافق المتصل...'
                      : 'Any extra details regarding referred meeting or follow up...'
                  }
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>

              {/* Submit Button */}
              <AppButton
                title={isSubmitting ? (isAr ? 'جاري تسجيل المكالمة...' : 'Submitting Call...') : (isAr ? 'تسجيل استجابة المكالمة' : 'Submit Call Response')}
                onPress={handleSubmit}
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                loading={isSubmitting}
                icon={<PhoneCall size={18} color="#ffffff" />}
                style={styles.submitBtn}
              />
            </ScrollView>
          </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  schemaLoadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  formSection: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    marginTop: 10,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 70,
  },
  chipsScroll: {
    marginVertical: 4,
  },
  chipsContainer: {
    gap: 8,
  },
  chipsWrapContainer: {
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  toggleRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  switchBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    minWidth: 64,
    alignItems: 'center',
  },
  submitBtn: {
    marginTop: 8,
    marginBottom: 24,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  successSub: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    maxWidth: 320,
  },
  successActions: {
    width: '100%',
    maxWidth: 320,
  },
});
