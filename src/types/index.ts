export interface FieldDetail {
  key: string
  label: string
  value: string
  rawValue: string
  editable: boolean
  inputType: string
  isPending: boolean
  pendingVal: string
}

export interface BaseInfo {
  id: string
  fullName: string
  department: string
  positionCode: string
  email: string
}

export interface ConfirmStatus {
  globalActive: boolean
  userConfirmed: boolean
  confirmedAt: string
  hasPending: boolean
}

export interface Profile {
  baseInfo: BaseInfo
  details: FieldDetail[]
  hasPending: boolean
  confirmStatus: ConfirmStatus
}

export interface FieldConfig {
  fieldName: string
  fieldKey?: string
  isLocked?: boolean
  isOptionalUpload?: boolean
  dropdownOptions?: string[]
}

export interface UpdateRequest {
  id: number
  employeeId: string
  employeeName: string
  fieldLabel: string
  oldValue: string
  newValue: string
  fileUrl: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  adminNote: string
  reviewedAt: string
  createdAt: string
}

export interface CategoryPeriod {
  categoryId: number
  period: string
  feedbackType: string
  customOptions: string
  isPriority: boolean
}

export interface FeedbackState {
  [key: string]: { status: string; note: string }
}

export interface User {
  employeeId: string
  fullName: string
  department: string
  positionCode: string
  email: string
  role: string
}
