# تسليم وصل — التحديث 1.1

## ما تم تحديثه

- وضع رابط مشروع Supabase الجديد والمفتاح المنشور داخل الإعدادات المشتركة للتطبيقين.
- إضافة زر الشمس/القمر للوضع الفاتح والداكن في شاشات الدخول وفي التطبيقين.
- حفظ الاختيار بين الصفحات وإعادة التحميل، ومزامنته بين التبويبات على نفس النطاق.
- استخدام تفضيل نظام التشغيل أول مرة، مع ألوان هادئة وتباين مختبر في الوضعين.
- تجهيز `vercel.json` وبناء التطبيقين تحت نطاق Vercel واحد.

المشروع المرتبط الآن:

```text
https://vbsrwnjyiskbjangbohb.supabase.co
```

**بما أنك أكملت إعداد قاعدة البيانات، لا تُعد تشغيل `supabase/setup.sql` ولا تحذف أي جدول. هذا التحديث لا يغيّر قاعدة البيانات.**

## التشغيل المحلي

النسخة المرفقة تحتوي ملفات مبنية. من مجلد `wasl-support`:

```bash
node scripts/serve.mjs
```

افتح `/customer/` و`/support/` على `http://localhost:4173`. سجّل الدخول بحساباتك الفعلية. أزرار «جرّب» تدخل بيئة تجريبية محلية وليست قاعدة بياناتك.

لتثبيت أدوات التطوير وإعادة البناء:

```bash
npm ci
npm run build
npm run preview
```

إذا نسخت إعدادات من إصدار قديم، احذف أو حدّث `.env` القديم حتى لا يتجاوز رابط المشروع الجديد. ملف `.env.example` والإعدادات المرفقة يحتويان بيانات المشروع الجديد بالفعل. قد تحتاج إلى تسجيل الدخول مجددًا لأن الجلسات أصبحت منفصلة حسب مشروع Supabase.

## GitHub

لاستعادة السجل الكامل من الأرشيف الجديد:

```bash
git clone wasl-support.bundle wasl-platform
cd wasl-platform
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

استبدل اسم المستخدم والمستودع. استخدم مستودعًا فارغًا أو فرعًا متوافقًا. النسخة الجديدة تحفظ الـ١٠ commits الأصلية وتضيف ٤ commits خاصة بالربط والثيم والنشر والتسليم، بإجمالي ١٤.

إذا سبق أن رفعت الإصدار الأصلي بنفس سجله ولم تضف تغييرات عليه، يمكنك دفع هذا السجل كتحديث عادي. إذا رفض Git الدفع بسبب وجود تعديلات أحدث، لا تستخدم force push؛ ادمج التغييرات أولًا. راجع `docs/GITHUB.md`.

## Vercel

استورد المستودع من جذره، وليس مجلد React أو Angular منفردًا:

| الإعداد          | القيمة                 |
| ---------------- | ---------------------- |
| Framework Preset | Other                  |
| Root Directory   | جذر المستودع           |
| Install Command  | `npm ci`               |
| Build Command    | `npm run build:vercel` |
| Output Directory | `site`                 |
| Node.js          | 22.x                   |

أضف في Environment Variables القيمتين التاليتين لبيئتي Production وPreview:

```env
SUPABASE_URL=https://vbsrwnjyiskbjangbohb.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_PA3m399V0GAIkiCGa_1lhg_YCWHdIeS
```

لا تضف كلمة مرور قاعدة البيانات أو `service_role` أو `sb_secret_`.

بعد Deploy ستحصل على رابط مثل:

```text
https://YOUR-PROJECT.vercel.app/customer/
https://YOUR-PROJECT.vercel.app/support/
```

في Supabase → Authentication → URL Configuration:

- اجعل Site URL هو رابط `/customer/` الفعلي.
- أضف رابطَي `/customer/` و`/support/` الفعليين إلى Redirect URLs.
- أعد النشر إذا غيّرت متغيرات Vercel.

**لا تحتاج إلى تغيير كود الربط عند الانتقال من localhost إلى النطاق المنشور.** ملف `docs/VERCEL.md` يشرح الخطوات والمشكلات الشائعة بالتفصيل.

## التحقق

نجح ٥٠ اختبارًا: ٣٤ لقواعد العمل والسياسات والإعدادات، و١٦ للمتصفح. نجح البناء الإنتاجي وتجهيز `site/` وفحوص الوضع الداكن والتباين.

تم التحقق من أن خدمة Auth تستجيب للمفتاح الجديد، وأن الوصول المجهول إلى `requests` و`profiles` مرفوض. لم أعدّل قاعدة بياناتك، ولا أملك كلمات مرور حساباتك لتجربة الدخول والرفع الفعلي نيابة عنك. لم يتم النشر من حسابك إلى Vercel؛ ملفات النشر جاهزة وتحتاج إلى استيراد المستودع من حسابك.
