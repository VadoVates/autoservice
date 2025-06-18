"use client";

import { useState, useEffect } from "react";
import { dashboardService, DashboardStats } from "@/services/dashboard";
import {
  Users,
  Car,
  Wrench,
  Clock,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Activity,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
    // Auto-refresh co minutę
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      if (!loading) setRefreshing(true);
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (error) {
      console.error("Błąd ładowania statystyk:", error);
      toast.error("Nie udało się załadować statystyk");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      new: { color: "bg-gray-100 text-gray-800", text: "Nowe" },
      in_progress: { color: "bg-blue-100 text-blue-800", text: "W realizacji" },
      waiting_for_parts: {
        color: "bg-yellow-100 text-yellow-800",
        text: "Oczekuje na części",
      },
      completed: { color: "bg-green-100 text-green-800", text: "Zakończone" },
      invoiced: {
        color: "bg-purple-100 text-purple-800",
        text: "Zafakturowane",
      },
    };
    return badges[status] || badges.new;
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === "urgent")
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (priority === "high")
      return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Ładowanie statystyk...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Dashboard
        </h1>
        <button
          onClick={loadStats}
          disabled={refreshing}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition disabled:opacity-50"
        >
          <RefreshCw
            className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
          />
          Odśwież
        </button>
      </div>

      {/* Główne statystyki */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-4 md:p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aktywne zlecenia</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-600">
                {stats.active_orders}
              </p>
            </div>
            <Activity className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">W kolejce</p>
              <p className="text-2xl md:text-3xl font-bold text-orange-600">
                {stats.orders_in_queue}
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Zakończone dziś</p>
              <p className="text-2xl md:text-3xl font-bold text-green-600">
                {stats.completed_today}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Przychód dziś</p>
              <p className="text-2xl md:text-3xl font-bold text-purple-600">
                {stats.revenue_today.toFixed(2)} zł
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-600 opacity-20" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-gray-900">
        {/* Statystyki */}
        <div className="lg:col-span-2 space-y-6">
          {/* Priorytety */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">
              Zlecenia według priorytetu
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded "></div>
                  <span className="text-sm">Pilne</span>
                </div>
                <span className="font-semibold">
                  {stats.priority_stats.urgent}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-sm">Wysokie</span>
                </div>
                <span className="font-semibold">
                  {stats.priority_stats.high}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-400 rounded "></div>
                  <span className="text-sm">Normalne</span>
                </div>
                <span className="font-semibold">
                  {stats.priority_stats.normal}
                </span>
              </div>
            </div>
          </div>

          {/* Stanowiska */}
          <div className="bg-white p-6 rounded-lg shadow text-gray-900">
            <h2 className="text-lg font-semibold mb-4">Stan stanowisk</h2>
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`p-4 rounded-lg text-center ${
                  stats.station_1_busy
                    ? "bg-red-50 border-red-200"
                    : "bg-green-50 border-green-200"
                } border`}
              >
                <Wrench
                  className={`h-8 w-8 mx-auto mb-2 ${
                    stats.station_1_busy ? "text-red-600" : "text-green-600"
                  }`}
                />
                <p className="font-semibold">Stanowisko 1</p>
                <p
                  className={`text-sm ${
                    stats.station_1_busy ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {stats.station_1_busy ? "Zajęte" : "Wolne"}
                </p>
              </div>
              <div
                className={`p-4 rounded-lg text-center ${
                  stats.station_2_busy
                    ? "bg-red-50 border-red-200"
                    : "bg-green-50 border-green-200"
                } border`}
              >
                <Wrench
                  className={`h-8 w-8 mx-auto mb-2 ${
                    stats.station_2_busy ? "text-red-600" : "text-green-600"
                  }`}
                />
                <p className="font-semibold">Stanowisko 2</p>
                <p
                  className={`text-sm ${
                    stats.station_2_busy ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {stats.station_2_busy ? "Zajęte" : "Wolne"}
                </p>
              </div>
            </div>
          </div>

          {/* Statystyki ogólne */}
          <div className="bg-white p-6 rounded-lg shadow text-gray-900">
            <h2 className="text-lg font-semibold mb-4">Statystyki ogólne</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold">{stats.total_customers}</p>
                <p className="text-sm text-gray-600">Klientów</p>
              </div>
              <div>
                <Car className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">{stats.total_vehicles}</p>
                <p className="text-sm text-gray-600">Pojazdów</p>
              </div>
              <div>
                <Wrench className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold">{stats.total_orders}</p>
                <p className="text-sm text-gray-600">Zleceń</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ostatnie zlecenia */}
        <div className="bg-white p-6 rounded-lg shadow text-gray-900">
          <h2 className="text-lg font-semibold mb-4">Ostatnie zlecenia</h2>
          <div className="space-y-3">
            {stats.recent_orders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Brak zleceń</p>
            ) : (
              stats.recent_orders.map((order) => (
                <div
                  key={order.id}
                  className="border-b last:border-0 pb-3 last:pb-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {order.customer_name}
                      </p>
                      <p className="text-xs text-gray-600">{order.vehicle}</p>
                    </div>
                    {getPriorityIcon(order.priority)}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        getStatusBadge(order.status).color
                      }`}
                    >
                      {getStatusBadge(order.status).text}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString("pl-PL")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Podsumowanie finansowe */}
      <div className="mt-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Przychód w tym miesiącu
            </h3>
            <p className="text-3xl font-bold">
              {stats.revenue_month.toFixed(2)} zł
            </p>
          </div>
          <TrendingUp className="h-16 w-16 opacity-20" />
        </div>
      </div>
    </div>
  );
}
