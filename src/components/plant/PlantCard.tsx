import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Plant } from '@/types/plant';
import Colors from '@/constants/colors';
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
  const waterStatus = getRelativeJalaliLabel(plant.nextWateringDate);
  const fertStatus = getRelativeJalaliLabel(plant.nextFertilizingDate);

  const isWaterDue = waterStatus.isToday || waterStatus.isOverdue;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.contentRow}>
        {/* Plant Image or Botanical Icon */}
        <View style={styles.imageContainer}>
          {plant.imageUri ? (
            <Image source={{ uri: plant.imageUri }} style={styles.image} />
          ) : (
            <View style={[styles.imagePlaceholder, isWaterDue && styles.imagePlaceholderAlert]}>
              <Ionicons
                name="leaf"
                size={28}
                color={isWaterDue ? Colors.terracotta : Colors.primary}
              />
            </View>
          )}
        </View>

        {/* Plant Details */}
        <View style={styles.infoCol}>
          <View style={styles.headerRow}>
            {plant.room ? (
              <Badge label={plant.room} icon="location-outline" variant="neutral" />
            ) : null}
            <Text style={styles.plantName} numberOfLines={1}>
              {plant.name}
            </Text>
          </View>

          <Text style={styles.scientificName} numberOfLines={1}>
            {plant.scientificName}
          </Text>

          {/* Schedule Badges Row */}
          <View style={styles.badgesRow}>
            {/* Watering badge */}
            <View
              style={[
                styles.carePill,
                isWaterDue ? styles.carePillAlert : styles.carePillWater,
              ]}
            >
              <Text
                style={[
                  styles.carePillText,
                  isWaterDue ? styles.carePillTextAlert : styles.carePillTextWater,
                ]}
              >
                آبیاری: {waterStatus.label}
              </Text>
              <Ionicons
                name="water"
                size={12}
                color={isWaterDue ? Colors.terracotta : Colors.waterBlue}
                style={{ marginLeft: 3 }}
              />
            </View>

            {/* Fertilizing badge */}
            <View style={[styles.carePill, styles.carePillFert]}>
              <Text style={styles.carePillTextFert}>
                کوددهی: {fertStatus.label}
              </Text>
              <Ionicons
                name="sparkles"
                size={11}
                color={Colors.fertilizerAmber}
                style={{ marginLeft: 3 }}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Quick Action Footer if water is due */}
      {isWaterDue && onQuickWater && (
        <View style={styles.quickActionRow}>
          <Text style={styles.quickActionHint}>امروز نیاز به آبیاری دارد</Text>
          <TouchableOpacity
            style={styles.quickWaterButton}
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
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  contentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  imageContainer: {
    width: 68,
    height: 68,
    borderRadius: 16,
    overflow: 'hidden',
    marginLeft: 12,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderAlert: {
    backgroundColor: Colors.terracottaLight,
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
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  scientificName: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
    textAlign: 'right',
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  carePillWater: {
    backgroundColor: Colors.waterLight,
  },
  carePillAlert: {
    backgroundColor: Colors.terracottaLight,
  },
  carePillFert: {
    backgroundColor: Colors.fertilizerLight,
  },
  carePillText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 11,
    fontWeight: '700',
  },
  carePillTextWater: {
    color: Colors.waterBlue,
  },
  carePillTextAlert: {
    color: Colors.terracotta,
  },
  carePillTextFert: {
    fontFamily: 'IRANSansWeb',
    color: Colors.fertilizerDark,
    fontSize: 11,
    fontWeight: '700',
  },
  quickActionRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  quickActionHint: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    color: Colors.terracotta,
    fontWeight: '600',
  },
  quickWaterButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  quickWaterText: {
    fontFamily: 'IRANSansWeb',
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
