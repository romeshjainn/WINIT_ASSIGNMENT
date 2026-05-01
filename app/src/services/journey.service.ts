import apiClient from '@/services/api/api-client';

export const journeyService = {
  getTodayPlan: async () => {
    const res = await apiClient.get('/journey-plans/today');
    return res.data;
  },
};
