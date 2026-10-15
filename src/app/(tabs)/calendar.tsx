import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Plant } from '@/types/plant';
import { db } from '@/services/storage/database';
import { notificationService } from '@/services/notifications/notificationService';
import Colors from '@/constants/colors';
import { Header } from '@/components/ui/Header';
import { JalaliCalendarView } from '@/components/calendar/JalaliCalendarView';

export default function CalendarScreen() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadPlants = useCallback(async () => {
    try {
      const data = await db.getPlants();
      setPlants(data);
    } catch (e) {
      console.error('Failed to load plants for calendar:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPlants();
    }, [loadPlants])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlants();
    setRefreshing(false);
  };

  const handleWaterPlant = async (plant: Plant) => {
    try {
      await db.waterPlant(plant.id);
      await loadPlants();
      const updated = await db.getPlants();
      await notificationService.syncAllPlantNotifications(updated);
      Alert.alert('ثبت شد! 💧', `آبیاری گیاه «${plant.name}» ثبت و نوبت بعدی محاسبه شد.`);
    } catch {
      Alert.alert('خطا', 'ثبت آبیاری با مشکل مواجه شد.');
    }
  };

  const handleFertilizePlant = async (plant: Plant) => {
    try {
      await db.fertilizePlant(plant.id);
      await loadPlants();
      const updated = await db.getPlants();
      await notificationService.syncAllPlantNotifications(updated);
      Alert.alert('ثبت شد! 🌿', `کوددهی گیاه «${plant.name}» ثبت شد.`);
    } catch {
      Alert.alert('خطا', 'ثبت کوددهی با مشکل مواجه شد.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="تقویم شمسی گیاهان 🗓️"
        subtitle="برنامه زمان‌بندی آبدهی و کوددهی به تاریخ جلالی"
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <JalaliCalendarView
          plants={plants}
          onWaterPlant={handleWaterPlant}
          onFertilizePlant={handleFertilizePlant}
        />
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
    paddingVertical: 12,
    paddingBottom: 40,
  },
});
