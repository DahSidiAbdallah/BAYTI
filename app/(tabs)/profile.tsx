import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, I18nManager, DevSettings, Modal, Pressable } from 'react-native';
import { t, default as i18n } from '@/i18n';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Settings, CreditCard, FileText, LogOut, ChevronRight } from 'lucide-react-native';

export default function ProfileScreen() {
  const [langModalVisible, setLangModalVisible] = useState(false);

  async function setLocale(next: string) {
    try {
      i18n.locale = next;
      // persist selection
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('app_locale', next);
        } else if (Platform.OS !== 'web') {
          try {
            const pkg = '@react-native-async-storage' + '/async-storage';
            // eslint-disable-next-line global-require, import/no-extraneous-dependencies
            const AsyncStorage = require(pkg).default;
            if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
              AsyncStorage.setItem('app_locale', next).catch(() => {});
            }
          } catch (e) {
            /* ignore if AsyncStorage not installed */
          }
        }
      } catch (e) {
        /* ignore storage errors */
      }

      const wantRtl = next === 'ar';
      if (Platform.OS === 'web') {
        if (typeof document !== 'undefined' && document.documentElement) {
          document.documentElement.dir = wantRtl ? 'rtl' : 'ltr';
        }
        if (typeof window !== 'undefined') window.location.reload();
      } else {
        I18nManager.allowRTL(wantRtl);
        I18nManager.forceRTL(wantRtl);
        if ((DevSettings as any) && typeof (DevSettings as any).reload === 'function') {
          (DevSettings as any).reload();
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to set locale', e);
    }
  }
  const menuItems = [
    { id: 1, title: t('paymentMethods'), icon: CreditCard, description: t('manageCards') },
    { id: 2, title: t('documents'), icon: FileText, description: t('contractsAndReceipts') },
    { id: 3, title: t('settings'), icon: Settings, description: t('appPreferences') },
  { id: 4, title: t('toggleLanguage'), icon: Settings, description: t('languageFrench') },
  { id: 5, title: t('logout'), icon: LogOut, description: t('signOut') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
  <Text style={styles.headerTitle}>{t('profile')}</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <User size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.profileName}>{t('profileName')}</Text>
          <Text style={styles.profileEmail}>{t('profileEmail')}</Text>
          <Text style={styles.profileStatus}>{t('verifiedTenant')}</Text>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => item.id === 4 ? setLangModalVisible(true) : null}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconContainer}>
                  <item.icon size={20} color="#007AFF" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuDescription}>{item.description}</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#8E8E93" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>{t('propertiesViewed')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>{t('applicationsSent')}</Text>
          </View>
        </View>

        <Modal
          visible={langModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setLangModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{t('toggleLanguage')}</Text>
              <TouchableOpacity style={styles.langOption} onPress={() => { setLangModalVisible(false); setLocale('fr'); }}>
                <Text style={styles.langOptionText}>{t('languageFrench')}</Text>
                {String(i18n.locale).startsWith('fr') ? <Text> ✓</Text> : null}
              </TouchableOpacity>
              <TouchableOpacity style={styles.langOption} onPress={() => { setLangModalVisible(false); setLocale('en'); }}>
                <Text style={styles.langOptionText}>{t('languageEnglish')}</Text>
                {String(i18n.locale).startsWith('en') ? <Text> ✓</Text> : null}
              </TouchableOpacity>
              <TouchableOpacity style={styles.langOption} onPress={() => { setLangModalVisible(false); setLocale('ar'); }}>
                <Text style={styles.langOptionText}>{t('languageArabic')}</Text>
                {String(i18n.locale).startsWith('ar') ? <Text> ✓</Text> : null}
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalClose} onPress={() => setLangModalVisible(false)}>
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#8E8E93',
    marginBottom: 8,
  },
  profileStatus: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#34C759',
    backgroundColor: '#34C75920',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#8E8E93',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
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
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#8E8E93',
    textAlign: 'center',
  },
  langButton: {
    position: 'absolute',
    right: 16,
    top: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
  },
  langButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#007AFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  langOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  langOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  modalClose: {
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  modalCloseText: {
    color: '#007AFF',
    fontFamily: 'Inter-SemiBold',
  },
});