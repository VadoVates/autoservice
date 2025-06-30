import { api } from "@/lib/api";
import { Part, OrderPart } from "@/types";

export const partsService = {
  getAll: async (search?: string, inStockOnly?: boolean): Promise<Part[]> => {
    const params: any = {};
    if (search) params.search = search;
    if (inStockOnly) params.in_stock_only = inStockOnly;

    const { data } = await api.get("/api/parts", { params });
    return data;
  },

  create: async (part: Omit<Part, "id">): Promise<Part> => {
    const { data } = await api.post("/api/parts", part);
    return data;
  },

  update: async (id: number, part: Partial<Omit<Part, "id">>): Promise<Part> => {
    const { data } = await api.put(`/api/parts/${id}`, part);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/parts/${id}`);
  },

  updateStock: async (id: number, quantityChange: number): Promise<Part> => {
    const { data } = await api.put(`/api/parts/${id}/stock`, null, {
      params: { quantity_change: quantityChange }
    });
    return data;
  },

  // Metody dla części w zleceniach
  addToOrder: async (orderId: number, partData: {
    part_id: number;
    quantity: number;
    unit_price?: number;
  }): Promise<OrderPart> => {
    const { data } = await api.post(`/api/orders/${orderId}/parts`, partData);
    return data;
  },

  getOrderParts: async (orderId: number): Promise<{
    order_id: number;
    parts: OrderPart[];
    total_parts_cost: number;
  }> => {
    const { data } = await api.get(`/api/orders/${orderId}/parts`);
    return data;
  },

  removeFromOrder: async (orderId: number, orderPartId: number): Promise<void> => {
    await api.delete(`/api/orders/${orderId}/parts/${orderPartId}`);
  }
};