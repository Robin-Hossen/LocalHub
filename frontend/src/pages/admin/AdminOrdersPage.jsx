import { useEffect, useState } from "react";
import { Search, RefreshCw, ShoppingBag, Eye, X } from "lucide-react";





import {
  getStaffOrders,
  getStaffOrderDetails,
  updateStaffOrderStatus,
} from "../../services/orderService";

function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getStaffOrders();
      setOrders(data.results || data);
    } catch (err) {
      console.error("Orders fetch error:", err);
      setError("Unable to load orders.");
    } finally {
      setLoading(false);
    }
  };
  const handleViewOrder = async (orderId) => {
    try {
      setDetailsLoading(true);
      setSelectedOrder(null);

      const data = await getStaffOrderDetails(orderId);
      setSelectedOrder(data);
    } catch (err) {
      console.error("Order details error:", err);
      alert("Unable to load order details.");
    } finally {
      setDetailsLoading(false);
    }
  };
  const handleStatusUpdate = async (orderId, newStatus) => {
    const confirmed = window.confirm(
      `Are you sure you want to change the order status to ${newStatus}?`,
    );

    if (!confirmed) return;

    try {
      await updateStaffOrderStatus(orderId, newStatus);

      // Refresh order list
      await fetchOrders();

      // Refresh selected order details if modal is open
      if (selectedOrder?.id === orderId) {
        const updatedOrder = await getStaffOrderDetails(orderId);
        setSelectedOrder(updatedOrder);
      }

      alert("Order status updated successfully.");
    } catch (err) {
      console.error("Status update error:", err);

      const errorData = err.response?.data;
      const message =
        errorData?.status?.[0] ||
        errorData?.detail ||
        "Unable to update order status.";

      alert(message);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatCurrency = (amount) =>
    `৳${Number(amount || 0).toLocaleString("en-BD")}`;

  const filteredOrders = orders.filter((order) =>
    order.order_number?.toLowerCase().includes(search.toLowerCase()),
  );

  const statusColors = {
    PENDING: "bg-yellow-50 text-yellow-700",
    CONFIRMED: "bg-blue-50 text-blue-700",
    PROCESSING: "bg-indigo-50 text-indigo-700",
    SHIPPED: "bg-purple-50 text-purple-700",
    DELIVERED: "bg-green-50 text-green-700",
    CANCELLED: "bg-red-50 text-red-700",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Manage customer orders</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order number..."
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button
            onClick={fetchOrders}
            className="flex items-center justify-center gap-2 border border-gray-200 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </div>

      {/* Order List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <ShoppingBag size={20} className="text-green-600" />
          <h2 className="font-bold text-gray-800">Order List</h2>
          <span className="text-sm text-gray-400">
            ({filteredOrders.length})
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading orders...
          </div>
        ) : error ? (
          <div className="p-10 text-center text-red-500">{error}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-5 py-4">Order Number</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Vendor</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4">Payment</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 font-semibold text-gray-800">
                      {order.order_number}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-700">
                        {order.recipient_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {order.recipient_phone}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {order.vendor_name || "—"}
                    </td>

                    <td className="px-5 py-4 font-medium">
                      {formatCurrency(order.total_amount)}
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-gray-700">{order.payment_method}</p>
                      <p className="text-xs text-gray-400">
                        {order.payment_status}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          statusColors[order.status] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString("en-BD")}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleViewOrder(order.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View order"
                      >
                        <Eye size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Order Details Modal */}
      {(selectedOrder || detailsLoading) && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Order Details
                </h2>

                {selectedOrder && (
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedOrder.order_number}
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {detailsLoading ? (
              <div className="p-10 text-center text-gray-500">
                Loading order details...
              </div>
            ) : (
              selectedOrder && (
                <div className="p-5 space-y-6">
                  {/* Customer Information */}
                  <div>
                    <h3 className="font-bold text-gray-800 mb-3">
                      Customer Information
                    </h3>

                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                      <p>
                        <span className="text-gray-500">Name:</span>{" "}
                        {selectedOrder.recipient_name}
                      </p>

                      <p>
                        <span className="text-gray-500">Phone:</span>{" "}
                        {selectedOrder.recipient_phone}
                      </p>

                      <p>
                        <span className="text-gray-500">Area:</span>{" "}
                        {selectedOrder.delivery_area_name}
                      </p>

                      <p>
                        <span className="text-gray-500">Address:</span>{" "}
                        {selectedOrder.delivery_address_line}
                      </p>

                      <p>
                        <span className="text-gray-500">Landmark:</span>{" "}
                        {selectedOrder.delivery_landmark || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-bold text-gray-800 mb-3">
                      Ordered Products
                    </h3>

                    <div className="overflow-x-auto border border-gray-100 rounded-xl">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500">
                          <tr>
                            <th className="p-3">Product</th>
                            <th className="p-3">SKU</th>
                            <th className="p-3">Qty</th>
                            <th className="p-3">Unit Price</th>
                            <th className="p-3">Total</th>
                          </tr>
                        </thead>

                        <tbody>
                          {(selectedOrder.items || []).map((item) => (
                            <tr
                              key={item.id}
                              className="border-t border-gray-100"
                            >
                              <td className="p-3 font-medium text-gray-700">
                                {item.product_name}
                              </td>

                              <td className="p-3 text-gray-500">
                                {item.product_sku}
                              </td>

                              <td className="p-3">{item.quantity}</td>

                              <td className="p-3">
                                {formatCurrency(item.unit_selling_price)}
                              </td>

                              <td className="p-3 font-medium">
                                {formatCurrency(item.line_total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div>
                    <h3 className="font-bold text-gray-800 mb-3">
                      Payment Information
                    </h3>

                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                      <p>
                        Payment Method:{" "}
                        <strong>{selectedOrder.payment_method}</strong>
                      </p>

                      <p>
                        Payment Status:{" "}
                        <strong>{selectedOrder.payment_status}</strong>
                      </p>

                      <p>
                        Order Status: <strong>{selectedOrder.status}</strong>
                      </p>
                    </div>
                  </div>
                  {/* Update Order Status */}
                  <div>
                    <h3 className="font-bold text-gray-800 mb-3">
                      Update Order Status
                    </h3>

                    {(() => {
                      const nextStatus = {
                        PENDING: "CONFIRMED",
                        CONFIRMED: "PROCESSING",
                        PROCESSING: "SHIPPED",
                        SHIPPED: "DELIVERED",
                      };

                      const next = nextStatus[selectedOrder.status];

                      return next ? (
                        <div className="bg-green-50 rounded-xl p-4">
                          <p className="text-sm text-gray-600 mb-3">
                            Current Status:{" "}
                            <strong>{selectedOrder.status}</strong>
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              handleStatusUpdate(selectedOrder.id, next)
                            }
                            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
                          >
                            Move to {next}
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl">
                          This order has reached its final status.
                        </p>
                      );
                    })()}
                  </div>

                  {/* Order Summary */}
                  <div>
                    <h3 className="font-bold text-gray-800 mb-3">
                      Order Summary
                    </h3>

                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatCurrency(selectedOrder.subtotal)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span>
                          {formatCurrency(selectedOrder.delivery_fee)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span>Discount</span>
                        <span>{formatCurrency(selectedOrder.discount)}</span>
                      </div>

                      <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-base">
                        <span>Total Amount</span>
                        <span className="text-green-600">
                          {formatCurrency(selectedOrder.total_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrdersPage;
