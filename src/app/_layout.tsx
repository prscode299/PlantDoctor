import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nManager, Platform } from 'react-native';
import { db } from '@/services/storage/database';
import { notificationService } from '@/services/notifications/notificationService';
import Colors from '@/constants/colors';

export default function RootLayout() {
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

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
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
    </SafeAreaProvider>
  );
}
