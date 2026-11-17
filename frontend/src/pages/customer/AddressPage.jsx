import { useEffect, useState } from "react";
import { MapPin, Plus, Pencil, Trash2, Star, X, Save } from "lucide-react";

import {
  getAddresses,
  getAreas,
  addAddress,
  updateAddress,
  deleteAddress,
} from "../../services/addressService";

const initialForm = {
  address_type: "HOME",
  recipient_name: "",
  phone: "",
  area: "",
  address_line: "",
  landmark: "",
  is_default: false,
};

function AddressPage() {
  const [addresses, setAddresses] = useState([]);
  const [areas, setAreas] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [addressData, areaData] = await Promise.all([
        getAddresses(),
        getAreas(),
      ]);

      setAddresses(addressData.results ?? addressData);
      setAreas(areaData.results ?? areaData);
    } catch (err) {
      console.error("Failed to load addresses:", err);
      setError("Unable to load addresses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowForm(true);
    setError("");
    setMessage("");
  };

  const openEditForm = (address) => {
    setEditingId(address.id);

    setForm({
      address_type: address.address_type,
      recipient_name: address.recipient_name,
      phone: address.phone,
      area: String(address.area),
      address_line: address.address_line,
      landmark: address.landmark || "",
      is_default: address.is_default,
    });

    setShowForm(true);
    setError("");
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        ...form,
        area: Number(form.area),
      };

      if (editingId) {
        await updateAddress(editingId, payload);
        setMessage("Address updated successfully.");
      } else {
        await addAddress(payload);
        setMessage("Address added successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);

      await fetchData();
    } catch (err) {
      console.error("Failed to save address:", err);

      const data = err.response?.data;
      setError(
        data ? Object.values(data).flat().join(" ") : "Unable to save address.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (addressId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this address?",
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await deleteAddress(addressId);
      setMessage("Address deleted successfully.");

      await fetchData();
    } catch (err) {
      console.error("Failed to delete address:", err);
      setError("Unable to delete address.");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500">
        Loading addresses...
      </div>
    );
  }

  return (
    <section className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Addresses</h1>
          <p className="text-gray-500 mt-1">Manage your delivery addresses</p>
        </div>

        <button
          onClick={openAddForm}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg flex items-center justify-center gap-2"
        >
          <Plus size={19} />
          Add New Address
        </button>
      </div>

      {error && (
        <p className="bg-red-50 text-red-600 p-3 rounded-lg mb-5">{error}</p>
      )}

      {message && (
        <p className="bg-green-50 text-green-700 p-3 rounded-lg mb-5">
          {message}
        </p>
      )}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {editingId ? "Edit Address" : "Add New Address"}
            </h2>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-red-600"
              aria-label="Close form"
            >
              <X />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Type
              </label>

              <select
                name="address_type"
                value={form.address_type}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-3"
              >
                <option value="HOME">Home</option>
                <option value="OFFICE">Office</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Name
                </label>

                <input
                  type="text"
                  name="recipient_name"
                  value={form.recipient_name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-200 rounded-lg px-4 py-3"
                  placeholder="Enter recipient name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-200 rounded-lg px-4 py-3"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Area
              </label>

              <select
                name="area"
                value={form.area}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-3"
              >
                <option value="">Select delivery area</option>

                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Address
              </label>

              <textarea
                name="address_line"
                value={form.address_line}
                onChange={handleChange}
                required
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-4 py-3"
                placeholder="House, road, block, apartment..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Landmark (Optional)
              </label>

              <input
                type="text"
                name="landmark"
                value={form.landmark}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-3"
                placeholder="Nearby school, mosque, shop..."
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="is_default"
                checked={form.is_default}
                onChange={handleChange}
                className="accent-green-600 w-4 h-4"
              />
              Set as default address
            </label>

            <button
              type="submit"
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <Save size={18} />
              {saving ? "Saving..." : "Save Address"}
            </button>
          </form>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <MapPin size={42} className="mx-auto text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-800">No addresses yet</h3>
          <p className="text-gray-500 text-sm mt-1">
            Add your first delivery address.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="text-green-600" size={20} />

                  <h3 className="font-semibold text-gray-800">
                    {address.address_type}
                  </h3>
                </div>

                {address.is_default && (
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-1">
                    <Star size={13} />
                    Default
                  </span>
                )}
              </div>

              <p className="font-medium text-gray-800">
                {address.recipient_name}
              </p>

              <p className="text-sm text-gray-600 mt-1">{address.phone}</p>

              <p className="text-sm text-gray-600 mt-3">
                {address.address_line}
              </p>

              <p className="text-sm text-gray-500 mt-1">
                {address.area_name}
                {address.landmark && ` • ${address.landmark}`}
              </p>

              <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100">
                <button
                  onClick={() => openEditForm(address)}
                  className="text-green-700 hover:text-green-800 flex items-center gap-1 text-sm font-medium"
                >
                  <Pencil size={16} />
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(address.id)}
                  className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm font-medium"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default AddressPage;
