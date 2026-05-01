import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';

import API from '@/constants/env';
import { store } from '@/store';

export interface ApiResponse<T = unknown> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface ApiErrorResponse {
  message: string;
  success: false;
  errors?: Record<string, string[]>;
}

// ✅ FIX: do NOT double append version
const apiClient: AxiosInstance = axios.create({
  baseURL: API.BASE_URL, // ✅ no VERSION
  timeout: API.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// 🔥 DEBUG LOG (keep this temporarily)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = store.getState().auth.accessToken;

    if (token && !config.headers.get('Authorization')) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    // 👇 DEBUG (VERY IMPORTANT)
    console.log('👉 METHOD:', config.method?.toUpperCase());
   console.log('👉 URL:', `${config.baseURL ?? ''}${config.url ?? ''}`);
    console.log('👉 DATA:', config.data);

    return config;
  },
  (error: AxiosError): Promise<never> => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    console.log('✅ RESPONSE:', response.data); // debug
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>): Promise<never> => {
    console.log('❌ ERROR:', error?.response?.data || error.message);

    if (error.response?.status === 401) {
      // await store.dispatch(logout());
    }

    return Promise.reject(error);
  },
);

export default apiClient;
