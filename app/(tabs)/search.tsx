import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Image, TouchableOpacity, Dimensions, Platform, TextInput, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MOCK_PROPERTIES, MOCK_CARS } from '../../data/mockData';
import { Property } from '../../types/Property';
import { Car } from '../../types/Car';
import { t } from '../../i18n';
import { useRouter } from 'expo-router';
import { MapPin, Search, Filter, Star } from 'lucide-react-native';
import theme from '../theme';
import Header from '@/components/Header';
import PropertyFilters from '@/components/PropertyFilters';

const { width } = Dimensions.get('window');

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

type NearbyItem = (Property | Car) & { distanceKm: number; kind: 'property' | 'car' };

export default function SearchScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [items, setItems] = useState<NearbyItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [MapViewModule, setMapViewModule] = useState<any>(null);
  
  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        // use require so TypeScript/web bundler doesn't try to resolve at build time for web
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const m = require('react-native-maps');
        setMapViewModule(m);
      } catch (e) {
        console.warn('react-native-maps require failed', e);
      }
    }
  }, []);

  const NativeMap = MapViewModule ? MapViewModule.default : null;
  const Marker = MapViewModule ? MapViewModule.Marker : null;
  const mapRef = useRef<any>(null);

  const filters = ['All', 'Properties', 'Cars'];
  
  const filteredItems = items.filter(item => {
    const matchesSearch = searchQuery === '' || 
      ('title' in item ? item.title : item.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.kind === 'property' ? (item as Property).location : (item as Car).brand).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'All' || 
      (selectedFilter === 'Properties' && item.kind === 'property') ||
      (selectedFilter === 'Cars' && item.kind === 'car');
    
    return matchesSearch && matchesFilter;
  });

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLoading(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const userLat = loc.coords.latitude;
        const userLon = loc.coords.longitude;
        setLocation({ latitude: userLat, longitude: userLon });

        const props: NearbyItem[] = MOCK_PROPERTIES.map((p) => ({
          ...p,
          distanceKm: haversineDistance(userLat, userLon, p.latitude ?? 0, p.longitude ?? 0),
          kind: 'property',
        }));

        const cars: NearbyItem[] = MOCK_CARS.map((c) => ({
          ...c,
          distanceKm: haversineDistance(userLat, userLon, c.latitude ?? 0, c.longitude ?? 0),
          kind: 'car',
        }));

        const merged = [...props, ...cars].sort((a, b) => a.distanceKm - b.distanceKm);
        setItems(merged);
      } catch (e) {
        console.warn('Location error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('searchingNearby')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  let mapContent: any = null;
  if (Platform.OS === 'web') {
    // On web show image fallback; web-specific file will provide an interactive map
    mapContent = (
      <View style={styles.mapContainer}>
        <Image source={require('../../assets/images/test.jpg')} style={styles.mapImage} resizeMode="cover" />
        {location && items.slice(0, 10).map((it, idx) => {
          const dx = (it.longitude! - location.longitude) * 8000;
          const dy = (it.latitude! - location.latitude) * -8000;
          const left = width / 2 + dx - 12;
          const top = 120 + dy;
          return (
            <View key={`${it.id}-${idx}`} style={[styles.pin, { left, top }]}> 
              <View style={styles.pinDot} />
            </View>
          );
        })}
      </View>
    );
  } else if (NativeMap) {
    mapContent = (
      // @ts-ignore dynamic component
      <NativeMap
        style={styles.mapFull}
        initialRegion={{
          latitude: location?.latitude ?? 37.7749,
          longitude: location?.longitude ?? -122.4194,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsUserLocation={true}
        ref={(r: any) => { mapRef.current = r; }}
      >
        {items.map((it) => (
          Marker ? (
            // @ts-ignore dynamic Marker
            <Marker
              key={`${it.kind}-${it.id}`}
              coordinate={{ latitude: it.latitude ?? 0, longitude: it.longitude ?? 0 }}
              title={'title' in it ? it.title : it.name}
              description={`${it.distanceKm.toFixed(2)} km`}
              onPress={() => {
                try {
                  if (mapRef.current && it.latitude && it.longitude) {
                    // @ts-ignore
                    mapRef.current.animateToRegion({ latitude: it.latitude, longitude: it.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 500);
                  }
                } catch (err) { console.warn('animate failed', err); }
                // navigate to listing details
                router.push({ pathname: '/listing/[id]', params: { id: `${it.kind}-${it.id}` } });
              }}
            />
          ) : null
        ))}
      </NativeMap>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <PropertyFilters 
        selectedFilter={selectedFilter}
        onFilterChange={handleFilterChange}
      />
      
      {mapContent}

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionTitle}>{t('nearbyListings')}</Text>
        <View style={styles.propertiesGrid}>
          {filteredItems.map((item) => (
            <TouchableOpacity
              key={`${item.kind}-${item.id}`}
              style={styles.propertyCard}
              onPress={() => router.push({ pathname: '/listing/[id]', params: { id: `${item.kind}-${item.id}` } })}
            >
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.image} />
                <View style={styles.priceOverlay}>
                  <Text style={styles.priceText}>
                    {item.kind === 'property' 
                      ? `$${(item as Property).price}/${t('mo')}` 
                      : `$${(item as Car).pricePerDay}/${t('day')}`
                    }
                  </Text>
                </View>
                <View style={styles.ratingContainer}>
                  <Star size={12} color="#FFD700" fill="#FFD700" />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
              </View>
              
              <View style={styles.content}>
                <Text style={styles.title} numberOfLines={1}>
                  {'title' in item ? item.title : item.name}
                </Text>
                <View style={styles.locationContainer}>
                  <MapPin size={14} color="#8E8E93" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {item.kind === 'property' ? (item as Property).location : (item as Car).brand}
                  </Text>
                </View>
                {item.kind === 'property' ? (
                  <View style={styles.detailsContainer}>
                    <Text style={styles.detailText}>{(item as Property).bedrooms} {t('bed')}</Text>
                    <Text style={styles.separator}>•</Text>
                    <Text style={styles.detailText}>{(item as Property).bathrooms} {t('bath')}</Text>
                    <Text style={styles.separator}>•</Text>
                    <Text style={styles.detailText}>{(item as Property).area} {t('sqft')}</Text>
                  </View>
                ) : (
                  <View style={styles.detailsContainer}>
                    <Text style={styles.detailText}>{(item as Car).seats} {t('seats')}</Text>
                    <Text style={styles.separator}>•</Text>
                    <Text style={styles.detailText}>{(item as Car).fuelType}</Text>
                    <Text style={styles.separator}>•</Text>
                    <Text style={styles.detailText}>{(item as Car).year}</Text>
                  </View>
                )}
                <Text style={styles.distanceText}>{item.distanceKm.toFixed(1)} km away</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.secondary,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  mapContainer: {
    height: 200,
    backgroundColor: theme.colors.divider,
    overflow: 'hidden',
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  pin: {
    position: 'absolute',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: '#fff',
  },
  mapFull: {
    width: '100%',
    height: 200,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1A1A1A',
    marginBottom: 20,
    marginTop: 10,
  },
  propertiesGrid: {
    gap: 16,
  },
  propertyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    position: 'relative',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  priceOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  ratingContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    flex: 1,
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
  },
  separator: {
    fontSize: 15,
    color: '#E2E8F0',
  },
  distanceText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.primary,
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
});