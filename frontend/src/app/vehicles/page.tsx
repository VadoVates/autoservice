"use client";

import { useState, useEffect, useRef } from "react";
import { Vehicle, Customer } from "@/types";
import { vehiclesService } from "@/services/vehicles";
import { customersService } from "@/services/customers";
import { Plus, Search, X, Pencil, Trash2, Car, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

// Schema walidacji pojazdu
const vehicleSchema = z.object({
  customer_id: z.string().min(1, "Wybierz właściciela"),
  brand: z.string().min(2, "Marka musi mieć minimum 2 znaki"),
  model: z.string().min(1, "Model jest wymagany"),
  year: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const year = parseInt(val);
      const currentYear = new Date().getFullYear();
      return year >= 1900 && year <= currentYear + 1;
    }, {
    message: `Rok musi być między 1900 a ${new Date().getFullYear() + 1}`
  }),
  registration_number: z.string().min(1, "Numer rejestracyjny jest wymagany"),
  vin: z.string().optional(),
});

// Schema walidacji klienta
const customerSchema = z.object({
  name: z.string().min(3, "Imię i nazwisko musi mieć minimum 3 znaki"),
  phone: z
    .string()
    .regex(/^\d{9}$/, "Numer telefonu musi mieć 9 cyfr")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("Nieprawidłowy adres email")
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;
type CustomerFormData = z.infer<typeof customerSchema>;

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Forms
  const vehicleForm = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
  });

  const customerForm = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vehiclesData, customersData] = await Promise.all([
        vehiclesService.getAll(),
        customersService.getAll(),
      ]);
      setVehicles(vehiclesData);
      setCustomers(customersData);
    } catch (error) {
      console.error("Błąd ładowania danych:", error);
      toast.error("Nie udało się załadować danych");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddVehicleModal = () => {
    setIsEditMode(false);
    setEditingVehicle(null);
    vehicleForm.reset();
    setIsVehicleModalOpen(true);
  };

  const handleOpenEditVehicleModal = (vehicle: Vehicle) => {
    setIsEditMode(true);
    setEditingVehicle(vehicle);
    vehicleForm.reset({
      customer_id: vehicle.customer_id.toString(),
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year?.toString() || "",
      registration_number: vehicle.registration_number,
      vin: vehicle.vin || "",
    });
    setIsVehicleModalOpen(true);
  };

  const onSubmitVehicle = async (data: VehicleFormData) => {
    try {
      setIsSubmitting(true);

      const vehicleData = {
        customer_id: parseInt(data.customer_id),
        brand: data.brand,
        model: data.model,
        year: data.year ? parseInt(data.year) : undefined,
        registration_number: data.registration_number,
        vin: data.vin || undefined,
      };

      if (isEditMode && editingVehicle) {
        await vehiclesService.update(editingVehicle.id, vehicleData);
        toast.success("Pojazd został zaktualizowany!");
      } else {
        await vehiclesService.create(vehicleData);
        toast.success("Pojazd został dodany!");
      }

      await loadData();
      setIsVehicleModalOpen(false);
      vehicleForm.reset();
    } catch (error: any) {
      console.error("Błąd zapisywania pojazdu:", error);
      toast.error(
        error.response?.data?.detail || "Nie udało się zapisać pojazdu"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitCustomer = async (data: CustomerFormData) => {
    try {
      setIsSubmitting(true);
      const newCustomer = await customersService.create(data);
      setCustomers([...customers, newCustomer]);
      vehicleForm.setValue("customer_id", newCustomer.id.toString());
      toast.success("Klient został dodany!");
      setIsCustomerModalOpen(false);
      customerForm.reset();
    } catch (error) {
      console.error("Błąd dodawania klienta:", error);
      toast.error("Nie udało się dodać klienta");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setIsDeleting(true);
      await vehiclesService.delete(id);
      toast.success("Pojazd został usunięty");
      await loadData();
      setDeleteConfirmId(null);
    } catch (error: any) {
      console.error("Błąd usuwania pojazdu:", error);
      toast.error(
        error.response?.data?.detail || "Nie udało się usunąć pojazdu"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.registration_number
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      vehicle.owner?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Pojazdy</h1>
        <button
          onClick={handleOpenAddVehicleModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus className="h-5 w-5" />
          Dodaj pojazd
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Szukaj pojazdu..."
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <Car className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {vehicle.year || "Rok nieznany"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenEditVehicleModal(vehicle)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="Edytuj"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(vehicle.id)}
                    className="text-red-600 hover:text-red-900 p-1"
                    title="Usuń"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-900">
                  <span className="font-medium">Nr rejestracyjny:</span>
                  <span className="text-gray-700">
                    {vehicle.registration_number}
                  </span>
                </div>

                {vehicle.vin && (
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <span className="font-medium">VIN:</span>
                    <span className="text-gray-700 text-xs">{vehicle.vin}</span>
                  </div>
                )}

                <div className="pt-3 mt-3 border-t">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">
                        {vehicle.owner?.name || "Brak właściciela"}
                      </p>
                      {vehicle.owner?.phone && (
                        <p className="text-gray-500">{vehicle.owner.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredVehicles.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          Brak pojazdów do wyświetlenia
        </div>
      )}

      {/* Modal dodawania/edycji pojazdu */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {isEditMode ? "Edytuj pojazd" : "Dodaj nowy pojazd"}
              </h2>
              <button
                onClick={() => {
                  setIsVehicleModalOpen(false);
                  vehicleForm.reset();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form
              onSubmit={vehicleForm.handleSubmit(onSubmitVehicle)}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Właściciel *
                </label>
                <div className="flex gap-2">
                  <select
                    {...vehicleForm.register("customer_id")}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="">Wybierz właściciela...</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}{" "}
                        {customer.phone && `(${customer.phone})`}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    title="Dodaj nowego klienta"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                {vehicleForm.formState.errors.customer_id && (
                  <p className="mt-1 text-sm text-red-600">
                    {vehicleForm.formState.errors.customer_id.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Marka *
                  </label>
                  <input
                    {...vehicleForm.register("brand")}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                    placeholder="np. Toyota"
                  />
                  {vehicleForm.formState.errors.brand && (
                    <p className="mt-1 text-sm text-red-600">
                      {vehicleForm.formState.errors.brand.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Model *
                  </label>
                  <input
                    {...vehicleForm.register("model")}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                    placeholder="np. Corolla"
                  />
                  {vehicleForm.formState.errors.model && (
                    <p className="mt-1 text-sm text-red-600">
                      {vehicleForm.formState.errors.model.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Rok produkcji
                  </label>
                  <input
                    {...vehicleForm.register("year")}
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                    placeholder="np. 2020"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Nr rejestracyjny *
                  </label>
                  <input
                    {...vehicleForm.register("registration_number")}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                    placeholder="np. WA12345"
                  />
                  {vehicleForm.formState.errors.registration_number && (
                    <p className="mt-1 text-sm text-red-600">
                      {vehicleForm.formState.errors.registration_number.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Numer VIN
                </label>
                <input
                  {...vehicleForm.register("vin")}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                  placeholder="np. 1HGBH41JXMN109186"
                  maxLength={17}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Zapisywanie..."
                    : isEditMode
                    ? "Zapisz zmiany"
                    : "Dodaj pojazd"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsVehicleModalOpen(false);
                    vehicleForm.reset();
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

      {/* Modal dodawania klienta */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Dodaj nowego klienta
              </h2>
              <button
                onClick={() => {
                  setIsCustomerModalOpen(false);
                  customerForm.reset();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form
              onSubmit={customerForm.handleSubmit(onSubmitCustomer)}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Imię i nazwisko *
                </label>
                <input
                  {...customerForm.register("name")}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                  placeholder="np. Jan Kowalski"
                  autoFocus
                />
                {customerForm.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {customerForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Telefon
                </label>
                <input
                  {...customerForm.register("phone")}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                  placeholder="np. 123456789"
                />
                {customerForm.formState.errors.phone && (
                  <p className="mt-1 text-sm text-red-600">
                    {customerForm.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Email
                </label>
                <input
                  {...customerForm.register("email")}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                  placeholder="np. jan@example.com"
                />
                {customerForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {customerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Adres
                </label>
                <textarea
                  {...customerForm.register("address")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                  rows={3}
                  placeholder="np. ul. Przykładowa 1, 00-000 Warszawa"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Dodawanie..." : "Dodaj klienta"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomerModalOpen(false);
                    customerForm.reset();
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

      {/* Dialog potwierdzenia usunięcia */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Potwierdzenie usunięcia
            </h3>
            <p className="text-gray-600 mb-6">
              Czy na pewno chcesz usunąć ten pojazd? Tej operacji nie można
              cofnąć.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isDeleting}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {isDeleting ? "Usuwanie..." : "Usuń"}
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
