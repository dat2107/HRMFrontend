import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { adminApi, lookupApi } from '../api/employee'
import { useAuth } from '../contexts/AuthContext'
import type { CategoryPeriod, FeedbackState } from '../types'
import { FEEDBACK_TYPES } from '../constants'
import styles from '../css/LookupPage.module.css'

export default function LookupPage() {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()

  const [categories, setCategories] = useState<Record<string, CategoryPeriod[]>>({})
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedbacks, setFeedbacks] = useState<FeedbackState>({})
  const [rejectTarget, setRejectTarget] = useState<{ categoryId: number; rowKey: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [optionTarget, setOptionTarget] = useState<{
    categoryId: number; rowKey: string; options: string[]
  } | null>(null)
  const [selectedOption, setSelectedOption] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [tableData, setTableData] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null)

  const [showUpload, setShowUpload] = useState(false)
  const [uploadCategoryName, setUploadCategoryName] = useState('')
  const [uploadPeriod, setUploadPeriod] = useState('')
  const [uploadFeedbackType, setUploadFeedbackType] = useState('NONE')
  const [uploadCustomOptions, setUploadCustomOptions] = useState('')
  const [uploadIsPriority, setUploadIsPriority] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadCategories = () => {
    lookupApi.getCategories().then((res) => {
      setCategories(res.data.data)
    }).catch(console.error)
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadCategoryName.trim() || !uploadFile) {
      toast.error(t('lookupUpload.required'))
      return
    }
    setUploadLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('categoryName', uploadCategoryName.trim())
      if (uploadPeriod) formData.append('period', uploadPeriod)
      formData.append('feedbackType', uploadFeedbackType)
      if (uploadCustomOptions.trim()) formData.append('customOptions', uploadCustomOptions.trim())
      formData.append('isPriority', String(uploadIsPriority))

      await adminApi.uploadLookupFile(formData)
      toast.success(t('lookupUpload.success'))

      setUploadCategoryName('')
      setUploadPeriod('')
      setUploadFeedbackType('NONE')
      setUploadCustomOptions('')
      setUploadIsPriority(false)
      setUploadFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setShowUpload(false)

      loadCategories()
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('common.error'))
    } finally {
      setUploadLoading(false)
    }
  }

  const currentPeriod = selectedCategory && selectedPeriodIdx !== ''
    ? categories[selectedCategory]?.[parseInt(selectedPeriodIdx)]
    : null

  const handleSearch = async () => {
    if (!currentPeriod) return
    setLoading(true)
    setTableData(null)
    try {
      const [fbRes, dataRes] = await Promise.allSettled([
        lookupApi.getFeedback(currentPeriod.categoryId),
        lookupApi.getCategoryData(currentPeriod.categoryId),
      ])

      if (fbRes.status === 'fulfilled') {
        const fb = fbRes.value.data.data
        setFeedbacks((prev) => ({
          ...prev,
          [currentPeriod.categoryId]: { status: fb.status, note: fb.note },
        }))
      }

      if (dataRes.status === 'fulfilled') {
        const d = dataRes.value.data.data
        if (d.headers && d.headers.length > 0) setTableData(d)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmFeedback = async (categoryId: number) => {
    setSubmitting(true)
    try {
      await lookupApi.submitFeedback(categoryId, 'Xác nhận đúng', '')
      setFeedbacks((prev) => ({ ...prev, [categoryId]: { status: 'Xác nhận đúng', note: '' } }))
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleRejectSubmit = async () => {
    if (!rejectTarget || !rejectReason.trim()) return
    setSubmitting(true)
    try {
      await lookupApi.submitFeedback(rejectTarget.categoryId, 'Xác nhận CHƯA ĐÚNG', rejectReason)
      setFeedbacks((prev) => ({
        ...prev,
        [rejectTarget.categoryId]: { status: 'Xác nhận CHƯA ĐÚNG', note: rejectReason },
      }))
      setRejectTarget(null)
      setRejectReason('')
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleOptionSubmit = async () => {
    if (!optionTarget || !selectedOption) return
    setSubmitting(true)
    try {
      await lookupApi.submitFeedback(optionTarget.categoryId, selectedOption, 'Đã chọn phương án')
      setFeedbacks((prev) => ({
        ...prev,
        [optionTarget.categoryId]: { status: selectedOption, note: 'Đã chọn phương án' },
      }))
      setOptionTarget(null)
      setSelectedOption('')
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  const renderFeedbackControls = (period: CategoryPeriod) => {
    const fb = feedbacks[period.categoryId]
    const type = period.feedbackType?.toUpperCase()

    if (fb?.status) {
      return (
        <div className={styles.feedbackCell}>
          <span className={styles.feedbackStatus}>✅ {fb.status}</span>
          {fb.note && <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{fb.note}</span>}
        </div>
      )
    }

    if (type === 'CONFIRM') {
      return (
        <div className={styles.feedbackBtns}>
          <button
            className={`${styles.feedbackBtn} ${styles.feedbackBtnConfirm}`}
            onClick={() => handleConfirmFeedback(period.categoryId)}
            disabled={submitting}
          >
            ✅ {t('lookup.feedbackConfirm')}
          </button>
          <button
            className={`${styles.feedbackBtn} ${styles.feedbackBtnReject}`}
            onClick={() => setRejectTarget({ categoryId: period.categoryId, rowKey: String(period.categoryId) })}
          >
            ❌ {t('lookup.feedbackReject')}
          </button>
        </div>
      )
    }

    if (type === 'CUSTOM' && period.customOptions) {
      const options = period.customOptions.split('|').map((s) => s.trim()).filter(Boolean)
      return (
        <button
          className={`${styles.feedbackBtn} ${styles.feedbackBtnConfirm}`}
          onClick={() => setOptionTarget({ categoryId: period.categoryId, rowKey: String(period.categoryId), options })}
        >
          📋 {t('lookup.feedbackOption')}
        </button>
      )
    }

    return null
  }

  return (
    <div>
      <div className={styles.pageTitleRow}>
        <h1 className={styles.pageTitle}>🔍 {t('lookup.title')}</h1>
        {isAdmin && (
          <button className={styles.uploadToggleBtn} onClick={() => setShowUpload((v) => !v)}>
            📤 {t('lookupUpload.title')}
          </button>
        )}
      </div>

      {isAdmin && showUpload && (
        <div className={styles.uploadCard}>
          <div className={styles.uploadCardHeader}>📤 {t('lookupUpload.title')}</div>
          <form onSubmit={handleUpload} className={styles.uploadForm}>
            <div className={styles.uploadRow}>
              <div className={styles.uploadGroup}>
                <label className={styles.uploadLabel}>{t('lookupUpload.categoryName')} *</label>
                <input
                  className="input-field"
                  type="text"
                  value={uploadCategoryName}
                  onChange={(e) => setUploadCategoryName(e.target.value)}
                  placeholder={t('lookupUpload.categoryNamePlaceholder')}
                  required
                />
              </div>
              <div className={styles.uploadGroup}>
                <label className={styles.uploadLabel}>{t('lookupUpload.period')}</label>
                <input
                  className="input-field"
                  type="date"
                  value={uploadPeriod}
                  onChange={(e) => setUploadPeriod(e.target.value)}
                />
              </div>
              <div className={styles.uploadGroup}>
                <label className={styles.uploadLabel}>{t('lookupUpload.feedbackType')}</label>
                <select
                  className="input-field"
                  value={uploadFeedbackType}
                  onChange={(e) => setUploadFeedbackType(e.target.value)}
                >
                  {FEEDBACK_TYPES.map((ft) => (
                    <option key={ft} value={ft}>
                      {ft === 'NONE' ? t('lookupUpload.feedbackNone')
                        : ft === 'CONFIRM' ? t('lookupUpload.feedbackConfirm')
                        : t('lookupUpload.feedbackCustom')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {uploadFeedbackType === 'CUSTOM' && (
              <div className={styles.uploadGroup} style={{ marginBottom: '0.75rem' }}>
                <label className={styles.uploadLabel}>{t('lookupUpload.customOptions')}</label>
                <input
                  className="input-field"
                  type="text"
                  value={uploadCustomOptions}
                  onChange={(e) => setUploadCustomOptions(e.target.value)}
                  placeholder={t('lookupUpload.customOptionsPlaceholder')}
                />
              </div>
            )}

            <div className={styles.uploadRow}>
              <div className={styles.uploadGroup} style={{ flex: 2 }}>
                <label className={styles.uploadLabel}>{t('lookupUpload.file')} *</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className={styles.fileInput}
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className={styles.uploadGroup} style={{ flex: 'none', alignSelf: 'flex-end' }}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={uploadIsPriority}
                    onChange={(e) => setUploadIsPriority(e.target.checked)}
                  />
                  {t('lookupUpload.isPriority')}
                </label>
              </div>
            </div>

            <div className={styles.uploadFooter}>
              <button type="button" className="btn-secondary" onClick={() => setShowUpload(false)}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="btn-primary" disabled={uploadLoading}>
                {uploadLoading ? t('common.loading') : `📤 ${t('lookupUpload.submit')}`}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.searchCard}>
        <div className={styles.searchRow}>
          <div className={styles.searchGroup}>
            <label className={styles.searchLabel}>{t('lookup.title')}</label>
            <select
              className="input-field"
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setSelectedPeriodIdx('') }}
            >
              <option value="">{t('lookup.selectCategory')}</option>
              {Object.keys(categories).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className={styles.searchGroup}>
            <label className={styles.searchLabel}>{t('lookup.selectPeriod')}</label>
            <select
              className="input-field"
              value={selectedPeriodIdx}
              onChange={(e) => setSelectedPeriodIdx(e.target.value)}
              disabled={!selectedCategory}
            >
              <option value="">{t('lookup.selectPeriod')}</option>
              {selectedCategory && categories[selectedCategory]?.map((p, idx) => (
                <option key={p.categoryId} value={idx}>{p.period}</option>
              ))}
            </select>
          </div>

          <button className="btn-primary" onClick={handleSearch} disabled={!currentPeriod || loading}>
            {loading ? t('common.loading') : t('lookup.searchBtn')}
          </button>
        </div>
      </div>

      {currentPeriod && (
        <div className={styles.resultsCard}>
          <div className={styles.resultsHeader}>
            <span className={styles.resultsTitle}>
              📊 {selectedCategory} — {currentPeriod.period}
            </span>
            {renderFeedbackControls(currentPeriod)}
          </div>

          {loading && <div className={styles.tableLoading}>⏳ {t('common.loading')}</div>}

          {!loading && tableData && tableData.headers.length > 0 && (
            tableData.rows.length === 0 ? (
              <div className={styles.noData}>{t('lookup.noData')}</div>
            ) : (
              tableData.rows.map((row, idx) => (
                <div key={idx} className={styles.kvCard}>
                  {tableData.headers.map((h) => (
                    <div key={h} className={styles.kvRow}>
                      <span className={styles.kvLabel}>{h}</span>
                      <span className={styles.kvValue}>{row[h] ?? '—'}</span>
                    </div>
                  ))}
                </div>
              ))
            )
          )}

          {!loading && !tableData && <div className={styles.noData}>{t('lookup.noData')}</div>}
        </div>
      )}

      {rejectTarget && (
        <div className={styles.rejectOverlay}>
          <div className={styles.rejectModal}>
            <div className={styles.rejectTitle}>❌ {t('lookup.feedbackReject')}</div>
            <textarea
              className={styles.rejectTextarea}
              placeholder={t('lookup.rejectPlaceholder')}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className={styles.rejectFooter}>
              <button className="btn-secondary" onClick={() => { setRejectTarget(null); setRejectReason('') }}>
                {t('common.cancel')}
              </button>
              <button
                className="btn-danger"
                onClick={handleRejectSubmit}
                disabled={!rejectReason.trim() || submitting}
              >
                {submitting ? t('common.loading') : t('lookup.feedbackSubmit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {optionTarget && (
        <div className={styles.rejectOverlay}>
          <div className={styles.rejectModal}>
            <div className={styles.rejectTitle}>📋 {t('lookup.feedbackOption')}</div>
            <div className={styles.optionGroup}>
              {optionTarget.options.map((opt) => (
                <label key={opt} className={styles.optionLabel}>
                  <input
                    type="radio"
                    name="option"
                    value={opt}
                    checked={selectedOption === opt}
                    onChange={() => setSelectedOption(opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
            <div className={styles.rejectFooter}>
              <button className="btn-secondary" onClick={() => { setOptionTarget(null); setSelectedOption('') }}>
                {t('common.cancel')}
              </button>
              <button
                className="btn-primary"
                onClick={handleOptionSubmit}
                disabled={!selectedOption || submitting}
              >
                {submitting ? t('common.loading') : t('lookup.feedbackSubmit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
