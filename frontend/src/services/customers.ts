import { api } from "@/lib/api";
import { Customer } from "@/types";

export const customersService = {
  getAll: async (): Promise<Customer[]> => {
    const { data } = await api.get("/api/customers");
    return data;
  },

  getById: async (id: number): Promise<Customer> => {
    const { data } = await api.get(`/api/customers/${id}`);
    return data;
  },

  create: async (
    customer: Omit<Customer, "id" | "created_at">
  ): Promise<Customer> => {
    const { data } = await api.post("/api/customers", customer);
    return data;
  },
};
