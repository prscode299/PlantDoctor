import { AiAutoFillResponse, AiDiagnosisResponse } from '@/types/ai';
import { Plant } from '@/types/plant';
import { getCurrentJalali, JALALI_MONTH_NAMES } from '@/utils/jalali';
import { db } from '../storage/database';

class GeminiAiService {
  /**
   * Auto-fill plant care profile based on name or photo
   */
  async autoFillPlantCare(params: {
    plantName?: string;
    imageBase64?: string;
  }): Promise<AiAutoFillResponse> {
    const settings = await db.getAiSettings();
    if (!settings.apiKey) {
      throw new Error(
        'لطفاً ابتدا در بخش تنظیمات، کلید API (مثلاً Google Gemini API Key) خود را وارد کنید.'
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

    if (params.imageBase64) {
      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: params.imageBase64,
        },
      });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${settings.apiKey.trim()}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`خطا در ارتباط با هوش مصنوعی (${response.status}): ${err}`);
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
    if (!settings.apiKey) {
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

    if (imageBase64) {
      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: imageBase64,
        },
      });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${settings.apiKey.trim()}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.3,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`خطا در ارتباط با هوش مصنوعی (${response.status}): ${err}`);
    }

    const data = await response.json();
    const candidateText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    const cleanJson = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson) as AiDiagnosisResponse;
  }
}

export const aiService = new GeminiAiService();
