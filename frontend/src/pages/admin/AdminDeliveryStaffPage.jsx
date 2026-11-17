import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Pencil,
  Power,
  X,
  MapPin,
  Loader2,
  Phone,
  Mail,
} from "lucide-react";

import {
  getDeliveryStaffMembers,
  createDeliveryStaff,
  updateDeliveryStaff,
  getDeliveryAreas,
} from "../../services/deliveryStaffService";

const initialForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: "",
  delivery_areas: [],
  is_active: true,
};

function AdminDeliveryStaffPage() {
  const [staffMembers, setStaffMembers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [editingStaff, setEditingStaff] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [staffData, areaData] = await Promise.all([
        getDeliveryStaffMembers(),
        getDeliveryAreas(),
      ]);

      setStaffMembers(staffData.results || staffData);
      setAreas(areaData.results || areaData);
    } catch (err) {
      setError("Failed to load delivery staff information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredStaff = useMemo(() => {
    const query = search.toLowerCase();

    return staffMembers.filter((staff) => {
      const name = `${staff.first_name} ${staff.last_name}`.toLowerCase();

      return (
        name.includes(query) ||
        staff.email.toLowerCase().includes(query) ||
        staff.phone.includes(query)
      );
    });
  }, [staffMembers, search]);

  const activeCount = staffMembers.filter((staff) => staff.is_active).length;

  const inactiveCount = staffMembers.length - activeCount;

  const openCreateForm = () => {
    setEditingStaff(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (staff) => {
    setEditingStaff(staff);

    setForm({
      first_name: staff.first_name || "",
      last_name: staff.last_name || "",
      email: staff.email || "",
      phone: staff.phone || "",
      password: "",
      delivery_areas: staff.delivery_areas || [],
      is_active: staff.is_active,
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingStaff(null);
    setForm(initialForm);
    setError("");
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAreaChange = (areaId) => {
    setForm((prev) => {
      const selected = prev.delivery_areas.includes(areaId);

      return {
        ...prev,
        delivery_areas: selected
          ? prev.delivery_areas.filter((id) => id !== areaId)
          : [...prev.delivery_areas, areaId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        delivery_areas: form.delivery_areas,
        is_active: form.is_active,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (editingStaff) {
        await updateDeliveryStaff(editingStaff.id, payload);
        setSuccess("Delivery staff updated successfully.");
      } else {
        if (!form.password) {
          setError("Password is required for a new account.");
          setSaving(false);
          return;
        }

        payload.password = form.password;

        await createDeliveryStaff(payload);
        setSuccess("Delivery staff created successfully.");
      }

      closeForm();
      await loadData();
    } catch (err) {
      const data = err.response?.data;

      if (data && typeof data === "object") {
        const messages = Object.entries(data)
          .map(([field, value]) => {
            const message = Array.isArray(value)
              ? value.join(" ")
              : String(value);

            return `${field}: ${message}`;
          })
          .join("\n");

        setError(messages || "Something went wrong.");
      } else {
        setError("Failed to save delivery staff.");
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (staff) => {
    const action = staff.is_active ? "deactivate" : "activate";

    if (!window.confirm(`Are you sure you want to ${action} this account?`)) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await updateDeliveryStaff(staff.id, {
        is_active: !staff.is_active,
      });

      setSuccess(`Account ${action}d successfully.`);
      await loadData();
    } catch (err) {
      setError("Failed to update account status.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Delivery Staff Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage delivery accounts and their assigned service areas.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-3 font-medium text-white hover:bg-green-700"
        >
          <UserPlus size={19} />
          Add Delivery Staff
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Staff"
          value={staffMembers.length}
          icon={Users}
        />

        <SummaryCard title="Active Staff" value={activeCount} icon={Users} />

        <SummaryCard
          title="Inactive Staff"
          value={inactiveCount}
          icon={Power}
        />
      </div>

      {/* Search */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="relative max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={19}
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone..."
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 outline-none focus:border-green-500"
          />
        </div>
      </div>

      {/* Staff List */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-800">
            Delivery Staff ({filteredStaff.length})
          </h2>
        </div>

        {filteredStaff.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No delivery staff found.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredStaff.map((staff) => (
              <div
                key={staff.id}
                className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-semibold text-gray-800">
                      {staff.first_name} {staff.last_name}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        staff.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {staff.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:flex-wrap sm:gap-5">
                    <span className="flex items-center gap-2">
                      <Mail size={15} />
                      {staff.email}
                    </span>

                    <span className="flex items-center gap-2">
                      <Phone size={15} />
                      {staff.phone || "No phone"}
                    </span>
                  </div>

                  <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                    <MapPin
                      size={16}
                      className="mt-0.5 shrink-0 text-green-600"
                    />

                    <div className="flex flex-wrap gap-2">
                      {(staff.delivery_areas || []).length > 0 ? (
                        staff.delivery_areas.map((areaId) => {
                          const area = areas.find((item) => item.id === areaId);

                          return (
                            <span
                              key={areaId}
                              className="rounded-md bg-green-50 px-2 py-1 text-xs text-green-700"
                            >
                              {area?.name || `Area ${areaId}`}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-gray-400">No areas assigned</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditForm(staff)}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil size={16} />
                    Edit
                  </button>

                  <button
                    onClick={() => toggleActive(staff)}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                      staff.is_active
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    <Power size={16} />
                    {staff.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {editingStaff
                    ? "Edit Delivery Staff"
                    : "Create Delivery Staff"}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Configure account details and service areas.
                </p>
              </div>

              <button
                onClick={closeForm}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="First Name"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  required
                />

                <FormField
                  label="Last Name"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  required
                />

                <FormField
                  label="Email Address"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />

                <FormField
                  label="Phone Number"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />

                <div className="sm:col-span-2">
                  <FormField
                    label={
                      editingStaff
                        ? "New Password (leave blank to keep current)"
                        : "Password"
                    }
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    required={!editingStaff}
                  />
                </div>
              </div>

              {/* Area Selection */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Assigned Delivery Areas
                </label>

                <p className="mb-3 text-xs text-gray-500">
                  Select all areas this delivery staff member can serve.
                </p>

                <div className="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 p-4 sm:grid-cols-2">
                  {areas.map((area) => (
                    <label
                      key={area.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-green-50"
                    >
                      <input
                        type="checkbox"
                        checked={form.delivery_areas.includes(area.id)}
                        onChange={() => handleAreaChange(area.id)}
                        className="h-4 w-4 accent-green-600"
                      />

                      <span className="text-sm text-gray-700">
                        {area.parent
                          ? `${areas.find((item) => item.id === area.parent)?.name || ""} - ${area.name}`
                          : area.name}
                      </span>
                    </label>
                  ))}
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Selected areas: {form.delivery_areas.length}
                </p>
              </div>

              {/* Account Status */}
              {editingStaff && (
                <label className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 accent-green-600"
                  />

                  <span className="text-sm font-medium text-gray-700">
                    Account Active
                  </span>
                </label>
              )}

              {error && (
                <div className="whitespace-pre-line rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {editingStaff ? "Save Changes" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{title}</p>
        <div className="rounded-lg bg-green-50 p-2 text-green-600">
          <Icon size={20} />
        </div>
      </div>

      <p className="mt-3 text-3xl font-bold text-gray-800">{value}</p>
    </div>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
      />
    </div>
  );
}

export default AdminDeliveryStaffPage;
