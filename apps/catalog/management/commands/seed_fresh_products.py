from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from apps.catalog.models import Category, Product
from apps.inventory.models import Stock, StockMovement
from apps.vendors.models import Vendor


PRODUCTS = [
    # Vegetables - 15
    ("VEG-001", "Fresh Potato 1kg", 40, 32, 100),
    ("VEG-002", "Fresh Onion 1kg", 80, 68, 80),
    ("VEG-003", "Fresh Tomato 1kg", 60, 48, 50),
    ("VEG-004", "Fresh Carrot 500g", 45, 35, 40),
    ("VEG-005", "Fresh Cucumber 1kg", 55, 42, 40),
    ("VEG-006", "Green Chili 250g", 35, 25, 40),
    ("VEG-007", "Fresh Eggplant 1kg", 50, 38, 35),
    ("VEG-008", "Cauliflower 1 Piece", 45, 32, 30),
    ("VEG-009", "Cabbage 1 Piece", 40, 30, 30),
    ("VEG-010", "Red Pumpkin 1kg", 45, 34, 35),
    ("VEG-011", "Fresh Spinach 1 Bunch", 25, 18, 30),
    ("VEG-012", "Lemon 4 Pieces", 30, 22, 40),
    ("VEG-013", "Green Papaya 1kg", 40, 30, 25),
    ("VEG-014", "Radish 1kg", 45, 34, 25),
    ("VEG-015", "Fresh Coriander 100g", 25, 18, 30),

    # Fruits - 15
    ("FRU-001", "Apple 1kg", 280, 240, 30),
    ("FRU-002", "Banana 1 Dozen", 100, 80, 40),
    ("FRU-003", "Orange 1kg", 220, 185, 30),
    ("FRU-004", "Mango 1kg", 180, 145, 35),
    ("FRU-005", "Papaya 1 Piece", 80, 60, 25),
    ("FRU-006", "Guava 1kg", 100, 80, 30),
    ("FRU-007", "Pineapple 1 Piece", 70, 52, 25),
    ("FRU-008", "Watermelon 1 Piece", 150, 120, 20),
    ("FRU-009", "Pomegranate 500g", 180, 150, 20),
    ("FRU-010", "Green Grapes 500g", 160, 130, 20),
    ("FRU-011", "Red Grapes 500g", 190, 155, 15),
    ("FRU-012", "Dragon Fruit 1 Piece", 180, 145, 15),
    ("FRU-013", "Malta 1kg", 200, 170, 25),
    ("FRU-014", "Coconut 1 Piece", 80, 62, 25),
    ("FRU-015", "Dates 500g", 220, 185, 20),
]


class Command(BaseCommand):
    help = "Create demo Vegetables and Fruits products."

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
            category_name = (
                "Vegetables" if sku.startswith("VEG-") else "Fruits"
            )

            category, _ = Category.objects.get_or_create(
                name=category_name,
                defaults={
                    "slug": slugify(category_name),
                    "description": f"Fresh {category_name.lower()}",
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
            "Fresh products seeding completed!"
        ))
        self.stdout.write(f"Products created: {created_products}")
        self.stdout.write(f"Products already existed: {existing_products}")
        self.stdout.write(f"Stocks created: {created_stocks}")
        self.stdout.write(f"Stocks initialized: {initialized_stocks}")
        self.stdout.write(f"Existing stock preserved: {preserved_stocks}")
