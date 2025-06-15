import { api } from "@/lib/api";
import { Vehicle } from "@/types";

export const vehiclesService = {
  getAll: async (): Promise<Vehicle[]> => {
    const { data } = await api.get("/api/vehicles");
    return data;
  },

  create: async (vehicle: Omit<Vehicle, "id">): Promise<Vehicle> => {
    const { data } = await api.post("/api/vehicles", vehicle);
    return data;
  },

  update: async (
    id: number,
    vehicle: Omit<Vehicle, "id">
  ): Promise<Vehicle> => {
    const { data } = await api.put(`/api/vehicles/${id}`, vehicle);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/vehicles/${id}`);
  },
};
