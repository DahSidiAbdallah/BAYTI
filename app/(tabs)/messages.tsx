import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { t } from '@/i18n';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageSquare, CircleAlert as AlertCircle, FileText, DollarSign } from 'lucide-react-native';

export default function MessagesScreen() {
  const quickActions = [
    { id: 1, title: t('reportIssue'), icon: AlertCircle, color: '#FF6B6B', description: t('reportMaintenance') },
    { id: 2, title: t('payRent'), icon: DollarSign, color: '#34C759', description: t('makeRentPayment') },
    { id: 3, title: t('viewContract'), icon: FileText, color: '#007AFF', description: t('accessLease') },
    { id: 4, title: t('contactLandlord'), icon: MessageSquare, color: '#FF9500', description: t('sendMessage') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
      <Text style={styles.headerTitle}>{t('tenantServices')}</Text>
        <Text style={styles.headerSubtitle}>{t('manageRentalExperience')}</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
  <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.id} style={styles.actionCard}>
              <View style={[styles.iconContainer, { backgroundColor: `${action.color}20` }]}>
                <action.icon size={24} color={action.color} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionDescription}>{action.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

  <Text style={styles.sectionTitle}>{t('recentActivity')}</Text>
        <View style={styles.activityCard}>
          <Text style={styles.activityTitle}>{t('rentPaymentProcessed')}</Text>
          <Text style={styles.activityDescription}>
            {t('rentPaymentProcessedDescription', { amount: '$2,200' })}
          </Text>
          <Text style={styles.activityDate}>{t('daysAgo', { count: 2 })}</Text>
        </View>

        <View style={styles.activityCard}>
          <Text style={styles.activityTitle}>{t('maintenanceRequestUpdated')}</Text>
          <Text style={styles.activityDescription}>
            {t('maintenanceRequestScheduled', { when: t('tomorrow') })}
          </Text>
          <Text style={styles.activityDate}>{t('daysAgo', { count: 5 })}</Text>
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
    marginTop: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#8E8E93',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6C757D',
    marginBottom: 8,
    lineHeight: 20,
  },
  activityDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#8E8E93',
  },
});