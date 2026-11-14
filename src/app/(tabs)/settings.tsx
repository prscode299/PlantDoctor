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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db, UserProfile } from '@/services/storage/database';
import { notificationService } from '@/services/notifications/notificationService';
import { aiService } from '@/services/ai/geminiService';
import { useTheme } from '@/context/ThemeContext';
import { Header } from '@/components/ui/Header';
import { toPersianDigits } from '@/utils/jalali';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();

  // User Profile
  const [profile, setProfile] = useState<UserProfile>({
    name: 'مصطفی موسوی',
    city: 'مشهد',
    temperature: 25,
    humidity: 58,
    experienceLevel: 'باغبان برتر سطح ۲ 🌿',
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editTemp, setEditTemp] = useState('25');
  const [editHumidity, setEditHumidity] = useState('58');

  // AI & Notifications
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [notifHour, setNotifHour] = useState(9);
  const [notifMinute, setNotifMinute] = useState(0);
  const [savingKey, setSavingKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const userProf = await db.getUserProfile();
      setProfile(userProf);
      setEditName(userProf.name);
      setEditCity(userProf.city);
      setEditTemp(String(userProf.temperature));
      setEditHumidity(String(userProf.humidity));

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

  const handleOpenEditProfile = () => {
    setEditName(profile.name);
    setEditCity(profile.city);
    setEditTemp(String(profile.temperature));
    setEditHumidity(String(profile.humidity));
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('توجه', 'لطفاً نام خود را وارد کنید.');
      return;
    }
    try {
      const updated: UserProfile = {
        ...profile,
        name: editName.trim(),
        city: editCity.trim() || 'مشهد',
        temperature: parseInt(editTemp, 10) || 25,
        humidity: parseInt(editHumidity, 10) || 58,
      };
      await db.saveUserProfile(updated);
      setProfile(updated);
      setIsEditingProfile(false);
      Alert.alert('ثبت شد ✨', 'مشخصات حساب کاربری و شهر شما با موفقیت بروزرسانی شد.');
    } catch {
      Alert.alert('خطا', 'ذخیره پروفایل با خطا مواجه شد.');
    }
  };

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
      Alert.alert('ارسال شد 🔔', 'یک اعلان تستی برای شما ارسال شد. لطفاً نوار اعلان گوشی را بررسی کنید.');
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
        {/* User Gardener Profile Card (Editable) */}
        <TouchableOpacity
          style={[styles.profileCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight }]}
          onPress={handleOpenEditProfile}
          activeOpacity={0.85}
        >
          <View style={[styles.profileAvatar, { borderColor: colors.primary, backgroundColor: colors.surfaceContainerLow }]}>
            <Ionicons name="person" size={26} color={colors.primary} />
          </View>
          <View style={styles.profileTextCol}>
            <View style={styles.profileNameRow}>
              <Text style={[styles.profileName, { color: colors.textPrimary }]}>{profile.name}</Text>
              <View style={[styles.gardenerBadge, { backgroundColor: isDark ? colors.primaryContainer : '#E6F8E8' }]}>
                <Ionicons name="ribbon-outline" size={12} color={colors.primary} style={{ marginLeft: 3 }} />
                <Text style={[styles.gardenerBadgeText, { color: colors.primary }]}>{profile.experienceLevel}</Text>
              </View>
            </View>
            <View style={styles.profileMetaRow}>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} style={{ marginLeft: 3 }} />
              <Text style={[styles.profilePlantsCount, { color: colors.textMuted }]}>
                {profile.city} • {toPersianDigits(profile.temperature)}°C ({toPersianDigits(profile.humidity)}٪ رطوبت)
              </Text>
            </View>
          </View>
          <View style={[styles.editProfileBtn, { backgroundColor: colors.surfaceContainerLow }]}>
            <Ionicons name="create-outline" size={17} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Segmented Day / Night Mode Switcher (Clean Single Icon) */}
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>پوسته و ظاهر برنامه</Text>
          <Text style={[styles.cardDescription, { color: colors.textMuted }]}>
            انتخاب بین تم ارگانیک مه صبحگاهی و تم تاریک جنگل شبانه
          </Text>

          <View style={[styles.segmentedWrap, { backgroundColor: colors.surfaceContainerLow }]}>
            <TouchableOpacity
              style={[
                styles.segmentItem,
                !isDark && [styles.segmentItemActive, { backgroundColor: colors.surfaceContainerLowest }],
              ]}
              onPress={() => isDark && toggleTheme()}
              activeOpacity={0.8}
            >
              <Ionicons name="sunny" size={18} color={!isDark ? '#D97706' : colors.textMuted} style={{ marginLeft: 6 }} />
              <Text style={[styles.segmentText, { color: !isDark ? colors.textPrimary : colors.textMuted }, !isDark && { fontWeight: '800' }]}>
                پوسته روز
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentItem,
                isDark && [styles.segmentItemActive, { backgroundColor: colors.surfaceContainerLowest }],
              ]}
              onPress={() => !isDark && toggleTheme()}
              activeOpacity={0.8}
            >
              <Ionicons name="moon" size={18} color={isDark ? colors.primary : colors.textMuted} style={{ marginLeft: 6 }} />
              <Text style={[styles.segmentText, { color: isDark ? colors.textPrimary : colors.textMuted }, isDark && { fontWeight: '800' }]}>
                پوسته شب
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Gemini API Key Section */}
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? colors.primaryContainer : '#E6F8E8' }]}>
              <Ionicons name="sparkles" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>هوش مصنوعی Google Gemini</Text>
          </View>
          <Text style={[styles.cardDescription, { color: colors.textMuted }]}>
            جهت فعال‌سازی قابلیت «ثبت جادویی از روی عکس» و «دکتر گیاه»، کلید رایگان Gemini API را وارد کنید.
          </Text>

          {/* Quick Guide Box */}
          <View style={[styles.guideBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight }]}>
            <View style={styles.guideHeader}>
              <Ionicons name="information-circle-outline" size={16} color={colors.primary} style={{ marginLeft: 6 }} />
              <Text style={[styles.guideTitle, { color: colors.textPrimary }]}>راهنمای دریافت رایگان کلید:</Text>
            </View>
            <Text style={[styles.guideStep, { color: colors.textSecondary }]}>
              ۱. وارد سایت <Text style={{ fontWeight: '800' }}>aistudio.google.com</Text> شوید (با فیلترشکن).
            </Text>
            <Text style={[styles.guideStep, { color: colors.textSecondary }]}>
              ۲. روی دکمه آبی‌رنگ <Text style={{ fontWeight: '800' }}>Get API key</Text> بزنید و کلید را کپی کنید.
            </Text>
          </View>

          <View style={[styles.inputRow, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight }]}>
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowKey(!showKey)}>
              <Ionicons name={showKey ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
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
                size={18}
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
              style={[styles.saveBtn, { backgroundColor: colors.primaryContainer }]}
              onPress={handleSaveApiKey}
              activeOpacity={0.8}
              disabled={savingKey}
            >
              <Ionicons name="key" size={16} color="#92F7C3" style={{ marginLeft: 6 }} />
              <Text style={styles.saveBtnText}>{savingKey ? 'در حال ذخیره...' : 'ذخیره کلید'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testKeyBtn, { borderColor: colors.primary, backgroundColor: colors.surfaceContainerLow }]}
              onPress={handleTestApiKey}
              activeOpacity={0.8}
              disabled={testingKey}
            >
              <Ionicons name="flash-outline" size={16} color={colors.primary} style={{ marginLeft: 6 }} />
              <Text style={[styles.testKeyBtnText, { color: colors.primary }]}>
                {testingKey ? 'در حال تست...' : 'تست اتصال هوش مصنوعی'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Digital Clock Notification Picker */}
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: colors.waterLight }]}>
              <Ionicons name="alarm-outline" size={18} color={colors.tertiary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>ساعت یادآور روزانه گیاهان</Text>
          </View>
          <Text style={[styles.cardDescription, { color: colors.textMuted }]}>
            اعلان‌های آبیاری و کوددهی روزانه در این ساعت ارسال خواهند شد.
          </Text>

          {/* Large Digital Clock Display (LTR) */}
          <View style={[styles.clockCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight }]}>
            <View style={styles.clockRowLTR}>
              {/* Left Column: HOUR */}
              <View style={[styles.timeBox, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight }]}>
                <Text style={[styles.timeBoxLabel, { color: colors.textMuted }]}>ساعت</Text>
                <View style={styles.stepperHorizontal}>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.surfaceContainerLow }]}
                    onPress={() => changeHour(-1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>

                  <Text style={[styles.timeBoxValue, { color: colors.primary }]}>
                    {toPersianDigits(hStr)}
                  </Text>

                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.surfaceContainerLow }]}
                    onPress={() => changeHour(1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.colonBox}>
                <Text style={[styles.colonText, { color: colors.primary }]}>:</Text>
              </View>

              {/* Right Column: MINUTE */}
              <View style={[styles.timeBox, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight }]}>
                <Text style={[styles.timeBoxLabel, { color: colors.textMuted }]}>دقیقه</Text>
                <View style={styles.stepperHorizontal}>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.surfaceContainerLow }]}
                    onPress={() => changeMinute(-1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>

                  <Text style={[styles.timeBoxValue, { color: colors.primary }]}>
                    {toPersianDigits(mStr)}
                  </Text>

                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.surfaceContainerLow }]}
                    onPress={() => changeMinute(1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Quick Presets */}
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
                      { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight },
                      isSelected && {
                        borderColor: colors.primary,
                        backgroundColor: isDark ? colors.primaryContainer : '#E6F8E8',
                      },
                    ]}
                    onPress={() => handleSetQuickTime(item.h, item.m)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        { color: isSelected ? (isDark ? '#92F7C3' : colors.primary) : colors.textPrimary },
                        isSelected && { fontWeight: '800' },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Time Status Badge */}
            <View style={[styles.timePreviewBadge, { backgroundColor: isDark ? colors.surfaceContainer : '#E0F3E3' }]}>
              <Ionicons name="alarm-outline" size={16} color={colors.primary} style={{ marginLeft: 6 }} />
              <Text style={[styles.timePreviewText, { color: colors.textPrimary }]}>
                هشدار روزانه: رأس ساعت {toPersianDigits(hStr)}:{toPersianDigits(mStr)} ({getPeriodText(notifHour)})
              </Text>
            </View>

            {/* Save Time Button */}
            <TouchableOpacity
              style={[styles.saveTimeBtn, { backgroundColor: colors.primaryContainer }]}
              onPress={handleSaveNotifTime}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={17} color="#92F7C3" style={{ marginLeft: 6 }} />
              <Text style={styles.saveTimeBtnText}>ثبت ساعت یادآور</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.testNotifBtn, { borderColor: colors.borderLight, backgroundColor: colors.surfaceContainerLow }]}
            onPress={handleTestNotification}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={16} color={colors.primary} style={{ marginLeft: 6 }} />
            <Text style={[styles.testNotifText, { color: colors.textPrimary }]}>ارسال اعلان تستی فوری برای بررسی</Text>
          </TouchableOpacity>
        </View>

        {/* Backup & Privacy */}
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? colors.primaryContainer : '#E6F8E8' }]}>
              <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>حریم خصوصی و نسخه پشتیبان</Text>
          </View>
          <Text style={[styles.cardDescription, { color: colors.textMuted }]}>
            تمامی مشخصات گیاهان و لاگ‌های مراقبت ۱۰۰٪ آفلاین روی گوشی شما ذخیره شده است.
          </Text>

          <TouchableOpacity
            style={[styles.backupBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight }]}
            onPress={handleExportBackup}
            activeOpacity={0.8}
          >
            <Ionicons name="cloud-download-outline" size={18} color={colors.primary} style={{ marginLeft: 6 }} />
            <Text style={[styles.backupBtnText, { color: colors.textPrimary }]}>تهیه فایل پشتیبان (JSON Export) 💾</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Brand Info */}
        <View style={styles.footerCol}>
          <View style={styles.footerLogoRow}>
            <Ionicons name="leaf" size={16} color={colors.primary} style={{ marginLeft: 4 }} />
            <Text style={[styles.footerBrand, { color: colors.textPrimary }]}>گیاه‌یار 🌿 نسخه ۱.۰.۰</Text>
          </View>
          <Text style={[styles.footerSubtitle, { color: colors.textMuted }]}>همراه هوشمند و ارگانیک گیاهان خانگی شما</Text>
        </View>
      </ScrollView>

      {/* Edit User Profile Modal */}
      <Modal visible={isEditingProfile} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsEditingProfile(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>ویرایش پروفایل کاربر 👤</Text>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>نام و نام خانوادگی:</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight, color: colors.textPrimary }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="نام شما..."
                  placeholderTextColor={colors.textMuted}
                  textAlign="right"
                />
              </View>

              {/* City */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>شهر محل سکونت (جهت نمایش آب‌وهوا):</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight, color: colors.textPrimary }]}
                  value={editCity}
                  onChangeText={setEditCity}
                  placeholder="مثلاً: مشهد، تهران، اصفهان..."
                  placeholderTextColor={colors.textMuted}
                  textAlign="right"
                />
              </View>

              {/* Temperature & Humidity Row */}
              <View style={styles.tempHumRow}>
                <View style={styles.tempHumCol}>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>دمای تقریبی شهر (°C):</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight, color: colors.textPrimary }]}
                    value={editTemp}
                    onChangeText={setEditTemp}
                    keyboardType="numeric"
                    textAlign="center"
                  />
                </View>
                <View style={styles.tempHumCol}>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>رطوبت شهر (٪):</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight, color: colors.textPrimary }]}
                    value={editHumidity}
                    onChangeText={setEditHumidity}
                    keyboardType="numeric"
                    textAlign="center"
                  />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveProfileBtn, { backgroundColor: colors.primaryContainer }]}
              onPress={handleSaveProfile}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={18} color="#92F7C3" style={{ marginLeft: 6 }} />
              <Text style={styles.saveProfileBtnText}>ذخیره تغییرات پروفایل</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 18,
    paddingBottom: 50,
    gap: 14,
  },
  profileCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    shadowColor: 'rgba(30, 94, 58, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },
  profileTextCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  profileNameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  profileName: {
    fontFamily: 'IRANSansWeb',
    fontSize: 16,
    fontWeight: '800',
  },
  gardenerBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  gardenerBadgeText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 10.5,
    fontWeight: '700',
  },
  profileMetaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 2,
  },
  profilePlantsCount: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11.5,
  },
  editProfileBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  card: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    shadowColor: 'rgba(30, 94, 58, 0.06)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  cardTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 14.5,
    fontWeight: '800',
    textAlign: 'right',
  },
  cardDescription: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
    marginBottom: 12,
  },
  segmentedWrap: {
    flexDirection: 'row-reverse',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 11,
  },
  segmentItemActive: {
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  segmentText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12.5,
    fontWeight: '600',
  },
  guideBox: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  guideHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 6,
  },
  guideTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '800',
  },
  guideStep: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11.5,
    lineHeight: 18,
    textAlign: 'right',
    marginTop: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  eyeBtn: {
    padding: 8,
  },
  keyInput: {
    fontFamily: 'IRANSansWeb',
    flex: 1,
    fontSize: 13,
    paddingVertical: 10,
    textAlign: 'left',
  },
  testFeedbackBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  testFeedbackText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
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
    paddingVertical: 11,
    borderRadius: 14,
  },
  saveBtnText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12.5,
    fontWeight: '800',
    color: '#92F7C3',
  },
  testKeyBtn: {
    flex: 1.2,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  testKeyBtnText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
  },
  clockCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  clockRowLTR: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  timeBox: {
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    alignItems: 'center',
    width: 120,
  },
  timeBoxLabel: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    marginBottom: 4,
  },
  stepperHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBoxValue: {
    fontFamily: 'IRANSansWeb',
    fontSize: 22,
    fontWeight: '800',
    minWidth: 32,
    textAlign: 'center',
  },
  colonBox: {
    paddingHorizontal: 8,
  },
  colonText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 24,
    fontWeight: '800',
  },
  presetsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 12,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  presetChipText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    fontWeight: '600',
  },
  timePreviewBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  timePreviewText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
  },
  saveTimeBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 14,
  },
  saveTimeBtnText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    fontWeight: '800',
    color: '#92F7C3',
  },
  testNotifBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  testNotifText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '600',
  },
  backupBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  backupBtnText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    fontWeight: '700',
  },
  footerCol: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerLogoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 4,
  },
  footerBrand: {
    fontFamily: 'IRANSansWeb',
    fontSize: 14,
    fontWeight: '800',
  },
  footerSubtitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 16,
    fontWeight: '800',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 6,
  },
  inputField: {
    fontFamily: 'IRANSansWeb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    borderWidth: 1,
  },
  tempHumRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: 16,
  },
  tempHumCol: {
    flex: 1,
  },
  saveProfileBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 6,
  },
  saveProfileBtnText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13.5,
    fontWeight: '800',
    color: '#92F7C3',
  },
});
