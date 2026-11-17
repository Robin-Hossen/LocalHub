import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Package, MapPin, CreditCard } from "lucide-react";

import { getOrderDetails } from "../../services/orderService";
import OrderTracking from "../../components/customer/OrderTracking";

function OrderDetailsPage() {
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await getOrderDetails(orderId);
        setOrder(data);
      } catch (err) {
        console.error("Failed to load order:", err);
        setError("Unable to load order details.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="text-center py-24 text-gray-500">
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-24">
        <p className="text-red-600 mb-5">{error || "Order not found."}</p>

        <Link to="/my-orders" className="text-green-700 font-semibold">
          Back to My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Order Details</h2>

          <p className="text-gray-500 mt-2">Order #{order.order_number}</p>

          <p className="text-sm text-gray-500 mt-1">
            {new Date(order.created_at).toLocaleString()}
          </p>
        </div>

        <div className="flex gap-2">
          <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-semibold h-fit">
            {order.status}
          </span>

          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm h-fit">
            {order.payment_status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Package className="text-green-600" />
            <h3 className="font-bold text-lg">Ordered Products</h3>
          </div>

          <div className="space-y-4">
            {order.items?.map((item) => (
              <div
                key={item.id}
                className="flex justify-between gap-4 border-b pb-4"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {item.product_name}
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    Quantity: {item.quantity}
                  </p>
                </div>

                <p className="font-semibold text-gray-800">
                  ৳{Number(item.line_total).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="text-green-600" />
              <h3 className="font-bold text-lg">Delivery Address</h3>
            </div>

            <p className="font-medium text-gray-800">{order.recipient_name}</p>

            <p className="text-gray-600 mt-2">{order.recipient_phone}</p>

            <p className="text-gray-600 mt-2">{order.delivery_address_line}</p>

            <p className="text-gray-500 mt-1">{order.delivery_landmark}</p>

            <p className="text-gray-500 mt-1">{order.delivery_area_name}</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="text-green-600" />
              <h3 className="font-bold text-lg">Payment Information</h3>
            </div>

            <p className="text-gray-600">
              Payment Method: <strong>{order.payment_method}</strong>
            </p>

            <p className="text-gray-600 mt-2">
              Payment Status: <strong>{order.payment_status}</strong>
            </p>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <OrderTracking status={order.status} />
      </div>
      <div className="bg-white border border-gray-100 rounded-xl p-6 mt-6">
        <h3 className="font-bold text-lg mb-5">Order Summary</h3>

        <div className="space-y-3 text-gray-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>৳{Number(order.subtotal).toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span>৳{Number(order.delivery_fee).toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span>Discount</span>
            <span>৳{Number(order.discount).toFixed(2)}</span>
          </div>

          <div className="border-t pt-4 flex justify-between text-lg font-bold text-green-700">
            <span>Total</span>
            <span>৳{Number(order.total_amount).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Link
        to="/my-orders"
        className="inline-block mt-6 text-green-700 font-semibold hover:underline"
      >
        ← Back to My Orders
      </Link>
    </div>
  );
}

export default OrderDetailsPage;
