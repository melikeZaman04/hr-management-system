# Supabase Auth login/logout ve protected routes ekle

Labels: `type: frontend`, `type: auth`, `type: security`, `priority: high`, `status: ready`

Milestone: Supabase Foundation

## Amac

Supabase Auth kullanarak login/logout akisini kurmak ve uygulamadaki Admin/HR
sayfalarini session kontrolu ile korumak.

## Ogrenme Hedefi

- Supabase `signInWithPassword` kullanimi
- Supabase `signOut` kullanimi
- `getSession` ve `onAuthStateChange` ile session takibi
- React Context ile auth state paylasimi
- Login olmayan kullaniciyi `/login` sayfasina yonlendirme
- Login olmus kullaniciyi `/dashboard` sayfasina yonlendirme

## Kabul Kriterleri

- [ ] Login formu email ve password alir
- [ ] Supabase Auth ile giris yapilir
- [ ] Logout butonu kullaniciyi cikis yaptirir
- [ ] Header kullanici email bilgisini gosterir
- [ ] Login olmayan kullanici protected sayfalara giremez
- [ ] Login olmus kullanici `/login` sayfasinda kalmaz
- [ ] Supabase config eksikse kullaniciya anlasilir hata gosterilir
- [ ] `npm run lint` gecer
- [ ] `npm run build` gecer
