import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { t } from '@/i18n';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
  <Text style={styles.text}>{t('thisScreenDoesntExist')}</Text>
        <Link href="/" style={styles.link}>
          <Text>{t('goToHome')}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    fontSize: 20,
    fontWeight: 600,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
