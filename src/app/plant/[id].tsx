import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Plant, CareLog } from '@/types/plant';
import { db } from '@/services/storage/database';
import { notificationService } from '@/services/notifications/notificationService';
import Colors from '@/constants/colors';
import { formatToJalali, getRelativeJalaliLabel, toPersianDigits } from '@/utils/jalali';
import { Badge } from '@/components/ui/Badge';

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [logs, setLogs] = useState<CareLog[]>([]);

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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>در حال دریافت اطلاعات گیاه...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const waterStatus = getRelativeJalaliLabel(plant.nextWateringDate);
  const fertStatus = getRelativeJalaliLabel(plant.nextFertilizingDate);

  const handleWater = async () => {
    try {
      const updated = await db.waterPlant(plant.id);
      if (updated) {
        setPlant(updated);
        await loadData();
        const all = await db.getPlants();
        await notificationService.syncAllPlantNotifications(all);
        Alert.alert('سیراب شد! 💧', 'آبیاری گیاه با موفقیت ثبت شد.');
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
        Alert.alert('تغذیه شد! 🌿', 'کوددهی گیاه با موفقیت ثبت شد.');
      }
    } catch {
      Alert.alert('خطا', 'ثبت کوددهی با مشکل مواجه شد.');
    }
  };

  const handleSnooze = async () => {
    try {
      const updated = await db.snoozeWatering(plant.id, 1);
      if (updated) {
        setPlant(updated);
        const all = await db.getPlants();
        await notificationService.syncAllPlantNotifications(all);
        Alert.alert('به تعویق افتاد ⏳', 'موعد آبیاری ۱ روز به جلو انداخته شد.');
      }
    } catch {
      Alert.alert('خطا', 'عملیات با خطا مواجه شد.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'حذف گیاه',
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color={Colors.danger} />
        </TouchableOpacity>

        <Text style={styles.navTitle} numberOfLines={1}>
          {plant.name}
        </Text>

        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Plant Image / Banner */}
        <View style={styles.bannerContainer}>
          {plant.imageUri ? (
            <Image source={{ uri: plant.imageUri }} style={styles.bannerImage} />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <Ionicons name="leaf" size={60} color={Colors.primary} />
            </View>
          )}

          <View style={styles.bannerOverlay}>
            <View style={styles.bannerTagsRow}>
              {plant.room && <Badge label={plant.room} icon="location" variant="neutral" />}
              <Badge
                label={`آبیاری: ${waterStatus.label}`}
                icon="water"
                variant={waterStatus.isToday || waterStatus.isOverdue ? 'danger' : 'water'}
              />
            </View>
            <Text style={styles.bannerPlantName}>{plant.name}</Text>
            <Text style={styles.bannerScientificName}>{plant.scientificName}</Text>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnWater]}
            onPress={handleWater}
            activeOpacity={0.8}
          >
            <Ionicons name="water" size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>آب دادم</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnFert]}
            onPress={handleFertilize}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>کود دادم</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSnooze]}
            onPress={handleSnooze}
            activeOpacity={0.8}
          >
            <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.actionBtnTextSnooze}>۱ روز تاخیر</Text>
          </TouchableOpacity>
        </View>

        {/* Schedule Cards */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>زمان‌بندی و دوره‌ها 🗓️</Text>

          <View style={styles.scheduleItem}>
            <View style={styles.scheduleBadgeCol}>
              <Text style={styles.scheduleBadgeWater}>
                هر {toPersianDigits(plant.wateringIntervalDays)} روز یک‌بار
              </Text>
            </View>
            <View style={styles.scheduleTextCol}>
              <Text style={styles.scheduleLabel}>نوبت بعدی آبیاری:</Text>
              <Text style={styles.scheduleValue}>
                {formatToJalali(plant.nextWateringDate)} ({waterStatus.label})
              </Text>
              <Text style={styles.scheduleSubValue}>
                آخرین آبیاری: {formatToJalali(plant.lastWateredDate)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.scheduleItem}>
            <View style={styles.scheduleBadgeCol}>
              <Text style={styles.scheduleBadgeFert}>
                هر {toPersianDigits(plant.fertilizingIntervalDays)} روز یک‌بار
              </Text>
            </View>
            <View style={styles.scheduleTextCol}>
              <Text style={styles.scheduleLabel}>نوبت بعدی کوددهی:</Text>
              <Text style={styles.scheduleValue}>
                {formatToJalali(plant.nextFertilizingDate)} ({fertStatus.label})
              </Text>
              <Text style={styles.scheduleSubValue}>
                نوع کود: {plant.fertilizerType || 'کود تقویتی عمومی'}
              </Text>
            </View>
          </View>
        </View>

        {/* Environmental & Care Needs */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>نیازمندی‌ها و شرایط نگهداری 🌿</Text>

          {plant.lightRequirement && (
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{plant.lightRequirement}</Text>
              <View style={styles.infoLabelRow}>
                <Text style={styles.infoLabel}>نور مورد نیاز</Text>
                <Ionicons name="sunny-outline" size={16} color={Colors.warning} style={{ marginLeft: 6 }} />
              </View>
            </View>
          )}

          {plant.soilType && (
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{plant.soilType}</Text>
              <View style={styles.infoLabelRow}>
                <Text style={styles.infoLabel}>بستر و خاک</Text>
                <Ionicons name="earth-outline" size={16} color={Colors.earthBrown} style={{ marginLeft: 6 }} />
              </View>
            </View>
          )}

          {plant.toxicity && (
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{plant.toxicity}</Text>
              <View style={styles.infoLabelRow}>
                <Text style={styles.infoLabel}>احتیاط سمیت</Text>
                <Ionicons name="warning-outline" size={16} color={Colors.terracotta} style={{ marginLeft: 6 }} />
              </View>
            </View>
          )}

          {plant.careTips && (
            <View style={styles.tipsBox}>
              <Ionicons name="bulb-outline" size={18} color={Colors.primary} style={{ marginLeft: 6 }} />
              <Text style={styles.tipsText}>{plant.careTips}</Text>
            </View>
          )}
        </View>

        {/* Care History Log */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>تاریخچه مراقبت‌های گذشته 📜</Text>
          {logs.length === 0 ? (
            <Text style={styles.emptyLogText}>هنوز گزارشی برای این گیاه ثبت نشده است.</Text>
          ) : (
            logs.slice(0, 10).map((log) => (
              <View key={log.id} style={styles.logItem}>
                <Text style={styles.logDate}>{formatToJalali(log.date)}</Text>
                <View style={styles.logTextCol}>
                  <Text style={styles.logTitle}>
                    {log.type === 'watering' ? '💧 آبیاری انجام شد' : '🌿 کوددهی انجام شد'}
                  </Text>
                  {log.note ? <Text style={styles.logNote}>{log.note}</Text> : null}
                </View>
              </View>
            ))
          )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  bannerContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    height: 220,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(20, 38, 28, 0.75)',
  },
  bannerTagsRow: {
    flexDirection: 'row-reverse',
    gap: 6,
    marginBottom: 6,
  },
  bannerPlantName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  bannerScientificName: {
    fontSize: 12,
    color: '#D8F3DC',
    fontStyle: 'italic',
    textAlign: 'right',
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 6,
  },
  actionBtnWater: {
    backgroundColor: Colors.waterBlue,
  },
  actionBtnFert: {
    backgroundColor: Colors.fertilizerAmber,
  },
  actionBtnSnooze: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  actionBtnTextSnooze: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 12,
  },
  scheduleItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  scheduleTextCol: {
    alignItems: 'flex-end',
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  scheduleValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  scheduleSubValue: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  scheduleBadgeCol: {
    marginLeft: 10,
  },
  scheduleBadgeWater: {
    backgroundColor: Colors.waterLight,
    color: Colors.waterBlue,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scheduleBadgeFert: {
    backgroundColor: Colors.fertilizerLight,
    color: Colors.fertilizerDark,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '700',
    flex: 1,
    textAlign: 'left',
  },
  tipsBox: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.primarySubtle,
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    alignItems: 'flex-start',
  },
  tipsText: {
    fontSize: 12,
    color: Colors.primaryDark,
    lineHeight: 18,
    flex: 1,
    textAlign: 'right',
  },
  emptyLogText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  logItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  logTextCol: {
    alignItems: 'flex-end',
  },
  logTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  logNote: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  logDate: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
});
