import React, { useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Plant, PlantPreset } from '@/types/plant';
import { db } from '@/services/storage/database';
import { aiService } from '@/services/ai/geminiService';
import { notificationService } from '@/services/notifications/notificationService';
import Colors from '@/constants/colors';
import { POPULAR_PLANTS, DEFAULT_ROOMS } from '@/constants/presets';
import { addDays, getTodayIso, toPersianDigits } from '@/utils/jalali';

export default function AddPlantScreen() {
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
    <SafeAreaView style={styles.safeArea}>
      {/* Navigation Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>افزودن گیاه جدید 🌱</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Magic AI Setup Banner */}
        <View style={styles.aiBanner}>
          <View style={styles.aiBannerHeader}>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>هوشمند ✨</Text>
            </View>
            <Text style={styles.aiBannerTitle}>تنظیم خودکار با هوش مصنوعی</Text>
          </View>
          <Text style={styles.aiBannerDesc}>
            عکس گیاه را بگیرید یا نام آن را بنویسید و دکمه زیر را لمس کنید تا تمام دوره‌های آبیاری و نیازمندی‌ها خودکار استخراج شوند.
          </Text>

          <TouchableOpacity
            style={[styles.aiActionBtn, aiLoading && styles.btnDisabled]}
            onPress={handleMagicAiSetup}
            disabled={aiLoading}
            activeOpacity={0.8}
          >
            {aiLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.aiActionBtnText}>استخراج خودکار تنظیمات با AI 🪄</Text>
                <Ionicons name="sparkles" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Image Picker */}
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
                style={styles.pickImageBtn}
                onPress={() => handlePickImage(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="camera" size={22} color={Colors.primary} />
                <Text style={styles.pickImageText}>عکاسی از گیاه</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pickImageBtn}
                onPress={() => handlePickImage(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="images" size={22} color={Colors.primary} />
                <Text style={styles.pickImageText}>انتخاب از گالری</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Popular Presets Quick Selector */}
        <View style={styles.presetsWrapper}>
          <Text style={styles.presetsTitle}>یا انتخاب سریع از گیاهان پرطرفدار خانگی:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsList}
          >
            {POPULAR_PLANTS.map((preset, idx) => (
              <TouchableOpacity
                key={`preset_${idx}`}
                style={styles.presetChip}
                onPress={() => handleSelectPreset(preset)}
                activeOpacity={0.7}
              >
                <Text style={styles.presetChipText}>{preset.name.split(' ')[0]}</Text>
                <Ionicons name="leaf" size={13} color={Colors.primary} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Form Inputs */}
        <View style={styles.formCard}>
          {/* Plant Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>نام گیاه (فارسی / دلخواه) *</Text>
            <TextInput
              style={styles.input}
              placeholder="مثلاً: پوتوس ابلق من"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
              textAlign="right"
            />
          </View>

          {/* Scientific Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>نام علمی (لاتین)</Text>
            <TextInput
              style={styles.input}
              placeholder="مثلاً: Epipremnum aureum"
              placeholderTextColor={Colors.textMuted}
              value={scientificName}
              onChangeText={setScientificName}
              textAlign="right"
            />
          </View>

          {/* Room Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>محل قرارگیری در منزل</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.roomChipsRow}
            >
              {DEFAULT_ROOMS.map((r) => {
                const isSelected = room === r;
                return (
                  <TouchableOpacity
                    key={`form_room_${r}`}
                    style={[styles.formRoomChip, isSelected && styles.formRoomChipSelected]}
                    onPress={() => setRoom(r)}
                  >
                    <Text
                      style={[
                        styles.formRoomChipText,
                        isSelected && styles.formRoomChipTextSelected,
                      ]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Intervals: Water & Fertilizer */}
          <View style={styles.intervalsRow}>
            {/* Fertilizing interval */}
            <View style={styles.intervalBox}>
              <Text style={styles.intervalLabel}>کوددهی (هر چند روز)</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => {
                    const v = Math.max(7, (parseInt(fertilizingDays, 10) || 30) - 5);
                    setFertilizingDays(String(v));
                  }}
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.intervalInput}
                  value={fertilizingDays}
                  onChangeText={setFertilizingDays}
                  keyboardType="numeric"
                  textAlign="center"
                />
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => {
                    const v = (parseInt(fertilizingDays, 10) || 30) + 5;
                    setFertilizingDays(String(v));
                  }}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Watering interval */}
            <View style={styles.intervalBox}>
              <Text style={styles.intervalLabel}>آبیاری (هر چند روز)</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => {
                    const v = Math.max(1, (parseInt(wateringDays, 10) || 7) - 1);
                    setWateringDays(String(v));
                  }}
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.intervalInput}
                  value={wateringDays}
                  onChangeText={setWateringDays}
                  keyboardType="numeric"
                  textAlign="center"
                />
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => {
                    const v = (parseInt(wateringDays, 10) || 7) + 1;
                    setWateringDays(String(v));
                  }}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Fertilizer Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>نوع کود پیشنهادی</Text>
            <TextInput
              style={styles.input}
              placeholder="مثلاً: کود ۲۰-۲۰-۲۰ یا آهن"
              placeholderTextColor={Colors.textMuted}
              value={fertilizerType}
              onChangeText={setFertilizerType}
              textAlign="right"
            />
          </View>

          {/* Care Tips */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>نکات طلایی مراقبت</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="نکاتی درباره رطوبت، زهکشی خاک و غبارپاشی..."
              placeholderTextColor={Colors.textMuted}
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
          style={[styles.saveBtn, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.saveBtnText}>ذخیره و ثبت گیاه در باغچه 🌱</Text>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 6,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  aiBanner: {
    backgroundColor: Colors.primarySubtle,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
  },
  aiBannerHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  aiBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  aiBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  aiBannerDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    textAlign: 'right',
    marginBottom: 12,
  },
  aiActionBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryDark,
    paddingVertical: 11,
    borderRadius: 14,
  },
  aiActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
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
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
    gap: 8,
  },
  pickImageText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
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
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  presetsWrapper: {
    marginVertical: 4,
  },
  presetsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
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
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
  },
  inputGroup: {},
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  roomChipsRow: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  formRoomChip: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  formRoomChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  formRoomChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  formRoomChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  intervalsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  intervalBox: {
    flex: 1,
  },
  intervalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  stepBtn: {
    width: 38,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceSubtle,
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  intervalInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  saveBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 18,
    marginTop: 6,
    shadowColor: Colors.shadowHeavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
