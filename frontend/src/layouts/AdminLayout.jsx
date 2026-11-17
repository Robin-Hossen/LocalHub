import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingBag,
  Store,
  Warehouse,
  Truck,
  BarChart3,
  Users,
  Menu,
  X,
  LogOut,
  UserRound,
  ClipboardList,
  AlertTriangle,
  Images,
  Activity,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const navigation = [
  {
    name: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Products",
    path: "/admin/products",
    icon: Package,
  },
  {
    name: "Categories",
    path: "/admin/categories",
    icon: Tags,
  },
  {
    name: "Orders",
    path: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    name: "Vendors",
    path: "/admin/vendors",
    icon: Store,
  },
  {
    name: "Inventory",
    path: "/admin/inventory",
    icon: Warehouse,
  },
  {
    name: "Procurement",
    path: "/admin/procurement",
    icon: ClipboardList,
  },
  {
    name: "Delivery",
    path: "/admin/delivery",
    icon: Truck,
  },
  {
    name: "Delivery Staff",
    path: "/admin/delivery-staff",
    icon: Users,
  },
  {
    name: "Customers",
    path: "/admin/customers",
    icon: Users,
  },
  {
    name: "Banner Management",
    path: "/admin/banners",
    icon: Images,
  },
  {
    name: "Reports",
    path: "/admin/reports",
    icon: BarChart3,
  },
  {
    name: "Inventory Alerts",
    path: "/admin/inventory-alerts",
    icon: AlertTriangle,
  },
  {
    name: "Bulk Image Upload",
    path: "/admin/bulk-image-upload",
    icon: Images,
  },
  {
    name: "Duty Monitoring",
    path: "/admin/duty-monitoring",
    icon: Activity,
  },
];

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-green-950 text-white flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-green-800">
          <Link to="/admin" className="text-2xl font-bold tracking-wide">
            Local<span className="text-green-400">Hub</span>
            <span className="block text-xs font-normal text-green-300">
              Admin Panel
            </span>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-green-200"
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <p className="text-xs uppercase tracking-wider text-green-400 px-3 mb-3">
            Main Menu
          </p>

          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin"}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-green-600 text-white"
                      : "text-green-100 hover:bg-green-900"
                  }`
                }
              >
                <Icon size={19} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-green-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm text-green-100 hover:bg-red-600 transition"
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-green-700"
            >
              <Menu size={25} />
            </button>

            <div>
              <h1 className="text-lg font-bold text-gray-800">
                Admin Dashboard
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                Manage your LocalHub business
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-gray-800">
                {user?.email || "Administrator"}
              </p>
              <p className="text-xs text-green-600">Admin</p>
            </div>

            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700">
              <UserRound size={21} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-gray-200 bg-white text-center text-sm text-gray-500">
          © {new Date().getFullYear()} LocalHub. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

export default AdminLayout;
