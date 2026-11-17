import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Users,
  UserCheck,
  Truck,
  Power,
  RefreshCw,
  Search,
  MapPin,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { getDutyMonitoring } from "../../services/deliveryStaffService";

const statusStyles = {
  AVAILABLE: "bg-green-100 text-green-700",
  ON_DELIVERY: "bg-blue-100 text-blue-700",
  OFFLINE: "bg-gray-100 text-gray-600",
};

const statusLabels = {
  AVAILABLE: "Available",
  ON_DELIVERY: "On Delivery",
  OFFLINE: "Offline",
};

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString();
}

function AdminDutyMonitoringPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadStaff = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await getDutyMonitoring();
      setStaff(response.results || response);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to load duty monitoring information.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const counts = useMemo(
    () => ({
      total: staff.length,
      available: staff.filter((item) => item.availability === "AVAILABLE")
        .length,
      onDelivery: staff.filter((item) => item.availability === "ON_DELIVERY")
        .length,
      offline: staff.filter((item) => item.availability === "OFFLINE").length,
    }),
    [staff],
  );

  const filteredStaff = useMemo(() => {
    const query = search.toLowerCase();

    return staff.filter((item) => {
      const matchesSearch = [
        item.full_name,
        item.email,
        item.phone,
        ...(item.areas || []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);

      const matchesStatus =
        statusFilter === "ALL" || item.availability === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [staff, search, statusFilter]);

  const summaryCards = [
    {
      label: "Total Staff",
      value: counts.total,
      icon: Users,
      color: "text-gray-700",
      bg: "bg-gray-100",
    },
    {
      label: "Available",
      value: counts.available,
      icon: UserCheck,
      color: "text-green-700",
      bg: "bg-green-100",
    },
    {
      label: "On Delivery",
      value: counts.onDelivery,
      icon: Truck,
      color: "text-blue-700",
      bg: "bg-blue-100",
    },
    {
      label: "Offline",
      value: counts.offline,
      icon: Power,
      color: "text-gray-600",
      bg: "bg-gray-100",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Duty Monitoring</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor delivery staff duty and availability.
          </p>
        </div>

        <button
          onClick={() => loadStaff(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
        >
          <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <h2 className="mt-2 text-3xl font-bold text-gray-800">
                    {card.value}
                  </h2>
                </div>

                <div className={`rounded-xl p-3 ${card.bg}`}>
                  <Icon size={23} className={card.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Staff Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Delivery Staff</h2>
            <p className="mt-1 text-sm text-gray-500">
              {filteredStaff.length} staff member(s) found
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff, phone or area..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-green-600 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-600"
            >
              <option value="ALL">All Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_DELIVERY">On Delivery</option>
              <option value="OFFLINE">Offline</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-4">Delivery Staff</th>
                <th className="px-5 py-4">Assigned Areas</th>
                <th className="px-5 py-4">Availability</th>
                <th className="px-5 py-4">Duty Started</th>
                <th className="px-5 py-4">Active Deliveries</th>
                <th className="px-5 py-4">Account</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredStaff.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-800">
                      {item.full_name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{item.email}</p>
                    {item.phone && (
                      <p className="mt-1 text-xs text-gray-500">{item.phone}</p>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex max-w-56 flex-wrap gap-1.5">
                      {item.areas?.length > 0 ? (
                        item.areas.map((area, index) => (
                          <span
                            key={`${item.id}-${index}`}
                            className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs text-green-700"
                          >
                            <MapPin size={12} />
                            {area}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">
                          No area assigned
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        statusStyles[item.availability] || statusStyles.OFFLINE
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-current" />
                      {statusLabels[item.availability] || item.availability}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={15} />
                      {formatDate(item.duty_started_at)}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="font-semibold text-gray-700">
                      {item.active_delivery_count}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        item.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredStaff.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    No delivery staff found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Duty information updates when you refresh this page.
      </p>
    </div>
  );
}

export default AdminDutyMonitoringPage;
