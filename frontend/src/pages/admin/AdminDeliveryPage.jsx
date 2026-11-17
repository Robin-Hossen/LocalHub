
import { useCallback, useEffect, useState } from "react";
import {
  Truck,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Plus,
  X,
  Eye,
  History,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";

import {
  getDeliveryAssignments,
  getDeliveryStaff,
  getShippedOrders,
  createDeliveryAssignment,
  getDeliveryDetails,
  getDeliveryHistory,
  reassignDelivery,
} from "../../services/deliveryService";

const statusStyles = {
  ASSIGNED: "bg-blue-100 text-blue-700",
  PICKED_UP: "bg-amber-100 text-amber-700",
  IN_TRANSIT: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

const statusOptions = [
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
  "FAILED",
];

const getErrorMessage = (err, fallback) => {
  const data = err.response?.data;

  if (typeof data === "string") return data;
  if (data?.detail) return data.detail;
  if (data?.non_field_errors?.[0]) return data.non_field_errors[0];

  if (data && typeof data === "object") {
    const firstValue = Object.values(data)[0];

    if (Array.isArray(firstValue)) return firstValue[0];
    if (typeof firstValue === "string") return firstValue;
  }

  return fallback;
};

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString();
};

const formatStatus = (status) => {
  return status?.replaceAll("_", " ") || "—";
};

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="mt-2 text-2xl font-bold text-gray-800">
            {value}
          </h3>
        </div>

        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white p-5">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function AdminDeliveryPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPage, setNextPage] = useState(null);
  const [previousPage, setPreviousPage] = useState(null);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [staffFilter, setStaffFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [deliveryStaff, setDeliveryStaff] = useState([]);

  // Create assignment
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [shippedOrders, setShippedOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Details and history
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [history, setHistory] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // Reassignment
  const [showReassignForm, setShowReassignForm] = useState(false);
  const [reassignDeliveryId, setReassignDeliveryId] = useState(null);
  const [reassignStaff, setReassignStaff] = useState("");
  const [reassignNotes, setReassignNotes] = useState("");
  const [reassignLoading, setReassignLoading] = useState(false);
  const [reassignError, setReassignError] = useState("");

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        ...(appliedSearch && { search: appliedSearch }),
        ...(statusFilter && { status: statusFilter }),
        ...(staffFilter && { delivery_staff: staffFilter }),
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo }),
      };

      const data = await getDeliveryAssignments(params);

      setDeliveries(data.results || []);
      setTotalCount(data.count || 0);
      setNextPage(data.next || null);
      setPreviousPage(data.previous || null);
    } catch (err) {
      console.error("Delivery loading error:", err);
      setError(
        getErrorMessage(err, "Failed to load delivery assignments.")
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    appliedSearch,
    statusFilter,
    staffFilter,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  useEffect(() => {
    const loadStaff = async () => {
      try {
        const data = await getDeliveryStaff();
        setDeliveryStaff(data.results || []);
      } catch (err) {
        console.error("Delivery staff loading error:", err);
      }
    };

    loadStaff();
  }, []);

  const resetFilters = () => {
    setSearchInput("");
    setAppliedSearch("");
    setStatusFilter("");
    setStaffFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(searchInput.trim());
  };

  // Create assignment
  const openCreateForm = async () => {
    try {
      setFormError("");
      setFormLoading(true);

      const [ordersData, staffData] = await Promise.all([
        getShippedOrders(),
        getDeliveryStaff(),
      ]);

      const existingAssignments = await getDeliveryAssignments({
        page_size: 100,
      });

      const assignedOrderIds = new Set(
        (existingAssignments.results || []).map(
          (item) => item.order
        )
      );

      setShippedOrders(
        (ordersData.results || []).filter(
          (order) => !assignedOrderIds.has(order.id)
        )
      );

      setDeliveryStaff(staffData.results || []);
      setSelectedOrder("");
      setSelectedStaff("");
      setAssignmentNotes("");
      setShowCreateForm(true);
    } catch (err) {
      console.error("Assignment form loading error:", err);
      setFormError(
        getErrorMessage(
          err,
          "Failed to load orders or delivery staff."
        )
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();

    if (!selectedOrder || !selectedStaff) {
      setFormError("Please select an order and delivery staff.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      await createDeliveryAssignment({
        order: Number(selectedOrder),
        delivery_staff: Number(selectedStaff),
        notes: assignmentNotes,
      });

      setShowCreateForm(false);
      setPage(1);
      await fetchDeliveries();
    } catch (err) {
      console.error("Assignment creation error:", err);
      setFormError(
        getErrorMessage(err, "Failed to create delivery assignment.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Delivery details and history
  const openDetails = async (deliveryId) => {
    try {
      setDetailsLoading(true);
      setDetailsError("");
      setSelectedDelivery(null);
      setHistory([]);

      const [detailsData, historyData] = await Promise.all([
        getDeliveryDetails(deliveryId),
        getDeliveryHistory(deliveryId),
      ]);

      setSelectedDelivery(detailsData);
      setHistory(historyData.results || []);
    } catch (err) {
      console.error("Delivery details error:", err);
      setDetailsError(
        getErrorMessage(err, "Failed to load delivery details.")
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  // Reassign failed delivery
  const openReassignForm = (delivery) => {
    setReassignDeliveryId(delivery.id);
    setReassignStaff("");
    setReassignNotes("");
    setReassignError("");
    setShowReassignForm(true);
  };

  const handleReassign = async (e) => {
    e.preventDefault();

    if (!reassignStaff) {
      setReassignError("Please select delivery staff.");
      return;
    }

    try {
      setReassignLoading(true);
      setReassignError("");

      await reassignDelivery(reassignDeliveryId, {
        delivery_staff: Number(reassignStaff),
        notes: reassignNotes,
      });

      setShowReassignForm(false);
      setReassignDeliveryId(null);

      await fetchDeliveries();
    } catch (err) {
      console.error("Delivery reassignment error:", err);
      setReassignError(
        getErrorMessage(err, "Failed to reassign delivery.")
      );
    } finally {
      setReassignLoading(false);
    }
  };

  const stats = {
    total: deliveries.length,
    assigned: deliveries.filter(
      (item) => item.status === "ASSIGNED"
    ).length,
    inProgress: deliveries.filter(
      (item) =>
        item.status === "PICKED_UP" ||
        item.status === "IN_TRANSIT"
    ).length,
    delivered: deliveries.filter(
      (item) => item.status === "DELIVERED"
    ).length,
    failed: deliveries.filter(
      (item) => item.status === "FAILED"
    ).length,
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Delivery Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage assignments, delivery progress and staff.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={openCreateForm}
            disabled={formLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            <Plus size={18} />
            {formLoading ? "Loading..." : "Create Assignment"}
          </button>

          <button
            onClick={fetchDeliveries}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </div>

      {formError && !showCreateForm && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {formError}
        </div>
      )}

      {/* Statistics for current page */}
      <div>
        <p className="mb-3 text-xs text-gray-500">
          Statistics for currently loaded page
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Assignments"
            value={stats.total}
            icon={Package}
            color="bg-green-100 text-green-600"
          />

          <StatCard
            title="Assigned"
            value={stats.assigned}
            icon={Clock}
            color="bg-blue-100 text-blue-600"
          />

          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon={Truck}
            color="bg-purple-100 text-purple-600"
          />

          <StatCard
            title="Delivered"
            value={stats.delivered}
            icon={CheckCircle}
            color="bg-emerald-100 text-emerald-600"
          />
        </div>
      </div>

      {/* Failed Summary */}
      <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
        <AlertCircle className="text-red-600" size={22} />

        <div>
          <p className="font-semibold text-red-800">
            Failed Deliveries
          </p>
          <p className="text-sm text-red-600">
            {stats.failed} failed on this page.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Search size={19} className="text-gray-500" />
          <h2 className="font-semibold text-gray-800">
            Search & Filters
          </h2>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search order number, customer, phone or staff email..."
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-green-500"
            />

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-white hover:bg-green-700"
            >
              <Search size={17} />
              Search
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-green-500"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>

            <select
              value={staffFilter}
              onChange={(e) => {
                setStaffFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-green-500"
            >
              <option value="">All Delivery Staff</option>
              {deliveryStaff.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.email}
                </option>
              ))}
            </select>

            <div>
              <label className="mb-1 block text-xs text-gray-500">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-500">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-green-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <RotateCcw size={15} />
              Reset Filters
            </button>
          </div>
        </form>
      </div>

      {/* Delivery Table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">
              Delivery Assignments
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Total matching assignments: {totalCount}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading delivery assignments...
          </div>
        ) : error ? (
          <div className="p-10 text-center text-red-600">
            {error}
          </div>
        ) : deliveries.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No delivery assignments found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="whitespace-nowrap px-5 py-4">Order</th>
                  <th className="whitespace-nowrap px-5 py-4">Delivery Staff</th>
                  <th className="whitespace-nowrap px-5 py-4">Status</th>
                  <th className="whitespace-nowrap px-5 py-4">Assigned At</th>
                  <th className="whitespace-nowrap px-5 py-4">Notes</th>
                  <th className="whitespace-nowrap px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {deliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-800">
                      {delivery.order_number || `#${delivery.order}`}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-700">
                      {delivery.delivery_staff_email}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          statusStyles[delivery.status] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {formatStatus(delivery.status)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                      {formatDate(delivery.assigned_at)}
                    </td>

                    <td className="max-w-xs truncate px-5 py-4 text-gray-600">
                      {delivery.notes || "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openDetails(delivery.id)}
                          title="View details and history"
                          className="rounded-lg border border-gray-200 p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <Eye size={17} />
                        </button>

                        {delivery.status === "FAILED" && (
                          <button
                            type="button"
                            onClick={() => openReassignForm(delivery)}
                            title="Reassign delivery"
                            className="rounded-lg border border-gray-200 p-2 text-orange-600 hover:bg-orange-50"
                          >
                            <RotateCcw size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Showing {deliveries.length} of {totalCount} assignments
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!previousPage || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={17} />
              Previous
            </button>

            <span className="px-2 text-sm text-gray-600">
              Page {page}
            </span>

            <button
              type="button"
              disabled={!nextPage || loading}
              onClick={() => setPage((current) => current + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Create Assignment Modal */}
      {showCreateForm && (
        <Modal
          title="Create Delivery Assignment"
          subtitle="Assign a shipped order to delivery staff."
          onClose={() => {
            if (!submitting) {
              setShowCreateForm(false);
              setFormError("");
            }
          }}
        >
          <form onSubmit={handleCreateAssignment} className="space-y-4 p-5">
            {formError && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {formError}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Shipped Order
              </label>

              <select
                value={selectedOrder}
                onChange={(e) => setSelectedOrder(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-green-500"
              >
                <option value="">Select an order</option>
                {shippedOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.order_number || `Order #${order.id}`}
                  </option>
                ))}
              </select>

              {shippedOrders.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  No unassigned shipped orders available.
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Delivery Staff
              </label>

              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-green-500"
              >
                <option value="">Select delivery staff</option>
                {deliveryStaff.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.email} — {staff.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Assignment Notes
              </label>
              <textarea
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                rows={3}
                placeholder="Optional delivery instructions..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-green-500"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                disabled={submitting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  submitting ||
                  shippedOrders.length === 0 ||
                  deliveryStaff.length === 0
                }
                className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? "Assigning..." : "Assign Delivery"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delivery Details and History Modal */}
      {(detailsLoading || detailsError || selectedDelivery) && (
        <Modal
          title="Delivery Details"
          subtitle="Order, recipient and assignment history."
          onClose={() => {
            setSelectedDelivery(null);
            setDetailsError("");
          }}
        >
          {detailsLoading ? (
            <div className="p-10 text-center text-gray-500">
              Loading delivery details...
            </div>
          ) : detailsError ? (
            <div className="p-5 text-sm text-red-600">
              {detailsError}
            </div>
          ) : selectedDelivery && (
            <div className="space-y-6 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">Order Number</p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {selectedDelivery.order_number}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Delivery Status</p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      statusStyles[selectedDelivery.status] ||
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {formatStatus(selectedDelivery.status)}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Recipient</p>
                  <p className="mt-1 font-medium text-gray-800">
                    {selectedDelivery.recipient_name || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="mt-1 font-medium text-gray-800">
                    {selectedDelivery.recipient_phone || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Delivery Area</p>
                  <p className="mt-1 text-gray-800">
                    {selectedDelivery.delivery_area_name || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Delivery Staff</p>
                  <p className="mt-1 text-gray-800">
                    {selectedDelivery.delivery_staff_email}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Delivery Address</p>
                <p className="mt-1 text-sm text-gray-800">
                  {selectedDelivery.delivery_address_line || "—"}
                </p>

                {selectedDelivery.delivery_landmark && (
                  <p className="mt-2 text-sm text-gray-600">
                    Landmark: {selectedDelivery.delivery_landmark}
                  </p>
                )}
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-gray-800">
                  Order Items
                </h3>

                {selectedDelivery.items?.length ? (
                  <div className="space-y-2">
                    {selectedDelivery.items.map((item, index) => (
                      <div
                        key={`${item.product_sku}-${index}`}
                        className="flex justify-between gap-3 rounded-lg border border-gray-100 p-3 text-sm"
                      >
                        <div>
                          <p className="font-medium text-gray-800">
                            {item.product_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            SKU: {item.product_sku}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-700">
                          Qty: {item.quantity}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No order items found.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">Assigned At</p>
                  <p className="mt-1 text-sm text-gray-800">
                    {formatDate(selectedDelivery.assigned_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Picked Up At</p>
                  <p className="mt-1 text-sm text-gray-800">
                    {formatDate(selectedDelivery.picked_up_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Delivered At</p>
                  <p className="mt-1 text-sm text-gray-800">
                    {formatDate(selectedDelivery.delivered_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Assigned By</p>
                  <p className="mt-1 text-sm text-gray-800">
                    {selectedDelivery.assigned_by_email || "—"}
                  </p>
                </div>
              </div>

              {selectedDelivery.failed_reason && (
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="text-xs font-semibold text-red-700">
                    Failed Reason
                  </p>
                  <p className="mt-1 text-sm text-red-700">
                    {selectedDelivery.failed_reason}
                  </p>
                </div>
              )}

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <History size={18} className="text-gray-500" />
                  <h3 className="font-semibold text-gray-800">
                    Assignment History
                  </h3>
                </div>

                {history.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No assignment history found.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-gray-200 p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-800">
                            {item.delivery_staff_email}
                          </p>

                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {item.outcome}
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-gray-500">
                          Assigned: {formatDate(item.assigned_at)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Ended: {formatDate(item.ended_at)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Assigned by: {item.assigned_by_email}
                        </p>

                        {item.failed_reason && (
                          <p className="mt-2 text-sm text-red-600">
                            Reason: {item.failed_reason}
                          </p>
                        )}

                        {item.notes && (
                          <p className="mt-2 text-sm text-gray-600">
                            Notes: {item.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Reassign Modal */}
      {showReassignForm && (
        <Modal
          title="Reassign Failed Delivery"
          subtitle="Choose another active delivery staff member."
          onClose={() => {
            if (!reassignLoading) {
              setShowReassignForm(false);
              setReassignError("");
            }
          }}
        >
          <form onSubmit={handleReassign} className="space-y-4 p-5">
            {reassignError && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {reassignError}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                New Delivery Staff
              </label>

              <select
                value={reassignStaff}
                onChange={(e) => setReassignStaff(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-green-500"
              >
                <option value="">Select delivery staff</option>
                {deliveryStaff.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.email} — {staff.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Reassignment Notes
              </label>
              <textarea
                value={reassignNotes}
                onChange={(e) => setReassignNotes(e.target.value)}
                rows={3}
                placeholder="Optional reason or instructions..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-green-500"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setShowReassignForm(false)}
                disabled={reassignLoading}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={reassignLoading || deliveryStaff.length === 0}
                className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {reassignLoading ? "Reassigning..." : "Confirm Reassignment"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default AdminDeliveryPage;
