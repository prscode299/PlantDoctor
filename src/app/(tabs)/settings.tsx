import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@/services/storage/database';
import { notificationService } from '@/services/notifications/notificationService';
import Colors from '@/constants/colors';
import { Header } from '@/components/ui/Header';
import { toPersianDigits } from '@/utils/jalali';

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [notifHour, setNotifHour] = useState('9');
  const [notifMinute, setNotifMinute] = useState('0');
  const [savingKey, setSavingKey] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const aiSettings = await db.getAiSettings();
      if (aiSettings.apiKey) {
        setApiKey(aiSettings.apiKey);
      }
      const time = await db.getNotificationTime();
      setNotifHour(String(time.hour));
      setNotifMinute(String(time.minute));
    }
    loadSettings();
  }, []);

  const handleSaveApiKey = async () => {
    setSavingKey(true);
    try {
      await db.saveAiSettings({
        apiKey: apiKey.trim(),
        provider: 'gemini',
        selectedModel: 'gemini-1.5-flash',
      });
      Alert.alert('موفقیت ✨', 'کلید هوش مصنوعی با موفقیت در حافظه امن گوشی ذخیره شد.');
    } catch {
      Alert.alert('خطا', 'ذخیره کلید با مشکل مواجه شد.');
    } finally {
      setSavingKey(false);
    }
  };

  const handleSaveNotifTime = async () => {
    const h = parseInt(notifHour, 10);
    const m = parseInt(notifMinute, 10);

    if (isNaN(h) || h < 0 || h > 23 || isNaN(m) || m < 0 || m > 59) {
      Alert.alert('خطا', 'لطفاً ساعت معتبر بین ۰ تا ۲۳ و دقیقه بین ۰ تا ۵۹ وارد کنید.');
      return;
    }

    try {
      await db.saveNotificationTime({ hour: h, minute: m });
      const plants = await db.getPlants();
      await notificationService.syncAllPlantNotifications(plants);
      const hStr = h < 10 ? '0' + h : String(h);
      const mStr = m < 10 ? '0' + m : String(m);
      Alert.alert(
        'تنظیم شد ⏰',
        `ساعت یادآوری روزانه روی ${toPersianDigits(hStr)}:${toPersianDigits(mStr)} تنظیم شد.`
      );
    } catch {
      Alert.alert('خطا', 'تنظیم ساعت اعلان با مشکل مواجه شد.');
    }
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
      const json = await db.exportBackup();
      Alert.alert(
        'پشتیبان‌گیری کامل 📦',
        'نسخه پشتیبان تمام گیاهان و لاگ‌ها آماده شد (می‌توانید کپی و نگهداری کنید).'
      );
    } catch {
      Alert.alert('خطا', 'تهیه فایل پشتیبان ناموفق بود.');
    }
  };

  const displayHour = notifHour ? notifHour.padStart(2, '0') : '09';
  const displayMinute = notifMinute ? notifMinute.padStart(2, '0') : '00';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="تنظیمات ⚙️"
        subtitle="هوش مصنوعی، یادآورها و پشتیبان‌گیری باغچه"
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Gemini API Key Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCirclePrimary}>
              <Ionicons name="sparkles" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.cardTitle}>اتصال به هوش مصنوعی (Google Gemini)</Text>
          </View>
          <Text style={styles.cardDescription}>
            جهت فعال‌سازی قابلیت «ثبت جادویی از روی عکس» و «دکتر گیاه»، کلید رایگان Gemini API خود را وارد کنید. این کلید فقط روی حافظه گوشی شما نگهداری می‌شود.
          </Text>

          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowKey(!showKey)}
            >
              <Ionicons
                name={showKey ? 'eye-off' : 'eye'}
                size={22}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
            <TextInput
              style={styles.keyInput}
              placeholder="AIzaSy..."
              placeholderTextColor={Colors.textMuted}
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSaveApiKey}
            activeOpacity={0.8}
            disabled={savingKey}
          >
            <Ionicons name="key" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
            <Text style={styles.saveBtnText}>ذخیره کلید هوش مصنوعی</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications Setting */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircleWater}>
              <Ionicons name="notifications" size={20} color={Colors.waterBlue} />
            </View>
            <Text style={styles.cardTitle}>ساعت ارسال هشدار روی گوشی</Text>
          </View>
          <Text style={styles.cardDescription}>
            هشدارهای آبیاری و کوددهی روزانه در این ساعت برای شما ارسال می‌شوند (حتی در زمان بسته بودن برنامه).
          </Text>

          {/* Redesigned Crystal-Clear Time Selector */}
          <View style={styles.timeCardContainer}>
            <View style={styles.timeColumnsRow}>
              {/* Right column: Hour (ساعت) */}
              <View style={styles.timeColumn}>
                <Text style={styles.timeLabel}>ساعت (۰ تا ۲۳)</Text>
                <View style={styles.timeStepperBox}>
                  <TouchableOpacity
                    style={styles.timeStepBtn}
                    onPress={() => {
                      const h = ((parseInt(notifHour, 10) || 0) + 1) % 24;
                      setNotifHour(String(h));
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-up" size={20} color={Colors.textPrimary} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.timeInput}
                    value={displayHour}
                    onChangeText={(val) => {
                      const num = parseInt(val, 10);
                      if (!isNaN(num) && num >= 0 && num <= 23) setNotifHour(String(num));
                      else if (val === '') setNotifHour('');
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                    textAlign="center"
                  />
                  <TouchableOpacity
                    style={styles.timeStepBtn}
                    onPress={() => {
                      const h = ((parseInt(notifHour, 10) || 0) - 1 + 24) % 24;
                      setNotifHour(String(h));
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-down" size={20} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Center Colon */}
              <View style={styles.timeColonWrapper}>
                <Text style={styles.timeColon}>:</Text>
              </View>

              {/* Left column: Minute (دقیقه) */}
              <View style={styles.timeColumn}>
                <Text style={styles.timeLabel}>دقیقه (۰ تا ۵۹)</Text>
                <View style={styles.timeStepperBox}>
                  <TouchableOpacity
                    style={styles.timeStepBtn}
                    onPress={() => {
                      const m = ((parseInt(notifMinute, 10) || 0) + 5) % 60;
                      setNotifMinute(String(m));
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-up" size={20} color={Colors.textPrimary} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.timeInput}
                    value={displayMinute}
                    onChangeText={(val) => {
                      const num = parseInt(val, 10);
                      if (!isNaN(num) && num >= 0 && num <= 59) setNotifMinute(String(num));
                      else if (val === '') setNotifMinute('');
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                    textAlign="center"
                  />
                  <TouchableOpacity
                    style={styles.timeStepBtn}
                    onPress={() => {
                      const m = ((parseInt(notifMinute, 10) || 0) - 5 + 60) % 60;
                      setNotifMinute(String(m));
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-down" size={20} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Clear Status Preview */}
            <View style={styles.timePreviewBadge}>
              <Ionicons name="alarm-outline" size={16} color={Colors.waterBlue} style={{ marginLeft: 6 }} />
              <Text style={styles.timePreviewText}>
                هشدار روزانه رأس ساعت {toPersianDigits(displayHour)}:{toPersianDigits(displayMinute)} فعال است
              </Text>
            </View>

            {/* Save Time Button */}
            <TouchableOpacity
              style={styles.saveTimeBtn}
              onPress={handleSaveNotifTime}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              <Text style={styles.saveTimeBtnText}>ثبت و اعمال ساعت یادآور</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.testNotifBtn}
            onPress={handleTestNotification}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={16} color={Colors.waterBlue} style={{ marginLeft: 6 }} />
            <Text style={styles.testNotifText}>ارسال اعلان تستی فوری برای بررسی</Text>
          </TouchableOpacity>
        </View>

        {/* Backup & Privacy */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCirclePrimary}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.cardTitle}>ذخیره لوکال و پشتیبان‌گیری</Text>
          </View>
          <Text style={styles.cardDescription}>
            تمام اطلاعات گیاهان، عکس‌ها و یادداشت‌ها ۱۰۰٪ آفلاین روی حافظه داخلی گوشی شما نگهداری می‌شوند.
          </Text>

          <TouchableOpacity
            style={styles.backupBtn}
            onPress={handleExportBackup}
            activeOpacity={0.8}
          >
            <Ionicons name="download-outline" size={20} color={Colors.primaryDark} style={{ marginLeft: 8 }} />
            <Text style={styles.backupBtnText}>تهیه خروجی فایل پشتیبان (Backup)</Text>
          </TouchableOpacity>
        </View>

        {/* App Info Footer */}
        <View style={styles.footer}>
          <Text style={styles.appName}>گیاه‌یار 🌿 نسخه ۱.۰.۰</Text>
          <Text style={styles.appCredits}>طراحی شده با عشق به طبیعت و سرسبزی خانه شما</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCirclePrimary: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  iconCircleWater: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.waterLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  cardTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'right',
    flex: 1,
  },
  cardDescription: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13.5,
    color: Colors.textMuted,
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  keyInput: {
    flex: 1,
    fontFamily: 'IRANSansWeb',
    fontSize: 14,
    color: Colors.textPrimary,
    paddingVertical: 12,
    textAlign: 'left',
  },
  eyeBtn: {
    padding: 8,
  },
  saveBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    fontFamily: 'IRANSansWeb',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  timeCardContainer: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 12,
  },
  timeColumnsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  timeColumn: {
    alignItems: 'center',
  },
  timeLabel: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    writingDirection: 'rtl',
  },
  timeStepperBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 4,
    paddingHorizontal: 8,
    width: 76,
  },
  timeStepBtn: {
    paddingVertical: 2,
    paddingHorizontal: 12,
  },
  timeInput: {
    fontFamily: 'IRANSansWeb',
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primaryDark,
    paddingVertical: 2,
    width: 60,
  },
  timeColonWrapper: {
    paddingTop: 20,
  },
  timeColon: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  timePreviewBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.waterLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  timePreviewText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    color: Colors.waterDark,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  saveTimeBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.waterBlue,
    paddingVertical: 12,
    borderRadius: 14,
  },
  saveTimeBtnText: {
    fontFamily: 'IRANSansWeb',
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  testNotifBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.waterLight,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  testNotifText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    fontWeight: '700',
    color: Colors.waterBlue,
    writingDirection: 'rtl',
  },
  backupBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySurface,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.primarySubtle,
  },
  backupBtnText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
    writingDirection: 'rtl',
  },
  footer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  appName: {
    fontFamily: 'IRANSansWeb',
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  appCredits: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
