import React, { useState, useEffect, useRef } from 'react';
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
import * as SecureStore from 'expo-secure-store';
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
  Building2,
  MapPin,
  AlertCircle,
} from 'lucide-react-native';
import { helplineApi } from '../api/helpline';
import {
  HelplineSchemaResponse,
  HelplineVolunteerItem,
  HelplineDurationOption,
  HelplineCallPayload,
  HelplineConditionalRule,
} from '../api/types';
import { useAppTheme } from '../theme';
import { AppText, AppButton, Badge } from './ui';
import { haptic } from '../utils/haptics';

interface HelplineCallLoggerModalProps {
  visible: boolean;
  onClose: () => void;
}

const HELPLINE_DRAFT_STORAGE_KEY = 'na_egypt_helpline_call_draft_v2';

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
  'أعضاء محتملة',
  'عضو محتمل منعزل',
  'بيانات اجتماعات',
  'عضو حالي',
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
  'Yellow Pages',
  'Facebook',
  'TikTok',
  'ChatGPT',
  'Instagram',
  'YouTube',
  'أخرى',
];

const DEFAULT_DURATIONS: HelplineDurationOption[] = [
  { value: 'less_than_5', label: 'أقل من 5 دقائق' },
  { value: 'more_than_5', label: 'أكثر من 5 دقائق' },
];

const DEFAULT_CONDITIONAL_RULES: Record<string, HelplineConditionalRule> = {
  call_brief: {
    rule: 'optional_if',
    field: 'caller_type',
    value: 'عضو حالي',
    description: 'Call brief is optional when caller_type is "عضو حالي", required otherwise.',
  },
  hospital_name: {
    rule: 'required_if',
    field: 'referral_source',
    value: 'لجنة المستشفيات',
    description: 'Hospital name is required when referral_source is "لجنة المستشفيات".',
  },
  poster_location: {
    rule: 'required_if',
    field: 'referral_source',
    value: 'ملصقات الزمالة',
    description: 'Poster location is required when referral_source is "ملصقات الزمالة".',
  },
};

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
  const [conditionalRules, setConditionalRules] = useState<Record<string, HelplineConditionalRule>>(DEFAULT_CONDITIONAL_RULES);

  // Form fields
  const [duration, setDuration] = useState<string>('less_than_5');
  const [callDate, setCallDate] = useState<string>(getTodayString());
  const [callTimeShift, setCallTimeShift] = useState<string>(DEFAULT_SHIFTS[0]);
  const [callerType, setCallerType] = useState<string>(DEFAULT_CALLER_TYPES[0]);
  const [callerTypeOther, setCallerTypeOther] = useState<string>('');
  const [referralSource, setReferralSource] = useState<string>(DEFAULT_REFERRAL_SOURCES[0]);
  const [referralSourceOther, setReferralSourceOther] = useState<string>('');
  const [hospitalName, setHospitalName] = useState<string>('');
  const [posterLocation, setPosterLocation] = useState<string>('');
  const [volunteerName, setVolunteerName] = useState<string>('');
  const [volunteerNameOther, setVolunteerNameOther] = useState<string>('');
  const [isStep12, setIsStep12] = useState<boolean>(false);
  const [callBrief, setCallBrief] = useState<string>('');
  const [discussInMeeting, setDiscussInMeeting] = useState<boolean>(false);
  const [additionalInfo, setAdditionalInfo] = useState<string>('');

  // UI & Validation state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const isDraftLoadedRef = useRef(false);

  // Load Schema and Saved Draft
  useEffect(() => {
    if (visible) {
      loadSchema();
      loadDraft();
    }
  }, [visible]);

  const loadDraft = async () => {
    try {
      const saved = await SecureStore.getItemAsync(HELPLINE_DRAFT_STORAGE_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft && typeof draft === 'object') {
          if (draft.duration) setDuration(draft.duration);
          if (draft.callDate) setCallDate(draft.callDate);
          if (draft.callTimeShift) setCallTimeShift(draft.callTimeShift);
          if (draft.callerType) setCallerType(draft.callerType);
          if (draft.callerTypeOther) setCallerTypeOther(draft.callerTypeOther);
          if (draft.referralSource) setReferralSource(draft.referralSource);
          if (draft.referralSourceOther) setReferralSourceOther(draft.referralSourceOther);
          if (draft.hospitalName) setHospitalName(draft.hospitalName);
          if (draft.posterLocation) setPosterLocation(draft.posterLocation);
          if (draft.volunteerName) setVolunteerName(draft.volunteerName);
          if (draft.volunteerNameOther) setVolunteerNameOther(draft.volunteerNameOther);
          if (typeof draft.isStep12 === 'boolean') setIsStep12(draft.isStep12);
          if (draft.callBrief !== undefined) setCallBrief(draft.callBrief);
          if (typeof draft.discussInMeeting === 'boolean') setDiscussInMeeting(draft.discussInMeeting);
          if (draft.additionalInfo !== undefined) setAdditionalInfo(draft.additionalInfo);
        }
      }
    } catch (e) {
      console.warn('Could not restore helpline call draft:', e);
    } finally {
      isDraftLoadedRef.current = true;
    }
  };

  // Debounced auto-saving to SecureStore
  useEffect(() => {
    if (!visible || isSubmittedSuccess || !isDraftLoadedRef.current) return;

    const timer = setTimeout(async () => {
      try {
        const draft = {
          duration,
          callDate,
          callTimeShift,
          callerType,
          callerTypeOther,
          referralSource,
          referralSourceOther,
          hospitalName,
          posterLocation,
          volunteerName,
          volunteerNameOther,
          isStep12,
          callBrief,
          discussInMeeting,
          additionalInfo,
        };
        await SecureStore.setItemAsync(HELPLINE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
      } catch (e) {
        // silent fail on background draft save
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [
    visible,
    isSubmittedSuccess,
    duration,
    callDate,
    callTimeShift,
    callerType,
    callerTypeOther,
    referralSource,
    referralSourceOther,
    hospitalName,
    posterLocation,
    volunteerName,
    volunteerNameOther,
    isStep12,
    callBrief,
    discussInMeeting,
    additionalInfo,
  ]);

  const clearSavedDraft = async () => {
    try {
      await SecureStore.deleteItemAsync(HELPLINE_DRAFT_STORAGE_KEY);
    } catch (e) {
      // silent
    }
  };

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
        if (schema.conditional_fields && typeof schema.conditional_fields === 'object') {
          setConditionalRules((prev) => ({
            ...prev,
            ...schema.conditional_fields,
          }));
        }
      }
    } catch (e) {
      console.warn('Could not load dynamic helpline schema live, using fallback schema:', e);
    } finally {
      setIsLoadingSchema(false);
    }
  };

  // Dynamic Rule Evaluator
  const isRuleActive = (targetField: string, ruleType: 'required_if' | 'optional_if'): boolean => {
    const rule = conditionalRules[targetField];
    if (!rule || rule.rule !== ruleType) return false;
    if (rule.field === 'referral_source') {
      return referralSource === rule.value;
    }
    if (rule.field === 'caller_type') {
      return callerType === rule.value;
    }
    return false;
  };

  // Computed conditional flags
  const isHospitalRequired =
    isRuleActive('hospital_name', 'required_if') || referralSource === 'لجنة المستشفيات';
  const isPosterLocationRequired =
    isRuleActive('poster_location', 'required_if') || referralSource === 'ملصقات الزمالة';
  const isCallBriefOptional =
    isRuleActive('call_brief', 'optional_if') || callerType === 'عضو حالي';

  // Caller Type Selection Handler
  const handleSelectCallerType = (type: string) => {
    haptic.selection();
    setCallerType(type);
    if (type !== 'أخرى') {
      setCallerTypeOther('');
    }
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.caller_type;
      delete next.caller_type_other;
      if (type === 'عضو حالي') {
        delete next.call_brief;
      }
      return next;
    });
  };

  // Referral Source Selection Handler (Resets conditional fields when trigger changes)
  const handleSelectReferralSource = (source: string) => {
    haptic.selection();
    setReferralSource(source);
    if (source !== 'لجنة المستشفيات') {
      setHospitalName('');
    }
    if (source !== 'ملصقات الزمالة') {
      setPosterLocation('');
    }
    if (source !== 'أخرى') {
      setReferralSourceOther('');
    }
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.referral_source;
      delete next.referral_source_other;
      delete next.hospital_name;
      delete next.poster_location;
      return next;
    });
  };

  const handleResetForAnotherCall = async () => {
    haptic.selection();
    await clearSavedDraft();
    setIsSubmittedSuccess(false);
    setFieldErrors({});
    setCallDate(getTodayString());
    setCallBrief('');
    setAdditionalInfo('');
    setHospitalName('');
    setPosterLocation('');
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
    const errors: Record<string, string> = {};

    // Volunteer validation
    const effectiveVolunteer =
      volunteerName === 'أخرى' || volunteerName === 'Other'
        ? volunteerNameOther.trim()
        : volunteerName.trim();
    if (!effectiveVolunteer) {
      errors.volunteer = isAr
        ? 'يرجى تحديد أو إدخال اسم المتطوع متلقي المكالمة.'
        : 'Please select or enter the volunteer name.';
    }

    // Caller type validation
    if (callerType === 'أخرى' && !callerTypeOther.trim()) {
      errors.caller_type_other = isAr
        ? 'يرجى توضيح نوع المتصل في الحقل المخصص.'
        : 'Please specify the caller type.';
    }

    // Referral source validation
    if (referralSource === 'أخرى' && !referralSourceOther.trim()) {
      errors.referral_source_other = isAr
        ? 'يرجى توضيح مصدر المعرفة بالزمالة في الحقل المخصص.'
        : 'Please specify the referral source.';
    }

    // Conditional: Hospital Name
    if (isHospitalRequired && !hospitalName.trim()) {
      errors.hospital_name = isAr
        ? 'يرجى إدخال اسم المستشفى أو المؤسسة العلاجية التابعة للجنة المستشفيات.'
        : 'Please enter the hospital or treatment facility name.';
    }

    // Conditional: Poster Location
    if (isPosterLocationRequired && !posterLocation.trim()) {
      errors.poster_location = isAr
        ? 'يرجى تحديد مكان أو عنوان ملصق الزمالة.'
        : 'Please specify the location/address of the fellowship poster.';
    }

    // Call Brief validation (Optional for 'عضو حالي', required otherwise)
    if (!isCallBriefOptional) {
      if (!callBrief.trim() || callBrief.trim().length < 3) {
        errors.call_brief = isAr
          ? 'يرجى كتابة ملخص موجز للمكالمة (3 أحرف على الأقل).'
          : 'Please enter a brief summary of the call (min 3 chars).';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      haptic.warning();
      const firstErrorMessage = Object.values(errors)[0];
      Alert.alert(isAr ? 'تنبيه' : 'Notice', firstErrorMessage);
      return;
    }

    setFieldErrors({});

    const payload: HelplineCallPayload = {
      duration,
      call_date: callDate.trim() || getTodayString(),
      call_time_shift: callTimeShift,
      caller_type: callerType,
      caller_type_other: callerType === 'أخرى' ? callerTypeOther.trim() : null,
      referral_source: referralSource,
      referral_source_other: referralSource === 'أخرى' ? referralSourceOther.trim() : null,
      hospital_name: isHospitalRequired ? hospitalName.trim() : null,
      poster_location: isPosterLocationRequired ? posterLocation.trim() : null,
      volunteer_name: effectiveVolunteer,
      volunteer_name_other:
        volunteerName === 'أخرى' || volunteerName === 'Other' ? volunteerNameOther.trim() : null,
      is_step_12: isStep12,
      call_brief: callBrief.trim() || null,
      discuss_in_meeting: discussInMeeting,
      additional_info: additionalInfo.trim() || null,
    };

    setIsSubmitting(true);
    haptic.selection();

    try {
      await helplineApi.submitCall(payload);
      await clearSavedDraft();
      haptic.success();
      setIsSubmittedSuccess(true);
    } catch (err: any) {
      console.warn('Failed to submit helpline call:', err);
      haptic.warning();
      const backendErrors = err?.response?.data?.errors;
      if (backendErrors && typeof backendErrors === 'object') {
        const mappedErrors: Record<string, string> = {};
        for (const [k, v] of Object.entries(backendErrors)) {
          if (Array.isArray(v) && v[0]) {
            mappedErrors[k] = v[0] as string;
          }
        }
        setFieldErrors(mappedErrors);
      }
      const errorMsg =
        err?.response?.data?.message ||
        (isAr
          ? 'تعذر تسجيل المكالمة حالياً. تأكد من صحة البيانات واتصال الإنترنت وحاول مرة أخرى.'
          : 'Could not log the call. Please check your data and connection and try again.');
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
                      fieldErrors.volunteer ? styles.inputError : null,
                      {
                        backgroundColor: colors.bgPrimary,
                        borderColor: fieldErrors.volunteer ? colors.danger : colors.cardBorder,
                        color: colors.textPrimary,
                        borderRadius: borderRadius.md,
                        textAlign: isAr ? 'right' : 'left',
                        marginTop: 8,
                      },
                    ]}
                    value={volunteerNameOther}
                    onChangeText={(text) => {
                      setVolunteerNameOther(text);
                      if (fieldErrors.volunteer) {
                        setFieldErrors((prev) => {
                          const n = { ...prev };
                          delete n.volunteer;
                          return n;
                        });
                      }
                    }}
                    placeholder={isAr ? 'اكتب اسمك كمتطوع...' : 'Enter volunteer name...'}
                    placeholderTextColor={colors.textMuted}
                  />
                ) : null}

                {fieldErrors.volunteer ? (
                  <View style={[styles.errorRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                    <AlertCircle size={13} color={colors.danger} />
                    <AppText variant="caption" color={colors.danger} style={{ marginHorizontal: 4 }}>
                      {fieldErrors.volunteer}
                    </AppText>
                  </View>
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
                        onPress={() => handleSelectCallerType(type)}
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
                  <View>
                    <TextInput
                      style={[
                        styles.textInput,
                        fieldErrors.caller_type_other ? styles.inputError : null,
                        {
                          backgroundColor: colors.bgPrimary,
                          borderColor: fieldErrors.caller_type_other ? colors.danger : colors.cardBorder,
                          color: colors.textPrimary,
                          borderRadius: borderRadius.md,
                          textAlign: isAr ? 'right' : 'left',
                          marginTop: 8,
                        },
                      ]}
                      value={callerTypeOther}
                      onChangeText={(text) => {
                        setCallerTypeOther(text);
                        if (fieldErrors.caller_type_other) {
                          setFieldErrors((prev) => {
                            const n = { ...prev };
                            delete n.caller_type_other;
                            return n;
                          });
                        }
                      }}
                      placeholder={isAr ? 'حدد نوع المتصل الآخر...' : 'Specify other caller type...'}
                      placeholderTextColor={colors.textMuted}
                    />
                    {fieldErrors.caller_type_other ? (
                      <View style={[styles.errorRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                        <AlertCircle size={13} color={colors.danger} />
                        <AppText variant="caption" color={colors.danger} style={{ marginHorizontal: 4 }}>
                          {fieldErrors.caller_type_other}
                        </AppText>
                      </View>
                    ) : null}
                  </View>
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
                        onPress={() => handleSelectReferralSource(source)}
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
                  <View>
                    <TextInput
                      style={[
                        styles.textInput,
                        fieldErrors.referral_source_other ? styles.inputError : null,
                        {
                          backgroundColor: colors.bgPrimary,
                          borderColor: fieldErrors.referral_source_other ? colors.danger : colors.cardBorder,
                          color: colors.textPrimary,
                          borderRadius: borderRadius.md,
                          textAlign: isAr ? 'right' : 'left',
                          marginTop: 8,
                        },
                      ]}
                      value={referralSourceOther}
                      onChangeText={(text) => {
                        setReferralSourceOther(text);
                        if (fieldErrors.referral_source_other) {
                          setFieldErrors((prev) => {
                            const n = { ...prev };
                            delete n.referral_source_other;
                            return n;
                          });
                        }
                      }}
                      placeholder={isAr ? 'حدد مصدر المعرفة الآخر...' : 'Specify other referral source...'}
                      placeholderTextColor={colors.textMuted}
                    />
                    {fieldErrors.referral_source_other ? (
                      <View style={[styles.errorRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                        <AlertCircle size={13} color={colors.danger} />
                        <AppText variant="caption" color={colors.danger} style={{ marginHorizontal: 4 }}>
                          {fieldErrors.referral_source_other}
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {/* Conditional Field: Hospital Name (Rendered Inline) */}
                {isHospitalRequired ? (
                  <View
                    style={[
                      styles.conditionalFieldContainer,
                      {
                        backgroundColor: isDark ? 'rgba(34, 211, 238, 0.08)' : '#f0fdfa',
                        borderColor: isDark ? '#0891b2' : '#99f6e4',
                      },
                    ]}
                  >
                    <View style={[styles.labelWithBadgeRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                      <View style={{ flexDirection: isAr ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                        <Building2 size={16} color={colors.accentDark} />
                        <AppText variant="label" color={colors.textPrimary} weight="700">
                          {isAr ? 'اسم المستشفى أو المركز العلاجي' : 'Hospital / Facility Name'}
                        </AppText>
                      </View>
                      <Badge
                        label={isAr ? 'مطلوب للجنة المستشفيات' : 'Required'}
                        variant="accent"
                        size="sm"
                      />
                    </View>
                    <TextInput
                      style={[
                        styles.textInput,
                        fieldErrors.hospital_name ? styles.inputError : null,
                        {
                          backgroundColor: colors.bgPrimary,
                          borderColor: fieldErrors.hospital_name ? colors.danger : colors.cardBorder,
                          color: colors.textPrimary,
                          borderRadius: borderRadius.md,
                          textAlign: isAr ? 'right' : 'left',
                          marginTop: 6,
                        },
                      ]}
                      value={hospitalName}
                      onChangeText={(text) => {
                        setHospitalName(text);
                        if (fieldErrors.hospital_name) {
                          setFieldErrors((prev) => {
                            const n = { ...prev };
                            delete n.hospital_name;
                            return n;
                          });
                        }
                      }}
                      placeholder={
                        isAr
                          ? 'اكتب اسم المستشفى أو المؤسسة العلاجية...'
                          : 'Enter hospital or medical facility name...'
                      }
                      placeholderTextColor={colors.textMuted}
                    />
                    {fieldErrors.hospital_name ? (
                      <View style={[styles.errorRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                        <AlertCircle size={13} color={colors.danger} />
                        <AppText variant="caption" color={colors.danger} style={{ marginHorizontal: 4 }}>
                          {fieldErrors.hospital_name}
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {/* Conditional Field: Poster Location (Rendered Inline) */}
                {isPosterLocationRequired ? (
                  <View
                    style={[
                      styles.conditionalFieldContainer,
                      {
                        backgroundColor: isDark ? 'rgba(56, 189, 248, 0.08)' : '#f0f9ff',
                        borderColor: isDark ? '#0284c7' : '#bae6fd',
                      },
                    ]}
                  >
                    <View style={[styles.labelWithBadgeRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                      <View style={{ flexDirection: isAr ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                        <MapPin size={16} color={colors.primary} />
                        <AppText variant="label" color={colors.textPrimary} weight="700">
                          {isAr ? 'مكان الملصق / العنوان بالتفصيل' : 'Poster Location / Address'}
                        </AppText>
                      </View>
                      <Badge
                        label={isAr ? 'مطلوب للملصقات' : 'Required'}
                        variant="primary"
                        size="sm"
                      />
                    </View>
                    <TextInput
                      style={[
                        styles.textInput,
                        fieldErrors.poster_location ? styles.inputError : null,
                        {
                          backgroundColor: colors.bgPrimary,
                          borderColor: fieldErrors.poster_location ? colors.danger : colors.cardBorder,
                          color: colors.textPrimary,
                          borderRadius: borderRadius.md,
                          textAlign: isAr ? 'right' : 'left',
                          marginTop: 6,
                        },
                      ]}
                      value={posterLocation}
                      onChangeText={(text) => {
                        setPosterLocation(text);
                        if (fieldErrors.poster_location) {
                          setFieldErrors((prev) => {
                            const n = { ...prev };
                            delete n.poster_location;
                            return n;
                          });
                        }
                      }}
                      placeholder={
                        isAr
                          ? 'مثال: محطة مترو الشهداء، شارع التحرير، المركز الصحي...'
                          : 'e.g. Metro station, street, clinic...'
                      }
                      placeholderTextColor={colors.textMuted}
                    />
                    {fieldErrors.poster_location ? (
                      <View style={[styles.errorRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                        <AlertCircle size={13} color={colors.danger} />
                        <AppText variant="caption" color={colors.danger} style={{ marginHorizontal: 4 }}>
                          {fieldErrors.poster_location}
                        </AppText>
                      </View>
                    ) : null}
                  </View>
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

                {/* Call Brief (Dynamically Optional for 'عضو حالي', Required otherwise) */}
                <View style={[styles.labelWithBadgeRow, { flexDirection: isAr ? 'row-reverse' : 'row', marginTop: 14 }]}>
                  <AppText variant="label" color={colors.textSecondary}>
                    {isCallBriefOptional
                      ? (isAr ? 'ملخص المكالمة (اختياري لعضو حالي)' : 'Call Brief (Optional for current member)')
                      : (isAr ? 'ملخص المكالمة (مطلوب)' : 'Call Brief (Required)')}
                  </AppText>
                  {isCallBriefOptional ? (
                    <Badge
                      label={isAr ? 'اختياري' : 'Optional'}
                      variant="outline"
                      size="sm"
                    />
                  ) : (
                    <Badge
                      label={isAr ? 'مطلوب' : 'Required'}
                      variant="accent"
                      size="sm"
                    />
                  )}
                </View>
                <TextInput
                  style={[
                    styles.textArea,
                    fieldErrors.call_brief ? styles.inputError : null,
                    {
                      backgroundColor: colors.bgPrimary,
                      borderColor: fieldErrors.call_brief ? colors.danger : colors.cardBorder,
                      color: colors.textPrimary,
                      borderRadius: borderRadius.md,
                      textAlign: isAr ? 'right' : 'left',
                    },
                  ]}
                  value={callBrief}
                  onChangeText={(text) => {
                    setCallBrief(text);
                    if (fieldErrors.call_brief) {
                      setFieldErrors((prev) => {
                        const n = { ...prev };
                        delete n.call_brief;
                        return n;
                      });
                    }
                  }}
                  placeholder={
                    isCallBriefOptional
                      ? (isAr
                          ? 'اختياري: يمكنك كتابة أي استفسار أو ملخص إذا تطلب الأمر...'
                          : 'Optional: You may enter any notes or inquiry details...')
                      : (isAr
                          ? 'اكتب ملخصاً موجزاً عما دار في المكالمة وما تم توجيه المتصل إليه...'
                          : 'Summarize the call discussion and guidance provided...')
                  }
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                {fieldErrors.call_brief ? (
                  <View style={[styles.errorRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                    <AlertCircle size={13} color={colors.danger} />
                    <AppText variant="caption" color={colors.danger} style={{ marginHorizontal: 4 }}>
                      {fieldErrors.call_brief}
                    </AppText>
                  </View>
                ) : null}

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
  labelWithBadgeRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  conditionalFieldContainer: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputError: {
    borderWidth: 1.5,
  },
  errorRow: {
    alignItems: 'center',
    marginTop: 4,
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
