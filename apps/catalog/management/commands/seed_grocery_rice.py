from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.catalog.models import Category, Product
from apps.inventory.models import Stock, StockMovement
from apps.vendors.models import Vendor


PRODUCTS = [
    # Grocery - 15 products
    ("GROC-001", "Soybean Oil 1L", 175, 155, 50),
    ("GROC-002", "Mustard Oil 500ml", 140, 120, 30),
    ("GROC-003", "Red Lentils 1kg", 125, 105, 50),
    ("GROC-004", "Chickpeas 1kg", 110, 90, 35),
    ("GROC-005", "Sugar 1kg", 130, 115, 50),
    ("GROC-006", "Salt 1kg", 40, 32, 60),
    ("GROC-007", "Atta 2kg", 120, 100, 40),
    ("GROC-008", "Maida 1kg", 75, 62, 35),
    ("GROC-009", "Semai 200g", 45, 35, 40),
    ("GROC-010", "Tea Leaves 200g", 120, 95, 30),
    ("GROC-011", "Milk Powder 500g", 420, 380, 20),
    ("GROC-012", "Tomato Ketchup 340g", 110, 85, 25),
    ("GROC-013", "Soy Sauce 200ml", 95, 75, 25),
    ("GROC-014", "Chili Powder 200g", 100, 80, 30),
    ("GROC-015", "Turmeric Powder 200g", 85, 68, 30),

    # Rice - 10 products
    ("RICE-005", "Miniket Rice 10kg", 900, 820, 25),
    ("RICE-006", "Najirshail Rice 5kg", 520, 470, 25),
    ("RICE-007", "Chinigura Rice 2kg", 360, 310, 20),
    ("RICE-008", "BR-28 Rice 5kg", 340, 300, 35),
    ("RICE-009", "Paijam Rice 5kg", 380, 335, 30),
    ("RICE-010", "Aromatic Rice 1kg", 160, 130, 25),
    ("RICE-011", "Basmati Rice 1kg", 280, 240, 15),
    ("RICE-012", "Brown Rice 1kg", 190, 155, 20),
    ("RICE-013", "Miniket Rice 2kg", 185, 160, 30),
    ("RICE-014", "Parboiled Rice 5kg", 360, 320, 30),
]


class Command(BaseCommand):
    help = "Create demo Grocery and Rice products with opening stock."

    @transaction.atomic
    def handle(self, *args, **options):
        try:
            vendor = Vendor.objects.get(
                name="Second Grocery Supplier",
                is_active=True,
            )
            grocery = Category.objects.get(name="Grocery", is_active=True)
            rice = Category.objects.get(name="Rice", is_active=True)
        except (Vendor.DoesNotExist, Category.DoesNotExist) as exc:
            raise CommandError(
                "Required active vendor or category not found."
            ) from exc

        if vendor.vendor_type.name != "Grocery":
            raise CommandError("Selected vendor is not a Grocery vendor.")

        created_products = 0
        existing_products = 0
        created_stocks = 0
        existing_stocks = 0

        for sku, name, selling, cost, quantity in PRODUCTS:
            category = rice if sku.startswith("RICE-") else grocery

            product, created = Product.objects.get_or_create(
                sku=sku,
                defaults={
                    "name": name,
                    "category": category,
                    "vendor": vendor,
                    "description": (
                        "Demo product for LocalHub storefront testing."
                    ),
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

            # Initialize only empty stock; preserve existing quantities.
            if stock.available_quantity == 0 and stock.reserved_quantity == 0:
                stock.available_quantity = quantity
                stock.save(update_fields=["available_quantity", "updated_at"])

                StockMovement.objects.get_or_create(
                    product=product,
                    movement_type="ADJUSTMENT_IN",
                    reference=f"DEMO-SEED-{sku}",
                    defaults={
                        "quantity": quantity,
                        "notes": "Demo opening stock for LocalHub testing.",
                    },
                )
            else:
                existing_stocks += 1

        self.stdout.write(self.style.SUCCESS(
            "Grocery and Rice demo seeding completed!"
        ))
        self.stdout.write(f"Products created: {created_products}")
        self.stdout.write(f"Products already existed: {existing_products}")
        self.stdout.write(f"Stocks created: {created_stocks}")
        self.stdout.write(f"Stocks with existing/non-empty records: {existing_stocks}")
