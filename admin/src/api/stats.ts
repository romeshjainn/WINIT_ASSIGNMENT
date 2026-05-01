import { request } from '@/api/config/api';
import type { ErrorResult, SuccessResult } from '@/api/config/runtimeTypes';
import { API } from '@/constants/api';
import type { Stats } from '@/types/index';

export async function getStats(): Promise<SuccessResult<Stats> | ErrorResult> {
  return request({ url: API.STATS.GET, method: 'GET' });
}
