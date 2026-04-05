import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import { PASSWORD_REGEX, ROUTES } from '../constants'
import styles from '../css/ChangePasswordPage.module.css'

export default function ChangePasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { clearAuth } = useAuth()
  const [params] = useSearchParams()
  const isForced = params.get('force') === 'true'

  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!PASSWORD_REGEX.test(newPass)) {
      setError(t('changePassword.weakPassword'))
      return
    }
    if (newPass !== confirmPass) {
      setError(t('changePassword.notMatch'))
      return
    }
    if (newPass === oldPass) {
      setError(t('changePassword.sameAsOld'))
      return
    }

    setLoading(true)
    try {
      await authApi.changePassword({ oldPassword: oldPass, newPassword: newPass })
      clearAuth()
      navigate(ROUTES.LOGIN)
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.title}>
            {isForced ? t('changePassword.forceTitle') : t('changePassword.title')}
          </div>
          {isForced && (
            <div className={styles.subtitle}>{t('changePassword.forceSubtitle')}</div>
          )}
        </div>

        <div className={styles.body}>
          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.formGroup}>
              <label className={styles.label}>{t('changePassword.oldPassword')}</label>
              <input
                className="input-field"
                type="password"
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>{t('changePassword.newPassword')}</label>
              <input
                className="input-field"
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                autoComplete="new-password"
              />
              <div className={styles.hint}>{t('changePassword.weakPassword')}</div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>{t('changePassword.confirmPassword')}</label>
              <input
                className="input-field"
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {error && <div className={styles.error}>⚠️ {error}</div>}

            <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? t('common.loading') : t('changePassword.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
