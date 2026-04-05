import { useTranslation } from 'react-i18next'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { authApi } from '../../api/auth'
import i18n from '../../i18n'
import styles from './Layout.module.css'

const LANGS = [
  { code: 'vi', label: 'VI' },
  { code: 'en', label: 'EN' },
  { code: 'jp', label: 'JP' },
]

export default function Layout() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const userRaw = localStorage.getItem('hrm_user')
  const user = userRaw ? JSON.parse(userRaw) : null

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    localStorage.removeItem('hrm_token')
    localStorage.removeItem('hrm_user')
    navigate('/login')
  }

  const changeLang = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('hrm_lang', code)
  }

  return (
    <div className={styles.root}>
      {/* Top navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navBrand}>🏢 {t('login.title')}</div>
        <div className={styles.navRight}>
          {user && (
            <span className={styles.navUser}>
              👤 {user.fullName || user.employeeId}
            </span>
          )}
          <div className={styles.langGroup}>
            {LANGS.map((l) => (
              <button
                key={l.code}
                className={`${styles.langBtn} ${i18n.language === l.code ? styles.langBtnActive : ''}`}
                onClick={() => changeLang(l.code)}
              >
                {l.label}
              </button>
            ))}
          </div>
          <button className={styles.navBtn} onClick={() => navigate('/change-password')}>
            🔑 {t('nav.changePassword')}
          </button>
          <button className={styles.navBtn} onClick={handleLogout}>
            🚪 {t('nav.logout')}
          </button>
        </div>
      </nav>

      <div className={styles.main}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <ul className={styles.sideNav}>
            <li className={styles.sideNavItem}>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `${styles.sideNavLink} ${isActive ? styles.sideNavLinkActive : ''}`
                }
              >
                <span className={styles.icon}>👤</span>
                {t('nav.profile')}
              </NavLink>
            </li>
            <li className={styles.sideNavItem}>
              <NavLink
                to="/lookup"
                className={({ isActive }) =>
                  `${styles.sideNavLink} ${isActive ? styles.sideNavLinkActive : ''}`
                }
              >
                <span className={styles.icon}>🔍</span>
                {t('nav.lookup')}
              </NavLink>
            </li>
            {user?.role === 'ADMIN' && (
              <li className={styles.sideNavItem}>
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `${styles.sideNavLink} ${isActive ? styles.sideNavLinkActive : ''}`
                  }
                >
                  <span className={styles.icon}>📋</span>
                  {t('nav.admin')}
                </NavLink>
              </li>
            )}
          </ul>
        </aside>

        {/* Page content */}
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
