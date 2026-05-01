import type {
  AuthLoginPayload,
  AuthRegisterPayload,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from '@/types/auth.types';
import type { ApiResponse } from '../api-client';
import apiClient from '../api-client';

const ENDPOINTS = {
  REGISTER: '/users/register',
  LOGIN: '/users/login',
  LOGOUT: '/users/logout',
  CURRENT_USER: '/users/current-user',
} as const;

async function register(payload: RegisterRequest): Promise<ApiResponse<AuthRegisterPayload>> {
  const response = await apiClient.post<ApiResponse<AuthRegisterPayload>>(
    ENDPOINTS.REGISTER,
    payload,
  );
  return response.data;
}

async function login(payload: LoginRequest): Promise<ApiResponse<AuthLoginPayload>> {
  const response = await apiClient.post<ApiResponse<AuthLoginPayload>>(ENDPOINTS.LOGIN, payload);
  return response.data;
}

async function logoutSession(): Promise<ApiResponse<Record<string, never>>> {
  const response = await apiClient.post<ApiResponse<Record<string, never>>>(ENDPOINTS.LOGOUT);
  return response.data;
}

async function getCurrentUser(token?: string): Promise<ApiResponse<AuthUser>> {
  const config = token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : undefined;

  const response = await apiClient.get<ApiResponse<AuthUser>>(ENDPOINTS.CURRENT_USER, config);
  return response.data;
}

export const authService = {
  register,
  login,
  logoutSession,
  getCurrentUser,
};
