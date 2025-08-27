# نظام الشات الفوري - Real-Time Chat System

## 🎯 نظرة عامة
نظام شات فوري كامل مبني بـ Node.js و Next.js مع MongoDB، يدعم المحادثات الفردية في الزمن الحقيقي مع إرسال النصوص والصور.

## 🛠️ التقنيات المستخدمة

### ✅ تم التنفيذ
- **المصادقة والتسجيل**: نظام تسجيل دخول آمن بـ JWT
- **البحث عن المستخدمين**: إمكانية البحث وبدء محادثات جديدة
- **واجهة المستخدم**: صفحة تسجيل الدخول وصندوق الوارد
- **إدارة الحالة**: Zustand للـ frontend state management
- **API الأساسية**: endpoints للمصادقة والمستخدمين
- **قاعدة البيانات**: نماذج MongoDB للمستخدمين والمحادثات والرسائل
- **الأمان**: تشفير كلمات المرور، rate limiting، CORS

### 🔄 قيد التطوير
- **صفحة الشات**: واجهة إرسال واستقبال الرسائل
- **الرسائل الفورية**: Socket.io integration
- **رفع الصور**: نظام رفع وعرض الصور
- **حالة الرسائل**: مؤشرات الإرسال والتسليم والقراءة

## 🛠 التقنيات المستخدمة

### Backend
- **Node.js** مع Express.js
- **TypeScript** للأمان في الكتابة
- **MongoDB** مع Mongoose ODM
- **Socket.io** للتواصل الفوري
- **JWT** للمصادقة
- **bcrypt** لتشفير كلمات المرور
- **Winston** للسجلات
- **Joi** للتحقق من البيانات
- **Multer** لرفع الملفات

### Frontend
- **Next.js 14** مع App Router
- **TypeScript**
- **Tailwind CSS** للتصميم
- **Zustand** لإدارة الحالة
- **React Query** لجلب البيانات
- **Socket.io Client** للميزات الفورية
- **React Hot Toast** للإشعارات

### قاعدة البيانات والبنية التحتية
- **MongoDB** لتخزين البيانات
- **Redis** (اختياري) لتخزين الجلسات والتخزين المؤقت
- **Docker** للحاويات

## 📁 هيكل المشروع

```
chat-system/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript types
│   │   └── index.ts        # Main server file
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js app directory
│   │   ├── components/     # Reusable components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── stores/         # Zustand stores
│   │   └── types/          # TypeScript types
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml
└── README.md
```

## 🚀 البدء السريع

### المتطلبات الأساسية

- Node.js 18+ و npm
- Docker و Docker Compose
- Git

### التثبيت

1. **استنساخ المستودع**
   ```bash
   git clone <repository-url>
   cd chat-system
   ```

2. **تشغيل خدمات قاعدة البيانات**
   ```bash
   docker-compose up -d
   ```

3. **إعداد الخادم الخلفي**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # تحرير .env مع الإعدادات الخاصة بك
   npm run dev
   ```

4. **إعداد الواجهة الأمامية**
   ```bash
   cd frontend
   npm install
   cp .env.local.example .env.local
   # تحرير .env.local مع الإعدادات الخاصة بك
   npm run dev
   ```

5. **الوصول للتطبيق**
   - الواجهة الأمامية: http://localhost:3000
   - API الخادم: http://localhost:3001
   - MongoDB: localhost:27017
   - Redis: localhost:6379

## ⚙️ متغيرات البيئة

### Backend (.env)
```env
PORT=3001
MONGODB_URI=mongodb://admin:password123@localhost:27017/chat_db?authSource=admin
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## 📚 توثيق API

### نقاط نهاية المصادقة

- `POST /api/auth/register` - تسجيل مستخدم جديد
- `POST /api/auth/login` - تسجيل دخول المستخدم
- `POST /api/auth/refresh` - تحديث رمز الوصول
- `POST /api/auth/logout` - تسجيل خروج المستخدم
- `GET /api/auth/me` - الحصول على المستخدم الحالي

### نقاط نهاية المستخدمين

- `GET /api/users/search?q=query` - البحث عن المستخدمين
- `PUT /api/users/profile` - تحديث ملف المستخدم
- `GET /api/users/:id` - الحصول على مستخدم بالمعرف

### نقاط نهاية المحادثات

- `GET /api/conversations` - الحصول على محادثات المستخدم
- `POST /api/conversations` - إنشاء محادثة جديدة
- `GET /api/conversations/:id/messages` - الحصول على رسائل المحادثة
- `PUT /api/conversations/:id/read` - تحديد الرسائل كمقروءة

### نقاط نهاية الرسائل

- `POST /api/messages` - إرسال رسالة (نص أو صورة)
- `GET /api/messages/:id` - الحصول على رسالة بالمعرف
- `PUT /api/messages/:id/status` - تحديث حالة الرسالة

## 🔌 أحداث Socket.io

### من العميل إلى الخادم
- `join_conversation` - الانضمام لغرفة محادثة
- `leave_conversation` - مغادرة غرفة محادثة
- `send_message` - إرسال رسالة
- `typing_start` - بدء مؤشر الكتابة
- `typing_stop` - إيقاف مؤشر الكتابة

### من الخادم إلى العميل
- `message_received` - استلام رسالة جديدة
- `message_status_updated` - تغيير حالة الرسالة
- `user_typing` - المستخدم يكتب
- `user_stopped_typing` - المستخدم توقف عن الكتابة
- `conversation_updated` - تحديث المحادثة

## 🎯 أهداف الأداء

- **تسليم الرسائل**: < 300ms
- **وقت استجابة API**: < 200ms
- **وقت تحميل صندوق الوارد**: < 2 ثانية على 4G
- **وقت التشغيل**: > 99.9%

## 🔒 ميزات الأمان

- مصادقة JWT مع رموز التحديث
- تشفير كلمات المرور بـ bcrypt
- تحديد معدل الطلبات على جميع النقاط
- التحقق من صحة البيانات وتنظيفها
- إعداد CORS
- التحقق من صحة رفع الملفات
- منع حقن SQL
- حماية XSS

## 📋 الخطوات التالية

1. **إكمال صفحة الشات**
   - واجهة إرسال الرسائل
   - عرض الرسائل بالوقت الفعلي
   - مؤشرات حالة الرسائل

2. **تطبيق Socket.io**
   - إعداد الاتصالات الفورية
   - إدارة غرف المحادثات
   - مؤشرات الكتابة

3. **نظام رفع الصور**
   - رفع وتخزين الصور
   - ضغط وتحسين الصور
   - عرض الصور في المحادثات

4. **تحسينات الأداء**
   - تحسين استعلامات قاعدة البيانات
   - تطبيق التخزين المؤقت
   - تحسين حجم الحزم

5. **الاختبارات والنشر**
   - كتابة اختبارات الوحدة والتكامل
   - إعداد CI/CD
   - نشر الإنتاج

## 🤝 المساهمة

1. Fork المستودع
2. إنشاء فرع للميزة
3. إجراء التغييرات
4. إضافة اختبارات إذا أمكن
5. تقديم pull request

## 📄 الترخيص

ترخيص MIT - انظر ملف LICENSE للتفاصيل.بواسطة**: Belal  
**التاريخ**: 27 أغسطس 2025
