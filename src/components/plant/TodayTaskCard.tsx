import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Plant } from '@/types/plant';
import { useTheme } from '@/context/ThemeContext';
import { toPersianDigits } from '@/utils/jalali';

interface TodayTaskCardProps {
  dueWateringPlants: Plant[];
  dueFertilizingPlants: Plant[];
  totalGardenPlantsCount?: number;
  onWaterPlant: (plant: Plant) => void;
  onFertilizePlant: (plant: Plant) => void;
  onWaterAll: () => void;
}

export const TodayTaskCard: React.FC<TodayTaskCardProps> = ({
  dueWateringPlants,
  dueFertilizingPlants,
  totalGardenPlantsCount = 8,
  onWaterPlant,
  onFertilizePlant,
  onWaterAll,
}) => {
  const { colors, isDark } = useTheme();
  const totalTasks = dueWateringPlants.length + dueFertilizingPlants.length;

  if (totalTasks === 0) {
    return (
      <View
        style={[
          styles.peacefulCard,
          {
            backgroundColor: isDark ? colors.surfaceContainer : '#E6F8E8',
            borderColor: isDark ? colors.border : '#C0C9BF',
          },
        ]}
      >
        {/* Top Completion Pill */}
        <View style={styles.peacefulPillRow}>
          <View style={[styles.completionPill, { backgroundColor: isDark ? '#1A3525' : '#D5E7D8' }]}>
            <Ionicons name="sparkles" size={13} color={colors.primary} style={{ marginLeft: 4 }} />
            <Text style={[styles.completionPillText, { color: colors.primary }]}>
              ۱۰۰٪ وظایف امروز تکمیل شد
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.peacefulContentRow}>
          <View style={[styles.peacefulIconBadge, { backgroundColor: colors.surfaceContainerLowest }]}>
            <Ionicons name="checkmark-done-circle" size={32} color={colors.success} />
          </View>
          <View style={styles.peacefulTextCol}>
            <Text style={[styles.peacefulTitle, { color: colors.textPrimary }]}>
              باغچه شما آرام و سیراب است! 🌿
            </Text>
            <Text style={[styles.peacefulSubtitle, { color: colors.textSecondary }]}>
              هیچ آبدهی یا کوددهی معوقه‌ای باقی نمانده و تمام گیاهان در سلامت کامل تنفس می‌کنند.
            </Text>
          </View>
        </View>

        {/* Fast Stats Strip */}
        <View style={[styles.statsStrip, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderLight }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{toPersianDigits(totalGardenPlantsCount)}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>گلدان شاداب</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>{toPersianDigits(0)}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>وظیفه معوق</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.tertiary }]}>{toPersianDigits('۰۹:۰۰')}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>یادآور فردا</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.heroContainer,
        {
          backgroundColor: isDark ? colors.primaryContainer : '#1E5E3A',
          borderColor: isDark ? '#1E3327' : '#123A24',
        },
      ]}
    >
      {/* Top Banner Tag */}
      <View style={styles.heroTopRow}>
        <View style={styles.heroUrgencyBadge}>
          <Ionicons name="water" size={13} color="#FFFFFF" style={{ marginLeft: 4 }} />
          <Text style={styles.heroUrgencyText}>
            برنامه مراقبت امروز • {toPersianDigits(totalTasks)} گیاه
          </Text>
        </View>
      </View>

      {/* Main Title & Description */}
      <Text style={styles.heroMainTitle}>
        {toPersianDigits(dueWateringPlants.length)} گیاه تشنه منتظر شما هستند! 💧
      </Text>
      <Text style={styles.heroSubText}>
        برای حفظ طراوت و شادابی بافت برگ‌ها، آبیاری به موقع ریشه‌ها انجام شود.
      </Text>

      {/* Primary Action Button: Water All */}
      {dueWateringPlants.length > 0 && (
        <TouchableOpacity
          style={styles.waterAllHeroButton}
          onPress={onWaterAll}
          activeOpacity={0.85}
        >
          <Ionicons name="water" size={18} color="#004625" style={{ marginLeft: 6 }} />
          <Text style={styles.waterAllHeroButtonText}>
            آبیاری دسته‌جمعی همه ({toPersianDigits(dueWateringPlants.length)}) با یک کلیک 🌊
          </Text>
        </TouchableOpacity>
      )}

      {/* Individual Plant Tasks List */}
      <View style={styles.tasksList}>
        {dueWateringPlants.map((plant) => (
          <View key={`water_${plant.id}`} style={styles.taskCardItem}>
            <View style={styles.taskInfoRow}>
              <View style={styles.taskWaterIcon}>
                <Ionicons name="water-outline" size={17} color="#92F7C3" />
              </View>
              <View style={styles.taskDetails}>
                <Text style={styles.taskPlantName} numberOfLines={1}>
                  {plant.name}
                </Text>
                <Text style={styles.taskActionSub}>نوبت آبیاری امروز ({plant.room || 'باغچه'})</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.singleActionButton}
              onPress={() => onWaterPlant(plant)}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={14} color="#004625" style={{ marginLeft: 4 }} />
              <Text style={styles.singleActionText}>آب دادم</Text>
            </TouchableOpacity>
          </View>
        ))}

        {dueFertilizingPlants.map((plant) => (
          <View key={`fert_${plant.id}`} style={styles.taskCardItem}>
            <View style={styles.taskInfoRow}>
              <View style={[styles.taskWaterIcon, { backgroundColor: 'rgba(245, 158, 11, 0.25)' }]}>
                <Ionicons name="sparkles-outline" size={17} color="#FBBF24" />
              </View>
              <View style={styles.taskDetails}>
                <Text style={styles.taskPlantName} numberOfLines={1}>
                  {plant.name}
                </Text>
                <Text style={[styles.taskActionSub, { color: '#FDE68A' }]}>
                  نوبت تغذیه ({plant.fertilizerType || 'کود کامل'})
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.singleActionButton, { backgroundColor: '#FBBF24' }]}
              onPress={() => onFertilizePlant(plant)}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={14} color="#451A03" style={{ marginLeft: 4 }} />
              <Text style={[styles.singleActionText, { color: '#451A03' }]}>کود دادم</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroContainer: {
    borderRadius: 24,
    padding: 18,
    marginHorizontal: 18,
    marginBottom: 18,
    borderWidth: 1,
    shadowColor: 'rgba(30, 94, 58, 0.35)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroUrgencyBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroUrgencyText: {
    fontFamily: 'IRANSansWeb',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroMainTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 4,
  },
  heroSubText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12.5,
    color: '#D8F3DC',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
  },
  waterAllHeroButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#92F7C3',
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  waterAllHeroButtonText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13.5,
    fontWeight: '800',
    color: '#004625',
    writingDirection: 'rtl',
  },
  tasksList: {
    gap: 8,
  },
  taskCardItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  taskInfoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  taskWaterIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(146, 247, 195, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  taskDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  taskPlantName: {
    fontFamily: 'IRANSansWeb',
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  taskActionSub: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    fontWeight: '500',
    color: '#94D5A8',
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  singleActionButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#92F7C3',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  singleActionText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
    color: '#004625',
    writingDirection: 'rtl',
  },
  peacefulCard: {
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 18,
    marginBottom: 18,
    borderWidth: 1,
    shadowColor: 'rgba(30, 94, 58, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  peacefulPillRow: {
    flexDirection: 'row-reverse',
    marginBottom: 10,
  },
  completionPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completionPillText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11.5,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  peacefulContentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 14,
  },
  peacefulIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  peacefulTextCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  peacefulTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 15.5,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  peacefulSubtitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 18,
  },
  statsStrip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontFamily: 'IRANSansWeb',
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 22,
  },
});
