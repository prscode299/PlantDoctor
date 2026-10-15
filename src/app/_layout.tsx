import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { db } from '@/services/storage/database';
import { notificationService } from '@/services/notifications/notificationService';
import Colors from '@/constants/colors';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'IRANSansWeb': require('../../assets/fonts/IRANSansWeb.ttf'),
    'IRANSansWeb-Bold': require('../../assets/fonts/IRANSansWeb_Bold.ttf'),
    'IRANSansWeb-Medium': require('../../assets/fonts/IRANSansWeb_Medium.ttf'),
    'IRANSansWeb-Light': require('../../assets/fonts/IRANSansWeb_Light.ttf'),
  });

  useEffect(() => {
    async function initApp() {
      try {
        await db.initializeIfNeeded();
        const plants = await db.getPlants();
        await notificationService.syncAllPlantNotifications(plants);
      } catch (e) {
        console.error('App init error:', e);
      }
    }
    initApp();

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'plant-app-web-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          @font-face {
            font-family: 'IRANSansWeb';
            src: local('IRANSansWeb'), url('/assets/fonts/IRANSansWeb.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
          }
          @font-face {
            font-family: 'IRANSansWeb';
            src: local('IRANSansWeb-Bold'), url('/assets/fonts/IRANSansWeb_Bold.ttf') format('truetype');
            font-weight: bold;
            font-style: normal;
          }
          @font-face {
            font-family: 'IRANSansWeb';
            src: local('IRANSansWeb-Medium'), url('/assets/fonts/IRANSansWeb_Medium.ttf') format('truetype');
            font-weight: 500;
            font-style: normal;
          }
          * {
            font-family: 'IRANSansWeb', system-ui, -apple-system, sans-serif !important;
            direction: rtl;
            box-sizing: border-box;
          }
          html, body {
            background-color: #DFE8E1 !important;
            margin: 0;
            padding: 0;
            height: 100%;
            overflow-x: hidden;
            display: flex;
            justify-content: center;
          }
          #root {
            width: 100%;
            max-width: 480px;
            min-height: 100vh;
            background-color: #F4F7F4;
            box-shadow: 0 0 50px rgba(27, 67, 50, 0.15);
            position: relative;
            margin: 0 auto;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={styles.webContainer}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="plant/[id]"
            options={{
              headerShown: false,
              animation: 'slide_from_left',
            }}
          />
          <Stack.Screen
            name="plant/add"
            options={{
              presentation: 'modal',
              headerShown: false,
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  webContainer: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    alignSelf: 'center',
    backgroundColor: Colors.background,
  },
});
