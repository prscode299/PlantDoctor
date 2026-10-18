import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@/services/storage/database';
import { notificationService } from '@/services/notifications/notificationService';
import { aiService } from '@/services/ai/geminiService';
import { useTheme } from '@/context/ThemeContext';
import { Header } from '@/components/ui/Header';
import { toPersianDigits } from '@/utils/jalali';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();

  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [notifHour, setNotifHour] = useState(9);
  const [notifMinute, setNotifMinute] = useState(0);
  const [savingKey, setSavingKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const aiSettings = await db.getAiSettings();
      if (aiSettings.apiKey) {
        setApiKey(aiSettings.apiKey);
      }
      const time = await db.getNotificationTime();
      setNotifHour(Number(time.hour) || 9);
      setNotifMinute(Number(time.minute) || 0);
    }
    loadSettings();
  }, []);

  const handleSaveApiKey = async () => {
    setSavingKey(true);
    setTestResult(null);
    try {
      await db.saveAiSettings({
        apiKey: apiKey.trim(),
        provider: 'gemini',
        selectedModel: 'gemini-flash-latest',
      });
      Alert.alert('ذخیره شد ✨', 'کلید هوش مصنوعی با موفقیت در حافظه گوشی ذخیره شد.');
    } catch {
      Alert.alert('خطا', 'ذخیره کلید با مشکل مواجه شد.');
    } finally {
      setSavingKey(false);
    }
  };

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('توجه', 'لطفاً ابتدا کلید API را وارد کنید.');
      return;
    }
    setTestingKey(true);
    setTestResult(null);
    try {
      const res = await aiService.testConnection(apiKey.trim());
      setTestResult({ success: true, message: res.message });
      Alert.alert('اتصال موفق ✨', res.message);
    } catch (err: any) {
      const msg = err.message || 'خطا در برقراری ارتباط با گوگل';
      setTestResult({ success: false, message: msg });
      Alert.alert('خطای اتصال به هوش مصنوعی', msg);
    } finally {
      setTestingKey(false);
    }
  };

  const handleSaveNotifTime = async () => {
    try {
      await db.saveNotificationTime({ hour: notifHour, minute: notifMinute });
      const plants = await db.getPlants();
      await notificationService.syncAllPlantNotifications(plants);
      const hStr = String(notifHour).padStart(2, '0');
      const mStr = String(notifMinute).padStart(2, '0');
      Alert.alert(
        'تنظیم شد ⏰',
        `ساعت یادآوری روزانه روی ${toPersianDigits(hStr)}:${toPersianDigits(mStr)} تنظیم شد.`
      );
    } catch {
      Alert.alert('خطا', 'تنظیم ساعت اعلان با مشکل مواجه شد.');
    }
  };

  const changeHour = (delta: number) => {
    setNotifHour((prev) => (prev + delta + 24) % 24);
  };

  const changeMinute = (delta: number) => {
    setNotifMinute((prev) => (prev + delta + 60) % 60);
  };

  const handleSetQuickTime = (hour: number, minute: number) => {
    setNotifHour(hour);
    setNotifMinute(minute);
  };

  const handleTestNotification = async () => {
    try {
      await notificationService.sendTestNotification();
      Alert.alert('ارسال شد 🔔', 'یک اعلان تستی برای شما ارسال شد. لطفاً نوار اعلان بالای گوشی را بررسی کنید.');
    } catch (e: any) {
      Alert.alert('خطا در ارسال اعلان', e.message || 'لطفاً دسترسی اعلان را در تنظیمات گوشی فعال کنید.');
    }
  };

  const handleExportBackup = async () => {
    try {
      await db.exportBackup();
      Alert.alert(
        'پشتیبان‌گیری کامل 📦',
        'نسخه پشتیبان تمام گیاهان و لاگ‌ها آماده شد.'
      );
    } catch {
      Alert.alert('خطا', 'تهیه فایل پشتیبان ناموفق بود.');
    }
  };

  const hStr = String(notifHour).padStart(2, '0');
  const mStr = String(notifMinute).padStart(2, '0');

  // Friendly time period descriptor
  const getPeriodText = (h: number) => {
    if (h >= 5 && h < 11) return 'صبح';
    if (h >= 11 && h < 14) return 'ظهر';
    if (h >= 14 && h < 18) return 'بعدازظهر';
    if (h >= 18 && h < 22) return 'عصر و غروب';
    return 'شب و بامداد';
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <Header
        title="تنظیمات ⚙️"
        subtitle="هوش مصنوعی، یادآورها، تم و پشتیبان‌گیری"
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Dark Mode Theme Switcher Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? colors.primarySubtle : '#FEF3C7' }]}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={20}
                color={isDark ? colors.primary : '#D97706'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                {isDark ? 'حالت شب 🌙 (Dark Mode)' : 'حالت روز ☀️ (Light Mode)'}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                {isDark ? 'تم تاریک استاندارد و بدون آسیب به چشم در شب' : 'تم روز روشن، باطراوت و سرسبز'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D1D5DB', true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Gemini API Key Section */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primarySubtle }]}>
              <Ionicons name="sparkles" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>اتصال به هوش مصنوعی (Google Gemini)</Text>
          </View>
          <Text style={[styles.cardDescription, { color: colors.textMuted }]}>
            جهت فعال‌سازی قابلیت «ثبت جادویی از روی عکس» و «دکتر گیاه»، کلید رایگان Gemini API خود را وارد کنید.
          </Text>

          {/* Quick Guide Box */}
          <View style={[styles.guideBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderLight }]}>
            <View style={styles.guideHeader}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} style={{ marginLeft: 6 }} />
              <Text style={[styles.guideTitle, { color: colors.primaryDark }]}>چگونه کلید رایگان تهیه کنم؟</Text>
            </View>
            <Text style={[styles.guideStep, { color: colors.textSecondary }]}>
              ۱. فیلترشکن (VPN) را روشن کنید و وارد سایت <Text style={{ fontWeight: '800' }}>aistudio.google.com</Text> شوید.
            </Text>
            <Text style={[styles.guideStep, { color: colors.textSecondary }]}>
              ۲. با اکانت گوگل وارد شده و روی دکمه آبی‌رنگ <Text style={{ fontWeight: '800' }}>Get API key</Text> بزنید.
            </Text>
            <Text style={[styles.guideStep, { color: colors.textSecondary }]}>
              ۳. کلید ایجاد شده را کپی کرده و در کادر زیر قرار دهید.
            </Text>
          </View>

          <View style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowKey(!showKey)}
            >
              <Ionicons
                name={showKey ? 'eye-off' : 'eye'}
                size={22}
                color={colors.textMuted}
              />
            </TouchableOpacity>
            <TextInput
              style={[
                styles.keyInput,
                { color: colors.textPrimary },
                Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
              ]}
              placeholder="AQ.Ab8RN... یا AIzaSy..."
              placeholderTextColor={colors.textMuted}
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Feedback Test Result Box */}
          {testResult && (
            <View
              style={[
                styles.testFeedbackBox,
                {
                  backgroundColor: testResult.success ? (isDark ? '#064E3B' : '#DCFCE7') : (isDark ? '#450A0A' : '#FEE2E2'),
                  borderColor: testResult.success ? '#10B981' : '#EF4444',
                },
              ]}
            >
              <Ionicons
                name={testResult.success ? 'checkmark-circle' : 'alert-circle'}
                size={20}
                color={testResult.success ? '#10B981' : '#EF4444'}
                style={{ marginLeft: 8 }}
              />
              <Text
                style={[
                  styles.testFeedbackText,
                  { color: testResult.success ? (isDark ? '#A7F3D0' : '#14532D') : (isDark ? '#FECDD3' : '#7F1D1D') },
                ]}
              >
                {testResult.message}
              </Text>
            </View>
          )}

          {/* Action Buttons: Save & Test */}
          <View style={styles.aiButtonsRow}>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSaveApiKey}
              activeOpacity={0.8}
              disabled={savingKey}
            >
              <Ionicons name="key" size={17} color="#FFFFFF" style={{ marginLeft: 6 }} />
              <Text style={styles.saveBtnText}>{savingKey ? 'در حال ذخیره...' : 'ذخیره کلید'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testKeyBtn, { borderColor: colors.primary, backgroundColor: colors.primarySubtle }]}
              onPress={handleTestApiKey}
              activeOpacity={0.8}
              disabled={testingKey}
            >
              <Ionicons name="flash-outline" size={17} color={colors.primary} style={{ marginLeft: 6 }} />
              <Text style={[styles.testKeyBtnText, { color: colors.primaryDark }]}>
                {testingKey ? 'در حال تست...' : 'تست اتصال هوش مصنوعی'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Setting - Modern Standard LTR Time Picker */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: colors.waterLight }]}>
              <Ionicons name="notifications" size={20} color={colors.waterBlue} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>ساعت ارسال هشدار روی گوشی</Text>
          </View>
          <Text style={[styles.cardDescription, { color: colors.textMuted }]}>
            هشدارهای آبیاری و کوددهی روزانه در این ساعت برای شما ارسال می‌شوند (حتی در زمان بسته بودن برنامه).
          </Text>

          {/* Modern Digital Clock Picker (Strictly LTR: [HOUR] : [MINUTE]) */}
          <View style={[styles.clockCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderLight }]}>
            <Text style={[styles.clockCardTitle, { color: colors.textSecondary }]}>
              انتخاب ساعت و دقیقه هشدار
            </Text>

            {/* Main Clock Display (LTR Row: Left = Hour, Center = Colon, Right = Minute) */}
            <View style={styles.clockRowLTR}>
              {/* Left Column: HOUR (ساعت) */}
              <View style={[styles.timeBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.timeBoxLabel, { color: colors.textMuted }]}>ساعت</Text>
                <View style={styles.stepperHorizontal}>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.background }]}
                    onPress={() => changeHour(-1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>

                  <Text style={[styles.timeBoxValue, { color: colors.primary }]}>
                    {toPersianDigits(hStr)}
                  </Text>

                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.background }]}
                    onPress={() => changeHour(1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Center Colon */}
              <View style={styles.colonBox}>
                <Text style={[styles.colonText, { color: colors.primary }]}>:</Text>
              </View>

              {/* Right Column: MINUTE (دقیقه) */}
              <View style={[styles.timeBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.timeBoxLabel, { color: colors.textMuted }]}>دقیقه</Text>
                <View style={styles.stepperHorizontal}>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.background }]}
                    onPress={() => changeMinute(-1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>

                  <Text style={[styles.timeBoxValue, { color: colors.primary }]}>
                    {toPersianDigits(mStr)}
                  </Text>

                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.background }]}
                    onPress={() => changeMinute(1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Quick Presets */}
            <View style={styles.quickPresetsSection}>
              <Text style={[styles.presetsTitle, { color: colors.textMuted }]}>انتخاب سریع زمان:</Text>
              <View style={styles.presetsRow}>
                {[
                  { label: 'صبح ۰۸:۰۰', h: 8, m: 0 },
                  { label: 'ظهر ۱۲:۰۰', h: 12, m: 0 },
                  { label: 'عصر ۱۸:۰۰', h: 18, m: 0 },
                  { label: 'شب ۲۱:۰۰', h: 21, m: 0 },
                ].map((item, idx) => {
                  const isSelected = notifHour === item.h && notifMinute === item.m;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.presetChip,
                        { backgroundColor: colors.surface, borderColor: colors.borderLight },
                        isSelected && {
                          borderColor: colors.primary,
                          backgroundColor: colors.primarySubtle,
                        },
                      ]}
                      onPress={() => handleSetQuickTime(item.h, item.m)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          { color: isSelected ? colors.primaryDark : colors.textPrimary },
                          isSelected && { fontWeight: '800' },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Clear Status Preview Badge */}
            <View style={[styles.timePreviewBadge, { backgroundColor: colors.waterLight }]}>
              <Ionicons name="alarm-outline" size={17} color={colors.waterBlue} style={{ marginLeft: 6 }} />
              <Text style={[styles.timePreviewText, { color: colors.waterDark }]}>
                هشدار روزانه: رأس ساعت {toPersianDigits(hStr)}:{toPersianDigits(mStr)} ({getPeriodText(notifHour)})
              </Text>
            </View>

            {/* Save Time Button */}
            <TouchableOpacity
              style={[styles.saveTimeBtn, { backgroundColor: colors.primary }]}
              onPress={handleSaveNotifTime}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              <Text style={styles.saveTimeBtnText}>ثبت و اعمال ساعت یادآور</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.testNotifBtn, { borderColor: colors.waterBlue, backgroundColor: colors.waterLight }]}
            onPress={handleTestNotification}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={16} color={colors.waterBlue} style={{ marginLeft: 6 }} />
            <Text style={[styles.testNotifText, { color: colors.waterDark }]}>ارسال اعلان تستی فوری برای بررسی</Text>
          </TouchableOpacity>
        </View>

        {/* Backup & Privacy */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primarySubtle }]}>
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>ذخیره لوکال و پشتیبان‌گیری</Text>
          </View>
          <Text style={[styles.cardDescription, { color: colors.textMuted }]}>
            تمام اطلاعات گیاهان، عکس‌ها و یادداشت‌ها ۱۰۰٪ آفلاین روی حافظه داخلی گوشی شما نگهداری می‌شوند.
          </Text>

          <TouchableOpacity
            style={[styles.backupBtn, { backgroundColor: colors.primarySubtle, borderColor: colors.border }]}
            onPress={handleExportBackup}
            activeOpacity={0.8}
          >
            <Ionicons name="download-outline" size={20} color={colors.primaryDark} style={{ marginLeft: 8 }} />
            <Text style={[styles.backupBtnText, { color: colors.primaryDark }]}>تهیه خروجی فایل پشتیبان (Backup)</Text>
          </TouchableOpacity>
        </View>

        {/* App Info Footer */}
        <View style={styles.footer}>
          <Text style={[styles.appName, { color: colors.textSecondary }]}>گیاه‌یار 🌿 نسخه ۱.۰.۰</Text>
          <Text style={[styles.appCredits, { color: colors.textMuted }]}>طراحی شده با عشق به طبیعت و سرسبزی خانه شما</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 18,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 15.5,
    fontWeight: '800',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  cardSubtitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12.5,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginTop: 2,
  },
  cardDescription: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 14,
  },
  guideBox: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  guideHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
  },
  guideTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  guideStep: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  keyInput: {
    flex: 1,
    fontFamily: 'IRANSansWeb',
    fontSize: 14,
    paddingVertical: 12,
    textAlign: 'left',
  },
  eyeBtn: {
    padding: 8,
  },
  testFeedbackBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  testFeedbackText: {
    flex: 1,
    fontFamily: 'IRANSansWeb',
    fontSize: 12.5,
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontWeight: '600',
  },
  aiButtonsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    elevation: 2,
  },
  saveBtnText: {
    fontFamily: 'IRANSansWeb',
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  testKeyBtn: {
    flex: 1.2,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  testKeyBtnText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  // Redesigned Modern Clock Picker Styles
  clockCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  clockCardTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
    writingDirection: 'rtl',
  },
  clockRowLTR: {
    flexDirection: 'row', // STRICTLY LTR: Hour on LEFT, Minute on RIGHT
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  timeBox: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    maxWidth: 145,
  },
  timeBoxLabel: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  stepperHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  timeBoxValue: {
    fontFamily: 'IRANSansWeb',
    fontSize: 26,
    fontWeight: '900',
    minWidth: 44,
    textAlign: 'center',
  },
  colonBox: {
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colonText: {
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 36,
  },
  quickPresetsSection: {
    marginBottom: 14,
  },
  presetsTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  presetsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  presetChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  presetChipText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12.5,
    fontWeight: '600',
  },
  timePreviewBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  timePreviewText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  saveTimeBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  saveTimeBtnText: {
    fontFamily: 'IRANSansWeb',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  testNotifBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  testNotifText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13.5,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  backupBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  backupBtnText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 14,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  appName: {
    fontFamily: 'IRANSansWeb',
    fontSize: 14,
    fontWeight: '800',
  },
  appCredits: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
  },
});
