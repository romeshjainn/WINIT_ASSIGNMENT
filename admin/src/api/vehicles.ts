import { request } from '@/api/config/api';
import type { ErrorResult, SuccessResult } from '@/api/config/runtimeTypes';
import { API } from '@/constants/api';
import type { Vehicle } from '@/types/index';

export async function getVehicles(companyId?: string): Promise<SuccessResult<Vehicle[]> | ErrorResult> {
  const url = companyId ? `${API.VEHICLES.LIST}?company_id=${companyId}` : API.VEHICLES.LIST;
  return request({ url, method: 'GET' });
}
