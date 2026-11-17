import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Image as ImageIcon,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";

import {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from "../../services/bannerService";

const initialForm = {
  title: "",
  subtitle: "",
  image: null,
  layout: "FULL_WIDTH",
  placement: "HERO",
  button_text: "",
  button_link: "",
  position: 0,
  is_active: true,
  start_date: "",
  end_date: "",
};

const getImageUrl = (image) => {
  if (!image) return "";
  if (image.startsWith("http")) return image;
  return `http://127.0.0.1:8000${image}`;
};

const formatDateTimeLocal = (date) => {
  if (!date) return "";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "";

  const offset = value.getTimezoneOffset() * 60000;

  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
};

function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  const loadBanners = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getBanners();
      setBanners(data.results ?? data);
    } catch (err) {
      console.error(err);
      setError("Unable to load banners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (name === "image" && files?.[0]) {
      const file = files[0];

      setForm((prev) => ({
        ...prev,
        image: file,
      }));

      setPreview(URL.createObjectURL(file));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(initialForm);
    setPreview("");
    setError("");
    setShowForm(true);
  };

  const openEditForm = (banner) => {
    setEditingId(banner.id);

    setForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      image: null,
      layout: banner.layout || "FULL_WIDTH",
      placement: banner.placement || "HERO",
      button_text: banner.button_text || "",
      button_link: banner.button_link || "",
      position: banner.position ?? 0,
      is_active: banner.is_active,
      start_date: formatDateTimeLocal(banner.start_date),
      end_date: formatDateTimeLocal(banner.end_date),
    });

    setPreview(banner.image ? getImageUrl(banner.image) : "");
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(initialForm);
    setPreview("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        // Keep existing image if no new image is selected.
        if (key === "image" && !(value instanceof File)) {
          return;
        }

        // Explicitly send empty dates so old dates can be cleared.
        if (key === "start_date" || key === "end_date") {
          formData.append(key, value || "");
          return;
        }

        if (value === null || value === undefined || value === "") {
          return;
        }

        formData.append(key, value);
      });

      if (editingId) {
        await updateBanner(editingId, formData);
      } else {
        if (!form.image) {
          setError("Please select a banner image.");
          return;
        }

        await createBanner(formData);
      }

      closeForm();
      await loadBanners();
    } catch (err) {
      console.error(err);

      const data = err.response?.data;

      setError(
        data
          ? Object.entries(data)
              .map(([key, value]) => {
                const message = Array.isArray(value)
                  ? value.join(", ")
                  : typeof value === "object"
                    ? JSON.stringify(value)
                    : value;

                return `${key}: ${message}`;
              })
              .join(" | ")
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) {
      return;
    }

    try {
      await deleteBanner(id);
      await loadBanners();
    } catch (err) {
      console.error(err);
      alert("Unable to delete banner.");
    }
  };

  const handleToggleStatus = async (banner) => {
    try {
      const formData = new FormData();
      formData.append("is_active", !banner.is_active);

      await updateBanner(banner.id, formData);
      await loadBanners();
    } catch (err) {
      console.error(err);
      alert("Unable to update banner status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Banner Management
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Manage homepage hero and promotional banners.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
        >
          <Plus size={18} />
          Add Banner
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white border p-5">
          <p className="text-sm text-gray-500">Total Banners</p>
          <p className="text-2xl font-bold mt-2">{banners.length}</p>
        </div>

        <div className="rounded-xl bg-white border p-5">
          <p className="text-sm text-gray-500">Active Banners</p>
          <p className="text-2xl font-bold text-green-700 mt-2">
            {banners.filter((b) => b.is_active).length}
          </p>
        </div>

        <div className="rounded-xl bg-white border p-5">
          <p className="text-sm text-gray-500">Inactive Banners</p>
          <p className="text-2xl font-bold text-gray-600 mt-2">
            {banners.filter((b) => !b.is_active).length}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && !showForm && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}

          <button onClick={loadBanners} className="ml-3 underline">
            Retry
          </button>
        </div>
      )}

      {/* Banner List */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-semibold text-gray-800">All Banners</h3>

          <button
            onClick={loadBanners}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-green-700"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading banners...
          </div>
        ) : banners.length === 0 ? (
          <div className="p-10 text-center">
            <ImageIcon className="mx-auto text-gray-300" size={40} />

            <p className="font-medium text-gray-700 mt-3">No banners yet</p>

            <p className="text-sm text-gray-500 mt-1">
              Create your first homepage banner.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row gap-4 md:items-center"
              >
                <div className="w-full md:w-52 h-28 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {banner.image ? (
                    <img
                      src={getImageUrl(banner.image)}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      <ImageIcon size={30} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-gray-800">
                      {banner.title}
                    </h4>

                    <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                      ID: {banner.id}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {banner.subtitle || "No subtitle"}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                    <span>Placement: {banner.placement || "HERO"}</span>

                    <span>•</span>

                    <span>Layout: {banner.layout}</span>

                    <span>•</span>

                    <span>Position: {banner.position}</span>

                    {banner.start_date && (
                      <span>• From: {banner.start_date}</span>
                    )}

                    {banner.end_date && <span>• Until: {banner.end_date}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      banner.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {banner.is_active ? "Active" : "Inactive"}
                  </span>

                  <button
                    onClick={() => handleToggleStatus(banner)}
                    title={banner.is_active ? "Deactivate" : "Activate"}
                    className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                  >
                    {banner.is_active ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>

                  <button
                    onClick={() => openEditForm(banner)}
                    title="Edit"
                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    onClick={() => handleDelete(banner.id)}
                    title="Delete"
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 overflow-y-auto flex items-start justify-center">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-6 shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">
                {editingId ? `Edit Banner #${editingId}` : "Create Banner"}
              </h3>

              <button
                onClick={closeForm}
                className="text-gray-500 hover:text-gray-800"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Title *
                </label>

                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Subtitle
                </label>

                <textarea
                  name="subtitle"
                  value={form.subtitle}
                  onChange={handleChange}
                  rows={2}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Banner Image {editingId ? "(optional)" : "*"}
                </label>

                <input
                  type="file"
                  name="image"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleChange}
                  required={!editingId}
                  className="w-full rounded-lg border p-2 text-sm"
                />

                {preview && (
                  <img
                    src={preview}
                    alt="Banner preview"
                    className="mt-3 w-full max-h-52 object-cover rounded-lg"
                  />
                )}

                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG or WebP. Maximum 5 MB.
                </p>
              </div>

              {/* Placement, Layout and Position */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Banner Placement
                  </label>

                  <select
                    name="placement"
                    value={form.placement}
                    onChange={handleChange}
                    className="w-full rounded-lg border px-3 py-2"
                  >
                    <option value="HERO">Hero Banner</option>
                    <option value="PROMOTIONAL">Promotional Banner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Layout
                  </label>

                  <select
                    name="layout"
                    value={form.layout}
                    onChange={handleChange}
                    className="w-full rounded-lg border px-3 py-2"
                  >
                    <option value="FULL_WIDTH">Full Width</option>
                    <option value="LEFT_IMAGE">Image Left</option>
                    <option value="RIGHT_IMAGE">Image Right</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Display Position
                  </label>

                  <input
                    type="number"
                    name="position"
                    min="0"
                    value={form.position}
                    onChange={handleChange}
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Button Text
                  </label>

                  <input
                    name="button_text"
                    value={form.button_text}
                    onChange={handleChange}
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Button Link
                  </label>

                  <input
                    name="button_link"
                    value={form.button_link}
                    onChange={handleChange}
                    placeholder="/products"
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Start Date
                  </label>

                  <input
                    type="datetime-local"
                    name="start_date"
                    value={form.start_date}
                    onChange={handleChange}
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    End Date
                  </label>

                  <input
                    type="datetime-local"
                    name="end_date"
                    value={form.end_date}
                    onChange={handleChange}
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>
              </div>

              {/* Publish */}
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 accent-green-700"
                />
                Publish this banner
              </label>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border px-4 py-2 text-sm font-medium"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-green-700 px-5 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Banner"
                      : "Create Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBannersPage;
