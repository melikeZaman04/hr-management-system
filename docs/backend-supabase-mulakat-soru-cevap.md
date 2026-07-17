# Backend ve Supabase Mulakat Soru-Cevap Notlari

Bu dokuman, HRCore projesinde Supabase backend tarafinda neler yapildigini isveren/mulakat formatinda anlatmak icin hazirlanmistir.

## 1. Bu projede neden ayri bir Node.js/Express backend yerine Supabase kullandin?

**Cevap:**

Bu projede MVP seviyesinde ama gercek backend mantigina sahip bir insan kaynaklari uygulamasi gelistirmek istedim. Supabase bana PostgreSQL database, Authentication, Storage ve Row Level Security ozelliklerini hazir verdigi icin ayri bir Express backend kurmadan backend ihtiyacini karsilayabildim.

Burada amac sadece hizli gelistirmek degildi. Supabase sayesinde iliskisel veritabani, rol bazli yetkilendirme, dosya saklama ve canli veri guvenligi gibi production'a yakin konulari da uygulamis oldum.

## 2. Supabase'i sadece database olarak mi kullandin, yoksa backend platformu olarak mi?

**Cevap:**

Supabase'i sadece database olarak kullanmadim. Bu projede Supabase backend platformu gibi calisti.

Kullandigim ana parcalar sunlardi:

- Supabase Auth ile kullanici girisi ve session yonetimi
- PostgreSQL tablolar ile uygulama verilerinin saklanmasi
- Supabase Storage ile calisan dokumanlari ve cihaz faturalarinin saklanmasi
- Row Level Security ile rol bazli veri erisimi
- Supabase JS Client ile React uygulamasinin backend'e baglanmasi

Yani uygulamanin backend tarafindaki temel katmanlari Supabase uzerinden kuruldu.

## 3. `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` ne ise yariyor?

**Cevap:**

`VITE_SUPABASE_URL`, Supabase projesinin API adresidir. React uygulamasi hangi Supabase projesine baglanacagini bu URL ile bilir.

`VITE_SUPABASE_ANON_KEY` ise frontend tarafindan kullanilabilen public API key'dir. React uygulamasi bu key ile Supabase'e istek atar.

Projede bu degerler `.env.local` dosyasindan okunuyor ve `src/lib/supabaseClient.ts` icinde `createClient` ile Supabase client olusturuluyor.

## 4. Anon key frontend'de gorunuyorsa bu guvenlik acigi degil mi?

**Cevap:**

Tek basina guvenlik acigi degil. Supabase'te anon key zaten frontend'de kullanilmak uzere tasarlanmistir. Buradaki asil guvenlik anon key'de degil, Row Level Security policy'lerindedir.

Eger RLS dogru yazildiysa, kullanici anon key ile Supabase'e istek atsa bile sadece yetkili oldugu satirlara erisebilir. Bu yuzden frontend'de service role key kullanmadim, sadece anon key kullandim.

## 5. Service role key nedir? Neden frontend'e koymamak gerekir?

**Cevap:**

Service role key, Supabase tarafinda RLS kurallarini bypass edebilen cok yetkili bir anahtardir. Admin seviyesinde islem yapabilir.

Bu yuzden kesinlikle frontend'e konmamasi gerekir. Frontend kodu kullanicinin tarayicisinda calistigi icin bu key gorulebilir ve kotuye kullanilabilir. Service role key gerekiyorsa sadece server-side ortamda, ornegin Edge Function veya guvenli backend servisinde tutulmalidir.

## 6. Login akisi nasil calisiyor?

**Cevap:**

Kullanici email ve password girdiginde `supabase.auth.signInWithPassword()` fonksiyonu calisir. Supabase kullaniciyi dogrular ve basariliysa session olusturur.

Sonra uygulama aktif session'i takip eder. `AuthProvider` icinde `getSession()` ile mevcut oturum okunur, `onAuthStateChange()` ile login/logout degisimleri dinlenir.

Login sonrasi `auth.users.id` alinir ve bu id ile `profiles` tablosundan kullanicinin uygulama rolu cekilir.

## 7. Supabase Auth ile `profiles` tablosu arasindaki iliski nedir?

**Cevap:**

Supabase Auth kullanicinin kimlik dogrulama tarafini yonetir. Ama uygulama icindeki rol bilgisi, tam ad ve aktiflik durumu `profiles` tablosunda tutulur.

Projede temel iliski su sekildedir:

```txt
auth.users.id = profiles.id
```

Yani Auth tarafindaki kullanici id'si ile `profiles` tablosundaki id aynidir. Bu sayede login olan kullanicinin profil ve rol bilgisi kolayca bulunur.

## 8. Neden kullanici rolunu direkt Supabase Auth icinde degil de `profiles` tablosunda tuttun?

**Cevap:**

Supabase Auth temel olarak authentication icindir. Uygulama seviyesindeki rol, aktiflik durumu ve profil bilgilerini ayri bir tabloda tutmak daha esnek ve yonetilebilir bir yaklasimdir.

Bu sayede `admin_hr`, `manager`, `employee` gibi rolleri `profiles` tablosunda yonettim. Ileride rol degistirme, kullaniciyi pasife alma veya profil bilgisi guncelleme gibi islemler daha rahat yapilabilir.

## 9. `auth.users.id`, `profiles.id` ve `employees.profile_id` arasindaki iliski nedir?

**Cevap:**

Bu projede kullanici ile calisan kaydi arasinda zincirli bir iliski kuruldu:

```txt
auth.users.id = profiles.id = employees.profile_id
```

`auth.users.id`, Supabase Auth kullanicisidir. `profiles.id`, bu kullanicinin uygulama profilidir. `employees.profile_id` ise bu profilin hangi calisan kaydina bagli oldugunu gosterir.

Bu iliski sayesinde employee rolundeki kullanicinin kendi calisan kaydini, izinlerini, cihazlarini ve dokumanlarini bulabiliyoruz.

## 10. Projede hangi roller var?

**Cevap:**

Projede uc temel rol var:

- `admin_hr`: Tum calisanlari, izinleri, maas kayitlarini, cihazlari ve dokumanlari yonetebilir.
- `manager`: Kendi ekibindeki calisanlari ve ilgili is sureclerini gorebilir.
- `employee`: Sadece kendi profilini, izinlerini, cihazlarini ve dokumanlarini gorebilir.

Bu roller frontend'de ekran erisimi icin, backend tarafinda ise RLS policy'leri icin kullanildi.

## 11. `ProtectedRoute` ne ise yariyor?

**Cevap:**

`ProtectedRoute`, React Router tarafinda sayfa erisimini kontrol eden frontend katmanidir. Kullanici login degilse login sayfasina yonlendirir. Login ise rolune bakar ve ilgili sayfaya erisip erisemeyecegini kontrol eder.

Ornegin sadece `admin_hr` rolunun girebilecegi bir sayfaya employee rolundeki kullanici girmeye calisirsa frontend bunu engeller.

## 12. `ProtectedRoute` gercek guvenlik saglar mi?

**Cevap:**

Hayir, tek basina gercek guvenlik sayilmaz. `ProtectedRoute` kullanici deneyimini duzenler. Yani kullanicinin gormemesi gereken ekranlari frontend'de gizler.

Gercek veri guvenligi Supabase RLS policy'leri ile saglanir. Cunku frontend manipule edilebilir ama Supabase tarafindaki RLS kurallari backend seviyesinde uygulanir.

## 13. Kullanici route guard'i bypass ederse veriye erisebilir mi?

**Cevap:**

RLS dogru yazildiysa erisemez. Kullanici tarayicida route'u degistirse veya manuel API istegi atsa bile Supabase her sorguda kullanicinin `auth.uid()` degerine gore izin kontrolu yapar.

Bu yuzden projede frontend role check ile yetinmedim, backend tarafinda RLS kullandim.

## 14. RLS nedir?

**Cevap:**

RLS, Row Level Security demektir. PostgreSQL'in satir bazli guvenlik sistemidir. Supabase bunu dogrudan kullanir.

RLS sayesinde her tablo satiri icin su sorular cevaplanir:

- Bu kullanici bu satiri gorebilir mi?
- Bu kullanici bu satiri ekleyebilir mi?
- Bu kullanici bu satiri guncelleyebilir mi?
- Bu kullanici bu satiri silebilir mi?

Bu projede employee'nin sadece kendi verisini, manager'in sadece kendi ekibini, admin/hr'nin ise tum verileri gormesi icin RLS mantigi kullanildi.

## 15. RLS ile frontend role check arasindaki fark nedir?

**Cevap:**

Frontend role check kullanici arayuzunu duzenler. Hangi menunun gorunecegi, hangi sayfaya girilecegi gibi konulari kontrol eder.

RLS ise backend seviyesinde veri erisimini kontrol eder. Kullanici frontend'i manipule etse bile RLS policy izin vermiyorsa veriyi okuyamaz.

Kisa ifade ile:

```txt
ProtectedRoute = UI/UX korumasi
RLS = gercek veri guvenligi
```

## 16. Employee rolundeki kullanici baska calisanin verisini neden goremiyor?

**Cevap:**

Cunku RLS policy kullanicinin `auth.uid()` degerini calisan kaydindaki `profile_id` ile karsilastiriyor. Employee sadece kendi `profile_id` degeriyle eslesen satirlara erisebiliyor.

Mantik olarak:

```txt
employees.profile_id = auth.uid()
```

Bu eslesme yoksa Supabase ilgili satiri kullaniciya dondurmuyor.

## 17. Manager sadece kendi ekibini nasil gorebiliyor?

**Cevap:**

`employees` tablosunda `manager_id` alani var. Bir calisanin hangi manager'a bagli oldugu bu alanla tutuluyor.

Manager login oldugunda once kendi employee kaydi bulunuyor. Sonra RLS policy, manager'in sadece `manager_id` alani kendi employee id'sine esit olan calisanlara erismesine izin veriyor.

## 18. Admin/HR erisim mantigi nasil?

**Cevap:**

Admin/HR rolu insan kaynaklari yetkilisi gibi dusunuldu. Bu rol calisan kayitlari, izin talepleri, maas kayitlari, cihazlar ve dokumanlar uzerinde daha genis yetkiye sahip.

RLS tarafinda `profiles.role = 'admin_hr'` olan kullanicilar icin tum satirlara erisim saglanacak sekilde policy mantigi kuruldu.

## 19. `employees` tablosunda hangi bilgileri tuttun?

**Cevap:**

`employees` tablosunda calisanin temel IK bilgileri tutuldu:

- Ad soyad
- Email
- Telefon
- Departman
- Pozisyon
- Ise baslama tarihi
- Calisma durumu
- Temel maas
- Profile baglantisi
- Manager baglantisi

Bu tablo uygulamanin merkezindeki ana is verisini temsil ediyor.

## 20. `manager_id` alani neden onemli?

**Cevap:**

`manager_id`, calisanin hangi manager'a bagli oldugunu gostermek icin kullanildi. Bu alan sayesinde ekip yapisi kuruluyor.

Manager rolundeki kullanici sadece kendi ekibindeki calisanlari gormeli. Bu siniri kurmak icin `manager_id` kritik bir alan.

## 21. Neden `devices` ve `device_assignments` diye iki ayri tablo kullandin?

**Cevap:**

Cunku cihaz bilgisi ile zimmet gecmisi farkli seylerdir.

`devices` tablosu cihaz envanterini tutar. Ornegin laptop, telefon, marka, model, seri numarasi ve durum bilgisi burada durur.

`device_assignments` ise cihaz kime, ne zaman atanmis, aktif mi, iade edilmis mi gibi zimmet bilgilerini tutar.

Bu ayrim sayesinde bir cihazin gecmis atamalarini kaybetmeden takip edebiliriz.

## 22. Bir cihaz calisana atandiginda backend tarafinda ne oluyor?

**Cevap:**

Cihaz atama akisinda iki islem var:

1. `device_assignments` tablosuna yeni bir aktif atama kaydi eklenir.
2. `devices` tablosundaki cihaz durumu `assigned` olarak guncellenir.

Bu sayede hem cihaz kime atanmis bilgisi tutulur hem de cihaz envanterinde cihaz artik musait gorunmez.

## 23. Cihaz iade edildiginde ne oluyor?

**Cevap:**

Cihaz iade edildiginde aktif assignment kaydi `returned` durumuna cekilir ve `returned_at` tarihi yazilir. Ardindan `devices` tablosundaki cihaz durumu tekrar `available` yapilir.

Bu sekilde cihaz yeniden atanabilir hale gelir ama eski zimmet kaydi da gecmis olarak korunur.

## 24. Izin talebi olusturma akisi nasil?

**Cevap:**

Employee izin talebi olusturdugunda `leave_requests` tablosuna yeni bir kayit eklenir. Bu kayitta calisan id'si, izin tipi, baslangic tarihi, bitis tarihi, toplam gun sayisi, aciklama ve durum bilgisi tutulur.

Yeni olusturulan talepler varsayilan olarak `pending` durumunda kaydedilir.

## 25. Izin onaylaninca `reviewed_by` ve `reviewed_at` neden guncelleniyor?

**Cevap:**

Cunku izin talebini kimin ve ne zaman degerlendirdigini takip etmek gerekiyor. Bu hem is sureci hem de audit/log mantigi acisindan onemli.

Onay veya red sirasinda aktif kullanici `supabase.auth.getUser()` ile alinir. Bu kullanicinin id'si `reviewed_by` alanina, islem zamani ise `reviewed_at` alanina yazilir.

## 26. Maas kayitlarini neden `salary_records` tablosunda tuttun?

**Cevap:**

Maas hesaplamalari donemsel kayitlardir. Her calisan icin ay ve yil bazinda maas, ucretsiz izin gunu, kesinti tutari ve hesaplanan net tutar saklanmalidir.

Bu yuzden `salary_records` tablosu kullanildi. Boylece gecmis maas hesaplamalari korunur ve raporlama/CSV export gibi islemler yapilabilir.

## 27. Maas hesaplama frontend'de mi backend'de mi yapiliyor? Production'da nasil gelistirirdin?

**Cevap:**

Bu MVP'de maas hesaplama frontend servis katmaninda yapiliyor ve sonuc Supabase'e kaydediliyor. Hesaplama basit oldugu icin bu MVP icin yeterliydi.

Ama production ortaminda maas gibi kritik bir hesaplamayi server-side yapmak daha dogru olurdu. Bunu Supabase Edge Function veya ayri bir backend endpoint'e tasirdim. Boylece kullanici frontend'i manipule etse bile nihai hesaplama guvenli ortamda yapilmis olurdu.

## 28. Dokuman upload akisni adim adim anlatir misin?

**Cevap:**

Dokuman upload akisi su sekilde calisiyor:

1. Kullanici dosya secer.
2. Dosya adi guvenli hale getirilir.
3. Storage path olusturulur.
4. Dosya Supabase Storage'a yuklenir.
5. Upload basarili olursa `documents` tablosuna metadata kaydi eklenir.
6. Liste yenilenir ve kullanici dokumani gorebilir.

Storage path formati:

```txt
employees/{employee_id}/{document_type}/{timestamp}_{safe_file_name}
```

## 29. Dosyayi Storage'a koyup neden ayrica `documents` tablosuna metadata yazdin?

**Cevap:**

Cunku Storage sadece gercek dosyayi tutar. Uygulama acisindan dosyanin hangi calisana ait oldugu, dokuman tipi, dosya adi, kim tarafindan yuklendigi ve bucket/path bilgisi gibi metadata gerekir.

Bu yuzden:

```txt
Storage = gercek dosya
documents tablosu = dosyanin uygulama kaydi
```

Bu ayrim filtreleme, listeleme, yetkilendirme ve signed URL uretme icin gerekli.

## 30. Storage bucket nedir? Bu projede hangi bucket'lari kullandin?

**Cevap:**

Storage bucket, dosyalarin saklandigi klasor benzeri alandir. Supabase Storage icinde farkli dosya gruplarini ayirmak icin bucket kullanilir.

Projede iki ana bucket kullandik:

- `employee-documents`: Calisan dokumanlari
- `device-invoices`: Cihaz faturalari

## 31. Storage path formatini neden bu sekilde sectin?

**Cevap:**

Path formatini calisan, dokuman tipi ve dosya adina gore organize ettim:

```txt
employees/{employee_id}/{document_type}/{timestamp}_{safe_file_name}
```

Bu yapi sayesinde dosyalar calisan bazli ayrilir. Dokuman tipi klasor gibi davranir. Timestamp ise ayni isimli dosyalarin cakismasini onler.

## 32. Signed URL nedir? Neden public URL kullanmadin?

**Cevap:**

Signed URL, private dosyaya gecici erisim saglayan imzali linktir. Projede dosya indirmek icin `createSignedUrl()` kullandim ve linki kisa sureli urettim.

Public URL kullansaydim dosyalar kalici olarak herkese acik hale gelebilirdi. IK dokumanlari hassas veri oldugu icin private storage ve signed URL daha guvenli bir yaklasimdir.

## 33. Private dosya erisimini nasil kontrol ettin?

**Cevap:**

Dosyalar private bucket mantiginda tutuldu. Kullanici dosya indirmek istediginde once `documents` tablosundaki metadata kaydina erisebiliyor mu diye RLS belirleyici olur.

Eger kullanici yetkiliyse uygulama ilgili bucket ve path icin signed URL uretir. Yetkisiz kullanici metadata satirini goremedigi icin dosya path bilgisine ve signed URL akisina ulasamaz.

## 34. Dokuman silme akisi nasil calisiyor?

**Cevap:**

Projede once `documents` tablosundaki metadata kaydi siliniyor. Silme isleminden sonra gercekten satir silinmis mi diye `select('id')` ile kontrol ediliyor.

Eger metadata silindiyse sonra Supabase Storage tarafindaki dosya siliniyor. Storage tarafinda dosya zaten yoksa bu kritik hata olarak ele alinmiyor.

Bu yaklasimda kullanicinin silme yetkisi olup olmadigini RLS uzerinden once database tarafinda dogrulamis oluyoruz.

## 35. Upload sirasinda Storage basarili ama database insert basarisiz olursa ne yapiyorsun?

**Cevap:**

Bu durumda rollback mantigi uyguladim. Once dosya Storage'a yukleniyor. Sonra `documents` tablosuna metadata insert ediliyor.

Eger metadata insert basarisiz olursa, Storage'a yuklenmis dosya siliniyor. Boylece bucket icinde uygulamada karsiligi olmayan orphan dosya kalmasi engelleniyor.

## 36. RLS policy eksikligi yuzunden yasadigin bir problemi anlatir misin?

**Cevap:**

Dokuman silme ozelliginde employee kullanicisinin kendi dokumanini silmesi gerekiyordu. Ancak testte Storage dosyasi silinebilse bile `documents` tablosundaki metadata satiri silinmiyordu.

Script ciktisinda `cleanup_document=ERR no_rows_deleted` hatasini gorduk. Bu, sorgunun hata vermedigini ama RLS yuzunden hicbir satirin silinmedigini gosterdi.

Sorunun nedeni `public.documents` tablosunda employee icin DELETE policy eksikligiydi.

## 37. `cleanup_document=ERR no_rows_deleted` sana ne anlatti?

**Cevap:**

Bu sonuc bana DELETE sorgusunun calistigini ama RLS policy izin vermedigi icin herhangi bir satirin silinmedigini anlatti.

Yani problem frontend state problemi degildi. Backend tarafinda documents tablosu icin employee DELETE policy eksikti.

## 38. Bu problem nasil cozulmeli?

**Cevap:**

`documents` tablosuna employee'nin kendi dokumanini silebilmesini saglayan bir DELETE policy eklenmeli.

Ornek policy:

```sql
create policy "employees can delete own documents"
on public.documents
for delete
to authenticated
using (
  uploaded_by = auth.uid()
  or exists (
    select 1
    from public.employees e
    where e.id = documents.employee_id
      and e.profile_id = auth.uid()
  )
);
```

Bu policy ile kullanici kendi yukledigi veya kendi employee kaydina bagli dokumani silebilir.

## 39. Canli Supabase baglantisini nasil test ettin?

**Cevap:**

`scripts/` klasorunde canli kontrol scriptleri yazildi. Bu scriptler `.env.local` icindeki Supabase URL, anon key ve test kullanici bilgileriyle gercek Supabase projesine baglaniyor.

Ornek:

```bash
node scripts/supabase-live-check.mjs
node scripts/supabase-auth-check.mjs employee
```

Bu sekilde sadece uygulama ekranindan degil, dogrudan Supabase API uzerinden de baglanti ve yetki davranisi test edildi.

## 40. RLS sinirlarini nasil dogruladin?

**Cevap:**

`supabase-rls-boundary-check.mjs` scriptiyle admin, manager ve employee kullanicilariyla ayri ayri login olduk.

Sonra su senaryolari test ettik:

- Employee kendi kaydini okuyabiliyor mu?
- Employee baska calisani okuyamiyor mu?
- Manager kendi ekip uyesini okuyabiliyor mu?
- Manager takim disi calisani okuyamiyor mu?
- Admin tum calisan envanterini gorebiliyor mu?

Bu testler RLS sinirlarinin gercek ortamda calistigini gosterdi.

## 41. Supabase scriptlerini neden yazdin? Manuel test yeterli degil miydi?

**Cevap:**

Manuel test UI davranisini gormek icin faydali ama RLS gibi backend guvenlik konularinda yeterli degil. Cunku UI bazen veriyi gizleyebilir ama backend hala acik olabilir.

Scriptlerle dogrudan Supabase API uzerinden farkli rollerle sorgu attim. Bu bana RLS policy'lerinin gercekten dogru calisip calismadigini gosterdi.

## 42. Supabase schema degisikliklerini nereden yonettin?

**Cevap:**

Bu projede schema degisiklikleri Supabase Dashboard uzerinden yonetildi. Tablolar, policy'ler ve storage ayarlari dashboard/SQL Editor uzerinden kontrol edildi.

Repository icinde local migration sistemi yok. Bu MVP icin kabul edilebilir ama production ortaminda migration dosyalariyla ilerlemek daha dogru olur.

## 43. Bu projede migration sistemi var mi? Production icin nasil iyilestirirdin?

**Cevap:**

Bu projede local migration sistemi yok. Schema degisiklikleri Supabase Dashboard uzerinden yapildi.

Production icin Supabase CLI migration yapisi kurardim. Boylece tablo, policy ve index degisiklikleri kod gibi versiyonlanir, ekip icinde takip edilir ve CI/CD surecine dahil edilebilir.

## 44. Supabase kullanmanin avantajlari neydi?

**Cevap:**

Supabase'in en buyuk avantaji MVP gelistirme hizini artirmasi ama ayni zamanda gercek backend kavramlarini desteklemesiydi.

Avantajlari:

- Hazir Auth sistemi
- PostgreSQL gibi guclu iliskisel database
- RLS ile satir bazli guvenlik
- Storage ile dosya yonetimi
- React ile kolay entegrasyon
- Canli API ve dashboard uzerinden hizli kontrol

## 45. Supabase kullanmanin dikkat edilmesi gereken yanlari neler?

**Cevap:**

Supabase kullanirken en dikkat edilmesi gereken konu RLS policy'leridir. Public schema API'ye acik oldugu icin RLS kapali veya yanlis yazilmissa veri guvenligi riske girebilir.

Ayrica service role key kesinlikle frontend'e konmamalidir. Schema degisiklikleri de production'da dashboard uzerinden manuel degil, migration ile yonetilmelidir.

## 46. Bu backend yapisinda en kritik guvenlik noktasi nedir?

**Cevap:**

En kritik nokta RLS policy'lerinin dogru yazilmasidir. Cunku frontend tarafindaki buton, menu veya route kontrolleri asil guvenlik degildir.

Kullanici hangi istegi atarsa atsin Supabase tarafinda satir bazli yetki kontrolu dogru calismalidir. Bu yuzden RLS'i hem tasarladik hem de scriptlerle test ettik.

## 47. Production'a cikacak olsan backend tarafinda ilk neyi guclendirirdin?

**Cevap:**

Ilk olarak migration sistemini kurardim. Supabase CLI ile tablo, policy ve storage degisikliklerini versiyonlardim.

Sonra kritik is mantiklarini Edge Function veya server-side backend'e tasirdim. Ozellikle maas hesaplama, toplu veri islemleri, admin seviyesindeki operasyonlar ve audit log gibi konulari frontend'den uzaklastirirdim.

## 48. Edge Function kullanir miydin? Hangi islemleri tasirdin?

**Cevap:**

Evet, production ortaminda kullanirdim.

Edge Function'a tasiyabilecegim islemler:

- Maas hesaplama
- Kritik admin operasyonlari
- Toplu import/export islemleri
- Dosya isleme veya virus tarama gibi storage sonrasi islemler
- Audit log yazma
- Service role key gerektiren guvenli islemler

Boylece hassas is mantigi kullanicinin tarayicisinda degil, guvenli server-side ortamda calisir.

## 49. Bu projede backend tarafinda en cok ne ogrendin?

**Cevap:**

Bu projede backend'in sadece veri kaydetmek olmadigini daha iyi gordum. Auth, rol modeli, tablo iliskileri, RLS, storage metadata iliskisi ve canli test sureci birlikte dusunulmeli.

Ozellikle RLS policy eksikligini testle yakalamak benim icin onemliydi. Cunku frontend'de her sey dogru gorunse bile backend policy eksikse veri davranisi hatali olabiliyor.

## 50. Bu projeyi tek cumleyle backend acisindan nasil ozetlersin?

**Cevap:**

Bu projede Supabase'i backend platformu olarak kullanarak Auth, PostgreSQL, Storage, RLS ve rol bazli erisim katmanlarini kurdum; React tarafinda ise veri erisimini moduller bazinda service dosyalarina ayirarak daha okunabilir ve surdurulebilir bir yapi olusturdum.

