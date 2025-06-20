"use client";

import { useState, useEffect, useRef } from "react";
import { Customer } from "@/types";
import { customersService } from "@/services/customers";
import { Plus, Search, X, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

// Schema walidacji
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

type CustomerFormData = z.infer<typeof customerSchema>;

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Ref do pierwszego pola formularza
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  // Fokus na pierwszym polu gdy modal się otwiera
  useEffect(() => {
    if (isModalOpen && firstFieldRef.current) {
      setTimeout(() => {
        firstFieldRef.current?.focus();
      }, 100);
    }
  }, [isModalOpen]);

  // Zamykanie modala na ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (deleteConfirmId) {
          setDeleteConfirmId(null);
        } else if (isModalOpen) {
          handleCloseModal();
        }
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isModalOpen, deleteConfirmId]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customersService.getAll();
      setCustomers(data);
    } catch (error) {
      console.error("Błąd ładowania klientów:", error);
      toast.error("Nie udało się załadować listy klientów");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setEditingCustomer(null);
    reset();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setIsEditMode(true);
    setEditingCustomer(customer);

    // Wypełnij formularz danymi klienta
    setValue("name", customer.name);
    setValue("phone", customer.phone || "");
    setValue("email", customer.email || "");
    setValue("address", customer.address || "");

    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingCustomer(null);
    reset();
  };

  const onSubmit = async (data: CustomerFormData) => {
    try {
      setIsSubmitting(true);

      if (isEditMode && editingCustomer) {
        // Aktualizacja klienta
        const updatedCustomer = await customersService.update(
          editingCustomer.id,
          data
        );
        setCustomers(
          customers.map((c) =>
            c.id === editingCustomer.id ? updatedCustomer : c
          )
        );
        toast.success("Dane klienta zostały zaktualizowane!");
      } else {
        // Dodawanie nowego klienta
        const newCustomer = await customersService.create(data);
        setCustomers([...customers, newCustomer]);
        toast.success("Klient został dodany pomyślnie!");
      }

      handleCloseModal();
    } catch (error) {
      console.error("Błąd zapisywania klienta:", error);
      toast.error(
        isEditMode
          ? "Nie udało się zaktualizować klienta"
          : "Nie udało się dodać klienta"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setIsDeleting(true);
      await customersService.delete(id);
      setCustomers(customers.filter((c) => c.id !== id));
      toast.success("Klient został usunięty");
      setDeleteConfirmId(null);
    } catch (error: any) {
      console.error("Błąd usuwania klienta:", error);
      const errorMessage = error.response?.data?.detail || "Nie udało się usunąć klienta";
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Klienci</h1>
        <button
          onClick={handleOpenAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus className="h-5 w-5" />
          Dodaj klienta
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Szukaj klienta..."
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
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Imię i nazwisko
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Adres
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {customer.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {customer.phone || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="text-sm text-gray-500">
                      {customer.email || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                    <div className="text-sm text-gray-500">
                      {customer.address || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenEditModal(customer)}
                      className="text-blue-600 hover:text-blue-900 mr-2 p-1"
                      title="Edytuj"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(customer.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Usuń"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Brak klientów do wyświetlenia
            </div>
          )}
        </div>
      )}

      {/* Modal z formularzem */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {isEditMode ? "Edytuj dane klienta" : "Dodaj nowego klienta"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Imię i nazwisko *
                </label>
                <input
                  {...register("name", {
                    setValueAs: (v) => v,
                    onChange: (e) => e.target.value
                  })}
                  // ref={firstFieldRef}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                  placeholder="np. Jan Kowalski"
                  autoFocus={!isEditMode}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Telefon
                </label>
                <input
                  {...register("phone")}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                  placeholder="np. 123456789"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Email
                </label>
                <input
                  {...register("email")}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                  placeholder="np. jan@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Adres
                </label>
                <textarea
                  {...register("address")}
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
                  {isSubmitting
                    ? "Zapisywanie..."
                    : isEditMode
                    ? "Zapisz zmiany"
                    : "Dodaj klienta"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
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
              Czy na pewno chcesz usunąć tego klienta? Tej operacji nie można
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
