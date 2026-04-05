import { useTranslation } from 'react-i18next'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { authApi } from '../../api/auth'
import i18n from '../../i18n'
import { useAuth } from '../../contexts/AuthContext'
import { LANGS_SHORT, ROUTES } from '../../constants'
import styles from '../../css/Layout.module.css'

export default function Layout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, isAdmin, clearAuth } = useAuth()

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    clearAuth()
    navigate(ROUTES.LOGIN)
  }

  const changeLang = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('hrm_lang', code)
  }

  return (
    <div className={styles.root}>
      <nav className={styles.navbar}>
        <div className={styles.navBrand}>🏢 {t('login.title')}</div>
        <div className={styles.navRight}>
          {user && (
            <span className={styles.navUser}>
              👤 {user.fullName || user.employeeId}
            </span>
          )}
          <div className={styles.langGroup}>
            {LANGS_SHORT.map((l) => (
              <button
                key={l.code}
                className={`${styles.langBtn} ${i18n.language === l.code ? styles.langBtnActive : ''}`}
                onClick={() => changeLang(l.code)}
              >
                {l.label}
              </button>
            ))}
          </div>
          <button className={styles.navBtn} onClick={() => navigate(ROUTES.CHANGE_PASSWORD)}>
            🔑 {t('nav.changePassword')}
          </button>
          <button className={styles.navBtn} onClick={handleLogout}>
            🚪 {t('nav.logout')}
          </button>
        </div>
      </nav>

      <div className={styles.main}>
        <aside className={styles.sidebar}>
          <ul className={styles.sideNav}>
            <li className={styles.sideNavItem}>
              <NavLink
                to={ROUTES.DASHBOARD}
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
                to={ROUTES.LOOKUP}
                className={({ isActive }) =>
                  `${styles.sideNavLink} ${isActive ? styles.sideNavLinkActive : ''}`
                }
              >
                <span className={styles.icon}>🔍</span>
                {t('nav.lookup')}
              </NavLink>
            </li>
            {isAdmin && (
              <li className={styles.sideNavItem}>
                <NavLink
                  to={ROUTES.ADMIN}
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

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
