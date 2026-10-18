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
import { db } from '@/services/storage/database';
import { notificationService } from '@/services/notifications/notificationService';
import Colors from '@/constants/colors';
import { Header } from '@/components/ui/Header';
import { PlantCard } from '@/components/plant/PlantCard';
import { TodayTaskCard } from '@/components/plant/TodayTaskCard';
import { getDaysDiffFromToday, getTodayIso, toPersianDigits } from '@/utils/jalali';

export default function HomeScreen() {
  const roomScrollRef = useRef<ScrollView>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('همه');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const plantList = await db.getPlants();
      const roomList = await db.getRooms();
      setPlants(plantList);
      setRooms(roomList);
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
    } catch (e) {
      Alert.alert('خطا', 'ثبت آبیاری با مشکل مواجه شد.');
    }
  };

  const handleQuickFertilize = async (plant: Plant) => {
    try {
      await db.fertilizePlant(plant.id);
      await loadData();
      const updated = await db.getPlants();
      await notificationService.syncAllPlantNotifications(updated);
    } catch (e) {
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
      Alert.alert('عالی شد! 🌱', 'تمامی گیاهان تشنه سیراب شدند و تاریخ بعدی ثبت شد.');
    } catch (e) {
      Alert.alert('خطا', 'آبیاری گروهی با مشکل مواجه شد.');
    }
  };

  // Filter plants by selected room
  const filteredPlants = selectedRoom === 'همه'
    ? plants
    : plants.filter((p) => p.room === selectedRoom);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <Header
        title="باغچه من 🌿"
        showDate={true}
        rightAction={{
          icon: 'add',
          onPress: () => router.push('/plant/add'),
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Today's Due Tasks Section */}
        <TodayTaskCard
          dueWateringPlants={dueWateringPlants}
          dueFertilizingPlants={dueFertilizingPlants}
          onWaterPlant={handleQuickWater}
          onFertilizePlant={handleQuickFertilize}
          onWaterAll={handleWaterAll}
        />

        {/* Room Filter Chips */}
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
              return (
                <TouchableOpacity
                  key={`room_chip_${room}`}
                  style={[
                    styles.roomChip,
                    isSelected && styles.roomChipSelected,
                  ]}
                  onPress={() => setSelectedRoom(room)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.roomChipText,
                      isSelected && styles.roomChipTextSelected,
                    ]}
                  >
                    {room}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Plants List Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>لیست گیاهان</Text>
          <Text style={styles.plantCountBadge}>
            {toPersianDigits(filteredPlants.length)} گلدان
          </Text>
        </View>

        {/* Plant Cards */}
        {filteredPlants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="leaf-outline" size={36} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>هنوز گیاهی در این بخش نیست!</Text>
            <Text style={styles.emptyText}>
              می‌توانید با زدن دکمه زیر یا علامت + در بالا، اولین گیاه خود را با هوش مصنوعی یا به صورت دستی ثبت کنید.
            </Text>
            <TouchableOpacity
              style={styles.addFirstPlantBtn}
              onPress={() => router.push('/plant/add')}
              activeOpacity={0.8}
            >
              <Text style={styles.addFirstPlantText}>افزودن گیاه جدید ✨</Text>
              <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        ) : (
          filteredPlants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onPress={() => router.push(`/plant/${plant.id}`)}
              onQuickWater={() => handleQuickWater(plant)}
            />
          ))
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/plant/add')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 90,
  },
  roomFilterWrapper: {
    marginBottom: 16,
  },
  roomFilterContent: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 20,
    gap: 8,
  },
  roomChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  roomChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roomChipText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  roomChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  plantCountBadge: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  emptyContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    marginHorizontal: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  emptyText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 18,
  },
  addFirstPlantBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  addFirstPlantText: {
    fontFamily: 'IRANSansWeb',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 20, // In RTL layouts, left side is natural for thumb
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowHeavy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
});
