
import { useEffect, useState } from "react";
import {
  Truck,
  RefreshCw,
  Phone,
  MapPin,
  Package,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import {
  getMyDeliveries,
  updateDeliveryStatus,
} from "../../services/deliveryService";

const statusStyles = {
  ASSIGNED: "bg-blue-100 text-blue-700",
  PICKED_UP: "bg-purple-100 text-purple-700",
  IN_TRANSIT: "bg-yellow-100 text-yellow-700",
  DELIVERED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

function MyDeliveriesPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMyDeliveries();
      setDeliveries(response.results || response || []);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to load deliveries."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleStatusUpdate = async (deliveryId, status) => {
    let failedReason = "";

    if (status === "FAILED") {
      failedReason = window.prompt("Please enter the failure reason:");

      if (!failedReason?.trim()) {
        return;
      }
    }

    try {
      setUpdatingId(deliveryId);
      setError("");
      setSuccess("");

      const data = { status };

      if (status === "FAILED") {
        data.failed_reason = failedReason.trim();
      }

      await updateDeliveryStatus(deliveryId, data);

      setSuccess("Delivery status updated successfully.");
      await fetchDeliveries();
    } catch (err) {
      const responseData = err.response?.data;

      setError(
        responseData?.detail ||
        responseData?.status?.[0] ||
        responseData?.failed_reason?.[0] ||
        "Unable to update delivery status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const formatStatus = (status) =>
    status?.replaceAll("_", " ") || "Unknown";

  const getNextAction = (delivery) => {
    switch (delivery.status) {
      case "ASSIGNED":
        return { label: "Confirm Pickup", status: "PICKED_UP" };
      case "PICKED_UP":
        return { label: "Start Delivery", status: "IN_TRANSIT" };
      case "IN_TRANSIT":
        return { label: "Mark Delivered", status: "DELIVERED" };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-10 text-center text-gray-500">
        Loading deliveries...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            My Deliveries
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your assigned customer deliveries
          </p>
        </div>

        <button
          onClick={fetchDeliveries}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-700 text-white hover:bg-green-800"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4">
          {success}
        </div>
      )}

      {deliveries.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Truck size={42} className="mx-auto text-gray-300" />
          <h2 className="mt-4 font-semibold text-gray-700">
            No deliveries assigned
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Your assigned deliveries will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {deliveries.map((delivery) => {
            const nextAction = getNextAction(delivery);

            return (
              <div
                key={delivery.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
              >
                <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-800">
                      Delivery #{delivery.id}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Order: {delivery.order_number || "N/A"}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      statusStyles[delivery.status] ||
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {formatStatus(delivery.status)}
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Customer
                    </p>
                    <p className="font-semibold text-gray-800">
                      {delivery.recipient_name || "N/A"}
                    </p>
                    {delivery.recipient_phone && (
                      <a
                        href={`tel:${delivery.recipient_phone}`}
                        className="inline-flex items-center gap-2 text-sm text-green-700 mt-1 hover:underline"
                      >
                        <Phone size={15} />
                        {delivery.recipient_phone}
                      </a>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Delivery Address
                    </p>
                    <p className="text-sm text-gray-700 flex items-start gap-2">
                      <MapPin size={17} className="shrink-0 text-green-700 mt-0.5" />
                      <span>
                        {delivery.delivery_address_line || "N/A"}
                        {delivery.delivery_area_name
                          ? `, ${delivery.delivery_area_name}`
                          : ""}
                        {delivery.delivery_landmark
                          ? ` (${delivery.delivery_landmark})`
                          : ""}
                      </span>
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-2">
                      Order Items
                    </p>
                    <div className="space-y-2">
                      {(delivery.items || []).map((item, index) => (
                        <div
                          key={item.id || index}
                          className="flex items-center justify-between text-sm gap-3"
                        >
                          <span className="flex items-center gap-2 text-gray-700">
                            <Package size={15} className="text-gray-400" />
                            {item.product_name}
                          </span>
                          <span className="text-gray-500">
                            × {item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {delivery.failed_reason && (
                    <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">
                      <strong>Failure reason:</strong> {delivery.failed_reason}
                    </div>
                  )}

                  {nextAction && (
                    <div className="pt-3 border-t border-gray-100 space-y-2">
                      <button
                        onClick={() =>
                          handleStatusUpdate(delivery.id, nextAction.status)
                        }
                        disabled={updatingId === delivery.id}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-700 hover:bg-green-800 text-white py-3 font-medium disabled:opacity-50"
                      >
                        <CheckCircle size={17} />
                        {updatingId === delivery.id
                          ? "Updating..."
                          : nextAction.label}
                      </button>

                      <button
                        onClick={() =>
                          handleStatusUpdate(delivery.id, "FAILED")
                        }
                        disabled={updatingId === delivery.id}
                        className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 py-2.5 text-sm font-medium disabled:opacity-50"
                      >
                        <AlertCircle size={16} />
                        Report Failed Delivery
                      </button>
                    </div>
                  )}

                  {delivery.status === "DELIVERED" && (
                    <div className="bg-green-50 text-green-700 rounded-lg p-3 text-sm flex items-center gap-2">
                      <CheckCircle size={17} />
                      Delivery completed successfully.
                    </div>
                  )}

                  {delivery.status === "FAILED" && (
                    <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">
                      This delivery has been marked as failed. Contact Admin or Operations for reassignment.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyDeliveriesPage;
