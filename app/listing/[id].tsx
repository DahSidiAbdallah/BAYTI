import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, ImageBackground, TouchableOpacity, Image, Modal, FlatList, Platform as RNPlatform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MOCK_PROPERTIES, MOCK_CARS } from '../../data/mockData';
import { ChevronLeft, Bookmark, Star, MapPin, Phone, MessageSquare } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../theme';
// ...existing code...

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
  const idParam = (params as any).id as string | undefined;
  const [expanded, setExpanded] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // pick item by id if provided, else first available
  let item: any = null;
  if (idParam && typeof idParam === 'string') {
    const parts = idParam.split('-');
    const kind = parts[0];
    const rawId = parts.slice(1).join('-');
    if (kind === 'property') item = MOCK_PROPERTIES.find((p) => String(p.id) === rawId);
    else if (kind === 'car') item = MOCK_CARS.find((c) => String(c.id) === rawId);
  }
  if (!item) {
    // fallback: first property or car
    item = MOCK_PROPERTIES[0] ?? MOCK_CARS[0];
  }

  const title = 'title' in item ? item.title : item.name;
  const subtitle = 'location' in item ? item.location : item.brand;

  const openGallery = (index = 0) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  // initialize listing map on web after mount
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

  // render a small map view centered on this listing
  // ...existing code...

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        <ImageBackground source={{ uri: item.image }} style={styles.hero} imageStyle={{ borderBottomLeftRadius: theme.radii.image, borderBottomRightRadius: theme.radii.image }}>
          <View style={styles.heroTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}><ChevronLeft color="#fff" size={theme.iconSizes.topBar} /></TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}><Bookmark color="#fff" size={theme.iconSizes.topBar} /></TouchableOpacity>
          </View>
          <LinearGradient colors={[ 'rgba(0,0,0,0.0)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.7)' ]} style={styles.gradient} />
          <View style={styles.heroBottom}>
            <Text style={styles.heroTitle}>{title}</Text>
            <View style={styles.heroMeta}>
              <MapPin size={theme.iconSizes.inline} color="#fff" />
              <Text style={styles.heroLocation}>{subtitle}</Text>
              <View style={styles.ratingWrap}>
                <Star size={theme.iconSizes.meta} color="#ffd54f" />
                <Text style={styles.ratingText}>{(item.rating ?? 4.8).toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.section}>
          <View style={styles.chipsRow}>
            <View style={styles.chip}><Text style={styles.chipText}>{item.beds ?? '—'} Beds</Text></View>
            <View style={styles.chip}><Text style={styles.chipText}>{item.toilets ?? '—'} Toilets</Text></View>
            <View style={styles.chip}><Text style={styles.chipText}>{item.garage ?? '—'} Garage</Text></View>
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{expanded ? item.description ?? '' : (item.description ?? '').slice(0, 220)}{!expanded && (item.description ?? '').length > 220 ? '...' : ''}</Text>
          { (item.description ?? '').length > 220 ? (
            <TouchableOpacity onPress={() => setExpanded(!expanded)}><Text style={styles.showMore}>{expanded ? 'Show less' : 'Show More'}</Text></TouchableOpacity>
          ) : null }

          <View style={styles.ownerRow}>
            <Image source={{ uri: item.ownerAvatar ?? 'https://picsum.photos/64' }} style={styles.ownerAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.ownerName}>{item.ownerName ?? 'Owner'}</Text>
              <Text style={styles.ownerRole}>Owner</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: theme.spacing.s3 }}>
              <TouchableOpacity style={styles.contactIcon}><Phone color="#fff" size={theme.iconSizes.inline} /></TouchableOpacity>
              <TouchableOpacity style={styles.contactIcon}><MessageSquare color="#fff" size={theme.iconSizes.inline} /></TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Gallery</Text>
          <FlatList data={item.gallery ?? [item.image]} horizontal keyExtractor={(_, i) => String(i)} renderItem={({ item: g, index }) => (
            <TouchableOpacity onPress={() => openGallery(index)}>
              <Image source={{ uri: g }} style={styles.galleryThumb} />
            </TouchableOpacity>
          )} showsHorizontalScrollIndicator={false} />

    <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Location</Text>
    <MapPreview />
        </View>
      </ScrollView>

    <TouchableOpacity style={styles.rentBtn}><Text style={styles.rentBtnText}>Rent Now</Text></TouchableOpacity>

      <Modal visible={galleryOpen} transparent onRequestClose={() => setGalleryOpen(false)}>
        <View style={styles.modalBackdrop}>
          <FlatList data={item.gallery ?? [item.image]} horizontal pagingEnabled initialScrollIndex={galleryIndex} keyExtractor={(_, i) => String(i)} renderItem={({ item: g }) => (
            <Image source={{ uri: g }} style={styles.modalImage} />
          )} />
          <TouchableOpacity style={styles.modalClose} onPress={() => setGalleryOpen(false)}><Text style={{ color: '#fff' }}>Close</Text></TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

// initialize leaflet map when on web and element is present
function initListingMap(elId: string, lat?: number, lon?: number) {
  if (typeof window === 'undefined') return;
  loadLeaflet().then((L: any) => {
    try {
      const el = document.getElementById(elId);
      if (!el) return;
      // clear previous
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

function MapPreview({ lat, lon, image }: Readonly<{ lat?: number; lon?: number; image?: string }>) {
  if (RNPlatform.OS === 'web') {
    return (
      <div style={{ width: '100%', height: 220 }} id="listing-map" />
    );
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const MapView = require('react-native-maps').default;
    return (
      // @ts-ignore
      <MapView style={{ width: '100%', height: 220 }} initialRegion={{ latitude: lat ?? 37.7749, longitude: lon ?? -122.4194, latitudeDelta: 0.01, longitudeDelta: 0.01 }} />
    );
  } catch (err) {
    console.warn('react-native-maps not available', err);
    return <Image source={require('../../assets/images/test.jpg')} style={styles.mapPreview} />;
  }
}

const styles = StyleSheet.create({
  hero: { height: 340, width: '100%', justifyContent: 'space-between' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', padding: theme.spacing.s3, marginTop: theme.spacing.s3 },
  iconBtn: { backgroundColor: 'rgba(0,0,0,0.4)', padding: theme.spacing.s2, borderRadius: theme.radii.chip },
  gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 140, borderBottomLeftRadius: theme.radii.image, borderBottomRightRadius: theme.radii.image },
  heroBottom: { padding: theme.spacing.s4, paddingTop: 0 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  heroMeta: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.s2 },
  heroLocation: { color: '#fff', marginLeft: theme.spacing.s2, marginRight: theme.spacing.s4 },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: theme.spacing.s3, paddingVertical: 4, borderRadius: theme.radii.chip },
  ratingText: { color: '#fff', marginLeft: theme.spacing.s2, fontWeight: '700' },
  section: { padding: theme.spacing.s4 },
  chipsRow: { flexDirection: 'row', marginTop: theme.spacing.s2 },
  chip: { backgroundColor: theme.colors.surface, padding: theme.spacing.s2, borderRadius: theme.radii.chip, borderWidth: 1, borderColor: theme.colors.divider, marginRight: theme.spacing.s3 },
  chipText: { fontWeight: '700', fontSize: theme.typography.micro },
  sectionTitle: { fontSize: theme.typography.cardTitle, fontWeight: '700', marginTop: theme.spacing.s3, color: theme.colors.title },
  description: { color: theme.colors.secondary, marginTop: theme.spacing.s2, lineHeight: 20, fontSize: theme.typography.body },
  showMore: { color: theme.colors.primary, marginTop: theme.spacing.s2 },
  ownerRow: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.s4 },
  ownerAvatar: { width: 56, height: 56, borderRadius: 28, marginRight: theme.spacing.s3 },
  ownerName: { fontWeight: '700' },
  ownerRole: { color: theme.colors.secondary, fontSize: theme.typography.micro },
  contactIcon: { backgroundColor: theme.colors.primary, padding: theme.spacing.s2, borderRadius: theme.radii.button, marginLeft: theme.spacing.s2 },
  galleryThumb: { width: 120, height: 90, borderRadius: theme.radii.image, marginRight: theme.spacing.s3, marginTop: theme.spacing.s2 },
  mapPreview: { width: '100%', height: 160, borderRadius: theme.radii.image, marginTop: theme.spacing.s2 },
  rentBtn: { backgroundColor: theme.colors.primary, margin: theme.spacing.s4, padding: theme.spacing.s4, borderRadius: theme.radii.button, alignItems: 'center', ...theme.shadow.ios, elevation: theme.shadow.androidElevation },
  rentBtnText: { color: '#fff', fontWeight: '800', fontSize: theme.typography.body },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  modalImage: { width: '100%', height: '80%', resizeMode: 'cover' },
  modalClose: { position: 'absolute', top: theme.spacing.s6, right: theme.spacing.s4, padding: theme.spacing.s2 },
});
