import { requestNoAuth } from '@/api/config/api';
import type { ErrorResult, SuccessResult } from '@api/config/runtimeTypes';
import { API } from '@/constants/api';

export async function login(username: string, password: string): Promise<SuccessResult<{ token: string; user: { id: string; name: string; role: string } }> | ErrorResult> {
  return requestNoAuth({ url: API.AUTH.LOGIN, method: 'POST', data: { username, password } });
}
