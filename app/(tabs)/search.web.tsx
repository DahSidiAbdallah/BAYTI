import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../../app/theme';
import { MOCK_PROPERTIES, MOCK_CARS } from '../../data/mockData';
import { Property } from '../../types/Property';
import { Car } from '../../types/Car';
import { t } from '../../i18n';
import { MapPin, Search, Filter, Star } from 'lucide-react-native';

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

// helper: get user position (top-level to avoid deep nested functions)
async function getUserPosition(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { maximumAge: 1000 * 60 * 5 }
    );
  });
}

// helper: load leaflet css + script from CDN and return window.L
async function loadLeafletFromCDN(): Promise<any> {
  if ((window as any).L) return (window as any).L;
  // load CSS
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(css);

  // load script
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Leaflet script failed to load'));
    document.body.appendChild(s);
  });

  return (window as any).L;
}

// top-level helper to create a marker click handler (avoids deep nested closures)
function createMarkerClickHandler(map: any, marker: any, lat: number, lon: number) {
  return () => {
    try {
      map.setView([lat, lon], 14, { animate: true });
      marker.openPopup?.();
    } catch (err) {
      console.warn('marker click handler failed', err);
    }
  };
}

export default function SearchWeb() {
  const router = useRouter();
  const [items, setItems] = useState<NearbyItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<Array<{ id: string; marker: any; item: NearbyItem }>>([]);

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
        const pos = await getUserPosition();
        const userLat = pos?.lat ?? 37.7749;
        const userLon = pos?.lon ?? -122.4194;

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
        console.warn(e);
      }
    })();
  }, []);

  // load Leaflet CSS and JS from CDN, then initialize a plain Leaflet map
  useEffect(() => {
    if (!mapRef.current) return;
    const ensureLeaflet = async () => {
      const Leaflet = await loadLeafletFromCDN();
      if (!Leaflet) return;

      // create map
      const map = Leaflet.map(mapRef.current).setView([37.7749, -122.4194], 12);
      Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // add markers
      markersRef.current = [];
      items.forEach((it) => {
        const marker = Leaflet.marker([it.latitude ?? 0, it.longitude ?? 0]).addTo(map);
        const title = 'title' in it ? it.title : it.name;
        marker.bindPopup(`<strong>${title}</strong><div>${it.kind === 'property' ? (it as Property).location : (it as Car).brand}</div><div>${it.distanceKm.toFixed(2)} km</div>`);
        const onMarkerClick = createMarkerClickHandler(map, marker, it.latitude ?? 0, it.longitude ?? 0);
        marker.on('click', onMarkerClick);
        markersRef.current.push({ id: `${it.kind}-${it.id}`, marker, item: it });
      });

      leafletMapRef.current = map;

      return () => {
        try {
          map.remove();
        } catch (err) { console.warn('map remove failed', err); }
      };
    };

    ensureLeaflet().catch((e) => console.warn('Leaflet load failed', e));
  }, [items]);

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

      <div ref={(el) => { mapRef.current = el as unknown as HTMLDivElement | null; }} style={styles.webMap as any} />

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              // center map + open popup if possible, then navigate to details
              const id = `${item.kind}-${item.id}`;
              const found = markersRef.current.find((m) => m.id === id);
              if (found && leafletMapRef.current) {
                leafletMapRef.current.setView([item.latitude ?? 0, item.longitude ?? 0], 14, { animate: true });
                found.marker.openPopup();
              }
              router.push({ pathname: '/listing/[id]', params: { id } });
            }}
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
  webMap: {
    height: 200,
    width: '100%',
    backgroundColor: '#e6f0ff',
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
