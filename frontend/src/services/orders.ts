import {api} from "@/lib/api";
import {Order, Vehicle, QueueData} from "@/types";

type OrderUpdatePayload = {
  customer_id: number;
  vehicle_id: number;
  description: string;
  priority: string;
  estimated_cost: number;
  status?: string;
  work_station_id?: number | null;
};

export const ordersService = {
    create: async (order: {
        customer_id: number;
        vehicle_id: number;
        description: string;
        priority: string;
        estimated_cost: number;
    }): Promise<Order> => {
        const {data} = await api.post("/api/orders", order);
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
        const {data} = await api.post("/api/vehicles", vehicle);
        return data;
    },

    createInvoice: async (id: number, invoiceData: { final_cost: number }): Promise<Blob> => {
        const response = await api.post(`/api/orders/${id}/invoice`, invoiceData, {
            responseType: 'blob'
        });
        return response.data;
    },

    getAll: async (status?: string): Promise<Order[]> => {
        const params = status ? {status} : {};
        const {data} = await api.get("/api/orders", {params});
        return data;
    },

    getCustomerVehicles: async (customerId: number): Promise<Vehicle[]> => {
        const {data} = await api.get(`/api/customers/${customerId}/vehicles`);
        return data;
    },

    getQueue: async (): Promise<QueueData> => {
        const {data} = await api.get("/api/queue");
        return data;
    },


update: async (id: number, order: OrderUpdatePayload): Promise<Order> => {
  const { data } = await api.put(`/api/orders/${id}`, order);
  return data;
},

    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/orders/${id}`);
    },

    patch: async (
        id: number,
        updates: Partial<{
            status: string;
            work_station_id: number | null;
        }>
    ): Promise<Order> => {
        const {data} = await api.patch(`/api/orders/${id}`, updates);
        return data;
    },
};
