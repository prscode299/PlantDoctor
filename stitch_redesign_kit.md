# 🌿 Google Stitch Redesign Kit — گیاه‌یار (Plant Companion App)

این بسته کامل پرامپت‌ها و مشخصات فنی (PRD & Design System) اختصاصاً برای **Google Stitch** (`stitch.withgoogle.com`) مهندسی و تنظیم شده است تا بتوانید اپلیکیشن «گیاه‌یار» را به صورت حرفه‌ای، مدرن و با بالاترین استانداردهای بصری بازطراحی کنید.

---

## 🧭 نحوه استفاده در Google Stitch

1. وارد [stitch.withgoogle.com](https://stitch.withgoogle.com/) شوید و یک بوم جدید (New Canvas / Project) ایجاد کنید.
2. **روش اول (تک‌صفحه به تک‌صفحه با نهایت جزئیات):** هر یک از پرامپت‌های بخش «پرامپت‌های تفکیکی صفحات» را کپی کرده و در نوار ورودی Stitch وارد کنید تا صفحه را با تمام المان‌ها و جزئیات خلق کند.
3. **روش دوم (طراحی یکپارچه کل اپلیکیشن - Multi-screen Flow):** متن کامل «Master PRD & Design System Prompt» را به عنوان پرامپت اصلی به Stitch بدهید تا جریان پیوسته کل صفحات را روی بوم بی‌نهایت (Infinite Canvas) به صورت یکجا ماک‌آپ کند.
4. تمام پرامپت‌ها به **زبان انگلیسی تخصصی UI/UX** نگارش شده‌اند (چرا که مدل‌های مولد طراحی گوگل استیچ روی این پرامپت‌ها بهترین خروجی بصری و کد تمیز را تولید می‌کنند)، اما عناصر محتوایی و کاربری، چیدمان فارسی و تقویم شمسی دقیقاً در آنها گنجانده شده است.

---

## 🎨 ۱. پرامپت سیستم طراحی و هویت بصری کلی (Master Design System Prompt)
> این پرامپت را در ابتدا یا همراه با هر صفحه برای اعمال استایل و تم یکپارچه به Stitch بدهید:

```text
Design System & Aesthetic Guidelines for "GiahYar" (Plant Companion App):
- Vibe & Aesthetic: Modern Scandinavian Organic Luxury meets Botanical Sanctuary. Fresh, tranquil, air-purifying, deeply calming yet functional and high-tech.
- Form Factor: Mobile App (iOS / Android 390x844 frame), modern rounded ergonomics with 20px-24px card corner radius, soft pill chips, and floating action elements.
- Typography: Clean modern Persian RTL layout (IRANSansWeb style) with bold friendly headers, comfortable line height, and high-legibility numerals.
- Color Palette:
  * Primary Forest Emerald: #1E5E3A (Deep, lush foliage green)
  * Secondary Mint Accent: #52B788 (Vibrant fresh growth)
  * Surface Neutral: #F4F7F4 (Morning dew soft tinted background)
  * Pure Card Surface: #FFFFFF with subtle soft drop shadows (0 8px 24px rgba(30, 94, 58, 0.06))
  * Water Blue: #0284C7 (Hydration actions, droplets, moisture states)
  * Fertilizer Amber: #D97706 (Golden nutrient schedules, sunlight highlights)
  * Terracotta Coral: #C85A32 (Overdue alerts, urgent thirst badges, warning pills)
  * Text High-Contrast: #112218 (Headings), #3C4F44 (Body text), #6B7E73 (Subtitles)
- Micro-interactions & Badges: Pill-shaped status chips, circular progress vitality gauges, glassmorphic floating bottom navigation bar with haptic-ready states.
```

---

## 📱 ۲. پرامپت‌های تفکیکی صفحات (Screen-by-Screen Prompts)

---

### صفحه ۱: داشبورد اصلی و باغچه من (My Garden / Dashboard)

```text
Generate a high-fidelity mobile UI design for the main dashboard of a smart plant care app called "GiahYar" (باغچه من).

Layout & Components:
1. Top Bar:
   - Greeting text: "صبح بخیر مصطفی 🌿" with today's Persian Solar date "۲۴ آبان ۱۴۰۳".
   - Right side: Circular notification bell with active alert dot, and a quick "+" add icon.

2. Hero "Today's Tasks" Action Card (کارهای امروز):
   - Highlighted card with a gentle sage-green gradient (#EBF5EE to #FFFFFF) and rounded 22px borders.
   - Header with badge: "۲ گیاه نیازمند رسیدگی" (Terracotta urgency badge).
   - Horizontal mini-cards of thirsty plants:
     * Card 1: Pothos (پوتوس) - "نوبت آبیاری امروز" - Blue button: "آب دادم 💧".
     * Card 2: Monstera (برگ انجیری) - "نوبت کوددهی" - Amber button: "کود دادم 🌾".
   - Primary action button: "آبیاری دسته‌جمعی همه (۲) 💧" (Full-width rounded green button).
   - (Alternative state toggle: When empty, display serene illustration with message "باغچه شما آرام و سیراب است! 🌿").

3. Room / Category Filter Chips (اسکرول اتاق‌ها):
   - Smooth horizontal scrollable chips: "همه (۸)" [Active green pill], "پذیرایی (۳)", "اتاق خواب (۲)", "بالکن و تراس (۲)", "پاسیو (۱)".

4. Plant Grid / Collection Cards:
   - 2-column aesthetic staggered cards or rich vertical cards.
   - Each card features:
     * Full-width top organic botanical photography of the plant.
     * Room badge overlay in top corner ("پذیرایی").
     * Persian name ("زاموفیلیا") and italic scientific subtitle ("Zamioculcas zamiifolia").
     * Two status capsules: "💧 نوبت آب: ۳ روز دیگر" and "🌾 نوبت کود: ۱۵ روز دیگر".
     * Quick action button on card footer if due.

5. Navigation & FAB:
   - Prominent Floating Action Button (FAB) at bottom-left in vivid emerald green with a plant icon.
   - Floating frosted-glass Bottom Navigation Bar with 4 tabs:
     [Garden (Active 🌿) | Solar Calendar 🗓️ | AI Plant Doctor 🩺 | Settings ⚙️].
```

---

### صفحه ۲: تقویم شمسی هوشمند گیاهان (Jalali Solar Care Calendar)

```text
Generate a high-fidelity mobile UI design for a Persian Solar Calendar screen (تقویم شمسی گیاهان) in the plant care app "GiahYar".

Layout & Components:
1. Header:
   - Title: "تقویم هوشمند گیاهان 🗓️".
   - Subtitle: "برنامه زمان‌بندی آبدهی و کوددهی به تاریخ جلالی".

2. Month Navigation & Controls:
   - Month-Year selector card: "آبان ۱۴۰۳" with left/right smooth arrow icons and a "امروز" (Jump to Today) pill button.
   - Day of week headers arranged RTL: [ش | ی | د | س | چ | پ | ج] with Friday (ج) highlighted in soft terracotta.

3. Interactive Jalali Month Matrix / Grid:
   - Clean calendar days grid with spacious touch targets.
   - "Today" is highlighted with a distinct emerald green ring.
   - Days with scheduled care have twin color-coded dot badges below the number:
     * Blue dot: Scheduled watering (آبیاری).
     * Amber dot: Scheduled fertilizing (کوددهی).
   - Selected day (e.g. ۲۴ آبان) has an active solid soft-mint circular background.

4. Calendar Legend (راهنمای تقویم):
   - Horizontal pill tags explaining the symbols:
     [🟢 امروز]  [🔵 نوبت آبیاری]  [🟠 نوبت کوددهی].

5. Selected Day Agenda Card (برنامه روز انتخابی):
   - Card title: "برنامه پنج‌شنبه ۲۴ آبان (۳ کار)".
   - Task list with animated checkboxes:
     * Task 1: "آبیاری سانسوریا شمشیری" (اتاق خواب) -> Direct Action: "آب دادم 💧".
     * Task 2: "کوددهی فیکوس لیراتا" (پذیرایی) -> Direct Action: "کود دادم 🌾".
     * Task 3: "غبارپاشی برگ انجیری" (پاسیو).
   - Clean micro-copy and time badges.
```

---

### صفحه ۳: دکتر گیاه هوشمند (AI Plant Doctor & Disease Clinic)

```text
Generate a futuristic, high-tech yet organic mobile UI design for an AI Plant Doctor screen (دکتر گیاه هوشمند) powered by Google Gemini in the "GiahYar" app.

Layout & Components:
1. Header & Hero:
   - Title: "دکتر گیاه هوشمند 🩺✨".
   - Subtitle: "معاینه تصویری، تشخیص علل بیماری و تنظیم مجدد دوره‌ها".

2. Patient Plant Selector:
   - Horizontal carousel of user's plants with circular avatars to pick the sick plant (e.g. Selected: "اسپاتی فیلوم - سالن پذیرایی").
   - Current schedule banner: "دوره فعلی: آبیاری هر ۵ روز | کوددهی هر ۳۰ روز".

3. Symptom Photography & Upload Area:
   - Large dashed border upload box with camera & gallery buttons.
   - Preview of leaf showing yellow edges / brown spots with a sleek scanning overlay beam effect (AI analysis visual).
   - Delete/re-take image pill icon.

4. Symptoms Description Input:
   - Multi-line soft text field: "شرح علائم ظاهری (مثلاً زرد شدن نوک برگ‌ها، بی‌حال بودن ساقه، وجود لکه‌های قهوه‌ای...)".

5. Primary AI Action CTA:
   - Radiant gradient button (Emerald to Violet Sparkle): "شروع معاینه و تحلیل سلامت با هوش مصنوعی ✨".

6. Comprehensive AI Diagnosis Result Card (وقتی نتیجه آماده است):
   - Health Status Badge: "نیازمند رسیدگی فوری ⚠️" (Amber-orange badge).
   - Circular Vitality Gauge: "۶۵ از ۱۰۰" (Score with radial progress).
   - Clinical Summary: "تشخیص اولیه: سوختگی نوک برگ ناشی از املاح زیاد آب و خشکی هوای محیط".
   - Causes Checklist: "علل احتمالی: ۱. کلر آب لوله‌کشی ۲. کمبود رطوبت اطراف برگ".
   - Step-by-Step Treatment Protocol:
     * Step 1: "استفاده از آب جوشیده سرد شده بدون املاح".
     * Step 2: "انتقال به محیط با نور غیرمستقیم و غبارپاشی روزانه".
   - AI Smart Schedule Recommendation Box:
     * Highlighted banner: "پیشنهاد تغییر برنامه: دوره آبیاری به هر ۷ روز افزایش یابد".
     * One-tap Miracle CTA: "اعمال دوره‌های جدید روی گیاه 🪄" (Updates app database and reminders instantly).
```

---

### صفحه ۴: شناسنامه و پروفایل تفصیلی گیاه (Plant Bio Profile & History)

```text
Generate a high-fidelity mobile UI design for a Plant Bio Details screen (شناسنامه گیاه) in the "GiahYar" app.

Layout & Components:
1. Immersive Hero Header:
   - High-resolution top photo banner of a lush Monstera Deliciosa (برگ انجیری).
   - Smooth dark gradient overlay at the bottom with:
     * Persian Name: "برگ انجیری زردچوبه‌ای" (Large bold font).
     * Scientific Subtitle: "Monstera deliciosa Liebm.".
     * Badges: [📍 پذیرایی] [💧 وضعیت: فردا تشنه می‌شود].
   - Back button and 3-dots kebab menu (Edit / Delete Plant) on the top navigation bar.

2. Triple Quick Action Bar (نوار عملیات سه‌گانه):
   - 3 prominent rounded quick action buttons:
     1. "آب دادم 💧" (Blue accent - records watering instantly and calculates next due date).
     2. "کود دادم 🌾" (Amber accent - logs fertilizing).
     3. "۱ روز تاخیر ⏳" (Snooze button if soil is still moist).

3. Schedule & Intervals Card (زمان‌بندی دوره‌ای):
   - Grid with 2 columns:
     * Column 1: "چرخه آبیاری: هر ۶ روز یک‌بار" | آخرین بار: ۱۹ آبان | نوبت بعد: فردا ۲۵ آبان.
     * Column 2: "چرخه کوددهی: هر ۳۰ روز یک‌بار" | نوبت بعد: ۱۰ آذر.

4. Biological & Environment Care Specs (نیازهای زیستی):
   - 4 aesthetic information cards with nature icons:
     * Sunlight ☀️: "نور زیاد غیرمستقیم (پشت پنجره جنوبی)".
     * Soil 🪴: "خاک سبک با زهکشی بالا، ترکیب پرلیت و پیت‌ماس".
     * Toxicity ⚠️: "حاوی کریستال اگزالات (دور از دسترس کودکان و گربه‌ها)".
     * Golden Tips 💡: "تمیز کردن منظم گردوغبار برگ‌ها با دستمال نمدار برای تنفس بهتر".

5. Care History Timeline (تاریخچه مراقبت‌های گذشته):
   - Vertical timeline showing the last 5 logged events:
     * "💧 آبیاری انجام شد - ۱۹ آبان ۱۴۰۳ - ساعت ۰۹:۳۰"
     * "🌾 کود مایع داده شد - ۱ آبان ۱۴۰۳"
     * "✂️ هرس برگ‌های خشک - ۱۵ مهر ۱۴۰۳".
```

---

### صفحه ۵: مودال ثبت جادویی گیاه جدید (Magic AI Add Plant Modal)

```text
Generate a high-fidelity mobile bottom-sheet modal UI for adding a new plant (افزودن گیاه جدید) with Gemini AI assistance.

Layout & Components:
1. Modal Header:
   - Pull-down pill handle at top, "افزودن گیاه جدید 🌱" title, and a circular "✕" close button.

2. "Magic AI Setup" Hero Banner:
   - Glowing gradient card (Emerald to Soft Lavender) with sparkles icon:
     "تنظیم جادویی با هوش مصنوعی 🪄"
     "کافیست عکس گیاه را بگیرید یا نام آن را بنویسید؛ هوش مصنوعی کل دوره‌های آبیاری فصلی، نور و خاک را خودکار تنظیم می‌کند!"
     Button: "اسکن و پرکردن خودکار با AI ✨".

3. Quick Presets Chips (گیاهان پرطرفدار آپارتمانی):
   - Horizontal chips for instant 1-tap fill:
     [پوتوس]  [زاموفیلیا]  [سانسوریا]  [برگ انجیری]  [فیکوس لیراتا]  [اسپاتی فیلوم]  [آگلونما]  [شفلرا].

4. Form Fields:
   - Plant Photo Picker: Circular camera icon with "افزودن تصویر واقعی".
   - Name Field: "نام گیاه (مثلاً پوتوس ابلق)".
   - Scientific Name Field: "نام علمی (اختیاری - مثلاً Epipremnum aureum)".
   - Room Selector Grid: Segmented pills [پذیرایی | اتاق خواب | بالکن | پاسیو | محل کار].
   - Watering Interval Stepper: "فاصله آبیاری: [ - ]  ۷ روز  [ + ]".
   - Fertilizing Interval Stepper: "فاصله کوددهی: [ - ]  ۳۰ روز  [ + ]".
   - Care Notes: "نکات نگهداری و نور".

5. Bottom Action:
   - Full-width sticky button: "ذخیره در باغچه من 🌱" (Emerald green with tactile shadow).
```

---

### صفحه ۶: تنظیمات، هوش مصنوعی و آلارم دیجیتال (Settings, Gemini AI & Digital Alarm)

```text
Generate a clean, high-fidelity mobile Settings screen for "GiahYar" (تنظیمات و هوش مصنوعی).

Layout & Components:
1. Header:
   - Title: "تنظیمات ⚙️".
   - Subtitle: "هوش مصنوعی، یادآورها، تم و پشتیبان‌گیری".

2. Appearance Section:
   - Card with Light / Dark Mode switch toggle with sun & moon illustrations.

3. Google Gemini AI Integration Card:
   - Header with Google Gemini logo and "هوش مصنوعی گوگل جمینای".
   - Helper step guide: "دریافت رایگان کلید API از AI Studio (نیاز به فیلترشکن)".
   - Password-style input field: "کلید API شما: AIzaSy...••••" with eye toggle icon.
   - Action buttons: "ذخیره کلید" and "تست اتصال هوش مصنوعی" with instant green success badge ("اتصال برقرار است ✅").

4. Daily Reminder Digital Clock Picker (ساعت یادآور روزانه):
   - Title: "ساعت ارسال اعلان‌های روزانه".
   - Sleek Digital Clock display formatted in standard LTR:
     [ ۰۹ ] : [ ۰۰ ] (Morning / صبح)
     With "+" and "-" stepper buttons for Hour and Minute.
   - Quick time preset chips:
     [صبح ۰۸:۰۰]  [ظهر ۱۲:۰۰]  [عصر ۱۸:۰۰]  [شب ۲۱:۰۰].
   - Status badge: "هشدار روزانه: رأس ساعت ۰۹:۰۰ ارسال خواهد شد".
   - Action buttons: "ثبت ساعت یادآور" and "ارسال اعلان تستی فوری 🔔".

5. Privacy & Data Backup:
   - "داده‌های شما ۱۰۰٪ آفلاین و محلی ذخیره می‌شوند".
   - Action button: "تهیه فایل پشتیبان (JSON Export) 💾".

6. Footer:
   - Brand mark: "گیاه‌یار 🌿 نسخه ۱.۰.۰ — همراه هوشمند گیاهان شما".
```

---

## 🚀 ۳. پرامپت ارشد چندصفحه‌ای برای ایجاد کل اپ به صورت یکجا (Master Multi-Screen Canvas Prompt)

> اگر می‌خواهید در Google Stitch کل فلو و تمام صفحات را یک‌جا روی بوم بی‌نهایت (Canvas) رسم کنید، این پرامپت جامع را به Stitch ارسال نمایید:

```text
Act as a world-class UI/UX designer. Create a comprehensive, cohesive 6-screen mobile application prototype in Google Stitch for "GiahYar" (گیاه‌یار), a luxury botanical plant care and AI diagnosis mobile app with Iranian Jalali calendar support.

Design Language & Aesthetic:
- Clean Scandinavian botanical minimalism, organic luxury atmosphere.
- Colors: Deep Forest Green (#1E5E3A), Mint Accent (#52B788), Morning Dew Background (#F4F7F4), Pure White Cards (#FFFFFF), Water Blue (#0284C7), Fertilizer Amber (#D97706), Terracotta Urgency (#C85A32).
- Font & Alignment: RTL Persian layout with modern Persian typography and readable numerals.
- Card radius 22px, smooth micro-interactions, pill-shaped tags, high-quality plant imagery.

Generate the following 6 connected screens on the canvas:
1. Screen 1 - Dashboard ("باغچه من"): Greeting with Persian date, "Today's Tasks" hero card with "Water All" button, room filter chips, 2-column plant cards with thirst status countdowns, bottom navigation bar, and green floating action button (+).
2. Screen 2 - Jalali Solar Calendar ("تقویم شمسی گیاهان"): Jalali month switcher (آبان ۱۴۰۳), Saturday-to-Friday matrix grid with twin blue (water) and amber (fertilize) dot indicators, color legend, and selected day task agenda card with direct "Watered" buttons.
3. Screen 3 - AI Plant Doctor ("دکتر گیاه هوشمند"): Plant selector carousel, leaf disease camera upload dropzone with scanning animation, symptom text area, radiant "Consult AI Doctor" CTA, and detailed diagnosis result card featuring vitality score gauge (65/100), clinical causes, step-by-step cure protocol, and "Apply Suggested Schedule" button.
4. Screen 4 - Plant Bio Profile ("شناسنامه گیاه"): Hero foliage photo banner with dark gradient, 3 action buttons ("Watered 💧", "Fertilized 🌾", "Snooze 1 Day ⏳"), 2-column watering/fertilizing cycle specs, 4 biological needs cards (Light, Soil, Toxicity warning, Golden tips), and interactive care history timeline.
5. Screen 5 - Magic AI Add Plant ("افزودن گیاه جدید"): Bottom-sheet modal with "Magic AI Auto-Fill" glowing banner, 8 popular plant preset chips (Pothos, Monstera, Sansevieria, etc.), photo picker, room selector, +/- day steppers, and "Save to Garden" CTA.
6. Screen 6 - Settings & AI ("تنظیمات"): Dark mode switch, Google Gemini API Key input with connection tester, digital clock picker for daily morning care alarms with stepper buttons and quick chips (08:00, 12:00, 18:00, 21:00), offline backup button, and brand footer.

Ensure high visual consistency across all screens, matching design tokens, icon styles, and realistic Persian UI copywriting.
```

---

## 💡 نکات تکمیلی برای دریافت بهترین خروجی از Google Stitch

1. **انتخاب فریم موبایل:** در تنظیمات Stitch فریم را روی ابعاد استاندارد موبایل (`390x844` پیکسل) قرار دهید.
2. **استفاده از تصاویر واقعی:** در صورتی که Stitch گزینه‌ای برای تولید تصویر دارد، کلمات کلیدی نظیر `photorealistic indoor houseplant photography, soft studio lighting` را برای تصاویر گیاهان حفظ کنید.
3. **خروجی کد (Export):** پس از رضایت از طرح‌ها در Stitch، می‌توانید از قابلیت Export به Google AI Studio یا کدهای React Native / Tailwind استفاده کنید تا کامپوننت‌های جدید را مستقیماً جایگزین فایل‌های موجود در `e:\plant-app\src\app` نمایید.


---

## 🔍 ۴. پرامپت ارزیابی و پولیش عمیق تجربه کاربری (UX Audit & Usability Refinement Prompt)

> این پرامپت را پس از طراحی اولیه در Google Stitch وارد کنید تا طرح‌ها را مانند یک مدیر ارشد محصول و طراح ارشد UX اسکن کند و ایرادات ارگونومی، خوانایی، بار شناختی و دسترسی‌پذیری را برطرف نماید:

```text
Act as a Lead Mobile Product Designer and Accessibility (a11y) UX Specialist.
Critically review the entire current plant care mobile app design on the canvas for "GiahYar" and systematically refine, polish, and optimize it based on the following UX heuristics:

1. Thumb Zone & Ergonomic Accessibility:
   - Ensure all high-frequency primary CTAs ("Water All", "Watered 💧", "Fertilized 🌾", FAB) are comfortably placed in the natural thumb zone (lower 40% of the screen).
   - Verify minimum touch target sizes (at least 48x48dp) for small controls, especially: calendar date cells, +/- stepper buttons, room category chips, and snooze actions.
   - Prevent any UI crowding or overlap between the Floating Action Button (+) and the bottom navigation bar.

2. Glanceability & Cognitive Load Reduction:
   - Make the "Urgent / Overdue" status instantly distinguishable from "Upcoming" through high-contrast color coding and typography weight (Terracotta warning vs calm green/blue).
   - Ensure the user can understand their garden's thirst status within 3 seconds of opening the app.
   - Group information into clear visual chunks with generous whitespace (8pt grid system) so dense plant details don't feel overwhelming.

3. Micro-states & Emotional Design (Delight & Calm):
   - Perfect the "All Done / Zero Thirst" empty state: When no tasks are left, show a delightful, calming botanical illustration with a reassuring message ("باغچه شما آرام و سیراب است! 🌿") rather than a bare empty box.
   - Add clear visual cues for loading/scanning states during the Gemini AI diagnosis screen.
   - Include a non-destructive "Snooze / 1 Day Delay" option on plant cards for when the soil is still moist.

4. Persian RTL & Mixed-Direction Usability:
   - Ensure natural Right-to-Left visual flow for navigation, chevron back buttons, and list alignments.
   - Keep digital clock values (e.g., 09:00), scientific Latin plant names (e.g., Epipremnum aureum), and numeric counters in correct, legible LTR formatting.
   - Ensure WCAG AA color contrast compliance for text on light backgrounds and colored badges (contrast ratio >= 4.5:1).

5. Form Flow & Friction Elimination (Add Plant Modal):
   - Streamline the onboarding form so that selecting a preset plant chip or using the "Magic AI Auto-Fill" button automatically pre-populates all scientific fields, reducing manual typing friction to zero.

Refine the components on the canvas to incorporate these UX improvements while preserving the lush organic aesthetic.
```
