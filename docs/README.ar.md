<div dir="rtl">

<div align="center">

[← English (الإنجليزية)](../README.md)

<img width="1400" alt="PawPrintFind Banner" src="../assets/banner.png" />

# PawPrintFind

**منصة إيجاد الحيوانات الأليفة المفقودة وإنقاذها بالذكاء الاصطناعي والمجتمع**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-pawprint--50.web.app-teal?style=for-the-badge&logo=firebase)](https://pawprint-50.web.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

*نجمع بين الحيوانات الأليفة الضائعة وعائلاتها بفضل قوة الذكاء الاصطناعي والمجتمع.*

</div>

---

## ما هو PawPrintFind؟

PawPrintFind منصة مجتمعية تعمل في الوقت الفعلي، تستخدم الذكاء الاصطناعي للمساعدة في تحديد مواقع الحيوانات الأليفة الضائعة وإعادتها إلى عائلاتها. يمكن للمستخدمين الإبلاغ عن الحيوانات المفقودة، وتسجيل مشاهدات مرفقة بإحداثيات GPS، والحصول على مطابقات آلية بالذكاء الاصطناعي، وتنسيق جهود الإنقاذ — كل ذلك في مكان واحد.

**متاح على:** [https://pawprint-50.web.app](https://pawprint-50.web.app)

**الموقع الرسمي:** [https://pawprintfind.com](https://pawprintfind.com)

---

## المميزات

### لأصحاب الحيوانات الأليفة
- **الإبلاغ عن الحيوانات الضائعة** مع الصور والوصف وآخر موقع معروف
- **مطابقة ذكية بالذكاء الاصطناعي** — ربط تلقائي بين المشاهدات وتقارير الحيوانات المفقودة
- **تنبيهات مشاهدة فورية** عبر إشعارات فورية عند رؤية حيوانك من قِبَل أحدهم
- **خريطة تفاعلية** مع مجموعات مشاهدة وخرائط حرارية
- **دعم متعدد اللغات** — 8 لغات (EN، IT، ES، FR، DE، ZH، AR، RO)

### للمجتمع
- **مركز مهام الدراجين** — يكسب متطوعو التوصيل نقاط كارما مقابل المساعدة في إنقاذ الحيوانات
- **وضع الدوريات** — دوريات تتبعها GPS لمتطوعي الإنقاذ
- **لوحة المتصدرين** — تصنيف كارما المجتمع مع الشارات والمستويات
- **25 شارة إنجاز** تُضفي طابعًا ترفيهيًا على جهود الإنقاذ المجتمعي

### للأطباء البيطريين
- **لوحة تحكم الطبيب البيطري الموثق** — واجهة مخصصة للعيادات الموثقة
- **اشتراك VetPro** — أدوات احترافية عبر Stripe
- **تسجيل العيادات** مع سير عمل التحقق الإداري

### للملاجئ وجمعيات الإنقاذ
- **مركز التبني** — عرض الحيوانات المتاحة للتبني
- **لوحة تحكم إدارة الملجأ** مع تتبع استقبال الحيوانات وحالتها

### المنصة
- **PWA (تطبيق ويب تقدمي)** — قابل للتثبيت، يعمل بدون إنترنت
- **مزامنة Firestore في الوقت الفعلي** — تحديثات مباشرة على جميع الأجهزة المتصلة
- **لوحة تحكم المشرف** — لوحة تحكم مؤسسية من 7 علامات تبويب تشمل التحليلات وإدارة المستخدمين والمالية وأدوات المجتمع وإعدادات الذكاء الاصطناعي وسجلات المراجعة
- **نظام القسائم** — رموز ترويجية للاشتراكات والشارات
- **تتبع التبرعات** مع webhooks من Stripe ودعم محافظ العملات المشفرة

---

## مكدس التقنيات

| الطبقة | التقنية |
|--------|---------|
| الواجهة الأمامية | React 18 + TypeScript + Vite |
| التصميم | Tailwind CSS + Framer Motion + زجاجي |
| الخلفية | Firebase (Firestore، Auth، Storage، Hosting) |
| الوظائف السحابية | Node.js 22 + TypeScript |
| الذكاء الاصطناعي | Google Gemini + OpenRouter (عبر aiBridgeService) |
| المدفوعات | Stripe (وظيفة سحابية مخصصة + Extension احتياطية) |
| i18n | i18next + react-i18next (8 لغات) |
| PWA | Vite PWA Plugin + Workbox |
| الاختبار | Vitest + @testing-library/react |
| التحقق | مخططات Zod لجميع وثائق Firestore |

---

## البنية المعمارية

```
src/
├── components/         # مكونات واجهة المستخدم
│   ├── admin/          # علامات تبويب لوحة المشرف
│   ├── routers/        # موجِّهات العرض حسب الدور
│   └── ui/             # مكونات نظام التصميم المشترك
├── hooks/              # خطافات React المخصصة
├── services/           # طبقة الخدمات (نمط Firebase Facade)
│   ├── firebase.ts     # Facade dbService — واجهة API الرئيسية
│   ├── authService.ts  # المصادقة متعددة المزودين
│   ├── petService.ts   # CRUD الحيوانات والمشاهدات
│   ├── vetService.ts   # العيادات البيطرية والتحقق
│   ├── adminService.ts # عمليات المشرف وسجلات المراجعة
│   ├── searchService.ts# مطابقة الحيوانات بالذكاء الاصطناعي
│   └── karmaService.ts # التلعيب ونقاط الكارما
├── contexts/           # سياقات React (اللغة، السمة، Snackbar)
├── translations/       # كائنات ترجمة TypeScript (8 لغات)
└── types.ts            # تعريفات الأنواع المركزية (~50+ واجهة)

public/locales/         # ملفات ترجمة JSON (HttpBackend)
functions/src/          # وظائف Firebase السحابية (Node.js 22)
```

**التوجيه:** نظام مخصص قائم على العروض (بدون React Router). يدير `App.tsx` العرض الحالي عبر الحالة، مع موجِّهات حسب الدور لـ `owner` و`vet` و`shelter` و`volunteer` و`super_admin`.

---

## البدء

### المتطلبات المسبقة

- Node.js >= 22
- Firebase CLI: `npm install -g firebase-tools`
- مشروع Firebase ([أنشئ واحدًا](https://console.firebase.google.com/))

### الإعداد

```bash
# 1. استنساخ المستودع
git clone https://github.com/50yas/PawPrintFind.git
cd PawPrintFind

# 2. تثبيت التبعيات
npm install

# 3. ضبط متغيرات البيئة
cp .env.example .env.local
# عدِّل .env.local وأدخل مفاتيح API الخاصة بك (راجع .env.example لجميع المتغيرات المطلوبة)

# 4. تشغيل خادم التطوير
npm run dev
# التطبيق يعمل على http://localhost:3000
```

### متغيرات البيئة

انسخ `.env.example` إلى `.env.local` وأدخل بيانات الاعتماد الخاصة بك:

| المتغير | الوصف |
|---------|-------|
| `GEMINI_API_KEY` | مفتاح API لـ Google Gemini لميزات الذكاء الاصطناعي |
| `VITE_STRIPE_PUBLISHABLE_KEY` | المفتاح العام لـ Stripe (اختبار أو إنتاج) |
| `VITE_FIREBASE_API_KEY` | مفتاح API لمشروع Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | نطاق مصادقة Firebase |
| `VITE_FIREBASE_PROJECT_ID` | معرف مشروع Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | حاوية تخزين Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | معرف مرسل رسائل Firebase |
| `VITE_FIREBASE_APP_ID` | معرف تطبيق Firebase |
| `VITE_FIREBASE_MEASUREMENT_ID` | معرف قياس Firebase Analytics |

---

## أوامر التطوير

```bash
npm run dev        # تشغيل خادم التطوير (المنفذ 3000)
npm run build      # فحص TypeScript + بناء الإنتاج عبر Vite → dist/
npm run lint       # فحص الأنواع فقط (tsc --noEmit)
npm run test       # تشغيل جميع الاختبارات مرة واحدة (vitest run)
npx vitest --watch # وضع المراقبة للاختبارات
```

---

## النشر

```bash
# نشر كل شيء على Firebase
npm run deploy

# نشر الواجهة الأمامية فقط
firebase deploy --only hosting

# نشر الوظائف السحابية فقط
firebase deploy --only functions

# نشر قواعد أمان Firestore
firebase deploy --only firestore:rules

# نشر فهارس Firestore
firebase deploy --only firestore:indexes
```

---

## ادعم PawPrintFind

PawPrintFind مشروع مجتمعي مفتوح المصدر. يكلف تشغيل هذه المنصة ما يقارب **€165 شهريًا** في البنية التحتية وتكاليف استنتاج الذكاء الاصطناعي. إذا أفادك PawPrintFind أو كنت تؤمن بمهمتنا، فكِّر في دعمنا.

### التكاليف الشهرية للمنصة

| المورد | التكلفة الشهرية |
|--------|----------------|
| استنتاج الذكاء الاصطناعي (Gemini + OpenRouter) | €120.00 |
| البنية التحتية السحابية (Firebase + GCP) | €45.00 |
| **المجموع** | **€165.00 / شهر** |

---

### التبرع بالبطاقة البنكية (Stripe)

مدفوعات آمنة بالبطاقة عبر [Stripe](https://stripe.com). اختر مستوى أو أدخل مبلغًا مخصصًا على [pawprint-50.web.app](https://pawprint-50.web.app) (انقر على زر القلب/التبرع):

| المستوى | المبلغ | المميزات |
|---------|--------|----------|
| ☕ قهوة | €5 | امتنان أبدي + شارة داعم المجتمع |
| 🌟 داعم | €25 | جميع مميزات قهوة + وضع المانح البارز + وصول مبكر للميزات الجديدة |
| 🦁 بطل | €100 | جميع مميزات داعم + شارة بطل المجتمع + طلبات مباشرة للميزات + شكر شخصي |
| مخصص | أي مبلغ (الحد الأدنى €1) | حسب اختيارك |

تتم معالجة جميع تبرعات البطاقة من خلال Stripe الآمن. ستتلقى إيصالًا بالبريد الإلكتروني.

---

### التبرع بالعملات المشفرة

أرسل مباشرة إلى محافظنا — بلا وسيط، تحويل فوري:

**Bitcoin (BTC)**
```
bc1qwyyjx9xcf23h04rwd34ptepqurn2c6h4zqme55
```

**Ethereum (ETH)**
```
0x8e712F2AC423C432e860AB41c20aA13fe5b4DD04
```

**Solana (SOL)**
```
4Gt3VPbwWXsRWjMJxGgjuX8sVd7b2LX3nzzbbH7Hp7Uy
```

**BNB Chain (BNB)**
```
0x8e712F2AC423C432e860AB41c20aA13fe5b4DD04
```

يمكنك أيضًا مسح رموز QR مباشرةً من نافذة التبرع داخل التطبيق.

> كل تبرع — بغض النظر عن حجمه — يساعد في الإبقاء على المنصة وتطوير ميزات جديدة تعيد المزيد من الحيوانات إلى عائلاتها.

---

## المساهمة

المساهمات مرحب بها! إليك كيفية البدء:

1. انسخ (Fork) المستودع
2. أنشئ فرعًا للميزة: `git checkout -b feature/ميزتي`
3. أجرِ تعديلاتك واكتب الاختبارات
4. شغِّل مجموعة الاختبارات: `npm test`
5. أرسل طلب دمج (Pull Request)

### أسلوب الكود

- TypeScript في وضع strict — لا تستخدم `any` إلا عند الضرورة القصوى
- يجب ترجمة جميع النصوص الظاهرة للمستخدم (أضف المفاتيح إلى جميع ملفات اللغات الثمانية)
- اتبع نمط service facade — تذهب منطق الخلفية الجديد في ملف خدمة، ويُكشف عبر `dbService`
- مخططات Zod مطلوبة لجميع أنواع وثائق Firestore الجديدة

### إضافة ميزة جديدة

راجع `CLAUDE.md` للحصول على إرشادات معمارية مفصلة وأعراف التوجيه وتوثيق نظام الترجمة.

---

## الرخصة

رخصة MIT — راجع [LICENSE](LICENSE) للتفاصيل.

---

<div align="center">

صُنع بحب لكل حيوان يستحق أن يجد طريقه للعودة إلى المنزل.

**[Live Demo](https://pawprint-50.web.app)** · **[الإبلاغ عن خطأ](https://github.com/50yas/PawPrintFind/issues)** · **[طلب ميزة](https://github.com/50yas/PawPrintFind/issues)**

</div>

</div>
