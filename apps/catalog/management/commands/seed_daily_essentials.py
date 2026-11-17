from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from apps.catalog.models import Category, Product
from apps.inventory.models import Stock, StockMovement
from apps.vendors.models import Vendor


PRODUCTS = [
    # Dairy & Eggs - 10
    ("DAI-001", "Fresh Milk 1L", 100, 85, 40),
    ("DAI-002", "UHT Milk 1L", 110, 95, 35),
    ("DAI-003", "Farm Eggs 12 Pieces", 150, 135, 40),
    ("DAI-004", "Farm Eggs 6 Pieces", 80, 72, 50),
    ("DAI-005", "Butter 200g", 220, 190, 20),
    ("DAI-006", "Cheese Slices 200g", 280, 240, 15),
    ("DAI-007", "Plain Yogurt 500g", 100, 80, 25),
    ("DAI-008", "Sweet Yogurt 500g", 130, 105, 20),
    ("DAI-009", "Condensed Milk 400g", 120, 100, 25),
    ("DAI-010", "Ghee 200g", 260, 225, 15),

    # Snacks & Beverages - 15
    ("SNK-001", "Potato Chips 50g", 30, 22, 60),
    ("SNK-002", "Chocolate Bar 40g", 50, 38, 50),
    ("SNK-003", "Cream Biscuits 200g", 60, 45, 40),
    ("SNK-004", "Salted Crackers 150g", 45, 34, 35),
    ("SNK-005", "Instant Noodles Pack", 25, 19, 80),
    ("SNK-006", "Popcorn 100g", 55, 42, 30),
    ("SNK-007", "Fruit Juice 1L", 120, 95, 30),
    ("SNK-008", "Mango Juice 500ml", 60, 45, 40),
    ("SNK-009", "Soft Drink 1L", 70, 58, 35),
    ("SNK-010", "Mineral Water 1L", 25, 18, 100),
    ("SNK-011", "Green Tea 25 Bags", 180, 145, 20),
    ("SNK-012", "Coffee 100g", 220, 185, 20),
    ("SNK-013", "Energy Drink 250ml", 80, 65, 25),
    ("SNK-014", "Peanut Cookies 200g", 75, 58, 30),
    ("SNK-015", "Roasted Peanuts 200g", 90, 72, 30),

    # Household Essentials - 10
    ("HOU-001", "Dishwashing Liquid 500ml", 100, 80, 30),
    ("HOU-002", "Laundry Detergent 1kg", 160, 135, 35),
    ("HOU-003", "Toilet Cleaner 500ml", 120, 95, 25),
    ("HOU-004", "Floor Cleaner 1L", 180, 150, 20),
    ("HOU-005", "Tissue Box 100 Sheets", 65, 48, 50),
    ("HOU-006", "Toilet Tissue 4 Rolls", 120, 95, 35),
    ("HOU-007", "Garbage Bags 20 Pieces", 80, 60, 30),
    ("HOU-008", "Kitchen Sponge 3 Pieces", 50, 35, 40),
    ("HOU-009", "Mosquito Coil Pack", 70, 52, 40),
    ("HOU-010", "Aluminum Foil Roll", 140, 115, 20),

    # Personal Care - 10
    ("PER-001", "Bathing Soap 100g", 50, 38, 60),
    ("PER-002", "Shampoo 180ml", 150, 120, 35),
    ("PER-003", "Toothpaste 100g", 110, 85, 40),
    ("PER-004", "Toothbrush 1 Piece", 45, 32, 50),
    ("PER-005", "Hair Oil 200ml", 130, 105, 30),
    ("PER-006", "Face Wash 100ml", 180, 145, 25),
    ("PER-007", "Body Lotion 200ml", 220, 180, 20),
    ("PER-008", "Deodorant 150ml", 250, 205, 20),
    ("PER-009", "Hand Cream 50g", 120, 95, 25),
    ("PER-010", "Comb 1 Piece", 40, 28, 40),
]


class Command(BaseCommand):
    help = "Seed Dairy, Snacks, Household and Personal Care demo products."

    @transaction.atomic
    def handle(self, *args, **options):
        try:
            vendor = Vendor.objects.get(
                name="Second Grocery Supplier",
                is_active=True,
            )
        except Vendor.DoesNotExist as exc:
            raise CommandError(
                "Active Second Grocery Supplier not found."
            ) from exc

        if vendor.vendor_type.name != "Grocery":
            raise CommandError("Selected vendor is not a Grocery vendor.")

        created_products = 0
        existing_products = 0
        created_stocks = 0
        initialized_stocks = 0
        preserved_stocks = 0

        for sku, name, selling, cost, quantity in PRODUCTS:
            if sku.startswith("DAI-"):
                category_name = "Dairy & Eggs"
            elif sku.startswith("SNK-"):
                category_name = "Snacks & Beverages"
            elif sku.startswith("HOU-"):
                category_name = "Household Essentials"
            else:
                category_name = "Personal Care"

            category, _ = Category.objects.get_or_create(
                name=category_name,
                defaults={
                    "slug": slugify(category_name),
                    "description": f"{category_name} demo products",
                    "is_active": True,
                },
            )

            if not category.is_active:
                raise CommandError(
                    f"{category_name} category is inactive."
                )

            product, created = Product.objects.get_or_create(
                sku=sku,
                defaults={
                    "name": name,
                    "category": category,
                    "vendor": vendor,
                    "description": "Demo product for LocalHub storefront testing.",
                    "selling_price": Decimal(str(selling)),
                    "cost_price": Decimal(str(cost)),
                    "is_available": True,
                    "is_active": True,
                },
            )

            if created:
                created_products += 1
            else:
                existing_products += 1
                if (
                    product.category_id != category.id
                    or product.vendor_id != vendor.id
                ):
                    raise CommandError(
                        f"SKU {sku} already exists with a different category or vendor."
                    )

            stock, stock_created = Stock.objects.get_or_create(
                product=product,
                defaults={
                    "available_quantity": 0,
                    "reserved_quantity": 0,
                    "reorder_level": 5,
                },
            )

            if stock_created:
                created_stocks += 1

            if (
                stock.available_quantity == 0
                and stock.reserved_quantity == 0
            ):
                stock.available_quantity = quantity
                stock.save(
                    update_fields=["available_quantity", "updated_at"]
                )

                StockMovement.objects.get_or_create(
                    product=product,
                    movement_type="ADJUSTMENT_IN",
                    reference=f"DEMO-SEED-{sku}",
                    defaults={
                        "quantity": quantity,
                        "notes": "Demo opening stock for LocalHub testing.",
                    },
                )
                initialized_stocks += 1
            else:
                preserved_stocks += 1

        self.stdout.write(self.style.SUCCESS(
            "Daily essentials seeding completed!"
        ))
        self.stdout.write(f"Products created: {created_products}")
        self.stdout.write(f"Products already existed: {existing_products}")
        self.stdout.write(f"Stocks created: {created_stocks}")
        self.stdout.write(f"Stocks initialized: {initialized_stocks}")
        self.stdout.write(f"Existing stock preserved: {preserved_stocks}")
