import { api } from "@/lib/api";

export interface DashboardStats {
  total_customers: number;
  total_vehicles: number;
  total_orders: number;
  active_orders: number;
  orders_in_queue: number;
  completed_today: number;
  priority_stats: {
    normal: number;
    high: number;
    urgent: number;
  };
  station_1_busy: boolean;
  station_2_busy: boolean;
  revenue_today: number;
  revenue_month: number;
  recent_orders: Array<{
    id: number;
    customer_name: string;
    vehicle: string;
    status: string;
    priority: string;
    created_at: string;
  }>;
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get("/api/dashboard/stats");
    return data;
  },
};
