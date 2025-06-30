import {useState, useEffect, useCallback} from "react";
import {Part, OrderPart} from "@/types";
import {partsService} from "@/services/parts";
import {X, Plus, Trash2, Package} from "lucide-react";
import toast from "react-hot-toast";
import {AxiosError} from "axios";

interface OrderPartsModalProps {
    orderId: number;
    isOpen: boolean;
    onClose: () => void;
}

export function OrderPartsModal({orderId, isOpen, onClose}: OrderPartsModalProps) {
    const [orderParts, setOrderParts] = useState<OrderPart[]>([]);
    const [availableParts, setAvailableParts] = useState<Part[]>([]);
    const [selectedPartId, setSelectedPartId] = useState("");
    const [quantity, setQuantity] = useState("1");
    const [customPrice, setCustomPrice] = useState("");
    const [useCustomPrice, setUseCustomPrice] = useState(false);
    const [loading, setLoading] = useState(true);
    const [totalCost, setTotalCost] = useState(0);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [partsData, orderPartsData] = await Promise.all([
                partsService.getAll("", true),
                partsService.getOrderParts(orderId),
            ]);

            setAvailableParts(partsData);
            setOrderParts(orderPartsData.parts);
            setTotalCost(orderPartsData.total_parts_cost);
        } catch (error) {
            console.error("Błąd ładowania danych:", error);
            toast.error("Nie udało się załadować danych");
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        if (isOpen) {
            (async () => {
                await loadData();
            })();
        }
    }, [isOpen, loadData]);

    const handleAddPart = async () => {
        if (!selectedPartId) {
            toast.error("Wybierz część");
            return;
        }

        const qty = parseInt(quantity);
        if (isNaN(qty) || qty <= 0) {
            toast.error("Wprowadź poprawną ilość");
            return;
        }

        const part = availableParts.find(p => p.id === parseInt(selectedPartId));
        if (!part) return;

        if (qty > part.stock_quantity) {
            toast.error(`Niewystarczająca ilość na magazynie. Dostępne: ${part.stock_quantity}`);
            return;
        }

        try {
            const partData: {
                part_id: number;
                quantity: number;
                unit_price?: number;
            } = {
                part_id: parseInt(selectedPartId),
                quantity: parseInt(quantity),
            };

            if (useCustomPrice && customPrice) {
                const price = parseFloat(customPrice);
                if (!isNaN(price) && price >= 0) {
                    partData.unit_price = price;
                }
            }

            await partsService.addToOrder(orderId, partData);
            toast.success("Część została dodana do zlecenia");

            // Reset formularza
            setSelectedPartId("");
            setQuantity("1");
            setCustomPrice("");
            setUseCustomPrice(false);

            // Odśwież dane
            await loadData();
        } catch (error) {
            if (error instanceof AxiosError) {
                toast.error(error.response?.data?.detail || "Nie udało się dodać części");
            } else {
                toast.error("Unknown error");
            }
        }
    };

    const handleRemovePart = async (orderPartId: number) => {
        try {
            await partsService.removeFromOrder(orderId, orderPartId);
            toast.success("Część została usunięta ze zlecenia");
            await loadData();
        } catch (error) {
            console.error("Błąd usuwania części:", error);
            toast.error("Nie udało się usunąć części");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto overflow-x-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                        Zarządzanie częściami - Zlecenie #{orderId}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-6 w-6"/>
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-8">
                        <div
                            className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Ładowanie...</p>
                    </div>
                ) : (
                    <>
                        {/* Formularz dodawania części */}
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <h3 className="font-semibold text-gray-900 mb-3">Dodaj część do zlecenia</h3>

                            <div className="flex flex-col md:flex-row gap-4">

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-900 mb-1">
                                        Część
                                    </label>
                                    <select
                                        value={selectedPartId}
                                        onChange={(e) => {
                                            setSelectedPartId(e.target.value);
                                            const part = availableParts.find(p => p.id === parseInt(e.target.value));
                                            if (part && !useCustomPrice) {
                                                setCustomPrice(part.price.toString());
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                    >
                                        <option value="">Wybierz część...</option>
                                        {availableParts.map((part) => (
                                            <option key={part.id} value={part.id}>
                                                {part.code} - {part.name} (Dostępne: {part.stock_quantity})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-1">
                                        Ilość
                                    </label>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        min="1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-1">
                                        Cena jednostkowa
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={customPrice}
                                            onChange={(e) => {
                                                setCustomPrice(e.target.value);
                                                setUseCustomPrice(true);
                                            }}
                                            className="flex-1 max-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                            placeholder="0.00"
                                        />
                                        <button
                                            onClick={handleAddPart}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                                        >
                                            <Plus className="h-5 w-5"/>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {selectedPartId && (
                                <p className="text-xs text-gray-500 mt-2">
                                    Cena katalogowa: {
                                    availableParts.find(p => p.id === parseInt(selectedPartId))?.price.toFixed(2)
                                } PLN
                                </p>
                            )}
                        </div>

                        {/* Lista części w zleceniu */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3">Części w zleceniu</h3>

                            {orderParts.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                    <Package className="h-12 w-12 mx-auto mb-2 text-gray-400"/>
                                    <p>Brak części w tym zleceniu</p>
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Część
                                            </th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Ilość
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Cena jedn.
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Wartość
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Akcje
                                            </th>
                                        </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                        {orderParts.map((orderPart) => (
                                            <tr key={orderPart.id}>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {orderPart.part.code} - {orderPart.part.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Magazyn: {orderPart.part.stock_quantity} szt.
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="text-sm text-gray-900">
                                                        {orderPart.quantity}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-sm text-gray-900">
                                                        {orderPart.unit_price.toFixed(2)} PLN
                                                    </div>
                                                    {orderPart.unit_price !== orderPart.part.current_price && (
                                                        <div className="text-xs text-gray-500">
                                                            (katalog: {orderPart.part.current_price.toFixed(2)} PLN)
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {orderPart.total_price.toFixed(2)} PLN
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleRemovePart(orderPart.id)}
                                                        className="text-red-600 hover:text-red-900 p-1"
                                                        title="Usuń"
                                                    >
                                                        <Trash2 className="h-4 w-4"/>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50">
                                        <tr>
                                            <td colSpan={3}
                                                className="px-6 py-4 text-right font-semibold text-gray-900">
                                                Razem części:
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-gray-900">
                                                {totalCost.toFixed(2)} PLN
                                            </td>
                                            <td></td>
                                        </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}