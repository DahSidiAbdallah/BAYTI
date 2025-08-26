import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Image, TouchableOpacity, Dimensions, Platform, TextInput } from 'react-native';
import * as Location from 'expo-location';
import { MOCK_PROPERTIES, MOCK_CARS } from '../../data/mockData';
import { Property } from '../../types/Property';
import { Car } from '../../types/Car';
import { t } from '../../i18n';
import { useRouter } from 'expo-router';

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
  function itemLocationText(it: NearbyItem) {
    return it.kind === 'property' ? (it as Property).location : (it as Car).brand;
  }

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
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>{t('searchingNearby') || 'Finding nearby places...'}</Text>
      </View>
    );
  }

  let mapContent: any = null;
  if (Platform.OS === 'web') {
    // On web the native file shows the image fallback; web-specific file will provide an interactive map
    mapContent = (
      <>
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
      </>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('nearby') || 'Nearby'}</Text>
        <Text style={styles.headerSubtitle}>{t('searchingNearby') || 'Places near you'}</Text>
        <View style={styles.searchRow}>
          <TextInput placeholder={t('searchPlaceholder') || 'Search places or cars'} style={styles.searchInput} />
        </View>
      </View>

      <View style={styles.mapContainer}>{mapContent}</View>

      <FlatList
        data={items}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        contentContainerStyle={{ paddingBottom: 48 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: '/listing/[id]', params: { id: `${item.kind}-${item.id}` } })}
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
  container: { flex: 1, backgroundColor: '#fafafa' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, color: '#666' },
  mapContainer: { height: 260, backgroundColor: '#eee', overflow: 'hidden' },
  mapImage: { width: '100%', height: '100%', opacity: 0.7 },
  pin: { position: 'absolute', width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  pinDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#e53935', borderWidth: 2, borderColor: '#fff' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerSubtitle: { color: '#666', marginTop: 4 },
  searchRow: { marginTop: 12 },
  searchInput: { backgroundColor: '#f0f0f0', padding: 10, borderRadius: 10 },
  card: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', marginHorizontal: 12, marginTop: 12, borderRadius: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardImage: { width: 72, height: 72, borderRadius: 8, marginRight: 12 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSubtitle: { color: '#666', marginTop: 4 },
  badge: { backgroundColor: '#007AFF', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 18 },
  badgeText: { color: '#fff', fontWeight: '700' },
  mapFull: { width: '100%', height: '100%' },
});
