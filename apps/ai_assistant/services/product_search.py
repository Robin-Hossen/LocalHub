from django.db.models import F, Q
from rapidfuzz import fuzz, process

from apps.catalog.models import Product


def get_available_products():
    return Product.objects.filter(
        is_active=True,
        is_available=True,
        category__is_active=True,
        vendor__is_active=True,
        stock__isnull=False,
        stock__available_quantity__gt=F("stock__reserved_quantity"),
    ).select_related(
        "category",
        "vendor",
        "stock",
    )


def format_products(products, limit):
    results = []

    for product in products[:limit]:
        sellable_quantity = (
            product.stock.available_quantity - product.stock.reserved_quantity
        )

        results.append(
            {
                "id": product.id,
                "sku": product.sku,
                "name": product.name,
                "category": product.category.name,
                "vendor": product.vendor.name,
                "description": product.description,
                "price": str(product.selling_price),
                "available_quantity": sellable_quantity,
                "image": product.image.url if product.image else None,
            }
        )

    return results


def search_products(query="", category=None, limit=10):

    products = get_available_products()

    if category:
        products = products.filter(category__name__iexact=category)

    if not query:
        return format_products(
            products.order_by("name")[:limit],
            limit,
        )

    query = query.strip().lower()

    # First: Normal database search
    exact_matches = (
        products.filter(
            Q(name__icontains=query)
            | Q(description__icontains=query)
            | Q(sku__icontains=query)
            | Q(category__name__icontains=query)
        )
        .distinct()
        .order_by("name")
    )

    if exact_matches.exists():
        return format_products(exact_matches[:limit], limit)

    # Second: Fuzzy spelling search
    product_list = list(products)

    searchable_items = []

    for product in product_list:
        searchable_items.extend(
            [
                (product.name.lower(), product),
                (product.category.name.lower(), product),
                (product.sku.lower(), product),
            ]
        )

    matches = process.extract(
        query,
        [item[0] for item in searchable_items],
        scorer=fuzz.WRatio,
        limit=30,
        score_cutoff=65,
    )

    matched_products = []
    seen_ids = set()

    for matched_text, score, index in matches:
        product = searchable_items[index][1]

        if product.id not in seen_ids:
            matched_products.append((product, score))
            seen_ids.add(product.id)

    matched_products.sort(key=lambda item: (-item[1], item[0].name))

    final_products = [product for product, score in matched_products]

    return format_products(final_products[:limit], limit)
