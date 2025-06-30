"use client";

import {useState, useEffect, useCallback} from "react";
import {Part} from "@/types";
import {partsService} from "@/services/parts";
import {Plus, Search, Package, Pencil, Trash2, TrendingUp, TrendingDown, X} from "lucide-react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {AxiosError} from "axios";
import toast from "react-hot-toast";

const partSchema = z.object({
    code: z.string().min(1, "Kod części jest wymagany"),
    name: z.string().min(3, "Nazwa musi mieć minimum 3 znaki"),
    description: z.string().optional(),
    price: z.string().refine((val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
    }, "Cena musi być liczbą dodatnią"),
    stock_quantity: z.string().refine((val) => {
        const num = parseInt(val);
        return !isNaN(num) && num >= 0;
    }, "Ilość musi być liczbą nieujemną"),
});

type PartFormData = z.infer<typeof partSchema>;

export default function PartsPage() {
    const [parts, setParts] = useState<Part[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [inStockOnly, setInStockOnly] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingPart, setEditingPart] = useState<Part | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [stockModalOpen, setStockModalOpen] = useState(false);
    const [stockPart, setStockPart] = useState<Part | null>(null);
    const [stockChange, setStockChange] = useState("");

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: {errors},
    } = useForm<PartFormData>({
        resolver: zodResolver(partSchema),
    });
    const loadParts = useCallback(async () => {
        try {
            setLoading(true);
            const data = await partsService.getAll(searchTerm, inStockOnly);
            setParts(data);
        } catch (error) {
            console.error("Błąd ładowania części:", error);
            toast.error("Nie udało się załadować listy części");
        } finally {
            setLoading(false);
        }
    }, [searchTerm, inStockOnly]);

    useEffect(() => {
        (async () => {
            await loadParts();
        })();
    }, [loadParts]);

    const handleOpenAddModal = () => {
        setIsEditMode(false);
        setEditingPart(null);
        reset({
            code: "",
            name: "",
            description: "",
            price: "0",
            stock_quantity: "0",
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (part: Part) => {
        setIsEditMode(true);
        setEditingPart(part);
        setValue("code", part.code);
        setValue("name", part.name);
        setValue("description", part.description || "");
        setValue("price", part.price.toString());
        setValue("stock_quantity", part.stock_quantity.toString());
        setIsModalOpen(true);
    };

    const onSubmit = async (data: PartFormData) => {
        try {
            setIsSubmitting(true);

            const partData = {
                code: data.code,
                name: data.name,
                description: data.description || undefined,
                price: parseFloat(data.price),
                stock_quantity: parseInt(data.stock_quantity),
            };

            if (isEditMode && editingPart) {
                await partsService.update(editingPart.id, partData);
                toast.success("Część została zaktualizowana!");
            } else {
                await partsService.create(partData);
                toast.success("Część została dodana!");
            }

            await loadParts();
            setIsModalOpen(false);
            reset();
        } catch (error: unknown) {
            setIsSubmitting(false);

            if (error instanceof AxiosError) {
                toast.error(error.response?.data?.detail || "Nie udało się zapisać części");
            } else {
                toast.error("Nieznany błąd");
            }

            console.error("Błąd zapisywania części:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            setIsDeleting(true);
            await partsService.delete(id);
            toast.success("Część została usunięta");
            await loadParts();
            setDeleteConfirmId(null);
        } catch (error: unknown) {
            console.error("Błąd usuwania części:", error);

            if (error instanceof AxiosError) {
                toast.error(
                    error.response?.data?.detail || "Nie udało się usunąć części"
                );
            } else {
                toast.error("Nieznany błąd przy usuwaniu części");
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const handleStockUpdate = async () => {
        if (!stockPart || !stockChange) return;

        const change = parseInt(stockChange);
        if (isNaN(change)) {
            toast.error("Wprowadź poprawną liczbę");
            return;
        }

        try {
            await partsService.updateStock(stockPart.id, change);
            toast.success("Stan magazynowy został zaktualizowany");
            await loadParts();
            setStockModalOpen(false);
            setStockPart(null);
            setStockChange("");
        } catch (error: unknown) {
            console.error("Błąd aktualizacji stanu:", error);

            if (error instanceof AxiosError) {
                toast.error(
                    error.response?.data?.detail || "Nie udało się zaktualizować stanu"
                );
            } else {
                toast.error("Nieznany błąd przy aktualizacji stanu");
            }
        }
    };

    const openStockModal = (part: Part) => {
        setStockPart(part);
        setStockChange("");
        setStockModalOpen(true);
    };

    const filteredParts = parts.filter(
        (part) =>
            part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            part.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="mb-8 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Części zamienne</h1>
                <button
                    onClick={handleOpenAddModal}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus className="h-5 w-5"/>
                    Dodaj część
                </button>
            </div>

            <div className="mb-6 space-y-4">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5"/>
                        <input
                            type="text"
                            placeholder="Szukaj części..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="inStockOnly"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="inStockOnly" className="text-sm text-gray-700">
                        Pokaż tylko dostępne na magazynie
                    </label>
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
                                Kod
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nazwa
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                                Opis
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cena
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stan magazynowy
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Akcje
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filteredParts.map((part) => (
                            <tr key={part.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {part.code}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{part.name}</div>
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell">
                                    <div className="text-sm text-gray-500 max-w-xs truncate">
                                        {part.description || "-"}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="text-sm font-medium text-gray-900">
                                        {part.price.toFixed(2)} PLN
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <div className="flex items-center justify-center gap-2">
                      <span
                          className={`text-sm font-medium ${
                              part.stock_quantity > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                          }`}
                      >
                        {part.stock_quantity}
                      </span>
                                        <button
                                            onClick={() => openStockModal(part)}
                                            className="text-blue-600 hover:text-blue-900 p-1"
                                            title="Zmień stan magazynowy"
                                        >
                                            <Package className="h-4 w-4"/>
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleOpenEditModal(part)}
                                        className="text-blue-600 hover:text-blue-900 mr-2 p-1"
                                        title="Edytuj"
                                    >
                                        <Pencil className="h-4 w-4"/>
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirmId(part.id)}
                                        className="text-red-600 hover:text-red-900 p-1"
                                        title="Usuń"
                                    >
                                        <Trash2 className="h-4 w-4"/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {filteredParts.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            Brak części do wyświetlenia
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
                                {isEditMode ? "Edytuj część" : "Dodaj nową część"}
                            </h2>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    reset();
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-6 w-6"/>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Kod części *
                                </label>
                                <input
                                    {...register("code")}
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                                    placeholder="np. BR-001"
                                />
                                {errors.code && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.code.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Nazwa *
                                </label>
                                <input
                                    {...register("name")}
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                                    placeholder="np. Klocki hamulcowe przód"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Opis
                                </label>
                                <textarea
                                    {...register("description")}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                                    rows={3}
                                    placeholder="Opcjonalny opis części..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-1">
                                        Cena (PLN) *
                                    </label>
                                    <input
                                        {...register("price")}
                                        type="number"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                                        placeholder="0.00"
                                    />
                                    {errors.price && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.price.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-1">
                                        Ilość na magazynie *
                                    </label>
                                    <input
                                        {...register("stock_quantity")}
                                        type="number"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder:text-gray-400"
                                        placeholder="0"
                                    />
                                    {errors.stock_quantity && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.stock_quantity.message}
                                        </p>
                                    )}
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
                                            : "Dodaj część"}
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

            {/* Modal aktualizacji stanu magazynowego */}
            {stockModalOpen && stockPart && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-sm w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            Zmiana stanu magazynowego
                        </h3>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                <strong>Część:</strong> {stockPart.name}
                            </p>
                            <p className="text-sm text-gray-600">
                                <strong>Obecny stan:</strong> {stockPart.stock_quantity}
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-900 mb-1">
                                Zmiana ilości
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setStockChange("-1")}
                                    className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                                    title="Zmniejsz o 1"
                                >
                                    <TrendingDown className="h-4 w-4"/>
                                </button>
                                <input
                                    type="number"
                                    value={stockChange}
                                    onChange={(e) => setStockChange(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-center"
                                    placeholder="np. +5 lub -3"
                                />
                                <button
                                    onClick={() => setStockChange("+1")}
                                    className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200"
                                    title="Zwiększ o 1"
                                >
                                    <TrendingUp className="h-4 w-4"/>
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Użyj + aby dodać, - aby odjąć (np. +10, -5)
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleStockUpdate}
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                            >
                                Zaktualizuj
                            </button>
                            <button
                                onClick={() => {
                                    setStockModalOpen(false);
                                    setStockPart(null);
                                    setStockChange("");
                                }}
                                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
                            >
                                Anuluj
                            </button>
                        </div>
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
                            Czy na pewno chcesz usunąć tę część? Tej operacji nie można
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