import { httpClient } from '@/shared/lib/http_client'

export interface Tenant {
  id: number
  name: string
  plan_type: 'BASIC' | 'PRO' | 'PLUS'
  is_active: boolean
}

export interface Manager {
  id: number
  name: string
  email: string
  tenant_id: number
  is_active: boolean
}

export interface TenantAnalyticsItem {
  id: number
  name: string
  plan_type: string
  is_active: boolean
  total_revenue: number
  month_revenue: number
  year_revenue: number
  sales_count: number
  ticket_average: number
  employee_count: number
}

export interface GlobalAnalyticsResponse {
  tenants: TenantAnalyticsItem[]
  overall_average_ticket: number
}

export const getTenants = (): Promise<Tenant[]> =>
  httpClient.get('/v1/admin/tenants').then((res) => res.data)
export const createTenant = (data: { name: string; plan_type: string }): Promise<Tenant> =>
  httpClient.post('/v1/admin/tenants', data).then((res) => res.data)
export const deleteTenant = (tenantId: number): Promise<void> =>
  httpClient.delete(`/v1/admin/tenants/${tenantId}`).then((res) => res.data)
export const getGlobalAnalytics = (): Promise<GlobalAnalyticsResponse> =>
  httpClient.get('/v1/admin/analytics/global').then((res) => res.data)
export const exportAnalytics = (tenantId?: string): Promise<{ data: Blob }> =>
  httpClient.get('/v1/admin/analytics/export', {
    params: { tenant_id: tenantId },
    responseType: 'blob',
  })

export const getManagers = (): Promise<Manager[]> =>
  httpClient.get('/v1/admin/managers').then((res) => res.data)
export const createManager = (data: {
  name: string
  email: string
  password: string
  tenant_id: number
}): Promise<Manager> => httpClient.post('/v1/admin/managers', data).then((res) => res.data)
export const deleteManager = (employeeId: number): Promise<void> =>
  httpClient.delete(`/v1/admin/managers/${employeeId}`).then((res) => res.data)
export const updateTenant = (
  tenantId: number,
  data: { name?: string; plan_type?: 'BASIC' | 'PRO' | 'PLUS'; is_active?: boolean },
): Promise<Tenant> =>
  httpClient.patch(`/v1/admin/tenants/${tenantId}`, data).then((res) => res.data)
export const updateManager = (
  employeeId: number,
  data: { name?: string; email?: string; tenant_id?: number; is_active?: boolean },
): Promise<Manager> =>
  httpClient.patch(`/v1/admin/managers/${employeeId}`, data).then((res) => res.data)
