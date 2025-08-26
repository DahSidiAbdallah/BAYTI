import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { t } from '@/i18n';
import { SafeAreaView } from 'react-native-safe-area-context';
import CarCard from '@/components/CarCard';
import { MOCK_CARS } from '@/data/mockData';

export default function CarsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
  <Text style={styles.headerTitle}>{t('carRentals')}</Text>
  <Text style={styles.headerSubtitle}>{t('findYourPerfectRide')}</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
  <Text style={styles.sectionTitle}>{t('availableCars')}</Text>
        <View style={styles.carsGrid}>
          {MOCK_CARS.map((car) => (
            <CarCard key={car.id} car={car} onPress={() => router.push(`/listing/${car.id}`)} />
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1A1A1A',
    marginBottom: 16,
    marginTop: 16,
  },
  carsGrid: {
    gap: 16,
  },
});