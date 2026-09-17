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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  X,
  FileText,
  Plus,
  Trash2,
  Calendar,
  User,
  Users,
  Building2,
  CheckCircle2,
  Send,
  DollarSign,
  HeartHandshake,
} from 'lucide-react-native';
import { agendasApi } from '../api/agendas';
import { Group, AgendaTopic, CreateGroupAgendaPayload } from '../api/types';
import { useAppTheme } from '../theme';
import { AppText, AppButton, Badge } from './ui';
import { haptic } from '../utils/haptics';

interface SubmitAgendaModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userGroup?: Group | null;
  availableGroups?: Group[];
  defaultSubmitterName?: string;
}

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const SubmitAgendaModal: React.FC<SubmitAgendaModalProps> = ({
  visible,
  onClose,
  onSuccess,
  userGroup,
  availableGroups = [],
  defaultSubmitterName = '',
}) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { colors, borderRadius, shadows, isDark } = useAppTheme();

  // Selected Group
  const [selectedGroupId, setSelectedGroupId] = useState<number>(userGroup?.id || 0);

  // Form State
  const [agendaDate, setAgendaDate] = useState<string>(getTodayString());
  const [submitterName, setSubmitterName] = useState<string>(defaultSubmitterName);
  const [servicePosition, setServicePosition] = useState<string>('GSR');
  const [altGsrName, setAltGsrName] = useState<string>('');
  const [altGsrPosition, setAltGsrPosition] = useState<string>('Alt. GSR');
  const [meetingsPerWeek, setMeetingsPerWeek] = useState<string>('1');
  const [newComers, setNewComers] = useState<string>('');
  const [nextBusinessMeeting, setNextBusinessMeeting] = useState<string>('');
  const [recoveryMeetingsChanges, setRecoveryMeetingsChanges] = useState<boolean>(false);
  const [recoveryAtmosphere, setRecoveryAtmosphere] = useState<string>('');
  const [openPositions, setOpenPositions] = useState<string>('');
  const [trustedServants, setTrustedServants] = useState<string>('');
  const [financialIssues, setFinancialIssues] = useState<string>('');
  const [otherTopics, setOtherTopics] = useState<AgendaTopic[]>([]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      if (userGroup?.id) {
        setSelectedGroupId(userGroup.id);
      } else if (availableGroups.length > 0 && !selectedGroupId) {
        setSelectedGroupId(availableGroups[0].id);
      }
      if (defaultSubmitterName && !submitterName) {
        setSubmitterName(defaultSubmitterName);
      }
    }
  }, [visible, userGroup, availableGroups, defaultSubmitterName]);

  const handleAddTopic = () => {
    haptic.selection();
    setOtherTopics([...otherTopics, { title: '', content: '' }]);
  };

  const handleRemoveTopic = (index: number) => {
    haptic.light();
    setOtherTopics(otherTopics.filter((_, i) => i !== index));
  };

  const handleUpdateTopic = (index: number, field: 'title' | 'content', value: string) => {
    const updated = [...otherTopics];
    updated[index][field] = value;
    setOtherTopics(updated);
  };

  const handleClose = () => {
    haptic.light();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedGroupId) {
      haptic.warning();
      Alert.alert(
        isAr ? 'تنبيه' : 'Notice',
        isAr ? 'يرجى تحديد المجموعة التابع لها جدول الأعمال.' : 'Please select the group.'
      );
      return;
    }

    if (!submitterName.trim()) {
      haptic.warning();
      Alert.alert(
        isAr ? 'تنبيه' : 'Notice',
        isAr ? 'يرجى إدخال اسم مقدم التقرير.' : 'Please enter the submitter name.'
      );
      return;
    }

    const payload: CreateGroupAgendaPayload = {
      group_id: Number(selectedGroupId),
      agenda_date: agendaDate.trim() || getTodayString(),
      service_position: servicePosition.trim() || 'GSR',
      submitter_name: submitterName.trim(),
      alt_gsr_name: altGsrName.trim() || undefined,
      alt_gsr_position: altGsrPosition.trim() || undefined,
      meetings_per_week: meetingsPerWeek ? Number(meetingsPerWeek) : undefined,
      new_comers: newComers ? Number(newComers) : undefined,
      next_business_meeting: nextBusinessMeeting.trim() || undefined,
      recovery_meetings_changes: recoveryMeetingsChanges,
      recovery_atmosphere: recoveryAtmosphere.trim() || undefined,
      open_positions: openPositions.trim() || undefined,
      trusted_servants: trustedServants.trim() || undefined,
      financial_issues: financialIssues.trim() || undefined,
      other_topics: otherTopics.filter((t) => t.title.trim() || t.content.trim()),
    };

    setIsSubmitting(true);
    haptic.selection();

    try {
      await agendasApi.createGroupAgenda(payload);
      haptic.success();
      Alert.alert(
        isAr ? 'تم تقديم الأجندة بنجاح' : 'Agenda Submitted Successfully',
        isAr
          ? 'تم تسجيل وتقديم أجندة المجموعة بنجاح في أرشيف الخدمة.'
          : 'The group agenda has been submitted to the service archives successfully.',
        [
          {
            text: isAr ? 'حسناً' : 'OK',
            onPress: () => {
              onSuccess();
              onClose();
            },
          },
        ]
      );
    } catch (err: any) {
      console.warn('Failed to submit group agenda:', err);
      haptic.warning();
      const msg =
        err?.response?.data?.message ||
        (isAr
          ? 'تعذر تقديم الأجندة حالياً. يرجى مراجعة البيانات والاتصال بالإنترنت.'
          : 'Failed to submit agenda. Please verify details and connection.');
      Alert.alert(isAr ? 'خطأ في التقديم' : 'Submission Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentGroup =
    userGroup ||
    availableGroups.find((g) => g.id === selectedGroupId) ||
    availableGroups[0];
  const groupDisplayName =
    (isAr ? currentGroup?.ar_name : currentGroup?.en_name) ||
    currentGroup?.ar_name ||
    currentGroup?.en_name ||
    (isAr ? 'مجموعة غير محددة' : 'Selected Group');

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top', 'bottom']}>
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
              <FileText size={18} color={colors.accentDark} />
            </View>
            <View style={{ marginHorizontal: 8 }}>
              <AppText variant="h3" color={colors.textPrimary} weight="800">
                {isAr ? 'تقديم أجندة جديدة' : 'Submit New Agenda'}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {groupDisplayName}
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

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Group Identification Card */}
            <View
              style={[
                styles.groupBanner,
                shadows.card,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                  borderRadius: borderRadius.lg,
                },
              ]}
            >
              <View style={[styles.groupBannerRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                <Building2 size={20} color={colors.primary} />
                <View style={{ marginHorizontal: 8, flex: 1 }}>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {isAr ? 'المجموعة المسجل بها الخادم' : 'Assigned Servant Group'}
                  </AppText>
                  <AppText variant="h4" color={colors.textPrimary} weight="700">
                    {groupDisplayName}
                  </AppText>
                </View>
                <Badge
                  label={isAr ? 'خادم معتمد' : 'GSR Verified'}
                  variant="success"
                  size="sm"
                />
              </View>
            </View>

            {/* Section 1: Submitter & Position */}
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
                <User size={16} color={colors.primary} />
                <AppText variant="h4" color={colors.textPrimary} weight="700" style={{ marginHorizontal: 6 }}>
                  {isAr ? 'بيانات مقدم الأجندة' : 'Submitter Details'}
                </AppText>
              </View>

              {/* Submitter Name */}
              <AppText variant="label" color={colors.textSecondary} style={styles.inputLabel}>
                {isAr ? 'اسم مقدم التقرير (مطلوب)' : 'Submitter Name (Required)'}
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
                value={submitterName}
                onChangeText={setSubmitterName}
                placeholder={isAr ? 'مثال: أحمد ع.' : 'e.g. Ahmed A.'}
                placeholderTextColor={colors.textMuted}
              />

              {/* Service Position */}
              <AppText variant="label" color={colors.textSecondary} style={styles.inputLabel}>
                {isAr ? 'الموقع الخدمي' : 'Service Position'}
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
                value={servicePosition}
                onChangeText={setServicePosition}
                placeholder="GSR"
                placeholderTextColor={colors.textMuted}
              />

              {/* Agenda Date */}
              <AppText variant="label" color={colors.textSecondary} style={styles.inputLabel}>
                {isAr ? 'تاريخ الأجندة (YYYY-MM-DD)' : 'Agenda Date (YYYY-MM-DD)'}
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
                value={agendaDate}
                onChangeText={setAgendaDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />

              {/* Alt GSR Name */}
              <AppText variant="label" color={colors.textSecondary} style={styles.inputLabel}>
                {isAr ? 'اسم نائب ممثل المجموعة (اختياري)' : 'Alt. GSR Name (Optional)'}
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
                value={altGsrName}
                onChangeText={setAltGsrName}
                placeholder={isAr ? 'اسم النائب إن وجد...' : 'Alt GSR name if available...'}
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Section 2: Meeting Activity */}
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
                <Users size={16} color={colors.accentDark} />
                <AppText variant="h4" color={colors.textPrimary} weight="700" style={{ marginHorizontal: 6 }}>
                  {isAr ? 'نشاط واجتماعات المجموعة' : 'Meeting Activity'}
                </AppText>
              </View>

              <View style={[styles.rowInputs, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                <View style={{ flex: 1 }}>
                  <AppText variant="label" color={colors.textSecondary} style={styles.inputLabel}>
                    {isAr ? 'الاجتماعات أسبوعياً' : 'Meetings/Week'}
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
                    value={meetingsPerWeek}
                    onChangeText={setMeetingsPerWeek}
                    keyboardType="numeric"
                    placeholder="1"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={{ flex: 1, marginStart: isAr ? 0 : 10, marginEnd: isAr ? 10 : 0 }}>
                  <AppText variant="label" color={colors.textSecondary} style={styles.inputLabel}>
                    {isAr ? 'متوسط الجدد' : 'Newcomers'}
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
                    value={newComers}
                    onChangeText={setNewComers}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              {/* Next Business Meeting */}
              <AppText variant="label" color={colors.textSecondary} style={styles.inputLabel}>
                {isAr ? 'موعد اجتماع العمل القادم' : 'Next Business Meeting'}
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
                value={nextBusinessMeeting}
                onChangeText={setNextBusinessMeeting}
                placeholder={isAr ? 'YYYY-MM-DD أو الموعد المحدد' : 'YYYY-MM-DD or Scheduled date'}
                placeholderTextColor={colors.textMuted}
              />

              {/* Recovery Meetings Changes Toggle */}
              <View style={[styles.toggleRow, { flexDirection: isAr ? 'row-reverse' : 'row', marginTop: 12 }]}>
                <View style={{ flex: 1 }}>
                  <AppText variant="body" color={colors.textPrimary} weight="700">
                    {isAr ? 'تغييرات في اجتماعات التعافي' : 'Changes in Recovery Meetings'}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {isAr ? 'هل طرأت تغييرات في المواعيد أو المكان؟' : 'Any format, time, or location updates?'}
                  </AppText>
                </View>
                <TouchableOpacity
                  style={[
                    styles.switchBtn,
                    {
                      backgroundColor: recoveryMeetingsChanges ? colors.accentDark : colors.bgPrimary,
                      borderColor: recoveryMeetingsChanges ? colors.accentDark : colors.cardBorder,
                      borderRadius: borderRadius.full,
                    },
                  ]}
                  onPress={() => {
                    haptic.selection();
                    setRecoveryMeetingsChanges(!recoveryMeetingsChanges);
                  }}
                >
                  <AppText
                    variant="caption"
                    weight="700"
                    color={recoveryMeetingsChanges ? '#ffffff' : colors.textSecondary}
                  >
                    {recoveryMeetingsChanges ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 3: Atmosphere, Positions & Finance */}
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
                <HeartHandshake size={16} color={colors.success} />
                <AppText variant="h4" color={colors.textPrimary} weight="700" style={{ marginHorizontal: 6 }}>
                  {isAr ? 'مناخ التعافي والخدمة والمالية' : 'Atmosphere, Servants & Finance'}
                </AppText>
              </View>

              {/* Recovery Atmosphere */}
              <AppText variant="label" color={colors.textSecondary} style={styles.inputLabel}>
                {isAr ? 'مناخ التعافي بالمجموعة' : 'Recovery Atmosphere'}
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
                value={recoveryAtmosphere}
                onChangeText={setRecoveryAtmosphere}
                placeholder={isAr ? 'وصف مناخ التعافي ومستوى المشاركات...' : 'Describe meeting atmosphere & unity...'}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Open Positions */}
              <AppText variant="label" color={colors.textSecondary} style={[styles.inputLabel, { marginTop: 12 }]}>
                {isAr ? 'المواقع الخدمية الشاغرة' : 'Open Service Positions'}
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
                value={openPositions}
                onChangeText={setOpenPositions}
                placeholder={isAr ? 'المواقع الشاغرة بالمجموعة...' : 'Vacant positions in group...'}
                placeholderTextColor={colors.textMuted}
              />

              {/* Trusted Servants */}
              <AppText variant="label" color={colors.textSecondary} style={[styles.inputLabel, { marginTop: 12 }]}>
                {isAr ? 'الخدام الموثوقون والانتخابات' : 'Trusted Servants & Elections'}
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
                value={trustedServants}
                onChangeText={setTrustedServants}
                placeholder={isAr ? 'الخدام الموثوقون وتكليفات الخدمة الأخيرة...' : 'Elected servants or updates...'}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />

              {/* Financial Issues */}
              <AppText variant="label" color={colors.textSecondary} style={[styles.inputLabel, { marginTop: 12 }]}>
                {isAr ? 'الأمور المالية والتبرعات' : 'Financial Issues & Contributions'}
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
                value={financialIssues}
                onChangeText={setFinancialIssues}
                placeholder={isAr ? 'الميزانية، احتياطي الحذر، التبرع للمنتدى...' : 'Treasury balance, prudent reserve...'}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            {/* Section 4: Other Topics */}
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
              <View style={[styles.sectionHeaderRow, { flexDirection: isAr ? 'row-reverse' : 'row', justifyContent: 'space-between' }]}>
                <View style={{ flexDirection: isAr ? 'row-reverse' : 'row', alignItems: 'center' }}>
                  <FileText size={16} color={colors.primary} />
                  <AppText variant="h4" color={colors.textPrimary} weight="700" style={{ marginHorizontal: 6 }}>
                    {isAr ? 'موضوعات أخرى' : 'Other Topics'}
                  </AppText>
                </View>

                <TouchableOpacity
                  style={[styles.addTopicBtn, { borderColor: colors.primary, borderRadius: borderRadius.sm }]}
                  onPress={handleAddTopic}
                >
                  <Plus size={14} color={colors.primary} />
                  <AppText variant="caption" color={colors.primary} weight="700" style={{ marginHorizontal: 4 }}>
                    {isAr ? 'إضافة موضوع' : 'Add Topic'}
                  </AppText>
                </TouchableOpacity>
              </View>

              {otherTopics.length === 0 ? (
                <AppText variant="caption" color={colors.textMuted} style={{ textAlign: isAr ? 'right' : 'left', marginVertical: 8 }}>
                  {isAr ? 'لا توجد موضوعات إضافية. يمكنك النقر على إضافة موضوع.' : 'No additional topics. Tap Add Topic to include more.'}
                </AppText>
              ) : (
                otherTopics.map((topic, index) => (
                  <View
                    key={index}
                    style={[
                      styles.topicCard,
                      {
                        backgroundColor: colors.bgPrimary,
                        borderColor: colors.cardBorder,
                        borderRadius: borderRadius.md,
                      },
                    ]}
                  >
                    <View style={[styles.topicHeader, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                      <AppText variant="label" color={colors.primary} weight="700">
                        {isAr ? `الموضوع ${index + 1}` : `Topic ${index + 1}`}
                      </AppText>
                      <TouchableOpacity onPress={() => handleRemoveTopic(index)}>
                        <Trash2 size={16} color={colors.danger} />
                      </TouchableOpacity>
                    </View>

                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: colors.cardBg,
                          borderColor: colors.cardBorder,
                          color: colors.textPrimary,
                          borderRadius: borderRadius.sm,
                          textAlign: isAr ? 'right' : 'left',
                          marginBottom: 8,
                        },
                      ]}
                      value={topic.title}
                      onChangeText={(val) => handleUpdateTopic(index, 'title', val)}
                      placeholder={isAr ? 'عنوان الموضوع...' : 'Topic title...'}
                      placeholderTextColor={colors.textMuted}
                    />

                    <TextInput
                      style={[
                        styles.textArea,
                        {
                          backgroundColor: colors.cardBg,
                          borderColor: colors.cardBorder,
                          color: colors.textPrimary,
                          borderRadius: borderRadius.sm,
                          textAlign: isAr ? 'right' : 'left',
                          minHeight: 60,
                        },
                      ]}
                      value={topic.content}
                      onChangeText={(val) => handleUpdateTopic(index, 'content', val)}
                      placeholder={isAr ? 'محتوى وتفاصيل الموضوع...' : 'Topic content & discussion...'}
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>
                ))
              )}
            </View>

            {/* Submit Button */}
            <AppButton
              title={isSubmitting ? (isAr ? 'جاري تقديم الأجندة...' : 'Submitting Agenda...') : (isAr ? 'تقديم أجندة جديدة' : 'Submit New Agenda')}
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              loading={isSubmitting}
              icon={<Send size={18} color="#ffffff" />}
              style={styles.submitBtn}
            />
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
  groupBanner: {
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  groupBannerRow: {
    alignItems: 'center',
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
  rowInputs: {
    alignItems: 'center',
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
  addTopicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  topicCard: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  topicHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  submitBtn: {
    marginTop: 8,
    marginBottom: 24,
  },
});
