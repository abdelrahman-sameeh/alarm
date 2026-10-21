# Alarm

تطبيق منبّه عربي مصري لإدارة مجموعة من المنبّهات مرة واحدة، مبني باستخدام React Native وExpo وTypeScript.

## الفكرة

لو صحيت قبل باقي المنبّهات، اضغط **صحيت خلاص؟** وحدد كل اللي فاضل، ثم اختار:

- **النهارده بس:** تخطّي رنات اليوم مع الاحتفاظ بالتكرار.
- **إيقاف دايم:** إيقاف المنبّهات لحد ما تشغلها بنفسك.
- **حذف:** إزالة المنبّهات نهائيًا.

التفاصيل الكاملة وحدود النسخة الحالية موجودة في [تصور المنتج](docs/PRODUCT.md).

## التشغيل

```bash
npm install
npm start
```

أوامر التشغيل المباشر:

```bash
npm run android
npm run ios
npm run web
```

تشغيل iOS محليًا يحتاج macOS وXcode.

## إنشاء APK للتثبيت المباشر

سجّل الدخول إلى Expo مرة واحدة، ثم ابدأ بناء النسخة:

```bash
npx eas-cli@latest login
npm run build:apk
```

ملف `eas.json` يحتوي على profile باسم `preview` مضبوط على `android.buildType: apk`. بعد اكتمال البناء سيظهر رابط يمكن فتحه من الموبايل لتنزيل وتثبيت التطبيق. أما profile باسم `production` فيُنتج ملف AAB المناسب لمتجر Google Play.

## فحوصات الجودة

```bash
npm run check
npx expo-doctor
```

## هيكل المشروع

```text
src/
├── app/                       # مسارات Expo Router فقط
├── features/
│   └── alarms/
│       ├── components/        # واجهة ميزة المنبّهات
│       ├── data/              # التخزين ومصادر البيانات
│       ├── domain/            # الأنواع وقواعد العمل النقية
│       └── store/             # الحالة وربط الواجهة بالبيانات
└── theme/                     # ألوان ومسافات التصميم
```

الهيكل متعمد يكون صغيرًا: الفصل موجود عند حدود المسؤوليات فقط، بدون abstraction أو folders زيادة.

## الإصدارات على GitHub

المشروع يستخدم Release Please. بعد رفعه على GitHub:

1. اجعل `main` أو `master` هو الفرع الأساسي.
2. فعّل GitHub Actions بصلاحية قراءة وكتابة للـ workflows.
3. استخدم Conventional Commits مثل:

```text
feat: add alarm grouping
fix: keep skipped alarms disabled for today
```

سيُنشئ workflow طلب Release PR تلقائيًا، وعند دمجه ينشئ GitHub Release ويحدث رقم النسخة وسجل التغييرات. فحص lint وTypeScript وExpo وبناء Android bundle يعمل تلقائيًا مع كل Pull Request.

## ملاحظة عن المنبّه الحقيقي

إدارة المنبّهات والواجهة والتخزين واستيراد ومعاينة ملفات الصوت موجودة. الاعتماد على رنين دقيق والتطبيق مغلق، وتشغيل ملف اختاره المستخدم كصوت منبّه، يحتاج محرك native مخصص قبل اعتبار التطبيق جاهزًا للنشر في المتاجر.
