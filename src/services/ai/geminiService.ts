import { AiAutoFillResponse, AiDiagnosisResponse } from '@/types/ai';
import { Plant } from '@/types/plant';
import { getCurrentJalali, JALALI_MONTH_NAMES } from '@/utils/jalali';
import { db } from '../storage/database';

function sanitizeApiKey(raw?: string): string {
  if (!raw) return '';
  return raw.trim().replace(/^["']|["']$/g, '');
}

function sanitizeBase64(raw?: string): { clean: string; mimeType: string } | null {
  if (!raw) return null;
  let mimeType = 'image/jpeg';
  let clean = raw.trim();
  const match = clean.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/s);
  if (match) {
    mimeType = match[1];
    clean = match[2];
  }
  // Strip out spaces and newlines if any
  clean = clean.replace(/\s+/g, '');
  if (!clean) return null;
  return { clean, mimeType };
}

function parseGeminiError(status: number, errText: string): Error {
  try {
    const json = JSON.parse(errText);
    const message = json.error?.message || errText;
    const reason = json.error?.details?.[0]?.reason || '';

    if (reason === 'API_KEY_INVALID' || message.includes('API key not valid') || message.includes('API_KEY_INVALID')) {
      return new Error('کلید هوش مصنوعی نامعتبر است. لطفاً کلید معتبر را از Google AI Studio دریافت و بدون فاصله اضافی کپی کنید.');
    }
    if (message.includes('User location is not supported') || message.includes('location')) {
      return new Error('گوگل دسترسی از آی‌پی ایران را به هوش مصنوعی محدود کرده است. لطفاً فیلترشکن (VPN) خود را روشن کرده و مجدداً تلاش کنید.');
    }
    if (status === 404 || message.includes('models/')) {
      return new Error('مدل انتخابی در دسترس نیست. لطفاً اتصال اینترنت خود را بررسی کنید.');
    }
    if (status === 429 || message.includes('RESOURCE_EXHAUSTED')) {
      return new Error('سقف درخواست‌های مجاز موقتاً پر شده است. لطفاً چند لحظه بعد مجدداً امتحان کنید.');
    }
    if (status === 503 || message.includes('high demand') || message.includes('UNAVAILABLE')) {
      return new Error('سرورهای گوگل به علت ترافیک بالا موقتاً شلوغ هستند. لطفاً چند لحظه دیگر امتحان کنید.');
    }
    return new Error(`خطای هوش مصنوعی (${status}): ${message}`);
  } catch {
    return new Error(`خطا در ارتباط با هوش مصنوعی (${status}): ${errText}`);
  }
}

class GeminiAiService {
  /**
   * Quick connection test to verify API key validity and network reach
   */
  async testConnection(apiKey?: string): Promise<{ success: boolean; message: string }> {
    const key = sanitizeApiKey(apiKey || (await db.getAiSettings()).apiKey);
    if (!key) {
      throw new Error('کلید API وارد نشده است. لطفاً ابتدا کلید را وارد کنید.');
    }
    if (key.startsWith('sk-')) {
      throw new Error('این کلید مربوط به OpenAI است. لطفاً کلید معتبر Google Gemini را وارد کنید.');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(key)}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'پاسخ خیلی کوتاه بده: سلام گیاه‌یار' }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 25,
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw parseGeminiError(response.status, err);
    }

    return { success: true, message: 'اتصال به هوش مصنوعی با موفقیت برقرار شد! ✨ آماده شناسایی گیاهان است.' };
  }

  /**
   * Auto-fill plant care profile based on name or photo
   */
  async autoFillPlantCare(params: {
    plantName?: string;
    imageBase64?: string;
  }): Promise<AiAutoFillResponse> {
    const settings = await db.getAiSettings();
    const apiKey = sanitizeApiKey(settings.apiKey);
    if (!apiKey) {
      throw new Error(
        'لطفاً ابتدا در بخش تنظیمات، کلید API (گوگل جِمینای) خود را وارد کنید.'
      );
    }

    const { jm } = getCurrentJalali();
    const currentMonthName = JALALI_MONTH_NAMES[jm - 1];

    const systemPrompt = `شما یک گیاه‌شناس و کارشناس باغبانی بسیار باتجربه هستید.
وظیفه شما: شناسایی گیاه و استخراج مشخصات دقیق نگهداری متناسب با شرایط اقلیمی ایران و ماه جاری (${currentMonthName}) است.
پاسخ شما باید صرفاً یک آبجکت JSON معتبر (بدون هیچ توضیح متنی اضافه یا markdown code fence) مطابق فرمت زیر باشد:
{
  "commonName": "نام فارسی گیاه",
  "scientificName": "نام علمی لاتین گیاه",
  "wateringIntervalDays": عدد صحیح (فاصله روزانه آبیاری برای ماه فعلی),
  "wateringIntervalDaysSummer": عدد صحیح (دوره آبیاری تابستان),
  "wateringIntervalDaysWinter": عدد صحیح (دوره آبیاری زمستان),
  "fertilizingIntervalDays": عدد صحیح (فاصله کوددهی به روز),
  "fertilizerType": "نوع کود مناسب به فارسی",
  "lightRequirement": "توضیح نیاز نوری به فارسی",
  "humidityRequirement": "توضیح رطوبت مورد نیاز به فارسی",
  "soilType": "ترکیب خاک مناسب به فارسی",
  "toxicity": "میزان سمیت برای انسان و حیوانات خانگی به فارسی",
  "careTips": "۱ یا ۲ نکته بسیار طلایی و حیاتی در نگهداری این گیاه"
}`;

    const parts: any[] = [];
    parts.push({
      text: `${systemPrompt}\n\nاطلاعات ورودی کاربر:\nنام احتمالی: ${
        params.plantName || 'مشخص نشده (از روی عکس شناسایی کن)'
      }`,
    });

    const imgObj = sanitizeBase64(params.imageBase64);
    if (imgObj) {
      parts.push({
        inlineData: {
          mimeType: imgObj.mimeType,
          data: imgObj.clean,
        },
      });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw parseGeminiError(response.status, err);
    }

    const data = await response.json();
    const candidateText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    const cleanJson = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson) as AiAutoFillResponse;
  }

  /**
   * Diagnose plant health from photo, notes, and care history
   */
  async diagnosePlantHealth(
    plant: Plant,
    userNotes: string,
    imageBase64?: string
  ): Promise<AiDiagnosisResponse> {
    const settings = await db.getAiSettings();
    const apiKey = sanitizeApiKey(settings.apiKey);
    if (!apiKey) {
      throw new Error(
        'لطفاً ابتدا در بخش تنظیمات، کلید API خود را وارد کنید.'
      );
    }

    const { jm } = getCurrentJalali();
    const currentMonthName = JALALI_MONTH_NAMES[jm - 1];

    const promptText = `شما یک پزشک و کلینیک‌دار تخصصی گیاهان آپارتمانی هستید.
گیاه زیر برای ویزیت و تشخیص سلامت به شما ارجاع داده شده است:
- نام: ${plant.name} (${plant.scientificName})
- ماه کنونی: ${currentMonthName}
- دوره آبیاری: هر ${plant.wateringIntervalDays} روز
- آخرین آبیاری: ${plant.lastWateredDate}
- آخرین کوددهی: ${plant.lastFertilizedDate} (دوره هر ${plant.fertilizingIntervalDays} روز با کود ${plant.fertilizerType || 'عمومی'})
- محل قرارگیری: ${plant.room || 'اتاق'}
- نیاز نوری ثبت شده: ${plant.lightRequirement || 'معمولی'}
- یادداشت کاربر از علائم ظاهری: ${userNotes || 'بررسی کلی'}

وظیفه شما: بررسی تصویر و گزارش علائم، تشخیص هرگونه بیماری، آفت، کمبود یا تنش نوری/آبی و ارائه برنامه درمانی دقیق.
پاسخ شما باید صرفاً یک آبجکت JSON معتبر (بدون markdown code fence) به شکل زیر باشد:
{
  "healthScore": عدد صحیح بین ۰ تا ۱۰۰,
  "status": "یکی از موارد: عالی / خوب / نیازمند رسیدگی / بحرانی",
  "diagnosisSummary": "خلاصه تشخیص سلامت گیاه در یک یا دو جمله",
  "possibleIssues": ["علت یا مشکل اول", "علت یا مشکل دوم"],
  "treatmentSteps": ["اقدام درمانی اول", "اقدام درمانی دوم", "اقدام درمانی سوم"],
  "suggestedScheduleChanges": {
    "wateringIntervalDays": عدد صحیح یا null در صورت عدم نیاز به تغییر,
    "fertilizingIntervalDays": عدد صحیح یا null,
    "reason": "دلیل پیشنهاد تغییر دوره متناسب با فصل یا بیماری"
  },
  "fertilizerRecommendation": "توصیه کود مناسب این شرایط",
  "environmentalHints": "نکته درباره نور، رطوبت یا دما"
}`;

    const parts: any[] = [{ text: promptText }];

    const imgObj = sanitizeBase64(imageBase64);
    if (imgObj) {
      parts.push({
        inlineData: {
          mimeType: imgObj.mimeType,
          data: imgObj.clean,
        },
      });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw parseGeminiError(response.status, err);
    }

    const data = await response.json();
    const candidateText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    const cleanJson = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson) as AiDiagnosisResponse;
  }
}

export const aiService = new GeminiAiService();
