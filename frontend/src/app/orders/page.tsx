"use client";

import {useState, useEffect, useCallback} from "react";
import {Order, Customer, Vehicle} from "@/types";
import {ordersService} from "@/services/orders";
import {customersService} from "@/services/customers";
import {OrderPartsModal} from "@/components/OrderPartsModal";
import {
    Plus,
    Search,
    Car,
    AlertCircle,
    Clock,
    CheckCircle,
    X,
    Pencil,
    Trash2,
    FileText,
    Package
} from "lucide-react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import toast from "react-hot-toast";
import {AxiosError} from "axios";

// Schema walidacji
const orderSchema = z.object({
    customer_id: z.string().min(1, "Wybierz klienta"),
    vehicle_id: z.string().min(1, "Wybierz pojazd"),
    description: z.string().min(10, "Opis musi mieć minimum 10 znaków"),
    priority: z.enum(["normal", "high", "urgent"]),
    estimated_cost: z.string(),
});

type OrderFormData = z.infer<typeof orderSchema>;

const vehicleSchema = z.object({
    brand: z.string().min(1, "Podaj markę"),
    model: z.string().min(1, "Podaj model"),
    year: z.string().optional(),
    registration_number: z.string().min(1, "Podaj numer rejestracyjny"),
    vin: z.string().optional(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
    const [isAddingVehicle, setIsAddingVehicle] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [showInvoiced, setShowInvoiced] = useState(false);
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [invoicingOrder, setInvoicingOrder] = useState<Order | null>(null);
    const [finalCost, setFinalCost] = useState("");
    const [partsModalOpen, setPartsModalOpen] = useState(false);
    const [partsOrderId, setPartsOrderId] = useState<number | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: {errors},
    } = useForm<OrderFormData>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
            priority: "normal",
            estimated_cost: "0",
        },
    });

    const selectedCustomerId = watch("customer_id");

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [ordersData, customersData] = await Promise.all([
                ordersService.getAll(statusFilter || undefined),
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
    }, [statusFilter]);

    useEffect(() => {
        (async () => {
            await loadData();
        })();
    }, [loadData]);

    useEffect(() => {
        (async () => {
            if (selectedCustomerId) {
                await loadVehicles(parseInt(selectedCustomerId));
            } else {
                setVehicles([]);
            }
        })();
    }, [selectedCustomerId]);

    const loadVehicles = async (customerId: number) => {
        try {
            const vehiclesData = await ordersService.getCustomerVehicles(customerId);
            setVehicles(vehiclesData);
        } catch (error) {
            console.error("Błąd ładowania pojazdów:", error);
            setVehicles([]);
        }
    };

    const vehicleForm = useForm<VehicleFormData>({
        resolver: zodResolver(vehicleSchema),
    });

    const onSubmit = async (data: OrderFormData) => {
        try {
            setIsSubmitting(true);

            const orderData = {
                customer_id: parseInt(data.customer_id),
                vehicle_id: parseInt(data.vehicle_id),
                description: data.description,
                priority: data.priority,
                estimated_cost: parseFloat(data.estimated_cost) || 0,
            };

            if (isEditMode && editingOrder) {
                const updatedOrder = await ordersService.update(
                    editingOrder.id,
                    orderData
                );
                setOrders(
                    orders.map((o) => (o.id === editingOrder.id ? updatedOrder : o))
                );
                toast.success("Zlecenie zostało zaktualizowane!");
            } else {
                const newOrder = await ordersService.create(orderData);
                setOrders([newOrder, ...orders]);
                toast.success("Zlecenie zostało utworzone!");
            }

            setIsModalOpen(false);
            reset();
            setIsEditMode(false);
            setEditingOrder(null);
        } catch (error) {
            console.error("Błąd zapisywania zlecenia:", error);
            toast.error(
                isEditMode
                    ? "Nie udało się zaktualizować zlecenia"
                    : "Nie udało się utworzyć zlecenia"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const onSubmitVehicle = async (data: VehicleFormData) => {
        if (!selectedCustomerId) return;

        try {
            setIsAddingVehicle(true);
            const newVehicle = await ordersService.createVehicle({
                customer_id: parseInt(selectedCustomerId),
                brand: data.brand,
                model: data.model,
                year: data.year ? parseInt(data.year) : undefined,
                registration_number: data.registration_number,
                vin: data.vin,
            });

            setVehicles([...vehicles, newVehicle]);
            setValue("vehicle_id", newVehicle.id.toString());
            toast.success("Pojazd został dodany!");
            setIsVehicleModalOpen(false);
            vehicleForm.reset();
        } catch (error: unknown) {
            console.error("Błąd dodawania pojazdu:", error);

            if (error instanceof AxiosError) {
                toast.error(
                    error.response?.data?.detail || "Nie udało się dodać pojazdu"
                );
            } else {
                toast.error("Nieznany błąd przy dodawaniu pojazdu");
            }
        } finally {
            setIsAddingVehicle(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            new: {color: "bg-gray-100 text-gray-800", icon: Clock, text: "Nowe"},
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
        (order) => {
            const matchesSearch =
                order.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.vehicle?.registration_number
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());

            const matchesInvoiced = showInvoiced || order.status !== "invoiced";

            return matchesSearch && matchesInvoiced;
        });

    const handleOpenEditModal = async (order: Order) => {
        setIsEditMode(true);
        setEditingOrder(order);

        reset({
            customer_id: order.customer_id.toString(),
            vehicle_id: order.vehicle_id.toString(),
            description: order.description,
            priority: order.priority,
            estimated_cost: order.estimated_cost.toString(),
        });

        // Załaduj pojazdy dla klienta
        if (order.customer_id) {
            await loadVehicles(order.customer_id);
        }

        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        try {
            setIsDeleting(true);
            await ordersService.delete(id);
            toast.success("Zlecenie zostało usunięte");
            setOrders(orders.filter((o) => o.id !== id));
            setDeleteConfirmId(null);
        } catch (error) {
            console.error("Błąd usuwania zlecenia:", error);
            toast.error("Nie udało się usunąć zlecenia");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleInvoice = async (order: Order) => {
        if (!(order.status === "completed" || order.status === "invoiced")) {
            toast.error("Można wystawić dokument tylko dla zakończonych zleceń");
            return;
        }

        // Otwórz modal z formularzem
        setInvoicingOrder(order);
        setFinalCost(order.final_cost?.toString() || order.estimated_cost.toString());
        setInvoiceModalOpen(true);
    };

    const confirmInvoice = async () => {
        if (!invoicingOrder) return;

        const cost = parseFloat(finalCost);
        if (isNaN(cost) || cost < 0) {
            toast.error("Wprowadź poprawną kwotę");
            return;
        }

        try {
            toast.loading("Generowanie dokumentu...");
            const blob = await ordersService.createInvoice(invoicingOrder.id, {
                final_cost: cost,
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `zlecenie_${invoicingOrder.id}_dokument.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast.dismiss();
            toast.success("Dokument został wygenerowany");

            setInvoiceModalOpen(false);
            setInvoicingOrder(null);
            await loadData();
        } catch (error: unknown) {
            toast.dismiss();
            console.error("Błąd generowania dokumentu:", error);

            if (
                error instanceof AxiosError &&
                error.response?.data instanceof Blob
            ) {
                try {
                    const text = await error.response.data.text();
                    const errorData = JSON.parse(text);
                    toast.error(errorData.detail || "Nie udało się wygenerować dokumentu");
                } catch {
                    toast.error("Nie udało się wygenerować dokumentu");
                }
            } else if (
                error instanceof AxiosError &&
                error.response?.data?.detail
            ) {
                toast.error(error.response.data.detail);
            } else {
                toast.error("Nie udało się wygenerować dokumentu");
            }
        }
    };

    return (
        <div>
            <div className="mb-8 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Zlecenia</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus className="h-5 w-5"/>
                    Nowe zlecenie
                </button>
            </div>
            <div className="mb-6 space-y-4">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5"/>
                        <input
                            type="text"
                            placeholder="Szukaj zlecenia..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    >
                        <option value="">Wszystkie statusy</option>
                        <option value="new">Nowe</option>
                        <option value="in_progress">W realizacji</option>
                        <option value="waiting_for_parts">Oczekuje na części</option>
                        <option value="completed">Zakończone</option>
                        <option value="invoiced">Zafakturowane</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="showInvoiced"
                        checked={showInvoiced}
                        onChange={(e) => setShowInvoiced(e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="showInvoiced" className="text-sm text-gray-700">
                        Pokaż zafakturowane zlecenia
                    </label>
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
                                            <Car className="h-4 w-4"/>
                                            <span>
                        {order.vehicle?.brand} {order.vehicle?.model} -{" "}
                                                {order.vehicle?.registration_number}
                      </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {(order.status === "completed" || order.status === "invoiced")&& (
                                            <button
                                                onClick={() => handleInvoice(order)}
                                                className="text-green-600 hover:text-green-900"
                                                title="Wystaw dokument"
                                            >
                                                <FileText className="h-5 w-5"/>
                                            </button>
                                        )}
                                        <button
                                            onClick={async () => handleOpenEditModal(order)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            <Pencil className="h-5 w-5"/>
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmId(order.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 className="h-5 w-5"/>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setPartsOrderId(order.id);
                                                setPartsModalOpen(true);
                                            }}
                                            className="text-purple-600 hover:text-purple-900 p-1"
                                            title="Zarządzaj częściami"
                                        >
                                            <Package className="h-4 w-4"/>
                                        </button>
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
                      <StatusIcon className="h-3 w-3"/>
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

            {/* Dialog potwierdzenia usunięcia */}
            {deleteConfirmId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-sm w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            Potwierdzenie usunięcia
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Czy na pewno chcesz usunąć to zlecenie? Tej operacji nie można
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

            {/* Modal nowego zlecenia */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                {isEditMode ? "Edytuj zlecenie" : "Nowe zlecenie"}
                            </h2>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    reset();
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <Plus className="h-6 w-6 rotate-45"/>
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
                                    <div>
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
                                        {selectedCustomerId && (
                                            <button
                                                type="button"
                                                onClick={() => setIsVehicleModalOpen(true)}
                                                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                                            >
                                                + Dodaj nowy pojazd
                                            </button>
                                        )}
                                    </div>
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
                                    {isSubmitting
                                        ? "Zapisywanie..."
                                        : isEditMode
                                            ? "Zapisz zmiany"
                                            : "Utwórz zlecenie"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        reset();
                                        setIsEditMode(false);
                                        setEditingOrder(null);
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
            {/* Modal dodawania pojazdu */}
            {isVehicleModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                Dodaj nowy pojazd
                            </h2>
                            <button
                                onClick={() => {
                                    setIsVehicleModalOpen(false);
                                    vehicleForm.reset();
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-6 w-6"/>
                            </button>
                        </div>

                        <form
                            onSubmit={vehicleForm.handleSubmit(onSubmitVehicle)}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Marka *
                                </label>
                                <input
                                    {...vehicleForm.register("brand")}
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    placeholder="np. Corolla"
                                />
                                {vehicleForm.formState.errors.model && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {vehicleForm.formState.errors.model.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Rok produkcji
                                </label>
                                <input
                                    {...vehicleForm.register("year")}
                                    type="number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    placeholder="np. 2020"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Numer rejestracyjny *
                                </label>
                                <input
                                    {...vehicleForm.register("registration_number")}
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    placeholder="np. WA12345"
                                />
                                {vehicleForm.formState.errors.registration_number && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {vehicleForm.formState.errors.registration_number.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Numer VIN
                                </label>
                                <input
                                    {...vehicleForm.register("vin")}
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    placeholder="opcjonalnie"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={isAddingVehicle}
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {isAddingVehicle ? "Dodawanie..." : "Dodaj pojazd"}
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

            {/* Modal potwierdzenia faktury */}
            {invoiceModalOpen && invoicingOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                Wystaw dokument końcowy
                            </h2>
                            <button
                                onClick={() => {
                                    setInvoiceModalOpen(false);
                                    setInvoicingOrder(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-6 w-6"/>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">
                                    <strong>Klient:</strong> {invoicingOrder.customer?.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Pojazd:</strong> {invoicingOrder.vehicle?.brand} {invoicingOrder.vehicle?.model} - {invoicingOrder.vehicle?.registration_number}
                                </p>
                                <p className="text-sm text-gray-600 mt-2">
                                    <strong>Opis prac:</strong> {invoicingOrder.description}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Ostateczna kwota do zapłaty (PLN) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={finalCost}
                                    onChange={(e) => setFinalCost(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                    placeholder="0.00"
                                    autoFocus
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Szacunkowy koszt: {invoicingOrder.estimated_cost.toFixed(2)} PLN
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={confirmInvoice}
                                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
                                >
                                    Generuj dokument
                                </button>
                                <button
                                    onClick={() => {
                                        setInvoiceModalOpen(false);
                                        setInvoicingOrder(null);
                                    }}
                                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
                                >
                                    Anuluj
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {partsModalOpen && partsOrderId && (
                <OrderPartsModal
                    orderId={partsOrderId}
                    isOpen={partsModalOpen}
                    onClose={() => {
                        setPartsModalOpen(false);
                        setPartsOrderId(null);
                    }}
                />
            )}

        </div>
    );
}
