import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import { INVENTORY_SECTIONS, CLOSING_PRAYER, INVENTORY_INTRO } from '../data/dailyInventoryQuestions';

export interface AnswerItem {
  valueBool?: boolean | null;
  valueText?: string;
  followUpText?: string;
}

export interface DailyInventoryEntry {
  id: string; // YYYY-MM-DD
  date: string; // YYYY-MM-DD
  createdAt: number;
  updatedAt: number;
  isCompleted: boolean;
  answers: Record<string, AnswerItem>;
  notes: string;
}

const INVENTORY_DIR = `${FileSystem.documentDirectory || ''}na_daily_inventory/`;
const PIN_SECURE_KEY = 'na_daily_inventory_pin_code';
const PIN_ENABLED_KEY = 'na_daily_inventory_pin_enabled';

class DailyInventoryService {
  private isDirInitialized = false;

  private async ensureDirectoryExists(): Promise<void> {
    if (this.isDirInitialized || !FileSystem.documentDirectory) return;
    try {
      const dirInfo = await FileSystem.getInfoAsync(INVENTORY_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(INVENTORY_DIR, { intermediates: true });
      }
      this.isDirInitialized = true;
    } catch (e) {
      console.warn('Could not initialize inventory directory:', e);
    }
  }

  private getFilePath(dateStr: string): string {
    return `${INVENTORY_DIR}entry_${dateStr}.json`;
  }

  public getTodayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  public async getEntry(dateStr: string): Promise<DailyInventoryEntry | null> {
    await this.ensureDirectoryExists();
    const path = this.getFilePath(dateStr);

    try {
      if (FileSystem.documentDirectory) {
        const fileInfo = await FileSystem.getInfoAsync(path);
        if (fileInfo.exists) {
          const content = await FileSystem.readAsStringAsync(path);
          return JSON.parse(content) as DailyInventoryEntry;
        }
      }
      // Fallback to SecureStore for web or if file is missing
      const backupRaw = await SecureStore.getItemAsync(`inventory_${dateStr}`);
      if (backupRaw) {
        return JSON.parse(backupRaw) as DailyInventoryEntry;
      }
    } catch (e) {
      console.warn(`Failed to read inventory entry for ${dateStr}:`, e);
    }
    return null;
  }

  public async saveEntry(entry: DailyInventoryEntry): Promise<void> {
    await this.ensureDirectoryExists();
    const path = this.getFilePath(entry.date);
    const serialized = JSON.stringify(entry);

    try {
      if (FileSystem.documentDirectory) {
        await FileSystem.writeAsStringAsync(path, serialized);
      }
      // Keep a key in SecureStore as well for resilience
      await SecureStore.setItemAsync(`inventory_${entry.date}`, serialized);
    } catch (e) {
      console.error(`Failed to save inventory entry for ${entry.date}:`, e);
      throw e;
    }
  }

  public async deleteEntry(dateStr: string): Promise<void> {
    await this.ensureDirectoryExists();
    const path = this.getFilePath(dateStr);

    try {
      if (FileSystem.documentDirectory) {
        await FileSystem.deleteAsync(path, { idempotent: true });
      }
      await SecureStore.deleteItemAsync(`inventory_${dateStr}`);
    } catch (e) {
      console.warn(`Failed to delete inventory entry for ${dateStr}:`, e);
    }
  }

  public async getAllEntries(): Promise<DailyInventoryEntry[]> {
    await this.ensureDirectoryExists();
    const entries: DailyInventoryEntry[] = [];

    try {
      if (FileSystem.documentDirectory) {
        const files = await FileSystem.readDirectoryAsync(INVENTORY_DIR);
        for (const file of files) {
          if (file.startsWith('entry_') && file.endsWith('.json')) {
            try {
              const content = await FileSystem.readAsStringAsync(`${INVENTORY_DIR}${file}`);
              const parsed = JSON.parse(content) as DailyInventoryEntry;
              entries.push(parsed);
            } catch (err) {
              console.warn(`Error reading file ${file}:`, err);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error reading directory entries:', e);
    }

    // Sort descending by date (most recent first)
    entries.sort((a, b) => (b.date > a.date ? 1 : -1));
    return entries;
  }

  // --- PIN / Privacy Security ---

  public async isPinConfigured(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(PIN_ENABLED_KEY);
      const pin = await SecureStore.getItemAsync(PIN_SECURE_KEY);
      return enabled === 'true' && !!pin;
    } catch {
      return false;
    }
  }

  public async setPin(pin: string): Promise<void> {
    await SecureStore.setItemAsync(PIN_SECURE_KEY, pin);
    await SecureStore.setItemAsync(PIN_ENABLED_KEY, 'true');
  }

  public async verifyPin(inputPin: string): Promise<boolean> {
    try {
      const stored = await SecureStore.getItemAsync(PIN_SECURE_KEY);
      return stored === inputPin;
    } catch {
      return false;
    }
  }

  public async removePin(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(PIN_SECURE_KEY);
      await SecureStore.deleteItemAsync(PIN_ENABLED_KEY);
    } catch (e) {
      console.warn('Error deleting pin:', e);
    }
  }

  // --- Sharing & Formatting ---

  public generateShareText(entry: DailyInventoryEntry, lang: 'ar' | 'en' = 'ar'): string {
    const isAr = lang === 'ar';
    const lines: string[] = [];

    lines.push(isAr ? '═══════════════════════════════' : '═══════════════════════════════');
    lines.push(isAr ? '📖 معايشة البرنامج - جرد اليوم العاشر' : '📖 Living the Program - 10th Step Inventory');
    lines.push(isAr ? `📅 التاريخ: ${entry.date}` : `📅 Date: ${entry.date}`);
    lines.push(isAr ? '═══════════════════════════════' : '═══════════════════════════════');
    lines.push('');
    lines.push(
      isAr
        ? `⚠️ تذكير زمالة NA: "${CLOSING_PRAYER.verbalSharingReminderAr}"`
        : `⚠️ NA Reminder: "${CLOSING_PRAYER.verbalSharingReminderEn}"`
    );
    lines.push('');

    INVENTORY_SECTIONS.forEach((section) => {
      lines.push(isAr ? `【 ${section.headerAr} 】` : `【 ${section.headerEn} 】`);

      section.questions.forEach((q) => {
        const ans = entry.answers[q.id];
        const qTitle = isAr ? q.questionAr : q.questionEn;

        if (q.type === 'boolean') {
          const valStr =
            ans?.valueBool === true
              ? isAr
                ? 'نعم ✅'
                : 'Yes ✅'
              : ans?.valueBool === false
              ? isAr
                ? 'لا ❌'
                : 'No ❌'
              : isAr
              ? 'لم يُجب'
              : 'Unanswered';
          lines.push(`• ${qTitle}: ${valStr}`);
        } else if (q.type === 'text') {
          lines.push(`• ${qTitle}`);
          lines.push(`  ↳ ${ans?.valueText?.trim() || (isAr ? '(لا يوجد)' : '(None)')}`);
        } else if (q.type === 'boolean_with_followup') {
          const valStr =
            ans?.valueBool === true
              ? isAr
                ? 'نعم ✅'
                : 'Yes ✅'
              : ans?.valueBool === false
              ? isAr
                ? 'لا ❌'
                : 'No ❌'
              : isAr
              ? 'لم يُجب'
              : 'Unanswered';
          lines.push(`• ${qTitle}: ${valStr}`);
          if (ans?.followUpText && ans.followUpText.trim().length > 0) {
            const fTitle = isAr ? q.followUpAr : q.followUpEn;
            lines.push(`  ↳ ${fTitle}: ${ans.followUpText.trim()}`);
          }
        }
      });
      lines.push('');
    });

    if (entry.notes && entry.notes.trim().length > 0) {
      lines.push(isAr ? '📝 ملاحظات:' : '📝 Notes:');
      lines.push(entry.notes.trim());
      lines.push('');
    }

    lines.push(isAr ? '🙏 صلاة الختام:' : '🙏 Closing Prayer:');
    lines.push(isAr ? CLOSING_PRAYER.prayerAr : CLOSING_PRAYER.prayerEn);
    lines.push('');
    lines.push(isAr ? 'زمالة المدمنين المجهولين NA' : 'Narcotics Anonymous (NA)');

    return lines.join('\n');
  }
}

export const dailyInventoryService = new DailyInventoryService();
