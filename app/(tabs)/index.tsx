import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { t } from '@/i18n';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import PropertyFilters from '@/components/PropertyFilters';
import PropertyCard from '@/components/PropertyCard';
import { MOCK_PROPERTIES } from '@/data/mockData';

export default function HomeScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [filteredProperties, setFilteredProperties] = useState(MOCK_PROPERTIES);

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    if (filter === 'All') {
      setFilteredProperties(MOCK_PROPERTIES);
    } else {
      setFilteredProperties(MOCK_PROPERTIES.filter(property => property.type === filter));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <PropertyFilters 
        selectedFilter={selectedFilter}
        onFilterChange={handleFilterChange}
      />
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
  <Text style={styles.sectionTitle}>{t('featuredProperties')}</Text>
        <View style={styles.propertiesGrid}>
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} onPress={() => router.push(`/listing/${property.id}`)} />
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
});