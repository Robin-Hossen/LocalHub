import { useEffect, useState } from "react";
import { ArrowUpRight, Leaf, ShoppingBasket, Truck } from "lucide-react";
import { getPublicBanners } from "../../services/bannerService";

const BACKEND_URL = "http://127.0.0.1:8000";

function getImageUrl(image) {
  if (!image) return "";

  if (image.startsWith("http")) {
    return image;
  }

  return `${BACKEND_URL}${image}`;
}

function PromotionalBanner() {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchBanner = async () => {
      try {
        const data = await getPublicBanners({
          placement: "PROMOTIONAL",
        });

        const banners = Array.isArray(data) ? data : data.results || [];

        if (isMounted && banners.length > 0) {
          setBanner(banners[0]);
        }
      } catch (error) {
        console.error("Failed to load promotional banner:", error);
      }
    };

    fetchBanner();

    return () => {
      isMounted = false;
    };
  }, []);

  const title = banner?.title || "Your Daily Shopping, Made Easier.";
  const subtitle =
    banner?.subtitle ||
    "From fresh vegetables to everyday essentials, discover quality products from trusted local sellers and get everything delivered to your doorstep.";

  const image = banner?.image
    ? getImageUrl(banner.image)
    : "https://images.unsplash.com/photo-1543168256-418811576931?auto=format&fit=crop&w=1100&q=85";

  const buttonText = banner?.button_text || "Shop Now";
  const buttonLink = banner?.button_link || "/#products";

  const imageOnLeft = banner?.layout === "LEFT_IMAGE";

  return (
    <section className="my-20">
      <div className="relative overflow-hidden rounded-[2rem] bg-[#123d2c]">
        {/* Background Decoration */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-green-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-2 lg:gap-12 lg:p-14">
          {/* Content */}
          <div
            className={`relative z-10 ${imageOnLeft ? "order-2" : "order-1"}`}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-green-300/20 bg-green-300/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-green-300">
              <Leaf size={15} />
              LocalHub Special
            </span>

            <h2 className="mt-7 max-w-xl text-4xl font-black leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {title}
            </h2>

            <p className="mt-6 max-w-md text-sm leading-7 text-green-100/75 sm:text-base">
              {subtitle}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={buttonLink}
                className="inline-flex items-center gap-3 rounded-xl bg-[#b8e986] px-6 py-3.5 text-sm font-extrabold text-[#123d2c] transition hover:bg-white"
              >
                {buttonText}
                <ArrowUpRight size={19} />
              </a>

              <a
                href="/#categories"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Explore Categories
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-4 border-t border-white/15 pt-7">
              <div className="flex items-center gap-2.5">
                <Truck size={19} className="text-[#b8e986]" />
                <span className="text-xs font-semibold text-green-50">
                  Fast Delivery
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <ShoppingBasket size={19} className="text-[#b8e986]" />
                <span className="text-xs font-semibold text-green-50">
                  Quality Products
                </span>
              </div>
            </div>
          </div>

          {/* Image */}
          <div
            className={`relative mx-auto w-full max-w-xl ${
              imageOnLeft ? "order-1" : "order-2"
            }`}
          >
            <div className="relative h-[280px] overflow-hidden rounded-[2rem] sm:h-[380px] lg:h-[440px]">
              <img
                src={image}
                alt={banner?.title || "Fresh grocery products"}
                loading="lazy"
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
            </div>

            {/* Offer Badge */}
            <div className="absolute -left-2 top-5 flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[#b8e986] text-center shadow-xl sm:-left-6 sm:top-8 sm:h-28 sm:w-28">
              <span className="text-xs font-bold uppercase tracking-wider text-[#123d2c]">
                Shop
              </span>
              <span className="text-2xl font-black text-[#123d2c]">Local</span>
            </div>

            {/* Floating Info Card */}
            <div className="absolute -bottom-4 right-3 rounded-2xl bg-white p-4 shadow-2xl sm:bottom-7 sm:-right-5 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
                  <Leaf size={22} />
                </div>

                <div>
                  <p className="text-xs text-gray-500">Shop with confidence</p>
                  <p className="text-sm font-extrabold text-gray-900">
                    Fresh. Local. Trusted.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PromotionalBanner;
