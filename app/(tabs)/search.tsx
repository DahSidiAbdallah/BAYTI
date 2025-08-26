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
          <Text style={styles.loadingText}>{t('searchingNearby') || 'Finding nearby places...'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  let mapContent: any = null;
  if (Platform.OS === 'web') {
    // On web the native file shows the image fallback; web-specific file will provide an interactive map
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
      <View style={styles.header}>
        <View style={styles.locationRow}>
          <MapPin size={16} color={theme.colors.secondary} />
          <Text style={styles.locationText}>{t('locationName')}</Text>
        </View>
        <Text style={styles.headerTitle}>{t('nearby') || 'Discover Nearby'}</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Search size={20} color={theme.colors.secondary} style={styles.searchIcon} />
            <TextInput 
              placeholder={t('searchPlaceholder') || 'Search properties and cars...'} 
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.colors.secondary}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                selectedFilter === filter && styles.activeFilterChip
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterChipText,
                selectedFilter === filter && styles.activeFilterChipText
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {mapContent}

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: '/listing/[id]', params: { id: `${item.kind}-${item.id}` } })}
          >
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {'title' in item ? item.title : item.name}
                </Text>
                <View style={styles.ratingContainer}>
                  <Star size={12} color="#FFD700" fill="#FFD700" />
                  <Text style={styles.ratingText}>{item.rating?.toFixed(1)}</Text>
                </View>
              </View>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {item.kind === 'property' ? (item as Property).location : (item as Car).brand}
              </Text>
              <Text style={styles.cardPrice}>
                {item.kind === 'property' 
                  ? `$${(item as Property).price}/${t('mo')}` 
                  : `$${(item as Car).pricePerDay}/${t('day')}`
                }
              </Text>
            </View>
            <Text style={styles.distanceText}>{item.distanceKm.toFixed(1)} km</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfaceAlt,
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
  header: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.secondary,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: theme.colors.title,
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 25,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.title,
  },
  filterButton: {
    backgroundColor: theme.colors.surfaceAlt,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  filtersContainer: {
    marginBottom: 8,
  },
  filtersContent: {
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  activeFilterChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.secondary,
  },
  activeFilterChipText: {
    color: '#fff',
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
    height: '100%',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    marginTop: 16,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    ...theme.shadow.ios,
    elevation: theme.shadow.androidElevation,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  cardBody: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.title,
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.title,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.secondary,
    marginBottom: 8,
  },
  cardPrice: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: theme.colors.primary,
  },
  distanceText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.secondary,
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: theme.colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
