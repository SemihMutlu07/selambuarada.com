# selambuarada.com — Blog Lansman Kontrol Listesi

Tarih: 2026-04-05
Durum: Tarama tamamlandı, sırayla ilerlenecek

---

## A. Hemen Yapılması Gereken (Kırık/Atıl Şeyler)

### A1. ~~Kullanılmayan font paketlerini kaldır~~ DONE
- [x] `@fontsource-variable/geist`, `@fontsource-variable/space-grotesk`, `@fontsource/doto` kaldırıldı

### A2. ~~`_headers` dosyası çalışmıyor~~ DONE
- [x] `_headers` kaldırıldı, `vercel.json` ile header'lar tanımlandı
- [x] YouTube embed CSP düzeltildi (`youtube.com` + `youtube-nocookie.com`)

### A3. ~~`public/admin/` (Decap CMS) çalışmıyor~~ DONE
- [x] Çalışmayan admin paneli kaldırıldı

### A4. ~~CSS renk değişkenleri tutarsız~~ DONE
- [x] `--c-text-faint` `#8C5A3C` → `#A8704E` olarak ayrıldı

---

## B. SEO İyileştirmeleri

### B1. ~~Eksik meta tag'ler~~ DONE
- [x] Canonical URL, og:url, og:type, absolute OG image eklendi (BaseLayout)
- [x] Blog yazıları `ogType="article"` ile işaretlendi

### B2. ~~RSS keşfedilebilirliği~~ DONE
- [x] `<link rel="alternate" type="application/rss+xml">` head'e eklendi

### B3. ~~Yapısal veri (JSON-LD)~~ DONE
- [x] Blog yazıları için `Article` schema eklendi
- Anasayfa WebSite schema — opsiyonel, ileride eklenebilir
- Google arama sonuçlarında zengin görünüm sağlar

---

## C. Teknik Temizlik

### C1. Vercel header'ları yapılandır
- [ ] `vercel.json` oluştur, security header'ları taşı
- [ ] Cache-Control: `/_astro/*` için immutable
- [ ] YouTube embed için doğru CSP frame-src

### C2. projects.json boş collection uyarısı
- [ ] Build'de "The collection 'projects' does not exist or is empty" uyarısı var
- Noscript fallback için var ama gerçek veri GitHub API'den geliyor
- Uyarıyı susturmak için noscript kısmını ve boş JSON'ı kaldırabiliriz

### C3. Typecheck ve lint script'leri eksik
- [ ] `package.json`'a `"typecheck": "astro check"` ekle
- [ ] ESLint veya Biome ekle (opsiyonel)
- `@astrojs/check` ve `typescript` zaten devDependencies'de var ama script yok

---

## D. Gelecek İçin (İçerik geldikçe)

- [ ] Etiket sistemi geri getirilebilir (10+ yazı olunca anlamlı)
- [ ] Fotoğraflar bölümü geri getirilebilir (içerik hazır olunca)
- [ ] Arama fonksiyonu (20+ yazı olunca)
- [ ] Dark mode (kullanıcı talebiyle)
- [ ] Analytics entegrasyonu (Vercel Analytics, Plausible, veya PostHog)
- [ ] Yorum sistemi (giscus, utterances vb.)
- [ ] Newsletter/e-posta listesi

---

## Tamamlanan

- [x] Fotoğraflar bölümünü kaldır (boş placeholder)
- [x] Etiket sayfalarını kaldır (3 yazıyla gereksiz)
- [x] Profil fotoğrafını kaldır (şimdilik)
- [x] Photosets collection'ı temizle
