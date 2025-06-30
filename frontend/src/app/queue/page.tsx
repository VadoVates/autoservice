"use client";

import { useState, useEffect } from "react";
import { Order, QueueData } from "@/types";
import { ordersService } from "@/services/orders";
import { Car, Clock, AlertTriangle, RefreshCw, Package } from "lucide-react";
import toast from "react-hot-toast";

type OrderUpdatePayload = {
  work_station_id?: number | null;
  status?: "new" | "in_progress" | "waiting_for_parts" | "completed";
};

export default function QueuePage() {
  const [queueData, setQueueData] = useState<QueueData>({
    station_1: [],
    station_2: [],
    waiting: [],
    waiting_for_parts: [],
  });
  const [loading, setLoading] = useState(true);
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadQueue();
    // Auto-refresh co 30 sekund
    const interval = setInterval(loadQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadQueue = async () => {
    try {
      if (!loading) setRefreshing(true);
      const data = await ordersService.getQueue();
      setQueueData(data);
    } catch (error) {
      console.error("Błąd ładowania kolejki:", error);
      toast.error("Nie udało się załadować kolejki");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, order: Order) => {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (
    e: React.DragEvent,
    targetType: "station" | "waiting" | "waiting_for_parts" | "completed",
    targetStation?: number
  ) => {
    e.preventDefault();

    if (!draggedOrder) return;

    try {
      const updates: OrderUpdatePayload = {};

      if (targetType === "station" && targetStation) {
        updates.work_station_id = targetStation;
        if (draggedOrder.status === "new" || draggedOrder.status == "waiting_for_parts") {
          updates.status = "in_progress";
        }
      }
      else if (targetType === "waiting") {
        updates.work_station_id = null;
        updates.status = "new";
      }
      else if (targetType === "waiting_for_parts") {
        updates.work_station_id = null;
        updates.status = "waiting_for_parts";
      }
      else if (targetType === "completed") {
        updates.work_station_id = null;
        updates.status = "completed";
      }

      await ordersService.patch(draggedOrder.id, updates);
      toast.success("Zlecenie zostało przeniesione");
      await loadQueue();
    } catch (error) {
      console.error("Błąd przenoszenia zlecenia:", error);
      toast.error("Nie udało się przenieść zlecenia");
    }

    setDraggedOrder(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "border-red-500 bg-red-50";
      case "high":
        return "border-orange-500 bg-orange-50";
      default:
        return "border-gray-300 bg-white";
    }
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, order)}
      className={`p-4 rounded-lg border-2 cursor-move transition-all hover:shadow-md ${getPriorityColor(
        order.priority
      )}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-900">{order.customer?.name}</h4>
        {order.priority !== "normal" && (
          <AlertTriangle
            className={`h-4 w-4 ${
              order.priority === "urgent" ? "text-red-600" : "text-orange-600"
            }`}
          />
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <Car className="h-4 w-4" />
        <span>{order.vehicle?.registration_number}</span>
      </div>

      <p className="text-sm text-gray-700 line-clamp-2">{order.description}</p>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>{new Date(order.created_at).toLocaleString("pl-PL")}</span>
        </div>
        {order.status === "waiting_for_parts" && (
          <div className="flex items-center gap-1 text-xs text-yellow-600">
            <Package className="h-3 w-3" />
            <span>Części</span>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Ładowanie kolejki...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Kolejka napraw</h1>
        <button
          onClick={loadQueue}
          disabled={refreshing}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition disabled:opacity-50"
        >
          <RefreshCw
            className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
          />
          Odśwież
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Stanowisko 1 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-4 text-center bg-blue-600 text-white py-2 rounded">
            Stanowisko 1
          </h3>
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, "station", 1)}
            className="min-h-[400px] space-y-3"
          >
            {queueData.station_1.length === 0 ? (
              <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-300 rounded-lg">
                Przeciągnij zlecenie tutaj
              </div>
            ) : (
              queueData.station_1.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))
            )}
          </div>
        </div>

        {/* Stanowisko 2 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-4 text-center bg-blue-600 text-white py-2 rounded">
            Stanowisko 2
          </h3>
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, "station", 2)}
            className="min-h-[400px] space-y-3"
          >
            {queueData.station_2.length === 0 ? (
              <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-300 rounded-lg">
                Przeciągnij zlecenie tutaj
              </div>
            ) : (
              queueData.station_2.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))
            )}
          </div>
        </div>

        {/* Kolejka oczekujących */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-4 text-center bg-gray-600 text-white py-2 rounded">
            Oczekujące ({queueData.waiting.length})
          </h3>
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, "waiting")}
            className="min-h-[400px] space-y-3 overflow-y-auto"
          >
            {queueData.waiting.length === 0 ? (
              <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-300 rounded-lg">
                Brak oczekujących zleceń
              </div>
            ) : (
              queueData.waiting.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))
            )}
          </div>
        </div>

        {/* Czekające na części */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-4 text-center bg-yellow-600 text-white py-2 rounded">
            Czekające na części ({queueData.waiting_for_parts?.length || 0})
          </h3>
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, "waiting_for_parts")}
            className="min-h-[400px] space-y-3 overflow-y-auto"
          >
            {!queueData.waiting_for_parts ||
            queueData.waiting_for_parts.length === 0 ? (
              <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-300 rounded-lg">
                Przeciągnij tutaj zlecenia czekające na części
              </div>
            ) : (
              queueData.waiting_for_parts.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sekcja zakończonych */}
      <div className="mt-6 bg-green-50 rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-4 text-center bg-green-600 text-white py-2 rounded">
          Zakończone - przeciągnij tutaj po ukończeniu naprawy
        </h3>
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "completed")}
          className="min-h-[150px] border-2 border-dashed border-green-300 rounded-lg p-4"
        >
          {!queueData.completed || queueData.completed.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <div className="mb-2">
                <svg
                  className="w-12 h-12 mx-auto text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              Przeciągnij tutaj zakończone zlecenia
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {queueData.completed.map((order) => (
                <div
                  key={order.id}
                  className="p-3 bg-white rounded-lg border-2 border-green-300"
                >
                  <div className="font-semibold text-sm text-gray-900 mb-1">
                    {order.customer?.name}
                  </div>
                  <div className="text-xs text-gray-600 flex items-center gap-1">
                    <Car className="h-3 w-3" />
                    {order.vehicle?.registration_number}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Zakończone{" "}
                    {order.completed_at
                      ? new Date(order.completed_at).toLocaleString("pl-PL")
                      : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-2 text-sm text-gray-600 text-center">
          Uwaga: Zakończonym zleceniom należy wystawić fakturę na stronie &quot;<a href="/orders">Zlecenia</a>&quot;
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">
          Instrukcja użytkowania:
        </h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Przeciągnij zlecenie na stanowisko, aby rozpocząć pracę</li>
          <li>
            • Przeciągnij zlecenie do &quot;Czekające na części&quot; gdy brakuje części
          </li>
          <li>
            • Przeciągnij z powrotem do &quot;Oczekujące&quot; aby anulować przypisanie
          </li>
          <li>• Przeciągnij do sekcji &quot;Zakończone&quot; po ukończeniu naprawy</li>
        </ul>

        <h4 className="font-semibold text-blue-900 mb-2 mt-4">
          Legenda priorytetów:
        </h4>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-900">
            <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
            <span>Normalny</span>
          </div>
          <div className="flex items-center gap-2 text-gray-900">
            <div className="w-4 h-4 border-2 border-orange-500 bg-orange-50 rounded"></div>
            <span>Wysoki</span>
          </div>
          <div className="flex items-center gap-2 text-gray-900">
            <div className="w-4 h-4 border-2 border-red-500 bg-red-50 rounded"></div>
            <span>Pilny</span>
          </div>
        </div>
      </div>
    </div>
  );
}
