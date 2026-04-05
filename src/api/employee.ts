import apiClient from './client'

export interface UpdateRequestPayload {
  fieldLabel: string
  newVal: string
  oldVal: string
  fileData?: string
  fileMimeType?: string
  fileName?: string
}

export const employeeApi = {
  getProfile: () =>
    apiClient.get('/api/employee/profile'),

  submitUpdateRequest: (data: UpdateRequestPayload) =>
    apiClient.post('/api/employee/update-request', data),

  submitConfirmation: () =>
    apiClient.post('/api/employee/confirm'),
}

export const configApi = {
  getSystemInfo: () =>
    apiClient.get('/api/config/system'),

  getFieldConfigs: () =>
    apiClient.get('/api/config/fields'),

  getDropdowns: () =>
    apiClient.get('/api/config/dropdowns'),

  getAddress: () =>
    apiClient.get('/api/config/address'),
}

export const adminApi = {
  getRequests: (status = 'PENDING') =>
    apiClient.get(`/api/admin/requests?status=${status}`),

  approve: (id: number) =>
    apiClient.post(`/api/admin/requests/${id}/approve`),

  reject: (id: number, adminNote: string) =>
    apiClient.post(`/api/admin/requests/${id}/reject`, { adminNote }),

  uploadLookupFile: (formData: FormData) =>
    apiClient.post('/api/admin/lookup/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}

export const lookupApi = {
  getCategories: () =>
    apiClient.get('/api/lookup/categories'),

  getCategoryData: (categoryId: number) =>
    apiClient.get(`/api/lookup/categories/${categoryId}/data`),

  getFeedback: (categoryId: number) =>
    apiClient.get(`/api/lookup/feedback/${categoryId}`),

  submitFeedback: (categoryId: number, status: string, note: string) =>
    apiClient.post(`/api/lookup/feedback/${categoryId}`, { status, note }),
}
