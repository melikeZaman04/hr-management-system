import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import styles from './LandingPage.module.css'

export function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAuth()

  const rootRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  // Wait for auth to resolve before deciding to redirect — prevents a
  // flash redirect on first load while Supabase restores the session.
  useEffect(() => {
    console.log('[LandingPage] isLoading:', isLoading, '| isAuthenticated:', isAuthenticated)
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isLoading, isAuthenticated, navigate])

  // Custom cursor + scroll-reveal for the stack bars (ported from the
  // original <script>). All listeners/observers are cleaned up on unmount.
  useEffect(() => {
    const root = rootRef.current
    const cursor = cursorRef.current
    const ring = ringRef.current
    if (!root || !cursor || !ring) return

    // Skip cursor effects on touch/pointer-coarse devices (phones, tablets).
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    if (isTouch) return

    // Hide the native cursor only — body background is handled entirely by
    // CSS (.page { background: var(--black) }) so we never touch body.style
    // and therefore never risk leaking a dark background into other pages.
    const html = document.documentElement
    const prevHtmlCursor = html.style.cursor
    html.style.cursor = 'none'

    const handleMouseMove = (e: MouseEvent) => {
      cursor.style.left = e.clientX + 'px'
      cursor.style.top = e.clientY + 'px'
      ring.style.left = e.clientX + 'px'
      ring.style.top = e.clientY + 'px'
    }
    document.addEventListener('mousemove', handleMouseMove)

    const enter = () => {
      ring.style.width = '48px'
      ring.style.height = '48px'
      ring.style.borderColor = 'rgba(201,169,110,0.8)'
    }
    const leave = () => {
      ring.style.width = '32px'
      ring.style.height = '32px'
      ring.style.borderColor = 'rgba(201,169,110,0.5)'
    }
    const interactive = root.querySelectorAll<HTMLElement>(
      `button, a, .${styles['mod-row']}, .${styles['role-col']}, .${styles.ph}`,
    )
    interactive.forEach((el) => {
      el.addEventListener('mouseenter', enter)
      el.addEventListener('mouseleave', leave)
    })

    // Animate the stack bars from 0 to their target width when scrolled in.
    const bars = root.querySelectorAll<HTMLElement>(`.${styles['stack-fill']}`)
    const observers: IntersectionObserver[] = []
    bars.forEach((bar) => {
      const target = bar.style.width
      bar.style.width = '0'
      const obs = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            bar.style.width = target
            obs.disconnect()
          }
        },
        { threshold: 0.3 },
      )
      obs.observe(bar)
      observers.push(obs)
    })

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      interactive.forEach((el) => {
        el.removeEventListener('mouseenter', enter)
        el.removeEventListener('mouseleave', leave)
      })
      observers.forEach((obs) => obs.disconnect())
      html.style.cursor = prevHtmlCursor
    }
  }, [])

  const goToLogin = () => navigate('/login')
  const scrollToModules = () => {
    document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' })
  }
  const scrollToId = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }
  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={styles.page} ref={rootRef}>
      <div className={styles.cursor} ref={cursorRef} />
      <div className={styles.cursorRing} ref={ringRef} />

      {/* NAV */}
      <nav className={styles.nav}>
        <a href="#!" className={styles.logo} onClick={scrollToTop}>
          <div className={styles['logo-mark']}>H</div>
          HRCore
        </a>
        <div className={styles['nav-center']}>
          <a href="#modules" onClick={scrollToId('modules')}>Modüller</a>
          <a href="#roles" onClick={scrollToId('roles')}>Roller</a>
          <a href="#tech" onClick={scrollToId('tech')}>Altyapı</a>
          <a href="#roadmap" onClick={scrollToId('roadmap')}>Yol Haritası</a>
        </div>
        <button className={styles['nav-btn']} onClick={goToLogin}>Demo Talep Et</button>
      </nav>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles['hero-bg']} />
        <div className={styles['hero-grid-lines']} />
        <div className={styles['hero-number']}>HR</div>

        <div className={styles['hero-eyebrow']}>Enterprise HR Platformu — Supabase + React + TypeScript</div>

        <h1 className={styles['hero-title']}>
          İnsan kaynakları<br />
          <span className={styles.line2}>operasyonlarınızı</span>
          <span className={styles.line3}><em>yeniden</em> tanımlayın.</span>
        </h1>

        <div className={styles['hero-bottom']}>
          <p className={styles['hero-desc']}>
            Çalışan kayıtları, izin süreçleri, maaş kesintileri, cihaz zimmetleri ve doküman yönetimi — rol bazlı erişim ve gerçek veri akışlarıyla, enterprise seviyesinde tek panelde.
          </p>
          <div className={styles['hero-actions']}>
            <button className={styles['btn-main']} onClick={goToLogin}>Platformu Keşfet &nbsp;→</button>
            <button className={styles['btn-sub']} onClick={scrollToModules}>Demo İzle</button>
          </div>
        </div>

        <div className={styles['hero-scroll']}>
          <div className={styles['scroll-line']} />
          <span className={styles['scroll-text']}>Aşağı Kaydır</span>
        </div>
      </section>

      {/* MARQUEE */}
      <div className={styles['marquee-wrap']}>
        <div className={styles['marquee-track']}>
          <div className={styles['marquee-item']}><span>Çalışan Yönetimi</span><div className={styles['marquee-dot']} /><span>İzin Akışları</span><div className={styles['marquee-dot']} /><span>Maaş Kesintileri</span><div className={styles['marquee-dot']} /><span>Cihaz Envanteri</span><div className={styles['marquee-dot']} /><span>Doküman Arşivi</span><div className={styles['marquee-dot']} /><span>Rol Bazlı Erişim</span><div className={styles['marquee-dot']} /><span>Supabase Auth</span><div className={styles['marquee-dot']} /><span>Row Level Security</span><div className={styles['marquee-dot']} /><span>CSV Export</span><div className={styles['marquee-dot']} /></div>
          {/* aria-hidden: duplicate content for seamless CSS marquee loop */}
          <div className={styles['marquee-item']} aria-hidden="true"><span>Çalışan Yönetimi</span><div className={styles['marquee-dot']} /><span>İzin Akışları</span><div className={styles['marquee-dot']} /><span>Maaş Kesintileri</span><div className={styles['marquee-dot']} /><span>Cihaz Envanteri</span><div className={styles['marquee-dot']} /><span>Doküman Arşivi</span><div className={styles['marquee-dot']} /><span>Rol Bazlı Erişim</span><div className={styles['marquee-dot']} /><span>Supabase Auth</span><div className={styles['marquee-dot']} /><span>Row Level Security</span><div className={styles['marquee-dot']} /><span>CSV Export</span><div className={styles['marquee-dot']} /></div>
        </div>
      </div>

      {/* MODULES */}
      <section className={styles.modules} id="modules">
        <div className={styles['section-head']}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px' }}>
            <div className={styles['section-index']}>01</div>
            <div className={styles['section-title-wrap']}>
              <div className={styles['section-label']}>Modüller</div>
              <div className={styles['section-title']}>Her süreç,<br />tek panelde.</div>
            </div>
          </div>
          <p className={styles['section-sub']}>Gerçek veri akışları ve servis tabanlı mimariyle kurulmuş altı temel modül. Sadece arayüz değil — çalışan bir sistem.</p>
        </div>

        <div className={styles['mod-list']}>
          <div className={styles['mod-row']}>
            <div className={styles['mod-num']}>001</div>
            <div className={styles['mod-name']}>Çalışan Yönetimi</div>
            <div className={styles['mod-tags']}><span className={styles['mod-tag']}>Listele</span><span className={styles['mod-tag']}>Oluştur</span><span className={styles['mod-tag']}>Durum</span></div>
            <div className={styles['mod-arrow']}>→</div>
          </div>
          <div className={styles['mod-row']}>
            <div className={styles['mod-num']}>002</div>
            <div className={styles['mod-name']}>İzin Talepleri</div>
            <div className={styles['mod-tags']}><span className={styles['mod-tag']}>Onay Akışı</span><span className={styles['mod-tag']}>Filtrele</span></div>
            <div className={styles['mod-arrow']}>→</div>
          </div>
          <div className={styles['mod-row']}>
            <div className={styles['mod-num']}>003</div>
            <div className={styles['mod-name']}>Maaş Kesintileri</div>
            <div className={styles['mod-tags']}><span className={styles['mod-tag']}>Hesapla</span><span className={styles['mod-tag']}>CSV Export</span></div>
            <div className={styles['mod-arrow']}>→</div>
          </div>
          <div className={styles['mod-row']}>
            <div className={styles['mod-num']}>004</div>
            <div className={styles['mod-name']}>Cihaz Envanteri</div>
            <div className={styles['mod-tags']}><span className={styles['mod-tag']}>Zimmet</span><span className={styles['mod-tag']}>İade</span></div>
            <div className={styles['mod-arrow']}>→</div>
          </div>
          <div className={styles['mod-row']}>
            <div className={styles['mod-num']}>005</div>
            <div className={styles['mod-name']}>Doküman Yönetimi</div>
            <div className={styles['mod-tags']}><span className={styles['mod-tag']}>Storage</span><span className={styles['mod-tag']}>Private</span></div>
            <div className={styles['mod-arrow']}>→</div>
          </div>
          <div className={styles['mod-row']}>
            <div className={styles['mod-num']}>006</div>
            <div className={styles['mod-name']}>Dashboard & Analitik</div>
            <div className={styles['mod-tags']}><span className={styles['mod-tag']}>Metrikler</span><span className={styles['mod-tag']}>Rol Bazlı</span></div>
            <div className={styles['mod-arrow']}>→</div>
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section id="roles">
        <div className={styles['roles-header']}>
          <div className={styles['roles-big-text']}>
            Her rol,<br />kendi<br /><em>dünyası.</em>
          </div>
          <div>
            <div className={styles['section-label']} style={{ marginBottom: '10px' }}>02 — Kullanıcı Rolleri</div>
            <p className={styles['roles-subtitle']}>Sistem; admin/HR, yönetici ve çalışan rollerine göre ayrışan ekranlar ve işlem yetkileri sunar. Hassas veri, kontrollü erişimle.</p>
          </div>
        </div>
        <div className={styles['roles-grid']}>
          <div className={styles['role-col']}>
            <div className={styles['role-number']}>I</div>
            <div className={styles['role-badge']}>Admin / HR</div>
            <div className={styles['role-name']}>Tam Yetki</div>
            <div className={styles['role-desc']}>Tüm çalışan ve operasyon kayıtlarını yönetebilir, sistemi yapılandırabilir, raporlara ulaşabilir.</div>
            <div className={styles['role-perms']}>
              <div className={styles.rp}>Tüm çalışan verilerine erişim</div>
              <div className={styles.rp}>İzin onaylama ve reddetme</div>
              <div className={styles.rp}>Maaş ve cihaz yönetimi</div>
              <div className={styles.rp}>CSV dışa aktarma</div>
            </div>
          </div>
          <div className={styles['role-col']}>
            <div className={styles['role-number']}>II</div>
            <div className={styles['role-badge']}>Manager</div>
            <div className={styles['role-name']}>Ekip Yetkileri</div>
            <div className={styles['role-desc']}>Kendi ekibinin süreçlerini takip edebilir, izin taleplerini yönetebilir, ekip metriklerini görür.</div>
            <div className={styles['role-perms']}>
              <div className={styles.rp}>Ekip izin taleplerini yönet</div>
              <div className={styles.rp}>Ekip dashboard metrikleri</div>
              <div className={styles.rp}>Cihaz durumu görüntüleme</div>
              <div className={`${styles.rp} ${styles.off}`}>Maaş bilgilerine erişim yok</div>
            </div>
          </div>
          <div className={styles['role-col']}>
            <div className={styles['role-number']}>III</div>
            <div className={styles['role-badge']}>Employee</div>
            <div className={styles['role-name']}>Kişisel Erişim</div>
            <div className={styles['role-desc']}>Kendi izin, cihaz ve doküman bilgilerine ulaşabilir; talep oluşturabilir ve sürecini takip edebilir.</div>
            <div className={styles['role-perms']}>
              <div className={styles.rp}>Kendi izin taleplerini oluştur</div>
              <div className={styles.rp}>Kişisel dokümanlara eriş</div>
              <div className={styles.rp}>Zimmetli cihazlarını gör</div>
              <div className={`${styles.rp} ${styles.off}`}>Diğer çalışan verileri yok</div>
            </div>
          </div>
        </div>
      </section>

      {/* TECH */}
      <section className={styles['tech-split']} id="tech">
        <div className={styles['tech-left']}>
          <div className={styles['tech-eyebrow']}>03 — Teknik Altyapı</div>
          <div className={styles['tech-big']}>Sadece şık bir<br />arayüz <em>değil.</em></div>
          <p className={styles['tech-body']}>Servis tabanlı mimari, tip güvenliği ve Row Level Security ile inşa edilmiş gerçek bir platform. Her modül kendi iş mantığıyla ayrılmış; ileride yeni modül eklemek bir klasör meselesi.</p>
          <div className={styles['tech-points']}>
            <div className={styles.tp}>
              <div className={styles['tp-icon']}>⬡</div>
              <div><div className={styles['tp-name']}>Supabase Auth + RLS</div><div className={styles['tp-desc']}>Oturum yönetimi, PostgreSQL ve Row Level Security ile veri güvenliği</div></div>
            </div>
            <div className={styles.tp}>
              <div className={styles['tp-icon']}>◈</div>
              <div><div className={styles['tp-name']}>Feature Bazlı Mimari</div><div className={styles['tp-desc']}>Her modül kendi servis katmanıyla izole — ölçeklenebilir ve test edilebilir</div></div>
            </div>
            <div className={styles.tp}>
              <div className={styles['tp-icon']}>◎</div>
              <div><div className={styles['tp-name']}>ProtectedRoute + Rol Erişim</div><div className={styles['tp-desc']}>React Router ile korumalı sayfa yönetimi ve rol bazlı yönlendirme</div></div>
            </div>
            <div className={styles.tp}>
              <div className={styles['tp-icon']}>⬗</div>
              <div><div className={styles['tp-name']}>Private Storage</div><div className={styles['tp-desc']}>Supabase Storage ile güvenli dosya yükleme, indirme ve erişim kontrolü</div></div>
            </div>
          </div>
        </div>
        <div className={styles['tech-right']}>
          <div className={styles['tech-eyebrow']} style={{ marginBottom: '40px' }}>Teknoloji Yığını</div>
          <div className={styles['stack-grid']}>
            <div className={styles['stack-item']}><div><div className={styles['stack-name']}>React 19</div><div className={styles['stack-bar']}><div className={styles['stack-fill']} style={{ width: '95%' }} /></div></div><div className={styles['stack-role']}>Bileşen yapısı</div></div>
            <div className={styles['stack-item']}><div><div className={styles['stack-name']}>TypeScript</div><div className={styles['stack-bar']}><div className={styles['stack-fill']} style={{ width: '90%' }} /></div></div><div className={styles['stack-role']}>Tip güvenliği</div></div>
            <div className={styles['stack-item']}><div><div className={styles['stack-name']}>Supabase</div><div className={styles['stack-bar']}><div className={styles['stack-fill']} style={{ width: '88%' }} /></div></div><div className={styles['stack-role']}>Auth + DB + Storage</div></div>
            <div className={styles['stack-item']}><div><div className={styles['stack-name']}>Vite</div><div className={styles['stack-bar']}><div className={styles['stack-fill']} style={{ width: '85%' }} /></div></div><div className={styles['stack-role']}>Build süreci</div></div>
            <div className={styles['stack-item']}><div><div className={styles['stack-name']}>React Router</div><div className={styles['stack-bar']}><div className={styles['stack-fill']} style={{ width: '82%' }} /></div></div><div className={styles['stack-role']}>Sayfa yönetimi</div></div>
            <div className={styles['stack-item']}><div><div className={styles['stack-name']}>ESLint + Build CI</div><div className={styles['stack-bar']}><div className={styles['stack-fill']} style={{ width: '78%' }} /></div></div><div className={styles['stack-role']}>Kod kalitesi</div></div>
          </div>
        </div>
      </section>

      {/* ROADMAP */}
      <section className={styles.roadmap} id="roadmap">
        <div className={styles['roadmap-header']}>
          <div className={styles['section-label']}>04 — Yol Haritası</div>
          <div className={styles['section-title']} style={{ fontSize: '52px', marginTop: '10px' }}>Aynı mimari üzerine büyür.</div>
        </div>
        <div className={styles.phases}>
          <div className={`${styles.ph} ${styles.done}`}>
            <div className={styles['ph-accent']} />
            <div className={styles['ph-n']}>1</div>
            <div className={styles['ph-status']}>✓ Tamamlandı</div>
            <div className={styles['ph-title']}>MVP Çekirdek</div>
            <div className={styles['ph-items']}>
              <div className={`${styles.phi} ${styles.done}`}>Auth ve oturum yönetimi</div>
              <div className={`${styles.phi} ${styles.done}`}>Rol bazlı erişim kontrolü</div>
              <div className={`${styles.phi} ${styles.done}`}>Çalışan, izin, maaş modülleri</div>
              <div className={`${styles.phi} ${styles.done}`}>Cihaz ve doküman yönetimi</div>
              <div className={`${styles.phi} ${styles.done}`}>CSV export ve doğrulama</div>
            </div>
          </div>
          <div className={styles.ph}>
            <div className={styles['ph-accent']} />
            <div className={styles['ph-n']}>2</div>
            <div className={styles['ph-status']}>Planlı</div>
            <div className={styles['ph-title']}>Analitik & Görünürlük</div>
            <div className={styles['ph-items']}>
              <div className={styles.phi}>Gelişmiş analitik paneller</div>
              <div className={styles.phi}>Organizasyon şeması</div>
              <div className={styles.phi}>Denetim ve audit kayıtları</div>
              <div className={styles.phi}>Bildirim sistemi</div>
            </div>
          </div>
          <div className={styles.ph}>
            <div className={styles['ph-accent']} />
            <div className={styles['ph-n']}>3</div>
            <div className={styles['ph-status']}>Gelecek</div>
            <div className={styles['ph-title']}>Performans & Bordro</div>
            <div className={styles['ph-items']}>
              <div className={styles.phi}>Performans değerlendirme</div>
              <div className={styles.phi}>Gelişmiş bordro entegrasyonu</div>
              <div className={styles.phi}>Self-servis çalışan portalı</div>
              <div className={styles.phi}>Entegrasyon katmanı</div>
            </div>
          </div>
          <div className={styles.ph}>
            <div className={styles['ph-accent']} />
            <div className={styles['ph-n']}>∞</div>
            <div className={styles['ph-status']}>Vizyon</div>
            <div className={styles['ph-title']}>Enterprise Suite</div>
            <div className={styles['ph-items']}>
              <div className={styles.phi}>Multi-tenant altyapı</div>
              <div className={styles.phi}>SSO entegrasyonu</div>
              <div className={styles.phi}>API marketplace</div>
              <div className={styles.phi}>Mobil uygulama</div>
            </div>
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className={styles.closing}>
        <div className={styles['closing-bg']} />
        <div className={styles['closing-label']}>Bir Sonraki Adım</div>
        <h2 className={styles['closing-title']}>
          Platformu bir<br />adım <em>öteye</em><br />taşıyalım.
        </h2>
        <p className={styles['closing-sub']}>MVP hazır. Enterprise vizyon netleşti. Analitik, bildirim sistemi ya da performans modülünü birlikte inşa edelim.</p>
        <button className={styles['btn-closing']} onClick={goToLogin}>Demo Talep Et &nbsp;&nbsp;→</button>
        <div className={styles['closing-detail']}>React · TypeScript · Supabase · Vite · React Router</div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles['f-left']}>
          <div className={styles['f-logo']}>
            <div className={styles['f-lm']}>H</div>
            HRCore
          </div>
          <div className={styles['f-copy']}>Enterprise HR Platform · 2026</div>
        </div>
        <div className={styles['f-links']}>
          <a href="#">Dokümantasyon</a>
          <a href="#">Güvenlik</a>
          <a href="#">API</a>
          <a href="#">İletişim</a>
        </div>
      </footer>
    </div>
  )
}
