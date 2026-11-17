
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ShoppingCart,
  TrendingUp,
  Package,
  Truck,
  Users,
  Download,
  RefreshCw,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
} from "lucide-react";

import {
  getSalesSummary,
  getDailySalesReport,
  getMonthlySalesReport,
  getProductSalesReport,
  getVendorPurchaseReport,
  getInventoryReport,
  getDeliveryPerformanceReport,
} from "../../services/reportService";

const tabs = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "sales", label: "Sales", icon: TrendingUp },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "products", label: "Products", icon: Package },
  { id: "inventory", label: "Inventory", icon: AlertTriangle },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "vendors", label: "Vendor Purchases", icon: Users },
];

const getLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDateRange = (range) => {
  const today = new Date();
  const end = getLocalDate(today);
  const startDate = new Date(today);

  if (range === "today") {
    return { start_date: end, end_date: end };
  }

  if (range === "7days") {
    startDate.setDate(today.getDate() - 6);
  } else if (range === "30days") {
    startDate.setDate(today.getDate() - 29);
  } else if (range === "month") {
    startDate.setDate(1);
  }

  return {
    start_date: getLocalDate(startDate),
    end_date: end,
  };
};

const formatMoney = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-BD");

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getArray = (data) => (Array.isArray(data) ? data : []);

const exportCSV = (rows, columns, filename) => {
  if (!rows.length) {
    alert("No data available to export.");
    return;
  }

  const escapeCSV = (value) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };

  const headers = columns.map((column) => column.label);

  const csvRows = rows.map((row) =>
    columns.map((column) => escapeCSV(column.value(row)))
  );

  const csv = [headers, ...csvRows]
    .map((row) => row.join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${filename}.csv`;
  link.click();

  URL.revokeObjectURL(url);
};

const StatusBadge = ({ children, type = "default" }) => {
  const styles = {
    success: "bg-green-100 text-green-700",
    danger: "bg-red-100 text-red-700",
    warning: "bg-amber-100 text-amber-700",
    info: "bg-blue-100 text-blue-700",
    default: "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[type]}`}
    >
      {children}
    </span>
  );
};

const ReportTable = ({ columns, rows, emptyMessage = "No report data found." }) => {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
        <Package className="mx-auto mb-3 text-gray-300" size={36} />
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            {columns.map((column) => (
              <th key={column.label} className="px-5 py-4 font-semibold">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((row, index) => (
            <tr key={row.id ?? row.product_id ?? row.vendor_id ?? index}
              className="hover:bg-gray-50">
              {columns.map((column) => (
                <td key={column.label} className="px-5 py-4 text-gray-700">
                  {column.render
                    ? column.render(row)
                    : column.value(row) ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AdminReportsPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("30days");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [summary, setSummary] = useState({});
  const [dailySales, setDailySales] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [productSales, setProductSales] = useState([]);
  const [vendorPurchases, setVendorPurchases] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [delivery, setDelivery] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const dateParams = useMemo(() => {
    if (dateRange === "custom") {
      return {
        start_date: customStart,
        end_date: customEnd,
      };
    }

    return getDateRange(dateRange);
  }, [dateRange, customStart, customEnd]);

  const loadReports = async () => {
    if (
      dateRange === "custom" &&
      (!customStart || !customEnd)
    ) {
      return;
    }

    if (
      dateRange === "custom" &&
      customStart > customEnd
    ) {
      setError("Start date cannot be after end date.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [
        summaryData,
        dailyData,
        monthlyData,
        productData,
        vendorData,
        inventoryData,
        deliveryData,
      ] = await Promise.all([
        getSalesSummary(dateParams),
        getDailySalesReport(dateParams),
        getMonthlySalesReport(dateParams),
        getProductSalesReport(dateParams),
        getVendorPurchaseReport(dateParams),
        getInventoryReport(),
        getDeliveryPerformanceReport(dateParams),
      ]);

      setSummary(summaryData || {});
      setDailySales(getArray(dailyData));
      setMonthlySales(getArray(monthlyData));
      setProductSales(getArray(productData));
      setVendorPurchases(getArray(vendorData));
      setInventory(getArray(inventoryData));
      setDelivery(deliveryData || {});
    } catch (err) {
      console.error("Reports loading error:", err);
      setError(
        err.response?.data?.detail ||
        "Unable to load reports. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [dateParams.start_date, dateParams.end_date]);

  const productsSold = productSales.reduce(
    (total, item) => total + Number(item.total_quantity || 0),
    0
  );

  const lowStockCount = inventory.filter(
    (item) => item.is_low_stock
  ).length;

  const stats = [
    {
      title: "Net Revenue",
      value: formatMoney(summary.net_sales),
      icon: DollarSign,
      color: "bg-green-100 text-green-700",
    },
    {
      title: "Total Orders",
      value: formatNumber(summary.total_orders),
      icon: ShoppingCart,
      color: "bg-blue-100 text-blue-700",
    },
    {
      title: "Products Sold",
      value: formatNumber(productsSold),
      icon: Package,
      color: "bg-purple-100 text-purple-700",
    },
    {
      title: "Delivered Orders",
      value: formatNumber(summary.delivered_orders),
      icon: CheckCircle2,
      color: "bg-amber-100 text-amber-700",
    },
  ];

  const salesColumns = [
    {
      label: "Date",
      value: (row) => formatDate(row.report_date),
    },
    {
      label: "Orders",
      value: (row) => formatNumber(row.total_orders),
    },
    {
      label: "Delivered",
      value: (row) => formatNumber(row.delivered_orders),
    },
    {
      label: "Cancelled",
      value: (row) => formatNumber(row.cancelled_orders),
    },
    {
      label: "Gross Sales",
      value: (row) => formatMoney(row.gross_sales),
    },
    {
      label: "Net Sales",
      value: (row) => formatMoney(row.net_sales),
    },
  ];

  const orderColumns = [
    {
      label: "Date",
      value: (row) => formatDate(row.report_date),
    },
    {
      label: "Total Orders",
      value: (row) => formatNumber(row.total_orders),
    },
    {
      label: "Delivered",
      render: (row) => (
        <StatusBadge type="success">
          {formatNumber(row.delivered_orders)}
        </StatusBadge>
      ),
    },
    {
      label: "Cancelled",
      render: (row) => (
        <StatusBadge type="danger">
          {formatNumber(row.cancelled_orders)}
        </StatusBadge>
      ),
    },
    {
      label: "Net Sales",
      value: (row) => formatMoney(row.net_sales),
    },
  ];

  const productColumns = [
    {
      label: "Product",
      value: (row) => row.product_name,
    },
    {
      label: "SKU",
      value: (row) => row.product_sku,
    },
    {
      label: "Quantity Sold",
      value: (row) => formatNumber(row.total_quantity),
    },
    {
      label: "Orders",
      value: (row) => formatNumber(row.total_orders),
    },
    {
      label: "Gross Sales",
      value: (row) => formatMoney(row.gross_sales),
    },
    {
      label: "Estimated Profit",
      value: (row) => formatMoney(row.estimated_gross_profit),
    },
  ];

  const inventoryColumns = [
    {
      label: "Product",
      value: (row) => row.product_name,
    },
    {
      label: "SKU",
      value: (row) => row.product_sku,
    },
    {
      label: "Available",
      value: (row) => formatNumber(row.available_quantity),
    },
    {
      label: "Reserved",
      value: (row) => formatNumber(row.reserved_quantity),
    },
    {
      label: "Reorder Level",
      value: (row) => formatNumber(row.reorder_level),
    },
    {
      label: "Stock Status",
      render: (row) =>
        row.is_low_stock ? (
          <StatusBadge type="danger">Low Stock</StatusBadge>
        ) : (
          <StatusBadge type="success">Healthy</StatusBadge>
        ),
    },
  ];

  const vendorColumns = [
    {
      label: "Vendor",
      value: (row) => row["vendor__name"],
    },
    {
      label: "Purchase Orders",
      value: (row) => formatNumber(row.total_purchase_orders),
    },
    {
      label: "Received",
      value: (row) => formatNumber(row.received_purchase_orders),
    },
    {
      label: "Pending",
      value: (row) => formatNumber(row.pending_purchase_orders),
    },
    {
      label: "Purchased Qty",
      value: (row) => formatNumber(row.total_purchase_quantity),
    },
    {
      label: "Purchase Value",
      value: (row) => formatMoney(row.total_purchase_value),
    },
  ];

  const maxRevenue = Math.max(
    ...dailySales.map((item) => Number(item.net_sales || 0)),
    1
  );

  const currentRows = {
    sales: dailySales,
    orders: dailySales,
    products: productSales,
    inventory,
    vendors: vendorPurchases,
  };

  const currentColumns = {
    sales: salesColumns,
    orders: orderColumns,
    products: productColumns,
    inventory: inventoryColumns,
    vendors: vendorColumns,
  };

  const exportCurrentReport = () => {
    const rows = currentRows[activeTab] || [];
    const columns = currentColumns[activeTab] || [];

    exportCSV(
      rows,
      columns.map((column) => ({
        label: column.label,
        value: column.value || ((row) => {
          const rendered = column.render?.(row);
          return typeof rendered === "string" ? rendered : "";
        }),
      })),
      `localhub-${activeTab}-report`
    );
  };

  const renderSalesChart = () => {
    if (!dailySales.length) {
      return (
        <div className="py-12 text-center text-sm text-gray-500">
          No sales data available for this period.
        </div>
      );
    }

    return (
      <div className="flex h-64 items-end gap-3 overflow-x-auto px-2 pb-2">
        {dailySales.map((item, index) => {
          const revenue = Number(item.net_sales || 0);
          const height = Math.max((revenue / maxRevenue) * 100, 3);

          return (
            <div
              key={item.report_date || index}
              className="group flex min-w-10 flex-1 flex-col items-center justify-end gap-2"
            >
              <div className="relative w-full">
                <div className="pointer-events-none absolute -top-10 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                  {formatMoney(revenue)}
                </div>

                <div
                  className="w-full rounded-t-md bg-green-600 transition-all duration-300 group-hover:bg-green-700"
                  style={{ height: `${height * 2}px` }}
                />
              </div>

              <span className="text-[10px] text-gray-500">
                {new Date(`${item.report_date}T00:00:00`).toLocaleDateString(
                  "en-GB",
                  { day: "2-digit", month: "short" }
                )}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor sales, orders, inventory and business performance.
          </p>
        </div>

        <button
          onClick={loadReports}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh Reports
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <CalendarDays size={16} />
              Date Range
            </label>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 sm:w-56"
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Date</option>
            </select>
          </div>

          {dateRange === "custom" && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart || undefined}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500">
            {dateParams.start_date && dateParams.end_date
              ? `${formatDate(dateParams.start_date)} – ${formatDate(dateParams.end_date)}`
              : "Select a date range"}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto border-b border-gray-200">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "border-green-600 text-green-700"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Report loading failed</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white py-20 text-center">
          <RefreshCw className="mx-auto animate-spin text-green-600" size={30} />
          <p className="mt-3 text-sm text-gray-500">
            Loading report data...
          </p>
        </div>
      ) : (
        <>
          {/* Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div
                      key={stat.title}
                      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">
                            {stat.title}
                          </p>
                          <h2 className="mt-2 text-2xl font-bold text-gray-900">
                            {stat.value}
                          </h2>
                        </div>

                        <div className={`rounded-xl p-3 ${stat.color}`}>
                          <Icon size={22} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
                  <div className="mb-5">
                    <h3 className="font-bold text-gray-900">
                      Revenue Overview
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Daily net sales for the selected period
                    </p>
                  </div>

                  {renderSalesChart()}
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900">
                    Sales Summary
                  </h3>

                  <div className="mt-5 space-y-5">
                    {[
                      ["Gross Sales", summary.gross_sales],
                      ["Delivery Revenue", summary.delivery_revenue],
                      ["Discounts", summary.total_discounts],
                      ["Net Sales", summary.net_sales],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="text-sm text-gray-500">{label}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatMoney(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <p className="text-sm text-gray-500">Delivery Success Rate</p>
                  <p className="mt-2 text-2xl font-bold text-green-700">
                    {Number(delivery.delivery_success_rate || 0).toFixed(2)}%
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <p className="text-sm text-gray-500">Total Deliveries</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {formatNumber(delivery.total_deliveries)}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <p className="text-sm text-gray-500">Low Stock Products</p>
                  <p className="mt-2 text-2xl font-bold text-red-600">
                    {formatNumber(lowStockCount)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-4 font-bold text-gray-900">
                  Recent Daily Sales
                </h3>
                <ReportTable columns={salesColumns} rows={dailySales.slice(-5).reverse()} />
              </div>
            </div>
          )}

          {/* Sales */}
          {activeTab === "sales" && (
            <div className="space-y-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Sales Report
                  </h2>
                  <p className="text-sm text-gray-500">
                    Daily and monthly sales performance
                  </p>
                </div>

                <button
                  onClick={() =>
                    exportCSV(
                      dailySales,
                      [
                        { label: "Date", value: (r) => r.report_date },
                        { label: "Orders", value: (r) => r.total_orders },
                        { label: "Gross Sales", value: (r) => r.gross_sales },
                        { label: "Net Sales", value: (r) => r.net_sales },
                      ],
                      "localhub-sales-report"
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
                >
                  <Download size={16} /> Export CSV
                </button>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-4 font-semibold text-gray-800">
                  Daily Sales
                </h3>
                <ReportTable columns={salesColumns} rows={dailySales} />
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-4 font-semibold text-gray-800">
                  Monthly Sales
                </h3>
                <ReportTable
                  columns={[
                    { label: "Month", value: (r) => r.report_month },
                    { label: "Orders", value: (r) => formatNumber(r.total_orders) },
                    { label: "Delivered", value: (r) => formatNumber(r.delivered_orders) },
                    { label: "Cancelled", value: (r) => formatNumber(r.cancelled_orders) },
                    { label: "Gross Sales", value: (r) => formatMoney(r.gross_sales) },
                    { label: "Net Sales", value: (r) => formatMoney(r.net_sales) },
                  ]}
                  rows={monthlySales}
                />
              </div>
            </div>
          )}

          {/* Orders */}
          {activeTab === "orders" && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-900">
                  Orders Report
                </h2>
                <p className="text-sm text-gray-500">
                  Daily order volume and delivery status
                </p>
              </div>

              <ReportTable columns={orderColumns} rows={dailySales} />
            </div>
          )}

          {/* Products */}
          {activeTab === "products" && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-900">
                  Product Performance
                </h2>
                <p className="text-sm text-gray-500">
                  Quantity sold, sales value and estimated profit
                </p>
              </div>

              <ReportTable columns={productColumns} rows={productSales} />
            </div>
          )}

          {/* Inventory */}
          {activeTab === "inventory" && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <p className="text-sm text-gray-500">Total Products in Stock</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {formatNumber(inventory.length)}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <p className="text-sm text-gray-500">Low Stock Products</p>
                  <p className="mt-2 text-2xl font-bold text-red-600">
                    {formatNumber(lowStockCount)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="mb-5 text-lg font-bold text-gray-900">
                  Inventory Report
                </h2>
                <ReportTable columns={inventoryColumns} rows={inventory} />
              </div>
            </div>
          )}

          {/* Delivery */}
          {activeTab === "delivery" && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  ["Total Deliveries", delivery.total_deliveries],
                  ["Delivered", delivery.delivered_deliveries],
                  ["Failed", delivery.failed_deliveries],
                  ["Assigned", delivery.assigned_deliveries],
                  ["Picked Up", delivery.picked_up_deliveries],
                  ["In Transit", delivery.in_transit_deliveries],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-gray-200 bg-white p-5"
                  >
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">
                      {formatNumber(value)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="font-bold text-gray-900">
                  Delivery Success Rate
                </h2>
                <p className="mt-2 text-3xl font-bold text-green-700">
                  {Number(delivery.delivery_success_rate || 0).toFixed(2)}%
                </p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-green-600"
                    style={{
                      width: `${Math.min(
                        Number(delivery.delivery_success_rate || 0),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Vendors */}
          {activeTab === "vendors" && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-900">
                  Vendor Purchase Report
                </h2>
                <p className="text-sm text-gray-500">
                  Purchase orders, received quantities and purchase value
                </p>
              </div>

              <ReportTable columns={vendorColumns} rows={vendorPurchases} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminReportsPage;
