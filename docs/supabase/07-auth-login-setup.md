# Auth Login Setup

Bu rehber, Supabase Auth login/logout akisini local ortamda test etmek icin
gerekli adimlari aciklar.

## 1. Test Kullanicisi Olustur

Supabase Dashboard icinde:

1. Authentication bolumune git.
2. Users sekmesini ac.
3. Add user butonunu kullan.
4. Test icin email ve password belirle.

Gercek kullanici sifrelerini repoya, issue'lara veya dokumanlara yazma.

## 2. Local Environment Kontrolu

`.env.local` dosyasinda su degerler olmalidir:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

`service_role` key frontend tarafinda kullanilmaz.

## 3. Development Read Policy Kontrolu

Login sonrasi Supabase sorgulari `authenticated` roluyle calisir. Bu nedenle
fake employee verisini local ortamda gormek icin
`docs/supabase/dev-only-employee-read-policy.sql` dosyasini tekrar calistir.

Bu dosya development icindir. Gercek HR verisi eklenmeden once kaldirilmali veya
Admin/HR role-based production policy ile degistirilmelidir.

## 4. Uygulamayi Test Et

```bash
npm run dev
```

Beklenen akis:

1. `/employees` acildiginda login yoksa `/login` sayfasina yonlenir.
2. Supabase Auth test kullanicisi ile giris yapilir.
3. Basarili giristen sonra `/dashboard` veya once istenen sayfa acilir.
4. Header kullanici email bilgisini gosterir.
5. Logout butonu session'i kapatir ve kullaniciyi `/login` sayfasina yonlendirir.
