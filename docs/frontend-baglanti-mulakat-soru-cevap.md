# Frontend Baglanti ve React Mulakat Soru-Cevap Notlari

Bu dokuman, HRCore projesinde frontend tarafinin Supabase backend ile nasil baglandigini, React mimarisinin nasil kuruldugunu ve isveren tarafindan sorulabilecek teknik sorulara verilecek cevaplari icermektedir.

## 1. Bu projede frontend tarafinda hangi teknolojileri kullandin?

**Cevap:**

Frontend tarafinda React, TypeScript, Vite ve React Router kullandim. React ile component tabanli arayuz gelistirdim. TypeScript ile veri tiplerini daha kontrollu hale getirdim. Vite sayesinde gelistirme ortami hizli calisti. React Router ile login, dashboard ve modul sayfalari arasindaki route yapisini kurdum.

Backend baglantisi icin Supabase JS Client kullandim.

## 2. React uygulamasi Supabase'e nasil baglaniyor?

**Cevap:**

Supabase baglantisi `src/lib/supabaseClient.ts` dosyasinda merkezi olarak kuruldu. `.env.local` icindeki `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` degerleri okunuyor, sonra `createClient()` ile Supabase client olusturuluyor.

Bu client daha sonra auth, employee, documents, devices, leave ve salary service dosyalarinda kullaniliyor.

Akis su sekilde:

```txt
React component
-> feature service
-> supabase client
-> Supabase API
-> PostgreSQL / Auth / Storage
```

## 3. Supabase sorgularini neden direkt componentlerin icinde yazmadin?

**Cevap:**

Componentlerin icine direkt Supabase sorgusu yazsaydim UI kodu ile veri erisim kodu birbirine karisirdi. Bu da projeyi buyudukce bakimi zor bir hale getirirdi.

Bu yuzden her is modulu icin ayri service dosyalari olusturdum. Ornegin:

```txt
EmployeesPage -> employeeService -> employees tablosu
DocumentsPage -> documentService -> Storage + documents tablosu
DevicesPage -> deviceService -> devices + device_assignments tablolari
```

Boylece sayfalar sadece ekrani ve kullanici etkilesimini yonetiyor. Veri cekme, insert, update, delete ve hata yakalama gibi islemler service katmaninda duruyor.

## 4. Bu service katmani frontend mimarisi acisindan ne kazandiriyor?

**Cevap:**

Service katmani UI ile veri erisimini ayiriyor. Bu sayede:

- Component kodlari daha temiz kaliyor.
- Supabase sorgulari tek yerde toplanmis oluyor.
- Ayni veri fonksiyonu farkli sayfalarda tekrar kullanilabiliyor.
- Hata yonetimi daha duzenli oluyor.
- Ileride Supabase yerine farkli backend gelirse sayfalari komple degistirmek yerine service katmani guncellenebilir.

## 5. Projede klasor yapisini nasil organize ettin?

**Cevap:**

Projede moduler bir yapi kullandim:

```txt
src/app        -> uygulama girisi ve router
src/pages      -> route seviyesindeki sayfalar
src/features   -> is modullerinin service ve logic dosyalari
src/components -> ortak UI ve layout componentleri
src/layouts    -> uygulama iskeleti
src/lib        -> supabaseClient ve yardimci fonksiyonlar
src/styles     -> global stiller
```

Bu yapi sayesinde her modulun sorumlulugu daha net oldu.

## 6. `pages` ve `features` klasorleri arasindaki fark nedir?

**Cevap:**

`pages` klasoru kullanicinin route olarak gordugu ekranlari tutar. Ornegin `EmployeesPage`, `DocumentsPage`, `DashboardPage`.

`features` klasoru ise bu sayfalarin kullandigi is mantigini ve Supabase servislerini tutar. Ornegin `employeeService`, `documentService`, `leaveRequestService`.

Yani:

```txt
pages = ekrani gosterir
features = veri ve is mantigini yonetir
```

## 7. Auth state frontend'de nasil yonetiliyor?

**Cevap:**

Auth state `AuthProvider` icinde yonetiliyor. Uygulama acildiginda `supabase.auth.getSession()` ile mevcut oturum kontrol ediliyor. Login veya logout oldugunda `supabase.auth.onAuthStateChange()` ile degisimler dinleniyor.

Session bilgisi, user bilgisi, profile bilgisi ve login/logout fonksiyonlari React Context ile uygulamaya saglaniyor. Componentler bu bilgilere `useAuth()` hook'u ile erisiyor.

## 8. Neden auth icin React Context kullandin?

**Cevap:**

Auth bilgisi uygulamanin bircok yerinde gerekli. Header, Sidebar, ProtectedRoute ve sayfalar kullanicinin login durumunu veya rolunu bilmek zorunda.

Bu bilgiyi prop olarak her yere tasimak yerine React Context kullandim. Boylece merkezi bir auth state olustu ve ihtiyac duyan componentler `useAuth()` ile bu state'e erisebildi.

## 9. Kullanici login olduktan sonra frontend'de ne oluyor?

**Cevap:**

Login formu email ve password'u `signIn()` fonksiyonuna gonderiyor. Bu fonksiyon Supabase Auth'a `signInWithPassword()` ile istek atiyor.

Basarili login sonrasi Supabase session olusturuyor. `AuthProvider` session degisimini yakaliyor, sonra current profile bilgisini `profiles` tablosundan cekiyor. Bu profile icindeki role bilgisi frontend'de route ve menu davranislarini belirliyor.

## 10. Frontend kullanicinin rolunu nasil biliyor?

**Cevap:**

Frontend direkt Supabase Auth metadata'sina guvenmiyor. Login olan kullanicinin `auth.users.id` degeri ile `profiles` tablosundan profil kaydi cekiliyor.

Bu profile kaydinda `role` alani var:

```txt
admin_hr
manager
employee
```

Frontend bu role bilgisini ekran erisimi ve menu davranislari icin kullaniyor.

## 11. `ProtectedRoute` frontend tarafinda nasil calisiyor?

**Cevap:**

`ProtectedRoute`, route seviyesinde kullanicinin login olup olmadigini ve rolunun o sayfaya uygun olup olmadigini kontrol ediyor.

Kullanici login degilse login sayfasina yonlendiriliyor. Login ise ama rolu izin verilen roller arasinda degilse erisim yok mesaji gosteriliyor.

Ornegin admin sayfasina sadece `admin_hr` girebilir. Employee rolundeki kullanici bu route'a girerse frontend bunu engeller.

## 12. ProtectedRoute guvenlik icin yeterli mi?

**Cevap:**

Hayir. ProtectedRoute frontend tarafinda kullanici deneyimini duzenler ama tek basina guvenlik saglamaz.

Gercek guvenlik Supabase RLS tarafinda saglanir. Frontend route guard bypass edilse bile Supabase policy izin vermiyorsa kullanici veriye erisemez.

Bu ayrim onemli:

```txt
ProtectedRoute = ekran korumasi
Supabase RLS = veri korumasi
```

## 13. Login sayfasinda hata ve loading durumlarini nasil yonettin?

**Cevap:**

Login islemi async oldugu icin kullanici formu gonderdiginde loading state kullaniliyor. Supabase hata donerse hata mesaji kullaniciya gosteriliyor.

Boylece kullanici yanlis sifre, eksik Supabase config veya baglanti problemi gibi durumlarda sessiz bir hata yerine anlasilir geri bildirim aliyor.

## 14. Frontend'de TypeScript kullanmanin faydasi ne oldu?

**Cevap:**

TypeScript sayesinde Supabase'ten gelen verilerin uygulama icinde hangi alanlara sahip oldugunu daha net tanimladim.

Ornegin `EmployeeListItem`, `Document`, `LeaveRequest`, `SalaryRecord` gibi type'lar olusturuldu. Bu sayede componentlerde yanlis alan kullanma, status degerlerini karistirma veya eksik property hatalari daha erken yakalaniyor.

## 15. Supabase tablolarini frontend'de nasil temsil ettin?

**Cevap:**

Her service dosyasinda ilgili tabloya karsilik gelen TypeScript type'lari tanimladim.

Ornek:

```txt
employees tablosu -> EmployeeListItem / EmployeeDetail
documents tablosu -> Document
leave_requests tablosu -> LeaveRequest
devices tablosu -> Device
salary_records tablosu -> SalaryRecord
```

Bu type'lar frontend ile backend verisi arasinda sozlesme gibi calisiyor.

## 16. EmployeesPage veriyi nasil aliyor?

**Cevap:**

`EmployeesPage` direkt Supabase sorgusu yazmiyor. Sayfa, `employeeService.getEmployees()` fonksiyonunu cagiriyor.

Bu fonksiyon Supabase `employees` tablosuna sorgu atiyor, gerekli alanlari seciyor ve isim sirasina gore listeyi donduruyor.

Yani:

```txt
EmployeesPage
-> getEmployees()
-> supabase.from('employees').select(...)
-> UI'da tablo olarak goster
```

## 17. DocumentsPage Supabase Storage ile nasil calisiyor?

**Cevap:**

`DocumentsPage`, dosya islemleri icin `documentService` fonksiyonlarini kullaniyor.

Upload sirasinda:

```txt
file secilir
-> uploadEmployeeDocument() cagrilir
-> dosya Storage'a yuklenir
-> documents tablosuna metadata insert edilir
-> liste yenilenir
```

Download sirasinda:

```txt
documents kaydindan bucket/path alinir
-> getSignedUrl() cagrilir
-> Supabase gecici signed URL uretir
-> kullanici dosyayi indirir
```

## 18. Dosya yukleme sirasinda frontend hangi kontrolleri yapiyor?

**Cevap:**

Frontend dosya secimi, dokuman tipi ve ilgili calisan secimi gibi kullanici girdilerini kontrol eder. Dosya adi service tarafinda guvenli hale getirilir. Sonra Supabase Storage'a upload edilir.

Asil yetki kontrolu ise yine Supabase RLS ve Storage policy tarafindadir.

## 19. Download icin neden direkt storage path kullanilmiyor?

**Cevap:**

Cunku storage path tek basina public erisim linki degildir. Dosyalar hassas oldugu icin private tutulur.

Download icin `getSignedUrl()` kullaniliyor. Bu fonksiyon kisa sureli, imzali bir URL uretir. Boylece dosya herkese acik kalmadan kullaniciya gecici indirme erisimi saglanir.

## 20. Frontend'de silme islemleri nasil yonetiliyor?

**Cevap:**

Silme islemi ilgili service fonksiyonu uzerinden yapiliyor. Ornegin dokuman silmede `deleteDocument()` cagriliyor.

Bu fonksiyon once `documents` tablosundan metadata kaydini silmeye calisiyor. Gercekten satir silindiyse sonra Storage dosyasini siliyor.

Frontend ise bu islemin sonucuna gore listeyi yeniliyor veya hata mesaji gosteriyor.

## 21. Hata yonetimini frontend'de nasil ele aldiniz?

**Cevap:**

Service fonksiyonlari Supabase'ten error donerse `throw new Error(error.message)` ile hatayi yukariya tasiyor.

Sayfa componentleri bu hatalari yakalayip kullaniciya hata state'i olarak gosteriyor. Boylece verinin yuklenemedigi, kaydedilemedigi veya silinemedigi durumlar kullanici tarafinda anlasilir hale geliyor.

## 22. Loading state neden onemli?

**Cevap:**

Supabase istekleri async calistigi icin veri gelene kadar kullaniciya bos veya hatali ekran gostermek yerine loading state gosteriliyor.

Projede tablolar yuklenirken skeleton row veya state box kullanildi. Bu kullanici deneyimini daha profesyonel hale getiriyor.

## 23. Dashboard verileri nasil geliyor?

**Cevap:**

Dashboard farkli servislerden ozet sayilar aliyor. Ornegin aktif calisan sayisi, bekleyen izin sayisi, cihaz sayisi ve dokuman sayisi gibi metrikler ilgili service fonksiyonlariyla Supabase'ten cekiliyor.

Bu sayede Dashboard tek bir tabloya bagli degil, farkli modullerden ozet veri alan bir giris ekrani gibi calisiyor.

## 24. React Router yapisini nasil kurdun?

**Cevap:**

Route yapisi uygulamadaki sayfalari ayirmak icin kullanildi. Login, dashboard, employees, leave requests, salary, devices, documents ve profile gibi sayfalar route olarak tanimlandi.

Korunmasi gereken route'lar `ProtectedRoute` altina alindi. Boylece login olmayan kullanici uygulama paneline giremedi.

## 25. Layout yapisi nasil calisiyor?

**Cevap:**

Panel ekranlari ortak bir layout icinde calisiyor. Sidebar, Header ve ana icerik alani AppLayout tarafindan saglaniyor.

Bu sayede her sayfada ayni navigasyon ve panel iskeleti tekrar yazilmiyor. Sayfalar sadece kendi icerigine odaklaniyor.

## 26. Sidebar ve Header rol bilgisine gore degisiyor mu?

**Cevap:**

Evet, kullanicinin rolune gore gosterilecek menu ve aksiyonlar degisebilir. Auth context icinden gelen profile/role bilgisi kullanilarak kullaniciya uygun navigasyon deneyimi sunulur.

Ancak burada tekrar vurgulamak gerekir: menu gizlemek gercek guvenlik degildir. Gercek veri erisimi Supabase RLS ile korunur.

## 27. Component yapisinda tekrar kullanilabilirlik nasil saglandi?

**Cevap:**

Ortak UI parcalari `components/ui` altinda toplandi. Button, Modal, Panel, Badge, StatCard, Field, Tabs gibi componentler farkli sayfalarda tekrar kullanildi.

Bu sayede tasarim tutarliligi saglandi ve ayni UI kodu tekrar tekrar yazilmadi.

## 28. Form islemlerinde nelere dikkat ettin?

**Cevap:**

Formlarda kullanici girdileri state ile takip edildi. Kaydetme islemleri async service fonksiyonlariyla yapildi. Basarili olursa liste veya detay verisi yenilendi. Hata olursa kullaniciya mesaj gosterildi.

Ozellikle calisan olusturma, cihaz atama, izin talebi olusturma ve dokuman yukleme gibi islemlerde form state'i ile backend islemi ayrildi.

## 29. Frontend'de optimistic update kullandin mi?

**Cevap:**

Genel olarak kritik islemlerde Supabase sonucunu bekleyen daha guvenli bir yaklasim kullandim. Ozellikle silme, upload ve update gibi islemlerde backend basarili olmadan UI'in kesin olarak degismesi riskli olabilir.

Bu MVP icin veri tutarliligini onceleyen bir yaklasim tercih ettim.

## 30. UI ile RLS hatalari arasindaki iliskiyi nasil yonettin?

**Cevap:**

RLS nedeniyle bir sorgu hata donebilir veya hic satir donmeyebilir. Service fonksiyonlari bu durumlari hata olarak yukariya tasiyor. Frontend de kullaniciya yetki veya islem hatasi mesaji gosteriyor.

Ornegin dokuman silmede satir silinmediyse kullaniciya "Bu kayit icin silme yetkiniz olmayabilir" anlaminda mesaj veriliyor.

## 31. Supabase baglantisi yoksa frontend ne yapiyor?

**Cevap:**

`supabaseClient.ts` icinde env degerleri yoksa `supabase` null oluyor. Service fonksiyonlari bu durumda "Supabase not configured" hatasi firlatiyor.

Bu sayede eksik config durumunda uygulama sessizce bozulmak yerine gelistiriciye anlasilir hata veriyor.

## 32. `.env.local` neden Git'e eklenmemeli?

**Cevap:**

`.env.local` icinde proje URL'si, anon key ve test kullanici bilgileri gibi ortama ozel degerler bulunabilir. Bu dosya Git'e eklenmemelidir.

Ozellikle service role key, database sifresi veya test kullanici sifreleri kesinlikle repository'ye commit edilmemelidir.

## 33. Frontend tarafinda CSV export nasil dusunuldu?

**Cevap:**

Maaş gibi kayitlarda raporlama ihtiyaci oldugu icin CSV export yardimci fonksiyonu kullanildi. Veri Supabase'ten service araciligiyla cekilir, sonra frontend tarafinda CSV formatina donusturulup kullaniciya indirilir.

Bu MVP icin yeterli bir cozumdur. Daha buyuk veri setlerinde server-side export daha dogru olabilir.

## 34. React tarafinda global state manager neden kullanmadin?

**Cevap:**

Bu projede Redux veya Zustand gibi global state manager'a ihtiyac duymadim. Cunku global olmasi gereken ana state auth bilgisiydi ve bunu React Context ile yonettim.

Modul verileri sayfa seviyesinde yuklenip kullanildi. Bu MVP icin daha sade ve anlasilir bir yapi sagladi.

## 35. Frontend performansi icin ne yaptin?

**Cevap:**

Veri sorgularinda ihtiyac olan alanlari sectim, gereksiz tum kolonlari her yerde cekmemeye dikkat ettim. Loading/skeleton yapilariyla kullanici deneyimini iyilestirdim.

Dashboard gibi alanlarda da sayi hesaplari icin `count` sorgulari kullanildi. Bu, tum veriyi cekip frontend'de saymaktan daha verimli bir yaklasimdir.

## 36. Componentlerde veri cekme akisini nasil kurdun?

**Cevap:**

Sayfa componentleri acildiginda ilgili service fonksiyonu cagriliyor. Veri yuklenirken loading state aktif oluyor. Basarili olursa state'e data yaziliyor, hata olursa error state'e mesaj yaziliyor.

Genel akis:

```txt
mount
-> loading true
-> service fonksiyonu cagrilir
-> data veya error gelir
-> loading false
-> UI guncellenir
```

## 37. Frontend'de veri filtreleme nasil yapiliyor?

**Cevap:**

Bazi modullerde filtreler service fonksiyonuna parametre olarak gonderiliyor. Ornegin dokumanlarda employee_id veya document_type filtresi, izin taleplerinde status veya leave_type filtresi kullaniliyor.

Service fonksiyonu bu filtrelere gore Supabase sorgusuna `.eq()` kosullari ekliyor.

## 38. Frontend ile backend arasindaki sozlesmeyi nasil korudun?

**Cevap:**

TypeScript type'lariyla korudum. Her tablo icin frontend'de type tanimladim. Bu type'lar hangi alanlarin geldigini, hangi status degerlerinin kullanildigini ve hangi fonksiyonun ne dondurdugunu netlestirdi.

Bu sayede frontend ve Supabase tablo yapisi arasinda daha kontrollu bir bag kuruldu.

## 39. Bu frontend yapisinda en guclu taraf ne?

**Cevap:**

En guclu taraf, UI ile veri erisiminin ayrilmis olmasi. Sayfalar sadece gorunum ve etkilesime odaklaniyor. Supabase ile konusan kodlar service dosyalarinda toplaniyor.

Bu yapi projeyi daha okunabilir, test edilebilir ve gelistirilebilir hale getiriyor.

## 40. Bu frontend yapisinda gelistirilebilecek taraf ne?

**Cevap:**

Production seviyesinde React Query veya benzeri bir data fetching kutuphanesi eklenebilir. Boylece cache, refetch, mutation state ve background update gibi konular daha profesyonel yonetilebilir.

Ayrica form validation icin Zod veya React Hook Form gibi araclar eklenebilir. Buyuk veri listelerinde pagination ve server-side filtering daha da guclendirilebilir.

## 41. React Query kullansaydin ne kazandirirdi?

**Cevap:**

React Query kullansaydim server state yonetimi daha guclu olurdu. Loading, error, cache, refetch ve mutation durumlari daha standart hale gelirdi.

Bu MVP'de manuel state yonetimi yeterliydi ama production'da React Query iyi bir iyilestirme olurdu.

## 42. Form validation'i production'da nasil iyilestirirdin?

**Cevap:**

Production'da React Hook Form ve Zod kullanirdim. Zod ile form schema'larini tanimlayip hem frontend validation hem de tip guvenligini daha guclu hale getirirdim.

Boylece email formatlari, zorunlu alanlar, maas degerleri, tarih araliklari gibi kontroller daha merkezi ve bakimi kolay olurdu.

## 43. Frontend tarafinda en kritik guvenlik yanilgisi ne olurdu?

**Cevap:**

En kritik yanilgi, frontend'de buton veya menu gizlemenin gercek guvenlik oldugunu dusunmek olurdu.

Frontend sadece kullanici deneyimini yonetir. Gercek guvenlik backend tarafinda, bu projede de Supabase RLS policy'lerinde saglanir.

## 44. Bu projede frontend-backend baglantisini tek cumleyle nasil aciklarsin?

**Cevap:**

React sayfalari kullanici arayuzunu yonetiyor, feature service dosyalari Supabase JS Client uzerinden Auth, PostgreSQL ve Storage servisleriyle konusuyor; rol ve veri guvenligi ise Supabase RLS tarafinda uygulanıyor.

## 45. Isveren sana "Bu frontend production'a hazir mi?" derse ne cevap verirsin?

**Cevap:**

Bu haliyle MVP seviyesinde calisan, moduler ve Supabase ile entegre bir frontend. Production icin temel mimari dogru; auth, route guard, service katmani ve typed data modelleri var.

Ama production'a cikmadan once React Query, daha guclu form validation, pagination, detayli testler, hata takip sistemi ve daha kapsamli accessibility kontrolleri eklerdim.

## 46. Frontend tarafinda test stratejin ne olurdu?

**Cevap:**

Component testleri icin React Testing Library kullanirdim. Kritik akislar icin login, role-based route access, dokuman upload/download ve calisan CRUD senaryolarini test ederdim.

End-to-end test icin Playwright kullanarak kullanici akislarini gercek tarayici ortaminda dogrulardim.

## 47. Supabase hatalarini kullaniciya direkt gostermek dogru mu?

**Cevap:**

Gelistirme ortaminda detayli hata mesaji faydali olabilir. Ancak production'da Supabase'in ham hata mesajlarini direkt kullaniciya gostermek yerine daha kontrollu ve kullanici dostu mesajlar kullanmak daha dogru olur.

Log tarafinda detay tutulabilir, UI tarafinda ise "Bu islem gerceklestirilemedi" gibi daha sade mesajlar gosterilebilir.

## 48. Frontend'de yetkiye gore butonlari gizledin mi?

**Cevap:**

Evet, kullanicinin rolune gore aksiyonlar ve sayfa erisimleri duzenlenebilir. Ornegin employee rolunun admin operasyonlarini gormemesi gerekir.

Ama bu sadece UX icindir. Buton gizlemek tek basina guvenlik degildir. Supabase RLS yine asil karar mekanizmasidir.

## 49. Bu frontend mimarisini neden moduler sayiyorsun?

**Cevap:**

Cunku her is alani kendi dosya grubuna ayrildi. Auth islemleri auth feature'inda, calisan islemleri employees feature'inda, dokuman islemleri documents feature'inda tutuldu.

Bu sayede yeni bir modul eklemek veya mevcut bir modulu degistirmek daha kolay hale geldi.

## 50. Bu frontend tarafinda en cok ne ogrendin?

**Cevap:**

Frontend'in sadece ekran tasarimi olmadigini, backend ile saglam bir veri akisi kurmanin da frontend mimarisinin parcasi oldugunu ogrendim.

Ozellikle AuthProvider, ProtectedRoute, service katmani, TypeScript modelleri ve Supabase RLS ayrimini birlikte dusunmek bu projede benim icin en onemli kazanmdi.

