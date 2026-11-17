import { useEffect, useState } from "react";
import { ArrowRight, Truck, ShieldCheck, Clock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { getPublicBanners } from "../../services/bannerService";

const BACKEND_URL = "http://127.0.0.1:8000";

function getImageUrl(image) {
  if (!image) return "";

  if (image.startsWith("http")) {
    return image;
  }

  return `${BACKEND_URL}${image}`;
}

function HeroBanner() {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchBanner = async () => {
      try {
        const data = await getPublicBanners({ placement: "HERO" });
        const banners = Array.isArray(data) ? data : data.results || [];

        if (isMounted && banners.length > 0) {
          setBanner(banners[0]);
        }
      } catch (error) {
        console.error("Failed to load hero banner:", error);
      }
    };

    fetchBanner();

    return () => {
      isMounted = false;
    };
  }, []);

  const title = banner?.title || "Fresh Choices,";
  const subtitle = banner?.subtitle || "Delivered Fast.";
  const image = banner?.image
    ? getImageUrl(banner.image)
    : "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1000&auto=format&fit=crop&q=90";

  const buttonText = banner?.button_text || "Shop Now";
  const buttonLink = banner?.button_link || "/#products";

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-green-100 bg-gradient-to-br from-[#f5fbf5] via-white to-[#e8f5e9]">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-green-200/50 blur-3xl" />

      <div className="relative grid items-center gap-10 px-6 py-12 sm:px-10 md:grid-cols-2 md:px-14 md:py-16 lg:gap-16 lg:px-16">
        {/* Left Content */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-xs font-bold tracking-wider text-green-700">
            <Sparkles size={15} />
            FRESHNESS AT YOUR DOORSTEP
          </div>

          <h1 className="mt-7 text-4xl font-extrabold leading-[1.15] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            {title}
            <span className="block text-green-700">
              {banner ? "" : subtitle}
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-8 text-gray-600">
            {banner?.subtitle ||
              "Shop fresh groceries and daily essentials from trusted local suppliers. Enjoy convenient shopping and reliable delivery right at your doorstep."}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href={buttonLink}
              className="inline-flex items-center gap-3 rounded-xl bg-green-700 px-7 py-4 font-bold text-white shadow-lg shadow-green-700/20 transition hover:-translate-y-1 hover:bg-green-800"
            >
              {buttonText}
              <ArrowRight size={19} />
            </a>

            <Link
              to="/#categories"
              className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-white px-6 py-4 font-semibold text-green-800 transition hover:bg-green-50"
            >
              Explore Categories
            </Link>
          </div>

          {/* Benefits */}
          <div className="mt-10 grid grid-cols-2 gap-5 border-t border-green-100 pt-7 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <Truck size={23} className="shrink-0 text-green-700" />
              <div>
                <p className="text-sm font-bold text-gray-900">Fast</p>
                <p className="text-xs text-gray-500">Delivery</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ShieldCheck size={23} className="shrink-0 text-green-700" />
              <div>
                <p className="text-sm font-bold text-gray-900">Trusted</p>
                <p className="text-xs text-gray-500">Local Sellers</p>
              </div>
            </div>

            <div className="col-span-2 flex items-center gap-3 sm:col-span-1">
              <Clock size={23} className="shrink-0 text-green-700" />
              <div>
                <p className="text-sm font-bold text-gray-900">Easy</p>
                <p className="text-xs text-gray-500">Shopping</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Image */}
        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute inset-5 rounded-full bg-green-200/60 blur-3xl" />

          <div className="relative overflow-hidden rounded-[2rem] border-4 border-white shadow-2xl">
            <img
              src={image}
              alt={banner?.title || "Fresh vegetables and groceries"}
              className="h-72 w-full object-cover sm:h-96 lg:h-[450px]"
            />
          </div>

          {/* Floating Card */}
          <div className="absolute -bottom-5 -left-2 flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl sm:-left-8 sm:bottom-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <Truck size={25} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">
                Freshness delivered
              </p>
              <p className="text-sm font-extrabold text-gray-900">
                Right to your door
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroBanner;
