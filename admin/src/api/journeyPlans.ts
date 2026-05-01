import { request } from '@/api/config/api';
import type { ErrorResult, SuccessResult } from '@/api/config/runtimeTypes';
import { API } from '@/constants/api';
import type { JourneyPlan, PaginatedResponse } from '@/types/index';

interface JourneyPlanParams {
  date?: string;
  assigned_to?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface CreateModeB {
  plan_name?: string;
  assigned_to: string;
  date: string;
  customers: string[];
}

export async function getJourneyPlans(params: JourneyPlanParams = {}): Promise<SuccessResult<PaginatedResponse<JourneyPlan>> | ErrorResult> {
  const p = new URLSearchParams();
  if (params.date) p.set('date', params.date);
  if (params.assigned_to) p.set('assigned_to', params.assigned_to);
  if (params.status) p.set('status', params.status);
  if (params.page) p.set('page', String(params.page));
  if (params.limit) p.set('limit', String(params.limit));
  return request({ url: `${API.JOURNEY_PLANS.LIST}?${p}`, method: 'GET' });
}

export async function getJourneyPlanById(id: string): Promise<SuccessResult<JourneyPlan> | ErrorResult> {
  return request({ url: API.JOURNEY_PLANS.DETAIL(id), method: 'GET' });
}

export async function createJourneyPlan(data: CreateModeB): Promise<SuccessResult<JourneyPlan> | ErrorResult> {
  return request({ url: API.JOURNEY_PLANS.CREATE, method: 'POST', data });
}

export async function updateJourneyPlan(id: string, data: Partial<JourneyPlan>): Promise<SuccessResult<JourneyPlan> | ErrorResult> {
  return request({ url: API.JOURNEY_PLANS.UPDATE(id), method: 'PUT', data });
}

export async function deleteJourneyPlan(id: string): Promise<SuccessResult<void> | ErrorResult> {
  return request({ url: API.JOURNEY_PLANS.DELETE(id), method: 'DELETE' });
}
