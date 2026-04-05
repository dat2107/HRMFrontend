import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Inject token vào mọi request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('hrm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  // i18n: gửi Accept-Language header
  const lang = localStorage.getItem('hrm_lang') || 'vi'
  const localeMap: Record<string, string> = { vi: 'vi', en: 'en', jp: 'jp' }
  config.headers['Accept-Language'] = localeMap[lang] || 'vi'

  return config
})

// Tự động logout khi token hết hạn
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hrm_token')
      localStorage.removeItem('hrm_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default apiClient
