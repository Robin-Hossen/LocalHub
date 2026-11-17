import { useEffect, useState } from "react";
import { Package, ShoppingBag } from "lucide-react";

import { getOrders } from "../../services/orderService";
import { Link } from "react-router-dom";

function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getOrders();
        setOrders(data.results ?? data);
      } catch (err) {
        console.error("Failed to load orders:", err);
        setError("Unable to load your orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-24 text-gray-500">
        Loading your orders...
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-24 text-red-600">{error}</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <ShoppingBag size={60} className="mx-auto text-gray-300" />

        <h2 className="text-2xl font-bold text-gray-800 mt-5">No Orders Yet</h2>

        <p className="text-gray-500 mt-2">Your orders will appear here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">My Orders</h2>

      <div className="space-y-5">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white border border-gray-100 rounded-xl p-6"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Package className="text-green-600" size={20} />

                  <h3 className="font-bold text-gray-800">
                    {order.order_number}
                  </h3>
                </div>

                <p className="text-sm text-gray-500 mt-2">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {order.status}
                </span>

                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                  {order.payment_status}
                </span>
              </div>
            </div>

            <div className="border-t mt-5 pt-5">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Products</p>

                  <p className="font-medium text-gray-800 mt-1">
                    {order.items.length} item(s)
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Amount</p>

                  <p className="text-lg font-bold text-green-700 mt-1">
                    ৳{Number(order.total_amount).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t mt-5 pt-4 flex justify-end">
              <Link
                to={`/my-orders/${order.id}`}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-semibold"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyOrdersPage;
