import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Package, MapPin, Phone } from "lucide-react";

import { getOrders } from "../../services/orderService";

function OrderConfirmationPage() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLatestOrder = async () => {
      try {
        const data = await getOrders();
        const orders = data.results ?? data;

        if (orders.length > 0) {
          setOrder(orders[0]);
        } else {
          setError("No order found.");
        }
      } catch (err) {
        console.error("Failed to load order:", err);
        setError("Unable to load order details.");
      } finally {
        setLoading(false);
      }
    };

    fetchLatestOrder();
  }, []);

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
        <Link to="/" className="text-green-700 font-semibold">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <CheckCircle size={64} className="mx-auto text-green-600" />

        <h2 className="text-3xl font-bold text-gray-800 mt-5">
          Thank You for Your Order!
        </h2>

        <p className="text-gray-500 mt-2">
          Your order has been placed successfully.
        </p>

        <p className="text-sm text-gray-500 mt-5">Order Number</p>

        <h3 className="text-xl font-bold text-green-700">
          {order.order_number}
        </h3>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-6">
        <h3 className="text-xl font-bold text-gray-800 mb-5">
          Order Information
        </h3>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <p className="text-sm text-gray-500">Order Status</p>
            <p className="font-semibold">{order.status}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Payment Method</p>
            <p className="font-semibold">{order.payment_method}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Payment Status</p>
            <p className="font-semibold">{order.payment_status}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Order Date</p>
            <p className="font-semibold">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-6">
        <h3 className="text-xl font-bold text-gray-800 mb-5">
          Ordered Products
        </h3>

        <div className="space-y-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center border-b pb-4"
            >
              <div>
                <p className="font-semibold text-gray-800">
                  {item.product_name}
                </p>
                <p className="text-sm text-gray-500">
                  ৳{Number(item.unit_selling_price).toFixed(2)} ×{" "}
                  {item.quantity}
                </p>
              </div>

              <p className="font-semibold">
                ৳{Number(item.line_total).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-6">
        <h3 className="text-xl font-bold text-gray-800 mb-5">
          Delivery Address
        </h3>

        <p className="flex items-center gap-2 text-gray-700 mb-2">
          <Package size={17} />
          {order.recipient_name}
        </p>

        <p className="flex items-center gap-2 text-gray-700 mb-2">
          <Phone size={17} />
          {order.recipient_phone}
        </p>

        <p className="flex items-center gap-2 text-gray-700">
          <MapPin size={17} />
          {order.delivery_address_line}, {order.delivery_area_name}
        </p>

        {order.delivery_landmark && (
          <p className="text-sm text-gray-500 mt-2">
            Landmark: {order.delivery_landmark}
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-6">
        <h3 className="text-xl font-bold text-gray-800 mb-5">
          Payment Summary
        </h3>

        <div className="flex justify-between mb-3">
          <span className="text-gray-600">Subtotal</span>
          <span>৳{Number(order.subtotal).toFixed(2)}</span>
        </div>

        <div className="flex justify-between mb-3">
          <span className="text-gray-600">Delivery Fee</span>
          <span>৳{Number(order.delivery_fee).toFixed(2)}</span>
        </div>

        <div className="flex justify-between mb-3">
          <span className="text-gray-600">Discount</span>
          <span>৳{Number(order.discount).toFixed(2)}</span>
        </div>

        <div className="border-t pt-4 flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-green-700">
            ৳{Number(order.total_amount).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="text-center mt-8">
        <Link
          to="/"
          className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default OrderConfirmationPage;
