import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Plant } from '@/types/plant';
import { useTheme } from '@/context/ThemeContext';
import {
  getCurrentJalali,
  getJalaliMonthDays,
  JALALI_MONTH_NAMES,
  JALALI_WEEK_DAYS,
  toPersianDigits,
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
  const { colors, isDark } = useTheme();
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
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      {/* Month Navigation */}
      <View style={styles.monthHeader}>
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: colors.surfaceSubtle }]}
          onPress={handleNextMonth}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleGoToToday} activeOpacity={0.7}>
          <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>
            {JALALI_MONTH_NAMES[selectedMonth - 1]} {toPersianDigits(selectedYear)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: colors.surfaceSubtle }]}
          onPress={handlePrevMonth}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Week Days Header (RTL: شنبه تا جمعه) */}
      <View style={[styles.weekDaysRow, { borderBottomColor: colors.borderLight }]}>
        {JALALI_WEEK_DAYS.map((dayName, idx) => (
          <View key={`weekday_${idx}`} style={styles.weekDayCell}>
            <Text
              style={[
                styles.weekDayText,
                { color: idx === 6 ? colors.terracotta : colors.textMuted },
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
          const hasWatering = watering.length > 0;
          const hasFertilizing = fertilizing.length > 0;

          return (
            <TouchableOpacity
              key={`day_${idx}_${day.isoDate}`}
              style={[
                styles.dayCell,
                isSelected && { backgroundColor: colors.primary },
                day.isToday && !isSelected && { borderWidth: 1.5, borderColor: colors.primary },
              ]}
              onPress={() => setSelectedIsoDate(day.isoDate)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayNumberText,
                  { color: day.isCurrentMonth ? colors.textPrimary : colors.textLight },
                  day.isToday && !isSelected && { color: colors.primary, fontWeight: '800' },
                  isSelected && { color: '#FFFFFF', fontWeight: '800' },
                ]}
              >
                {toPersianDigits(day.jd)}
              </Text>

              {/* Event indicator dots */}
              <View style={styles.dotsRow}>
                {hasWatering && (
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: isSelected ? '#FFFFFF' : colors.waterBlue },
                    ]}
                  />
                )}
                {hasFertilizing && (
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: isSelected ? '#FFFFFF' : colors.fertilizerAmber },
                    ]}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Prominent Botanical Legend Badge Card */}
      <View style={[styles.legendContainer, { borderTopColor: colors.borderLight }]}>
        <View
          style={[
            styles.legendPillToday,
            {
              backgroundColor: colors.primarySubtle,
              borderColor: colors.primary,
            },
          ]}
        >
          <View style={[styles.legendDotToday, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendTextToday, { color: colors.primaryDark }]}>امروز</Text>
        </View>

        <View
          style={[
            styles.legendPillWater,
            {
              backgroundColor: colors.waterLight,
              borderColor: colors.waterBlue,
            },
          ]}
        >
          <Ionicons name="water" size={13} color={colors.waterBlue} style={{ marginLeft: 4 }} />
          <Text style={[styles.legendTextWater, { color: colors.waterDark }]}>نوبت آبیاری</Text>
        </View>

        <View
          style={[
            styles.legendPillFert,
            {
              backgroundColor: colors.fertilizerLight,
              borderColor: colors.fertilizerAmber,
            },
          ]}
        >
          <Ionicons name="sparkles" size={13} color={colors.fertilizerAmber} style={{ marginLeft: 4 }} />
          <Text style={[styles.legendTextFert, { color: colors.fertilizerDark }]}>نوبت کوددهی</Text>
        </View>
      </View>

      {/* Selected Day Agenda */}
      <View style={[styles.agendaCard, { backgroundColor: colors.surfaceSubtle }]}>
        <View style={styles.agendaHeader}>
          <Ionicons name="calendar-outline" size={16} color={colors.primary} style={{ marginLeft: 6 }} />
          <Text style={[styles.agendaTitle, { color: colors.textPrimary }]}>
            برنامه مراقبت {toPersianDigits(selectedDateEvents.watering.length + selectedDateEvents.fertilizing.length)} گیاه در تاریخ انتخابی:
          </Text>
        </View>

        {selectedDateEvents.watering.length === 0 && selectedDateEvents.fertilizing.length === 0 ? (
          <Text style={[styles.agendaEmptyText, { color: colors.textMuted }]}>
            در این روز هیچ نوبت آبیاری یا کوددهی برنامه‌ریزی نشده است.
          </Text>
        ) : (
          <View style={styles.agendaTasksList}>
            {selectedDateEvents.watering.map((p) => (
              <View key={`agenda_w_${p.id}`} style={[styles.agendaTaskRow, { backgroundColor: colors.surface }]}>
                <View style={styles.agendaTaskInfo}>
                  <Text style={[styles.agendaPlantName, { color: colors.textPrimary }]}>{p.name}</Text>
                  <Text style={[styles.agendaTaskTypeWater, { color: colors.waterDark }]}>💧 نوبت آبیاری دوره {toPersianDigits(p.wateringIntervalDays)} روزه</Text>
                </View>
                <TouchableOpacity
                  style={[styles.agendaActionBtnWater, { backgroundColor: colors.waterBlue }]}
                  onPress={() => onWaterPlant(p)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
                  <Text style={styles.agendaActionBtnText}>آب دادم</Text>
                </TouchableOpacity>
              </View>
            ))}

            {selectedDateEvents.fertilizing.map((p) => (
              <View key={`agenda_f_${p.id}`} style={[styles.agendaTaskRow, { backgroundColor: colors.surface }]}>
                <View style={styles.agendaTaskInfo}>
                  <Text style={[styles.agendaPlantName, { color: colors.textPrimary }]}>{p.name}</Text>
                  <Text style={[styles.agendaTaskTypeFert, { color: colors.fertilizerDark }]}>✨ نوبت کوددهی ({p.fertilizerType || 'کود کامل'})</Text>
                </View>
                <TouchableOpacity
                  style={[styles.agendaActionBtnFert, { backgroundColor: colors.fertilizerAmber }]}
                  onPress={() => onFertilizePlant(p)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
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
    borderRadius: 24,
    marginHorizontal: 16,
    padding: 16,
    borderWidth: 1,
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
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDaysRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
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
  dayNumberText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 3,
    height: 7,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1.5,
    gap: 8,
  },
  legendPillToday: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  legendDotToday: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  legendTextToday: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
  },
  legendPillWater: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  legendTextWater: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
  },
  legendPillFert: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  legendTextFert: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
  },
  agendaCard: {
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
  },
  agendaEmptyText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
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
    writingDirection: 'rtl',
  },
  agendaTaskTypeWater: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  agendaTaskTypeFert: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  agendaActionBtnWater: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  agendaActionBtnFert: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
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
