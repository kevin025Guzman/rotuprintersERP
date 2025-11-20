import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const DEFAULT_URL = 'https://rotuprinterserp.onrender.com';

export default function HomeScreen() {
  const webUrl = useMemo(() => {
    const extra = Constants.expoConfig?.extra as { webUrl?: string } | undefined;
    return extra?.webUrl ?? DEFAULT_URL;
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="default" style={styles.loadingText}>
        Cargando plataforma web…
      </ThemedText>
      <WebView
        source={{ uri: webUrl }}
        originWhitelist={['*']}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        style={styles.webview}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  loadingText: {
    textAlign: 'center',
    marginBottom: 4,
  },
  webview: {
    flex: 1,
  },
});
