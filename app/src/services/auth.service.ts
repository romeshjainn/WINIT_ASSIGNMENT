import apiClient, { ApiResponse } from '@/services/api/api-client';

const ENDPOINTS = {
  LOGIN: '/auth/login',
} as const;

async function login(payload: any): Promise<ApiResponse<any>> {
  const response = await apiClient.post<ApiResponse<any>>(ENDPOINTS.LOGIN, payload);
  return response.data;
}

export const authService = {
  login,
};
