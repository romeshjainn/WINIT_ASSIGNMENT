import { request } from '@/api/config/api';
import type { ErrorResult, SuccessResult } from '@/api/config/runtimeTypes';
import { API } from '@/constants/api';
import type { Route } from '@/types/index';

export interface CreateRoutePayload {
  route_name: string;
  route_code: string;
  valid_from: string;
  valid_to: string;
  status: string;
  company_id: string;
  warehouse_id?: string;
  vehicle_id?: string;
  role?: string;
  primary_employee_id?: string;
  frequency: string;
  customers: {
    customer_id: string;
    duration?: number;
    scheduled_time?: string;
    priority?: string;
    order_index: number;
  }[];
}

export async function getRoutes(): Promise<SuccessResult<Route[]> | ErrorResult> {
  return request({ url: API.ROUTES.LIST, method: 'GET' });
}

export async function getRoute(id: string): Promise<SuccessResult<Route> | ErrorResult> {
  return request({ url: API.ROUTES.DETAIL(id), method: 'GET' });
}

export async function createRoute(data: CreateRoutePayload): Promise<SuccessResult<{ id: string }> | ErrorResult> {
  return request({ url: API.ROUTES.CREATE, method: 'POST', data });
}

export async function updateRoute(id: string, data: Partial<Route>): Promise<SuccessResult<Route> | ErrorResult> {
  return request({ url: API.ROUTES.UPDATE(id), method: 'PUT', data });
}

export async function deleteRoute(id: string): Promise<SuccessResult<void> | ErrorResult> {
  return request({ url: API.ROUTES.DELETE(id), method: 'DELETE' });
}
