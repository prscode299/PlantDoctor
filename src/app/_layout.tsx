import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@/services/storage/database';
import { notificationService } from '@/services/notifications/notificationService';
import Colors from '@/constants/colors';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

function AppContent() {
  const { isDark, colors } = useTheme();

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
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'plant-app-web-styles';
      let style = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        document.head.appendChild(style);
      }

      const bodyBg = isDark
        ? 'linear-gradient(135deg, #0A120E 0%, #060A08 100%)'
        : 'linear-gradient(135deg, #CBD9CE 0%, #B8CBBF 100%)';
      const rootBg = isDark ? '#0F1713' : '#F4F7F4';
      const rootBorder = isDark ? '#273B30' : '#1B4332';
      const rootShadow = isDark ? '0 20px 60px rgba(0, 0, 0, 0.65)' : '0 20px 60px rgba(18, 48, 38, 0.3)';

      style.textContent = `
        @font-face {
          font-family: 'IRANSansWeb';
          src: local('IRANSansWeb'),
               url('/assets/assets/fonts/IRANSansWeb.ttf') format('truetype'),
               url('/assets/fonts/IRANSansWeb.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        @font-face {
          font-family: 'IRANSansWeb';
          src: local('IRANSansWeb-Bold'),
               url('/assets/assets/fonts/IRANSansWeb_Bold.ttf') format('truetype'),
               url('/assets/fonts/IRANSansWeb_Bold.ttf') format('truetype');
          font-weight: bold;
          font-style: normal;
        }
        @font-face {
          font-family: 'IRANSansWeb';
          src: local('IRANSansWeb-Medium'),
               url('/assets/assets/fonts/IRANSansWeb_Medium.ttf') format('truetype'),
               url('/assets/fonts/IRANSansWeb_Medium.ttf') format('truetype');
          font-weight: 500;
          font-style: normal;
        }
        @font-face {
          font-family: 'IRANSansWeb-Bold';
          src: local('IRANSansWeb-Bold'),
               url('/assets/assets/fonts/IRANSansWeb_Bold.ttf') format('truetype'),
               url('/assets/fonts/IRANSansWeb_Bold.ttf') format('truetype');
        }
        @font-face {
          font-family: 'IRANSansWeb-Medium';
          src: local('IRANSansWeb-Medium'),
               url('/assets/assets/fonts/IRANSansWeb_Medium.ttf') format('truetype'),
               url('/assets/fonts/IRANSansWeb_Medium.ttf') format('truetype');
        }
        * {
          box-sizing: border-box;
        }
        html {
          height: 100%;
          width: 100%;
        }
        body {
          font-family: 'IRANSansWeb', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: ${bodyBg} !important;
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          transition: background 0.3s ease;
        }
        input, textarea {
          direction: rtl;
          text-align: right;
          font-family: 'IRANSansWeb', system-ui, sans-serif;
        }
        #root {
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
          max-width: 440px !important;
          height: 100% !important;
          max-height: 94vh !important;
          background-color: ${rootBg} !important;
          border-radius: 32px !important;
          border: 6px solid ${rootBorder} !important;
          box-shadow: ${rootShadow} !important;
          position: relative !important;
          overflow: hidden !important;
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }
        @media (max-width: 500px) {
          body {
            background: ${rootBg} !important;
          }
          #root {
            max-width: 100% !important;
            max-height: 100% !important;
            border-radius: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
        /* Ensure tab bar labels are never clipped */
        [role="tab"] span, [role="tab"] div {
          overflow: visible !important;
        }
        /* Custom scrollbar for web preview */
        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(45, 106, 79, 0.25);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(45, 106, 79, 0.45);
        }
      `;
    }
  }, [isDark]);

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.webContainer, { backgroundColor: colors.background }]}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
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

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'IRANSansWeb': require('../../assets/fonts/IRANSansWeb.ttf'),
    'IRANSansWeb-Bold': require('../../assets/fonts/IRANSansWeb_Bold.ttf'),
    'IRANSansWeb-Medium': require('../../assets/fonts/IRANSansWeb_Medium.ttf'),
    'IRANSansWeb-Light': require('../../assets/fonts/IRANSansWeb_Light.ttf'),
    ...Ionicons.font,
  });

  if (!fontsLoaded && !fontError && Platform.OS !== 'web') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
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
  },
});
