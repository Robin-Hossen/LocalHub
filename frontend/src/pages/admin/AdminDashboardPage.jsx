import { useEffect, useState } from "react";
import {
  ShoppingBag,
  Package,
  Users,
  Store,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  TrendingUp,
  AlertTriangle,
  Warehouse,
} from "lucide-react";

import { getDashboardOverview } from "../../services/dashboardService";
import { getStaffOrders } from "../../services/orderService";

function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [dashboardData, ordersData] = await Promise.all([
          getDashboardOverview(),
          getStaffOrders(),
        ]);

        setDashboard(dashboardData);

        setRecentOrders((ordersData.results || ordersData).slice(0, 5));
      } catch (err) {
        console.error("Dashboard fetch error:", err);

        if (err.response?.status === 401) {
          setError("Please login to access the dashboard.");
        } else if (err.response?.status === 403) {
          setError("You do not have permission to access this dashboard.");
        } else {
          setError("Unable to load dashboard data.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const formatCurrency = (value) => {
    return `৳${Number(value || 0).toLocaleString("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  if (!dashboard) return null;

  const { orders, inventory, customers, vendors, procurement, cod } = dashboard;
  const mainStats = [
    {
      title: "Total Orders",
      value: orders.total_orders,
      icon: ShoppingBag,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Total Products",
      value: inventory.total_products,
      icon: Package,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Total Customers",
      value: customers.total_customers,
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      title: "Total Vendors",
      value: vendors.total_vendors,
      icon: Store,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
  ];

  const orderStats = [
    {
      title: "Pending",
      value: orders.pending_orders,
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
    },
    {
      title: "Confirmed",
      value: orders.confirmed_orders,
      icon: CheckCircle,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Processing",
      value: orders.processing_orders,
      icon: TrendingUp,
      color: "text-indigo-600",
      bg: "bg-indigo-100",
    },
    {
      title: "Shipped",
      value: orders.shipped_orders,
      icon: Truck,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      title: "Delivered",
      value: orders.delivered_orders,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Cancelled",
      value: orders.cancelled_orders,
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-100",
    },
  ];

  const inventoryStats = [
    {
      title: "Available Quantity",
      value: inventory.total_available_quantity,
    },
    {
      title: "Reserved Quantity",
      value: inventory.total_reserved_quantity,
    },
    {
      title: "Sellable Quantity",
      value: inventory.total_sellable_quantity,
    },
    {
      title: "Low Stock Products",
      value: inventory.low_stock_products,
    },
    {
      title: "Out of Stock Products",
      value: inventory.out_of_stock_products,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Heading */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">
          Welcome to your LocalHub administration panel.
        </p>
      </div>

      {/* Main Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {mainStats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{item.title}</p>

                  <h3 className="text-3xl font-bold text-gray-900 mt-2">
                    {item.value ?? 0}
                  </h3>
                </div>

                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.bg} ${item.color}`}
                >
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sales Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-green-700 rounded-xl p-6 text-white shadow-sm">
          <p className="text-green-100 text-sm">Delivered Sales</p>

          <h3 className="text-3xl font-bold mt-3">
            {formatCurrency(orders.delivered_sales)}
          </h3>

          <p className="text-green-100 text-sm mt-2">
            Total sales from delivered orders
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <p className="text-gray-500 text-sm">Total Order Value</p>

          <h3 className="text-3xl font-bold text-gray-900 mt-3">
            {formatCurrency(orders.total_order_value)}
          </h3>

          <p className="text-gray-400 text-sm mt-2">Overall order value</p>
        </div>
      </div>

      {/* Order Statistics */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Order Status</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {orderStats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-11 h-11 rounded-lg flex items-center justify-center ${item.bg} ${item.color}`}
                  >
                    <Icon size={22} />
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">{item.title}</p>

                    <h3 className="text-2xl font-bold text-gray-900">
                      {item.value ?? 0}
                    </h3>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {/* Procurement Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <ShoppingBag size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Procurement Summary
              </h2>
              <p className="text-sm text-gray-500">Purchase order overview</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Total Purchase Orders</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {procurement.total_purchase_orders}
              </h3>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Purchase Value</p>
              <h3 className="text-xl font-bold text-gray-800">
                {formatCurrency(procurement.total_purchase_value)}
              </h3>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Draft Orders</p>
              <h3 className="text-xl font-bold text-gray-800">
                {procurement.draft_orders}
              </h3>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Received Orders</p>
              <h3 className="text-xl font-bold text-gray-800">
                {procurement.received_orders}
              </h3>
            </div>
          </div>
        </div>

        {/* COD Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <TrendingUp size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">COD Summary</h2>
              <p className="text-sm text-gray-500">
                Cash on delivery collections
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Total Collections</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {cod.total_cod_collections}
              </h3>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Total Collected</p>
              <h3 className="text-xl font-bold text-gray-800">
                {formatCurrency(cod.total_amount_collected)}
              </h3>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Today's Collections</p>
              <h3 className="text-xl font-bold text-gray-800">
                {cod.today_collections}
              </h3>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Today's Amount</p>
              <h3 className="text-xl font-bold text-gray-800">
                {formatCurrency(cod.today_amount_collected)}
              </h3>
            </div>
          </div>
        </div>
      </div>
      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">Recent Orders</h2>
          <span className="text-sm text-gray-500">Latest 5 orders</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-gray-500 border-b">
                <th className="py-3 pr-4">Order</th>
                <th className="py-3 pr-4">Customer</th>
                <th className="py-3 pr-4">Vendor</th>
                <th className="py-3 pr-4">Amount</th>
                <th className="py-3 pr-4">Status</th>
              </tr>
            </thead>

            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="py-4 pr-4 font-semibold text-gray-800">
                      {order.order_number}
                    </td>

                    <td className="py-4 pr-4 text-gray-600">
                      {order.customer}
                    </td>

                    <td className="py-4 pr-4 text-gray-600">
                      {order.vendor_name || "—"}
                    </td>

                    <td className="py-4 pr-4 font-medium text-gray-800">
                      {formatCurrency(order.total_amount)}
                    </td>

                    <td className="py-4 pr-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-gray-500">
                    No recent orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Overview */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Inventory Overview
        </h3>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
              <Warehouse size={23} />
            </div>

            <div>
              <h4 className="font-semibold text-gray-900">Stock Summary</h4>
              <p className="text-sm text-gray-500">
                Current inventory information
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {inventoryStats.map((item) => (
              <div key={item.title} className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">{item.title}</p>

                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {item.value ?? 0}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-2 text-sm text-orange-600">
            <AlertTriangle size={17} />
            <span>Monitor low stock and out of stock products.</span>
          </div>
        </div>
      </section>

      {/* Customer and Vendor Summary */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Business Overview
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h4 className="font-semibold text-gray-900 mb-4">
              Customer Summary
            </h4>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Active Customers</span>
                <span className="font-bold">
                  {customers.active_customers ?? 0}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">New Customers Today</span>
                <span className="font-bold">
                  {customers.new_customers_today ?? 0}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Vendor Summary</h4>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Active Vendors</span>
                <span className="font-bold">{vendors.active_vendors ?? 0}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Inactive Vendors</span>
                <span className="font-bold">
                  {vendors.inactive_vendors ?? 0}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Outstanding Balance</span>
                <span className="font-bold text-orange-600">
                  {formatCurrency(vendors.total_outstanding_balance)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminDashboardPage;
