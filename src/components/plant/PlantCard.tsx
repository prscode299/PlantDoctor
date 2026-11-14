import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Plant } from '@/types/plant';
import { useTheme } from '@/context/ThemeContext';
import { getRelativeJalaliLabel, toPersianDigits } from '@/utils/jalali';

interface PlantCardProps {
  plant: Plant;
  onPress: () => void;
  onQuickWater?: () => void;
  variant?: 'grid' | 'list';
}

export const PlantCard: React.FC<PlantCardProps> = ({
  plant,
  onPress,
  onQuickWater,
  variant = 'grid',
}) => {
  const { colors, isDark } = useTheme();
  const waterStatus = getRelativeJalaliLabel(plant.nextWateringDate);
  const fertStatus = getRelativeJalaliLabel(plant.nextFertilizingDate);
  const isWaterDue = waterStatus.isToday || waterStatus.isOverdue;

  // Approximate moisture percentage for UI visual
  const moisturePercent = isWaterDue ? 15 : 68;

  if (variant === 'grid') {
    return (
      <TouchableOpacity
        style={[
          styles.gridCard,
          {
            backgroundColor: colors.surfaceContainerLowest,
            borderColor: isWaterDue ? colors.terracotta : colors.borderLight,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.88}
      >
        {/* Top Image Container */}
        <View style={styles.gridImageContainer}>
          {plant.imageUri ? (
            <Image source={{ uri: plant.imageUri }} style={styles.gridImage} />
          ) : (
            <View
              style={[
                styles.gridImagePlaceholder,
                { backgroundColor: isWaterDue ? colors.terracottaLight : colors.surfaceContainerLow },
              ]}
            >
              <Ionicons
                name="leaf"
                size={34}
                color={isWaterDue ? colors.terracotta : colors.primary}
              />
            </View>
          )}

          {/* Floating Urgency Badge on Top of Image */}
          <View
            style={[
              styles.floatingBadge,
              {
                backgroundColor: isWaterDue
                  ? colors.terracotta
                  : isDark
                  ? 'rgba(0, 82, 53, 0.9)'
                  : 'rgba(235, 245, 238, 0.95)',
              },
            ]}
          >
            <Ionicons
              name={isWaterDue ? 'water' : 'checkmark-circle'}
              size={11}
              color={isWaterDue ? '#FFFFFF' : colors.primary}
              style={{ marginLeft: 3 }}
            />
            <Text
              style={[
                styles.floatingBadgeText,
                { color: isWaterDue ? '#FFFFFF' : colors.primary },
              ]}
            >
              {isWaterDue ? 'نیاز به آب' : 'سیراب'}
            </Text>
          </View>

          {/* Room Badge in corner */}
          {plant.room ? (
            <View style={[styles.roomPill, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
              <Text style={styles.roomPillText}>{plant.room}</Text>
            </View>
          ) : null}
        </View>

        {/* Card Body */}
        <View style={styles.gridBody}>
          <Text style={[styles.gridTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {plant.name}
          </Text>
          <Text style={[styles.gridScientific, { color: colors.textMuted }]} numberOfLines={1}>
            {plant.scientificName || 'گیاه آپارتمانی'}
          </Text>

          {/* Moisture Bar */}
          <View style={styles.moistureRow}>
            <View style={styles.moistureTextRow}>
              <Text style={[styles.moistureLabel, { color: colors.textMuted }]}>رطوبت خاک</Text>
              <Text
                style={[
                  styles.moistureValue,
                  { color: isWaterDue ? colors.terracotta : colors.primary },
                ]}
              >
                {toPersianDigits(moisturePercent)}٪
              </Text>
            </View>
            <View style={[styles.moistureTrack, { backgroundColor: colors.surfaceContainerLow }]}>
              <View
                style={[
                  styles.moistureFill,
                  {
                    width: `${moisturePercent}%`,
                    backgroundColor: isWaterDue ? colors.terracotta : colors.secondaryFixed,
                  },
                ]}
              />
            </View>
          </View>

          {/* Countdown & Action */}
          <View style={styles.gridFooter}>
            <View style={styles.countdownCol}>
              <Text style={[styles.countdownText, { color: isWaterDue ? colors.terracotta : colors.textSecondary }]}>
                💧 {waterStatus.label}
              </Text>
            </View>

            {isWaterDue && onQuickWater ? (
              <TouchableOpacity
                style={[styles.quickWaterIconBtn, { backgroundColor: colors.primaryContainer }]}
                onPress={onQuickWater}
                activeOpacity={0.8}
              >
                <Ionicons name="water" size={14} color="#92F7C3" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // List View Variant (Horizontal row)
  return (
    <TouchableOpacity
      style={[
        styles.listCard,
        {
          backgroundColor: colors.surfaceContainerLowest,
          borderColor: isWaterDue ? colors.terracotta : colors.borderLight,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={styles.listRow}>
        <View style={styles.listImageWrap}>
          {plant.imageUri ? (
            <Image source={{ uri: plant.imageUri }} style={styles.listImage} />
          ) : (
            <View
              style={[
                styles.listImagePlaceholder,
                { backgroundColor: isWaterDue ? colors.terracottaLight : colors.surfaceContainerLow },
              ]}
            >
              <Ionicons
                name="leaf"
                size={24}
                color={isWaterDue ? colors.terracotta : colors.primary}
              />
            </View>
          )}
        </View>

        <View style={styles.listDetails}>
          <View style={styles.listTitleRow}>
            <Text style={[styles.listTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {plant.name}
            </Text>
            {plant.room && (
              <View style={[styles.listRoomBadge, { backgroundColor: colors.surfaceContainerLow }]}>
                <Text style={[styles.listRoomText, { color: colors.textSecondary }]}>{plant.room}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.listSub, { color: colors.textMuted }]} numberOfLines={1}>
            {plant.scientificName}
          </Text>

          <View style={styles.listPillsRow}>
            <View
              style={[
                styles.listPill,
                { backgroundColor: isWaterDue ? colors.terracottaLight : colors.surfaceContainerLow },
              ]}
            >
              <Ionicons
                name="water"
                size={11}
                color={isWaterDue ? colors.terracotta : colors.tertiary}
                style={{ marginLeft: 3 }}
              />
              <Text
                style={[
                  styles.listPillText,
                  { color: isWaterDue ? colors.terracotta : colors.textSecondary },
                ]}
              >
                {waterStatus.label}
              </Text>
            </View>

            <View style={[styles.listPill, { backgroundColor: colors.surfaceContainerLow }]}>
              <Ionicons name="sparkles" size={10} color={colors.fertilizerAmber} style={{ marginLeft: 3 }} />
              <Text style={[styles.listPillText, { color: colors.textSecondary }]}>
                {fertStatus.label}
              </Text>
            </View>
          </View>
        </View>

        {isWaterDue && onQuickWater && (
          <TouchableOpacity
            style={[styles.listQuickWaterBtn, { backgroundColor: colors.primaryContainer }]}
            onPress={onQuickWater}
            activeOpacity={0.8}
          >
            <Ionicons name="water" size={16} color="#92F7C3" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gridCard: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: 'rgba(30, 94, 58, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  gridImageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  floatingBadgeText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 10,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  roomPill: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  roomPillText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 9.5,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  gridBody: {
    padding: 12,
  },
  gridTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 14.5,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  gridScientific: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
    marginBottom: 8,
  },
  moistureRow: {
    marginBottom: 10,
  },
  moistureTextRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  moistureLabel: {
    fontFamily: 'IRANSansWeb',
    fontSize: 10,
  },
  moistureValue: {
    fontFamily: 'IRANSansWeb',
    fontSize: 10.5,
    fontWeight: '700',
  },
  moistureTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  moistureFill: {
    height: '100%',
    borderRadius: 2,
  },
  gridFooter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  countdownCol: {
    flex: 1,
  },
  countdownText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  quickWaterIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  listRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  listImageWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
    marginLeft: 12,
  },
  listImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  listImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  listTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  listTitle: {
    fontFamily: 'IRANSansWeb',
    fontSize: 14.5,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  listRoomBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  listRoomText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 10,
    fontWeight: '600',
  },
  listSub: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 6,
  },
  listPillsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  listPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  listPillText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 10.5,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  listQuickWaterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
});
