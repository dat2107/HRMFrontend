import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { employeeApi, configApi } from '../api/employee'
import EditModal from '../components/EditModal/EditModal'
import AddressPairModal from '../components/AddressPairModal/AddressPairModal'
import type { FieldDetail, Profile, FieldConfig } from '../types'
import styles from '../css/DashboardPage.module.css'

// Keys thuộc cặp địa chỉ — luôn phải sửa cùng nhau
const ADDRESS_PAIRS = [
  { provinceKey: 'province', districtKey: 'district' },
  { provinceKey: 'tempProvince', districtKey: 'tempDistrict' },
] as const
const ADDRESS_FIELD_KEYS = new Set(ADDRESS_PAIRS.flatMap((p) => [p.provinceKey, p.districtKey]))

export default function DashboardPage() {
  const { t } = useTranslation()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [dropdowns, setDropdowns] = useState<Record<string, string[]>>({})
  const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>([])
  const [addressConfig, setAddressConfig] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [editField, setEditField] = useState<FieldDetail | null>(null)
  const [editAddressPair, setEditAddressPair] = useState<{
    province: FieldDetail; district: FieldDetail
  } | null>(null)
  const [selectingField, setSelectingField] = useState(false)
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
      const e = err as { response?: { data?: any; status?: number } }
      console.error('Chi tiết lỗi:', e.response?.data)
    } finally {
      setLoading(false)
    }

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
            ? { ...d, isPending: true, pendingVal: newVal }
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
      toast.error(e.response?.data?.message || t('common.error'))
    } finally {
      setConfirmLoading(false)
    }
  }

  const getDropdownOptions = (field: FieldDetail): string[] => {
    return dropdowns[field.label] || []
  }

  const isOptionalUpload = (field: FieldDetail): boolean => {
    const fc = fieldConfigs.find((f) => f.fieldName === field.label)
    return fc?.optionalUpload ?? false
  }

  if (loading) return <div className={styles.loading}>⏳ {t('common.loading')}</div>
  if (!profile) return null

  const { baseInfo, details, confirmStatus } = profile
  const canEdit = !confirmStatus.userConfirmed && !confirmSuccess

  // Fields có thể sửa đơn lẻ (không thuộc cặp địa chỉ)
  const editableFields = details.filter(
    (f) => f.editable && !f.isPending && !ADDRESS_FIELD_KEYS.has(f.key)
  )

  // Cặp địa chỉ: chỉ hiện nếu cả 2 field editable và chưa pending
  const editableAddressPairs = ADDRESS_PAIRS.map((pair) => ({
    province: details.find((f) => f.key === pair.provinceKey),
    district: details.find((f) => f.key === pair.districtKey),
  })).filter(
    (p): p is { province: FieldDetail; district: FieldDetail } =>
      !!p.province && !!p.district &&
      (p.province.editable || p.district.editable) &&
      !p.province.isPending && !p.district.isPending
  )

  const hasEditableItems = editableFields.length > 0 || editableAddressPairs.length > 0

  return (
    <div>
      <h1 className={styles.pageTitle}>👤 {t('profile.title')}</h1>

      {/* Base info card */}
      <div className={styles.baseInfoCard}>
        <div className={styles.avatar}>👤</div>
        <div className={styles.baseInfoText}>
          <h2>{baseInfo.fullName}</h2>
          <p>🪪 {baseInfo.id} | 🏢 {baseInfo.department || '—'}</p>
          <p>📋 {baseInfo.positionCode || '—'} | ✉️ {baseInfo.email || '—'}</p>
        </div>
      </div>

      {/* Details section */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <span>📋 {t('profile.title')}</span>
          {canEdit && hasEditableItems && (
            <button className={styles.editBtn} onClick={() => setSelectingField(true)}>
              ✏️ {t('profile.editBtn')}
            </button>
          )}
        </div>

        <div className={styles.fieldsGrid}>
          {details.map((field) => (
            <div key={field.key} className={styles.fieldCard}>
              <div className={styles.fieldLabel}>{field.label}</div>
              <div className={styles.fieldValue}>
                {field.isPending ? (
                  <div className={styles.pendingValue}>
                    <span className={styles.oldVal}>{field.value || '—'}</span>
                    <span className={styles.newVal}>→ {field.pendingVal}</span>
                  </div>
                ) : (
                  field.value || '—'
                )}
              </div>
              <div className={styles.fieldBadge}>
                {!field.editable ? (
                  <span className="badge-locked">🔒 {t('profile.lockedBadge')}</span>
                ) : field.isPending ? (
                  <span className="badge-pending">🕐 {t('profile.pendingBadge')}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm section */}
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

      {/* Field picker modal */}
      {selectingField && (
        <div className={styles.pickerOverlay} onClick={(e) => e.target === e.currentTarget && setSelectingField(false)}>
          <div className={styles.pickerModal}>
            <div className={styles.pickerHeader}>
              <span>✏️ {t('profile.editBtn')} — {t('editModal.field')}</span>
              <button className={styles.pickerClose} onClick={() => setSelectingField(false)}>✕</button>
            </div>
            <div className={styles.pickerList}>
              {/* Normal fields */}
              {editableFields.map((field) => (
                <button
                  key={field.key}
                  className={styles.pickerItem}
                  onClick={() => { setEditField(field); setSelectingField(false) }}
                >
                  <span className={styles.pickerItemLabel}>{field.label}</span>
                  <span className={styles.pickerItemValue}>{field.value || '—'}</span>
                </button>
              ))}

              {/* Address pairs */}
              {editableAddressPairs.map((pair) => (
                <button
                  key={pair.province.key}
                  className={`${styles.pickerItem} ${styles.pickerItemAddress}`}
                  onClick={() => { setEditAddressPair(pair); setSelectingField(false) }}
                >
                  <div className={styles.pickerAddressLeft}>
                    <span className={styles.pickerItemLabel}>
                      📍 {pair.province.label} + {pair.district.label}
                    </span>
                    <span className={styles.pickerAddressHint}>Phải sửa cùng nhau</span>
                  </div>
                  <div className={styles.pickerAddressValues}>
                    <span>{pair.province.value || '—'}</span>
                    <span>{pair.district.value || '—'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Single field edit modal */}
      {editField && (
        <EditModal
          field={editField}
          dropdownOptions={getDropdownOptions(editField)}
          onClose={() => setEditField(null)}
          onSuccess={handleEditSuccess}
          isOptionalUpload={isOptionalUpload(editField)}
        />
      )}

      {/* Address pair edit modal */}
      {editAddressPair && (
        <AddressPairModal
          provinceField={editAddressPair.province}
          districtField={editAddressPair.district}
          addressConfig={addressConfig}
          onClose={() => setEditAddressPair(null)}
          onSuccess={handleEditSuccess}
          isOptionalUpload={
            isOptionalUpload(editAddressPair.province) && isOptionalUpload(editAddressPair.district)
          }
        />
      )}
    </div>
  )
}
