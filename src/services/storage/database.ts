import AsyncStorage from '@react-native-async-storage/async-storage';
import { CareLog, Plant } from '@/types/plant';
import { AiSettings } from '@/types/ai';
import { addDays, getTodayIso } from '@/utils/jalali';
import { DEFAULT_ROOMS } from '@/constants/presets';

const STORAGE_KEYS = {
  PLANTS: '@plant_app_plants_v1',
  CARE_LOGS: '@plant_app_logs_v1',
  ROOMS: '@plant_app_rooms_v1',
  AI_SETTINGS: '@plant_app_ai_settings_v1',
  NOTIFICATION_TIME: '@plant_app_notif_time_v1',
  INITIALIZED: '@plant_app_initialized_v1',
};

const INITIAL_SAMPLE_PLANTS: Plant[] = [
  {
    id: 'sample_plant_1',
    name: 'پوتوس طلایی من',
    scientificName: 'Epipremnum aureum',
    room: 'پذیرایی',
    wateringIntervalDays: 5,
    lastWateredDate: addDays(getTodayIso(), -5), // Due today!
    nextWateringDate: getTodayIso(),
    fertilizingIntervalDays: 30,
    lastFertilizedDate: addDays(getTodayIso(), -12),
    nextFertilizingDate: addDays(getTodayIso(), 18),
    fertilizerType: 'کود ۲۰-۲۰-۲۰ مایع',
    lightRequirement: 'نور متوسط و فیلتر شده پشت پرده',
    humidityRequirement: 'رطوبت حدود ۵۰٪، غبارپاشی هفتگی',
    soilType: 'ترکیب پیت‌ماس و پرلیت با زهکشی سبک',
    careTips: 'هر زمان سطح خاک تا ۲ سانت خشک شد آبیاری کنید.',
    toxicity: 'برای سگ و گربه در صورت جویدن سمی است.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample_plant_2',
    name: 'زاموفیلیا بلک',
    scientificName: 'Zamioculcas zamiifolia',
    room: 'اتاق خواب',
    wateringIntervalDays: 14,
    lastWateredDate: addDays(getTodayIso(), -6),
    nextWateringDate: addDays(getTodayIso(), 8),
    fertilizingIntervalDays: 45,
    lastFertilizedDate: addDays(getTodayIso(), -45), // Due today for fertilizer!
    nextFertilizingDate: getTodayIso(),
    fertilizerType: 'کود فسفر بالا مخصوص ریشه و غده',
    lightRequirement: 'مقاوم به سایه و نور غیرمستقیم ملایم',
    humidityRequirement: 'رطوبت کم، با هوای اتاق سازگار است',
    soilType: 'خاک سبک کاکتوس با درصد پرلیت بالا',
    careTips: 'آبیاری بیش از حد دشمن شماره یک زاموفیلیا است. حتماً بگذارید خاک کاملاً خشک شود.',
    toxicity: 'سمی در صورت مصرف خوراکی.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample_plant_3',
    name: 'برگ انجیری پهن‌برگ',
    scientificName: 'Monstera deliciosa',
    room: 'پذیرایی',
    wateringIntervalDays: 7,
    lastWateredDate: addDays(getTodayIso(), -6),
    nextWateringDate: addDays(getTodayIso(), 1), // Tomorrow!
    fertilizingIntervalDays: 30,
    lastFertilizedDate: addDays(getTodayIso(), -10),
    nextFertilizingDate: addDays(getTodayIso(), 20),
    fertilizerType: 'کود کامل همراه با هیومیک اسید',
    lightRequirement: 'نور روشن غیرمستقیم نزدیک پنجره جنوبی',
    humidityRequirement: 'رطوبت‌دوست، ریشه‌های هوایی را مرطوب نگه دارید',
    soilType: 'خاک غنی، اسفناجی، پرلیت و پیت‌ماس',
    careTips: 'برگ‌ها را با اسفنج مرطوب ماهانه تمیز کنید تا غبار مانع فتوسنتز نشود.',
    toxicity: 'برای حیوانات خانگی ایجاد حساسیت دهانی می‌کند.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class DatabaseService {
  /**
   * Initializes default seed data on first launch
   */
  async initializeIfNeeded(): Promise<void> {
    try {
      const initialized = await AsyncStorage.getItem(STORAGE_KEYS.INITIALIZED);
      if (!initialized) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.PLANTS,
          JSON.stringify(INITIAL_SAMPLE_PLANTS)
        );
        await AsyncStorage.setItem(
          STORAGE_KEYS.ROOMS,
          JSON.stringify(DEFAULT_ROOMS)
        );
        await AsyncStorage.setItem(
          STORAGE_KEYS.NOTIFICATION_TIME,
          JSON.stringify({ hour: 9, minute: 0 })
        );
        await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  /**
   * Fetch all plants
   */
  async getPlants(): Promise<Plant[]> {
    try {
      await this.initializeIfNeeded();
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.PLANTS);
      if (!raw) return [];
      const plants: Plant[] = JSON.parse(raw);
      // Sort: plants needing care first
      return plants.sort((a, b) => {
        return a.nextWateringDate.localeCompare(b.nextWateringDate);
      });
    } catch (error) {
      console.error('Error fetching plants:', error);
      return [];
    }
  }

  /**
   * Fetch single plant by id
   */
  async getPlantById(id: string): Promise<Plant | null> {
    const plants = await this.getPlants();
    return plants.find((p) => p.id === id) || null;
  }

  /**
   * Save (create or overwrite) plant
   */
  async savePlant(plant: Plant): Promise<void> {
    try {
      const plants = await this.getPlants();
      const index = plants.findIndex((p) => p.id === plant.id);
      if (index >= 0) {
        plants[index] = { ...plant, updatedAt: new Date().toISOString() };
      } else {
        plants.push({ ...plant, updatedAt: new Date().toISOString() });
      }
      await AsyncStorage.setItem(STORAGE_KEYS.PLANTS, JSON.stringify(plants));
    } catch (error) {
      console.error('Error saving plant:', error);
      throw error;
    }
  }

  /**
   * Delete plant
   */
  async deletePlant(id: string): Promise<void> {
    try {
      const plants = await this.getPlants();
      const filtered = plants.filter((p) => p.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.PLANTS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting plant:', error);
      throw error;
    }
  }

  /**
   * Mark plant as watered today
   */
  async waterPlant(id: string, note?: string): Promise<Plant | null> {
    const plant = await this.getPlantById(id);
    if (!plant) return null;

    const today = getTodayIso();
    const updated: Plant = {
      ...plant,
      lastWateredDate: today,
      nextWateringDate: addDays(today, plant.wateringIntervalDays),
      updatedAt: new Date().toISOString(),
    };

    await this.savePlant(updated);

    // Add log
    await this.addCareLog({
      id: `log_${Date.now()}_water`,
      plantId: id,
      type: 'watering',
      date: new Date().toISOString(),
      note: note || 'آبیاری دوره‌ای انجام شد.',
    });

    return updated;
  }

  /**
   * Mark plant as fertilized today
   */
  async fertilizePlant(id: string, note?: string): Promise<Plant | null> {
    const plant = await this.getPlantById(id);
    if (!plant) return null;

    const today = getTodayIso();
    const updated: Plant = {
      ...plant,
      lastFertilizedDate: today,
      nextFertilizingDate: addDays(today, plant.fertilizingIntervalDays),
      updatedAt: new Date().toISOString(),
    };

    await this.savePlant(updated);

    // Add log
    await this.addCareLog({
      id: `log_${Date.now()}_fert`,
      plantId: id,
      type: 'fertilizing',
      date: new Date().toISOString(),
      note: note || `کوددهی (${plant.fertilizerType || 'کود تقویتی'}) انجام شد.`,
    });

    return updated;
  }

  /**
   * Snooze watering by X days (e.g. soil still moist)
   */
  async snoozeWatering(id: string, days = 1): Promise<Plant | null> {
    const plant = await this.getPlantById(id);
    if (!plant) return null;

    const updated: Plant = {
      ...plant,
      nextWateringDate: addDays(plant.nextWateringDate, days),
      updatedAt: new Date().toISOString(),
    };

    await this.savePlant(updated);
    return updated;
  }

  /**
   * Add a care log entry
   */
  async addCareLog(log: CareLog): Promise<void> {
    try {
      const logs = await this.getCareLogs();
      logs.unshift(log);
      // Keep last 300 logs
      const trimmed = logs.slice(0, 300);
      await AsyncStorage.setItem(STORAGE_KEYS.CARE_LOGS, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error adding care log:', error);
    }
  }

  /**
   * Fetch care logs for a plant or all
   */
  async getCareLogs(plantId?: string): Promise<CareLog[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.CARE_LOGS);
      if (!raw) return [];
      const logs: CareLog[] = JSON.parse(raw);
      if (plantId) {
        return logs.filter((l) => l.plantId === plantId);
      }
      return logs;
    } catch (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
  }

  /**
   * Get all defined rooms
   */
  async getRooms(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.ROOMS);
      if (!raw) return DEFAULT_ROOMS;
      return JSON.parse(raw);
    } catch {
      return DEFAULT_ROOMS;
    }
  }

  /**
   * Add custom room
   */
  async addRoom(name: string): Promise<void> {
    const rooms = await this.getRooms();
    if (!rooms.includes(name.trim())) {
      rooms.push(name.trim());
      await AsyncStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
    }
  }

  /**
   * AI Settings (API Key)
   */
  async getAiSettings(): Promise<AiSettings> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.AI_SETTINGS);
      if (!raw) {
        return {
          apiKey: '',
          provider: 'gemini',
          selectedModel: 'gemini-1.5-flash',
        };
      }
      return JSON.parse(raw);
    } catch {
      return {
        apiKey: '',
        provider: 'gemini',
        selectedModel: 'gemini-1.5-flash',
      };
    }
  }

  async saveAiSettings(settings: AiSettings): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.AI_SETTINGS, JSON.stringify(settings));
  }

  /**
   * Notification Time (Hour & Minute)
   */
  async getNotificationTime(): Promise<{ hour: number; minute: number }> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_TIME);
      if (!raw) return { hour: 9, minute: 0 };
      return JSON.parse(raw);
    } catch {
      return { hour: 9, minute: 0 };
    }
  }

  async saveNotificationTime(time: { hour: number; minute: number }): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_TIME, JSON.stringify(time));
  }

  /**
   * Export all data as JSON
   */
  async exportBackup(): Promise<string> {
    const plants = await this.getPlants();
    const logs = await this.getCareLogs();
    const rooms = await this.getRooms();
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      plants,
      logs,
      rooms,
    }, null, 2);
  }

  /**
   * Import data from JSON
   */
  async importBackup(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.plants)) {
        await AsyncStorage.setItem(STORAGE_KEYS.PLANTS, JSON.stringify(data.plants));
      }
      if (Array.isArray(data.logs)) {
        await AsyncStorage.setItem(STORAGE_KEYS.CARE_LOGS, JSON.stringify(data.logs));
      }
      if (Array.isArray(data.rooms)) {
        await AsyncStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(data.rooms));
      }
      return true;
    } catch (e) {
      console.error('Failed to import backup:', e);
      return false;
    }
  }
}

export const db = new DatabaseService();
