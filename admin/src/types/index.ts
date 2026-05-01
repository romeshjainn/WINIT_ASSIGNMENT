import type { Role } from '@/constants/roles';
import type { RouteStatus, VisitStatus } from '@/constants/status';
import type { Frequency } from '@/constants/frequency';

export interface Company {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  company_id: string;
  created_at: string;
}

export interface Vehicle {
  id: string;
  name: string;
  plate_number: string;
  company_id: string;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  phone?: string;
  created_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  customer_code: string;
  address?: string;
  contact_number?: string;
  location_route?: string;
  company_id: string;
  warehouse_id?: string;
  company_name?: string;
  warehouse_name?: string;
  created_at?: string;
}

export interface RouteCustomer {
  id?: string;
  customer_id: string;
  name?: string;
  customer_code?: string;
  address?: string;
  duration?: number;
  scheduled_time?: string;
  priority?: string;
  order_index?: number;
}

export interface Route {
  id: string;
  route_name: string;
  route_code: string;
  valid_from: string;
  valid_to: string;
  status: RouteStatus;
  company_id: string;
  warehouse_id?: string;
  vehicle_id?: string;
  role?: string;
  primary_employee_id?: string;
  frequency: Frequency;
  created_by?: string;
  created_at: string;
  company_name?: string;
  warehouse_name?: string;
  vehicle_name?: string;
  primary_employee_name?: string;
  customers?: RouteCustomer[];
}

export interface JourneyPlan {
  id: string;
  plan_name?: string;
  route_id?: string;
  assigned_to: string;
  date: string;
  status: 'active' | 'inactive';
  created_by?: string;
  created_at: string;
  assigned_to_name?: string;
  assigned_to_username?: string;
  route_name?: string;
  route_code?: string;
  total_visits?: number;
  completed_visits?: number;
}

export interface Visit {
  id: string;
  journey_plan_id: string;
  customer_id: string;
  van_sales_user_id: string;
  status: VisitStatus;
  notes?: string;
  sales_order?: string;
  visited_at?: string;
  created_at: string;
  name?: string;
  customer_code?: string;
  address?: string;
  contact_number?: string;
  location_route?: string;
}

export interface Stats {
  routes: { total: number; active: number };
  customers: { total: number };
  van_sales_users: { total: number };
  journey_plans: { total: number; today: number };
  visits: { total: number; completed: number; pending: number };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
