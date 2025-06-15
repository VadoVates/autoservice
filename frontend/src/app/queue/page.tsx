"use client";

import { useState, useEffect } from "react";
import { Order, QueueData } from "@/types";
import { ordersService } from "@/services/orders";
import { Car, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function QueuePage() {
  const [queueData, setQueueData] = useState<QueueData>({
    station_1: [],
    station_2: [],
    waiting: [],
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
    targetStation: number | null
  ) => {
    e.preventDefault();

    if (!draggedOrder) return;

    try {
      // Aktualizuj status i stanowisko
      const updates: any = {
        work_station_id: targetStation,
      };

      // Jeśli przypisujemy do stanowiska, zmień status na "w realizacji"
      if (targetStation && draggedOrder.status === "new") {
        updates.status = "in_progress";
      }
      // Jeśli zdejmujemy ze stanowiska, zmień status na "nowe"
      else if (!targetStation && draggedOrder.status === "in_progress") {
        updates.status = "new";
      }

      await ordersService.update(draggedOrder.id, updates);
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

      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
        <Clock className="h-3 w-3" />
        <span>{new Date(order.created_at).toLocaleString("pl-PL")}</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stanowisko 1 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-4 text-center bg-blue-600 text-white py-2 rounded">
            Stanowisko 1
          </h3>
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 1)}
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
            onDrop={(e) => handleDrop(e, 2)}
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
            onDrop={(e) => handleDrop(e, null)}
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
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">
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
