import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Plant } from '@/types/plant';
import { db } from '../storage/database';

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private isConfigured = false;

  async setupChannels(): Promise<void> {
    if (this.isConfigured) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('plant-care', {
        name: 'یادآور مراقبت از گیاهان',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2D6A4F',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
      });
    }

    this.isConfigured = true;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus === 'granted') {
        await this.setupChannels();
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Could not request notification permissions:', e);
      return false;
    }
  }

  /**
   * Schedules a notification for a specific date and time
   */
  async scheduleCareNotification(
    identifier: string,
    title: string,
    body: string,
    targetDateIso: string,
    hour = 9,
    minute = 0
  ): Promise<string | null> {
    try {
      const [year, month, day] = targetDateIso.split('-').map(Number);
      const targetDate = new Date(year, month - 1, day, hour, minute, 0);

      // Don't schedule for past times
      if (targetDate.getTime() <= Date.now()) {
        return null;
      }

      const id = await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title,
          body,
          sound: true,
          data: { targetDateIso },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: targetDate,
          channelId: Platform.OS === 'android' ? 'plant-care' : undefined,
        },
      });

      return id;
    } catch (error) {
      console.warn('Failed to schedule notification:', error);
      return null;
    }
  }

  /**
   * Reschedules all notifications for all plants
   */
  async syncAllPlantNotifications(plants: Plant[]): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

      // Cancel all existing scheduled notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      const notifTime = await db.getNotificationTime();

      for (const plant of plants) {
        // 1. Water notification
        if (plant.nextWateringDate) {
          await this.scheduleCareNotification(
            `water_${plant.id}`,
            `💧 نوبت آبیاری ${plant.name}`,
            `امروز موعد آبیاری گیاه زیبای شماست. قبل از آبدهی رطوبت خاک را چک کنید.`,
            plant.nextWateringDate,
            notifTime.hour,
            notifTime.minute
          );
        }

        // 2. Fertilizer notification
        if (plant.nextFertilizingDate) {
          await this.scheduleCareNotification(
            `fert_${plant.id}`,
            `🌿 نوبت کوددهی ${plant.name}`,
            `امروز موعد کوددهی (${plant.fertilizerType || 'کود تقویتی'}) است.`,
            plant.nextFertilizingDate,
            notifTime.hour,
            notifTime.minute
          );
        }
      }
    } catch (error) {
      console.error('Error syncing notifications:', error);
    }
  }

  /**
   * Test immediate notification (for Settings screen)
   */
  async sendTestNotification(): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('دسترسی به اعلان‌ها داده نشده است.');
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌱 تست هشدار گیاه‌یار',
        body: 'سیستم یادآوری و هشدار گوشی به درستی فعال است! از این پس سر ساعت مشخص نوبت گیاهانتان یادآوری می‌شود.',
        sound: true,
      },
      trigger: null, // triggers immediately
    });
  }
}

export const notificationService = new NotificationService();
