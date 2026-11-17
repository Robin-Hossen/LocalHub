import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Tags, RefreshCw } from "lucide-react";

import {
  getStaffCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/productService";

const initialForm = {
  name: "",
  slug: "",
  description: "",
  parent: "",
  image: null,
  is_active: true,
};

function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(initialForm);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getStaffCategories();
      setCategories(data.results || data);
    } catch (err) {
      console.error(err);
      setError("Unable to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);

    setForm({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      parent: category.parent || "",
      image: null,
      is_active: category.is_active,
    });

    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox" ? checked : type === "file" ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (key === "parent") {
          formData.append(key, value || "");
        } else if (value !== null && value !== "") {
          formData.append(key, value);
        }
      });

      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
      } else {
        await createCategory(formData);
      }

      setShowModal(false);
      setForm(initialForm);
      setEditingCategory(null);

      await fetchCategories();
    } catch (err) {
      console.error("Category save error:", err);

      const data = err.response?.data;

      if (data && typeof data === "object") {
        const messages = Object.entries(data)
          .map(
            ([field, value]) =>
              `${field}: ${Array.isArray(value) ? value.join(", ") : value}`,
          )
          .join("\n");

        setError(messages || "Unable to save category.");
      } else {
        setError("Unable to save category.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`,
    );

    if (!confirmed) return;

    try {
      setError("");
      await deleteCategory(category.id);
      await fetchCategories();
    } catch (err) {
      console.error("Category delete error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to delete category. Products may be using this category.",
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your product categories
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-medium"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {/* Error */}
      {error && !showModal && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm whitespace-pre-line">
          {error}
        </div>
      )}

      {/* Category List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tags size={20} className="text-green-600" />
            <h2 className="font-bold text-gray-800">Category List</h2>
          </div>

          <button
            onClick={fetchCategories}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <RefreshCw size={17} />
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No categories found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Slug</th>
                  <th className="px-5 py-4">Parent</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {category.name}
                    </td>

                    <td className="px-5 py-4 text-gray-500">{category.slug}</td>

                    <td className="px-5 py-4 text-gray-600">
                      {category.parent_name || "—"}
                    </td>

                    <td className="px-5 py-4">
                      {category.is_active ? (
                        <span className="text-green-700 bg-green-50 px-3 py-1 rounded-full text-xs font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold">
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => handleDelete(category)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h2>

              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm whitespace-pre-line">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Category Name *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Slug *</label>
                <input
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g. fresh-fruits"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Parent Category
                </label>
                <select
                  name="parent"
                  value={form.parent}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2.5 bg-white"
                >
                  <option value="">No Parent (Main Category)</option>

                  {categories
                    .filter((category) => category.id !== editingCategory?.id)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Category Image
                </label>

                <input
                  type="file"
                  name="image"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 text-sm"
                />

                {editingCategory?.image && !form.image && (
                  <p className="text-xs text-gray-500 mt-2">
                    Existing image will be kept if you do not select a new one.
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  className="accent-green-600"
                />
                Active Category
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingCategory
                      ? "Update Category"
                      : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCategoriesPage;
