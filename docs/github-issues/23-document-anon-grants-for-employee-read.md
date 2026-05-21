# Development employee okuma izni icin anon grantlerini dokumante et

Labels: `type: documentation`, `type: database`, `type: security`, `priority: medium`, `status: ready`

Milestone: Supabase Foundation

## Description

Development ortaminda Supabase `anon` rolunun fake employee seed datasini
okuyabilmesi icin gereken gecici SQL grantlerini dokumante et ve development RLS
SQL dosyasina ekle.

Bu is production icin guvenli bir HR yetkilendirme cozumu degildir. Sadece
egitim, fake data ve local UI dogrulamasi icindir.

## Learning Goal

Bu issue ile su ayrimi ogreniyoruz:

- `grant select` rolun tabloya sorgu atabilmesini saglar.
- RLS policy rol tabloya sorgu atabiliyorsa hangi satirlari gorecegini belirler.
- RLS acik olsa bile tablo privilege'i yoksa frontend `permission denied` hatasi alabilir.
- Gecici development izinleri production Admin/HR policy'lerinin yerini tutmaz.

## Acceptance Criteria

- [ ] Development RLS SQL dosyasi `anon` rolune schema usage izni verir
- [ ] Development RLS SQL dosyasi `anon` rolune employee select izni verir
- [ ] Setup rehberi SQL grant ve RLS policy farkini aciklar
- [ ] `npm run lint` passes
- [ ] SQL uygulandiktan sonra React Employees sayfasi fake employee kayitlarini okuyabilir
