import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { t } from '@/i18n';
import { Star, MapPin } from 'lucide-react-native';
import theme from '@/app/theme';
import { Property } from '@/types/Property';

interface PropertyCardProps {
  property: Property;
  onPress?: () => void;
}

export default function PropertyCard({ property, onPress }: Readonly<PropertyCardProps>) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: property.image }} style={styles.image} />
        <View style={styles.priceOverlay}>
          <Text style={styles.priceText}>${property.price}/{t('mo')}</Text>
        </View>
        <View style={styles.ratingContainer}>
          <Star size={12} color="#FFD700" fill="#FFD700" />
          <Text style={styles.ratingText}>{property.rating}</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{property.title}</Text>
        <View style={styles.locationContainer}>
          <MapPin size={14} color="#8E8E93" />
          <Text style={styles.locationText} numberOfLines={1}>{property.location}</Text>
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>{property.bedrooms} {t('bed')}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.detailText}>{property.bathrooms} {t('bath')}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.detailText}>{property.area} {t('sqft')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.card,
    marginBottom: theme.spacing.s4,
    ...theme.shadow.ios,
    elevation: theme.shadow.androidElevation,
  },
  imageContainer: {
    position: 'relative',
    borderTopLeftRadius: theme.radii.image,
    borderTopRightRadius: theme.radii.image,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  priceOverlay: {
    position: 'absolute',
    bottom: theme.spacing.s3,
    left: theme.spacing.s3,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: theme.spacing.s3,
    paddingVertical: 6,
    borderRadius: theme.radii.chip,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  ratingContainer: {
    position: 'absolute',
    top: theme.spacing.s3,
    right: theme.spacing.s3,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: theme.spacing.s3,
    paddingVertical: 4,
    borderRadius: theme.radii.chip,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
  },
  content: {
    padding: theme.spacing.s4,
  },
  title: {
    fontSize: theme.typography.cardTitle,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.title,
    marginBottom: theme.spacing.s2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: theme.typography.body,
    fontFamily: 'Inter-Regular',
    color: theme.colors.secondary,
    flex: 1,
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: theme.typography.body,
    fontFamily: 'Inter-Medium',
    color: theme.colors.muted,
  },
  separator: {
    fontSize: theme.typography.body,
    color: theme.colors.divider,
  },
});