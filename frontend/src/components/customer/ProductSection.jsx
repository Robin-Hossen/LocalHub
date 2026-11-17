import { useEffect, useState,useRef} from "react";
import {
  ShoppingCart,
  Search,
  SlidersHorizontal,
  Package,
  ArrowRight,
  Leaf,
} from "lucide-react";

import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { getProducts, getCategories } from "../../services/productService";

function ProductSection() {
  const { addToCart } = useCart();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const requestKeyRef = useRef(0);
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  useEffect(() => {
    setCategory(searchParams.get("category") || "");
  }, [searchParams]);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data.results ?? data);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    const requestKey = ++requestKeyRef.current;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");
        setPage(1);

        const params = {
          page: 1,
          page_size: 12,
        };

        if (search.trim()) params.search = search.trim();
        if (category) params.category = category;

        const data = await getProducts(params);

        if (!cancelled && requestKey === requestKeyRef.current) {
          setProducts(data.results ?? data);
          setHasMore(Boolean(data.next));
        }
      } catch (err) {
        if (!cancelled && requestKey === requestKeyRef.current) {
          console.error("Failed to load products:", err);
          setError("Unable to load products. Please try again.");
        }
      } finally {
        if (!cancelled && requestKey === requestKeyRef.current) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [search, category]);
  const loadMoreProducts = async () => {
    if (!hasMore || loadingMore) return;
    const requestKey = requestKeyRef.current;

    try {
      setLoadingMore(true);

      const nextPage = page + 1;

      const params = {
        page: nextPage,
        page_size: 12,
      };

      if (search.trim()) params.search = search.trim();
      if (category) params.category = category;

      const data = await getProducts(params);

      if (requestKey !== requestKeyRef.current) return;

      setProducts((prev) => [...prev, ...(data.results ?? data)]);
      setPage(nextPage);
      setHasMore(Boolean(data.next));
    } catch (err) {
      console.error("Failed to load more products:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section id="products" className="mb-16 mt-20 scroll-mt-24">
      {/* Heading */}
      <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-green-700">
            <Leaf size={14} />
            Handpicked for you
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Popular Products
            <span className="text-green-600">.</span>
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Fresh picks and everyday essentials from trusted local sellers.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 focus-within:border-green-500">
            <Search size={17} className="shrink-0 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-transparent text-sm outline-none sm:w-44"
            />
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
            <SlidersHorizontal size={16} className="text-green-600" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full cursor-pointer bg-transparent text-sm text-gray-700 outline-none sm:w-36"
            >
              <option value="">All Categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="animate-pulse overflow-hidden rounded-xl border border-gray-100 bg-white"
            >
              <div className="aspect-[5/4] bg-gray-100" />
              <div className="space-y-2 p-3">
                <div className="h-3 w-1/3 rounded bg-gray-100" />
                <div className="h-4 w-3/4 rounded bg-gray-100" />
                <div className="h-7 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 py-10 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-14 text-center">
          <Package size={38} className="mx-auto mb-3 text-gray-300" />
          <h3 className="font-bold text-gray-800">No products found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Try another search or select a different category.
          </p>
        </div>
      )}

      {/* Product Grid */}
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <article
              key={product.id}
              className="group overflow-hidden rounded-xl border border-gray-100 bg-white transition duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-lg"
            >
              {/* Product Image */}
              <Link
                to={`/products/${product.id}`}
                className="relative block aspect-[5/4] overflow-hidden bg-gray-50"
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package size={42} className="text-green-200" />
                  </div>
                )}

                <span
                  className={`absolute left-2 top-2 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${
                    product.is_in_stock
                      ? "bg-white/95 text-green-700"
                      : "bg-gray-900/80 text-white"
                  }`}
                >
                  {product.is_in_stock ? "In Stock" : "Out of Stock"}
                </span>

                <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-green-700 opacity-0 shadow transition group-hover:opacity-100">
                  <ArrowRight size={14} />
                </span>
              </Link>

              {/* Product Details */}
              <div className="p-2.5 sm:p-3">
                <p className="mb-1 truncate text-[9px] font-bold uppercase tracking-wider text-green-600 sm:text-[10px]">
                  {product.category_name || "LocalHub Product"}
                </p>

                <h3 className="min-h-9 text-xs font-bold leading-4 text-gray-800 transition group-hover:text-green-700 sm:text-sm">
                  <Link to={`/products/${product.id}`}>{product.name}</Link>
                </h3>

                <div className="mt-2 border-t border-gray-100 pt-2">
                  <p className="text-[9px] text-gray-400">Price</p>
                  <p className="text-sm font-extrabold text-gray-900 sm:text-base">
                    ৳{product.selling_price}
                  </p>
                </div>

                <button
                  onClick={() =>
                    addToCart({
                      id: product.id,
                      name: product.name,
                      price: Number(product.selling_price),
                    })
                  }
                  disabled={!product.is_in_stock}
                  className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-green-700 py-2 text-[10px] font-bold text-white transition hover:bg-green-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 sm:text-xs"
                >
                  <ShoppingCart size={14} />
                  {product.is_in_stock ? "Add to Cart" : "Out of Stock"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {!loading && !error && hasMore && products.length > 0 && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={loadMoreProducts}
            disabled={loadingMore}
            className="rounded-xl border border-green-700 px-8 py-3 text-sm font-bold text-green-700 transition hover:bg-green-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingMore ? "Loading..." : "Load More Products"}
          </button>
        </div>
      )}
    </section>
  );
}

export default ProductSection;
