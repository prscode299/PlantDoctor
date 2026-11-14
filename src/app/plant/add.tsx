import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Plant, PlantPreset } from '@/types/plant';
import { db } from '@/services/storage/database';
import { aiService } from '@/services/ai/geminiService';
import { notificationService } from '@/services/notifications/notificationService';
import { useTheme } from '@/context/ThemeContext';
import { POPULAR_PLANTS, DEFAULT_ROOMS } from '@/constants/presets';
import { addDays, getTodayIso, toPersianDigits } from '@/utils/jalali';

const PRESET_EMOJIS: Record<string, string> = {
  'پوتوس': '🌱',
  'زاموفیلیا': '🪴',
  'سانسوریا': '🌿',
  'برگ انجیری': '✨',
  'فیکوس لیراتا': '🍃',
  'اسپاتی فیلوم': '🌸',
  'آگلونما': '🌾',
  'شفلرا': '🎋',
};

export default function AddPlantScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const presetsScrollRef = useRef<ScrollView>(null);
  const [name, setName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [room, setRoom] = useState(DEFAULT_ROOMS[0]);
  const [wateringDays, setWateringDays] = useState('7');
  const [fertilizingDays, setFertilizingDays] = useState('30');
  const [fertilizerType, setFertilizerType] = useState('کود ۲۰-۲۰-۲۰ یا سبزینگی');
  const [lightRequirement, setLightRequirement] = useState('نور غیرمستقیم متوسط');
  const [soilType, setSoilType] = useState('');
  const [careTips, setCareTips] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pick Image
  const handlePickImage = async (fromCamera = false) => {
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      };

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setImageBase64(result.assets[0].base64 || null);
      }
    } catch {
      Alert.alert('خطا', 'انتخاب تصویر با خطا مواجه شد.');
    }
  };

  // Magic AI Auto-Fill
  const handleMagicAiSetup = async () => {
    if (!name.trim() && !scientificName.trim() && !imageBase64) {
      Alert.alert(
        'اطلاعات اولیه نیاز است',
        'لطفاً یا عکسی از گیاه بگیرید، یا نام فارسی یا علمی آن را بنویسید تا هوش مصنوعی بقیه اطلاعات را پر کند.'
      );
      return;
    }

    setAiLoading(true);
    try {
      const result = await aiService.autoFillPlantCare({
        plantName: name.trim() || scientificName.trim(),
        imageBase64: imageBase64 || undefined,
      });

      // Auto-fill all fields
      if (result.commonName && !name.trim()) setName(result.commonName);
      if (result.scientificName) setScientificName(result.scientificName);
      if (result.wateringIntervalDays) setWateringDays(String(result.wateringIntervalDays));
      if (result.fertilizingIntervalDays) setFertilizingDays(String(result.fertilizingIntervalDays));
      if (result.fertilizerType) setFertilizerType(result.fertilizerType);
      if (result.lightRequirement) setLightRequirement(result.lightRequirement);
      if (result.soilType) setSoilType(result.soilType);
      if (result.careTips) setCareTips(result.careTips);

      Alert.alert(
        'تنظیم خودکار انجام شد! ✨',
        `مشخصات گیاه «${result.commonName || name}» بر اساس شرایط علمی و ماه جاری استخراج و در فرم قرار گرفت.`
      );
    } catch (err: any) {
      Alert.alert(
        'خطا در تحلیل هوش مصنوعی',
        err.message || 'لطفاً اطمینان حاصل کنید کلید API در بخش تنظیمات وارد شده باشد.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  // Quick Preset Click
  const handleSelectPreset = (preset: PlantPreset) => {
    setName(preset.name);
    setScientificName(preset.scientificName);
    setWateringDays(String(preset.defaultWateringSummer));
    setFertilizingDays(String(preset.defaultFertilizing));
    setFertilizerType(preset.fertilizerType);
    setLightRequirement(preset.lightRequirement);
    setSoilType(preset.soilType);
    setCareTips(preset.careTips);
  };

  // Save Plant to DB
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('توجه', 'لطفاً نامی برای گیاه خود وارد کنید.');
      return;
    }

    const wDays = parseInt(wateringDays, 10) || 7;
    const fDays = parseInt(fertilizingDays, 10) || 30;
    const today = getTodayIso();

    setSaving(true);
    try {
      const newPlant: Plant = {
        id: `plant_${Date.now()}`,
        name: name.trim(),
        scientificName: scientificName.trim() || 'گونه آپارتمانی',
        imageUri: imageUri || undefined,
        room,
        wateringIntervalDays: wDays,
        lastWateredDate: today,
        nextWateringDate: addDays(today, wDays),
        fertilizingIntervalDays: fDays,
        lastFertilizedDate: today,
        nextFertilizingDate: addDays(today, fDays),
        fertilizerType: fertilizerType.trim(),
        lightRequirement: lightRequirement.trim(),
        soilType: soilType.trim(),
        careTips: careTips.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.savePlant(newPlant);
      const allPlants = await db.getPlants();
      await notificationService.syncAllPlantNotifications(allPlants);

      Alert.alert('تبریک! 🌱', `گیاه «${newPlant.name}» به باغچه شما افزوده شد.`);
      router.back();
    } catch {
      Alert.alert('خطا', 'ذخیره گیاه با مشکل مواجه شد.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Top Handle & Navigation */}
      <View style={styles.sheetTopBar}>
        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
        <View style={styles.sheetHeaderRow}>
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.surfaceContainerLow }]}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>افزودن گیاه جدید 🌱</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, 20) + 30 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Magic AI Setup Banner (Stitch Glowing Hero Banner) */}
        <View
          style={[
            styles.aiBanner,
            {
              backgroundColor: isDark ? colors.surfaceContainer : '#E6F8E8',
              borderColor: isDark ? colors.border : '#C0C9BF',
            },
          ]}
        >
          <View style={styles.aiBannerHeader}>
            <View style={[styles.aiBadge, { backgroundColor: colors.primaryContainer }]}>
              <Ionicons name="sparkles" size={12} color="#92F7C3" style={{ marginLeft: 3 }} />
              <Text style={styles.aiBadgeText}>هوش مصنوعی</Text>
            </View>
            <Text style={[styles.aiBannerTitle, { color: colors.textPrimary }]}>تنظیم جادویی با هوش مصنوعی 🪄</Text>
          </View>
          <Text style={[styles.aiBannerDesc, { color: colors.textSecondary }]}>
            کافیست عکس برگ را بگیرید یا نام گیاه را وارد کنید؛ Gemini تمام نیازمندی‌های فصلی و تقویم را خودکار تنظیم می‌کند.
          </Text>

          <TouchableOpacity
            style={[styles.aiActionBtn, { backgroundColor: colors.primaryContainer }, aiLoading && styles.btnDisabled]}
            onPress={handleMagicAiSetup}
            disabled={aiLoading}
            activeOpacity={0.8}
          >
            {aiLoading ? (
              <ActivityIndicator color="#92F7C3" size="small" />
            ) : (
              <View style={styles.aiActionBtnInner}>
                <Ionicons name="sparkles" size={16} color="#92F7C3" style={{ marginLeft: 6 }} />
                <Text style={styles.aiActionBtnText}>استخراج خودکار تنظیمات با AI ✨</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Image Picker Area */}
        <View style={styles.imageSection}>
          {imageUri ? (
            <View style={styles.imagePreviewWrapper}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.changeImageBtn}
                onPress={() => handlePickImage(false)}
              >
                <Text style={styles.changeImageText}>تغییر تصویر</Text>
                <Ionicons name="camera" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imageButtonsRow}>
              <TouchableOpacity
                style={[styles.pickImageBtn, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight }]}
                onPress={() => handlePickImage(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-outline" size={22} color={colors.primary} />
                <Text style={[styles.pickImageText, { color: colors.textPrimary }]}>عکاسی با دوربین</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pickImageBtn, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight }]}
                onPress={() => handlePickImage(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="images-outline" size={22} color={colors.primary} />
                <Text style={[styles.pickImageText, { color: colors.textPrimary }]}>انتخاب از گالری</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Popular Presets Quick Selector with Emojis */}
        <View style={styles.presetsWrapper}>
          <Text style={[styles.presetsTitle, { color: colors.textMuted }]}>
            انتخاب سریع گونه‌های پرطرفدار آپارتمانی:
          </Text>
          <ScrollView
            ref={presetsScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsList}
            onContentSizeChange={() => {
              presetsScrollRef.current?.scrollToEnd({ animated: false });
            }}
          >
            {POPULAR_PLANTS.map((preset, idx) => {
              const baseName = preset.name.split(' ')[0];
              const emoji = PRESET_EMOJIS[baseName] || '🌱';
              return (
                <TouchableOpacity
                  key={`preset_${idx}`}
                  style={[styles.presetChip, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight }]}
                  onPress={() => handleSelectPreset(preset)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.presetEmoji}>{emoji}</Text>
                  <Text style={[styles.presetChipText, { color: colors.textSecondary }]}>{preset.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Form Inputs */}
        <View style={[styles.formCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight }]}>
          {/* Plant Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>نام دلخواه گیاه *</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight, color: colors.textPrimary },
              ]}
              placeholder="مثلاً: پوتوس ابلق پنجره جنوبی"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              textAlign="right"
            />
          </View>

          {/* Scientific Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>نام علمی یا گونه (لاتین)</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight, color: colors.textPrimary },
              ]}
              placeholder="مثلاً: Epipremnum aureum"
              placeholderTextColor={colors.textMuted}
              value={scientificName}
              onChangeText={setScientificName}
              textAlign="right"
            />
          </View>

          {/* Room Selection Grid */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>محل استقرار در خانه</Text>
            <View style={styles.roomChipsGrid}>
              {DEFAULT_ROOMS.map((r) => {
                const isSelected = room === r;
                return (
                  <TouchableOpacity
                    key={`form_room_${r}`}
                    style={[
                      styles.formRoomChip,
                      {
                        backgroundColor: isSelected
                          ? colors.primaryContainer
                          : colors.surfaceContainerLow,
                        borderColor: isSelected ? colors.primary : colors.borderLight,
                      },
                    ]}
                    onPress={() => setRoom(r)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'location-outline'}
                      size={14}
                      color={isSelected ? '#92F7C3' : colors.primary}
                      style={{ marginLeft: 4 }}
                    />
                    <Text
                      style={[
                        styles.formRoomChipText,
                        { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                        isSelected && { fontWeight: '800' },
                      ]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Steppers: Water & Fertilizer */}
          <View style={styles.intervalsBlock}>
            {/* Watering interval */}
            <View style={[styles.intervalCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight }]}>
              <View style={styles.intervalHeader}>
                <View style={styles.intervalTitleRow}>
                  <Ionicons name="water-outline" size={18} color={colors.tertiary} style={{ marginLeft: 6 }} />
                  <Text style={[styles.intervalTitle, { color: colors.textPrimary }]}>سیکل آبیاری</Text>
                </View>
                <View style={[styles.intervalTagPill, { backgroundColor: isDark ? colors.surfaceContainer : '#E0F2FE' }]}>
                  <Text style={[styles.intervalTagText, { color: colors.tertiary }]}>توصیه هوشمند</Text>
                </View>
              </View>

              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={[styles.stepperActionBtn, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight }]}
                  onPress={() => {
                    const v = Math.max(1, (parseInt(wateringDays, 10) || 7) - 1);
                    setWateringDays(String(v));
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={20} color={colors.primary} />
                </TouchableOpacity>

                <View style={styles.stepperDisplay}>
                  <Text style={[styles.stepperDayNumber, { color: colors.primary }]}>{toPersianDigits(wateringDays)}</Text>
                  <Text style={[styles.stepperDayUnit, { color: colors.textMuted }]}>روز یک‌بار</Text>
                </View>

                <TouchableOpacity
                  style={[styles.stepperActionBtn, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight }]}
                  onPress={() => {
                    const v = (parseInt(wateringDays, 10) || 7) + 1;
                    setWateringDays(String(v));
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Fertilizing interval */}
            <View style={[styles.intervalCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight }]}>
              <View style={styles.intervalHeader}>
                <View style={styles.intervalTitleRow}>
                  <Ionicons name="sparkles-outline" size={18} color={colors.fertilizerAmber} style={{ marginLeft: 6 }} />
                  <Text style={[styles.intervalTitle, { color: colors.textPrimary }]}>سیکل کوددهی</Text>
                </View>
                <View style={[styles.intervalTagPill, { backgroundColor: isDark ? colors.surfaceContainer : '#FEF3C7' }]}>
                  <Text style={[styles.intervalTagText, { color: colors.fertilizerAmber }]}>فصل رشد</Text>
                </View>
              </View>

              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={[styles.stepperActionBtn, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight }]}
                  onPress={() => {
                    const v = Math.max(7, (parseInt(fertilizingDays, 10) || 30) - 5);
                    setFertilizingDays(String(v));
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={20} color={colors.primary} />
                </TouchableOpacity>

                <View style={styles.stepperDisplay}>
                  <Text style={[styles.stepperDayNumber, { color: colors.fertilizerAmber }]}>{toPersianDigits(fertilizingDays)}</Text>
                  <Text style={[styles.stepperDayUnit, { color: colors.textMuted }]}>روز یک‌بار</Text>
                </View>

                <TouchableOpacity
                  style={[styles.stepperActionBtn, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight }]}
                  onPress={() => {
                    const v = (parseInt(fertilizingDays, 10) || 30) + 5;
                    setFertilizingDays(String(v));
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Fertilizer Type */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>نوع کود پیشنهادی</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight, color: colors.textPrimary },
              ]}
              placeholder="مثلاً: کود ۲۰-۲۰-۲۰ یا کلات آهن"
              placeholderTextColor={colors.textMuted}
              value={fertilizerType}
              onChangeText={setFertilizerType}
              textAlign="right"
            />
          </View>

          {/* Care Tips */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>نکات نگهداری و نور</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight, color: colors.textPrimary },
              ]}
              placeholder="نکاتی درباره رطوبت، زهکشی خاک و غبارپاشی..."
              placeholderTextColor={colors.textMuted}
              value={careTips}
              onChangeText={setCareTips}
              multiline
              numberOfLines={3}
              textAlign="right"
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primaryContainer }, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#92F7C3" size="small" />
          ) : (
            <View style={styles.saveBtnInner}>
              <Ionicons name="checkmark-circle" size={20} color="#92F7C3" style={{ marginLeft: 6 }} />
              <Text style={styles.saveBtnText}>ذخیره در باغچه من 🌱</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  sheetTopBar: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    marginBottom: 10,
  },
  sheetHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  sheetTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 16.5,
    fontWeight: '800',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 18,
    paddingBottom: 40,
    gap: 14,
  },
  aiBanner: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
  },
  aiBannerHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  aiBannerTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 14,
    fontWeight: '800',
  },
  aiBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  aiBadgeText: {
    fontFamily: 'IRANSansWeb',
    color: '#92F7C3',
    fontSize: 10,
    fontWeight: '800',
  },
  aiBannerDesc: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
    marginBottom: 12,
  },
  aiActionBtn: {
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiActionBtnInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  aiActionBtnText: {
    fontFamily: 'IRANSansWeb',
    color: '#92F7C3',
    fontSize: 13,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  imageSection: {},
  imageButtonsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  pickImageBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 8,
  },
  pickImageText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12.5,
    fontWeight: '700',
  },
  imagePreviewWrapper: {
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changeImageBtn: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  changeImageText: {
    fontFamily: 'IRANSansWeb',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  presetsWrapper: {
    marginVertical: 2,
  },
  presetsTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 8,
  },
  presetsList: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  presetChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  presetEmoji: {
    fontSize: 14,
  },
  presetChipText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
  },
  formCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  inputGroup: {},
  inputLabel: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 6,
  },
  input: {
    fontFamily: 'IRANSansWeb',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  roomChipsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  formRoomChip: {
    width: '31.5%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  formRoomChipText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  intervalsBlock: {
    gap: 12,
  },
  intervalCard: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  intervalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  intervalTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  intervalTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    fontWeight: '800',
  },
  intervalTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  intervalTagText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 10.5,
    fontWeight: '700',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  stepperActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: 'rgba(0,0,0,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  stepperDisplay: {
    alignItems: 'center',
  },
  stepperDayNumber: {
    fontFamily: 'IRANSansWeb',
    fontSize: 20,
    fontWeight: '800',
  },
  stepperDayUnit: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    marginTop: 1,
  },
  saveBtn: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,0,0,0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: 'IRANSansWeb',
    color: '#92F7C3',
    fontSize: 14.5,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
});
