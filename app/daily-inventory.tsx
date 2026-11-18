import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Share,
  Alert,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  Lock,
  Unlock,
  History,
  Share2,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Info,
  Sparkles,
  BookOpen,
  Heart,
  X,
  FileText,
  ShieldCheck,
} from 'lucide-react-native';
import { AppText, Badge, AppButton } from '../src/components/ui';
import { useAppTheme } from '../src/theme';
import { haptic } from '../src/utils/haptics';
import {
  INVENTORY_SECTIONS,
  INVENTORY_INTRO,
  CLOSING_PRAYER,
} from '../src/data/dailyInventoryQuestions';
import {
  dailyInventoryService,
  DailyInventoryEntry,
} from '../src/services/dailyInventoryService';

export default function DailyInventoryScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, shadows, isDark } = useAppTheme();

  const todayStr = dailyInventoryService.getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [currentStep, setCurrentStep] = useState<number>(1); // 1-5: Sections, 6: Closing Prayer & Notes
  const [entry, setEntry] = useState<DailyInventoryEntry>({
    id: todayStr,
    date: todayStr,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isCompleted: false,
    answers: {},
    notes: '',
  });

  // Security / PIN lock states
  const [isPinConfigured, setIsPinConfigured] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(true);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // Modals
  const [isPinSettingsVisible, setIsPinSettingsVisible] = useState<boolean>(false);
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [isHistoryVisible, setIsHistoryVisible] = useState<boolean>(false);
  const [allEntries, setAllEntries] = useState<DailyInventoryEntry[]>([]);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initial load
  useEffect(() => {
    checkSecurityAndLoad(selectedDate);
  }, []);

  const checkSecurityAndLoad = async (dateStr: string) => {
    const hasPin = await dailyInventoryService.isPinConfigured();
    setIsPinConfigured(hasPin);
    if (hasPin) {
      setIsUnlocked(false);
    } else {
      setIsUnlocked(true);
    }
    await loadEntryForDate(dateStr);
  };

  const loadEntryForDate = async (dateStr: string) => {
    const existing = await dailyInventoryService.getEntry(dateStr);
    if (existing) {
      setEntry(existing);
    } else {
      setEntry({
        id: dateStr,
        date: dateStr,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isCompleted: false,
        answers: {},
        notes: '',
      });
    }
  };

  const loadAllEntries = async () => {
    const list = await dailyInventoryService.getAllEntries();
    setAllEntries(list);
  };

  // Debounced auto-save
  const triggerAutoSave = useCallback((updatedEntry: DailyInventoryEntry) => {
    setSaveStatus(isAr ? 'جاري الحفظ...' : 'Saving...');
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await dailyInventoryService.saveEntry(updatedEntry);
        setSaveStatus(isAr ? 'تم الحفظ محلياً ✅' : 'Saved locally ✅');
        setTimeout(() => setSaveStatus(''), 2500);
      } catch (e) {
        setSaveStatus(isAr ? 'تعذر الحفظ' : 'Save failed');
      }
    }, 400);
  }, [isAr]);

  // Answer handlers
  const handleBoolChange = (questionId: string, val: boolean) => {
    haptic.selection();
    setEntry((prev) => {
      const existing = prev.answers[questionId] || {};
      const nextAnswers = {
        ...prev.answers,
        [questionId]: {
          ...existing,
          valueBool: existing.valueBool === val ? null : val,
        },
      };
      const updated = {
        ...prev,
        updatedAt: Date.now(),
        answers: nextAnswers,
      };
      triggerAutoSave(updated);
      return updated;
    });
  };

  const handleTextChange = (questionId: string, text: string) => {
    setEntry((prev) => {
      const existing = prev.answers[questionId] || {};
      const nextAnswers = {
        ...prev.answers,
        [questionId]: {
          ...existing,
          valueText: text,
        },
      };
      const updated = {
        ...prev,
        updatedAt: Date.now(),
        answers: nextAnswers,
      };
      triggerAutoSave(updated);
      return updated;
    });
  };

  const handleFollowUpTextChange = (questionId: string, text: string) => {
    setEntry((prev) => {
      const existing = prev.answers[questionId] || {};
      const nextAnswers = {
        ...prev.answers,
        [questionId]: {
          ...existing,
          followUpText: text,
        },
      };
      const updated = {
        ...prev,
        updatedAt: Date.now(),
        answers: nextAnswers,
      };
      triggerAutoSave(updated);
      return updated;
    });
  };

  const handleNotesChange = (text: string) => {
    setEntry((prev) => {
      const updated = {
        ...prev,
        notes: text,
        updatedAt: Date.now(),
      };
      triggerAutoSave(updated);
      return updated;
    });
  };

  // Complete and save
  const handleCompleteInventory = async () => {
    haptic.success();
    const updated: DailyInventoryEntry = {
      ...entry,
      isCompleted: true,
      updatedAt: Date.now(),
    };
    setEntry(updated);
    await dailyInventoryService.saveEntry(updated);
    Alert.alert(
      isAr ? 'تم حفظ الجرد بنجاح' : 'Inventory Completed',
      isAr
        ? 'تم حفظ جرد اليوم العاشر بنجاح على جهازك بسرية تامة. واصل الحضور فالبرنامج يعمل!'
        : 'Your 10th Step inventory has been saved securely on your device. Keep coming back!',
      [{ text: isAr ? 'حسناً' : 'OK' }]
    );
  };

  // Share
  const handleShare = async () => {
    haptic.medium();
    const shareText = dailyInventoryService.generateShareText(entry, isAr ? 'ar' : 'en');
    try {
      await Share.share({
        message: shareText,
        title: isAr ? 'معايشة البرنامج - جرد اليوم العاشر' : 'Living the Program - Daily Inventory',
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  // PIN Unlock Check
  const handlePinUnlock = async () => {
    const valid = await dailyInventoryService.verifyPin(enteredPin);
    if (valid) {
      haptic.success();
      setIsUnlocked(true);
      setPinError('');
      setEnteredPin('');
    } else {
      haptic.error();
      setPinError(t('daily_inventory.pin_wrong'));
    }
  };

  // Set / Remove PIN
  const handleSavePin = async () => {
    if (newPinInput.length < 4) {
      Alert.alert(isAr ? 'تنبيه' : 'Alert', isAr ? 'يجب أن يتكون الرمز من 4 أرقام على الأقل' : 'PIN must be at least 4 digits');
      return;
    }
    if (newPinInput !== confirmPinInput) {
      Alert.alert(isAr ? 'خطأ' : 'Error', isAr ? 'الرمزان غير متطابقين' : 'PINs do not match');
      return;
    }
    await dailyInventoryService.setPin(newPinInput);
    setIsPinConfigured(true);
    setIsPinSettingsVisible(false);
    setNewPinInput('');
    setConfirmPinInput('');
    haptic.success();
    Alert.alert(isAr ? 'تم التفعيل' : 'Success', t('daily_inventory.pin_set_success'));
  };

  const handleRemovePin = async () => {
    Alert.alert(
      isAr ? 'إلغاء قفل PIN' : 'Remove PIN',
      isAr ? 'هل تريد بالتأكيد إلغاء حماية الجرد برمز PIN؟' : 'Are you sure you want to remove the PIN lock?',
      [
        { text: isAr ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isAr ? 'إلغاء القفل' : 'Remove',
          style: 'destructive',
          onPress: async () => {
            await dailyInventoryService.removePin();
            setIsPinConfigured(false);
            setIsUnlocked(true);
            setIsPinSettingsVisible(false);
            haptic.success();
          },
        },
      ]
    );
  };

  // Delete Entry
  const handleDeleteEntry = (dateStr: string) => {
    Alert.alert(
      t('daily_inventory.delete_entry'),
      t('daily_inventory.delete_confirm', { date: dateStr }),
      [
        { text: isAr ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isAr ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            await dailyInventoryService.deleteEntry(dateStr);
            haptic.selection();
            if (dateStr === selectedDate) {
              await loadEntryForDate(todayStr);
              setSelectedDate(todayStr);
            }
            await loadAllEntries();
          },
        },
      ]
    );
  };

  // Switch to past date from history
  const handleSelectHistoryEntry = async (item: DailyInventoryEntry) => {
    setSelectedDate(item.date);
    setEntry(item);
    setCurrentStep(1);
    setIsHistoryVisible(false);
    haptic.selection();
  };

  // Count answered questions in entry
  const getAnsweredCount = (item: DailyInventoryEntry): number => {
    let count = 0;
    Object.values(item.answers).forEach((a) => {
      if (a.valueBool !== null && a.valueBool !== undefined) count++;
      else if (a.valueText && a.valueText.trim().length > 0) count++;
    });
    return count;
  };

  // PIN Unlock Screen if locked
  if (isPinConfigured && !isUnlocked) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.pinLockContainer}
        >
          <View style={[styles.pinLockCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={[styles.pinIconCircle, { backgroundColor: colors.primaryLight + '20' }]}>
              <Lock size={36} color={colors.primary} />
            </View>
            <AppText variant="h2" style={[styles.pinTitle, { color: colors.textPrimary }]}>
              {t('daily_inventory.pin_enter_title')}
            </AppText>
            <AppText variant="bodySmall" style={[styles.pinSubtitle, { color: colors.textSecondary }]}>
              {t('daily_inventory.pin_enter_desc')}
            </AppText>

            <TextInput
              style={[
                styles.pinInput,
                {
                  backgroundColor: colors.bgSecondary,
                  borderColor: pinError ? colors.danger : colors.border,
                  color: colors.textPrimary,
                },
              ]}
              value={enteredPin}
              onChangeText={(txt) => {
                setEnteredPin(txt);
                setPinError('');
              }}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={8}
              placeholder="••••"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />

            {pinError ? (
              <AppText variant="caption" style={[styles.pinErrorText, { color: colors.danger }]}>
                {pinError}
              </AppText>
            ) : null}

            <AppButton
              title={isAr ? 'فتح الجرد' : 'Unlock'}
              onPress={handlePinUnlock}
              style={{ marginTop: 18, width: '100%' }}
            />

            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginTop: 16, padding: 8 }}
            >
              <AppText variant="bodySmall" style={{ color: colors.textMuted }}>
                {isAr ? 'العودة للخلف' : 'Go Back'}
              </AppText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Active Section for current step (Steps 1 to 5)
  const activeSection = INVENTORY_SECTIONS.find((s) => s.id === currentStep);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerIconButton}
          accessibilityLabel="Back"
        >
          {isAr ? <ChevronRight size={24} color={colors.textPrimary} /> : <ChevronLeft size={24} color={colors.textPrimary} />}
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <AppText variant="h3" style={{ color: colors.textPrimary, textAlign: 'center' }}>
            {INVENTORY_INTRO.titleAr}
          </AppText>
          <AppText variant="caption" style={{ color: colors.textSecondary, textAlign: 'center' }}>
            {selectedDate === todayStr ? (isAr ? 'جرد اليوم • ' + selectedDate : `Today • ${selectedDate}`) : selectedDate}
          </AppText>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            onPress={() => {
              loadAllEntries();
              setIsHistoryVisible(true);
            }}
            style={styles.headerIconButton}
            accessibilityLabel="History"
          >
            <History size={20} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsPinSettingsVisible(true)}
            style={styles.headerIconButton}
            accessibilityLabel="PIN Security"
          >
            {isPinConfigured ? (
              <Lock size={20} color={colors.accent} />
            ) : (
              <Unlock size={20} color={colors.textMuted} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            style={styles.headerIconButton}
            accessibilityLabel="Share"
          >
            <Share2 size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress & Stepper Bar */}
      <View style={[styles.stepperContainer, { backgroundColor: colors.cardBg }]}>
        <View style={styles.stepsIndicatorRow}>
          {[1, 2, 3, 4, 5, 6].map((s) => {
            const isCurrent = s === currentStep;
            const isPassed = s < currentStep;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => {
                  haptic.selection();
                  setCurrentStep(s);
                }}
                style={[
                  styles.stepBubble,
                  {
                    backgroundColor: isCurrent
                      ? colors.primary
                      : isPassed
                      ? colors.primaryLight + '50'
                      : colors.bgSecondary,
                    borderColor: isCurrent ? colors.primary : colors.border,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  style={{
                    color: isCurrent ? '#ffffff' : colors.textPrimary,
                    fontWeight: isCurrent ? '700' : '500',
                  }}
                >
                  {s === 6 ? (isAr ? 'ختام' : 'End') : s}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.stepTitleRow}>
          <Badge
            label={t('daily_inventory.step_counter', { current: currentStep, total: 6 })}
            variant="primary"
            size="sm"
          />
          {saveStatus ? (
            <AppText variant="caption" style={{ color: colors.accent, fontWeight: '600' }}>
              {saveStatus}
            </AppText>
          ) : (
            <AppText variant="caption" style={{ color: colors.textMuted }}>
              {t('daily_inventory.auto_saved')}
            </AppText>
          )}
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Collapsible NA Literature Notice / Intro */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowInstructions(!showInstructions)}
          style={[
            styles.introCard,
            { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc', borderColor: colors.border },
          ]}
        >
          <View style={styles.introHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
              <BookOpen size={18} color={colors.primary} />
              <AppText variant="h4" style={{ color: colors.primary, fontWeight: '700' }}>
                {isAr ? INVENTORY_INTRO.subTitleAr : INVENTORY_INTRO.subTitleEn}
              </AppText>
            </View>
            <Badge
              label={isAr ? 'IP No 9-AR' : 'IP No 9'}
              variant="neutral"
              size="sm"
            />
          </View>

          <AppText variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
            {isAr ? INVENTORY_INTRO.purposeAr : INVENTORY_INTRO.purposeEn}
          </AppText>

          {showInstructions && (
            <View style={styles.instructionsContainer}>
              {(isAr ? INVENTORY_INTRO.instructionsAr : INVENTORY_INTRO.instructionsEn).map((item, idx) => (
                <View key={idx} style={styles.instructionBulletRow}>
                  <Sparkles size={14} color={colors.accent} style={{ marginTop: 3 }} />
                  <AppText variant="bodySmall" style={{ color: colors.textPrimary, flex: 1, lineHeight: 21 }}>
                    {item}
                  </AppText>
                </View>
              ))}
            </View>
          )}

          <AppText variant="caption" style={{ color: colors.primary, marginTop: 8, fontWeight: '600' }}>
            {showInstructions
              ? isAr ? '▲ إخفاء إرشادات النشرة' : '▲ Hide guidelines'
              : isAr ? '▼ قراءة إرشادات وتوجيهات النشرة' : '▼ Read literature guidelines'}
          </AppText>
        </TouchableOpacity>

        {/* Sections 1 to 5 */}
        {currentStep <= 5 && activeSection && (
          <View>
            {/* Section Affirmation Box verbatim from pamphlet */}
            <View
              style={[
                styles.affirmationCard,
                { backgroundColor: colors.primary + '12', borderColor: colors.primary + '40' },
              ]}
            >
              <Heart size={20} color={colors.primary} style={{ marginTop: 2 }} />
              <AppText variant="h3" style={[styles.affirmationText, { color: colors.primary }]}>
                {isAr ? activeSection.headerAr : activeSection.headerEn}
              </AppText>
            </View>

            {/* Questions List */}
            {activeSection.questions.map((q) => {
              const ans = entry.answers[q.id] || {};
              return (
                <View
                  key={q.id}
                  style={[
                    styles.questionCard,
                    { backgroundColor: colors.cardBg, borderColor: colors.border },
                  ]}
                >
                  <AppText variant="h4" style={[styles.questionTitle, { color: colors.textPrimary }]}>
                    {isAr ? q.questionAr : q.questionEn}
                  </AppText>

                  {/* Boolean toggle chips */}
                  {(q.type === 'boolean' || q.type === 'boolean_with_followup') && (
                    <View style={styles.booleanButtonsRow}>
                      <TouchableOpacity
                        onPress={() => handleBoolChange(q.id, true)}
                        style={[
                          styles.boolButton,
                          ans.valueBool === true
                            ? { backgroundColor: colors.accent, borderColor: colors.accent }
                            : { backgroundColor: colors.bgSecondary, borderColor: colors.border },
                        ]}
                      >
                        <CheckCircle2
                          size={16}
                          color={ans.valueBool === true ? '#ffffff' : colors.textMuted}
                        />
                        <AppText
                          variant="bodySmall"
                          style={{
                            color: ans.valueBool === true ? '#ffffff' : colors.textPrimary,
                            fontWeight: ans.valueBool === true ? '700' : '500',
                          }}
                        >
                          {t('daily_inventory.yes')}
                        </AppText>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleBoolChange(q.id, false)}
                        style={[
                          styles.boolButton,
                          ans.valueBool === false
                            ? { backgroundColor: colors.danger, borderColor: colors.danger }
                            : { backgroundColor: colors.bgSecondary, borderColor: colors.border },
                        ]}
                      >
                        <X
                          size={16}
                          color={ans.valueBool === false ? '#ffffff' : colors.textMuted}
                        />
                        <AppText
                          variant="bodySmall"
                          style={{
                            color: ans.valueBool === false ? '#ffffff' : colors.textPrimary,
                            fontWeight: ans.valueBool === false ? '700' : '500',
                          }}
                        >
                          {t('daily_inventory.no')}
                        </AppText>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Follow-up conditional text field */}
                  {q.type === 'boolean_with_followup' && ans.valueBool === true && (
                    <View style={styles.followUpContainer}>
                      <AppText variant="caption" style={[styles.followUpLabel, { color: colors.textSecondary }]}>
                        {isAr ? q.followUpAr : q.followUpEn}
                      </AppText>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: colors.bgSecondary,
                            borderColor: colors.border,
                            color: colors.textPrimary,
                          },
                        ]}
                        multiline
                        numberOfLines={3}
                        placeholder={isAr ? q.placeholderAr : q.placeholderEn}
                        placeholderTextColor={colors.textMuted}
                        value={ans.followUpText || ''}
                        onChangeText={(txt) => handleFollowUpTextChange(q.id, txt)}
                      />
                    </View>
                  )}

                  {/* Pure text question */}
                  {q.type === 'text' && (
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: colors.bgSecondary,
                          borderColor: colors.border,
                          color: colors.textPrimary,
                        },
                      ]}
                      multiline
                      numberOfLines={3}
                      placeholder={isAr ? q.placeholderAr : q.placeholderEn}
                      placeholderTextColor={colors.textMuted}
                      value={ans.valueText || ''}
                      onChangeText={(txt) => handleTextChange(q.id, txt)}
                    />
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Step 6: Closing Prayer, Notes & Review */}
        {currentStep === 6 && (
          <View>
            {/* Closing Prayer Box verbatim from IP No 9 */}
            <View
              style={[
                styles.prayerCard,
                { backgroundColor: colors.cardBg, borderColor: colors.primaryLight + '50' },
              ]}
            >
              <Sparkles size={24} color={colors.accent} style={{ alignSelf: 'center', marginBottom: 10 }} />
              <AppText variant="h3" style={[styles.prayerTitle, { color: colors.primary }]}>
                {isAr ? 'صلاة الختام' : 'Closing Prayer'}
              </AppText>
              <AppText variant="bodyLarge" style={[styles.prayerBody, { color: colors.textPrimary }]}>
                "{isAr ? CLOSING_PRAYER.prayerAr : CLOSING_PRAYER.prayerEn}"
              </AppText>
            </View>

            {/* Notes Section verbatim from IP No 9 */}
            <View
              style={[
                styles.questionCard,
                { backgroundColor: colors.cardBg, borderColor: colors.border, marginTop: 16 },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <FileText size={18} color={colors.primary} />
                <AppText variant="h4" style={{ color: colors.textPrimary, fontWeight: '700' }}>
                  {isAr ? CLOSING_PRAYER.notesHeaderAr : CLOSING_PRAYER.notesHeaderEn}
                </AppText>
              </View>
              <TextInput
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: colors.bgSecondary,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                multiline
                numberOfLines={6}
                placeholder={t('daily_inventory.notes_placeholder')}
                placeholderTextColor={colors.textMuted}
                value={entry.notes}
                onChangeText={handleNotesChange}
              />
            </View>

            {/* Literature Verbal Sharing Reminder */}
            <View
              style={[
                styles.reminderCard,
                { backgroundColor: colors.accent + '15', borderColor: colors.accent + '40' },
              ]}
            >
              <Info size={18} color={colors.accent} />
              <AppText variant="bodySmall" style={{ color: colors.textPrimary, flex: 1, lineHeight: 20 }}>
                {t('daily_inventory.verbal_reminder')}
              </AppText>
            </View>

            {/* Complete & Share Actions */}
            <View style={{ marginTop: 24, gap: 12 }}>
              <AppButton
                title={t('daily_inventory.finish')}
                variant="primary"
                onPress={handleCompleteInventory}
              />
              <AppButton
                title={t('daily_inventory.share_button')}
                variant="outline"
                onPress={handleShare}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation Toolbar */}
      <View
        style={[
          styles.bottomToolbar,
          {
            backgroundColor: colors.cardBg,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          },
        ]}
      >
        <AppButton
          title={t('daily_inventory.previous')}
          variant="ghost"
          disabled={currentStep === 1}
          onPress={() => {
            haptic.selection();
            setCurrentStep((prev) => Math.max(1, prev - 1));
          }}
          style={{ flex: 1 }}
        />

        {currentStep < 6 ? (
          <AppButton
            title={t('daily_inventory.next')}
            variant="primary"
            onPress={() => {
              haptic.selection();
              setCurrentStep((prev) => Math.min(6, prev + 1));
            }}
            style={{ flex: 1.5 }}
          />
        ) : (
          <AppButton
            title={t('daily_inventory.finish')}
            variant="primary"
            onPress={handleCompleteInventory}
            style={{ flex: 1.5 }}
          />
        )}
      </View>

      {/* History Modal */}
      <Modal
        visible={isHistoryVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsHistoryVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.bgPrimary }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View>
              <AppText variant="h2" style={{ color: colors.textPrimary }}>
                {t('daily_inventory.history')}
              </AppText>
              <AppText variant="caption" style={{ color: colors.textSecondary }}>
                {t('daily_inventory.history_subtitle')}
              </AppText>
            </View>
            <TouchableOpacity onPress={() => setIsHistoryVisible(false)} style={styles.modalCloseBtn}>
              <X size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.historyList}>
            {allEntries.length === 0 ? (
              <View style={styles.emptyHistoryState}>
                <History size={48} color={colors.textMuted} />
                <AppText variant="body" style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 12 }}>
                  {t('daily_inventory.no_entries')}
                </AppText>
              </View>
            ) : (
              allEntries.map((item) => {
                const count = getAnsweredCount(item);
                const isItemToday = item.date === todayStr;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => handleSelectHistoryEntry(item)}
                    style={[
                      styles.historyCard,
                      {
                        backgroundColor: colors.cardBg,
                        borderColor: item.date === selectedDate ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.historyCardTop}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Calendar size={18} color={colors.primary} />
                        <AppText variant="h4" style={{ color: colors.textPrimary, fontWeight: '700' }}>
                          {item.date} {isItemToday ? (isAr ? '(اليوم)' : '(Today)') : ''}
                        </AppText>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {item.isCompleted ? (
                          <Badge label={isAr ? 'مكتمل' : 'Completed'} variant="success" size="sm" />
                        ) : (
                          <Badge label={isAr ? 'مسودة' : 'Draft'} variant="warning" size="sm" />
                        )}
                        <TouchableOpacity
                          onPress={() => handleDeleteEntry(item.date)}
                          style={{ padding: 4 }}
                        >
                          <Trash2 size={16} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <AppText variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 6 }}>
                      {isAr ? `تمت الإجابة على ${count} سؤال` : `${count} questions answered`}
                    </AppText>

                    {item.notes ? (
                      <AppText
                        variant="caption"
                        numberOfLines={2}
                        style={{ color: colors.textMuted, marginTop: 4 }}
                      >
                        {item.notes}
                      </AppText>
                    ) : null}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* PIN Lock Settings Modal */}
      <Modal
        visible={isPinSettingsVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setIsPinSettingsVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.pinSettingsDialog, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={22} color={colors.primary} />
                <AppText variant="h3" style={{ color: colors.textPrimary }}>
                  {t('daily_inventory.pin_lock_title')}
                </AppText>
              </View>
              <TouchableOpacity onPress={() => setIsPinSettingsVisible(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <AppText variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 8 }}>
              {t('daily_inventory.pin_lock_desc')}
            </AppText>

            <View style={{ marginTop: 16 }}>
              <AppText variant="caption" style={{ color: colors.textSecondary, marginBottom: 4 }}>
                {isAr ? 'أدخل رمز PIN جديد (٤ أرقام فأكثر):' : 'Enter New PIN (4+ digits):'}
              </AppText>
              <TextInput
                style={[
                  styles.pinInput,
                  {
                    backgroundColor: colors.bgSecondary,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                value={newPinInput}
                onChangeText={setNewPinInput}
                secureTextEntry
                keyboardType="number-pad"
                maxLength={8}
                placeholder="••••"
                placeholderTextColor={colors.textMuted}
              />

              <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 12, marginBottom: 4 }}>
                {isAr ? 'تأكيد الرمز:' : 'Confirm PIN:'}</AppText>
              <TextInput
                style={[
                  styles.pinInput,
                  {
                    backgroundColor: colors.bgSecondary,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                value={confirmPinInput}
                onChangeText={setConfirmPinInput}
                secureTextEntry
                keyboardType="number-pad"
                maxLength={8}
                placeholder="••••"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={{ marginTop: 20, gap: 10 }}>
              <AppButton
                title={t('daily_inventory.pin_set_button')}
                variant="primary"
                onPress={handleSavePin}
              />
              {isPinConfigured && (
                <AppButton
                  title={t('daily_inventory.pin_remove_button')}
                  variant="outline"
                  onPress={handleRemovePin}
                />
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerIconButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepperContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  stepsIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  stepBubble: {
    flex: 1,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  scrollContent: {
    padding: 16,
  },
  introCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  introHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instructionsContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: 8,
  },
  instructionBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  affirmationCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  affirmationText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  questionCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  questionTitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  booleanButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  boolButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  followUpContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  followUpLabel: {
    marginBottom: 6,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 70,
  },
  prayerCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  prayerTitle: {
    marginBottom: 8,
    fontWeight: '700',
  },
  prayerBody: {
    textAlign: 'center',
    lineHeight: 28,
    fontStyle: 'italic',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  bottomToolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalCloseBtn: {
    padding: 8,
  },
  historyList: {
    padding: 16,
    gap: 12,
  },
  emptyHistoryState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  historyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  historyCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  pinSettingsDialog: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  pinLockContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  pinLockCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  pinIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pinTitle: {
    marginBottom: 6,
  },
  pinSubtitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  pinInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 4,
    width: '100%',
  },
  pinErrorText: {
    marginTop: 8,
  },
});
