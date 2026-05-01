import { request } from '@/api/config/api';
import type { ErrorResult, SuccessResult } from '@/api/config/runtimeTypes';
import { API } from '@/constants/api';
import type { Warehouse } from '@/types/index';

export async function getWarehouses(companyId?: string): Promise<SuccessResult<Warehouse[]> | ErrorResult> {
  const url = companyId ? `${API.WAREHOUSES.LIST}?company_id=${companyId}` : API.WAREHOUSES.LIST;
  return request({ url, method: 'GET' });
}
