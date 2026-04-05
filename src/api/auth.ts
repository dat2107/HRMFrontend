import apiClient from './client'

export interface LoginPayload {
  employeeId: string
  password: string
}

export interface ChangePasswordPayload {
  oldPassword: string
  newPassword: string
}

export interface ForgotPasswordPayload {
  employeeId: string
  email: string
}

export const authApi = {
  login: (data: LoginPayload) =>
    apiClient.post('/api/auth/login', data),

  logout: () =>
    apiClient.post('/api/auth/logout'),

  changePassword: (data: ChangePasswordPayload) =>
    apiClient.put('/api/auth/change-password', data),

  forgotPassword: (data: ForgotPasswordPayload) =>
    apiClient.post('/api/auth/forgot-password', data),
}
