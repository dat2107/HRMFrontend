import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { adminApi } from '../api/employee'
import type { UpdateRequest } from '../types'
import { STATUS_FILTERS } from '../constants'
import styles from '../css/AdminPage.module.css'

export default function AdminPage() {
  const { t } = useTranslation()

  const [requests, setRequests] = useState<UpdateRequest[]>([])
  const [filter, setFilter] = useState<string>('PENDING')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [rejectModal, setRejectModal] = useState<{ id: number; employeeName: string; fieldLabel: string } | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  useEffect(() => {
    loadRequests()
  }, [filter])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getRequests(filter)
      setRequests(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: number) => {
    if (!confirm(t('admin.approve') + '?')) return
    setActionLoading(id)
    try {
      await adminApi.approve(id)
      toast.success(t('admin.approveSuccess'))
      loadRequests()
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('common.error'))
    } finally {
      setActionLoading(null)
    }
  }

  const openRejectModal = (req: UpdateRequest) => {
    setRejectModal({ id: req.id, employeeName: req.employeeName, fieldLabel: req.fieldLabel })
    setRejectNote('')
  }

  const handleReject = async () => {
    if (!rejectModal) return
    setActionLoading(rejectModal.id)
    try {
      await adminApi.reject(rejectModal.id, rejectNote)
      toast.success(t('admin.rejectSuccess'))
      setRejectModal(null)
      loadRequests()
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('common.error'))
    } finally {
      setActionLoading(null)
    }
  }

  const statusBadge = (status: string) => {
    if (status === 'PENDING') return <span className={styles.badgePending}>{t('admin.statusPending')}</span>
    if (status === 'APPROVED') return <span className={styles.badgeApproved}>{t('admin.statusApproved')}</span>
    return <span className={styles.badgeRejected}>{t('admin.statusRejected')}</span>
  }

  const formatDate = (dt: string) => {
    if (!dt) return '—'
    return new Date(dt).toLocaleString('vi-VN')
  }

  const filterLabel = (f: string) => {
    if (f === 'PENDING') return t('admin.filterPending')
    if (f === 'APPROVED') return t('admin.filterApproved')
    if (f === 'REJECTED') return t('admin.filterRejected')
    return t('admin.filterAll')
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>📋 {t('admin.title')}</h1>

      <div className={styles.filterBar}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter(f)}
          >
            {filterLabel(f)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loading}>⏳ {t('common.loading')}</div>
      ) : requests.length === 0 ? (
        <div className={styles.empty}>{t('admin.noRequests')}</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('admin.colEmployee')}</th>
                <th>{t('admin.colField')}</th>
                <th>{t('admin.colOldValue')}</th>
                <th>{t('admin.colNewValue')}</th>
                <th>{t('admin.colAttachment')}</th>
                <th>{t('admin.colSubmittedAt')}</th>
                <th>{t('admin.colStatus')}</th>
                {filter === 'PENDING' && <th>{t('admin.colActions')}</th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td>
                    <div className={styles.empName}>{req.employeeName}</div>
                    <div className={styles.empId}>{req.employeeId}</div>
                  </td>
                  <td className={styles.fieldLabel}>{req.fieldLabel}</td>
                  <td className={styles.oldVal}>{req.oldValue || '—'}</td>
                  <td className={styles.newVal}>{req.newValue || '—'}</td>
                  <td>
                    {req.fileUrl && req.fileUrl !== 'Không có tệp đính kèm' ? (
                      <a href={req.fileUrl} target="_blank" rel="noreferrer" className={styles.fileLink}>
                        🔗 {t('admin.viewFile')}
                      </a>
                    ) : (
                      <span className={styles.noFile}>{t('admin.noFile')}</span>
                    )}
                  </td>
                  <td className={styles.dateCell}>{formatDate(req.createdAt)}</td>
                  <td>
                    {statusBadge(req.status)}
                    {req.adminNote && (
                      <div className={styles.adminNote}>💬 {req.adminNote}</div>
                    )}
                  </td>
                  {filter === 'PENDING' && (
                    <td>
                      {req.status === 'PENDING' && (
                        <div className={styles.actionBtns}>
                          <button
                            className={styles.approveBtn}
                            onClick={() => handleApprove(req.id)}
                            disabled={actionLoading === req.id}
                          >
                            ✅ {t('admin.approve')}
                          </button>
                          <button
                            className={styles.rejectBtn}
                            onClick={() => openRejectModal(req)}
                            disabled={actionLoading === req.id}
                          >
                            ❌ {t('admin.reject')}
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejectModal && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setRejectModal(null)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <span>❌ {t('admin.rejectTitle')}</span>
              <button className={styles.closeBtn} onClick={() => setRejectModal(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalInfo}>
                <strong>{rejectModal.employeeName}</strong> — {rejectModal.fieldLabel}
              </p>
              <label className={styles.label}>{t('admin.rejectNote')}</label>
              <textarea
                className={styles.textarea}
                rows={4}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder={t('admin.rejectNotePlaceholder')}
              />
              <div className={styles.modalFooter}>
                <button className="btn-secondary" onClick={() => setRejectModal(null)}>
                  {t('common.cancel')}
                </button>
                <button
                  className={styles.rejectConfirmBtn}
                  onClick={handleReject}
                  disabled={actionLoading !== null}
                >
                  {t('admin.rejectConfirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
