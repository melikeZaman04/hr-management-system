# HRCore Sistem Açıklaması ve Enterprise Anasayfa Metni

## Kısa Açıklama

HRCore, insan kaynakları süreçlerini tek bir web panelinde toplayan, rol bazlı erişim ve Supabase entegrasyonu ile çalışan bir yönetim sistemidir. Projede yalnızca görsel bir frontend tasarımı yapılmamıştır; çalışan kayıtları, izin talepleri, maaş kesintileri, cihaz zimmetleri ve çalışan dokümanları gerçek veri akışlarıyla yönetilebilecek şekilde kurgulanmıştır.

Sistem; admin/HR, manager ve employee rollerine göre farklı ekranlar ve işlem yetkileri sunar. Böylece her kullanıcı yalnızca kendi rolüne uygun verileri ve operasyonları görür. Frontend tarafındaki yönlendirme ve ekran korumaları kullanıcı deneyimini düzenlerken, gerçek veri güvenliği Supabase Auth, PostgreSQL, Storage ve Row Level Security kurallarıyla desteklenir.

## Bu Projede Yaptığımız İşlem

Bu çalışmada HR yönetimi için MVP seviyesinde çalışan bir web uygulaması oluşturuldu. Uygulama, klasik bir statik arayüzden farklı olarak Supabase backend altyapısına bağlanır ve verileri servis katmanı üzerinden yönetir.

Yapılan temel işlemler şunlardır:

- Supabase Auth ile giriş, çıkış ve oturum takibi kuruldu.
- Kullanıcı profiline göre admin/HR, manager ve employee rolleri tanımlandı.
- React Router ile korumalı sayfalar ve rol bazlı route erişimi oluşturuldu.
- Dashboard ekranında kullanıcının rolüne göre farklı metrikler gösterildi.
- Çalışan listeleme, çalışan oluşturma, detay görüntüleme ve durum yönetimi hazırlandı.
- İzin talebi oluşturma, filtreleme, onaylama ve reddetme akışları eklendi.
- Maaş kesintisi hesaplama ve kayıt tutma modülü geliştirildi.
- Cihaz envanteri, cihaz atama ve cihaz iade akışı oluşturuldu.
- Çalışan dokümanları için Supabase Storage üzerinden yükleme, indirme ve silme işlemleri bağlandı.
- CSV dışa aktarma ve canlı Supabase doğrulama scriptleri ile teslim kontrolü desteklendi.

## Frontendde Tasarım Dışında Kullanılanlar

Frontend yalnızca sayfa tasarımından oluşmaz. Bu projede arayüzün arkasında çalışan uygulama mantığı, veri erişimi, yetkilendirme ve modüler servis yapısı da geliştirilmiştir.

Kullanılan ana yapılar:

- React 19 ile bileşen tabanlı uygulama yapısı
- TypeScript ile tip güvenliği ve daha kontrollü veri modelleri
- Vite ile hızlı geliştirme ve production build süreci
- React Router ile sayfa yönlendirme, nested layout ve korumalı route yapısı
- Supabase JS Client ile Auth, PostgreSQL ve Storage bağlantısı
- AuthProvider ve context yapısı ile oturumun uygulama genelinde paylaşılması
- ProtectedRoute ile kullanıcı giriş durumu ve rol bazlı erişim kontrolü
- Feature bazlı servis dosyaları ile veri işlemlerinin sayfa kodundan ayrılması
- Reusable UI component yapısı ile Button, Panel, Badge, Modal, Tabs, StatCard gibi ortak bileşenlerin tekrar kullanılabilir hale getirilmesi
- CSV export helper ile maaş kayıtlarının dışa aktarılabilmesi
- ESLint ve TypeScript build süreci ile kod kalitesinin kontrol edilmesi

Bu yapı sayesinde frontend, sadece görsel bir katman değil; backend ile konuşan, rolü anlayan, veriyi işleyen ve modüllere ayrılmış bir operasyon ekranı haline gelmiştir.

## Sistemle Örtüşen Enterprise Anasayfa Açıklaması

HRCore, şirketlerin insan kaynakları operasyonlarını merkezi, güvenli ve ölçülebilir bir yapıya taşıması için geliştirilmiş web tabanlı bir yönetim panelidir. Çalışan bilgileri, izin süreçleri, maaş kesintileri, cihaz zimmetleri ve kurumsal dokümanlar tek panel üzerinden yönetilir.

Platform, farklı kullanıcı rollerine göre ayrışan bir deneyim sunar. Admin/HR kullanıcıları tüm çalışan ve operasyon kayıtlarını yönetebilir; yöneticiler ekiplerine ait süreçleri takip edebilir; çalışanlar ise kendi izin, cihaz ve doküman bilgilerine erişebilir. Bu yaklaşım, hem operasyonel verimliliği artırır hem de hassas insan kaynakları verilerinin kontrollü şekilde kullanılmasını sağlar.

HRCore'un teknik altyapısı React, TypeScript, Vite ve Supabase üzerine kuruludur. Supabase Auth oturum yönetimini, PostgreSQL ilişkisel veri modelini, Storage dosya yönetimini ve Row Level Security veri erişim güvenliğini sağlar. Frontend tarafında servis tabanlı mimari kullanıldığı için her modül kendi iş mantığıyla ayrılmıştır; bu da sistemin ileride yeni modüllerle büyütülmesini kolaylaştırır.

Bu proje, enterprise seviyede genişletilebilecek bir insan kaynakları platformunun temelini oluşturur. İlerleyen aşamalarda analitik paneller, organizasyon şeması, performans değerlendirme, gelişmiş bordro entegrasyonları, bildirim sistemi, denetim kayıtları ve self-servis çalışan portalı gibi özellikler aynı mimari üzerine eklenebilir.

## Gelecekte Enterprise Anasayfada Kullanılabilecek Bölümler

Bu açıklama ileride daha zengin bir anasayfaya dönüştürülürken aşağıdaki bölümlere ayrılabilir:

- Ana değer önerisi: İnsan kaynakları operasyonlarını tek güvenli panelde yönetin.
- Modül vitrini: Çalışanlar, izinler, maaş, cihazlar ve dokümanlar.
- Rol bazlı deneyim: Admin/HR, manager ve employee görünümleri.
- Güvenlik katmanı: Supabase Auth, RLS ve private storage yaklaşımı.
- Operasyonel görünürlük: Dashboard metrikleri ve süreç özetleri.
- Genişletilebilir mimari: Feature bazlı servisler ve modüler frontend yapısı.
- Enterprise yol haritası: Analitik, bildirim, denetim kayıtları ve entegrasyonlar.

## Anasayfa İçin Hazır Kısa Metin

HRCore, insan kaynakları operasyonlarını tek panelde birleştiren modern ve güvenli bir yönetim sistemidir. Çalışan kayıtları, izin talepleri, maaş kesintileri, cihaz zimmetleri ve doküman süreçleri rol bazlı erişimle yönetilir. React, TypeScript ve Supabase altyapısı sayesinde sistem yalnızca şık bir arayüz değil; gerçek veri akışlarıyla çalışan, güvenlik katmanı olan ve enterprise seviyede genişletilebilecek bir HR platformu temelidir.
