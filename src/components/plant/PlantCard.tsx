import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Plant } from '@/types/plant';
import { useTheme } from '@/context/ThemeContext';
import { getRelativeJalaliLabel } from '@/utils/jalali';
import { Badge } from '../ui/Badge';

interface PlantCardProps {
  plant: Plant;
  onPress: () => void;
  onQuickWater?: () => void;
}

export const PlantCard: React.FC<PlantCardProps> = ({
  plant,
  onPress,
  onQuickWater,
}) => {
  const { colors, isDark } = useTheme();
  const waterStatus = getRelativeJalaliLabel(plant.nextWateringDate);
  const fertStatus = getRelativeJalaliLabel(plant.nextFertilizingDate);

  const isWaterDue = waterStatus.isToday || waterStatus.isOverdue;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.contentRow}>
        {/* Plant Image or Botanical Icon */}
        <View style={styles.imageContainer}>
          {plant.imageUri ? (
            <Image source={{ uri: plant.imageUri }} style={styles.image} />
          ) : (
            <View
              style={[
                styles.imagePlaceholder,
                {
                  backgroundColor: isWaterDue ? colors.terracottaLight : colors.primarySurface,
                  borderColor: isWaterDue ? colors.terracotta : colors.primarySubtle,
                },
              ]}
            >
              <Ionicons
                name="leaf"
                size={28}
                color={isWaterDue ? colors.terracotta : colors.primary}
              />
            </View>
          )}
        </View>

        {/* Plant Details */}
        <View style={styles.infoCol}>
          <View style={styles.headerRow}>
            <Text style={[styles.plantName, { color: colors.textPrimary }]} numberOfLines={1}>
              {plant.name}
            </Text>
            {plant.room ? (
              <Badge label={plant.room} icon="location-outline" variant="neutral" />
            ) : null}
          </View>

          <Text style={[styles.scientificName, { color: colors.textMuted }]} numberOfLines={1}>
            {plant.scientificName}
          </Text>

          {/* Schedule Badges Row */}
          <View style={styles.badgesRow}>
            {/* Watering badge */}
            <View
              style={[
                styles.carePill,
                {
                  backgroundColor: isWaterDue ? colors.terracottaLight : colors.waterLight,
                },
              ]}
            >
              <Ionicons
                name="water"
                size={13}
                color={isWaterDue ? colors.terracotta : colors.waterBlue}
                style={{ marginLeft: 4 }}
              />
              <Text
                style={[
                  styles.carePillText,
                  {
                    color: isWaterDue ? colors.terracotta : colors.waterDark,
                  },
                ]}
              >
                آبیاری: {waterStatus.label}
              </Text>
            </View>

            {/* Fertilizing badge */}
            <View style={[styles.carePill, { backgroundColor: colors.fertilizerLight }]}>
              <Ionicons
                name="sparkles"
                size={12}
                color={colors.fertilizerAmber}
                style={{ marginLeft: 4 }}
              />
              <Text style={[styles.carePillTextFert, { color: colors.fertilizerDark }]}>
                کوددهی: {fertStatus.label}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Action Footer if water is due */}
      {isWaterDue && onQuickWater && (
        <View style={[styles.quickActionRow, { borderTopColor: colors.borderLight }]}>
          <Text style={[styles.quickActionHint, { color: colors.terracotta }]}>امروز نیاز به آبیاری دارد</Text>
          <TouchableOpacity
            style={[styles.quickWaterButton, { backgroundColor: colors.primary }]}
            onPress={onQuickWater}
            activeOpacity={0.8}
          >
            <Text style={styles.quickWaterText}>آب دادم</Text>
            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  contentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  imageContainer: {
    width: 72,
    height: 72,
    borderRadius: 18,
    overflow: 'hidden',
    marginLeft: 14,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  infoCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  plantName: {
    fontFamily: 'IRANSansWeb',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginLeft: 8,
  },
  scientificName: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12.5,
    fontStyle: 'italic',
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  badgesRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  carePill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  carePillText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  carePillTextFert: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  quickActionRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  quickActionHint: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  quickWaterButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 12,
    elevation: 2,
  },
  quickWaterText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
    writingDirection: 'rtl',
  },
});
