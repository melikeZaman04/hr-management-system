# Yapılacaklar ve Çözüm Durumu

## Tamamlananlar

- [x] Çalışan maaş hesaplamasında ücretsiz izin günleri manuel girilmez. Seçilen çalışan, ay ve yıl için onaylı `unpaid` izin talepleri veritabanından okunur.
- [x] Maaş hesabı, onaylı ücretsiz izin günlerine göre kesinti yapar ve hesaplanan maaşı buna göre günceller.
- [x] Mesai saati ve saatlik mesai ücreti maaş hesaplamasına eklenir. Mesai tutarı toplam maaşa ek ödeme olarak yansır.
- [x] Cihaz eklerken fatura no, fatura tarihi ve fatura tutarı girilebilir. Bu bilgiler cihaz notlarına düzenli biçimde kaydedilir.
- [x] Doküman yüklerken doküman türü seçimi yapılır. Çalışan ekranında da yükleme kategorisi görünür hale getirildi.
- [x] Cihaz listesine `Arızalı` ve `Tamir edildi` aksiyonları eklendi. Cihaz durumu envanterden güncellenebilir.

## Teknik Not

- Fatura bilgileri mevcut `devices.notes` alanında tutulur; bu nedenle ek veritabanı kolonu zorunlu değildir.
- Mesai alanları `salary_records` tablosunda varsa ayrıca kaydedilir. Tablo bu kolonları içermiyorsa uygulama geriye uyumlu biçimde eski şemaya kayıt atar; hesaplanan maaş yine mesai dahil toplam olarak saklanır.
