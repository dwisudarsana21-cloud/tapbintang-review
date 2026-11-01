// src/functions/createLink.js
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

exports.handler = async (event, context) => {
  // Hanya menerima method POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const body = JSON.parse(event.body);
  const { shopName, waNumber, address, rating, comment } = body;

  // 1️⃣ Buat kode unik 4 karakter (A‑Z, 0‑9)
  const code = uuidv4().slice(0, 4).toUpperCase();

  // 2️⃣ Google Review URL (satu Place ID untuk semua toko)
  const placeId = 'ChIJ14nlJJtfZS4RQZIYgc9knJI';   // <-- ganti dengan ID tempat Anda
  const reviewUrl = `https://search.google.com/local/writereview?cid=${placeId}`;

  // 3️⃣ Jika rating ≤ 3, arahkan ke WhatsApp dengan pesan pre‑filled
  const waLink =
    Number(rating) <= 3
      ? `https://wa.me/${waNumber.replace(/^0|\+/, '')}?text=${encodeURIComponent(
          `Hai ${shopName}, saya memberi rating ${rating} dan ingin mengajukan keluhan.\nAlamat: ${address}\nKomentar: ${comment || ''}`
        )}`
      : reviewUrl;   // rating 4‑5 → langsung ke Google Review

  // 4️⃣ Simpan mapping ke KV (binding = REVIEW_LINKS)
  const kv = context.kv;                 // otomatis disediakan Netlify
  await kv.put(code, JSON.stringify({ reviewUrl, waLink, rating }));

  // 5️⃣ URL pendek yang akan di‑encode ke QR
  const shortUrl = `https://${process.env.URL || 'tapbintang-redirect.netlify.app'}/review/${code}`;

  // 6️⃣ Generate QR‑code (PNG data‑url)
  const qrDataUrl = await QRCode.toDataURL(shortUrl, { width: 400 });

  // 7️⃣ Response ke browser
  return {
    statusCode: 200,
    body: JSON.stringify({ shortUrl, qrDataUrl, code })
  };
};