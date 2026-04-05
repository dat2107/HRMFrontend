import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import i18n from '../i18n'
import styles from '../../css/LoginPage.module.css'

const LANGS = [
  { code: 'vi', label: 'Việt' },
  { code: 'en', label: 'EN' },
  { code: 'jp', label: '日本語' },
]

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMsg, setForgotMsg] = useState('')

  const changeLang = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('hrm_lang', code)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanId = employeeId.trim().toUpperCase()
    if (!cleanId || !password) {
      setError(t('login.required'))
      return
    }
    if (!/^(F0|M0)[0-9]{5}$/.test(cleanId)) {
      setError(t('login.invalidFormat'))
      return
    }

    setLoading(true)
    try {
      const res = await authApi.login({ employeeId: cleanId, password })
      const { data } = res.data

      localStorage.setItem('hrm_token', data.accessToken)
      localStorage.setItem('hrm_user', JSON.stringify(data.employee))

      if (data.requireChangePassword) {
        navigate('/change-password?force=true')
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setForgotMsg('')

    const cleanId = employeeId.trim().toUpperCase()
    if (!cleanId || !forgotEmail) {
      setError(t('login.required'))
      return
    }

    setLoading(true)
    try {
      await authApi.forgotPassword({ employeeId: cleanId, email: forgotEmail })
      setForgotMsg(t('forgotPassword.successMsg'))
    } catch {
      setForgotMsg(t('forgotPassword.successMsg')) // Fake success
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>{t('login.title')}</div>
          <div className={styles.subtitle}>
            {mode === 'login' ? t('login.subtitle') : t('forgotPassword.title')}
          </div>
        </div>

        <div className={styles.body}>
          {mode === 'login' ? (
            <form onSubmit={handleLogin} noValidate>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t('login.employeeId')}</label>
                <input
                  className="input-field"
                  type="text"
                  placeholder={t('login.employeeIdPlaceholder')}
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  autoComplete="username"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{t('login.password')}</label>
                <div className={styles.inputWrapper}>
                  <input
                    className="input-field"
                    type={showPass ? 'text' : 'password'}
                    placeholder={t('login.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {error && (
                <div className={styles.error}>
                  <span>⚠️</span> {error}
                </div>
              )}

              <div className={styles.forgot}>
                <button
                  type="button"
                  className={styles.forgotLink}
                  onClick={() => { setMode('forgot'); setError('') }}
                >
                  {t('login.forgotPassword')}
                </button>
              </div>

              <button
                type="submit"
                className={`btn-primary ${styles.submitBtn}`}
                disabled={loading}
              >
                {loading ? t('login.loggingIn') : t('login.submit')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgot} noValidate>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t('forgotPassword.employeeId')}</label>
                <input
                  className="input-field"
                  type="text"
                  placeholder={t('login.employeeIdPlaceholder')}
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{t('forgotPassword.email')}</label>
                <input
                  className="input-field"
                  type="email"
                  placeholder={t('forgotPassword.emailPlaceholder')}
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>

              {error && <div className={styles.error}>⚠️ {error}</div>}
              {forgotMsg && (
                <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  ✅ {forgotMsg}
                </div>
              )}

              <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
                {loading ? t('common.loading') : t('forgotPassword.submit')}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  className={styles.forgotLink}
                  onClick={() => { setMode('login'); setError(''); setForgotMsg('') }}
                >
                  ← {t('forgotPassword.back')}
                </button>
              </div>
            </form>
          )}

          {/* Language Switcher */}
          <div className={styles.langSwitcher}>
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                className={`${styles.langBtn} ${i18n.language === l.code ? styles.langBtnActive : ''}`}
                onClick={() => changeLang(l.code)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
