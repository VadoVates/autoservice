import { api } from "@/lib/api";
import { Order, Vehicle, QueueData } from "@/types";

export const ordersService = {
  getAll: async (): Promise<Order[]> => {
    const { data } = await api.get("/api/orders");
    return data;
  },

  create: async (order: {
    customer_id: number;
    vehicle_id: number;
    description: string;
    priority: string;
    estimated_cost: number;
  }): Promise<Order> => {
    const { data } = await api.post("/api/orders", order);
    return data;
  },

  update: async (id: number, updates: Partial<Order>): Promise<Order> => {
    const { data } = await api.put(`/api/orders/${id}`, updates);
    return data;
  },

  getQueue: async (): Promise<QueueData> => {
    const { data } = await api.get("/api/queue");
    return data;
  },

  getCustomerVehicles: async (customerId: number): Promise<Vehicle[]> => {
    const { data } = await api.get(`/api/customers/${customerId}/vehicles`);
    return data;
  },
};
