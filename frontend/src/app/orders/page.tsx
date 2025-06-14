"use client";

import { useState, useEffect } from "react";
import { Order, Customer, Vehicle } from "@/types";
import { ordersService } from "@/services/orders";
import { customersService } from "@/services/customers";
import {
  Plus,
  Search,
  Car,
  AlertCircle,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

// Schema walidacji
const orderSchema = z.object({
  customer_id: z.string().min(1, "Wybierz klienta"),
  vehicle_id: z.string().min(1, "Wybierz pojazd"),
  description: z.string().min(10, "Opis musi mieć minimum 10 znaków"),
  priority: z.enum(["normal", "high", "urgent"]),
  estimated_cost: z.preprocess(
    (val) => (typeof val === "string" ? parseFloat(val) : val),
    z.number().min(0)
  ),
});

type OrderFormData = z.infer<typeof orderSchema>;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      priority: "normal",
      estimated_cost: 0,
    },
  });

  const selectedCustomerId = watch("customer_id");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      loadVehicles(parseInt(selectedCustomerId));
    } else {
      setVehicles([]);
    }
  }, [selectedCustomerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, customersData] = await Promise.all([
        ordersService.getAll(),
        customersService.getAll(),
      ]);
      setOrders(ordersData);
      setCustomers(customersData);
    } catch (error) {
      console.error("Błąd ładowania danych:", error);
      toast.error("Nie udało się załadować danych");
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async (customerId: number) => {
    try {
      const vehiclesData = await ordersService.getCustomerVehicles(customerId);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error("Błąd ładowania pojazdów:", error);
      setVehicles([]);
    }
  };

  const onSubmit = async (data: OrderFormData) => {
    try {
      setIsSubmitting(true);
      const newOrder = await ordersService.create({
        customer_id: parseInt(data.customer_id),
        vehicle_id: parseInt(data.vehicle_id),
        description: data.description,
        priority: data.priority,
        estimated_cost: data.estimated_cost,
      });

      setOrders([newOrder, ...orders]);
      toast.success("Zlecenie zostało utworzone!");
      setIsModalOpen(false);
      reset();
    } catch (error) {
      console.error("Błąd tworzenia zlecenia:", error);
      toast.error("Nie udało się utworzyć zlecenia");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      new: { color: "bg-gray-100 text-gray-800", icon: Clock, text: "Nowe" },
      in_progress: {
        color: "bg-blue-100 text-blue-800",
        icon: Clock,
        text: "W realizacji",
      },
      waiting_for_parts: {
        color: "bg-yellow-100 text-yellow-800",
        icon: AlertCircle,
        text: "Oczekuje na części",
      },
      completed: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        text: "Zakończone",
      },
      invoiced: {
        color: "bg-purple-100 text-purple-800",
        icon: CheckCircle,
        text: "Zafakturowane",
      },
    };
    return badges[status as keyof typeof badges] || badges.new;
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      normal: "bg-gray-200 text-gray-700",
      high: "bg-orange-200 text-orange-700",
      urgent: "bg-red-200 text-red-700",
    };
    return badges[priority as keyof typeof badges] || badges.normal;
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vehicle?.registration_number
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );
    
  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Zlecenia</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus className="h-5 w-5" />
          Nowe zlecenie
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Szukaj zlecenia..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Ładowanie...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusBadge = getStatusBadge(order.status);
            const StatusIcon = statusBadge.icon;

            return (
              <div key={order.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {order.customer?.name || "Nieznany klient"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      <Car className="h-4 w-4" />
                      <span>
                        {order.vehicle?.brand} {order.vehicle?.model} -{" "}
                        {order.vehicle?.registration_number}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBadge(
                        order.priority
                      )}`}
                    >
                      {order.priority === "normal"
                        ? "Normalny"
                        : order.priority === "high"
                        ? "Wysoki"
                        : "Pilny"}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${statusBadge.color}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusBadge.text}
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{order.description}</p>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">
                    Utworzono:{" "}
                    {new Date(order.created_at).toLocaleDateString("pl-PL")}
                  </span>
                  <span className="font-medium text-gray-900">
                    Szacunkowy koszt: {order.estimated_cost.toFixed(2)} zł
                  </span>
                </div>
              </div>
            );
          })}

          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Brak zleceń do wyświetlenia
            </div>
          )}
        </div>
      )}

      {/* Modal nowego zlecenia */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Nowe zlecenie</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  reset();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <Plus className="h-6 w-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Klient *
                  </label>
                  <select
                    {...register("customer_id")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="">Wybierz klienta...</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}{" "}
                        {customer.phone && `(${customer.phone})`}
                      </option>
                    ))}
                  </select>
                  {errors.customer_id && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.customer_id.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Pojazd *
                  </label>
                  <select
                    {...register("vehicle_id")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white disabled:bg-gray-100"
                    disabled={!selectedCustomerId}
                  >
                    <option value="">
                      {selectedCustomerId
                        ? "Wybierz pojazd..."
                        : "Najpierw wybierz klienta"}
                    </option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.brand} {vehicle.model} -{" "}
                        {vehicle.registration_number}
                      </option>
                    ))}
                  </select>
                  {errors.vehicle_id && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.vehicle_id.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Opis usterki *
                </label>
                <textarea
                  {...register("description")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                  rows={4}
                  placeholder="Opisz usterkę i zakres prac do wykonania..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Priorytet
                  </label>
                  <select
                    {...register("priority")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="normal">Normalny</option>
                    <option value="high">Wysoki</option>
                    <option value="urgent">Pilny</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Szacunkowy koszt (zł)
                  </label>
                  <input
                    {...register("estimated_cost")}
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Tworzenie..." : "Utwórz zlecenie"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    reset();
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
                >
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
