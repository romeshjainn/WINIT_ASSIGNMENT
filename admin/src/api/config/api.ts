import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { SERVER_URL, TOKEN_KEY } from '@constants/env';
import { UNPROTECTED_ROUTES } from '@constants/routes';

const API = axios.create({
  baseURL: `${SERVER_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - add token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
API.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = UNPROTECTED_ROUTES.LOGIN;
    }
    return Promise.reject(error);
  },
);

export const request = async <T>(config: AxiosRequestConfig) => {
  try {
    const { data } = await API.request<T>(config);
    return { remote: 'success' as const, data };
  } catch (error: any) {
    return {
      remote: 'failure' as const,
      error: { errors: { message: error.response?.data?.message || 'Request failed', data: error.response?.data } },
    };
  }
};

export const requestNoAuth = async <T>(config: AxiosRequestConfig) => {
  try {
    const { data } = await axios.request<T>({
      baseURL: `${SERVER_URL}/api/v1`,
      ...config,
    });
    return { remote: 'success' as const, data };
  } catch (error: any) {
    return {
      remote: 'failure' as const,
      error: { errors: { message: error.response?.data?.message || 'Request failed', data: error.response?.data } },
    };
  }
};
