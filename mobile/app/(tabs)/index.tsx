import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';

import { ThemedView } from '@/components/themed-view';

const DEFAULT_URL = 'https://rotuprinterserp.onrender.com';

export default function HomeScreen() {
  const webUrl = useMemo(() => {
    const extra = Constants.expoConfig?.extra as { webUrl?: string } | undefined;
    return extra?.webUrl ?? DEFAULT_URL;
  }, []);

  return (
    <ThemedView style={styles.container}>
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
  webview: {
    flex: 1,
  },
});
