# HRCore - İnsan Kaynakları Yönetim Sistemi

HRCore; çalışan kayıtları, izin talepleri, maaş kesintileri, cihaz zimmetleri ve çalışan dokümanlarını tek panelden yönetmek için geliştirilen web tabanlı bir insan kaynakları uygulamasıdır.

Proje; React, TypeScript, Vite ve Supabase kullanılarak hazırlanmıştır. Kimlik doğrulama, veritabanı, dosya depolama ve Row Level Security katmanı Supabase üzerinde çalışır.

## Proje Durumu

Bu repository, MVP seviyesinde çalışan ve Supabase ile entegre edilmiş bir HR yönetim paneli içerir.

Tamamlanan ana parçalar:

- Supabase Auth ile giriş ve çıkış akışı
- Admin/HR, manager ve employee rolleri için profil tabanlı erişim
- Çalışan listeleme, oluşturma ve detay görüntüleme
- İzin talebi oluşturma, onaylama ve reddetme
- Maaş kesintisi kayıtları ve CSV dışa aktarma
- Cihaz envanteri, cihaz atama ve iade akışları
- Çalışan dokümanları için Supabase Storage yükleme, indirme ve silme
- Dashboard metrikleri ve modül bazlı özetler
- Canlı Supabase kontrol scriptleri
- React ve Backend/Supabase akademik raporları

## Teknoloji Stack

- React 19
- TypeScript
- Vite
- React Router
- Supabase JS Client
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Supabase Row Level Security
- ESLint

## Proje Mimarisi

```txt
src/
  app/                 Router ve uygulama giriş noktası
  components/          Ortak layout ve UI bileşenleri
  features/            Modül bazlı servis ve iş mantığı
  layouts/             Sayfa iskeletleri
  lib/                 Supabase client ve yardımcı fonksiyonlar
  pages/               Route bazlı ekranlar
  styles/              Global stil dosyaları
```

Veri akışı:

```txt
React sayfası -> feature service -> Supabase client -> Supabase API -> PostgreSQL / Storage
```

## Kurulum

Bağımlılıkları yükleyin:

```bash
npm install
```

Ortam dosyasını oluşturun:

```bash
cp .env.example .env.local
```

`.env.local` içine Supabase proje bilgilerini ekleyin:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Not: `.env.local` Git'e eklenmemelidir. Frontend tarafında yalnızca Supabase project URL ve anon public key kullanılmalıdır. Service role key, veritabanı şifresi veya özel anahtar commit edilmemelidir.

## Çalıştırma

Geliştirme sunucusu:

```bash
npm run dev
```

Lint kontrolü:

```bash
npm run lint
```

Production build:

```bash
npm run build
```

## Supabase Doğrulama Scriptleri

Canlı bağlantı ve RLS davranışlarını kontrol etmek için `scripts/` klasöründeki yardımcı scriptler kullanılabilir.

Örnekler:

```bash
node scripts/supabase-live-check.mjs
node scripts/supabase-auth-check.mjs admin_hr
node scripts/supabase-auth-check.mjs manager
node scripts/supabase-auth-check.mjs employee
node scripts/supabase-rls-boundary-check.mjs
```

Bu scriptlerin çalışması için `.env.local` içinde Supabase URL, anon key ve test kullanıcı bilgileri bulunmalıdır.

## Dokümantasyon

Teslim odaklı teknik raporlar:

- [React Akademik Raporu](docs/react-akademik-rapor.md)
- [Backend ve Supabase Akademik Raporu](docs/backend-supabase-akademik-rapor.md)
- [Dokümantasyon Özeti](docs/README.md)

## GitHub İş Akışı

Proje geliştirmesi küçük aşamalı branch ve pull request mantığıyla ilerletilmiştir.

Aktif teslim PR zinciri:

1. UI tasarım yenilemesi
2. Rol bazlı profil erişimi
3. MVP Supabase iş akışları
4. Teslim dokümantasyonu ve doğrulama scriptleri
5. GitHub vitrin ve CI düzenlemeleri

Her PR'da değişiklik özeti, kontrol notları ve yerel test bilgisi Türkçe olarak tutulur.

## Güvenlik Notları

- Supabase RLS kuralları backend güvenliğinin ana parçasıdır.
- Frontend route guard yalnızca kullanıcı deneyimini düzenler; gerçek yetki kontrolü Supabase tarafında yapılmalıdır.
- `.env.local`, service role key ve özel şifreler repository'ye eklenmemelidir.
- Demo/test kullanıcı bilgileri yalnızca yerel ortamda tutulmalıdır.
