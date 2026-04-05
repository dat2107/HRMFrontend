import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { employeeApi } from '../../api/employee'
import styles from '../../css/EditModal.module.css'

interface FieldDetail {
  key: string
  label: string
  value: string
  rawValue: string
  inputType: string
  isPending: boolean
  pendingVal: string
}

interface Props {
  field: FieldDetail
  dropdownOptions?: string[]
  onClose: () => void
  onSuccess: (fieldLabel: string, newVal: string) => void
  isOptionalUpload?: boolean
}

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']

export default function EditModal({
  field, dropdownOptions, onClose, onSuccess, isOptionalUpload = false
}: Props) {
  const { t } = useTranslation()

  const [newVal, setNewVal] = useState(field.rawValue || '')
  const [fileData, setFileData] = useState<{ data: string; mimeType: string; name: string } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const isDropdown = field.inputType === 'dropdown' && dropdownOptions && dropdownOptions.length > 0
  const isDate = field.inputType === 'date'

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      setError(t('editModal.fileTooLarge'))
      e.target.value = ''
      return
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      setError(t('editModal.fileHint'))
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      setFileData({ data: base64, mimeType: file.type, name: file.name })
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!newVal.trim()) return

    if (!isOptionalUpload && !fileData) {
      setError(t('editModal.fileRequired'))
      return
    }

    setLoading(true)
    try {
      await employeeApi.submitUpdateRequest({
        fieldLabel: field.label,
        newVal: newVal.trim(),
        oldVal: field.value,
        ...(fileData ? {
          fileData: fileData.data,
          fileMimeType: fileData.mimeType,
          fileName: fileData.name,
        } : {}),
      })
      onSuccess(field.label, newVal.trim())
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>✏️ {t('editModal.title')}</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.fieldInfo}>
            <div className={styles.fieldLabel}>{t('editModal.field')}</div>
            <div className={styles.fieldValue}>{field.label}</div>
            <div className={styles.fieldLabel} style={{ marginTop: '0.5rem' }}>
              {t('editModal.oldValue')}
            </div>
            <div className={styles.fieldValue}>{field.value || '—'}</div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.formGroup}>
              <label className={styles.label}>{t('editModal.newValue')}</label>
              {isDropdown ? (
                <select
                  className="input-field"
                  value={newVal}
                  onChange={(e) => setNewVal(e.target.value)}
                >
                  <option value="">{t('editModal.selectOption')}</option>
                  {dropdownOptions!.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : isDate ? (
                <input
                  className="input-field"
                  type="date"
                  value={newVal}
                  onChange={(e) => setNewVal(e.target.value)}
                />
              ) : (
                <input
                  className="input-field"
                  type="text"
                  value={newVal}
                  onChange={(e) => setNewVal(e.target.value)}
                  placeholder={t('editModal.newValue')}
                />
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                {t('editModal.file')}
                {isOptionalUpload && (
                  <span style={{ fontWeight: 400, color: '#9ca3af' }}> ({t('common.noResult')})</span>
                )}
              </label>
              <input
                ref={fileRef}
                type="file"
                className={styles.fileInput}
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
              />
              <div className={styles.fileHint}>{t('editModal.fileHint')}</div>
            </div>

            {error && <div className={styles.error}>⚠️ {error}</div>}

            <div className={styles.footer}>
              <button type="button" className="btn-secondary" onClick={onClose}>
                {t('editModal.cancel')}
              </button>
              <button type="submit" className="btn-primary" disabled={loading || !newVal.trim()}>
                {loading ? t('common.loading') : t('editModal.submit')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
