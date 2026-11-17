
import { MapPin, ShoppingBag, ArrowRight, Heart } from "lucide-react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="mt-20 bg-gray-950 text-gray-300">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">

        {/* Brand */}
        <div>
          <Link to="/" className="text-2xl font-extrabold tracking-tight text-white">
            Local<span className="text-green-500">Hub</span>.
          </Link>

          <p className="mt-5 max-w-xs text-sm leading-7 text-gray-400">
            Your trusted local shopping platform. Discover fresh products
            and everyday essentials from local suppliers, delivered to your
            doorstep.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm text-gray-300">
            <MapPin size={17} className="text-green-500" />
            Dhaka, Bangladesh
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="mb-5 font-bold text-white">Explore LocalHub</h3>

          <ul className="space-y-4 text-sm">
            <li>
              <Link to="/" className="transition hover:text-green-400">
                Home
              </Link>
            </li>
            <li>
              <Link to="/#categories" className="transition hover:text-green-400">
                Categories
              </Link>
            </li>
            <li>
              <Link to="/#products" className="transition hover:text-green-400">
                Shop Products
              </Link>
            </li>
            <li>
              <Link to="/cart" className="transition hover:text-green-400">
                Shopping Cart
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Account */}
        <div>
          <h3 className="mb-5 font-bold text-white">Your Account</h3>

          <ul className="space-y-4 text-sm">
            <li>
              <Link to="/login" className="transition hover:text-green-400">
                Login
              </Link>
            </li>
            <li>
              <Link to="/register" className="transition hover:text-green-400">
                Create Account
              </Link>
            </li>
            <li>
              <Link to="/my-orders" className="transition hover:text-green-400">
                My Orders
              </Link>
            </li>
            <li>
              <Link to="/addresses" className="transition hover:text-green-400">
                My Addresses
              </Link>
            </li>
          </ul>
        </div>

        {/* About */}
        <div>
          <h3 className="mb-5 font-bold text-white">Why LocalHub?</h3>

          <p className="text-sm leading-7 text-gray-400">
            We make local shopping simple and convenient. Browse products,
            place orders, and enjoy a smooth shopping experience.
          </p>

          <Link
            to="/#products"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-green-400 transition hover:text-green-300"
          >
            Start Shopping <ArrowRight size={17} />
          </Link>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-center text-xs text-gray-500 sm:flex-row sm:text-left">
          <p>© {new Date().getFullYear()} LocalHub. All rights reserved.</p>

          <p className="flex items-center gap-1.5">
            Made with <Heart size={13} className="fill-green-500 text-green-500" /> for local shopping
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
