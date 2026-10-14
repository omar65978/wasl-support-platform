# دليل تشغيل وصل وتحديثه

هذا هو دليل التشغيل الحالي. احتُفظ باسم الملف للتوافق مع الروابط وأداة إنشاء الأرشيف. توجد تعليمات التسليم السابقة وسياقها في [السجل التاريخي](history/README.md)، وليست خطوات يجب تكرارها عند كل تحديث.

## المستودع والموقع

- المستودع النشط: https://github.com/omar65978/wasl-support-platform
- بوابة العملاء: https://wasl-support-platform-v2.vercel.app/customer/
- مساحة الدعم: https://wasl-support-platform-v2.vercel.app/support/

وجود v2 في نطاق الموقع لا يعني أن اسم المستودع ما زال يحتوي عليه. لا تغيّر نطاق الموقع أو روابط الاستعادة لمجرد إعادة تسمية المستودع.

## تشغيل نسخة جديدة محليًا

ثبّت Node.js 22.x وnpm 10 أو أحدث وGit، ثم:

```bash
git clone https://github.com/omar65978/wasl-support-platform.git
cd wasl-support-platform
npm ci
npm run build
npm run preview
```

افتح:

```text
http://localhost:4173/customer/
http://localhost:4173/support/
```

نسخة Git لا تحتوي ملفات البناء؛ لذلك يجب تنفيذ البناء قبل المعاينة. أزرار التجربة تستخدم بيانات محلية، ولا تنشئ حسابات أو طلبات في قاعدة البيانات.

## تحديث نسخة موجودة

داخل مجلد المشروع:

```bash
git status
git remote -v
```

احفظ أي عمل محلي أولًا. إذا كانت النسخة نظيفة، اجلب آخر التغييرات:

```bash
git pull --ff-only origin main
npm ci
npm run verify
npm run build:vercel
npm run format:check
```

إذا رفض Git السحب بسبب تفرع السجل، توقف وافحص التغييرات. لا تستخدم force push أو reset --hard لحل المشكلة عشوائيًا. لا تعِد استنساخ حزمة قديمة فوق المشروع الحالي، ولا تُعِد تطبيق ملف patch سبق تطبيقه.

للاختبارات في المتصفح:

```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

## حفظ تعديلاتك

راجع الملفات قبل إضافتها، واضبط اسم Git وبريدًا مرتبطًا بحسابك، ثم سجّل تغييرات فعلية برسائل واضحة. راجع [دليل العمل على المستودع](GITHUB.md). عدد عمليات الرفع لا يساوي عدد commits، وبيانات Git وحدها ليست دليلًا على طريقة كتابة الكود.

ملف `.gitattributes` يوحّد نهايات الأسطر النصية، وأمر `npm run format` يصلح التنسيق. لا ترفع كلمات المرور أو `.env.live` أو `.env.seed` أو ملفات البناء أو node_modules.

## قاعدة البيانات الحالية

المشروع الحالي مرتبط بـ:

```text
https://vbsrwnjyiskbjangbohb.supabase.co
```

**إذا كانت قاعدة البيانات مهيّأة، لا تعِد تشغيل `supabase/setup.sql` ولا تحذف الجداول عند تحديث الواجهة أو التوثيق.** إعداد قاعدة جديدة فقط موضح في [دليل الخلفية](BACKEND.md).

متغيرا الواجهة هما `SUPABASE_URL` و`SUPABASE_PUBLISHABLE_KEY`. لا تضع مفاتيح الإدارة أو كلمات المرور في الواجهة أو في Git. راجع ملفات البيئة المحلية القديمة إذا كان الاتصال يشير إلى مشروع غير المقصود.

## Vercel

استخدم مشروع النشر الحالي المرتبط بفرع main. لا تنشئ مشروعًا جديدًا لكل تعديل.

| الإعداد          | القيمة                 |
| ---------------- | ---------------------- |
| Root Directory   | `./`                   |
| Framework Preset | `Other`                |
| Install Command  | `npm ci`               |
| Build Command    | `npm run build:vercel` |
| Output Directory | `site`                 |
| Node.js          | `22.x`                 |

يُضبط متغيرا Supabase لبيئتي Production وPreview. تغيير متغيرات البناء يحتاج إلى إعادة نشر. بعد الدفع، تحقق من نجاح Actions ومن أن نشر Production المرتبط بآخر commit وصل إلى Ready. راجع [دليل Vercel](VERCEL.md).

## روابط المصادقة واستعادة كلمة المرور

في Authentication → URL Configuration، اجعل Site URL:

```text
https://wasl-support-platform-v2.vercel.app/customer/
```

واسمح بروابط العودة التالية:

```text
https://wasl-support-platform-v2.vercel.app/customer/
https://wasl-support-platform-v2.vercel.app/support/
https://wasl-support-platform-v2.vercel.app/customer/?auth=recovery
https://wasl-support-platform-v2.vercel.app/support/?auth=recovery
```

إذا استخدمت نطاقًا مخصصًا، ضع النطاق الفعلي بدل المثال وأعد التحقق من البريد. قالب Reset Password الافتراضي يستخدم `{{ .ConfirmationURL }}` للتحقق من الرابط قبل العودة إلى التطبيق. التفاصيل والقيود في [دليل استعادة كلمة المرور](PASSWORD-RECOVERY.md).

تغيير كلمة المرور لا يعيد صف profiles المحذوف. الحساب موجود في Authentication، بينما بيانات التطبيق ودوره في profiles. عند الحاجة يستعيد المسؤول الصف بنفس User UID والدور المخول سابقًا، لا بمعرّف جديد أو صلاحية أعلى.

## التحقق قبل اعتماد التحديث

- راجع [سجل التحقق الحالي](VERIFICATION.md): آخر نتائج التطبيق المسجلة تشمل ٥٢ اختبار SQL/منطق/إعدادات و٢٩ اختبار متصفح.
- اختبارات الاستعادة الآلية تستخدم استجابات Auth محاكاة؛ يجب اختبار وصول البريد وتغيير كلمة المرور الفعلي بعد إعداد الاستضافة والبريد.
- جرّب طلبًا حقيقيًا كعميل، ثم استلامه والرد عليه كموظف، وتحقق من الملاحظات الداخلية والمرفقات وصلاحيات المدير.
- الموقعان يستخدمان قاعدة البيانات نفسها؛ التجربة الحقيقية ليست معزولة عن بياناتها. استخدم بيئة اختبار مخصصة عند تشغيل الاختبارات التي تنشئ بيانات.
- لا تشارك كلمات المرور أو رموز الجلسات أو روابط الاستعادة الكاملة.

## الأرشيف الاختياري

لا تحتاج Git bundle للتشغيل العادي. إذا أردت إنشاء نسخة مصدر وبناء قابلة للنقل، اتبع [دليل الأرشفة الاختياري](PACKAGING.md). أرشيف Git لا يحفظ إعدادات الاستضافة أو بيانات Supabase أو قضايا المستودع تلقائيًا.
