import { useEffect, useState } from "react";
import { Search, RefreshCw, Plus, Pencil, Store, Trash2 } from "lucide-react";



import {
  getVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  getVendorTypes,
  getVendorAreas,
} from "../../services/vendorService";



function AdminVendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [vendorTypes, setVendorTypes] = useState([]);
  const [areas, setAreas] = useState([]);
  

  const [form, setForm] = useState({
    name: "",
    vendor_type: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    area: "",
    is_active: true,
  });

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getVendors();
      setVendors(data.results || data);
    } catch (err) {
      console.error("Vendor fetch error:", err);
      setError("Unable to load vendors.");
    } finally {
      setLoading(false);
    }
  };
  const fetchFormData = async () => {
    try {
      const [typeData, areaData] = await Promise.all([
        getVendorTypes(),
        getVendorAreas(),
      ]);

      setVendorTypes(typeData.results || typeData);
      setAreas(areaData.results || areaData);
    } catch (err) {
      console.error("Vendor form data error:", err);
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchFormData();
  }, []);

  const filteredVendors = vendors.filter((vendor) =>
    `${vendor.name} ${vendor.contact_person} ${vendor.phone}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const handleCreateVendor = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await createVendor({
        ...form,
        vendor_type: Number(form.vendor_type),
        area: Number(form.area),
      });

      alert("Vendor created successfully!");

      setShowModal(false);

      setForm({
        name: "",
        vendor_type: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        area: "",
        is_active: true,
      });

      await fetchVendors();
    } catch (err) {
      console.error("Create vendor error:", err);

      const errorData = err.response?.data;
      const message = errorData
        ? JSON.stringify(errorData)
        : "Unable to create vendor.";

      alert(message);
    } finally {
      setSaving(false);
    }
  };
  const handleEditClick = (vendor) => {
    setEditingVendor(vendor);

    setForm({
      name: vendor.name || "",
      vendor_type: String(vendor.vendor_type || ""),
      contact_person: vendor.contact_person || "",
      phone: vendor.phone || "",
      email: vendor.email || "",
      address: vendor.address || "",
      area: String(vendor.area || ""),
      is_active: vendor.is_active,
    });

    setShowModal(true);
  };
  const handleUpdateVendor = async (e) => {
    e.preventDefault();

    if (!editingVendor) return;

    try {
      setSaving(true);

      await updateVendor(editingVendor.id, {
        ...form,
        vendor_type: Number(form.vendor_type),
        area: Number(form.area),
      });

      alert("Vendor updated successfully!");

      setShowModal(false);
      setEditingVendor(null);

      setForm({
        name: "",
        vendor_type: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        area: "",
        is_active: true,
      });

      await fetchVendors();
    } catch (err) {
      console.error("Update vendor error:", err);

      const errorData = err.response?.data;
      alert(errorData ? JSON.stringify(errorData) : "Unable to update vendor.");
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteVendor = async (vendorId) => {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this vendor?",
    );

    if (!confirmed) return;

    try {
      await updateVendor(vendorId, {
        is_active: false,
      });

      alert("Vendor deactivated successfully!");

      await fetchVendors();
    } catch (err) {
      console.error("Deactivate vendor error:", err);

      const errorData = err.response?.data;

      alert(errorData ? JSON.stringify(errorData) : "Unable to deactivate vendor.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vendors</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your suppliers and vendor information.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-semibold"
        >
          <Plus size={18} />
          Add Vendor
        </button>
      </div>

      {/* Search and Refresh */}
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
              placeholder="Search vendor name, contact or phone..."
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button
            onClick={fetchVendors}
            className="flex items-center justify-center gap-2 border border-gray-200 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </div>

      {/* Vendor List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Store size={20} className="text-green-600" />
          <h2 className="font-bold text-gray-800">Vendor List</h2>
          <span className="text-sm text-gray-400">
            ({filteredVendors.length})
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading vendors...
          </div>
        ) : error ? (
          <div className="p-10 text-center text-red-500">{error}</div>
        ) : filteredVendors.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No vendors found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-5 py-4">Vendor</th>
                  <th className="px-5 py-4">Vendor Type</th>
                  <th className="px-5 py-4">Contact Person</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">Area</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredVendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 font-semibold text-gray-800">
                      {vendor.name}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {vendor.vendor_type_name || vendor.vendor_type}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {vendor.contact_person}
                    </td>

                    <td className="px-5 py-4 text-gray-600">{vendor.phone}</td>

                    <td className="px-5 py-4 text-gray-600">
                      {vendor.area_name || vendor.area}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          vendor.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {vendor.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleEditClick(vendor)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit vendor"
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        onClick={() => handleDeleteVendor(vendor.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete Vendor"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Add Vendor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2>{editingVendor ? "Edit Vendor" : "Add New Vendor"}</h2>

              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingVendor(null);
                }}
                className="text-gray-500 hover:bg-gray-100 rounded-lg px-3 py-2"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={editingVendor ? handleUpdateVendor : handleCreateVendor}
              className="p-5 space-y-4"
            >
              {" "}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter vendor name"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Type *
                  </label>
                  <select
                    value={form.vendor_type}
                    onChange={(e) =>
                      setForm({ ...form, vendor_type: e.target.value })
                    }
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select vendor type</option>
                    {vendorTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area *
                  </label>
                  <select
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select area</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    value={form.contact_person}
                    onChange={(e) =>
                      setForm({ ...form, contact_person: e.target.value })
                    }
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Contact person name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="01XXXXXXXXX"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="vendor@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  required
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter full address"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                  className="accent-green-600"
                />
                Active Vendor
              </label>
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingVendor
                      ? "Update Vendor"
                      : "Save Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminVendorsPage;
