import React, { useState, useEffect, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Plant } from '@/types/plant';
import { AiDiagnosisResponse } from '@/types/ai';
import { db } from '@/services/storage/database';
import { aiService } from '@/services/ai/geminiService';
import { notificationService } from '@/services/notifications/notificationService';
import { useTheme } from '@/context/ThemeContext';
import { Header } from '@/components/ui/Header';
import { toPersianDigits } from '@/utils/jalali';

export default function AiDoctorScreen() {
  const { colors, isDark } = useTheme();
  const doctorScrollRef = useRef<ScrollView>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<AiDiagnosisResponse | null>(null);

  useEffect(() => {
    async function load() {
      const list = await db.getPlants();
      setPlants(list);
      if (list.length > 0 && !selectedPlant) {
        setSelectedPlant(list[0]);
      }
    }
    load();
  }, []);

  const handlePickImage = async (fromCamera = false) => {
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
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
      Alert.alert('خطا', 'امکان دریافت تصویر وجود نداشت.');
    }
  };

  const handleDiagnose = async () => {
    if (!selectedPlant) {
      Alert.alert('توجه', 'لطفاً ابتدا یک گیاه را انتخاب کنید.');
      return;
    }

    setLoading(true);
    setDiagnosis(null);

    try {
      const result = await aiService.diagnosePlantHealth(
        selectedPlant,
        userNotes,
        imageBase64 || undefined
      );
      setDiagnosis(result);
    } catch (err: any) {
      Alert.alert(
        'خطا در تحلیل هوش مصنوعی',
        err.message || 'لطفاً مطمئن شوید کلید API در بخش تنظیمات وارد شده و به اینترنت متصل هستید.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApplyScheduleChanges = async () => {
    if (!selectedPlant || !diagnosis?.suggestedScheduleChanges) return;

    try {
      const changes = diagnosis.suggestedScheduleChanges;
      const updated: Plant = {
        ...selectedPlant,
        wateringIntervalDays:
          changes.wateringIntervalDays !== null && changes.wateringIntervalDays !== undefined
            ? changes.wateringIntervalDays
            : selectedPlant.wateringIntervalDays,
        fertilizingIntervalDays:
          changes.fertilizingIntervalDays !== null && changes.fertilizingIntervalDays !== undefined
            ? changes.fertilizingIntervalDays
            : selectedPlant.fertilizingIntervalDays,
      };

      await db.savePlant(updated);
      setSelectedPlant(updated);

      const all = await db.getPlants();
      await notificationService.syncAllPlantNotifications(all);

      Alert.alert(
        'تغییرات اعمال شد! ✨',
        'دوره آبیاری و کوددهی پیشنهادی دکتر هوش مصنوعی در پروفایل گیاه ذخیره و زمان‌بندی هشدارها بروزرسانی شد.'
      );
    } catch {
      Alert.alert('خطا', 'اعمال تغییرات دوره با مشکل روبرو شد.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <Header
        title="دکتر گیاه هوشمند 🩺"
        subtitle="تشخیص بیماری، تحلیل علائم ظاهری و تنظیم دوره‌ها"
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Plant Selection Section */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>کدام گیاه را می‌خواهید ویزیت کنید؟</Text>
          <ScrollView
            ref={doctorScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.plantChipsList}
            onContentSizeChange={() => {
              doctorScrollRef.current?.scrollToEnd({ animated: false });
            }}
          >
            {plants.map((p) => {
              const isSelected = selectedPlant?.id === p.id;
              return (
                <TouchableOpacity
                  key={`plant_sel_${p.id}`}
                  style={[
                    styles.plantChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                      borderColor: isSelected ? colors.primary : colors.borderLight,
                    },
                  ]}
                  onPress={() => {
                    setSelectedPlant(p);
                    setDiagnosis(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.plantChipText,
                      { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                      isSelected && { fontWeight: '800' },
                    ]}
                  >
                    {p.name}
                  </Text>
                  <Ionicons
                    name="leaf"
                    size={14}
                    color={isSelected ? '#FFFFFF' : colors.primary}
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {selectedPlant && (
            <View style={[styles.plantSummaryBanner, { backgroundColor: colors.surfaceSubtle }]}>
              <Text style={[styles.plantSummaryText, { color: colors.textSecondary }]}>
                دوره فعلی: هر {toPersianDigits(selectedPlant.wateringIntervalDays)} روز آبدهی | هر{' '}
                {toPersianDigits(selectedPlant.fertilizingIntervalDays)} روز کوددهی
              </Text>
            </View>
          )}
        </View>

        {/* Image Attachment & Symptom Input */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>
            تصویر برگ یا علائم بیماری (اختیاری ولی توصیه می‌شود)
          </Text>
          <View style={styles.imageActionRow}>
            <TouchableOpacity
              style={[styles.imageButton, { backgroundColor: colors.primarySubtle }]}
              onPress={() => handlePickImage(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={20} color={colors.primary} />
              <Text style={[styles.imageButtonText, { color: colors.primaryDark }]}>عکاسی با دوربین</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.imageButton, { backgroundColor: colors.primarySubtle }]}
              onPress={() => handlePickImage(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="images" size={20} color={colors.primary} />
              <Text style={[styles.imageButtonText, { color: colors.primaryDark }]}>انتخاب از گالری</Text>
            </TouchableOpacity>
          </View>

          {imageUri && (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => {
                  setImageUri(null);
                  setImageBase64(null);
                }}
              >
                <Ionicons name="close-circle" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          <Text style={[styles.label, { marginTop: 14, color: colors.textPrimary }]}>
            شرح علائم و شرایط (مثلاً: زرد شدن نوک برگ‌ها، لکه سفید، پژمردگی...)
          </Text>
          <TextInput
            style={[
              styles.notesInput,
              {
                backgroundColor: colors.background,
                color: colors.textPrimary,
                borderColor: colors.borderLight,
              },
            ]}
            placeholder="علائمی که مشاهده کردید را بنویسید..."
            placeholderTextColor={colors.textMuted}
            value={userNotes}
            onChangeText={setUserNotes}
            multiline
            numberOfLines={3}
            textAlign="right"
          />

          <TouchableOpacity
            style={[
              styles.diagnoseBtn,
              { backgroundColor: colors.primary },
              (!selectedPlant || loading) && styles.btnDisabled,
            ]}
            onPress={handleDiagnose}
            disabled={!selectedPlant || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                <Text style={styles.diagnoseBtnText}>شروع ویزیت و تحلیل سلامت با هوش مصنوعی</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Diagnosis Results Card */}
        {diagnosis && (
          <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.primarySubtle }]}>
            <View style={styles.resultHeader}>
              <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>نتایج تشخیص دکتر گیاه 🩺</Text>
              <View
                style={[
                  styles.statusBadge,
                  diagnosis.healthScore >= 70 ? styles.statusBadgeGood : styles.statusBadgeWarn,
                ]}
              >
                <Text style={styles.statusBadgeText}>{diagnosis.status}</Text>
              </View>
            </View>

            {/* Score */}
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>امتیاز شادابی گیاه:</Text>
              <Text style={[styles.scoreNumber, { color: colors.primary }]}>{toPersianDigits(diagnosis.healthScore)} از ۱۰۰</Text>
            </View>

            {/* Summary */}
            <Text style={[styles.summaryText, { color: colors.textPrimary }]}>{diagnosis.diagnosisSummary}</Text>

            {/* Possible Issues */}
            {diagnosis.possibleIssues?.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={[styles.subHeading, { color: colors.textPrimary }]}>علل احتمالی مشکل:</Text>
                {diagnosis.possibleIssues.map((issue, i) => (
                  <View key={`issue_${i}`} style={styles.bulletRow}>
                    <Ionicons name="alert-circle-outline" size={15} color={colors.terracotta} style={{ marginLeft: 6 }} />
                    <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{issue}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Treatment Steps */}
            {diagnosis.treatmentSteps?.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={[styles.subHeading, { color: colors.textPrimary }]}>برنامه درمانی و مراقبتی:</Text>
                {diagnosis.treatmentSteps.map((step, i) => (
                  <View key={`step_${i}`} style={styles.bulletRow}>
                    <Ionicons name="checkmark-circle-outline" size={15} color={colors.primary} style={{ marginLeft: 6 }} />
                    <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{step}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Suggested Schedule Changes */}
            {diagnosis.suggestedScheduleChanges && (
              <View style={[styles.scheduleSuggestionCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderLight }]}>
                <Text style={[styles.scheduleSuggestionTitle, { color: colors.primaryDark }]}>
                  💡 پیشنهاد تغییر دوره آبدهی یا کوددهی:
                </Text>
                <Text style={[styles.scheduleSuggestionReason, { color: colors.textMuted }]}>
                  {diagnosis.suggestedScheduleChanges.reason}
                </Text>

                {diagnosis.suggestedScheduleChanges.wateringIntervalDays && (
                  <Text style={[styles.scheduleSuggestionItem, { color: colors.waterBlue }]}>
                    • فاصله آبیاری جدید: هر {toPersianDigits(diagnosis.suggestedScheduleChanges.wateringIntervalDays)} روز
                  </Text>
                )}

                {diagnosis.suggestedScheduleChanges.fertilizingIntervalDays && (
                  <Text style={[styles.scheduleSuggestionItem, { color: colors.waterBlue }]}>
                    • فاصله کوددهی جدید: هر {toPersianDigits(diagnosis.suggestedScheduleChanges.fertilizingIntervalDays)} روز
                  </Text>
                )}

                <TouchableOpacity
                  style={[styles.applyBtn, { backgroundColor: colors.primary }]}
                  onPress={handleApplyScheduleChanges}
                  activeOpacity={0.8}
                >
                  <Ionicons name="sync" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  <Text style={styles.applyBtnText}>اعمال دوره‌های جدید روی گیاه</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
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
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
  },
  label: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  plantChipsList: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingVertical: 4,
  },
  plantChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  plantChipText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    fontWeight: '600',
  },
  plantSummaryBanner: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
  },
  plantSummaryText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    textAlign: 'right',
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  imageActionRow: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  imageButtonText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  previewContainer: {
    marginTop: 10,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    height: 160,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  notesInput: {
    fontFamily: 'IRANSansWeb',
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    borderWidth: 1,
    textAlignVertical: 'top',
    minHeight: 75,
    writingDirection: 'rtl',
  },
  diagnoseBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 14,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  diagnoseBtnText: {
    fontFamily: 'IRANSansWeb',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  resultCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
  },
  resultHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 15,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeGood: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusBadgeWarn: {
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
  },
  statusBadgeText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  scoreRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  scoreLabel: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    writingDirection: 'rtl',
  },
  scoreNumber: {
    fontFamily: 'IRANSansWeb',
    fontSize: 16,
    fontWeight: '900',
  },
  summaryText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: 14,
    writingDirection: 'rtl',
  },
  sectionBlock: {
    marginBottom: 14,
  },
  subHeading: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 6,
    writingDirection: 'rtl',
  },
  bulletRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bulletText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    textAlign: 'right',
    flex: 1,
    lineHeight: 18,
    writingDirection: 'rtl',
  },
  scheduleSuggestionCard: {
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
  },
  scheduleSuggestionTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  scheduleSuggestionReason: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    textAlign: 'right',
    marginVertical: 4,
    writingDirection: 'rtl',
  },
  scheduleSuggestionItem: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    marginVertical: 6,
    writingDirection: 'rtl',
  },
  applyBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  applyBtnText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    writingDirection: 'rtl',
  },
});
