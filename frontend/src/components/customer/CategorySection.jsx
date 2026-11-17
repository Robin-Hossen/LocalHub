import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCategories } from "../../services/productService";

const categoryImages = [
  {
    keywords: ["vegetable", "veggie"],
    image: "photo-1540420773420-3366772f4999",
  },
  {
    keywords: ["fruit"],
    image: "photo-1610832958506-aa56368176cf",
  },
  {
    keywords: ["grocery", "groceries"],
    image: "photo-1604719312566-8912e9c8a7c7",
  },
  {
    keywords: ["dairy", "milk", "egg"],
    image: "photo-1563636619-e9143da7973b",
  },
  {
    keywords: ["beverage", "drink", "snack"],
    image: "photo-1544145945-f90425340c7e",
  },
  {
    keywords: ["household", "clean"],
    image: "photo-1583947215259-38e31be8751f",
  },
  {
    keywords: ["personal care", "beauty"],
    image: "photo-1608248543803-ba4f8c70ae0b",
  },
];

function getCategoryImage(name = "") {
  const value = name.toLowerCase();

  const matched = categoryImages.find((item) =>
    item.keywords.some((keyword) => value.includes(keyword)),
  );

  const image = matched?.image || "photo-1542838132-92c53300491e";

  return `https://images.unsplash.com/${image}?auto=format&fit=crop&w=240&q=85`;
}

function CategorySection() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data.results ?? data);
      } catch (error) {
        console.error("Failed to load categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const slide = (direction) => {
    if (!sliderRef.current) return;

    sliderRef.current.scrollBy({
      left: direction * 350,
      behavior: "smooth",
    });
  };

  return (
    <section id="categories" className="mt-14 scroll-mt-24">
      {/* Heading */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-green-700">
            Explore our collection
          </p>

          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            Shop by Category
          </h2>
        </div>

        {/* Slider Arrows */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => slide(-1)}
            aria-label="Previous categories"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:border-green-600 hover:bg-green-700 hover:text-white"
          >
            <ChevronLeft size={19} />
          </button>

          <button
            type="button"
            onClick={() => slide(1)}
            aria-label="Next categories"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:border-green-600 hover:bg-green-700 hover:text-white"
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </div>

      {/* Category Slideshow */}
      {loading ? (
        <div className="flex gap-6 overflow-hidden py-2">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="w-20 shrink-0 animate-pulse sm:w-24">
              <div className="h-16 w-16 rounded-full bg-gray-200 sm:h-20 sm:w-20" />
              <div className="mt-3 h-3 w-16 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <p className="py-6 text-sm text-gray-500">
          No categories available yet.
        </p>
      ) : (
        <div
          ref={sliderRef}
          className="flex gap-5 overflow-x-auto scroll-smooth py-2 sm:gap-7"
          style={{ scrollbarWidth: "none" }}
        >
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/?category=${category.id}#products`}
              className="group flex w-[76px] shrink-0 flex-col items-center text-center sm:w-[96px]"
            >
              <div className="h-[68px] w-[68px] overflow-hidden rounded-full border border-gray-100 bg-green-50 shadow-sm transition duration-300 group-hover:scale-105 group-hover:border-green-400 group-hover:shadow-md sm:h-[82px] sm:w-[82px]">
                <img
                  src={category.image || getCategoryImage(category.name)}
                  alt={category.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>

              <h3 className="mt-2.5 w-full truncate text-xs font-semibold text-gray-700 transition group-hover:text-green-700 sm:text-sm">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default CategorySection;
