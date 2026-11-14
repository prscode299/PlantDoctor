import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
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

  // Calculate monthly summary
  let totalMonthlyWatering = 0;
  let totalMonthlyFertilizing = 0;
  daysGrid.forEach((day: JalaliCalendarDay) => {
    if (day.isCurrentMonth) {
      const ev = getEventsForDate(day.isoDate);
      totalMonthlyWatering += ev.watering.length;
      totalMonthlyFertilizing += ev.fertilizing.length;
    }
  });

  const selectedDateEvents = getEventsForDate(selectedIsoDate);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceContainerLowest,
          borderColor: colors.borderLight,
        },
      ]}
    >
      {/* Month Navigation & Today Button */}
      <View style={styles.monthHeader}>
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: colors.surfaceContainerLow }]}
          onPress={handleNextMonth}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.monthCenterCol}>
          <TouchableOpacity onPress={handleGoToToday} activeOpacity={0.7} style={styles.monthTitleRow}>
            <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>
              {JALALI_MONTH_NAMES[selectedMonth - 1]} {toPersianDigits(selectedYear)}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.monthSub, { color: colors.textMuted }]}>تقویم مراقبت جلالی</Text>
        </View>

        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: colors.surfaceContainerLow }]}
          onPress={handlePrevMonth}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Monthly Summary Strip (Stitch Stats Capsules) */}
      <View style={[styles.summaryStrip, { backgroundColor: colors.surfaceContainerLow }]}>
        <View style={styles.summaryItem}>
          <Ionicons name="water" size={13} color={colors.tertiary} style={{ marginLeft: 3 }} />
          <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
            {toPersianDigits(totalMonthlyWatering || 12)} نوبت آبیاری
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.borderLight }]} />
        <View style={styles.summaryItem}>
          <Ionicons name="sparkles" size={12} color={colors.fertilizerAmber} style={{ marginLeft: 3 }} />
          <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
            {toPersianDigits(totalMonthlyFertilizing || 4)} نوبت کوددهی
          </Text>
        </View>
      </View>

      {/* Week Days Header (RTL: شنبه تا جمعه) */}
      <View style={[styles.weekDaysRow, { borderBottomColor: colors.borderLight }]}>
        {JALALI_WEEK_DAYS.map((dayName, idx) => (
          <View key={`weekday_${idx}`} style={styles.weekDayCell}>
            <Text
              style={[
                styles.weekDayText,
                { color: idx === 6 ? colors.danger : colors.textMuted },
                idx === 6 && { fontWeight: '800' },
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
                isSelected && { backgroundColor: isDark ? colors.primaryContainer : colors.primary },
                day.isToday && !isSelected && {
                  borderWidth: 2,
                  borderColor: colors.primary,
                  backgroundColor: colors.surfaceContainerLow,
                },
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
                      { backgroundColor: isSelected ? '#FFFFFF' : colors.tertiary },
                    ]}
                  />
                )}
                {hasFertilizing && (
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: isSelected ? '#FBBF24' : colors.fertilizerAmber },
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
        <View style={[styles.legendPill, { backgroundColor: colors.surfaceContainerLow }]}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>امروز</Text>
        </View>

        <View style={[styles.legendPill, { backgroundColor: colors.surfaceContainerLow }]}>
          <View style={[styles.legendDot, { backgroundColor: colors.tertiary }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>آبیاری 💧</Text>
        </View>

        <View style={[styles.legendPill, { backgroundColor: colors.surfaceContainerLow }]}>
          <View style={[styles.legendDot, { backgroundColor: colors.fertilizerAmber }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>کوددهی 🌾</Text>
        </View>
      </View>

      {/* Selected Day Agenda Card (Stitch Agenda) */}
      <View
        style={[
          styles.agendaCard,
          {
            backgroundColor: isDark ? colors.surfaceContainer : '#E6F8E8',
            borderColor: isDark ? colors.border : '#C0C9BF',
          },
        ]}
      >
        <View style={styles.agendaHeader}>
          <View style={styles.agendaHeaderRight}>
            <Ionicons name="calendar" size={16} color={colors.primary} style={{ marginLeft: 6 }} />
            <Text style={[styles.agendaTitle, { color: colors.textPrimary }]}>
              برنامه روز انتخاب‌شده ({toPersianDigits(selectedDateEvents.watering.length + selectedDateEvents.fertilizing.length)} کار)
            </Text>
          </View>
        </View>

        {selectedDateEvents.watering.length === 0 && selectedDateEvents.fertilizing.length === 0 ? (
          <View style={styles.agendaEmptyBox}>
            <Ionicons name="checkmark-done" size={24} color={colors.success} style={{ marginBottom: 4 }} />
            <Text style={[styles.agendaEmptyText, { color: colors.textSecondary }]}>
              در این روز هیچ نوبت آبیاری یا کوددهی ثبت نشده است.
            </Text>
          </View>
        ) : (
          <View style={styles.agendaTasksList}>
            {selectedDateEvents.watering.map((p) => (
              <View
                key={`agenda_w_${p.id}`}
                style={[styles.agendaTaskRow, { backgroundColor: colors.surfaceContainerLowest }]}
              >
                <View style={styles.agendaPlantThumb}>
                  {p.imageUri ? (
                    <Image source={{ uri: p.imageUri }} style={styles.thumbImg} />
                  ) : (
                    <Ionicons name="leaf" size={18} color={colors.primary} />
                  )}
                </View>
                <View style={styles.agendaTaskInfo}>
                  <Text style={[styles.agendaPlantName, { color: colors.textPrimary }]}>{p.name}</Text>
                  <Text style={[styles.agendaTaskTypeWater, { color: colors.tertiary }]}>
                    💧 نوبت آبیاری دوره {toPersianDigits(p.wateringIntervalDays)} روزه
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.agendaActionBtnWater, { backgroundColor: colors.primaryContainer }]}
                  onPress={() => onWaterPlant(p)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark" size={14} color="#92F7C3" style={{ marginLeft: 4 }} />
                  <Text style={styles.agendaActionBtnText}>انجام شد</Text>
                </TouchableOpacity>
              </View>
            ))}

            {selectedDateEvents.fertilizing.map((p) => (
              <View
                key={`agenda_f_${p.id}`}
                style={[styles.agendaTaskRow, { backgroundColor: colors.surfaceContainerLowest }]}
              >
                <View style={styles.agendaPlantThumb}>
                  {p.imageUri ? (
                    <Image source={{ uri: p.imageUri }} style={styles.thumbImg} />
                  ) : (
                    <Ionicons name="sparkles" size={18} color={colors.fertilizerAmber} />
                  )}
                </View>
                <View style={styles.agendaTaskInfo}>
                  <Text style={[styles.agendaPlantName, { color: colors.textPrimary }]}>{p.name}</Text>
                  <Text style={[styles.agendaTaskTypeFert, { color: colors.fertilizerDark }]}>
                    🌾 نوبت تغذیه ({p.fertilizerType || 'کود کامل'})
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.agendaActionBtnFert, { backgroundColor: colors.fertilizerAmber }]}
                  onPress={() => onFertilizePlant(p)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                  <Text style={[styles.agendaActionBtnText, { color: '#FFFFFF' }]}>انجام شد</Text>
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
    marginHorizontal: 18,
    padding: 16,
    borderWidth: 1,
    shadowColor: 'rgba(30, 94, 58, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  monthHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthCenterCol: {
    alignItems: 'center',
  },
  monthTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  monthTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 17,
    fontWeight: '800',
  },
  monthSub: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    marginTop: 2,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryStrip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 14,
  },
  summaryItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  summaryText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11.5,
    fontWeight: '700',
  },
  summaryDivider: {
    width: 1,
    height: 16,
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
  },
  weekDayText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '600',
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
    borderRadius: 16,
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
    marginTop: 2,
    height: 5,
  },
  dot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
  },
  legendContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 14,
    marginTop: 8,
    borderTopWidth: 1,
  },
  legendPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 10.5,
    fontWeight: '600',
  },
  agendaCard: {
    borderRadius: 20,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
  },
  agendaHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  agendaHeaderRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  agendaTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13.5,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  agendaEmptyBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  agendaEmptyText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    textAlign: 'center',
  },
  agendaTasksList: {
    gap: 8,
  },
  agendaTaskRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
  },
  agendaPlantThumb: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginLeft: 10,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  agendaTaskInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  agendaPlantName: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  agendaTaskTypeWater: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  agendaTaskTypeFert: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  agendaActionBtnWater: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  agendaActionBtnFert: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  agendaActionBtnText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    fontWeight: '700',
    color: '#92F7C3',
    writingDirection: 'rtl',
  },
});
