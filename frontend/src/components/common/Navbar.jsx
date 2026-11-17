import { useEffect, useState } from "react";
import {
  ShoppingCart,
  Search,
  MapPin,
  LogOut,
  Package,
  Menu,
  X,
  UserRound,
  ChevronDown,
  Leaf,
  House,
  MapPinned,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { getAddresses } from "../../services/addressService";

function Navbar() {
  const { cartCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState(null);

  // Keep Navbar search synchronized with the URL.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearch(params.get("search") || "");
  }, [location.search]);

  // Load the customer's saved delivery address.
  useEffect(() => {
    let cancelled = false;

    const loadAddress = async () => {
      if (!isAuthenticated) {
        setDeliveryAddress(null);
        return;
      }

      try {
        const data = await getAddresses();
        const addresses = data.results ?? data;
        const selectedAddress =
          addresses.find((item) => item.is_default) || addresses[0] || null;

        if (!cancelled) {
          setDeliveryAddress(selectedAddress);
        }
      } catch (error) {
        console.error("Failed to load delivery address:", error);
        if (!cancelled) setDeliveryAddress(null);
      }
    };

    loadAddress();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated,location.pathname]);

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const params = new URLSearchParams(location.search);
    const query = search.trim();

    if (query) {
      params.set("search", query);
    } else {
      params.delete("search");
    }

    const queryString = params.toString();

    closeMenus();

    navigate({
      pathname: "/",
      search: queryString ? `?${queryString}` : "",
      hash: "products",
    });
  };

  const handleLogout = () => {
    logout();
    closeMenus();
    navigate("/login");
  };

  const addressLabel = deliveryAddress
    ? deliveryAddress.area_name || deliveryAddress.address_line
    : isAuthenticated
      ? "Add delivery address"
      : "Set delivery address";

  const navLinkClass = ({ isActive }) =>
    `transition hover:text-green-700 ${
      isActive ? "text-green-700" : "text-gray-600"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Announcement Bar */}
      <div className="bg-[#174D35] px-4 py-2 text-center text-xs font-medium text-white sm:text-sm">
        <span className="inline-flex items-center justify-center gap-2">
          <Leaf size={14} className="text-green-300" />
          Fresh groceries and daily essentials, delivered to your doorstep.
        </span>
      </div>

      {/* Main Navbar */}
      <div className="border-b border-gray-100">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:gap-5 lg:px-8">
          {/* Logo */}
          <Link
            to="/"
            onClick={closeMenus}
            className="shrink-0 text-2xl font-extrabold tracking-tight text-green-700 sm:text-3xl"
            aria-label="LocalHub Home"
          >
            Local<span className="text-gray-900">Hub</span>
            <span className="text-green-500">.</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 text-sm font-semibold lg:flex">
            <Link to="/" className={navLinkClass}>
              Home
            </Link>
            <Link
              to="/#categories"
              className="text-gray-600 transition hover:text-green-700"
            >
              Categories
            </Link>
            <Link
              to="/#products"
              className="text-gray-600 transition hover:text-green-700"
            >
              Shop
            </Link>
          </nav>

          {/* Desktop Search */}
          <form
            onSubmit={handleSearchSubmit}
            role="search"
            className="hidden min-w-40 max-w-sm flex-1 items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 transition focus-within:border-green-500 focus-within:bg-white lg:flex"
          >
            <Search size={18} className="shrink-0 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="text-gray-400 transition hover:text-gray-700"
              >
                <X size={16} />
              </button>
            )}
            <button
              type="submit"
              aria-label="Submit search"
              className="rounded-full bg-green-700 p-2 text-white transition hover:bg-green-800"
            >
              <Search size={15} />
            </button>
          </form>

          {/* Delivery Address */}
          <Link
            to={isAuthenticated ? "/addresses" : "/login"}
            className="hidden max-w-44 items-center gap-2 xl:flex"
            title={deliveryAddress?.address_line || addressLabel}
          >
            <MapPin size={20} className="shrink-0 text-green-700" />
            <span className="min-w-0">
              <span className="block text-[10px] text-gray-400">
                Deliver to
              </span>
              <span className="block truncate text-xs font-bold text-gray-800">
                {addressLabel}
              </span>
            </span>
            <ChevronDown size={14} className="shrink-0 text-gray-400" />
          </Link>

          {/* User Actions */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Desktop Account */}
            {isAuthenticated ? (
              <div className="relative hidden lg:block">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((open) => !open)}
                  aria-expanded={accountMenuOpen}
                  aria-label="Account menu"
                  className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-green-300 hover:bg-green-50"
                >
                  <UserRound size={17} className="text-green-700" />
                  <span className="max-w-28 truncate">
                    {user?.first_name || user?.email || "My Account"}
                  </span>
                  <ChevronDown size={15} />
                </button>

                {accountMenuOpen && (
                  <div className="absolute right-0 top-full mt-3 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
                    <div className="border-b border-gray-100 px-4 py-3">
                      <p className="truncate text-sm font-bold text-gray-800">
                        {user?.first_name || "My Account"}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {user?.email}
                      </p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={closeMenus}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700"
                    >
                      <UserRound size={17} />
                      My Profile
                    </Link>
                    <Link
                      to="/my-orders"
                      onClick={closeMenus}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700"
                    >
                      <Package size={17} />
                      My Orders
                    </Link>
                    <Link
                      to="/addresses"
                      onClick={closeMenus}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700"
                    >
                      <MapPinned size={17} />
                      My Addresses
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={17} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-4 lg:flex">
                <Link
                  to="/login"
                  className="text-sm font-bold text-gray-700 transition hover:text-green-700"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-green-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-800"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Cart */}
            <Link
              to="/cart"
              aria-label={`Shopping cart, ${cartCount} items`}
              className="relative rounded-full border border-gray-100 p-2.5 text-green-800 transition hover:bg-green-50"
            >
              <ShoppingCart size={21} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-green-600 px-1 text-[10px] font-bold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="rounded-full border border-gray-100 p-2.5 text-gray-700 transition hover:bg-gray-50 lg:hidden"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-gray-100 bg-white px-4 py-5 shadow-lg lg:hidden sm:px-6">
          {/* Mobile Search */}
          <form
            onSubmit={handleSearchSubmit}
            role="search"
            className="mb-5 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 focus-within:border-green-500"
          >
            <Search size={18} className="shrink-0 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-green-700 px-4 py-2 text-xs font-bold text-white hover:bg-green-800"
            >
              Search
            </button>
          </form>

          {/* Mobile Delivery Address */}
          <Link
            to={isAuthenticated ? "/addresses" : "/login"}
            onClick={closeMenus}
            className="mb-5 flex items-center gap-3 rounded-xl bg-green-50 p-3"
          >
            <MapPin size={20} className="shrink-0 text-green-700" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-gray-500">Deliver to</span>
              <span className="block truncate text-sm font-bold text-gray-800">
                {addressLabel}
              </span>
            </span>
            <ChevronDown size={16} className="text-gray-500" />
          </Link>

          <nav className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            <Link
              to="/"
              onClick={closeMenus}
              className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-green-50 hover:text-green-700"
            >
              <House size={18} />
              Home
            </Link>
            <Link
              to="/#categories"
              onClick={closeMenus}
              className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-green-50 hover:text-green-700"
            >
              <Package size={18} />
              Categories
            </Link>
            <Link
              to="/#products"
              onClick={closeMenus}
              className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-green-50 hover:text-green-700"
            >
              <ShoppingCart size={18} />
              Shop Products
            </Link>

            {isAuthenticated ? (
              <>
                <div className="my-2 border-t border-gray-100" />
                <Link
                  to="/my-orders"
                  onClick={closeMenus}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-green-50 hover:text-green-700"
                >
                  <Package size={18} />
                  My Orders
                </Link>
                <Link
                  to="/profile"
                  onClick={closeMenus}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-green-50 hover:text-green-700"
                >
                  <UserRound size={18} />
                  My Profile
                </Link>
                <Link
                  to="/addresses"
                  onClick={closeMenus}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-green-50 hover:text-green-700"
                >
                  <MapPinned size={18} />
                  My Addresses
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 flex items-center gap-3 rounded-lg border-t border-gray-100 px-3 py-3 text-left font-bold text-red-600 hover:bg-red-50"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className="my-2 border-t border-gray-100" />
                <Link
                  to="/login"
                  onClick={closeMenus}
                  className="rounded-lg px-3 py-3 hover:bg-green-50 hover:text-green-700"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenus}
                  className="rounded-lg bg-green-700 px-3 py-3 text-center font-bold text-white hover:bg-green-800"
                >
                  Create Account
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
