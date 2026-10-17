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
          <Ionicons name="sparkles" size={24} color={Colors.primary} />
        </View>
        <View style={styles.emptyTextContainer}>
          <Text style={styles.emptyTitle}>باغچه شما آرام و سیراب است! 🌿</Text>
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
        <View style={styles.titleRow}>
          <Text style={styles.title}>وظایف امروز شما</Text>
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>{toPersianDigits(totalTasks)}</Text>
          </View>
        </View>

        {dueWateringPlants.length > 1 && (
          <TouchableOpacity
            style={styles.waterAllButton}
            onPress={onWaterAll}
            activeOpacity={0.8}
          >
            <Ionicons name="water" size={13} color="#FFFFFF" style={{ marginLeft: 4 }} />
            <Text style={styles.waterAllText}>
              آبیاری همه ({toPersianDigits(dueWateringPlants.length)})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Task List */}
      <View style={styles.list}>
        {/* Watering tasks */}
        {dueWateringPlants.map((plant) => (
          <View key={`water_${plant.id}`} style={[styles.taskItem, styles.taskItemWater]}>
            {/* Right side: Icon + Plant Information */}
            <View style={styles.plantInfoRow}>
              <View style={styles.taskIconCircleWater}>
                <Ionicons name="water" size={18} color={Colors.waterBlue} />
              </View>
              <View style={styles.plantInfo}>
                <Text style={styles.plantName} numberOfLines={1}>
                  {plant.name}
                </Text>
                <Text style={styles.taskTypeWater}>💧 موعد آبیاری گیاه</Text>
              </View>
            </View>

            {/* Left side: Action Button */}
            <TouchableOpacity
              style={styles.actionButtonWater}
              onPress={() => onWaterPlant(plant)}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
              <Text style={styles.actionButtonText}>آب دادم</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Fertilizing tasks */}
        {dueFertilizingPlants.map((plant) => (
          <View key={`fert_${plant.id}`} style={[styles.taskItem, styles.taskItemFert]}>
            {/* Right side: Icon + Plant Information */}
            <View style={styles.plantInfoRow}>
              <View style={styles.taskIconCircleFert}>
                <Ionicons name="sparkles" size={18} color={Colors.fertilizerAmber} />
              </View>
              <View style={styles.plantInfo}>
                <Text style={styles.plantName} numberOfLines={1}>
                  {plant.name}
                </Text>
                <Text style={styles.taskTypeFert} numberOfLines={1}>
                  🌾 موعد تغذیه ({plant.fertilizerType || 'کود کامل'})
                </Text>
              </View>
            </View>

            {/* Left side: Action Button */}
            <TouchableOpacity
              style={styles.actionButtonFert}
              onPress={() => onFertilizePlant(plant)}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
              <Text style={styles.actionButtonText}>کود دادم</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'IRANSansWeb',
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    writingDirection: 'rtl',
  },
  counterBadge: {
    backgroundColor: Colors.terracotta,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    paddingHorizontal: 6,
  },
  counterText: {
    fontFamily: 'IRANSansWeb',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  waterAllButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.waterBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  waterAllText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    writingDirection: 'rtl',
  },
  list: {
    gap: 10,
  },
  taskItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  taskItemWater: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  taskItemFert: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  plantInfoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  taskIconCircleWater: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  taskIconCircleFert: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  plantInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  plantName: {
    fontFamily: 'IRANSansWeb',
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  taskTypeWater: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    color: Colors.waterDark,
    fontWeight: '600',
    marginTop: 3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  taskTypeFert: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    color: Colors.fertilizerDark,
    fontWeight: '600',
    marginTop: 3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  actionButtonWater: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.waterBlue,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    shadowColor: Colors.waterBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonFert: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.fertilizerAmber,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    shadowColor: Colors.fertilizerAmber,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  emptyContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.primarySurface,
    borderRadius: 22,
    padding: 16,
    marginHorizontal: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: Colors.primarySubtle,
  },
  emptyIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  emptyTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryDark,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  emptySubtitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 18,
  },
});
