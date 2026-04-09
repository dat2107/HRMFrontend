import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { employeeApi } from '../../api/employee'
import type { FieldDetail } from '../../types'
import { MAX_FILE_SIZE, ALLOWED_MIME } from '../../constants'
import styles from '../../css/EditModal.module.css'

interface Props {
  provinceField: FieldDetail
  districtField: FieldDetail
  addressConfig: Record<string, string[]>
  onClose: () => void
  onSuccess: (fieldLabel: string, newVal: string) => void
  isOptionalUpload?: boolean
}

export default function AddressPairModal({
  provinceField,
  districtField,
  addressConfig,
  onClose,
  onSuccess,
  isOptionalUpload = false,
}: Props) {
  const { t } = useTranslation()

  const [province, setProvince] = useState(provinceField.rawValue || '')
  const [district, setDistrict] = useState(districtField.rawValue || '')
  const [fileData, setFileData] = useState<{ data: string; mimeType: string; name: string } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const provinces = Object.keys(addressConfig)
  const districts = province ? (addressConfig[province] || []) : []

  const handleProvinceChange = (val: string) => {
    setProvince(val)
    setDistrict('')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      setError(t('editModal.fileTooLarge'))
      e.target.value = ''
      return
    }
    if (!ALLOWED_MIME.includes(file.type as typeof ALLOWED_MIME[number])) {
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

    if (!province || !district) {
      setError(t('editModal.selectOption'))
      return
    }

    const filePayload = fileData
      ? { fileData: fileData.data, fileMimeType: fileData.mimeType, fileName: fileData.name }
      : {}

    setLoading(true)
    try {
      await employeeApi.submitUpdateRequest({
        fieldLabel: provinceField.label,
        newVal: province,
        oldVal: provinceField.value,
        ...filePayload,
      })
      await employeeApi.submitUpdateRequest({
        fieldLabel: districtField.label,
        newVal: district,
        oldVal: districtField.value,
        ...filePayload,
      })
      onSuccess(provinceField.label, province)
      onSuccess(districtField.label, district)
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
            <div className={styles.fieldLabel}>{provinceField.label}</div>
            <div className={styles.fieldValue}>{provinceField.value || '—'}</div>
            <div className={styles.fieldLabel} style={{ marginTop: '0.5rem' }}>{districtField.label}</div>
            <div className={styles.fieldValue}>{districtField.value || '—'}</div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.formGroup}>
              <label className={styles.label}>{provinceField.label}</label>
              <select
                className="input-field"
                value={province}
                onChange={(e) => handleProvinceChange(e.target.value)}
              >
                <option value="">{t('editModal.selectOption')}</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>{districtField.label}</label>
              <select
                className="input-field"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                disabled={!province}
              >
                <option value="">{t('editModal.selectOption')}</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {isOptionalUpload && (
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  {t('editModal.file')}
                  <span style={{ fontWeight: 400, color: '#9ca3af' }}> ({t('common.optional')})</span>
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
            )}

            {error && <div className={styles.error}>⚠️ {error}</div>}

            <div className={styles.footer}>
              <button type="button" className="btn-secondary" onClick={onClose}>
                {t('editModal.cancel')}
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !province || !district}
              >
                {loading ? t('common.loading') : t('editModal.submit')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
