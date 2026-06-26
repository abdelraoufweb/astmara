# Estmara American Academy - Registration App

تطبيق تسجيل الطلاب مع إشعارات واتساب تلقائية.

## المتطلبات

- Node.js 18+
- MongoDB Atlas (أو أي MongoDB)
- حساب واتساب نشط (لإرسال الإشعارات)

## التشغيل المحلي

```bash
# 1. تثبيت الحزم
npm install

# 2. تشغيل السيرفر
npm start
```

### أول مرة تشغيل

1. شغّل `npm start`
2. سيظهر QR code في التيرمينال
3. افتح واتساب على موبايلك → Settings → Linked Devices → Scan QR
4. بعد المسح، السيرفر جاهز

السيرفر شغال على: `http://localhost:3000`

## الإشعارات

عند تسجيل طالب جديد:
- يتم الحفظ في MongoDB
- إرسال إشعار واتساب للأدمن +201112966609
- عرض الإحصائيات المحدثة

## إبقاء البوت شغال 24/7

```bash
# تثبيت pm2
npm install -g pm2

# تشغيل البوت
pm2 start server.js --name "estmara-bot"

# حفظ الإعدادات للتشغيل التلقائي
pm2 save
pm2 startup

# لعرض الحالة
pm2 status

# لإيقاف
pm2 stop estmara-bot

# لعرض logs
pm2 logs estmara-bot
```

## النشر على Vercel (الواجهة فقط)

واتساب بايلي يشتغل محلياً أو على VPS (مش بيشتغل على Vercel serverless).

### 1. انشر الباك إند على Render/Railway

انشر مجلد `registration-app` كاملاً على Render كـ Web Service.

### 2. حدث رابط API في Vercel

```bash
cd vercel-app
```

في ملف `index.html` غيّر:
```js
const API_BASE = 'https://your-backend-url.com';
```
ضع رابط الباك إند بتاعك.

### 3. انشر على Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd vercel-app
vercel --prod
```

## متغيرات البيئة (.env)

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/registrations
ADMIN_PHONE=+201112966609
PORT=3000
```

## API Endpoints

- `POST /api/register` - تسجيل طالب جديد
- `GET /api/stats` - عرض الإحصائيات

## License

MIT
