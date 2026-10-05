/*
  كل نصوص الموقع (تركي) وإعدادات صاحبة المشروع في مكان واحد.
  ما كُتب هنا مصدره حسابها على إنستغرام فقط: شوكولا يدوية/منزلية، حسب الطلب، الشحن على المشتري، الطلب عبر الرسائل.
  لم نكتب أي ادعاء عن مصدر الشوكولا أو أوقات التوصيل أو المدن أو آراء الزبائن لأننا لا نعرفها بعد.
*/
export const CONFIG = {
  // رقم واتساب بالصيغة الدولية بدون + ولا مسافات، مثال تركيا: 905321234567. فارغ = يفتح واتساب لاختيار جهة اتصال.
  WA_NUMBER: '',
  INSTAGRAM: 'mh_chocolate22',
  SITE_NAME: 'MH Chocolate',
  CODE_PREFIX: 'MH-'
};

export const C = {
  title: 'MH Chocolate — Kalpten gelen çikolata',
  hero: {
    kicker: 'MY HEART CHOCOLATE',
    h1: ['Kalpten', 'gelen', 'çikolata.'],
    sub: 'Her şey taze ve sipariş üzerine, evde ve elle hazırlanır. Hızlı, kaliteli, özenle.',
    cta1: 'Parçanı tasarla',
    cta2: 'WhatsApp’tan yaz',
    hint: 'Parmağınla karıştır'
  },
  marquee: ['Her şey taze', 'Sipariş üzerine hazırlanır', 'El yapımı', 'Hızlı, kaliteli, özenli', 'Kişiye özel', 'Aklındaki her fikir', 'Sevgiyle'],
  studio: {
    kicker: 'PARÇA ATÖLYESİ',
    h2: 'Çikolatanı kendin tasarla.',
    lead: 'Şekli seç, çikolata türünü değiştir, üstüne süsünü ekle. Sepete at, tek dokunuşla WhatsApp’tan gönder.',
    drag: 'Döndürmek için sürükle',
    shapesLabel: 'Şekil',
    typeLabel: 'Çikolata türü',
    topLabel: 'Üstüne',
    fillLabel: 'İç dolgu',
    qtyLabel: 'Adet',
    notePh: 'Not: isim, yazı, renk, aklındaki her şey',
    priceNote: 'Fiyat; adet, boyut ve özel isteklere göre değişir. Net fiyatı WhatsApp’ta birlikte konuşuruz.',
    add: 'Sepete ekle'
  },
  shapes: {
    tablet: { n: 'Tablet çikolata', d: 'Kırılıp paylaşılan klasik tablet.' },
    truf: { n: 'Trüf', d: 'Yumuşak ve kakaolu, ağızda dağılan.' },
    kalp: { n: 'Kalpli çikolata', d: 'Sevdiğine en güzel mesaj.' },
    elmas: { n: 'Elmas', d: 'Kalıpta şekillenen, parlak yüzlü.' },
    karamel: { n: 'Karamel dolgulu', d: 'İçi karamel dolgulu kubbe.' },
    dudak: { n: 'Mutlu dudaklar', d: 'Meyve dolgulu, gülümseten şekil.' }
  },
  types: { bitter: 'Bitter', sutlu: 'Sütlü', beyaz: 'Beyaz', ruby: 'Ruby' },
  tops: { yok: 'Sade', altin: 'Altın yaldız', fistik: 'Antep fıstığı', findik: 'Fındık', badem: 'Badem' },
  fills: { sade: 'Sade', karamel: 'Karamel', frambuaz: 'Frambuaz jölesi', findik: 'Fındık', baska: 'Başka (nota yaz)' },
  custom: {
    kicker: 'ÖZEL İSTEK',
    h2: 'Hayal et, o yapsın.',
    lead: 'Aklındaki çikolata fikrini yaz: isim, şekil, hediye, davet, doğum günü… Yapılabilir mi diye WhatsApp’ta birlikte bakarız.',
    ph: 'Örn: 30 kişilik nişan için kalpli çikolata, üstünde isimleri yazsın…',
    chips: ['İsim yazılı', 'Düğün / nişan', 'Doğum günü', 'Bayram hediyesi', 'Özel şekil', 'Kurumsal hediye'],
    add: 'Sepete ekle'
  },
  how: {
    kicker: 'NASIL SİPARİŞ VERİLİR',
    h2: 'Üç adımda.',
    steps: [
      { t: 'Seç', d: 'Parçanı tasarla ya da isteğini yaz, sepete ekle.' },
      { t: 'WhatsApp’a gönder', d: 'Siparişin hazır bir mesaj olarak WhatsApp’ta açılır. Sadece Gönder’e bas.' },
      { t: 'Birlikte netleştirelim', d: 'Fiyat, teslim tarihi ve detaylar WhatsApp’ta konuşulur. Hazırlık sipariş sonrası başlar.' }
    ],
    note: 'Her çikolata taze ve sipariş üzerine hazırlandığı için fiyat sabit değildir; hız, kalite ve özen her siparişte aynıdır. Kargo ücreti alıcıya aittir.'
  },
  // images: مسارات صور حقيقية مثل 'assets/gallery/1.webp'. القسم يبقى مخفياً ما دامت المصفوفة فارغة.
  gallery: { kicker: 'GERÇEK ÇİKOLATALAR', h2: 'Mutfaktan sofraya.', more: 'Instagram’da daha fazlası', images: [] },
  footer: { line: 'Evde hazırlanan butik çikolata', ig: 'Instagram', wa: 'WhatsApp', credit: 'Web: Muhammed Elhuseyin', rights: '© 2026 MH Chocolate' },
  cart: {
    title: 'Sepetim', empty: 'Henüz bir şey eklemedin.', emptySub: 'Atölyeden bir parça seç ya da isteğini yaz.',
    name: 'Adın', city: 'Şehir', when: 'Ne zaman lazım? (tarih)', note: 'Eklemek istediğin not',
    send: 'WhatsApp’ta gönder', sendHint: 'Fiyat ve ödeme yok: siparişini mesaj olarak gönderirsin, detayları orada netleştiririz.',
    remove: 'Kaldır', bar: 'Sepetim', items: (n) => (n === 1 ? '1 sipariş' : n + ' sipariş'), piece: 'Parça', custom: 'Özel istek', qty: 'adet'
  },
  done: {
    t: 'Mesajın hazır 💛', d: 'WhatsApp açıldı mı? Mesajın hazır yazıldı, sadece Gönder’e bas.',
    ok: 'Gönderdim, sepeti temizle', again: 'WhatsApp’ı tekrar aç'
  },
  toast: { added: 'Sepete eklendi', loaded: 'Müşterinin tasarımı yüklendi' },
  wa: {
    hello: 'Merhaba! MH Chocolate sitesinden sipariş vermek istiyorum 🍫',
    orders: '🛍 Siparişim:',
    name: '👤 Ad', city: '📍 Şehir', when: '📅 Ne zaman lazım', note: '📝 Not',
    ask: 'Fiyat ve teslimat için bilgi alabilir miyim? 🙏', code: 'Sipariş kodu',
    qty: 'adet', fill: 'dolgu', top: 'üstü', custom: 'Özel istek', design: '🔗 Tasarımı gör'
  }
};
