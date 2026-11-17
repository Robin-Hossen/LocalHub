import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Package,
  RefreshCw,
  Pencil,
  X,
  Upload,
} from "lucide-react";

import {
  getStaffProducts,
  createProduct,
  updateProduct,
  getStaffCategories,
} from "../../services/productService";

import { getVendors } from "../../services/vendorService";

const initialForm = {
  name: "",
  sku: "",
  category: "",
  vendor: "",
  description: "",
  selling_price: "",
  cost_price: "",
  image: null,
  is_available: true,
  is_active: true,
};

function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(initialForm);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getStaffProducts({
        search: search || undefined,
      });

      setProducts(data.results || data);
    } catch (err) {
      console.error("Products fetch error:", err);
      setError("Unable to load products.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const [categoryData, vendorData] = await Promise.all([
        getStaffCategories(),
        getVendors(),
      ]);

      setCategories(categoryData.results || categoryData);
      setVendors(vendorData.results || vendorData);
    } catch (err) {
      console.error("Form data fetch error:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchFormData();
  }, []);

  const formatCurrency = (amount) =>
    `৳${Number(amount || 0).toLocaleString("en-BD")}`;

  const openAddModal = () => {
    setEditingProduct(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);

    setForm({
      name: product.name || "",
      sku: product.sku || "",
      category: product.category || "",
      vendor: product.vendor || "",
      description: product.description || "",
      selling_price: product.selling_price || "",
      cost_price: product.cost_price || "",
      image: null,
      is_available: product.is_available,
      is_active: product.is_active,
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
        if (value !== null && value !== "") {
          formData.append(key, value);
        }
      });

      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
      } else {
        await createProduct(formData);
      }

      setShowModal(false);
      setForm(initialForm);
      setEditingProduct(null);

      await fetchProducts();
    } catch (err) {
      console.error("Product save error:", err);

      const responseData = err.response?.data;

      if (responseData && typeof responseData === "object") {
        const messages = Object.entries(responseData)
          .map(([field, messages]) => {
            const detail = Array.isArray(messages)
              ? messages.join(", ")
              : messages;

            return `${field}: ${detail}`;
          })
          .join("\n");

        setError(messages || "Unable to save product.");
      } else {
        setError("Unable to save product. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your store products
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-medium"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Search */}
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
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchProducts();
              }}
              placeholder="Search products..."
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button
            type="button"
            onClick={fetchProducts}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-3 rounded-xl font-medium"
          >
            Search
          </button>

          <button
            type="button"
            onClick={fetchProducts}
            className="flex items-center justify-center gap-2 border border-gray-200 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Package size={20} className="text-green-600" />
          <h2 className="font-bold text-gray-800">Product List</h2>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading products...
          </div>
        ) : error && !showModal ? (
          <div className="p-10 text-center text-red-500">{error}</div>
        ) : products.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No products found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">SKU</th>
                  <th className="px-5 py-4">Selling Price</th>
                  <th className="px-5 py-4">Cost Price</th>
                  <th className="px-5 py-4">Availability</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {product.name}
                    </td>

                    <td className="px-5 py-4 text-gray-500">{product.sku}</td>

                    <td className="px-5 py-4 font-medium">
                      {formatCurrency(product.selling_price)}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {formatCurrency(product.cost_price)}
                    </td>

                    <td className="px-5 py-4">
                      {product.is_available ? (
                        <span className="text-green-700 bg-green-50 px-3 py-1 rounded-full text-xs font-semibold">
                          Available
                        </span>
                      ) : (
                        <span className="text-red-700 bg-red-50 px-3 py-1 rounded-full text-xs font-semibold">
                          Unavailable
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {product.is_active ? (
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
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit product"
                      >
                        <Pencil size={17} />
                      </button>
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
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>

              <button
                type="button"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Product Name *
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
                  <label className="block text-sm font-medium mb-1">
                    SKU *
                  </label>
                  <input
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2.5 bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Vendor *
                  </label>
                  <select
                    name="vendor"
                    value={form.vendor}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2.5 bg-white"
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Selling Price *
                  </label>
                  <input
                    type="number"
                    name="selling_price"
                    value={form.selling_price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Cost Price *
                  </label>
                  <input
                    type="number"
                    name="cost_price"
                    value={form.cost_price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
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
                  Product Image
                </label>

                <label className="flex items-center gap-3 border border-dashed rounded-xl p-4 cursor-pointer hover:bg-gray-50">
                  <Upload size={22} className="text-green-600" />
                  <span className="text-sm text-gray-600">
                    {form.image
                      ? form.image.name
                      : "Choose an image (JPG, PNG, WEBP)"}
                  </span>

                  <input
                    type="file"
                    name="image"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleChange}
                    className="hidden"
                  />
                </label>

                {editingProduct?.image && !form.image && (
                  <p className="text-xs text-gray-500 mt-2">
                    Current image will be kept if no new image is selected.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="is_available"
                    checked={form.is_available}
                    onChange={handleChange}
                    className="accent-green-600"
                  />
                  Available
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                    className="accent-green-600"
                  />
                  Active
                </label>
              </div>

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
                    : editingProduct
                      ? "Update Product"
                      : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProductsPage;
