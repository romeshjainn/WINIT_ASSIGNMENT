import { request } from '@/api/config/api';
import type { ErrorResult, SuccessResult } from '@/api/config/runtimeTypes';
import { API } from '@/constants/api';
import type { User } from '@/types/index';

export async function getUsers(role?: string): Promise<SuccessResult<User[]> | ErrorResult> {
  const url = role ? `${API.USERS.LIST}?role=${role}` : API.USERS.LIST;
  return request({ url, method: 'GET' });
}

export async function getUserById(id: string): Promise<SuccessResult<User> | ErrorResult> {
  return request({ url: API.USERS.DETAIL(id), method: 'GET' });
}

export async function createUser(data: { username: string; password: string; name: string; role: string; phone?: string }): Promise<SuccessResult<User> | ErrorResult> {
  return request({ url: API.USERS.CREATE, method: 'POST', data });
}

export async function updateUser(id: string, data: { name?: string; phone?: string; password?: string }): Promise<SuccessResult<User> | ErrorResult> {
  return request({ url: API.USERS.UPDATE(id), method: 'PUT', data });
}

export async function deleteUser(id: string): Promise<SuccessResult<void> | ErrorResult> {
  return request({ url: API.USERS.DELETE(id), method: 'DELETE' });
}
