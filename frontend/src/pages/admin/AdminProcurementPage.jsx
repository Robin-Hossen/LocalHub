import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  CheckCircle,
  PackageCheck,
  History,
  X,
  Trash2,
} from "lucide-react";

import {
  getPurchaseOrders,
  getPurchaseOrderDetails,
  createPurchaseOrder,
  updatePurchaseOrder,
  confirmPurchaseOrder,
  receivePurchaseOrder,
  getPurchaseReceipts,
} from "../../services/procurementService";

import { getVendors } from "../../services/vendorService";
import { getStaffProducts } from "../../services/productService";

function AdminProcurementPage() {
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [receipts, setReceipts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("orders");

  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showReceive, setShowReceive] = useState(false);

  const [editingOrder, setEditingOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [vendorId, setVendorId] = useState("");
  const [notes, setNotes] = useState("");
  const [formItems, setFormItems] = useState([
    { product_id: "", quantity: 1, unit_cost: "" },
  ]);

  const [receiveItems, setReceiveItems] = useState([]);
  const [receiveNotes, setReceiveNotes] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const unwrap = (data) => {
    if (Array.isArray(data)) return data;
    return data?.results || [];
  };

  const loadOrders = async () => {
    const data = await getPurchaseOrders();
    setOrders(unwrap(data));
  };

  const loadVendors = async () => {
    const data = await getVendors();
    setVendors(unwrap(data).filter((vendor) => vendor.is_active));
  };

  const loadProducts = async (selectedVendor = "") => {
    if (!selectedVendor) {
      setProducts([]);
      return;
    }

    const data = await getStaffProducts({
      is_active: true,
      vendor: selectedVendor,
    });

    setProducts(unwrap(data));
  };

  const loadReceipts = async () => {
    const data = await getPurchaseReceipts();
    setReceipts(unwrap(data));
  };

  const loadPage = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([loadOrders(), loadVendors(), loadReceipts()]);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to load procurement data.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const resetForm = () => {
    setEditingOrder(null);
    setVendorId("");
    setNotes("");
    setProducts([]);
    setFormItems([{ product_id: "", quantity: 1, unit_cost: "" }]);
    setError("");
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const handleVendorChange = async (value) => {
    setVendorId(value);
    setProducts([]);
    setFormItems([{ product_id: "", quantity: 1, unit_cost: "" }]);

    if (!value) return;

    try {
      await loadProducts(value);
    } catch {
      setError("Unable to load vendor products.");
    }
  };

  const handleItemChange = (index, field, value) => {
    setFormItems((previous) =>
      previous.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const addItemRow = () => {
    setFormItems((previous) => [
      ...previous,
      { product_id: "", quantity: 1, unit_cost: "" },
    ]);
  };

  const removeItemRow = (index) => {
    setFormItems((previous) => previous.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return formItems.reduce((total, item) => {
      return total + Number(item.quantity || 0) * Number(item.unit_cost || 0);
    }, 0);
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        vendor_id: Number(vendorId),
        notes,
        items: formItems.map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          unit_cost: Number(item.unit_cost),
        })),
      };

      await createPurchaseOrder(payload);

      setSuccess("Purchase order created successfully.");
      setShowForm(false);
      resetForm();
      await loadOrders();
    } catch (err) {
      const data = err.response?.data;
      setError(
        data?.detail ||
          data?.non_field_errors?.[0] ||
          "Unable to create purchase order.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (orderId) => {
    try {
      setError("");

      const order = await getPurchaseOrderDetails(orderId);

      if (order.status !== "DRAFT") {
        setError("Only draft purchase orders can be edited.");
        return;
      }

      setEditingOrder(order);
      setVendorId(String(order.vendor));
      setNotes(order.notes || "");

      const data = await getStaffProducts({
        is_active: true,
        vendor: order.vendor,
      });

      setProducts(unwrap(data));

      setFormItems(
        order.items.map((item) => ({
          product_id: String(item.product),
          quantity: item.quantity,
          unit_cost: item.unit_cost,
        })),
      );

      setShowForm(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to load purchase order.");
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        vendor_id: Number(vendorId),
        notes,
        items: formItems.map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          unit_cost: Number(item.unit_cost),
        })),
      };

      await updatePurchaseOrder(editingOrder.id, payload);

      setSuccess("Purchase order updated successfully.");
      setShowForm(false);
      resetForm();
      await loadOrders();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to update purchase order.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async (order) => {
    if (!window.confirm(`Confirm purchase order ${order.purchase_number}?`))
      return;

    try {
      setError("");
      await confirmPurchaseOrder(order.id);
      setSuccess("Purchase order confirmed successfully.");
      await loadOrders();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to confirm purchase order.",
      );
    }
  };

  const openDetails = async (orderId) => {
    try {
      setError("");
      const data = await getPurchaseOrderDetails(orderId);
      setSelectedOrder(data);
      setShowDetails(true);
    } catch (err) {
      setError("Unable to load purchase order details.");
    }
  };

  const openReceiveForm = async (order) => {
    try {
      setError("");

      const data = await getPurchaseOrderDetails(order.id);

      if (!["CONFIRMED", "PARTIALLY_RECEIVED"].includes(data.status)) {
        setError("This purchase order cannot receive stock.");
        return;
      }

      setSelectedOrder(data);

      setReceiveItems(
        data.items
          .filter((item) => item.received_quantity < item.quantity)
          .map((item) => ({
            purchase_order_item_id: item.id,
            product_name: item.product_name,
            quantity: "",
            remaining: item.quantity - item.received_quantity,
          })),
      );

      setReceiveNotes("");
      setShowReceive(true);
    } catch {
      setError("Unable to load receiving information.");
    }
  };

  const handleReceiveChange = (index, value) => {
    setReceiveItems((previous) =>
      previous.map((item, i) =>
        i === index ? { ...item, quantity: value } : item,
      ),
    );
  };

  const handleReceive = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const items = receiveItems
        .filter((item) => Number(item.quantity) > 0)
        .map((item) => ({
          purchase_order_item_id: item.purchase_order_item_id,
          quantity: Number(item.quantity),
        }));

      if (!items.length) {
        setError("Enter at least one receiving quantity.");
        return;
      }

      await receivePurchaseOrder(selectedOrder.id, {
        items,
        notes: receiveNotes,
      });

      setSuccess("Stock received successfully.");
      setShowReceive(false);

      await Promise.all([loadOrders(), loadReceipts()]);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to receive stock.");
    } finally {
      setSaving(false);
    }
  };

  const filteredOrders = orders.filter((order) =>
    `${order.purchase_number} ${order.vendor_name} ${order.status}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const money = (value) =>
    `৳${Number(value || 0).toLocaleString("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const statusStyle = (status) => {
    const styles = {
      DRAFT: "bg-gray-100 text-gray-700",
      CONFIRMED: "bg-blue-100 text-blue-700",
      PARTIALLY_RECEIVED: "bg-yellow-100 text-yellow-700",
      RECEIVED: "bg-green-100 text-green-700",
      CANCELLED: "bg-red-100 text-red-700",
    };

    return styles[status] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <RefreshCw className="animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Procurement Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage purchase orders, stock receiving and receipts.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 font-medium text-white hover:bg-green-700"
        >
          <Plus size={18} />
          Create Purchase Order
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError("")}>
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <span>{success}</span>
          <button onClick={() => setSuccess("")}>
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${
            activeTab === "orders"
              ? "border-green-600 text-green-700"
              : "border-transparent text-gray-500"
          }`}
        >
          <PackageCheck size={17} />
          Purchase Orders
        </button>

        <button
          onClick={() => setActiveTab("receipts")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${
            activeTab === "receipts"
              ? "border-green-600 text-green-700"
              : "border-transparent text-gray-500"
          }`}
        >
          <History size={17} />
          Receipt History
        </button>
      </div>

      {activeTab === "orders" ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-col justify-between gap-3 border-b border-gray-100 p-4 sm:flex-row">
            <div>
              <h2 className="font-semibold text-gray-800">Purchase Orders</h2>
              <p className="text-sm text-gray-500">
                {orders.length} total orders
              </p>
            </div>

            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search purchase orders..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm outline-none focus:border-green-500 sm:w-72"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">Purchase Number</th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Subtotal</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {order.purchase_number}
                    </td>
                    <td className="px-4 py-3">{order.vendor_name}</td>
                    <td className="px-4 py-3">{order.items?.length || 0}</td>
                    <td className="px-4 py-3 font-medium">
                      {money(order.subtotal)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(order.status)}`}
                      >
                        {order.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openDetails(order.id)}
                          title="View Details"
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <Eye size={17} />
                        </button>

                        {order.status === "DRAFT" && (
                          <>
                            <button
                              onClick={() => handleEdit(order.id)}
                              title="Edit Draft"
                              className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              onClick={() => handleConfirm(order)}
                              title="Confirm Order"
                              className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                            >
                              <CheckCircle size={17} />
                            </button>
                          </>
                        )}

                        {["CONFIRMED", "PARTIALLY_RECEIVED"].includes(
                          order.status,
                        ) && (
                          <button
                            onClick={() => openReceiveForm(order)}
                            title="Receive Stock"
                            className="rounded-lg p-2 text-orange-600 hover:bg-orange-50"
                          >
                            <PackageCheck size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-4 py-12 text-center text-gray-500"
                    >
                      No purchase orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 p-4">
            <h2 className="font-semibold text-gray-800">
              Purchase Receipt History
            </h2>
            <p className="text-sm text-gray-500">
              {receipts.length} total receipts
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">Purchase Number</th>
                  <th className="px-4 py-3">Received By</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {receipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td className="px-4 py-3 font-medium">
                      {receipt.purchase_number}
                    </td>
                    <td className="px-4 py-3">{receipt.received_by_email}</td>
                    <td className="px-4 py-3">{receipt.items?.length || 0}</td>
                    <td className="px-4 py-3">
                      {new Date(receipt.received_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {receipt.notes || "—"}
                    </td>
                  </tr>
                ))}

                {receipts.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-4 py-12 text-center text-gray-500"
                    >
                      No receipts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white p-5">
              <h2 className="text-lg font-bold text-gray-800">
                {editingOrder ? "Edit Purchase Order" : "Create Purchase Order"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={editingOrder ? handleUpdate : handleCreate}
              className="space-y-5 p-5"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Vendor
                </label>
                <select
                  required
                  value={vendorId}
                  disabled={Boolean(editingOrder)}
                  onChange={(e) => handleVendorChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-green-500 disabled:bg-gray-100"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
                {editingOrder && (
                  <p className="mt-1 text-xs text-gray-500">
                    Vendor cannot be changed while editing.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">
                    Purchase Items
                  </h3>
                  <button
                    type="button"
                    disabled={!vendorId}
                    onClick={addItemRow}
                    className="flex items-center gap-1 text-sm font-medium text-green-700 disabled:opacity-40"
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                </div>

                {formItems.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-3 sm:grid-cols-12"
                  >
                    <div className="sm:col-span-5">
                      <label className="mb-1 block text-xs text-gray-500">
                        Product
                      </label>
                      <select
                        required
                        value={item.product_id}
                        onChange={(e) =>
                          handleItemChange(index, "product_id", e.target.value)
                        }
                        disabled={!vendorId}
                        className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
                      >
                        <option value="">Select Product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs text-gray-500">
                        Quantity
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="mb-1 block text-xs text-gray-500">
                        Unit Cost (৳)
                      </label>
                      <input
                        required
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.unit_cost}
                        onChange={(e) =>
                          handleItemChange(index, "unit_cost", e.target.value)
                        }
                        placeholder="0.00"
                        className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
                      />
                    </div>

                    <div className="flex items-end justify-between sm:col-span-2">
                      <span className="pb-2 text-xs font-medium text-gray-600">
                        {money(
                          Number(item.quantity || 0) *
                            Number(item.unit_cost || 0),
                        )}
                      </span>
                      <button
                        type="button"
                        disabled={formItems.length === 1}
                        onClick={() => removeItemRow(index)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-30"
                        title="Remove Item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end rounded-lg bg-gray-50 p-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Subtotal</p>
                    <p className="text-xl font-bold text-gray-800">
                      {money(calculateSubtotal())}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-green-500"
                />
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || !vendorId}
                  className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingOrder
                      ? "Update Purchase Order"
                      : "Create Purchase Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetails && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="text-lg font-bold">Purchase Order Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Purchase Number</p>
                  <p className="font-semibold">
                    {selectedOrder.purchase_number}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Vendor</p>
                  <p className="font-semibold">{selectedOrder.vendor_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs ${statusStyle(selectedOrder.status)}`}
                  >
                    {selectedOrder.status.replaceAll("_", " ")}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500">Created By</p>
                  <p className="font-semibold">
                    {selectedOrder.created_by_email}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left">Product</th>
                      <th className="p-3 text-right">Ordered</th>
                      <th className="p-3 text-right">Received</th>
                      <th className="p-3 text-right">Unit Cost</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-xs text-gray-500">
                            {item.product_sku}
                          </p>
                        </td>
                        <td className="p-3 text-right">{item.quantity}</td>
                        <td className="p-3 text-right">
                          {item.received_quantity}
                        </td>
                        <td className="p-3 text-right">
                          {money(item.unit_cost)}
                        </td>
                        <td className="p-3 text-right">
                          {money(item.line_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end border-t pt-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Subtotal</p>
                  <p className="text-xl font-bold">
                    {money(selectedOrder.subtotal)}
                  </p>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-sm">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showReceive && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-bold">Receive Stock</h2>
                <p className="text-sm text-gray-500">
                  {selectedOrder.purchase_number}
                </p>
              </div>
              <button
                onClick={() => setShowReceive(false)}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReceive} className="space-y-4 p-5">
              {receiveItems.map((item, index) => (
                <div
                  key={item.purchase_order_item_id}
                  className="rounded-lg border p-3"
                >
                  <div className="mb-2 flex justify-between gap-3">
                    <p className="font-medium text-gray-800">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Remaining: {item.remaining}
                    </p>
                  </div>

                  <label className="mb-1 block text-xs text-gray-500">
                    Receiving Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={item.remaining}
                    step="1"
                    value={item.quantity}
                    onChange={(e) => handleReceiveChange(index, e.target.value)}
                    placeholder="Enter quantity"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
              ))}

              {receiveItems.length === 0 && (
                <p className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
                  All items have already been received.
                </p>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Receipt Notes
                </label>
                <textarea
                  rows="2"
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="Optional notes..."
                />
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowReceive(false)}
                  className="rounded-lg border px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || receiveItems.length === 0}
                  className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {saving ? "Processing..." : "Receive Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProcurementPage;
