# Alarm Masry

تطبيق منبه Android بواجهة عربية مصرية وDark Mode، مبني بـReact + Vite ومغلف كتطبيق Native باستخدام Capacitor.

## المميزات الحالية

- منبه مرة واحدة أو متكرر على أيام محددة.
- تعديل الساعة والدقيقة بزيادة أو نقصان دقيقة واحدة.
- تحديد أكتر من منبه ثم: تخطي النهارده، إيقاف دائم، أو حذف.
- 6 رنات مدمجة مع تشغيل وإيقاف المعاينة.
- إضافة ملف صوت من الجهاز واستخدامه كرنة للمنبه على Android.
- حفظ المنبهات محليًا وإعادة جدولتها بعد إعادة تشغيل الموبايل.
- زر Back داخل صفحات التعديل يرجع للتطبيق، ومن الرئيسية يصغر التطبيق.
- دعم اتجاه RTL وتصميم Mobile-first.

## متطلبات البناء

- Node.js 22 أو أحدث.
- Java 21 أو أحدث.
- Android SDK Platform 36.
- Android SDK Build Tools 35.

على الجهاز الحالي الأدوات متجهزة بالفعل، وسكربت البناء بيختار Java 21 تلقائيًا لو الـJava الافتراضي أقدم.

## التشغيل أثناء التطوير

```bash
npm install
npm run dev
```

## إخراج APK قابل للتثبيت

```bash
npm run android:apk
```

الملف الناتج:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

تثبيته على موبايل موصل وUSB Debugging شغال:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

بعد التثبيت افتح صفحة الإعدادات داخل التطبيق وفعّل إذن الإشعارات والمنبهات الدقيقة.

## أوامر مهمة بعد أي تعديل

```bash
npm run check          # فحص الكود وProduction build
npm run android:sync   # نقل آخر نسخة Web لمشروع Android
npm run android:apk    # Sync + إخراج APK
npm run android:open   # فتح مشروع Android Studio
```

## هيكل المشروع

```text
src/
  components/    مكونات الواجهة المشتركة
  data/          تعريف الرنات المدمجة
  domain/        أنواع وقواعد المنبه
  pages/         شاشات التطبيق
  services/      الصوت وجدولة Android
  store/         حالة المنبهات والتخزين المحلي
android/         مشروع Capacitor Android والكود الـNative
public/          ملفات الرنات المدمجة
scripts/         سكربتات البناء وتوليد الرنات
```

## GitHub Releases

أي Tag بالشكل `v*` يشغل Workflow ويبني APK ويرفقه في GitHub Release:

```bash
git tag v0.1.0
git push origin v0.1.0
```

نسخة GitHub الحالية Debug ومناسبة للتجربة والتثبيت المباشر. قبل النشر على Google Play يلزم Keystore خاص بالمشروع وRelease signing.
