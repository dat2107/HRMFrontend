export const STORAGE_KEYS = {
  TOKEN: 'hrm_token',
  USER: 'hrm_user',
  LANG: 'hrm_lang',
} as const

export const ROUTES = {
  LOGIN: '/login',
  CHANGE_PASSWORD: '/change-password',
  DASHBOARD: '/dashboard',
  LOOKUP: '/lookup',
  ADMIN: '/admin',
} as const

// Language options dùng trong LoginPage (label đầy đủ)
export const LANGS = [
  { code: 'vi', label: 'Việt' },
  { code: 'en', label: 'EN' },
  { code: 'jp', label: '日本語' },
] as const

// Language options dùng trong Layout navbar (label ngắn)
export const LANGS_SHORT = [
  { code: 'vi', label: 'VI' },
  { code: 'en', label: 'EN' },
  { code: 'jp', label: 'JP' },
] as const

export const STATUS_FILTERS = ['PENDING', 'ALL', 'APPROVED', 'REJECTED'] as const

export const FEEDBACK_TYPES = ['NONE', 'CONFIRM', 'CUSTOM'] as const

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'] as const
