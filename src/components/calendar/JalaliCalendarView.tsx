import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Plant } from '@/types/plant';
import Colors from '@/constants/colors';
import {
  getCurrentJalali,
  getJalaliMonthDays,
  JALALI_MONTH_NAMES,
  JALALI_WEEK_DAYS,
  toPersianDigits,
  formatToJalali,
  getTodayIso,
  JalaliCalendarDay,
} from '@/utils/jalali';

interface JalaliCalendarViewProps {
  plants: Plant[];
  onWaterPlant: (plant: Plant) => void;
  onFertilizePlant: (plant: Plant) => void;
}

export const JalaliCalendarView: React.FC<JalaliCalendarViewProps> = ({
  plants,
  onWaterPlant,
  onFertilizePlant,
}) => {
  const currentJ = getCurrentJalali();
  const [selectedYear, setSelectedYear] = useState<number>(currentJ.jy);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentJ.jm);
  const [selectedIsoDate, setSelectedIsoDate] = useState<string>(getTodayIso());

  const daysGrid = getJalaliMonthDays(selectedYear, selectedMonth);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleGoToToday = () => {
    const today = getCurrentJalali();
    setSelectedYear(today.jy);
    setSelectedMonth(today.jm);
    setSelectedIsoDate(getTodayIso());
  };

  // Find plants needing care for a specific date
  const getEventsForDate = (isoDate: string) => {
    const watering = plants.filter((p) => p.nextWateringDate === isoDate);
    const fertilizing = plants.filter((p) => p.nextFertilizingDate === isoDate);
    return { watering, fertilizing };
  };

  const selectedDateEvents = getEventsForDate(selectedIsoDate);

  return (
    <View style={styles.container}>
      {/* Month Navigation */}
      <View style={styles.monthHeader}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={handleNextMonth}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.primaryDark} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleGoToToday} activeOpacity={0.7}>
          <Text style={styles.monthTitle}>
            {JALALI_MONTH_NAMES[selectedMonth - 1]} {toPersianDigits(selectedYear)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={handlePrevMonth}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={20} color={Colors.primaryDark} />
        </TouchableOpacity>
      </View>

      {/* Week Days Header (RTL: شنبه تا جمعه) */}
      <View style={styles.weekDaysRow}>
        {JALALI_WEEK_DAYS.map((dayName, idx) => (
          <View key={`weekday_${idx}`} style={styles.weekDayCell}>
            <Text
              style={[
                styles.weekDayText,
                idx === 6 && styles.fridayText, // جمعه به رنگ دیگر
              ]}
            >
              {dayName}
            </Text>
          </View>
        ))}
      </View>

      {/* Days Grid */}
      <View style={styles.daysGrid}>
        {daysGrid.map((day: JalaliCalendarDay, idx: number) => {
          const isSelected = day.isoDate === selectedIsoDate;
          const { watering, fertilizing } = getEventsForDate(day.isoDate);
          const hasWater = watering.length > 0;
          const hasFert = fertilizing.length > 0;

          return (
            <TouchableOpacity
              key={`day_${day.isoDate}_${idx}`}
              style={[
                styles.dayCell,
                isSelected && styles.dayCellSelected,
                day.isToday && !isSelected && styles.dayCellToday,
              ]}
              onPress={() => setSelectedIsoDate(day.isoDate)}
              activeOpacity={0.6}
            >
              <Text
                style={[
                  styles.dayNumberText,
                  !day.isCurrentMonth && styles.dayNumberMuted,
                  isSelected && styles.dayNumberSelected,
                  day.isToday && !isSelected && styles.dayNumberToday,
                ]}
              >
                {toPersianDigits(day.jd)}
              </Text>

              {/* Event Indicator Dots */}
              <View style={styles.dotsRow}>
                {hasWater && (
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: isSelected ? '#FFFFFF' : Colors.waterBlue },
                    ]}
                  />
                )}
                {hasFert && (
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: isSelected ? '#FFFFFF' : Colors.fertilizerAmber },
                    ]}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <Text style={styles.legendText}>آبیاری</Text>
          <View style={[styles.legendDot, { backgroundColor: Colors.waterBlue }]} />
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendText}>کوددهی</Text>
          <View style={[styles.legendDot, { backgroundColor: Colors.fertilizerAmber }]} />
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendText}>امروز</Text>
          <View style={[styles.legendRing, { borderColor: Colors.primary }]} />
        </View>
      </View>

      {/* Selected Day Agenda / Tasks */}
      <View style={styles.agendaCard}>
        <View style={styles.agendaHeader}>
          <Ionicons name="calendar" size={16} color={Colors.primary} style={{ marginLeft: 6 }} />
          <Text style={styles.agendaTitle}>
            برنامه {formatToJalali(selectedIsoDate)}
          </Text>
        </View>

        {selectedDateEvents.watering.length === 0 &&
        selectedDateEvents.fertilizing.length === 0 ? (
          <Text style={styles.agendaEmptyText}>
            برای این تاریخ هیچ رویداد مراقبتی ثبت نشده است.
          </Text>
        ) : (
          <View style={styles.agendaTasksList}>
            {selectedDateEvents.watering.map((plant) => (
              <View key={`agenda_water_${plant.id}`} style={styles.agendaTaskRow}>
                <View style={styles.agendaTaskInfo}>
                  <Text style={styles.agendaPlantName}>{plant.name}</Text>
                  <Text style={styles.agendaTaskTypeWater}>💧 نوبت آبیاری</Text>
                </View>

                <TouchableOpacity
                  style={styles.agendaActionBtnWater}
                  onPress={() => onWaterPlant(plant)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" style={{ marginLeft: 3 }} />
                  <Text style={styles.agendaActionBtnText}>آب دادم</Text>
                </TouchableOpacity>
              </View>
            ))}

            {selectedDateEvents.fertilizing.map((plant) => (
              <View key={`agenda_fert_${plant.id}`} style={styles.agendaTaskRow}>
                <View style={styles.agendaTaskInfo}>
                  <Text style={styles.agendaPlantName}>{plant.name}</Text>
                  <Text style={styles.agendaTaskTypeFert}>
                    🌿 نوبت کوددهی ({plant.fertilizerType || 'کود'})
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.agendaActionBtnFert}
                  onPress={() => onFertilizePlant(plant)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" style={{ marginLeft: 3 }} />
                  <Text style={styles.agendaActionBtnText}>کود دادم</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    marginHorizontal: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  monthHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  monthTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDaysRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  fridayText: {
    color: Colors.terracotta,
  },
  daysGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  dayNumberText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  dayNumberMuted: {
    color: '#CBD5E1',
  },
  dayNumberSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayNumberToday: {
    color: Colors.primary,
    fontWeight: '800',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    height: 5,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  legendRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: 16,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  legendItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  legendText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    color: Colors.textMuted,
    marginRight: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendRing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  agendaCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
  },
  agendaHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
  },
  agendaTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  agendaEmptyText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  agendaTasksList: {
    gap: 8,
    marginTop: 4,
  },
  agendaTaskRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 10,
    borderRadius: 12,
  },
  agendaTaskInfo: {
    alignItems: 'flex-end',
    flex: 1,
    marginLeft: 8,
  },
  agendaPlantName: {
    fontFamily: 'IRANSansWeb',
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    writingDirection: 'rtl',
  },
  agendaTaskTypeWater: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    color: Colors.waterBlue,
    marginTop: 2,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  agendaTaskTypeFert: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    color: Colors.fertilizerDark,
    marginTop: 2,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  agendaActionBtnWater: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.waterBlue,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  agendaActionBtnFert: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.fertilizerAmber,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  agendaActionBtnText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    writingDirection: 'rtl',
  },
});
