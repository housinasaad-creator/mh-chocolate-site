/*
  كل نصوص الموقع (تركي) وإعدادات صاحبة المشروع في مكان واحد.
  ما كُتب هنا مصدره حسابها على إنستغرام ومحادثتنا: شوكولا يدوية/منزلية، حسب الطلب فقط، الشحن على المشتري، الطلب عبر واتساب، أهمية التمبرة.
  لم نكتب أي ادعاء عن مصدر الشوكولا أو أوقات التوصيل أو المدن أو آراء الزبائن لأننا لا نعرفها بعد.
  الأرقام (حرارة التمبرة، ساعات الليونة) تقريبية وعامة وموسومة بذلك في الموقع، وعلى صاحبة الحساب أن تعدّلها بما تعرفه عن منتجاتها.
*/
export const CONFIG = {
  // رقم واتساب بالصيغة الدولية بدون + ولا مسافات، مثال تركيا: 905321234567. فارغ = يفتح واتساب لاختيار جهة اتصال.
  WA_NUMBER: '',
  INSTAGRAM: 'mh_chocolate22',
  CODE_PREFIX: 'MH-',
  // ساعات تقريبية حتى تبدأ القطعة بالليونة عند كل حرارة (°C): [حرارة، ساعات]. بعد آخر قيمة تُستكمل خطياً.
  SOFT_TABLE: [[14, 9999], [18, 96], [22, 36], [25, 12], [27, 5], [29, 2], [31, .8], [33, .25], [36, .08]],
  // إزاحة حرارة الليونة حسب النوع (الحليب والأبيض والروبي يلينون أبكر من البيتر)
  TYPE_OFFSET: { bitter: 0, sutlu: 2, beyaz: 3, ruby: 2 },
  // درجات التمبرة التقريبية [إذابة، تبريد، عمل] لكل نوع
  TEMPER: { bitter: [50, 28, 31.5], sutlu: [45, 27, 30], beyaz: [43, 26, 28], ruby: [45, 27, 29] }
};

export const C = {
  title: 'MH Chocolate — Kalpten gelen çikolata',
  hero: {
    cta1: 'Parçanı tasarla', cta2: 'WhatsApp’tan yaz', hint: 'Kaydır',
    chapters: [
      { k: 'MY HEART CHOCOLATE', t: ['Kalpten', 'gelen', 'çikolata.'], s: 'Her şey taze ve sipariş üzerine, evde ve elle hazırlanır. Hızlı, kaliteli, özenle.', btns: true },
      { k: '01 · KIR', t: ['Taze', 'kırılır.'], s: 'İyi temperlenmiş çikolata temiz bir çıtırtıyla kırılır.' },
      { k: '02 · KES', t: ['Katman', 'katman.'], s: 'Kabuk, dolgu, çıtır parçacıklar: içi de dışı kadar özenli.' },
      { k: '03 · ERİT', t: ['Sıcakla', 'yumuşar.'], s: 'Eriyince en güzel hali: parlak, akışkan, kakao kokulu.' },
      { k: '04 · TASARLA', t: ['Şimdi', 'sıra sende.'], s: 'Şekli, dolguyu ve süsü sen seç; siparişin tek dokunuşla WhatsApp’ta.', btns: true }
    ]
  },
  studio: {
    kicker: 'PARÇA ATÖLYESİ', h2: 'Kes, gör, tasarla.',
    lead: 'Bir parçayı ortadan kesip katmanlarını gör. Çikolatayı, dolguyu ve çıtır katmanı sen seç; üstüne süsünü koy.',
    whole: 'Bütün', cut: 'Kesit', replay: 'Tekrar kes', drag: 'Döndürmek için sürükle · Katmana dokun',
    qtyLabel: 'Adet', notePh: 'Not: isim, yazı, renk, aklındaki her şey',
    priceNote: 'Fiyat; adet, boyut ve özel isteklere göre değişir. Net fiyatı WhatsApp’ta birlikte konuşuruz.',
    add: 'Sepete ekle', layersTitle: 'Katmanlar', metersTitle: 'Tadı nasıl olur?', metersNote: 'Seçimlerine göre yaklaşık bir rehber.',
    addons: 'Eklenebilir: çıtır katman, meyve jölesi, karamel, kremalar… Aklındaki başka bir şey varsa nota yaz.',
    tabletNote: 'Tablet dolgusuz hazırlanır; istersen çıtır parçacık ekleyebilirsin.'
  },
  steps: [
    { t: 'Çikolata', d: 'Kabuğun çikolatası ve kalınlığı' },
    { t: 'Dolgu', d: 'Kabuğun içindeki yumuşak katman' },
    { t: 'Çıtır katman', d: 'Isırınca çıtırdayan parçacıklar' },
    { t: 'Süs', d: 'Üstteki son dokunuş' }
  ],
  shapes: {
    tablet: { n: 'Tablet', d: 'Kırılıp paylaşılan klasik tablet.' },
    truf: { n: 'Trüf', d: 'Yumuşak ve kakaolu, ağızda dağılan.' },
    kalp: { n: 'Kalpli', d: 'Sevdiğine en güzel mesaj.' },
    elmas: { n: 'Elmas', d: 'Kalıpta şekillenen, parlak yüzlü.' },
    karamel: { n: 'Kubbe', d: 'Parlak kubbe, içi dolgulu.' },
    dudak: { n: 'Mutlu dudaklar', d: 'Meyve dolgulu, gülümseten şekil.' }
  },
  types: { bitter: 'Bitter', sutlu: 'Sütlü', beyaz: 'Beyaz', ruby: 'Ruby' },
  shellLabel: 'Kabuk kalınlığı', shells: ['İnce', 'Orta', 'Kalın'],
  fills: { yok: 'Dolgusuz', sade: 'Sade ganaj', karamel: 'Karamel', frambuaz: 'Frambuaz jölesi', findik: 'Fındık kreması', fistik: 'Antep fıstığı kreması' },
  crunchLabel: 'Çıtır katman', crunch: { yok: 'Yok', findik: 'Fındık parçaları', biskuvi: 'Bisküvi çıtırı' }, amountLabel: 'Miktar', amounts: ['Az', 'Orta', 'Bol'],
  tops: { yok: 'Sade', altin: 'Altın yaldız', fistik: 'Antep fıstığı', findik: 'Fındık', badem: 'Badem' },
  layers: {
    dust: { n: 'Kakao tozu', d: 'Trüfün dışındaki ince kakao tabakası.' },
    shell: { n: 'Kabuk', d: 'Parlak dış kabuk. Kalıpta ya da daldırılarak hazırlanır; ince kabuk daha yumuşak, kalın kabuk daha çıtır olur.' },
    fill: { n: 'Dolgu', d: 'Kabuğun içindeki yumuşak katman.' },
    crunch: { n: 'Çıtır katman', d: 'Isırınca çıtırdayan parçacıklar.' },
    top: { n: 'Süs', d: 'Üstteki son dokunuş.' }
  },
  meters: { yog: 'Yoğunluk', yum: 'Yumuşaklık', cit: 'Çıtırlık', tat: 'Tatlılık' },
  time: {
    kicker: 'ZAMAN & SICAKLIK', h2: 'Ne kadar dayanır?',
    lead: 'Ortam sıcaklığını seç, saat kendi kendine işlesin. Çikolatan ne zaman tam kıvamda, ne zaman yumuşamaya başlıyor, kendin gör.',
    temp: 'Ortam sıcaklığı', hour: 'Geçen süre', unit: 'saat', typeLabel: 'Çikolata türü',
    phases: ['Tam kıvam', 'Yumuşamaya yakın', 'Yumuşadı'], phaseDesc: ['Parlak ve çıtır.', 'Yüzey parlaklığını kaybedebilir.', 'Şekli bozulur, erir.'],
    stable: 'Bu sıcaklıkta 12 saat boyunca tam kıvamda kalır.', softAt: (h) => `Yaklaşık ${h} sonra yumuşamaya başlar.`,
    zones: ['Serin', 'İdeal', 'Ilık', 'Sıcak', 'Çok sıcak'],
    note: 'Yaklaşık ve genel bir rehberdir; çikolata türüne, dolguya ve ortama göre değişir. En iyi saklama: serin ve kuru bir yerde, 15–18°C.',
    hoursFmt: (h) => (h >= 24 ? Math.round(h / 24) + ' gün' : h >= 1 ? (Math.round(h * 10) / 10).toString().replace('.', ',') + ' saat' : Math.max(1, Math.round(h * 60)) + ' dakika')
  },
  craft: {
    kicker: 'NASIL HAZIRLANIR', h2: 'İyi temper, iyi çikolata.', lead: 'Parlak yüzün ve çıtır kabuğun sırrı sıcaklıkta.', typeLabel: 'Çikolata türü',
    steps: [
      { t: 'Erit', d: 'Çikolatayı yavaşça, tüm kristalleri eritecek kadar ısıt.' },
      { t: 'Soğut', d: 'Karıştırarak soğut: doğru kristaller oluşmaya başlar.' },
      { t: 'Temper', d: 'Hafifçe tekrar ısıt: parlak, çıtır ve düzgün kırılan çikolata.' },
      { t: 'Şekillendir', d: 'Kalıba dök ya da daldır; dolguyu ekle, kapat, serin yerde dinlendir.' }
    ],
    note: 'Sıcaklıklar yaklaşık ve genel değerlerdir; kullanılan çikolataya göre değişir.'
  },
  custom: {
    kicker: 'ÖZEL İSTEK', h2: 'Hayal et, o yapsın.',
    lead: 'Aklındaki çikolata fikrini yaz: isim, şekil, hediye, davet, doğum günü… Yapılabilir mi diye WhatsApp’ta birlikte bakarız.',
    ph: 'Örn: 30 kişilik nişan için kalpli çikolata, üstünde isimleri yazsın…',
    chips: ['İsim yazılı', 'Düğün / nişan', 'Doğum günü', 'Bayram hediyesi', 'Özel şekil', 'Kurumsal hediye'], add: 'Sepete ekle'
  },
  how: {
    kicker: 'NASIL SİPARİŞ VERİLİR', h2: 'Üç adımda.',
    steps: [
      { t: 'Seç', d: 'Parçanı tasarla ya da isteğini yaz, sepete ekle.' },
      { t: 'WhatsApp’a gönder', d: 'Siparişin hazır bir mesaj olarak WhatsApp’ta açılır. Sadece Gönder’e bas.' },
      { t: 'Birlikte netleştirelim', d: 'Fiyat, teslim tarihi ve detaylar WhatsApp’ta konuşulur. Hazırlık sipariş sonrası başlar.' }
    ],
    note: 'Her çikolata taze ve sipariş üzerine hazırlandığı için fiyat sabit değildir; hız, kalite ve özen her siparişte aynıdır. Kargo ücreti alıcıya aittir.'
  },
  gallery: { kicker: 'GERÇEK ÇİKOLATALAR', h2: 'Mutfaktan sofraya.', more: 'Instagram’da daha fazlası', images: [] },
  footer: { line: 'Evde hazırlanan butik çikolata', ig: 'Instagram', wa: 'WhatsApp', credit: 'Web: Muhammed Elhuseyin', rights: '© 2026 MH Chocolate' },
  cart: {
    title: 'Sepetim', empty: 'Henüz bir şey eklemedin.', emptySub: 'Atölyeden bir parça seç ya da isteğini yaz.',
    name: 'Adın', city: 'Şehir', when: 'Ne zaman lazım? (tarih)', note: 'Eklemek istediğin not',
    send: 'WhatsApp’ta gönder', sendHint: 'Fiyat ve ödeme yok: siparişini mesaj olarak gönderirsin, detayları orada netleştiririz.',
    remove: 'Kaldır', bar: 'Sepetim', items: (n) => (n === 1 ? '1 sipariş' : n + ' sipariş'), custom: 'Özel istek'
  },
  done: { t: 'Mesajın hazır 💛', d: 'WhatsApp açıldı mı? Mesajın hazır yazıldı, sadece Gönder’e bas.', ok: 'Gönderdim, sepeti temizle', again: 'WhatsApp’ı tekrar aç' },
  toast: { added: 'Sepete eklendi', loaded: 'Müşterinin tasarımı yüklendi' },
  wa: {
    hello: 'Merhaba! MH Chocolate sitesinden sipariş vermek istiyorum 🍫', orders: '🛍 Siparişim:',
    name: '👤 Ad', city: '📍 Şehir', when: '📅 Ne zaman lazım', note: '📝 Not',
    ask: 'Fiyat ve teslimat için bilgi alabilir miyim? 🙏', code: 'Sipariş kodu',
    qty: 'adet', shell: 'kabuk', fill: 'dolgu', crunch: 'çıtır', top: 'üstü', custom: 'Özel istek', design: '🔗 Tasarımı gör'
  }
};
