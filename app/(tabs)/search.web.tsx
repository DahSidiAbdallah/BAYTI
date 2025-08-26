import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, TextInput } from 'react-native';
import theme from '../../app/theme';
import { MOCK_PROPERTIES, MOCK_CARS } from '../../data/mockData';
import { Property } from '../../types/Property';
import { Car } from '../../types/Car';
import { t } from '../../i18n';

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
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<Array<{ id: string; marker: any; item: NearbyItem }>>([]);

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

  function itemLocationText(it: NearbyItem) {
    return it.kind === 'property' ? (it as Property).location : (it as Car).brand;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('nearby') || 'Nearby'}</Text>
        <Text style={styles.headerSubtitle}>{t('searchingNearby') || 'Places near you'}</Text>
        <View style={styles.searchRow}>
          <TextInput placeholder={t('searchPlaceholder') || 'Search places or cars'} style={styles.searchInput} />
        </View>
      </View>

      <div ref={(el) => { mapRef.current = el as unknown as HTMLDivElement | null; }} style={styles.webMap as any} />

      <FlatList
        data={items}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        contentContainerStyle={{ paddingBottom: theme.spacing.s6 }}
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
              <Text style={styles.cardTitle}>{'title' in item ? item.title : item.name}</Text>
              <Text style={styles.cardSubtitle}>{item.kind === 'property' ? (item as Property).location : (item as Car).brand}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.distanceKm.toFixed(1)} km</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surfaceAlt },
  header: { padding: theme.spacing.s4, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.divider },
  headerTitle: { fontSize: theme.typography.screenTitle, fontWeight: '600', color: theme.colors.title },
  headerSubtitle: { color: theme.colors.secondary, marginTop: theme.spacing.s2 },
  searchRow: { marginTop: theme.spacing.s3 },
  searchInput: { backgroundColor: '#F1F5F9', padding: theme.spacing.s3, borderRadius: theme.radii.chip, fontSize: theme.typography.body },
  webMap: { height: 360, width: '100%', backgroundColor: '#e6f0ff', marginTop: theme.spacing.s3 },
  card: { flexDirection: 'row', padding: theme.spacing.s3, backgroundColor: theme.colors.surface, marginHorizontal: theme.spacing.s3, marginTop: theme.spacing.s3, borderRadius: theme.radii.card, alignItems: 'center', ...theme.shadow.ios, elevation: theme.shadow.androidElevation },
  cardImage: { width: 84, height: 84, borderRadius: theme.radii.image, marginRight: theme.spacing.s3 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: theme.typography.cardTitle, fontWeight: '600', color: theme.colors.title },
  cardSubtitle: { color: theme.colors.secondary, marginTop: theme.spacing.s2, fontSize: theme.typography.body },
  badge: { backgroundColor: theme.colors.primary, paddingVertical: 6, paddingHorizontal: theme.spacing.s3, borderRadius: 18 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: theme.typography.micro },
});
