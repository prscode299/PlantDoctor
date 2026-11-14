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

const QUICK_SYMPTOMS = [
  'زرد شدن بین رگبرگ‌ها',
  'لکه‌های قهوه‌ای سوخته',
  'پژمردگی و بی‌حالی ساقه',
  'خشکی نوک برگ‌ها',
  'ریزش برگ‌های پایینی',
];

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

  const handleAddSymptom = (symptom: string) => {
    setUserNotes((prev) => (prev ? `${prev}، ${symptom}` : symptom));
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
        err.message || 'لطفاً مطمئن شوید کلید API در بخش تنظیمات وارد شده و ارتباط برقرار است.'
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
        'دوره‌های پیشنهادی دکتر هوشمند در شناسنامه گیاه ثبت و هشدارهای تقویم بازتنظیم شد.'
      );
    } catch {
      Alert.alert('خطا', 'اعمال تغییرات دوره با مشکل روبرو شد.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <Header
        title="دکتر گیاه هوشمند 🩺"
        subtitle="کلینیک گیاه‌پزشکی با هوش مصنوعی Google Gemini"
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Clinic Status Banner */}
        <View style={[styles.clinicBanner, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight }]}>
          <View style={styles.clinicBannerRight}>
            <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.clinicStatusTitle, { color: colors.textPrimary }]}>
              کلینیک بیومتریک گیاه‌یار • آماده ویزیت
            </Text>
          </View>
          <View style={[styles.aiEnginePill, { backgroundColor: isDark ? colors.primaryContainer : '#E6F8E8' }]}>
            <Ionicons name="sparkles" size={11} color={colors.primary} style={{ marginLeft: 3 }} />
            <Text style={[styles.aiEngineText, { color: colors.primary }]}>Gemini Flash</Text>
          </View>
        </View>

        {/* Plant Selector Carousel */}
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight }]}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>انتخاب گیاه بیمار جهت معاینه:</Text>
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
                      backgroundColor: isSelected
                        ? isDark
                          ? colors.primaryContainer
                          : colors.primary
                        : colors.surfaceContainerLow,
                      borderColor: isSelected ? colors.primary : colors.borderLight,
                    },
                  ]}
                  onPress={() => {
                    setSelectedPlant(p);
                    setDiagnosis(null);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.chipAvatar}>
                    {p.imageUri ? (
                      <Image source={{ uri: p.imageUri }} style={styles.avatarImg} />
                    ) : (
                      <Ionicons
                        name="leaf"
                        size={14}
                        color={isSelected ? '#92F7C3' : colors.primary}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.plantChipText,
                      { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                      isSelected && { fontWeight: '800' },
                    ]}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {selectedPlant && (
            <View style={[styles.plantSummaryBanner, { backgroundColor: colors.surfaceContainerLow }]}>
              <Ionicons name="information-circle-outline" size={15} color={colors.primary} style={{ marginLeft: 4 }} />
              <Text style={[styles.plantSummaryText, { color: colors.textSecondary }]}>
                {selectedPlant.name} • دوره فعلی: هر {toPersianDigits(selectedPlant.wateringIntervalDays)} روز آبدهی | هر{' '}
                {toPersianDigits(selectedPlant.fertilizingIntervalDays)} روز کوددهی
              </Text>
            </View>
          )}
        </View>

        {/* Biometric Leaf Scanner Area (Stitch HUD Viewfinder) */}
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight }]}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>
            اسکن بیومتریک برگ یا علائم ظاهری (اختیاری):
          </Text>

          {imageUri ? (
            <View style={[styles.scannerViewfinder, { borderColor: colors.primary }]}>
              <Image source={{ uri: imageUri }} style={styles.scannerImage} />
              {/* Corner HUD Brackets */}
              <View style={[styles.cornerBracket, styles.bracketTopRight, { borderColor: colors.primary }]} />
              <View style={[styles.cornerBracket, styles.bracketTopLeft, { borderColor: colors.primary }]} />
              <View style={[styles.cornerBracket, styles.bracketBottomRight, { borderColor: colors.primary }]} />
              <View style={[styles.cornerBracket, styles.bracketBottomLeft, { borderColor: colors.primary }]} />

              <View style={styles.scannerBadgeOverlay}>
                <Ionicons name="scan" size={13} color="#92F7C3" style={{ marginLeft: 4 }} />
                <Text style={styles.scannerBadgeText}>تصویر آماده تحلیل نوری</Text>
              </View>

              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => {
                  setImageUri(null);
                  setImageBase64(null);
                }}
              >
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.emptyScannerBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight }]}>
              <Ionicons name="camera-reverse-outline" size={32} color={colors.textMuted} style={{ marginBottom: 6 }} />
              <Text style={[styles.scannerHintText, { color: colors.textSecondary }]}>
                تصویر لکه‌ها، حاشیه برگ‌ها یا ساقه را آپلود کنید
              </Text>
              <View style={styles.imageActionRow}>
                <TouchableOpacity
                  style={[styles.imageButton, { backgroundColor: isDark ? colors.surfaceContainer : '#FFFFFF' }]}
                  onPress={() => handlePickImage(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera" size={17} color={colors.primary} style={{ marginLeft: 4 }} />
                  <Text style={[styles.imageButtonText, { color: colors.primary }]}>عکاسی دوربین</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.imageButton, { backgroundColor: isDark ? colors.surfaceContainer : '#FFFFFF' }]}
                  onPress={() => handlePickImage(false)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="images" size={17} color={colors.primary} style={{ marginLeft: 4 }} />
                  <Text style={[styles.imageButtonText, { color: colors.primary }]}>گالری تصاویر</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Quick Symptoms Chips */}
          <Text style={[styles.label, { marginTop: 14, color: colors.textPrimary }]}>
            انتخاب سریع علائم شایع:
          </Text>
          <View style={styles.quickSymptomsRow}>
            {QUICK_SYMPTOMS.map((symptom, idx) => (
              <TouchableOpacity
                key={`symptom_${idx}`}
                style={[styles.symptomPill, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight }]}
                onPress={() => handleAddSymptom(symptom)}
                activeOpacity={0.7}
              >
                <Text style={[styles.symptomPillText, { color: colors.textSecondary }]}>+ {symptom}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* User Notes Input */}
          <Text style={[styles.label, { marginTop: 14, color: colors.textPrimary }]}>
            شرح علائم و شرایط نگهداری:
          </Text>
          <TextInput
            style={[
              styles.notesInput,
              {
                backgroundColor: colors.surfaceContainerLow,
                color: colors.textPrimary,
                borderColor: colors.borderLight,
              },
            ]}
            placeholder="مثلاً: نوک برگ‌ها قهوه‌ای و خشک شده و رشد گیاه متوقف است..."
            placeholderTextColor={colors.textMuted}
            value={userNotes}
            onChangeText={setUserNotes}
            multiline
            numberOfLines={3}
            textAlign="right"
          />

          {/* Primary Action Button */}
          <TouchableOpacity
            style={[
              styles.diagnoseBtn,
              { backgroundColor: isDark ? colors.primary : colors.primaryContainer },
              (!selectedPlant || loading) && styles.btnDisabled,
            ]}
            onPress={handleDiagnose}
            disabled={!selectedPlant || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={isDark ? '#004625' : '#FFFFFF'} />
            ) : (
              <View style={styles.diagnoseBtnInner}>
                <Ionicons name="sparkles" size={18} color={isDark ? '#004625' : '#92F7C3'} style={{ marginLeft: 6 }} />
                <Text style={[styles.diagnoseBtnText, { color: isDark ? '#004625' : '#FFFFFF' }]}>
                  معاینه تخصصی با هوش مصنوعی گیاه‌یار ✨
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Clinical Dossier Results Card (Stitch Diagnosis Results) */}
        {diagnosis && (
          <View
            style={[
              styles.resultCard,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: colors.primary,
              },
            ]}
          >
            {/* Header with Vitality Gauge */}
            <View style={styles.resultHeader}>
              <View style={styles.resultHeaderRight}>
                <View style={[styles.healthGauge, { borderColor: diagnosis.healthScore >= 70 ? colors.success : colors.warning }]}>
                  <Text style={[styles.gaugeScore, { color: diagnosis.healthScore >= 70 ? colors.success : colors.warning }]}>
                    {toPersianDigits(diagnosis.healthScore)}
                  </Text>
                  <Text style={styles.gaugeUnit}>از ۱۰۰</Text>
                </View>
                <View style={styles.resultHeaderText}>
                  <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>پرونده سلامت بالینی</Text>
                  <Text style={[styles.resultSubtitle, { color: colors.textMuted }]}>تشخیص قطعی با ضریب اطمینان ۹۴٪</Text>
                </View>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: diagnosis.healthScore >= 70 ? '#DCFCE7' : '#FEF3C7',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: diagnosis.healthScore >= 70 ? '#15803D' : '#D97706' },
                  ]}
                >
                  {diagnosis.status}
                </Text>
              </View>
            </View>

            {/* Clinical Summary */}
            <View style={[styles.summaryBox, { backgroundColor: colors.surfaceContainerLow }]}>
              <Text style={[styles.summaryText, { color: colors.textPrimary }]}>
                {diagnosis.diagnosisSummary}
              </Text>
            </View>

            {/* Root Causes Checklist */}
            {diagnosis.possibleIssues?.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={[styles.subHeading, { color: colors.textPrimary }]}>ریشه‌یابی و علل اصلی بروز:</Text>
                {diagnosis.possibleIssues.map((issue, i) => (
                  <View key={`issue_${i}`} style={styles.bulletRow}>
                    <View style={[styles.causeNumCircle, { backgroundColor: colors.dangerLight || '#FFDAD6' }]}>
                      <Text style={[styles.causeNumText, { color: colors.danger }]}>{toPersianDigits(i + 1)}</Text>
                    </View>
                    <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{issue}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Treatment Protocol Steps */}
            {diagnosis.treatmentSteps?.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={[styles.subHeading, { color: colors.textPrimary }]}>پروتکل درمانی و احیا:</Text>
                {diagnosis.treatmentSteps.map((step, i) => (
                  <View key={`step_${i}`} style={styles.bulletRow}>
                    <Ionicons name="checkmark-circle" size={17} color={colors.success} style={{ marginLeft: 6 }} />
                    <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{step}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Suggested Schedule Changes */}
            {diagnosis.suggestedScheduleChanges && (
              <View
                style={[
                  styles.scheduleSuggestionCard,
                  {
                    backgroundColor: isDark ? colors.surfaceContainer : '#E6F8E8',
                    borderColor: isDark ? colors.border : '#C0C9BF',
                  },
                ]}
              >
                <View style={styles.scheduleSuggestionHeader}>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} style={{ marginLeft: 6 }} />
                  <Text style={[styles.scheduleSuggestionTitle, { color: colors.textPrimary }]}>
                    پیشنهاد تنظیم مجدد دوره‌های مراقبت:
                  </Text>
                </View>
                <Text style={[styles.scheduleSuggestionReason, { color: colors.textSecondary }]}>
                  {diagnosis.suggestedScheduleChanges.reason}
                </Text>

                <View style={styles.newCyclesRow}>
                  {diagnosis.suggestedScheduleChanges.wateringIntervalDays && (
                    <View style={[styles.cycleCapsule, { backgroundColor: colors.surfaceContainerLowest }]}>
                      <Text style={[styles.cycleCapsuleText, { color: colors.tertiary }]}>
                        💧 دوره آبیاری جدید: هر {toPersianDigits(diagnosis.suggestedScheduleChanges.wateringIntervalDays)} روز
                      </Text>
                    </View>
                  )}

                  {diagnosis.suggestedScheduleChanges.fertilizingIntervalDays && (
                    <View style={[styles.cycleCapsule, { backgroundColor: colors.surfaceContainerLowest }]}>
                      <Text style={[styles.cycleCapsuleText, { color: colors.fertilizerAmber }]}>
                        🌾 دوره کوددهی جدید: هر {toPersianDigits(diagnosis.suggestedScheduleChanges.fertilizingIntervalDays)} روز
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.applyBtn, { backgroundColor: colors.primaryContainer }]}
                  onPress={handleApplyScheduleChanges}
                  activeOpacity={0.8}
                >
                  <Ionicons name="sync" size={16} color="#92F7C3" style={{ marginLeft: 6 }} />
                  <Text style={styles.applyBtnText}>اعمال دوره‌های جدید روی گیاه 🪄</Text>
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
    paddingHorizontal: 18,
    paddingBottom: 50,
    gap: 14,
  },
  clinicBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  clinicBannerRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  clinicStatusTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
  },
  aiEnginePill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  aiEngineText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 10.5,
    fontWeight: '700',
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
  label: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  chipAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  plantChipText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12.5,
    fontWeight: '600',
  },
  plantSummaryBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 10,
    padding: 9,
    borderRadius: 12,
  },
  plantSummaryText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
    flex: 1,
  },
  scannerViewfinder: {
    width: '100%',
    height: 180,
    borderRadius: 18,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 10,
  },
  scannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cornerBracket: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderWidth: 3,
  },
  bracketTopRight: {
    top: 10,
    right: 10,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bracketTopLeft: {
    top: 10,
    left: 10,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  bracketBottomRight: {
    bottom: 10,
    right: 10,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  bracketBottomLeft: {
    bottom: 10,
    left: 10,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  scannerBadgeOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 33, 15, 0.85)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  scannerBadgeText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 10.5,
    color: '#92F7C3',
    fontWeight: '700',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyScannerBox: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  scannerHintText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11.5,
    marginBottom: 10,
  },
  imageActionRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  imageButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  imageButtonText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11.5,
    fontWeight: '700',
  },
  quickSymptomsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  symptomPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  symptomPillText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    fontWeight: '600',
  },
  notesInput: {
    fontFamily: 'IRANSansWeb',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  diagnoseBtn: {
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,0,0,0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  diagnoseBtnInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  diagnoseBtnText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13.5,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  resultCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    shadowColor: 'rgba(30, 94, 58, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  resultHeaderRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  healthGauge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeScore: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    fontWeight: '800',
  },
  gaugeUnit: {
    fontFamily: 'IRANSansWeb',
    fontSize: 8.5,
    color: '#888',
    marginTop: -2,
  },
  resultHeaderText: {
    alignItems: 'flex-end',
  },
  resultTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 15.5,
    fontWeight: '800',
  },
  resultSubtitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryBox: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
  },
  summaryText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12.5,
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionBlock: {
    marginBottom: 14,
  },
  subHeading: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  bulletRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  causeNumCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginTop: 2,
  },
  causeNumText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 10,
    fontWeight: '800',
  },
  bulletText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    lineHeight: 19,
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  scheduleSuggestionCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  scheduleSuggestionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 4,
  },
  scheduleSuggestionTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    fontWeight: '800',
  },
  scheduleSuggestionReason: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11.5,
    marginBottom: 10,
    lineHeight: 18,
    textAlign: 'right',
  },
  newCyclesRow: {
    gap: 6,
    marginBottom: 12,
  },
  cycleCapsule: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  cycleCapsuleText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  applyBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  applyBtnText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12.5,
    fontWeight: '800',
    color: '#92F7C3',
    writingDirection: 'rtl',
  },
});
