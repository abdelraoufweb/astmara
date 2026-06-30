const { makeWASocket, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const path = require('path');
const { useMongoDBAuthState } = require('./mongoAuth');

const waLogger = pino({ level: 'silent' });

let sock = null;
let isConnected = false;
let pingInterval = null;

function formatPhone(phone) {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (!cleaned.endsWith('@s.whatsapp.net')) {
    cleaned = cleaned + '@s.whatsapp.net';
  }
  return cleaned;
}

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMongoDBAuthState();
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`استخدام إصدار واتساب ويب: ${version.join('.')}, الأحدث: ${isLatest}`);

  sock = makeWASocket({
    version,
    printQRInTerminal: false,
    auth: state,
    logger: waLogger,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    markOnlineOnConnect: false
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📱 قم بمسح رمز QR هذا لتسجيل الدخول إلى واتساب:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      isConnected = true;
      console.log(`✅ واتساب متصل - ${new Date().toLocaleString('ar-EG')}`);
    }

    if (connection === 'close') {
      isConnected = false;
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log(`❌ واتساب انقطع - ${new Date().toLocaleString('ar-EG')} (السبب: ${reason || 'غير معروف'})`);

      if (reason === DisconnectReason.loggedOut) {
        console.log('⚠️ تم تسجيل الخروج من واتساب. امسح المجلد whatsapp_auth وأعد التشغيل.');
        return;
      }

      console.log('🔄 إعادة الاتصال بعد 5 ثوان...');
      setTimeout(connectToWhatsApp, 5000);
    }
  });

  sock.ev.on('messages.upsert', () => {});

  // أزلنا دالة الـ ping المستمرة لأن إرسال 'available' كل 30 ثانية يسبب حظر الرقم (يبدو كبوت)
  return sock;
}

// دالة توقف مؤقت لمحاكاة الكتابة البشرية
const delay = ms => new Promise(res => setTimeout(res, ms));

async function sendMessage(phone, text) {
  if (!sock || !isConnected) {
    throw new Error('واتساب غير متصل');
  }

  const jid = formatPhone(phone);

  try {
    // محاكاة سلوك بشري لتجنب الحظر: الظهور "يكتب..." لمدة 3 ثواني قبل الإرسال
    await sock.sendPresenceUpdate('composing', jid);
    await delay(3000 + Math.random() * 2000); // تأخير عشوائي بين 3 و 5 ثواني
    await sock.sendPresenceUpdate('paused', jid);

    await sock.sendMessage(jid, { text });
    console.log(`📤 تم إرسال الرسالة إلى ${phone}`);
    return true;
  } catch (err) {
    console.error(`❌ فشل إرسال الرسالة إلى ${phone}:`, err.message);
    throw err;
  }
}

function getConnectionStatus() {
  return isConnected;
}

module.exports = { connectToWhatsApp, sendMessage, getConnectionStatus };
