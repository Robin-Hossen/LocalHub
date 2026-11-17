import { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Package,
  AlertTriangle,
  Plus,
  Minus,
  Pencil,
  History,
  X,
} from "lucide-react";

import {
  getStockList,
  addStock,
  removeStock,
  updateStock,
  getStockMovements,
} from "../../services/inventoryService";

import { getStaffProducts } from "../../services/productService";

function AdminInventoryPage() {
  const [stocks, setStocks] = useState([]);
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);

  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [movementFilter, setMovementFilter] = useState("");

  const [modal, setModal] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    product: "",
    quantity: "",
    movement_type: "DAMAGE",
    reference: "",
    notes: "",
    reorder_level: "",
  });

  const fetchStocks = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getStockList();
      setStocks(data.results || data);
    } catch (err) {
      console.error("Stock loading error:", err);
      setError("Unable to load inventory.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);

      const data = await getStaffProducts();
      setProducts(data.results || data);
    } catch (err) {
      console.error("Product loading error:", err);
      setFormError("Unable to load products.");
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchMovements = async () => {
    try {
      setHistoryLoading(true);

      const params = movementFilter ? { movement_type: movementFilter } : {};

      const data = await getStockMovements(params);
      setMovements(data.results || data);
    } catch (err) {
      console.error("Movement loading error:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  useEffect(() => {
    if (showHistory) {
      fetchMovements();
    }
  }, [showHistory, movementFilter]);

  const openStockModal = async (type, stock = null) => {
    setFormError("");

    setForm({
      product: "",
      quantity: "",
      movement_type: "DAMAGE",
      reference: "",
      notes: "",
      reorder_level: stock ? stock.reorder_level : "",
    });

    setModal({ type, stock });

    if (type === "add" || type === "remove") {
      await fetchProducts();
    }
  };

  const closeModal = () => {
    if (formLoading) return;

    setModal(null);
    setFormError("");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setFormLoading(true);
      setFormError("");

      if (modal.type === "add") {
        await addStock({
          product: Number(form.product),
          quantity: Number(form.quantity),
          reference: form.reference,
          notes: form.notes,
        });
      }

      if (modal.type === "remove") {
        await removeStock({
          product: Number(form.product),
          quantity: Number(form.quantity),
          movement_type: form.movement_type,
          reference: form.reference,
          notes: form.notes,
        });
      }

      if (modal.type === "edit") {
        await updateStock(modal.stock.id, {
          reorder_level: Number(form.reorder_level),
        });
      }

      setModal(null);
      await fetchStocks();

      if (showHistory && modal.type !== "edit") {
        await fetchMovements();
      }
    } catch (err) {
      console.error("Inventory operation error:", err);

      const data = err.response?.data;

      if (data && typeof data === "object") {
        const message = Object.values(data).flat().join(" ");
        setFormError(message || "Operation failed.");
      } else {
        setFormError("Unable to complete the operation.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const filteredStocks = stocks.filter((stock) =>
    `${stock.product_name} ${stock.product_sku}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const lowStockCount = stocks.filter(
    (stock) => stock.sellable_quantity <= stock.reorder_level,
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Inventory Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor and manage product stock.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => openStockModal("add")}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus size={17} />
            Add Stock
          </button>

          <button
            onClick={() => openStockModal("remove")}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Minus size={17} />
            Remove Stock
          </button>

          <button
            onClick={() => setShowHistory((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <History size={17} />
            {showHistory ? "Stock List" : "Stock History"}
          </button>

          <button
            onClick={fetchStocks}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <Package size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">
                Products with Stock Records
              </p>
              <h2 className="text-2xl font-bold text-gray-800">
                {stocks.length}
              </h2>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
              <AlertTriangle size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Low Stock Products</p>
              <h2 className="text-2xl font-bold text-gray-800">
                {lowStockCount}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Stock List */}
      {!showHistory && (
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">Stock List</h2>

            <div className="relative max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product name or SKU..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {error && <div className="p-5 text-red-600 text-sm">{error}</div>}

          {loading ? (
            <div className="p-10 text-center text-gray-500">
              Loading inventory...
            </div>
          ) : !error && filteredStocks.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              No stock records found.
            </div>
          ) : !error ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">SKU</th>
                    <th className="px-5 py-3">Available</th>
                    <th className="px-5 py-3">Reserved</th>
                    <th className="px-5 py-3">Sellable</th>
                    <th className="px-5 py-3">Reorder Level</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredStocks.map((stock) => {
                    const isLow =
                      stock.sellable_quantity <= stock.reorder_level;

                    return (
                      <tr key={stock.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-medium text-gray-800">
                          {stock.product_name}
                        </td>
                        <td className="px-5 py-4 text-gray-500">
                          {stock.product_sku}
                        </td>
                        <td className="px-5 py-4">
                          {stock.available_quantity}
                        </td>
                        <td className="px-5 py-4">{stock.reserved_quantity}</td>
                        <td className="px-5 py-4 font-semibold">
                          {stock.sellable_quantity}
                        </td>
                        <td className="px-5 py-4">{stock.reorder_level}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              isLow
                                ? "bg-orange-50 text-orange-600"
                                : "bg-green-50 text-green-600"
                            }`}
                          >
                            {isLow ? "Low Stock" : "In Stock"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => openStockModal("edit", stock)}
                            title="Edit Reorder Level"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Pencil size={17} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}

      {/* Stock History */}
      {showHistory && (
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-800">
                Stock Movement History
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Track stock additions, removals and other movements.
              </p>
            </div>

            <select
              value={movementFilter}
              onChange={(e) => setMovementFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Movements</option>
              <option value="PURCHASE">Purchase</option>
              <option value="SALE">Sale</option>
              <option value="DAMAGE">Damage</option>
              <option value="ADJUSTMENT_IN">Adjustment In</option>
              <option value="ADJUSTMENT_OUT">Adjustment Out</option>
              <option value="CUSTOMER_RETURN">Customer Return</option>
              <option value="RESERVE">Reserve</option>
              <option value="RELEASE">Release</option>
            </select>
          </div>

          {historyLoading ? (
            <div className="p-10 text-center text-gray-500">
              Loading stock history...
            </div>
          ) : movements.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              No stock movements found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Movement</th>
                    <th className="px-5 py-3">Quantity</th>
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3">Notes</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {movements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 font-medium text-gray-800">
                        {movement.product_name}
                      </td>
                      <td className="px-5 py-4">
                        {movement.movement_type.replaceAll("_", " ")}
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        {movement.quantity}
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {movement.reference || "—"}
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {movement.notes || "—"}
                      </td>
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                        {new Date(movement.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add / Remove / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {modal.type === "add" && "Add Stock"}
                  {modal.type === "remove" && "Remove Stock"}
                  {modal.type === "edit" && "Edit Reorder Level"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {modal.type === "add" && "Add quantity to product inventory."}
                  {modal.type === "remove" && "Remove quantity from inventory."}
                  {modal.type === "edit" && modal.stock.product_name}
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={formLoading}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              {(modal.type === "add" || modal.type === "remove") && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product
                    </label>

                    <select
                      name="product"
                      value={form.product}
                      onChange={handleFormChange}
                      required
                      disabled={productsLoading}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">
                        {productsLoading
                          ? "Loading products..."
                          : "Select Product"}
                      </option>

                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      min="1"
                      value={form.quantity}
                      onChange={handleFormChange}
                      required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter quantity"
                    />
                  </div>
                </>
              )}

              {modal.type === "remove" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Removal Reason
                  </label>
                  <select
                    name="movement_type"
                    value={form.movement_type}
                    onChange={handleFormChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="DAMAGE">Damage</option>
                    <option value="ADJUSTMENT_OUT">Adjustment Out</option>
                  </select>
                </div>
              )}

              {modal.type === "edit" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    name="reorder_level"
                    min="0"
                    value={form.reorder_level}
                    onChange={handleFormChange}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    A low-stock warning appears when sellable quantity reaches
                    this level.
                  </p>
                </div>
              )}

              {(modal.type === "add" || modal.type === "remove") && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reference (Optional)
                    </label>
                    <input
                      type="text"
                      name="reference"
                      value={form.reference}
                      onChange={handleFormChange}
                      maxLength={100}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Reference number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleFormChange}
                      rows="3"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Write a note..."
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={formLoading}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formLoading || productsLoading}
                  className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {formLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminInventoryPage;
