import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Search, MapPin } from 'lucide-react-native';
import { t } from '@/i18n';

export default function Header() {
  const raw = String(t('locationName'));
  const [city, region] = raw.includes(',') ? raw.split(',').map(s => s.trim()) : [raw, ''];

  return (
    <View style={styles.container}>
      <View style={styles.left}> 
        <MapPin size={16} color="#8E8E93" style={styles.pin} />
        <View style={styles.locationTextContainer}>
          <Text style={styles.locationCity}>{city}</Text>
          {region ? <Text style={styles.locationRegion}>{region}</Text> : null}
        </View>
      </View>

      <TouchableOpacity style={styles.searchButton}>
        <Search size={20} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pin: {
    marginRight: 8,
  },
  locationTextContainer: {
    flexDirection: 'column',
  },
  locationCity: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1A1A1A',
  },
  locationRegion: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#8E8E93',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});