import { request } from '@/api/config/api';
import type { ErrorResult, SuccessResult } from '@/api/config/runtimeTypes';
import { API } from '@/constants/api';
import type { Company } from '@/types/index';

export async function getCompanies(): Promise<SuccessResult<Company[]> | ErrorResult> {
  return request({ url: API.COMPANIES.LIST, method: 'GET' });
}
