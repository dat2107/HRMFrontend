import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { employeeApi, configApi } from '../../api/employee'
import EditModal from '../../components/EditModal/EditModal'
import styles from './DashboardPage.module.css'

interface FieldDetail {
  key: string
  label: string
  value: string
  rawValue: string
  editable: boolean
  inputType: string
  pending: boolean
  pendingVal: string
}

interface Profile {
  baseInfo: { id: string; fullName: string; department: string; positionCode: string; email: string }
  details: FieldDetail[]
  hasPending: boolean
  confirmStatus: { globalActive: boolean; userConfirmed: boolean; confirmedAt: string; hasPending: boolean }
}

// helper type for configs coming from backend
interface FieldConfig {
  fieldName: string
  isOptionalUpload?: boolean
  // add other properties if backend adds more fields
}

export default function DashboardPage() {
  const { t } = useTranslation()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [dropdowns, setDropdowns] = useState<Record<string, string[]>>({})
  const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>([])
  const [addressConfig, setAddressConfig] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [editField, setEditField] = useState<FieldDetail | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [confirmSuccess, setConfirmSuccess] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [profileRes, dropdownRes, fieldsRes] = await Promise.all([
        employeeApi.getProfile(),
        configApi.getDropdowns(),
        configApi.getFieldConfigs(),
      ])
      setProfile(profileRes.data.data)
      setDropdowns(dropdownRes.data.data)
      setFieldConfigs(fieldsRes.data.data)
    } catch (err: unknown) {
      // use a narrow shape for axios-like errors
      const e = err as { response?: { data?: any; status?: number } }
      console.error("Chi tiết lỗi:", e.response?.data)
      // Nếu lỗi 401 hoặc 500 liên quan đến auth, có thể đẩy ra trang login
      if (e.response?.status === 401 || e.response?.status === 500) {
        // window.location.href = '/login';
      }
    } finally {
      setLoading(false)
    }

    // Load address config riêng — không để lỗi này kéo sập cả trang
    try {
      const addressRes = await configApi.getAddress()
      setAddressConfig(addressRes.data.data)
    } catch {
      console.warn('Address config không load được, dùng text input cho địa chỉ')
    }
  }

  const handleEditSuccess = (fieldLabel: string, newVal: string) => {
    if (!profile) return
    setProfile((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        hasPending: true,
        details: prev.details.map((d) =>
          d.label === fieldLabel
            ? { ...d, pending: true, pendingVal: newVal }
            : d
        ),
        confirmStatus: { ...prev.confirmStatus, hasPending: true },
      }
    })
  }

  const handleConfirm = async () => {
    setConfirmLoading(true)
    try {
      await employeeApi.submitConfirmation()
      setConfirmSuccess(true)
      setProfile((prev) =>
        prev ? {
          ...prev,
          confirmStatus: {
            ...prev.confirmStatus,
            userConfirmed: true,
            confirmedAt: new Date().toLocaleString('vi-VN'),
          },
        } : prev
      )
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      alert(e.response?.data?.message || t('common.error'))
    } finally {
      setConfirmLoading(false)
    }
  }

  const PROVINCE_KEYS = ['province', 'tempProvince']
  const DISTRICT_PROVINCE_MAP: Record<string, string> = {
    district: 'province',
    tempDistrict: 'tempProvince',
  }

  const getDropdownOptions = (field: FieldDetail): string[] => {
    if (PROVINCE_KEYS.includes(field.key)) {
      return Object.keys(addressConfig)
    }
    if (field.key in DISTRICT_PROVINCE_MAP) {
      const provinceKey = DISTRICT_PROVINCE_MAP[field.key]
      const provinceField = profile?.details.find((d) => d.key === provinceKey)
      const province = provinceField?.rawValue || ''
      return addressConfig[province] || []
    }
    return dropdowns[field.label] || []
  }

  const isOptionalUpload = (field: FieldDetail): boolean => {
    const fc = fieldConfigs.find((f) => f.fieldName === field.label)
    return fc?.isOptionalUpload ?? false
  }

  if (loading) return <div className={styles.loading}>⏳ {t('common.loading')}</div>
  if (!profile) return null

  const { baseInfo, details, confirmStatus } = profile

  return (
    <div>
      <h1 className={styles.pageTitle}>👤 {t('profile.title')}</h1>

      {/* Base Info Card */}
      <div className={styles.baseInfoCard}>
        <div className={styles.avatar}>👤</div>
        <div className={styles.baseInfoText}>
          <h2>{baseInfo.fullName}</h2>
          <p>🪪 {baseInfo.id} | 🏢 {baseInfo.department || '—'}</p>
          <p>📋 {baseInfo.positionCode || '—'} | ✉️ {baseInfo.email || '—'}</p>
        </div>
      </div>

      {/* Field Details */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>📋 {t('profile.title')}</div>
        {details.map((field) => (
          <div key={field.key} className={styles.infoItem}>
            <div className={styles.infoLabel}>{field.label}</div>
            <div className={styles.infoValue}>
              {field.pending ? (
                <div className={styles.pendingValue}>
                  <span className={styles.oldVal}>{field.value || '—'}</span>
                  <span className={styles.newVal}>→ {field.pendingVal}</span>
                  <span className="badge-pending">🕐 {t('profile.pendingBadge')}</span>
                </div>
              ) : (
                field.value || '—'
              )}
            </div>
            <div>
              {!field.editable ? (
                <span className="badge-locked">🔒 {t('profile.lockedBadge')}</span>
              ) : field.pending ? (
                <span className="badge-pending">🕐 {t('profile.pendingBadge')}</span>
              ) : (
                <button
                  className={styles.editBtn}
                  onClick={() => setEditField(field)}
                  disabled={confirmStatus.userConfirmed || confirmSuccess}
                >
                  ✏️ {t('profile.editBtn')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Confirm Section */}
      {confirmStatus.globalActive && (
        <div className={styles.confirmCard}>
          <div className={styles.confirmTitle}>✅ {t('profile.confirmSection')}</div>
          {confirmStatus.userConfirmed || confirmSuccess ? (
            <div className={styles.confirmBanner}>
              ✅ <span>{t('profile.confirmedMsg')} <strong>{confirmStatus.confirmedAt}</strong></span>
            </div>
          ) : (
            <>
              {confirmStatus.hasPending && (
                <div className={styles.confirmWarning}>
                  ⚠️ {t('profile.pendingWarning')}
                </div>
              )}
              <p style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '0.875rem' }}>
                {t('profile.confirmDialog')}
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '1rem' }}>
                ⚠️ {t('profile.confirmWarning')}
              </p>
              <button
                className={styles.confirmBtn}
                onClick={handleConfirm}
                disabled={confirmStatus.hasPending || confirmLoading}
              >
                {confirmLoading ? '⏳' : '✅'} {t('profile.confirmBtn')}
              </button>
            </>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editField && (
        <EditModal
          field={editField}
          dropdownOptions={getDropdownOptions(editField)}
          onClose={() => setEditField(null)}
          onSuccess={handleEditSuccess}
          isOptionalUpload={isOptionalUpload(editField)}
        />
      )}
    </div>
  )
}
