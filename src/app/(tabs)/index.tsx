import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Plant } from '@/types/plant';
import { db, UserProfile } from '@/services/storage/database';
import { notificationService } from '@/services/notifications/notificationService';
import { useTheme } from '@/context/ThemeContext';
import { Header } from '@/components/ui/Header';
import { PlantCard } from '@/components/plant/PlantCard';
import { TodayTaskCard } from '@/components/plant/TodayTaskCard';
import { getDaysDiffFromToday, toPersianDigits } from '@/utils/jalali';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const roomScrollRef = useRef<ScrollView>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('همه');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const loadData = useCallback(async () => {
    try {
      const plantList = await db.getPlants();
      const roomList = await db.getRooms();
      const profile = await db.getUserProfile();
      setPlants(plantList);
      setRooms(roomList);
      setUserProfile(profile);
    } catch (e) {
      console.error('Failed to load plants:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Urgent tasks: due today or overdue
  const dueWateringPlants = plants.filter((p) => {
    const diff = getDaysDiffFromToday(p.nextWateringDate);
    return diff <= 0;
  });

  const dueFertilizingPlants = plants.filter((p) => {
    const diff = getDaysDiffFromToday(p.nextFertilizingDate);
    return diff <= 0;
  });

  const handleQuickWater = async (plant: Plant) => {
    try {
      await db.waterPlant(plant.id);
      await loadData();
      const updated = await db.getPlants();
      await notificationService.syncAllPlantNotifications(updated);
    } catch {
      Alert.alert('خطا', 'ثبت آبیاری با مشکل مواجه شد.');
    }
  };

  const handleQuickFertilize = async (plant: Plant) => {
    try {
      await db.fertilizePlant(plant.id);
      await loadData();
      const updated = await db.getPlants();
      await notificationService.syncAllPlantNotifications(updated);
    } catch {
      Alert.alert('خطا', 'ثبت کوددهی با مشکل مواجه شد.');
    }
  };

  const handleWaterAll = async () => {
    try {
      for (const plant of dueWateringPlants) {
        await db.waterPlant(plant.id, 'آبیاری دسته‌ای روزانه انجام شد.');
      }
      await loadData();
      const updated = await db.getPlants();
      await notificationService.syncAllPlantNotifications(updated);
      Alert.alert('عالی شد! 🌱', 'تمامی گیاهان تشنه سیراب شدند و تقویم بروزرسانی شد.');
    } catch {
      Alert.alert('خطا', 'آبیاری گروهی با مشکل مواجه شد.');
    }
  };

  // Filter plants by selected room
  const filteredPlants =
    selectedRoom === 'همه' ? plants : plants.filter((p) => p.room === selectedRoom);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Stitch Modern Brand Header with City Weather & Avatar */}
      <Header
        title={userProfile?.name ? `سلام ${userProfile.name.split(' ')[0]} جان 🌱` : 'باغچه من 🌿'}
        subtitle="باغچه من و وظایف روزانه"
        showDate={true}
        showBrandHeader={true}
        showClimateSensor={true}
        cityName={userProfile?.city || 'مشهد'}
        temperature={userProfile?.temperature ?? 25}
        humidity={userProfile?.humidity ?? 58}
        notificationCount={dueWateringPlants.length}
        onNotificationPress={() => router.push('/calendar')}
        onProfilePress={() => router.push('/settings')}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Today's Tasks Hero Card (Stitch Velvet or Peaceful State) */}
        <TodayTaskCard
          dueWateringPlants={dueWateringPlants}
          dueFertilizingPlants={dueFertilizingPlants}
          totalGardenPlantsCount={plants.length}
          onWaterPlant={handleQuickWater}
          onFertilizePlant={handleQuickFertilize}
          onWaterAll={handleWaterAll}
        />

        {/* AI Daily Botanical Tip Card (Stitch Smart Tip) */}
        <View
          style={[
            styles.tipCard,
            {
              backgroundColor: isDark ? colors.surfaceContainer : '#E6F8E8',
              borderColor: isDark ? colors.border : '#C0C9BF',
            },
          ]}
        >
          <View style={[styles.tipIconBadge, { backgroundColor: isDark ? '#1E3327' : '#D5E7D8' }]}>
            <Ionicons name="bulb-outline" size={18} color={colors.fertilizerAmber} />
          </View>
          <View style={styles.tipTextCol}>
            <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>
              نکته هوشمند پاییزه گیاه‌یار 💡
            </Text>
            <Text style={[styles.tipDescription, { color: colors.textSecondary }]}>
              با کوتاه شدن روزها، تبخیر سطحی کاهش می‌یابد. قبل از هر آبیاری خشکی بند اول خاک را لمس کنید.
            </Text>
          </View>
        </View>

        {/* Room Filter Horizontal Chips */}
        <View style={styles.roomFilterWrapper}>
          <ScrollView
            ref={roomScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.roomFilterContent}
            onContentSizeChange={() => {
              roomScrollRef.current?.scrollToEnd({ animated: false });
            }}
          >
            {['همه', ...rooms].map((room) => {
              const isSelected = selectedRoom === room;
              const count = room === 'همه' ? plants.length : plants.filter((p) => p.room === room).length;
              return (
                <TouchableOpacity
                  key={`room_chip_${room}`}
                  style={[
                    styles.roomChip,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? colors.primaryContainer
                          : colors.primary
                        : colors.surfaceContainerLowest,
                      borderColor: isSelected ? colors.primary : colors.borderLight,
                    },
                  ]}
                  onPress={() => setSelectedRoom(room)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.roomChipText,
                      { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                      isSelected && { fontWeight: '800' },
                    ]}
                  >
                    {room} ({toPersianDigits(count)})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Section Header & Layout Toggle */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>گلدان‌های باغچه</Text>
            <View style={[styles.countPill, { backgroundColor: colors.surfaceContainerLow }]}>
              <Text style={[styles.countPillText, { color: colors.textSecondary }]}>
                {toPersianDigits(filteredPlants.length)} گلدان
              </Text>
            </View>
          </View>

          {/* Grid / List Switcher */}
          <View style={[styles.viewSwitchWrap, { backgroundColor: colors.surfaceContainerLow }]}>
            <TouchableOpacity
              style={[styles.viewSwitchBtn, viewMode === 'grid' && { backgroundColor: colors.surfaceContainerLowest }]}
              onPress={() => setViewMode('grid')}
            >
              <Ionicons
                name="grid-outline"
                size={16}
                color={viewMode === 'grid' ? colors.primary : colors.textMuted}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewSwitchBtn, viewMode === 'list' && { backgroundColor: colors.surfaceContainerLowest }]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons
                name="list-outline"
                size={17}
                color={viewMode === 'list' ? colors.primary : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Plant Cards (2-Column Grid or List) */}
        {filteredPlants.length === 0 ? (
          <View
            style={[
              styles.emptyContainer,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight },
            ]}
          >
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.surfaceContainerLow }]}>
              <Ionicons name="leaf-outline" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              هنوز گیاهی در این بخش نیست!
            </Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              با لمس دکمه زیر می‌توانید گونه دلخواه را به کمک هوش مصنوعی یا انتخاب از کاتالوگ ثبت کنید.
            </Text>
            <TouchableOpacity
              style={[styles.addFirstPlantBtn, { backgroundColor: colors.primaryContainer }]}
              onPress={() => router.push('/plant/add')}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={18} color="#92F7C3" style={{ marginLeft: 6 }} />
              <Text style={styles.addFirstPlantText}>افزودن گیاه جدید 🌱</Text>
            </TouchableOpacity>
          </View>
        ) : viewMode === 'grid' ? (
          <View style={styles.gridContainer}>
            {filteredPlants.map((plant) => (
              <View key={plant.id} style={styles.gridColumnItem}>
                <PlantCard
                  plant={plant}
                  variant="grid"
                  onPress={() => router.push(`/plant/${plant.id}`)}
                  onQuickWater={() => handleQuickWater(plant)}
                />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredPlants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                variant="list"
                onPress={() => router.push(`/plant/${plant.id}`)}
                onQuickWater={() => handleQuickWater(plant)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: isDark ? colors.primary : colors.primaryContainer }]}
        onPress={() => router.push('/plant/add')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={isDark ? '#004625' : '#FFFFFF'} />
      </TouchableOpacity>
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
    paddingBottom: 95,
  },
  tipCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: 20,
    padding: 14,
    marginHorizontal: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  tipIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  tipTextCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  tipTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13.5,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  tipDescription: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11.5,
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 18,
  },
  roomFilterWrapper: {
    marginBottom: 16,
  },
  roomFilterContent: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 18,
    gap: 8,
  },
  roomChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  roomChipText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12.5,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 16.5,
    fontWeight: '800',
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countPillText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    fontWeight: '700',
  },
  viewSwitchWrap: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 2,
    gap: 2,
  },
  viewSwitchBtn: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gridContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  gridColumnItem: {
    width: '48.5%',
  },
  listContainer: {
    paddingHorizontal: 18,
  },
  emptyContainer: {
    borderRadius: 24,
    marginHorizontal: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  addFirstPlantBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
  },
  addFirstPlantText: {
    fontFamily: 'IRANSansWeb',
    color: '#92F7C3',
    fontSize: 13.5,
    fontWeight: '800',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
});
