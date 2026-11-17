
import { useEffect, useState } from "react";
import {
  Truck,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Play,
  Square,
  Power,
} from "lucide-react";

import {
  getMyDeliveries,
  getDutyStatus,
  startDuty,
  endDuty,
} from "../../services/deliveryService";

const statusStyles = {
  ASSIGNED: "bg-blue-100 text-blue-700",
  PICKED_UP: "bg-purple-100 text-purple-700",
  IN_TRANSIT: "bg-yellow-100 text-yellow-700",
  DELIVERED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h2 className="text-3xl font-bold text-gray-800 mt-2">
            {value}
          </h2>
        </div>

        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

function DeliveryDashboardPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [duty, setDuty] = useState(null);
  const [availability, setAvailability] = useState("OFFLINE");
  const [dutyLoading, setDutyLoading] = useState(true);
  const [dutyActionLoading, setDutyActionLoading] = useState(false);
  const [dutyError, setDutyError] = useState("");
  const [dutySuccess, setDutySuccess] = useState("");

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMyDeliveries();
      setDeliveries(response.results || response || []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load your deliveries."
      );
    } finally {
      setLoading(false);
    }
  };
  const fetchDutyStatus = async () => {
    try {
      setDutyLoading(true);
      setDutyError("");

      const response = await getDutyStatus();

      setDuty(response.duty);
      setAvailability(response.availability);
    } catch (err) {
      setDutyError(err.response?.data?.detail || "Unable to load duty status.");
    } finally {
      setDutyLoading(false);
    }
  };

  const handleDutyAction = async () => {
    if (availability === "ON_DELIVERY") {
      setDutyError("Please complete your active delivery before ending duty.");
      return;
    }

    try {
      setDutyActionLoading(true);
      setDutyError("");
      setDutySuccess("");

      const response = duty ? await endDuty() : await startDuty();

      setDutySuccess(response.message);

      await fetchDutyStatus();
    } catch (err) {
      setDutyError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Unable to update duty status.",
      );
    } finally {
      setDutyActionLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
    fetchDutyStatus();
  }, []);

  const total = deliveries.length;
  const assigned = deliveries.filter(
    (item) => item.status === "ASSIGNED"
  ).length;
  const inTransit = deliveries.filter(
    (item) => ["PICKED_UP", "IN_TRANSIT"].includes(item.status)
  ).length;
  const delivered = deliveries.filter(
    (item) => item.status === "DELIVERED"
  ).length;
  const failed = deliveries.filter(
    (item) => item.status === "FAILED"
  ).length;

  const formatStatus = (status) =>
    status?.replaceAll("_", " ") || "Unknown";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Delivery Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of your assigned deliveries
          </p>
        </div>

        <button
          onClick={fetchDeliveries}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-700 text-white hover:bg-green-800 disabled:opacity-50"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>
      {/* Duty Management */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Power size={20} className="text-green-700" />
              <h2 className="text-lg font-bold text-gray-800">
                Duty Management
              </h2>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  availability === "AVAILABLE"
                    ? "bg-green-500"
                    : availability === "ON_DELIVERY"
                      ? "bg-blue-500"
                      : "bg-gray-400"
                }`}
              />

              <span className="text-sm font-semibold text-gray-700">
                {availability === "AVAILABLE"
                  ? "Available"
                  : availability === "ON_DELIVERY"
                    ? "On Delivery"
                    : "Offline"}
              </span>
            </div>

            {duty?.started_at && (
              <p className="text-xs text-gray-500 mt-2">
                Duty started: {new Date(duty.started_at).toLocaleString()}
              </p>
            )}
          </div>

          <button
            onClick={handleDutyAction}
            disabled={
              dutyLoading || dutyActionLoading || availability === "ON_DELIVERY"
            }
            className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
              duty
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-700 hover:bg-green-800"
            }`}
          >
            {duty ? <Square size={17} /> : <Play size={17} />}

            {dutyActionLoading
              ? "Please wait..."
              : dutyLoading
                ? "Loading..."
                : duty
                  ? "End Duty"
                  : "Start Duty"}
          </button>
        </div>

        {availability === "ON_DELIVERY" && (
          <p className="text-sm text-blue-700 mt-3">
            Complete your active delivery before ending duty.
          </p>
        )}

        {dutyError && <p className="text-sm text-red-600 mt-3">{dutyError}</p>}

        {dutySuccess && (
          <p className="text-sm text-green-700 mt-3">{dutySuccess}</p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl p-10 text-center text-gray-500">
          Loading dashboard...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          {error}
          <button
            onClick={fetchDeliveries}
            className="ml-3 underline font-medium"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <StatCard
              title="Total Deliveries"
              value={total}
              icon={Package}
              color="bg-green-100 text-green-700"
            />

            <StatCard
              title="Assigned"
              value={assigned}
              icon={Truck}
              color="bg-blue-100 text-blue-700"
            />

            <StatCard
              title="In Progress"
              value={inTransit}
              icon={Clock}
              color="bg-yellow-100 text-yellow-700"
            />

            <StatCard
              title="Delivered"
              value={delivered}
              icon={CheckCircle}
              color="bg-green-100 text-green-700"
            />

            <StatCard
              title="Failed"
              value={failed}
              icon={AlertCircle}
              color="bg-red-100 text-red-700"
            />
          </div>

          {/* Recent Deliveries */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">My Deliveries</h2>
              <p className="text-sm text-gray-500 mt-1">
                Your latest assigned delivery records
              </p>
            </div>

            {deliveries.length === 0 ? (
              <div className="p-10 text-center">
                <Truck size={40} className="mx-auto text-gray-300" />
                <p className="mt-3 font-medium text-gray-700">
                  No deliveries assigned yet
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  New assignments will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {deliveries.slice(0, 5).map((delivery) => (
                  <div
                    key={delivery.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        Delivery #{delivery.id}
                      </p>

                      <p className="text-sm text-gray-600 mt-1">
                        {delivery.recipient_name}
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        {delivery.delivery_area_name}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          statusStyles[delivery.status] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {formatStatus(delivery.status)}
                      </span>

                      {delivery.recipient_phone && (
                        <a
                          href={`tel:${delivery.recipient_phone}`}
                          className="text-sm text-green-700 hover:underline"
                        >
                          {delivery.recipient_phone}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default DeliveryDashboardPage;
