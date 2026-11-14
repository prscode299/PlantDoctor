import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Plant, CareLog } from '@/types/plant';
import { db } from '@/services/storage/database';
import { notificationService } from '@/services/notifications/notificationService';
import { useTheme } from '@/context/ThemeContext';
import { DEFAULT_ROOMS } from '@/constants/presets';
import { formatToJalali, getRelativeJalaliLabel, toPersianDigits } from '@/utils/jalali';

export default function PlantDetailScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [logs, setLogs] = useState<CareLog[]>([]);

  // Snooze Modal State
  const [isSnoozeModalVisible, setIsSnoozeModalVisible] = useState(false);
  const [snoozeDays, setSnoozeDays] = useState(2);

  // Edit Plant Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editScientificName, setEditScientificName] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [editWateringDays, setEditWateringDays] = useState('7');
  const [editFertilizingDays, setEditFertilizingDays] = useState('30');
  const [editFertilizerType, setEditFertilizerType] = useState('');
  const [editLight, setEditLight] = useState('');
  const [editSoil, setEditSoil] = useState('');
  const [editTips, setEditTips] = useState('');
  const [editToxicity, setEditToxicity] = useState('');
  const [editImageUri, setEditImageUri] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    const p = await db.getPlantById(id);
    if (p) {
      setPlant(p);
      const plantLogs = await db.getCareLogs(id);
      setLogs(plantLogs);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!plant) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>در حال بارگذاری شناسنامه گیاه...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const waterStatus = getRelativeJalaliLabel(plant.nextWateringDate);
  const fertStatus = getRelativeJalaliLabel(plant.nextFertilizingDate);
  const isWaterDue = waterStatus.isToday || waterStatus.isOverdue;

  const handleWater = async () => {
    try {
      const updated = await db.waterPlant(plant.id);
      if (updated) {
        setPlant(updated);
        await loadData();
        const all = await db.getPlants();
        await notificationService.syncAllPlantNotifications(all);
        Alert.alert('سیراب شد! 💧', 'آبیاری گیاه با موفقیت ثبت و نوبت بعدی در تقویم تنظیم شد.');
      }
    } catch {
      Alert.alert('خطا', 'ثبت آبیاری ناموفق بود.');
    }
  };

  const handleFertilize = async () => {
    try {
      const updated = await db.fertilizePlant(plant.id);
      if (updated) {
        setPlant(updated);
        await loadData();
        const all = await db.getPlants();
        await notificationService.syncAllPlantNotifications(all);
        Alert.alert('تغذیه شد! 🌿', 'کوددهی با موفقیت ثبت شد.');
      }
    } catch {
      Alert.alert('خطا', 'ثبت کوددهی با مشکل مواجه شد.');
    }
  };

  // Open Snooze Dialog
  const handleOpenSnooze = () => {
    setSnoozeDays(2);
    setIsSnoozeModalVisible(true);
  };

  const handleConfirmSnooze = async () => {
    try {
      const updated = await db.snoozeWatering(plant.id, snoozeDays);
      if (updated) {
        setPlant(updated);
        const all = await db.getPlants();
        await notificationService.syncAllPlantNotifications(all);
        setIsSnoozeModalVisible(false);
        Alert.alert('به تعویق افتاد ⏳', `موعد آبیاری ${toPersianDigits(snoozeDays)} روز به جلو انداخته شد.`);
      }
    } catch {
      Alert.alert('خطا', 'عملیات با خطا مواجه شد.');
    }
  };

  // Open Edit Plant Modal
  const handleOpenEdit = () => {
    setEditName(plant.name);
    setEditScientificName(plant.scientificName || '');
    setEditRoom(plant.room || DEFAULT_ROOMS[0]);
    setEditWateringDays(String(plant.wateringIntervalDays));
    setEditFertilizingDays(String(plant.fertilizingIntervalDays));
    setEditFertilizerType(plant.fertilizerType || '');
    setEditLight(plant.lightRequirement || '');
    setEditSoil(plant.soilType || '');
    setEditTips(plant.careTips || '');
    setEditToxicity(plant.toxicity || '');
    setEditImageUri(plant.imageUri || null);
    setIsEditModalVisible(true);
  };

  const handlePickEditImage = async (fromCamera = false) => {
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      };
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets[0]) {
        setEditImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('خطا', 'امکان تغییر تصویر وجود نداشت.');
    }
  };

  const handleSavePlantEdits = async () => {
    if (!editName.trim()) {
      Alert.alert('توجه', 'لطفاً نام گیاه را وارد کنید.');
      return;
    }

    try {
      const updatedPlant: Plant = {
        ...plant,
        name: editName.trim(),
        scientificName: editScientificName.trim() || 'گونه آپارتمانی',
        room: editRoom,
        wateringIntervalDays: parseInt(editWateringDays, 10) || 7,
        fertilizingIntervalDays: parseInt(editFertilizingDays, 10) || 30,
        fertilizerType: editFertilizerType.trim(),
        lightRequirement: editLight.trim(),
        soilType: editSoil.trim(),
        careTips: editTips.trim(),
        toxicity: editToxicity.trim(),
        imageUri: editImageUri || undefined,
        updatedAt: new Date().toISOString(),
      };

      await db.savePlant(updatedPlant);
      setPlant(updatedPlant);
      const all = await db.getPlants();
      await notificationService.syncAllPlantNotifications(all);
      setIsEditModalVisible(false);
      Alert.alert('ذخیره شد ✨', 'تغییرات مشخصات گلدان با موفقیت ثبت شد.');
    } catch {
      Alert.alert('خطا', 'ذخیره تغییرات با مشکل روبرو شد.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'حذف گلدان',
      `آیا از حذف «${plant.name}» از باغچه مطمئن هستید؟`,
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            await db.deletePlant(plant.id);
            const all = await db.getPlants();
            await notificationService.syncAllPlantNotifications(all);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Navbar with Edit & Delete */}
      <View style={[styles.navbar, { borderBottomColor: colors.borderLight }]}>
        <View style={styles.navActionsRow}>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: colors.surfaceContainerLow }]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: colors.surfaceContainerLow }]}
            onPress={handleOpenEdit}
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.navTitleCol}>
          <Text style={[styles.navTitle, { color: colors.textPrimary }]}>{plant.name}</Text>
          <Text style={[styles.navCode, { color: colors.textMuted }]}>
            شناسنامه زیستی گلدان #{toPersianDigits(plant.id.slice(0, 4))}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: colors.surfaceContainerLow }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, 20) + 30 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Immersive Hero Banner (32px bottom radius) */}
        <View style={styles.bannerContainer}>
          {plant.imageUri ? (
            <Image source={{ uri: plant.imageUri }} style={styles.bannerImage} />
          ) : (
            <View style={[styles.bannerPlaceholder, { backgroundColor: colors.surfaceContainerLow }]}>
              <Ionicons name="leaf" size={68} color={colors.primary} />
            </View>
          )}

          {/* Dark Gradient Overlay & Tags */}
          <View style={styles.bannerOverlay}>
            <View style={styles.bannerBadgesRow}>
              {plant.room && (
                <View style={styles.glassBadge}>
                  <Ionicons name="location-outline" size={12} color="#FFFFFF" style={{ marginLeft: 3 }} />
                  <Text style={styles.glassBadgeText}>{plant.room}</Text>
                </View>
              )}
              <View
                style={[
                  styles.glassBadge,
                  isWaterDue && { backgroundColor: 'rgba(200, 90, 50, 0.85)' },
                ]}
              >
                <Ionicons name="water" size={12} color="#FFFFFF" style={{ marginLeft: 3 }} />
                <Text style={styles.glassBadgeText}>{waterStatus.label}</Text>
              </View>
            </View>

            <Text style={styles.bannerPlantName}>{plant.name}</Text>
            <Text style={styles.bannerScientificName}>{plant.scientificName || 'Botanical Specimen'}</Text>
          </View>
        </View>

        {/* Triple Quick Action Bar (Water, Fertilize, Snooze) */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primaryContainer }]}
            onPress={handleWater}
            activeOpacity={0.8}
          >
            <Ionicons name="water" size={18} color="#92F7C3" style={{ marginLeft: 6 }} />
            <Text style={[styles.actionBtnText, { color: '#92F7C3' }]}>آب دادم</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.fertilizerAmber }]}
            onPress={handleFertilize}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>کود دادم</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight, borderWidth: 1 }]}
            onPress={handleOpenSnooze}
            activeOpacity={0.8}
          >
            <Ionicons name="time-outline" size={18} color={colors.textSecondary} style={{ marginLeft: 6 }} />
            <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>تعویق ⏳</Text>
          </TouchableOpacity>
        </View>

        {/* 2-Column Care Cycles Grid */}
        <View style={styles.cyclesGrid}>
          <View
            style={[
              styles.cycleCard,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: isWaterDue ? colors.terracotta : colors.borderLight,
              },
            ]}
          >
            <View style={styles.cycleHeader}>
              <View style={[styles.cycleIconCircle, { backgroundColor: colors.waterLight }]}>
                <Ionicons name="water" size={16} color={colors.tertiary} />
              </View>
              <Text style={[styles.cycleTitle, { color: colors.textPrimary }]}>سیکل آبیاری</Text>
            </View>
            <Text style={[styles.cycleValue, { color: colors.primary }]}>
              هر {toPersianDigits(plant.wateringIntervalDays)} روز یک‌بار
            </Text>
            <Text style={[styles.cycleSub, { color: colors.textMuted }]}>
              نوبت بعد: {formatToJalali(plant.nextWateringDate)}
            </Text>
            <Text style={[styles.cycleSub, { color: colors.textMuted }]}>
              آخرین بار: {formatToJalali(plant.lastWateredDate)}
            </Text>
          </View>

          <View
            style={[
              styles.cycleCard,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <View style={styles.cycleHeader}>
              <View style={[styles.cycleIconCircle, { backgroundColor: colors.fertilizerLight }]}>
                <Ionicons name="sparkles" size={16} color={colors.fertilizerAmber} />
              </View>
              <Text style={[styles.cycleTitle, { color: colors.textPrimary }]}>سیکل کوددهی</Text>
            </View>
            <Text style={[styles.cycleValue, { color: colors.fertilizerAmber }]}>
              هر {toPersianDigits(plant.fertilizingIntervalDays)} روز یک‌بار
            </Text>
            <Text style={[styles.cycleSub, { color: colors.textMuted }]}>
              نوبت بعد: {formatToJalali(plant.nextFertilizingDate)}
            </Text>
            <Text style={[styles.cycleSub, { color: colors.textMuted }]}>
              کود: {plant.fertilizerType || 'کود کامل'}
            </Text>
          </View>
        </View>

        {/* 4-Grid Biological Needs (Light, Soil, Toxicity, Golden Tips) */}
        <View
          style={[
            styles.specsContainer,
            {
              backgroundColor: colors.surfaceContainerLowest,
              borderColor: colors.borderLight,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            شناسنامه زیستی و نیازمندی‌ها 🌿
          </Text>

          <View style={styles.needsGrid}>
            {/* Sunlight */}
            <View style={[styles.needItemCard, { backgroundColor: colors.surfaceContainerLow }]}>
              <View style={styles.needItemHeader}>
                <Ionicons name="sunny-outline" size={18} color={colors.fertilizerAmber} style={{ marginLeft: 5 }} />
                <Text style={[styles.needItemTitle, { color: colors.textPrimary }]}>نور ایده‌آل</Text>
              </View>
              <Text style={[styles.needItemText, { color: colors.textSecondary }]}>
                {plant.lightRequirement || 'نور زیاد غیرمستقیم'}
              </Text>
            </View>

            {/* Soil */}
            <View style={[styles.needItemCard, { backgroundColor: colors.surfaceContainerLow }]}>
              <View style={styles.needItemHeader}>
                <Ionicons name="earth-outline" size={18} color={colors.earthBrown} style={{ marginLeft: 5 }} />
                <Text style={[styles.needItemTitle, { color: colors.textPrimary }]}>بستر خاک</Text>
              </View>
              <Text style={[styles.needItemText, { color: colors.textSecondary }]}>
                {plant.soilType || 'خاک سبک با زهکشی قوی'}
              </Text>
            </View>

            {/* Toxicity Alert */}
            <View style={[styles.needItemCard, { backgroundColor: colors.dangerLight || '#FFDAD6', borderColor: colors.danger, borderWidth: 1 }]}>
              <View style={styles.needItemHeader}>
                <Ionicons name="warning-outline" size={18} color={colors.danger} style={{ marginLeft: 5 }} />
                <Text style={[styles.needItemTitle, { color: colors.danger }]}>هشدار سمیت</Text>
              </View>
              <Text style={[styles.needItemText, { color: colors.danger }]}>
                {plant.toxicity || 'برای حیوانات خانگی و کودکان احتیاط شود'}
              </Text>
            </View>

            {/* Humidity */}
            <View style={[styles.needItemCard, { backgroundColor: colors.surfaceContainerLow }]}>
              <View style={styles.needItemHeader}>
                <Ionicons name="water-outline" size={18} color={colors.tertiary} style={{ marginLeft: 5 }} />
                <Text style={[styles.needItemTitle, { color: colors.textPrimary }]}>رطوبت محیط</Text>
              </View>
              <Text style={[styles.needItemText, { color: colors.textSecondary }]}>
                {plant.humidityRequirement || 'رطوبت متوسط ۵۰ الی ۶۰ درصد'}
              </Text>
            </View>
          </View>

          {/* Golden Tips Box */}
          {plant.careTips ? (
            <View style={[styles.goldenTipBox, { backgroundColor: isDark ? colors.surfaceContainer : '#E6F8E8' }]}>
              <Ionicons name="bulb-outline" size={20} color={colors.fertilizerAmber} style={{ marginLeft: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.goldenTipTitle, { color: colors.textPrimary }]}>فوت کوزه‌گری گیاه‌یار:</Text>
                <Text style={[styles.goldenTipText, { color: colors.textSecondary }]}>{plant.careTips}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Connected Care History Timeline */}
        <View
          style={[
            styles.timelineContainer,
            {
              backgroundColor: colors.surfaceContainerLowest,
              borderColor: colors.borderLight,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            تاریخچه مراقبت‌های گذشته 📜
          </Text>

          {logs.length === 0 ? (
            <Text style={[styles.emptyLogsText, { color: colors.textMuted }]}>
              هنوز رویدادی برای این گیاه ثبت نشده است. اولین آبیاری را ثبت کنید!
            </Text>
          ) : (
            <View style={styles.timelineList}>
              {logs.slice(0, 8).map((log, index) => (
                <View key={log.id} style={styles.timelineRow}>
                  {/* Timeline Node & Line */}
                  <View style={styles.timelineTrackCol}>
                    <View
                      style={[
                        styles.timelineNode,
                        {
                          backgroundColor:
                            log.type === 'watering' ? colors.tertiary : colors.fertilizerAmber,
                        },
                      ]}
                    >
                      <Ionicons
                        name={log.type === 'watering' ? 'water' : 'sparkles'}
                        size={11}
                        color="#FFFFFF"
                      />
                    </View>
                    {index < logs.length - 1 && (
                      <View style={[styles.timelineConnector, { backgroundColor: colors.borderLight }]} />
                    )}
                  </View>

                  {/* Log Content */}
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineAction, { color: colors.textPrimary }]}>
                      {log.type === 'watering' ? '💧 آبیاری انجام شد' : '🌾 کوددهی تغذیه‌ای انجام شد'}
                    </Text>
                    <Text style={[styles.timelineDate, { color: colors.textMuted }]}>
                      {formatToJalali(log.date)}
                    </Text>
                    {log.note ? (
                      <Text style={[styles.timelineNote, { color: colors.textSecondary }]}>{log.note}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Snooze Options Modal */}
      <Modal visible={isSnoozeModalVisible} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsSnoozeModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>تعویق زمان آبیاری ⏳</Text>
              <View style={{ width: 28 }} />
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              خاک گلدان هنوز مرطوب است؟ چند روز موعد را به جلو بیاندازیم؟
            </Text>

            {/* Quick Day Chips */}
            <View style={styles.snoozePresetsRow}>
              {[1, 2, 3, 5, 7].map((days) => (
                <TouchableOpacity
                  key={`snooze_${days}`}
                  style={[
                    styles.snoozeChip,
                    {
                      backgroundColor: snoozeDays === days ? colors.primaryContainer : colors.surfaceContainerLow,
                      borderColor: snoozeDays === days ? colors.primary : colors.borderLight,
                    },
                  ]}
                  onPress={() => setSnoozeDays(days)}
                >
                  <Text
                    style={[
                      styles.snoozeChipText,
                      { color: snoozeDays === days ? '#92F7C3' : colors.textPrimary },
                      snoozeDays === days && { fontWeight: '800' },
                    ]}
                  >
                    {toPersianDigits(days)} روز
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Stepper for custom days */}
            <View style={[styles.snoozeStepperWrap, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight }]}>
              <TouchableOpacity
                style={[styles.snoozeStepBtn, { backgroundColor: colors.surfaceContainerLowest }]}
                onPress={() => setSnoozeDays((d) => Math.max(1, d - 1))}
              >
                <Ionicons name="remove" size={18} color={colors.primary} />
              </TouchableOpacity>
              <View style={styles.snoozeCountCol}>
                <Text style={[styles.snoozeCountNum, { color: colors.primary }]}>{toPersianDigits(snoozeDays)}</Text>
                <Text style={[styles.snoozeCountLabel, { color: colors.textMuted }]}>روز تعویق</Text>
              </View>
              <TouchableOpacity
                style={[styles.snoozeStepBtn, { backgroundColor: colors.surfaceContainerLowest }]}
                onPress={() => setSnoozeDays((d) => d + 1)}
              >
                <Ionicons name="add" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.confirmSnoozeBtn, { backgroundColor: colors.primaryContainer }]}
              onPress={handleConfirmSnooze}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={18} color="#92F7C3" style={{ marginLeft: 6 }} />
              <Text style={styles.confirmSnoozeBtnText}>
                تایید تعویق ({toPersianDigits(snoozeDays)} روز) ⏳
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Plant Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.editModalCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>ویرایش مشخصات گلدان 🪴</Text>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              {/* Plant Photo Change */}
              <View style={styles.editImageRow}>
                {editImageUri ? (
                  <Image source={{ uri: editImageUri }} style={styles.editThumbImg} />
                ) : (
                  <View style={[styles.editThumbPlaceholder, { backgroundColor: colors.surfaceContainerLow }]}>
                    <Ionicons name="leaf" size={24} color={colors.primary} />
                  </View>
                )}
                <View style={styles.editImageBtnsCol}>
                  <TouchableOpacity
                    style={[styles.imagePickBtn, { backgroundColor: colors.surfaceContainerLow }]}
                    onPress={() => handlePickEditImage(false)}
                  >
                    <Ionicons name="images-outline" size={15} color={colors.primary} style={{ marginLeft: 4 }} />
                    <Text style={[styles.imagePickText, { color: colors.primary }]}>تغییر از گالری</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.imagePickBtn, { backgroundColor: colors.surfaceContainerLow }]}
                    onPress={() => handlePickEditImage(true)}
                  >
                    <Ionicons name="camera-outline" size={15} color={colors.primary} style={{ marginLeft: 4 }} />
                    <Text style={[styles.imagePickText, { color: colors.primary }]}>عکاسی دوربین</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Name */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>نام فارسی / دلخواه گلدان:</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight, color: colors.textPrimary }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="نام گیاه..."
                  placeholderTextColor={colors.textMuted}
                  textAlign="right"
                />
              </View>

              {/* Scientific Name */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>نام علمی گونه:</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight, color: colors.textPrimary }]}
                  value={editScientificName}
                  onChangeText={setEditScientificName}
                  placeholder="نام لاتین..."
                  placeholderTextColor={colors.textMuted}
                  textAlign="right"
                />
              </View>

              {/* Room Selector */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>محل استقرار:</Text>
                <View style={styles.roomChipsWrap}>
                  {DEFAULT_ROOMS.map((r) => {
                    const isSel = editRoom === r;
                    return (
                      <TouchableOpacity
                        key={`edit_room_${r}`}
                        style={[
                          styles.roomSelectChip,
                          {
                            backgroundColor: isSel ? colors.primaryContainer : colors.surfaceContainerLow,
                            borderColor: isSel ? colors.primary : colors.borderLight,
                          },
                        ]}
                        onPress={() => setEditRoom(r)}
                      >
                        <Text style={[styles.roomSelectText, { color: isSel ? '#92F7C3' : colors.textSecondary }]}>
                          {r}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Steppers: Water & Fertilizer */}
              <View style={styles.editSteppersRow}>
                <View style={styles.editStepperBox}>
                  <Text style={[styles.formLabel, { color: colors.textPrimary }]}>سیکل آبیاری (روز):</Text>
                  <View style={[styles.stepperHRow, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight }]}>
                    <TouchableOpacity
                      style={styles.stepBtnSmall}
                      onPress={() => setEditWateringDays((d) => String(Math.max(1, (parseInt(d, 10) || 7) - 1)))}
                    >
                      <Ionicons name="remove" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.stepValText, { color: colors.primary }]}>{toPersianDigits(editWateringDays)}</Text>
                    <TouchableOpacity
                      style={styles.stepBtnSmall}
                      onPress={() => setEditWateringDays((d) => String((parseInt(d, 10) || 7) + 1))}
                    >
                      <Ionicons name="add" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.editStepperBox}>
                  <Text style={[styles.formLabel, { color: colors.textPrimary }]}>سیکل کوددهی (روز):</Text>
                  <View style={[styles.stepperHRow, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight }]}>
                    <TouchableOpacity
                      style={styles.stepBtnSmall}
                      onPress={() => setEditFertilizingDays((d) => String(Math.max(7, (parseInt(d, 10) || 30) - 5)))}
                    >
                      <Ionicons name="remove" size={16} color={colors.fertilizerAmber} />
                    </TouchableOpacity>
                    <Text style={[styles.stepValText, { color: colors.fertilizerAmber }]}>{toPersianDigits(editFertilizingDays)}</Text>
                    <TouchableOpacity
                      style={styles.stepBtnSmall}
                      onPress={() => setEditFertilizingDays((d) => String((parseInt(d, 10) || 30) + 5))}
                    >
                      <Ionicons name="add" size={16} color={colors.fertilizerAmber} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Fertilizer Type */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>نوع کود:</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight, color: colors.textPrimary }]}
                  value={editFertilizerType}
                  onChangeText={setEditFertilizerType}
                  placeholder="نوع کود..."
                  placeholderTextColor={colors.textMuted}
                  textAlign="right"
                />
              </View>

              {/* Care Tips */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>نکات طلایی مراقبت:</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.borderLight, color: colors.textPrimary }]}
                  value={editTips}
                  onChangeText={setEditTips}
                  placeholder="نکات نگهداری..."
                  placeholderTextColor={colors.textMuted}
                  textAlign="right"
                  multiline
                  numberOfLines={2}
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.savePlantBtn, { backgroundColor: colors.primaryContainer }]}
              onPress={handleSavePlantEdits}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={18} color="#92F7C3" style={{ marginLeft: 6 }} />
              <Text style={styles.savePlantBtnText}>ذخیره تغییرات گلدان</Text>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 14,
  },
  navbar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  navActionsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleCol: {
    alignItems: 'center',
  },
  navTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 16,
    fontWeight: '800',
  },
  navCode: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    marginTop: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 18,
    paddingTop: 14,
    gap: 16,
  },
  bannerContainer: {
    width: '100%',
    height: 220,
    borderRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: 'rgba(0,0,0,0.15)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 20, 10, 0.7)',
    padding: 16,
    alignItems: 'flex-end',
  },
  bannerBadgesRow: {
    flexDirection: 'row-reverse',
    gap: 6,
    marginBottom: 6,
  },
  glassBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  glassBadgeText: {
    fontFamily: 'IRANSansWeb',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  bannerPlantName: {
    fontFamily: 'IRANSansWeb',
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  bannerScientificName: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12.5,
    fontStyle: 'italic',
    color: '#D8F3DC',
    marginTop: 2,
    textAlign: 'right',
  },
  actionButtonsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    fontWeight: '800',
  },
  cyclesGrid: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  cycleCard: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    shadowColor: 'rgba(30, 94, 58, 0.06)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cycleHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cycleIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cycleTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    fontWeight: '800',
  },
  cycleValue: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  cycleSub: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  specsContainer: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  needsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  needItemCard: {
    width: '48.5%',
    borderRadius: 14,
    padding: 10,
  },
  needItemHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 4,
  },
  needItemTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11.5,
    fontWeight: '700',
  },
  needItemText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  goldenTipBox: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  goldenTipTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  goldenTipText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11.5,
    marginTop: 3,
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  timelineContainer: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
  },
  emptyLogsText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
  },
  timelineList: {
    paddingRight: 4,
  },
  timelineRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timelineTrackCol: {
    alignItems: 'center',
    width: 24,
    marginLeft: 10,
  },
  timelineNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineConnector: {
    width: 2,
    height: 24,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  timelineAction: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  timelineDate: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    marginTop: 2,
  },
  timelineNote: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11.5,
    marginTop: 2,
    fontStyle: 'italic',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
  },
  editModalCard: {
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
    marginBottom: 12,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
    marginBottom: 14,
  },
  snoozePresetsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 14,
  },
  snoozeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  snoozeChipText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '600',
  },
  snoozeStepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  snoozeStepBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snoozeCountCol: {
    alignItems: 'center',
  },
  snoozeCountNum: {
    fontFamily: 'IRANSansWeb',
    fontSize: 22,
    fontWeight: '800',
  },
  snoozeCountLabel: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
  },
  confirmSnoozeBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  confirmSnoozeBtnText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13.5,
    fontWeight: '800',
    color: '#92F7C3',
  },
  editImageRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  editThumbImg: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  editThumbPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editImageBtnsCol: {
    flex: 1,
    gap: 6,
  },
  imagePickBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  imagePickText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11.5,
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 10,
  },
  formLabel: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 4,
  },
  formInput: {
    fontFamily: 'IRANSansWeb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    borderWidth: 1,
  },
  roomChipsWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  roomSelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  roomSelectText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    fontWeight: '700',
  },
  editSteppersRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: 10,
  },
  editStepperBox: {
    flex: 1,
  },
  stepperHRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stepBtnSmall: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 15,
    fontWeight: '800',
  },
  savePlantBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 10,
  },
  savePlantBtnText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13.5,
    fontWeight: '800',
    color: '#92F7C3',
  },
});
