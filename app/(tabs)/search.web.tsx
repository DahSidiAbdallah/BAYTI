import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../../app/theme';
import { MOCK_PROPERTIES, MOCK_CARS } from '../../data/mockData';
import { Property } from '../../types/Property';
import { Car } from '../../types/Car';
import { t } from '../../i18n';
import { MapPin, Star } from 'lucide-react-native';
import Header from '@/components/Header';
import PropertyFilters from '@/components/PropertyFilters';

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

// Helper: get user position (top-level to avoid deep nested functions)
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

// Helper: load leaflet css + script from CDN and return window.L
async function loadLeafletFromCDN(): Promise<any> {
  if ((window as any).L) return (window as any).L;
  // Load CSS
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(css);

  // Load script
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Leaflet script failed to load'));
    document.body.appendChild(s);
  });

  return (window as any).L;
}

// Top-level helper to create a marker click handler (avoids deep nested closures)
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
  const [selectedFilter, setSelectedFilter] = useState('All');
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<Array<{ id: string; marker: any; item: NearbyItem }>>([]);
  
  const filteredItems = items.filter(item => {
    const matchesFilter = selectedFilter === 'All' || 
      (selectedFilter === 'Properties' && item.kind === 'property') ||
      (selectedFilter === 'Cars' && item.kind === 'car');
    
    return matchesFilter;
  });

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

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

  // Load Leaflet CSS and JS from CDN, then initialize a plain Leaflet map
  useEffect(() => {
    if (!mapRef.current) return;
    const ensureLeaflet = async () => {
      const Leaflet = await loadLeafletFromCDN();
      if (!Leaflet) return;

      // Create map
      const map = Leaflet.map(mapRef.current).setView([37.7749, -122.4194], 12);
      Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Add markers
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
      <Header />
      <PropertyFilters 
        selectedFilter={selectedFilter}
        onFilterChange={handleFilterChange}
      />

      <div ref={(el) => { mapRef.current = el as unknown as HTMLDivElement | null; }} style={styles.webMap as any} />

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
              onPress={() => {
                // Center map + open popup if possible, then navigate to details
                const id = `${item.kind}-${item.id}`;
                const found = markersRef.current.find((m) => m.id === id);
                if (found && leafletMapRef.current) {
                  leafletMapRef.current.setView([item.latitude ?? 0, item.longitude ?? 0], 14, { animate: true });
                  found.marker.openPopup();
                }
                router.push(`/listing/${item.id}`);
              }}
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
  webMap: {
    height: 200,
    width: '100%',
    backgroundColor: '#e6f0ff',
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