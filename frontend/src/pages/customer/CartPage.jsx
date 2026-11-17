import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";

function CartPage() {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, cartTotal, loading } =
    useCart();

  if (loading) {
    return (
      <div className="text-center py-24 text-gray-500">
        Loading your cart...
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <ShoppingBag size={60} className="mx-auto text-gray-300" />

        <h2 className="text-2xl font-bold text-gray-800 mt-5">
          Your Cart is Empty
        </h2>

        <p className="text-gray-500 mt-2">Add some products to get started.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Shopping Cart</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col sm:flex-row items-center gap-5"
            >
              <div className="w-24 h-24 bg-green-50 rounded-lg flex items-center justify-center">
                <ShoppingBag size={35} className="text-green-400" />
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-semibold text-gray-800">{item.name}</h3>

                <p className="text-green-700 font-bold mt-2">
                  ৳{item.price.toFixed(2)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity === 1}
                  className="p-2 border rounded-lg disabled:opacity-30"
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>

                <span className="font-semibold">{item.quantity}</span>

                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="p-2 border rounded-lg"
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="text-center min-w-20">
                <p className="font-bold text-gray-800">
                  ৳{item.subtotal.toFixed(2)}
                </p>
              </div>

              <button
                onClick={() => removeFromCart(item.id)}
                className="text-red-500 hover:text-red-700"
                aria-label="Remove product"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 h-fit">
          <h3 className="text-xl font-bold text-gray-800 mb-5">
            Order Summary
          </h3>

          <div className="flex justify-between text-gray-600 mb-3">
            <span>Subtotal</span>
            <span>৳{cartTotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-gray-600 mb-4">
            <span>Delivery Fee</span>
            <span>Calculated at checkout</span>
          </div>

          <div className="border-t pt-4 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-green-700">৳{cartTotal.toFixed(2)}</span>
          </div>

          <button
            onClick={() => navigate("/checkout")}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg mt-6 font-semibold"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
