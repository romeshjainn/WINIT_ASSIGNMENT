import apiClient from '@/services/api/api-client';

export const visitService = {
  updateStatus: (id: string, status: string) => {
    return apiClient.put(`/visits/${id}/status`, { status });
  },

  markVisited: (id: string) => {
    return apiClient.put(`/visits/${id}/complete`);
  },

  updateNotes: (id: string, notes: string) => {
    return apiClient.put(`/visits/${id}/notes`, { notes });
  },

  updateSalesOrder: (id: string, sales_order: string) => {
    return apiClient.put(`/visits/${id}/sales-order`, { sales_order });
  },
};
