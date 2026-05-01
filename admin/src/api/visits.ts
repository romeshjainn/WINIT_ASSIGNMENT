import { request } from '@/api/config/api';
import type { ErrorResult, SuccessResult } from '@/api/config/runtimeTypes';
import { API } from '@/constants/api';
import type { Visit } from '@/types/index';
import type { VisitStatus } from '@/constants/status';

export async function getVisits(journeyPlanId: string): Promise<SuccessResult<Visit[]> | ErrorResult> {
  return request({ url: `${API.VISITS.LIST}?journey_plan_id=${journeyPlanId}`, method: 'GET' });
}

export async function markVisitComplete(id: string): Promise<SuccessResult<Visit> | ErrorResult> {
  return request({ url: API.VISITS.COMPLETE(id), method: 'PUT' });
}

export async function updateVisitNotes(id: string, notes: string): Promise<SuccessResult<Visit> | ErrorResult> {
  return request({ url: API.VISITS.NOTES(id), method: 'PUT', data: { notes } });
}

export async function updateVisitSalesOrder(id: string, salesOrder: string): Promise<SuccessResult<Visit> | ErrorResult> {
  return request({ url: API.VISITS.SALES_ORDER(id), method: 'PUT', data: { sales_order: salesOrder } });
}

export async function updateVisitStatus(id: string, status: VisitStatus): Promise<SuccessResult<Visit> | ErrorResult> {
  return request({ url: API.VISITS.STATUS(id), method: 'PUT', data: { status } });
}
