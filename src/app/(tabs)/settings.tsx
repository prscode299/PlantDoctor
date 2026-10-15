import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
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
      Alert.alert('موفقیت', 'کلید هوش مصنوعی با موفقیت در حافظه امن ذخیره شد.');
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
      Alert.alert('تنظیم شد', `ساعت یادآوری روزانه روی ${toPersianDigits(h)}:${toPersianDigits(m < 10 ? '0' + m : m)} تنظیم شد.`);
    } catch {
      Alert.alert('خطا', 'تنظیم ساعت اعلان با مشکل مواجه شد.');
    }
  };

  const handleTestNotification = async () => {
    try {
      await notificationService.sendTestNotification();
      Alert.alert('ارسال شد 🔔', 'یک اعلان تستی برای شما ارسال شد. لطفاً نوار اعلان بالای گوشی را بررسی کنید.');
    } catch (e: any) {
      Alert.alert('خطا در ارسال اعلان', e.message || 'لطفاً دسترسی نوتیفیکیشن را در تنظیمات گوشی فعال کنید.');
    }
  };

  const handleExportBackup = async () => {
    try {
      const json = await db.exportBackup();
      Alert.alert('پشتیبان‌گیری کامل', 'نسخه پشتیبان تمام گیاهان و لاگ‌ها آماده شد (می‌توانید کپی و نگهداری کنید).');
    } catch {
      Alert.alert('خطا', 'تهیه فایل پشتیبان ناموفق بود.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="تنظیمات ⚙️"
        subtitle="اتصال به هوش مصنوعی، یادآورها و پشتیبان‌گیری"
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Gemini API Key Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="sparkles" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>اتصال به هوش مصنوعی (Google Gemini)</Text>
          </View>
          <Text style={styles.cardDescription}>
            جهت فعال‌سازی قابلیت «ثبت جادویی از روی عکس» و «دکتر گیاه»، کلید رایگان Gemini API خود را وارد کنید. این کلید فقط در حافظه گوشی شما ذخیره می‌شود.
          </Text>

          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowKey(!showKey)}
            >
              <Ionicons
                name={showKey ? 'eye-off' : 'eye'}
                size={20}
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
          >
            <Text style={styles.saveBtnText}>ذخیره کلید هوش مصنوعی</Text>
            <Ionicons name="key" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>

        {/* Notifications Setting */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="notifications" size={20} color={Colors.waterBlue} />
            <Text style={styles.cardTitle}>ساعت ارسال هشدار روی گوشی</Text>
          </View>
          <Text style={styles.cardDescription}>
            هشدارهای آبیاری و کوددهی در این ساعت از روز به شما یادآوری می‌شوند (حتی در زمان بسته بودن برنامه).
          </Text>

          <View style={styles.timeRow}>
            <TouchableOpacity
              style={styles.saveTimeBtn}
              onPress={handleSaveNotifTime}
              activeOpacity={0.8}
            >
              <Text style={styles.saveTimeBtnText}>تنظیم ساعت</Text>
            </TouchableOpacity>

            <View style={styles.timeInputsWrapper}>
              <TextInput
                style={styles.timeBox}
                value={notifMinute}
                onChangeText={setNotifMinute}
                keyboardType="numeric"
                maxLength={2}
                textAlign="center"
              />
              <Text style={styles.timeColon}>:</Text>
              <TextInput
                style={styles.timeBox}
                value={notifHour}
                onChangeText={setNotifHour}
                keyboardType="numeric"
                maxLength={2}
                textAlign="center"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.testNotifBtn}
            onPress={handleTestNotification}
            activeOpacity={0.8}
          >
            <Text style={styles.testNotifText}>تست دریافت اعلان فوری 🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Backup & Privacy */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
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
            <Text style={styles.backupBtnText}>تهیه خروجی فایل پشتیبان (Backup)</Text>
            <Ionicons name="download-outline" size={18} color={Colors.primary} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>

        {/* App Info Footer */}
        <View style={styles.footer}>
          <Text style={styles.appName}>گیاه‌یار | نسخه ۱.۰.۰</Text>
          <Text style={styles.appCredits}>طراحی شده با عشق به طبیعت و گیاهان 🌿</Text>
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
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  cardDescription: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
    textAlign: 'right',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  keyInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    paddingVertical: 10,
  },
  eyeBtn: {
    padding: 6,
  },
  saveBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  timeInputsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeBox: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    width: 50,
    height: 44,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  timeColon: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  saveTimeBtn: {
    backgroundColor: Colors.waterBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveTimeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  testNotifBtn: {
    backgroundColor: Colors.waterLight,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  testNotifText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.waterBlue,
  },
  backupBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySubtle,
    paddingVertical: 12,
    borderRadius: 14,
  },
  backupBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  appName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  appCredits: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 4,
  },
});
