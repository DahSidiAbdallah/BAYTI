import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, ImageBackground, TouchableOpacity, Image, Modal, FlatList, Platform as RNPlatform, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MOCK_PROPERTIES, MOCK_CARS } from '../../data/mockData';
import { ChevronLeft, Star, MapPin, Phone, MessageSquare, Heart, Share2, Calendar, Users, Car as CarIcon, Home as HomeIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../theme';
import { t } from '@/i18n';

const { width } = Dimensions.get('window');

// Leaflet helpers for web
async function loadLeaflet() {
  if ((window as any).L) return (window as any).L;
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(css);
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('leaflet load failed'));
    document.body.appendChild(s);
  });
  return (window as any).L;
}

export default function ListingDetails() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const [expanded, setExpanded] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  // Find the correct item based on the ID parameter
  let item: any = null;
  if (idParam && typeof idParam === 'string') {
    if (idParam.startsWith('property-')) {
      const propertyId = idParam.replace('property-', '');
      item = MOCK_PROPERTIES.find((p) => String(p.id) === propertyId);
    } else if (idParam.startsWith('car-')) {
      const carId = idParam.replace('car-', '');
      item = MOCK_CARS.find((c) => String(c.id) === carId);
    }
  }
  
  // If no item found, fallback to first property
  if (!item) {
    item = MOCK_PROPERTIES[0];
  }

  const isProperty = 'title' in item;
  const title = 'title' in item ? item.title : item.name;
  const subtitle = 'location' in item ? item.location : `${item.brand} ${item.year}`;
  const price = isProperty ? `$${item.price}/${t('mo')}` : `$${item.pricePerDay}/${t('day')}`;

  const openGallery = (index = 0) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  // Initialize listing map on web after mount
  useEffect(() => {
    if (RNPlatform.OS === 'web') {
      initListingMap('listing-map', item.latitude, item.longitude);
    }
    return () => {
      if (RNPlatform.OS === 'web') {
        const el = document.getElementById('listing-map');
        if (el && (el as any).__leafletMap) {
          try { (el as any).__leafletMap.remove(); } catch (err) { console.warn('remove map failed', err); }
        }
      }
    };
  }, [item.latitude, item.longitude]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        <ImageBackground 
          source={{ uri: item.image }} 
          style={styles.hero} 
          imageStyle={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
        >
          <View style={styles.heroTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <ChevronLeft color="#fff" size={24} />
            </TouchableOpacity>
            <View style={styles.topRightActions}>
              <TouchableOpacity style={styles.iconBtn}>
                <Share2 color="#fff" size={20} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconBtn}
                onPress={() => setIsFavorited(!isFavorited)}
              >
                <Heart 
                  color={isFavorited ? "#FF6B6B" : "#fff"} 
                  fill={isFavorited ? "#FF6B6B" : "transparent"}
                  size={20} 
                />
              </TouchableOpacity>
            </View>
          </View>
          <LinearGradient 
            colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']} 
            style={styles.gradient} 
          />
          <View style={styles.heroBottom}>
            <Text style={styles.heroTitle}>{title}</Text>
            <View style={styles.heroMeta}>
              <MapPin size={theme.iconSizes.inline} color="#fff" />
              <Text style={styles.heroLocation}>{subtitle}</Text>
            </View>
            <View style={styles.priceRatingRow}>
              <Text style={styles.heroPrice}>{price}</Text>
              <View style={styles.ratingWrap}>
                <Star size={14} color="#FFD700" fill="#FFD700" />
                <Text style={styles.ratingText}>{(item.rating ?? 4.8).toFixed(1)}</Text>
              </View>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.section}>
          {isProperty ? (
            <View style={styles.featuresRow}>
              <View style={styles.featureItem}>
                <HomeIcon size={20} color={theme.colors.primary} />
                <Text style={styles.featureText}>{item.bedrooms} {t('bed')}</Text>
              </View>
              <View style={styles.featureItem}>
                <Users size={20} color={theme.colors.primary} />
                <Text style={styles.featureText}>{item.bathrooms} {t('bath')}</Text>
              </View>
              <View style={styles.featureItem}>
                <MapPin size={20} color={theme.colors.primary} />
                <Text style={styles.featureText}>{item.area} {t('sqft')}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.featuresRow}>
              <View style={styles.featureItem}>
                <CarIcon size={20} color={theme.colors.primary} />
                <Text style={styles.featureText}>{item.brand}</Text>
              </View>
              <View style={styles.featureItem}>
                <Users size={20} color={theme.colors.primary} />
                <Text style={styles.featureText}>{item.seats} {t('seats')}</Text>
              </View>
              <View style={styles.featureItem}>
                <Calendar size={20} color={theme.colors.primary} />
                <Text style={styles.featureText}>{item.year}</Text>
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>{t('description')}</Text>
          <Text style={styles.description}>
            {expanded ? getDefaultDescription(isProperty) : getDefaultDescription(isProperty).slice(0, 150)}
            {!expanded && getDefaultDescription(isProperty).length > 150 ? '...' : ''}
          </Text>
          {getDefaultDescription(isProperty).length > 150 && (
            <TouchableOpacity onPress={() => setExpanded(!expanded)}>
              <Text style={styles.showMore}>{expanded ? 'Show less' : 'Show More'}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.ownerRow}>
            <Image 
              source={{ uri: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop' }} 
              style={styles.ownerAvatar} 
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.ownerName}>Sarah Johnson</Text>
              <Text style={styles.ownerRole}>{isProperty ? 'Property Owner' : 'Car Owner'}</Text>
              <View style={styles.ownerRating}>
                <Star size={12} color="#FFD700" fill="#FFD700" />
                <Text style={styles.ownerRatingText}>4.9 • 127 reviews</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: theme.spacing.s3 }}>
              <TouchableOpacity style={styles.contactIcon}>
                <Phone color="#fff" size={16} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactIcon}>
                <MessageSquare color="#fff" size={16} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{t('gallery')}</Text>
          <FlatList 
            data={[item.image, item.image, item.image]} 
            horizontal 
            keyExtractor={(_, i) => String(i)} 
            renderItem={({ item: g, index }) => (
              <TouchableOpacity onPress={() => openGallery(index)}>
                <Image source={{ uri: g }} style={styles.galleryThumb} />
              </TouchableOpacity>
            )} 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          />

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{t('location')}</Text>
          <MapPreview lat={item.latitude} lon={item.longitude} />
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.bottomPrice}>{price}</Text>
          <Text style={styles.bottomPriceLabel}>{isProperty ? 'per month' : 'per day'}</Text>
        </View>
        <TouchableOpacity style={styles.rentBtn}>
          <Text style={styles.rentBtnText}>{isProperty ? 'Contact Owner' : 'Book Now'}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={galleryOpen} transparent onRequestClose={() => setGalleryOpen(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setGalleryOpen(false)}>
            <ChevronLeft color="#fff" size={24} />
          </TouchableOpacity>
          <FlatList 
            data={[item.image, item.image, item.image]} 
            horizontal 
            pagingEnabled 
            initialScrollIndex={galleryIndex} 
            keyExtractor={(_, i) => String(i)} 
            renderItem={({ item: g }) => (
              <Image source={{ uri: g }} style={styles.modalImage} />
            )} 
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getDefaultDescription(isProperty: boolean) {
  if (isProperty) {
    return "This beautiful property offers modern amenities and comfortable living spaces. Located in a prime area with easy access to transportation, shopping, and dining. Perfect for families or professionals looking for quality accommodation. The property features high-end finishes, spacious rooms, and excellent natural lighting throughout.";
  }
  return "Well-maintained vehicle with excellent performance and comfort features. Regular maintenance and cleaning ensure a premium experience for all passengers. Ideal for city trips, business travel, or weekend getaways. Features include GPS navigation, premium sound system, and comprehensive insurance coverage.";
}

// Initialize leaflet map when on web and element is present
function initListingMap(elId: string, lat?: number, lon?: number) {
  if (typeof window === 'undefined') return;
  loadLeaflet().then((L: any) => {
    try {
      const el = document.getElementById(elId);
      if (!el) return;
      // Clear previous
      if ((el as any).__leafletMap) {
        try { (el as any).__leafletMap.remove(); } catch (err) { console.warn('remove existing map failed', err); }
      }
      const map = L.map(el).setView([lat ?? 37.7749, lon ?? -122.4194], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
      if (lat && lon) {
        L.marker([lat, lon]).addTo(map).bindPopup('<strong>Listing location</strong>');
      }
      (el as any).__leafletMap = map;
    } catch (err) { console.warn('initListingMap failed', err); }
  }).catch((err) => console.warn('loadLeaflet failed', err));
}

function MapPreview({ lat, lon }: Readonly<{ lat?: number; lon?: number }>) {
  if (RNPlatform.OS === 'web') {
    return (
      <div style={{ width: '100%', height: 200, borderRadius: 16, overflow: 'hidden' }} id="listing-map" />
    );
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const MapView = require('react-native-maps').default;
    const Marker = require('react-native-maps').Marker;
    return (
      // @ts-ignore
      <MapView 
        style={styles.mapPreview} 
        initialRegion={{ 
          latitude: lat ?? 37.7749, 
          longitude: lon ?? -122.4194, 
          latitudeDelta: 0.01, 
          longitudeDelta: 0.01 
        }} 
      >
        {/* @ts-ignore */}
        <Marker coordinate={{ latitude: lat ?? 37.7749, longitude: lon ?? -122.4194 }} />
      </MapView>
    );
  } catch (err) {
    console.warn('react-native-maps not available', err);
    return <Image source={require('../../assets/images/test.jpg')} style={styles.mapPreview} />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  hero: {
    height: 320,
    width: '100%',
    justifyContent: 'space-between',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
  },
  topRightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
  },
  heroBottom: {
    padding: 20,
    paddingTop: 0,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroLocation: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  priceRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroPrice: {
    color: '#fff',
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backdropFilter: 'blur(10px)',
  },
  ratingText: {
    color: '#fff',
    marginLeft: 6,
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  section: {
    padding: 20,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.surfaceAlt,
    padding: 24,
    borderRadius: 20,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureItem: {
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    color: theme.colors.title,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: theme.colors.title,
    marginBottom: 16,
  },
  description: {
    color: theme.colors.secondary,
    lineHeight: 24,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  showMore: {
    color: theme.colors.primary,
    marginTop: 12,
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 28,
    backgroundColor: theme.colors.surfaceAlt,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ownerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  ownerName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: theme.colors.title,
  },
  ownerRole: {
    color: theme.colors.secondary,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  ownerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ownerRatingText: {
    color: theme.colors.secondary,
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    marginLeft: 4,
  },
  contactIcon: {
    backgroundColor: theme.colors.primary,
    padding: 14,
    borderRadius: 24,
    marginLeft: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  galleryThumb: {
    width: 120,
    height: 90,
    borderRadius: 12,
    marginRight: 12,
  },
  mapPreview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginTop: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  priceContainer: {
    flex: 1,
  },
  bottomPrice: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: theme.colors.title,
  },
  bottomPriceLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.secondary,
    marginTop: 2,
  },
  rentBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 28,
    minWidth: 160,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  rentBtnText: {
    color: '#fff',
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: width,
    height: '80%',
    resizeMode: 'contain',
  },
  modalClose: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 24,
  },
});