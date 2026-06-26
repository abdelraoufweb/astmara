require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { connectToWhatsApp, sendMessage } = require('./whatsapp/client');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PHONE = process.env.ADMIN_PHONE || '+201112966609';

app.use(cors());
app.use(bodyParser.json());
// No static files served here, purely backend API.

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ متصل بـ MongoDB'))
  .catch(err => console.error('❌ خطأ في الاتصال بـ MongoDB:', err));

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentPhone: { type: String, required: true },
  parentPhone: { type: String, required: true },
  instructor: { type: String, enum: ['prof_ahmed', 'prof_assem'], required: true },
  method: { type: String, enum: ['online', 'center'], required: true },
  createdAt: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);

app.post('/api/register', async (req, res) => {
  try {
    const { name, studentPhone, parentPhone, instructor, method } = req.body;

    if (!name || !studentPhone || !parentPhone || !instructor || !method) {
      return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    }

    const egyptPhoneRegex = /^01[0-9]{9}$/;
    if (!egyptPhoneRegex.test(studentPhone.replace(/[^0-9]/g, ''))) {
      return res.status(400).json({ error: 'رقم الطالب غير صحيح - يجب أن يكون رقم مصري 11 رقم' });
    }
    if (!egyptPhoneRegex.test(parentPhone.replace(/[^0-9]/g, ''))) {
      return res.status(400).json({ error: 'رقم ولي الأمر غير صحيح - يجب أن يكون رقم مصري 11 رقم' });
    }

    const student = new Student({ name, studentPhone, parentPhone, instructor, method });
    await student.save();

    const total = await Student.countDocuments();
    const online = await Student.countDocuments({ method: 'online' });
    const center = await Student.countDocuments({ method: 'center' });
    const ahmed = await Student.countDocuments({ instructor: 'prof_ahmed' });
    const assem = await Student.countDocuments({ instructor: 'prof_assem' });

    const instructorLabel = instructor === 'prof_ahmed' ? 'Prof Ahmed Raouf' : 'Prof Assem Raouf';
    const methodLabel = method === 'online' ? 'أونلاين' : 'سنتر';

    const message = `📋 استمارة أمريكان

🔔 تسجيل جديد!
👤 الاسم: ${name}

📱 رقم الطالب: ${studentPhone}

📞 رقم ولي الأمر: ${parentPhone}

👨‍🏫 المدرس: ${instructorLabel}

📍 الطريقة: ${methodLabel}

📊 إحصائيات الآن:
🌐 أونلاين: ${online}
🏛️ سنتر: ${center}
👨‍🏫 مع مستر أحمد: ${ahmed}
👨‍🏫 مع مستر عاصم: ${assem}
📈 الإجمالي: ${total}`;

    try {
      await sendMessage(ADMIN_PHONE, message);
      console.log('✅ تم إرسال إشعار واتساب');
    } catch (whatsappErr) {
      console.error('❌ فشل إرسال واتساب:', whatsappErr.message);
    }

    res.json({
      success: true,
      student: {
        name,
        studentPhone,
        parentPhone,
        instructor: instructorLabel,
        method: methodLabel
      },
      stats: { total, online, center, ahmed, assem }
    });
  } catch (err) {
    console.error('❌ خطأ في التسجيل:', err);
    res.status(500).json({ error: 'حدث خطأ في التسجيل' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const total = await Student.countDocuments();
    const online = await Student.countDocuments({ method: 'online' });
    const center = await Student.countDocuments({ method: 'center' });
    const ahmed = await Student.countDocuments({ instructor: 'prof_ahmed' });
    const assem = await Student.countDocuments({ instructor: 'prof_assem' });

    res.json({ total, online, center, ahmed, assem });
  } catch (err) {
    console.error('❌ خطأ في الإحصائيات:', err);
    res.status(500).json({ error: 'حدث خطأ' });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 السيرفر شغال على http://localhost:${PORT}`);
});

connectToWhatsApp().then(() => {
  console.log('✅ واتساب جاهز');
}).catch(err => {
  console.error('❌ فشل تشغيل واتساب:', err.message || err);
});
