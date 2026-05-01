import { request } from '@/api/config/api';
import type { ErrorResult, SuccessResult } from '@/api/config/runtimeTypes';
import { API } from '@/constants/api';
import type { Customer, PaginatedResponse } from '@/types/index';

export async function getCustomers({ companyId, warehouseId, search = '', page = 1, limit = 10 }: {
  companyId?: string; warehouseId?: string; search?: string; page?: number; limit?: number;
}): Promise<SuccessResult<PaginatedResponse<Customer>> | ErrorResult> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), search });
  if (companyId) params.set('company_id', companyId);
  if (warehouseId) params.set('warehouse_id', warehouseId);
  return request({ url: `${API.CUSTOMERS.LIST}?${params}`, method: 'GET' });
}

export async function getCustomerById(id: string): Promise<SuccessResult<Customer> | ErrorResult> {
  return request({ url: API.CUSTOMERS.DETAIL(id), method: 'GET' });
}

export async function createCustomer(data: Partial<Customer>): Promise<SuccessResult<Customer> | ErrorResult> {
  return request({ url: API.CUSTOMERS.CREATE, method: 'POST', data });
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<SuccessResult<Customer> | ErrorResult> {
  return request({ url: API.CUSTOMERS.UPDATE(id), method: 'PUT', data });
}

export async function deleteCustomer(id: string): Promise<SuccessResult<void> | ErrorResult> {
  return request({ url: API.CUSTOMERS.DELETE(id), method: 'DELETE' });
}

export async function importCustomersCSV(file: File): Promise<SuccessResult<{ imported: number }> | ErrorResult> {
  const formData = new FormData();
  formData.append('file', file);
  return request({ url: API.CUSTOMERS.IMPORT, method: 'POST', data: formData, headers: { 'Content-Type': 'multipart/form-data' } });
}

export async function exportCustomersCSV(companyId?: string, warehouseId?: string): Promise<void> {
  const params = new URLSearchParams();
  if (companyId) params.set('company_id', companyId);
  if (warehouseId) params.set('warehouse_id', warehouseId);
  const base = (import.meta.env.VITE_API_KEY || 'http://localhost:3002') + '/api/v1';
  const url = `${base}${API.CUSTOMERS.EXPORT}?${params}`;
  const token = localStorage.getItem('auth_token');
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'customers.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}
