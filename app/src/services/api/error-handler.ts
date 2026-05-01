import { isAxiosError } from 'axios';
import type { ApiErrorResponse } from './api-client';


export interface AppError {
  message: string;
  status: number | null;
  errors: Record<string, string[]> | null;
  isNetworkError: boolean;
  isTimeout: boolean;
  isClientError: boolean;
  isServerError: boolean;
}

const FALLBACK_MESSAGES: Record<number, string> = {
  400: 'The request was invalid. Please check your input.',
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'A conflict occurred. The resource may already exist.',
  422: 'Validation failed. Please check the highlighted fields.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'A server error occurred. Please try again later.',
  502: 'The server is temporarily unavailable. Please try again.',
  503: 'The service is currently unavailable. Please try again later.',
};

const DEFAULT_MESSAGE = 'Something went wrong. Please try again.';
const NETWORK_MESSAGE = 'No internet connection. Please check your network.';
const TIMEOUT_MESSAGE = 'The request timed out. Please try again.';

export function handleApiError(error: unknown): AppError {
  if (isAxiosError<ApiErrorResponse>(error)) {
    if (!error.response) {
      const isTimeout = error.code === 'ECONNABORTED';
      return {
        message: isTimeout ? TIMEOUT_MESSAGE : NETWORK_MESSAGE,
        status: null,
        errors: null,
        isNetworkError: !isTimeout,
        isTimeout,
        isClientError: false,
        isServerError: false,
      };
    }

    const { status, data } = error.response;
    const serverMessage = data?.message;
    const serverErrors = data?.errors ?? null;

    return {
      message: serverMessage || FALLBACK_MESSAGES[status] || DEFAULT_MESSAGE,
      status,
      errors: serverErrors,
      isNetworkError: false,
      isTimeout: false,
      isClientError: status >= 400 && status < 500,
      isServerError: status >= 500,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || DEFAULT_MESSAGE,
      status: null,
      errors: null,
      isNetworkError: false,
      isTimeout: false,
      isClientError: false,
      isServerError: false,
    };
  }

  return {
    message: DEFAULT_MESSAGE,
    status: null,
    errors: null,
    isNetworkError: false,
    isTimeout: false,
    isClientError: false,
    isServerError: false,
  };
}

export function getFieldError(
  appError: AppError,
  field: string,
): string | null {
  return appError.errors?.[field]?.[0] ?? null;
}
