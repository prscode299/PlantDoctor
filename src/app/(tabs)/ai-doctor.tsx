import React, { useState, useEffect } from 'react';
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
import Colors from '@/constants/colors';
import { Header } from '@/components/ui/Header';
import { toPersianDigits } from '@/utils/jalali';

export default function AiDoctorScreen() {
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
    } catch (e) {
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
          changes.wateringIntervalDays ?? selectedPlant.wateringIntervalDays,
        fertilizingIntervalDays:
          changes.fertilizingIntervalDays ?? selectedPlant.fertilizingIntervalDays,
      };

      await db.savePlant(updated);
      setSelectedPlant(updated);
      const allPlants = await db.getPlants();
      await notificationService.syncAllPlantNotifications(allPlants);

      Alert.alert(
        'تنظیمات اعمال شد! ✨',
        'دوره‌های آبیاری و کوددهی گیاه با توجه به پیشنهاد هوش مصنوعی اصلاح شدند و هشدارهای جدید ثبت گردیدند.'
      );
    } catch (e) {
      Alert.alert('خطا', 'ثبت تغییرات با مشکل مواجه شد.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="دکتر گیاه هوشمند 🩺"
        subtitle="تشخیص بیماری، تحلیل علائم ظاهری و تنظیم دوره‌ها"
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Plant Selection Section */}
        <View style={styles.card}>
          <Text style={styles.label}>کدام گیاه را می‌خواهید ویزیت کنید؟</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.plantChipsList}
          >
            {plants.map((p) => {
              const isSelected = selectedPlant?.id === p.id;
              return (
                <TouchableOpacity
                  key={`plant_sel_${p.id}`}
                  style={[styles.plantChip, isSelected && styles.plantChipActive]}
                  onPress={() => {
                    setSelectedPlant(p);
                    setDiagnosis(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.plantChipText, isSelected && styles.plantChipTextActive]}>
                    {p.name}
                  </Text>
                  <Ionicons
                    name="leaf"
                    size={14}
                    color={isSelected ? '#FFFFFF' : Colors.primary}
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {selectedPlant && (
            <View style={styles.plantSummaryBanner}>
              <Text style={styles.plantSummaryText}>
                دوره فعلی: هر {toPersianDigits(selectedPlant.wateringIntervalDays)} روز آبدهی | هر{' '}
                {toPersianDigits(selectedPlant.fertilizingIntervalDays)} روز کوددهی
              </Text>
            </View>
          )}
        </View>

        {/* Image Attachment & Symptom Input */}
        <View style={styles.card}>
          <Text style={styles.label}>تصویر برگ یا علائم بیماری (اختیاری ولی توصیه می‌شود)</Text>
          <View style={styles.imageActionRow}>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={() => handlePickImage(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={20} color={Colors.primary} />
              <Text style={styles.imageButtonText}>عکاسی با دوربین</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imageButton}
              onPress={() => handlePickImage(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="images" size={20} color={Colors.primary} />
              <Text style={styles.imageButtonText}>انتخاب از گالری</Text>
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

          <Text style={[styles.label, { marginTop: 14 }]}>
            شرح علائم و شرایط (مثلاً: زرد شدن نوک برگ‌ها، لکه سفید، پژمردگی...)
          </Text>
          <TextInput
            style={styles.notesInput}
            placeholder="علائمی که مشاهده کردید را بنویسید..."
            placeholderTextColor={Colors.textMuted}
            value={userNotes}
            onChangeText={setUserNotes}
            multiline
            numberOfLines={3}
            textAlign="right"
          />

          <TouchableOpacity
            style={[styles.diagnoseBtn, loading && styles.btnDisabled]}
            onPress={handleDiagnose}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.diagnoseBtnText}>ویزیت و تحلیل هوشمند ✨</Text>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Diagnosis Results Card */}
        {diagnosis && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View
                style={[
                  styles.statusBadge,
                  diagnosis.status === 'عالی' || diagnosis.status === 'خوب'
                    ? styles.statusBadgeGood
                    : styles.statusBadgeWarn,
                ]}
              >
                <Text style={styles.statusBadgeText}>وضعیت: {diagnosis.status}</Text>
              </View>
              <Text style={styles.resultTitle}>گزارش کلینیکی گیاه‌پزشک 🩺</Text>
            </View>

            {/* Health Score */}
            <View style={styles.scoreRow}>
              <Text style={styles.scoreNumber}>{toPersianDigits(diagnosis.healthScore)} / ۱۰۰</Text>
              <Text style={styles.scoreLabel}>امتیاز شادابی و سلامت:</Text>
            </View>

            {/* Diagnosis Summary */}
            <Text style={styles.summaryText}>{diagnosis.diagnosisSummary}</Text>

            {/* Possible Issues */}
            {diagnosis.possibleIssues?.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.subHeading}>⚠️ مشکلات و تنش‌های احتمالی:</Text>
                {diagnosis.possibleIssues.map((issue, idx) => (
                  <View key={`issue_${idx}`} style={styles.bulletRow}>
                    <Text style={styles.bulletText}>{issue}</Text>
                    <Ionicons name="alert-circle-outline" size={14} color={Colors.terracotta} style={{ marginLeft: 4 }} />
                  </View>
                ))}
              </View>
            )}

            {/* Treatment Steps */}
            {diagnosis.treatmentSteps?.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.subHeading}>💊 اقدامات و درمان پیشنهادی:</Text>
                {diagnosis.treatmentSteps.map((step, idx) => (
                  <View key={`step_${idx}`} style={styles.bulletRow}>
                    <Text style={styles.bulletText}>{step}</Text>
                    <Ionicons name="checkmark-done" size={14} color={Colors.primary} style={{ marginLeft: 4 }} />
                  </View>
                ))}
              </View>
            )}

            {/* Schedule Changes Suggestion */}
            {diagnosis.suggestedScheduleChanges && (
              <View style={styles.scheduleSuggestionCard}>
                <Text style={styles.scheduleSuggestionTitle}>
                  💡 پیشنهاد اصلاح دوره‌ها متناسب با فصل و شرایط:
                </Text>
                <Text style={styles.scheduleSuggestionReason}>
                  {diagnosis.suggestedScheduleChanges.reason}
                </Text>

                {diagnosis.suggestedScheduleChanges.wateringIntervalDays && (
                  <Text style={styles.scheduleSuggestionItem}>
                    💧 دوره جدید آبیاری: هر{' '}
                    {toPersianDigits(diagnosis.suggestedScheduleChanges.wateringIntervalDays)} روز یک‌بار
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={handleApplyScheduleChanges}
                  activeOpacity={0.8}
                >
                  <Text style={styles.applyBtnText}>اعمال پیشنهاد روی تنظیمات گیاه</Text>
                  <Ionicons name="refresh-circle" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
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
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 10,
  },
  plantChipsList: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingBottom: 4,
  },
  plantChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  plantChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  plantChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  plantChipTextActive: {
    color: '#FFFFFF',
  },
  plantSummaryBanner: {
    backgroundColor: Colors.primarySubtle,
    borderRadius: 10,
    padding: 8,
    marginTop: 10,
  },
  plantSummaryText: {
    fontSize: 11,
    color: Colors.primaryDark,
    textAlign: 'right',
    fontWeight: '600',
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
    backgroundColor: Colors.primarySubtle,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  imageButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
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
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    textAlignVertical: 'top',
    minHeight: 75,
  },
  diagnoseBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 14,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  diagnoseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: Colors.primarySubtle,
  },
  resultHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeGood: {
    backgroundColor: Colors.primarySubtle,
  },
  statusBadgeWarn: {
    backgroundColor: Colors.terracottaLight,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  scoreRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  scoreLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  scoreNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
  },
  summaryText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: 14,
  },
  sectionBlock: {
    marginBottom: 14,
  },
  subHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 6,
  },
  bulletRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bulletText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    flex: 1,
    lineHeight: 18,
  },
  scheduleSuggestionCard: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  scheduleSuggestionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
    textAlign: 'right',
  },
  scheduleSuggestionReason: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'right',
    marginVertical: 4,
  },
  scheduleSuggestionItem: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.waterBlue,
    textAlign: 'right',
    marginVertical: 6,
  },
  applyBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  applyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
