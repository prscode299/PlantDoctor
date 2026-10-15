import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Plant } from '@/types/plant';
import Colors from '@/constants/colors';
import { toPersianDigits } from '@/utils/jalali';

interface TodayTaskCardProps {
  dueWateringPlants: Plant[];
  dueFertilizingPlants: Plant[];
  onWaterPlant: (plant: Plant) => void;
  onFertilizePlant: (plant: Plant) => void;
  onWaterAll: () => void;
}

export const TodayTaskCard: React.FC<TodayTaskCardProps> = ({
  dueWateringPlants,
  dueFertilizingPlants,
  onWaterPlant,
  onFertilizePlant,
  onWaterAll,
}) => {
  const totalTasks = dueWateringPlants.length + dueFertilizingPlants.length;

  if (totalTasks === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="sparkles" size={26} color={Colors.primary} />
        </View>
        <View style={styles.emptyTextContainer}>
          <Text style={styles.emptyTitle}>همه گیاهان شاداب و سیرابند! 🌱</Text>
          <Text style={styles.emptySubtitle}>
            برای امروز هیچ آبیاری یا کوددهی معوقه‌ای باقی نمانده است.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {dueWateringPlants.length > 1 && (
          <TouchableOpacity
            style={styles.waterAllButton}
            onPress={onWaterAll}
            activeOpacity={0.8}
          >
            <Text style={styles.waterAllText}>آبیاری همه ({toPersianDigits(dueWateringPlants.length)})</Text>
          </TouchableOpacity>
        )}
        <View style={styles.titleRow}>
          <Text style={styles.title}>وظایف امروز شما</Text>
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>{toPersianDigits(totalTasks)}</Text>
          </View>
        </View>
      </View>

      {/* Task List */}
      <View style={styles.list}>
        {/* Watering tasks */}
        {dueWateringPlants.map((plant) => (
          <View key={`water_${plant.id}`} style={styles.taskItem}>
            <TouchableOpacity
              style={styles.actionButtonWater}
              onPress={() => onWaterPlant(plant)}
              activeOpacity={0.8}
            >
              <Ionicons name="water" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
              <Text style={styles.actionButtonText}>آب دادم</Text>
            </TouchableOpacity>

            <View style={styles.plantInfo}>
              <Text style={styles.plantName}>{plant.name}</Text>
              <Text style={styles.taskTypeWater}>💧 موعد آبیاری</Text>
            </View>
          </View>
        ))}

        {/* Fertilizing tasks */}
        {dueFertilizingPlants.map((plant) => (
          <View key={`fert_${plant.id}`} style={styles.taskItem}>
            <TouchableOpacity
              style={styles.actionButtonFert}
              onPress={() => onFertilizePlant(plant)}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
              <Text style={styles.actionButtonText}>کود دادم</Text>
            </TouchableOpacity>

            <View style={styles.plantInfo}>
              <Text style={styles.plantName}>{plant.name}</Text>
              <Text style={styles.taskTypeFert}>
                🌿 موعد کوددهی ({plant.fertilizerType || 'کود'})
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: Colors.primarySubtle,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'IRANSansWeb',
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  counterBadge: {
    backgroundColor: Colors.terracotta,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  counterText: {
    fontFamily: 'IRANSansWeb',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  waterAllText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  waterAllButton: {
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  list: {
    gap: 8,
  },
  taskItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  plantInfo: {
    alignItems: 'flex-end',
    flex: 1,
    marginLeft: 10,
  },
  plantName: {
    fontFamily: 'IRANSansWeb',
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  taskTypeWater: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    color: Colors.waterBlue,
    fontWeight: '600',
    marginTop: 2,
  },
  taskTypeFert: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    color: Colors.fertilizerDark,
    fontWeight: '600',
    marginTop: 2,
  },
  actionButtonWater: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.waterBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  actionButtonFert: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.fertilizerAmber,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  actionButtonText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.primarySubtle,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  emptyIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  emptyTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  emptyTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  emptySubtitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'right',
  },
});
