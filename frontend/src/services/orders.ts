import { api } from "@/lib/api";
import { Order, Vehicle, QueueData } from "@/types";

export const ordersService = {
  getAll: async (status?: string): Promise<Order[]> => {
    const params = status ? { status } : {};
    const { data } = await api.get("/api/orders", { params });
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

  update: async (
    id: number,
    order: {
      customer_id: number;
      vehicle_id: number;
      description: string;
      priority: string;
      estimated_cost: number;
    }
  ): Promise<Order> => {
    const { data } = await api.put(`/api/orders/${id}`, order);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/orders/${id}`);
  },

  getQueue: async (): Promise<QueueData> => {
    const { data } = await api.get("/api/queue");
    return data;
  },

  getCustomerVehicles: async (customerId: number): Promise<Vehicle[]> => {
    const { data } = await api.get(`/api/customers/${customerId}/vehicles`);
    return data;
  },

  createVehicle: async (vehicle: {
    customer_id: number;
    brand: string;
    model: string;
    year?: number;
    registration_number: string;
    vin?: string;
  }): Promise<Vehicle> => {
    const { data } = await api.post("/api/vehicles", vehicle);
    return data;
  },
};
