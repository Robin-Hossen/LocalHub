
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  PackageX,
  Search,
  RefreshCw,
  Package,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { getInventoryReport } from "../../services/reportService";

function AdminInventoryAlertsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [vendorFilter, setVendorFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const pageSize = 10;

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getInventoryReport();
      setProducts(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error("Inventory alerts error:", err);
      setError("Unable to load inventory alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const lowStockProducts = products.filter(
    (product) => product.is_low_stock && !product.is_out_of_stock
  );

  const outOfStockProducts = products.filter(
    (product) => product.is_out_of_stock
  );

  const vendors = useMemo(
    () => [...new Set(products.map((p) => p.vendor_name).filter(Boolean))].sort(),
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        `${product.product_name} ${product.product_sku} ${product.vendor_name}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        filter === "ALL" ||
        (filter === "LOW" && product.is_low_stock && !product.is_out_of_stock) ||
        (filter === "OUT" && product.is_out_of_stock);

      const matchesVendor =
        vendorFilter === "ALL" || product.vendor_name === vendorFilter;

      return matchesSearch && matchesStatus && matchesVendor &&
        (product.is_low_stock || product.is_out_of_stock);
    });
  }, [products, search, filter, vendorFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));

  const paginatedProducts = filteredProducts.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [search, filter, vendorFilter]);

  const formatDate = () =>
    new Date().toLocaleDateString("en-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-gray-500">
        <RefreshCw className="animate-spin" size={20} />
        Loading inventory alerts...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-medium text-red-600">{error}</p>
        <button
          onClick={fetchInventory}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Inventory Alerts
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Monitor low stock and out of stock products.
          </p>
        </div>

        <button
          onClick={fetchInventory}
          className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Stock Alerts</p>
              <h3 className="mt-2 text-3xl font-bold text-gray-900">
                {lowStockProducts.length + outOfStockProducts.length}
              </h3>
            </div>
            <div className="rounded-xl bg-orange-100 p-3 text-orange-600">
              <AlertTriangle size={25} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Low Stock Products</p>
              <h3 className="mt-2 text-3xl font-bold text-orange-600">
                {lowStockProducts.length}
              </h3>
            </div>
            <div className="rounded-xl bg-orange-100 p-3 text-orange-600">
              <Package size={25} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Out of Stock Products</p>
              <h3 className="mt-2 text-3xl font-bold text-red-600">
                {outOfStockProducts.length}
              </h3>
            </div>
            <div className="rounded-xl bg-red-100 p-3 text-red-600">
              <PackageX size={25} />
            </div>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Products Requiring Attention
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {filteredProducts.length} products found · Updated {formatDate()}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search product, SKU, vendor..."
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-green-500 sm:w-64"
                />
              </div>

              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-500"
              >
                <option value="ALL">All Vendors</option>
                {vendors.map((vendor) => (
                  <option key={vendor} value={vendor}>
                    {vendor}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { value: "ALL", label: "All Alerts" },
              { value: "LOW", label: "Low Stock" },
              { value: "OUT", label: "Out of Stock" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  filter === item.value
                    ? "bg-green-700 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {paginatedProducts.length > 0 ? (
          <>
            <div className="divide-y divide-gray-100">
              {paginatedProducts.map((product) => {
                const isOut = product.is_out_of_stock;

                return (
                  <div
                    key={product.product_id}
                    className="p-5 transition hover:bg-gray-50"
                  >
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-gray-900">
                            {product.product_name}
                          </h4>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              isOut
                                ? "bg-red-100 text-red-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {isOut ? "Out of Stock" : "Low Stock"}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                          SKU: {product.product_sku}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Vendor: {product.vendor_name}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[480px]">
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">Sellable</p>
                          <p className={`mt-1 text-xl font-bold ${
                            isOut ? "text-red-600" : "text-orange-600"
                          }`}>
                            {product.sellable_quantity}
                          </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">Available</p>
                          <p className="mt-1 text-xl font-bold text-gray-800">
                            {product.available_quantity}
                          </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">Reserved</p>
                          <p className="mt-1 text-xl font-bold text-gray-800">
                            {product.reserved_quantity}
                          </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">Reorder Level</p>
                          <p className="mt-1 text-xl font-bold text-gray-800">
                            {product.reorder_level}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-gray-500">
                        {isOut
                          ? "This product has no sellable stock."
                          : `${product.reorder_level - product.sellable_quantity} more units needed to reach the reorder level.`}
                      </p>

                      <a
                        href="/admin/procurement"
                        className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800"
                      >
                        <ClipboardList size={16} />
                        Procurement
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, filteredProducts.length)} of{" "}
                {filteredProducts.length}
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-lg border p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>

                <span className="text-sm font-medium text-gray-700">
                  Page {page} of {totalPages}
                </span>

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="px-5 py-16 text-center">
            <Package size={40} className="mx-auto text-gray-300" />
            <h4 className="mt-4 font-semibold text-gray-800">
              No stock alerts found
            </h4>
            <p className="mt-1 text-sm text-gray-500">
              No products match your current search or filters.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminInventoryAlertsPage;
