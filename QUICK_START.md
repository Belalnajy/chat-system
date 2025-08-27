# ⚡ تشغيل سريع للمشروع

## 🚀 التشغيل المحلي (5 دقائق)

### 1. تثبيت Dependencies
```bash
# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install
```

### 2. إعداد قاعدة البيانات
```bash
# تشغيل MongoDB (Docker)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# أو استخدام MongoDB Atlas (cloud)
# أنشئ حساب على https://cloud.mongodb.com
```

### 3. إعداد Environment Variables
```bash
# في مجلد backend
cp .env.example .env

# عدل الملف .env:
MONGODB_URI=mongodb://localhost:27017/chat-system
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
PORT=3001
```

### 4. تشغيل التطبيق
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend  
npm run dev
```

### 5. فتح التطبيق
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🐳 التشغيل بـ Docker (أسرع)

```bash
# تشغيل كامل بأمر واحد
docker-compose up -d

# التطبيق سيكون متاح على:
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# MongoDB: localhost:27017
```

## 🧪 اختبار التطبيق

### 1. إنشاء حسابات تجريبية
```bash
# تشغيل script الاختبار
node test_api.js
```

### 2. تسجيل دخول
- Email: `test@example.com`
- Password: `password123`

### 3. اختبار الميزات
- ✅ تسجيل دخول/خروج
- ✅ البحث عن مستخدمين  
- ✅ إنشاء محادثات
- ✅ إرسال رسائل
- ✅ الرسائل الفورية

## 🔧 استكشاف الأخطاء

### مشكلة الاتصال بقاعدة البيانات
```bash
# تأكد من تشغيل MongoDB
docker ps | grep mongo

# أو تحقق من الاتصال
mongosh mongodb://localhost:27017/chat-system
```

### مشكلة في الـ Ports
```bash
# تحقق من الـ ports المستخدمة
lsof -i :3000  # Frontend
lsof -i :3001  # Backend  
lsof -i :27017 # MongoDB
```

### مشكلة في JWT
```bash
# تأكد من وجود JWT_SECRET في .env
cat backend/.env | grep JWT_SECRET
```

## 📱 الميزات المتاحة

### ✅ مكتملة
- 🔐 تسجيل دخول وإنشاء حسابات
- 🔍 البحث عن المستخدمين
- 💬 إنشاء محادثات جديدة
- 📨 إرسال واستقبال رسائل نصية
- ⚡ رسائل فورية مع Socket.io
- 📱 واجهة مستخدم حديثة وسريعة الاستجابة
- 🔒 أمان شامل مع JWT وتشفير

### 🔄 قيد التطوير
- 📷 إرسال الصور
- 👥 المحادثات الجماعية  
- 🔔 الإشعارات
- 📞 المكالمات الصوتية/المرئية

---

**المشروع جاهز للاستخدام! 🎉**

للمساعدة أو الأسئلة، راجع `README.md` للتفاصيل الكاملة.
