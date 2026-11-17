import { useEffect, useState } from "react";
import { MapPin, Phone, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getAddresses, getAreas } from "../../services/addressService";
import { useCart } from "../../context/CartContext";
import { checkoutCart } from "../../services/cartService";

function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [areas, setAreas] = useState([]);
  const [addressMode, setAddressMode] = useState("saved");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");

  const [formData, setFormData] = useState({
    address_type: "HOME",
    recipient_name: "",
    phone: "",
    area: "",
    address_line: "",
    landmark: "",
    save_address: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [addressData, areaData] = await Promise.all([
          getAddresses(),
          getAreas(),
        ]);

        const addressList = addressData.results ?? addressData;
        const areaList = areaData.results ?? areaData;

        setAddresses(addressList);
        setAreas(areaList);

        const defaultAddress = addressList.find(
          (address) => address.is_default,
        );

        if (addressList.length > 0) {
          setSelectedAddress(String(defaultAddress?.id ?? addressList[0].id));
          setAddressMode("saved");
        } else {
          setAddressMode("new");
        }
      } catch (error) {
        console.error("Failed to load checkout data:", error);
        setOrderError("Unable to load delivery information.");
        setAddressMode("new");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      setOrderError("Your cart is empty.");
      return;
    }

    let checkoutData;

    if (addressMode === "saved") {
      if (!selectedAddress) {
        setOrderError("Please select a delivery address.");
        return;
      }

      checkoutData = {
        address_id: Number(selectedAddress),
      };
    } else {
      if (
        !formData.recipient_name.trim() ||
        !formData.phone.trim() ||
        !formData.area ||
        !formData.address_line.trim()
      ) {
        setOrderError("Please fill in all required address fields.");
        return;
      }

      checkoutData = {
        ...formData,
        area: Number(formData.area),
      };
    }

    try {
      setPlacingOrder(true);
      setOrderError("");

      await checkoutCart(checkoutData);

      await clearCart();

      navigate("/order-confirmation");
    } catch (error) {
      console.error("Checkout failed:", error);

      const responseData = error.response?.data;

      setOrderError(
        responseData?.detail ||
          responseData?.non_field_errors?.[0] ||
          (typeof responseData === "string" ? responseData : null) ||
          "Unable to place your order. Please check your information.",
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24 text-gray-500">Loading checkout...</div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h2>

      <div className="max-w-3xl">
        <h3 className="text-xl font-bold text-gray-800 mb-5">
          Delivery Address
        </h3>

        <div className="flex flex-wrap gap-3 mb-6">
          {addresses.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setAddressMode("saved");
                setOrderError("");
              }}
              className={`px-5 py-2 rounded-lg font-medium ${
                addressMode === "saved"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Saved Address
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setAddressMode("new");
              setOrderError("");
            }}
            className={`px-5 py-2 rounded-lg font-medium ${
              addressMode === "new"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            + Add New Address
          </button>
        </div>

        {addressMode === "saved" && (
          <div className="space-y-4">
            {addresses.map((address) => (
              <label
                key={address.id}
                className={`block bg-white border rounded-xl p-5 cursor-pointer ${
                  selectedAddress === String(address.id)
                    ? "border-green-600 ring-2 ring-green-100"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="deliveryAddress"
                    value={address.id}
                    checked={selectedAddress === String(address.id)}
                    onChange={(event) => setSelectedAddress(event.target.value)}
                    className="mt-1 accent-green-600"
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin size={18} className="text-green-600" />

                      <span className="font-bold text-gray-800">
                        {address.address_type}
                      </span>

                      {address.is_default && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Default
                        </span>
                      )}
                    </div>

                    <p className="flex items-center gap-2 text-gray-700 mb-2">
                      <User size={16} />
                      {address.recipient_name}
                    </p>

                    <p className="flex items-center gap-2 text-gray-700 mb-2">
                      <Phone size={16} />
                      {address.phone}
                    </p>

                    <p className="text-gray-600">{address.address_line}</p>

                    {address.landmark && (
                      <p className="text-sm text-gray-500 mt-1">
                        Landmark: {address.landmark}
                      </p>
                    )}

                    <p className="text-sm text-gray-500 mt-1">
                      Area: {address.area_name}
                    </p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        {addressMode === "new" && (
          <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Type
              </label>

              <select
                name="address_type"
                value={formData.address_type}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
              >
                <option value="HOME">Home</option>
                <option value="OFFICE">Office</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Name *
              </label>

              <input
                type="text"
                name="recipient_name"
                value={formData.recipient_name}
                onChange={handleInputChange}
                placeholder="Enter recipient name"
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>

              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="01XXXXXXXXX"
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Area *
              </label>

              <select
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
              >
                <option value="">Select your area</option>

                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Address *
              </label>

              <textarea
                name="address_line"
                value={formData.address_line}
                onChange={handleInputChange}
                rows={3}
                placeholder="House, road, block, building..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Landmark (Optional)
              </label>

              <input
                type="text"
                name="landmark"
                value={formData.landmark}
                onChange={handleInputChange}
                placeholder="Nearby mosque, school, market..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
              />
            </div>

            <label className="flex items-center gap-3 text-gray-700">
              <input
                type="checkbox"
                name="save_address"
                checked={formData.save_address}
                onChange={handleInputChange}
                className="accent-green-600 w-4 h-4"
              />
              Save this address for future orders
            </label>
          </div>
        )}
      </div>

      <div className="max-w-3xl mt-8 bg-white border border-gray-100 rounded-xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-5">Order Summary</h3>

        <div className="space-y-3 mb-5">
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between text-gray-600">
              <span>
                {item.name} × {item.quantity}
              </span>

              <span>৳{item.subtotal.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 flex justify-between font-bold text-lg">
          <span>Subtotal</span>
          <span className="text-green-700">৳{cartTotal.toFixed(2)}</span>
        </div>

        <p className="text-sm text-gray-500 mt-3">
          Delivery fee will be calculated according to your delivery area.
        </p>

        {orderError && (
          <p className="text-red-600 text-sm mt-4">{orderError}</p>
        )}

        <button
          onClick={handlePlaceOrder}
          disabled={placingOrder || cartItems.length === 0}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg mt-6 font-semibold"
        >
          {placingOrder ? "Placing Order..." : "Place Order"}
        </button>
      </div>
    </div>
  );
}

export default CheckoutPage;
