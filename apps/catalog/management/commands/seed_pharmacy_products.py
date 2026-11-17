from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.catalog.models import Category, Product
from apps.inventory.models import Stock
from apps.vendors.models import Vendor


PRODUCTS = [
    # Basic Healthcare
    ("PHAR-001", "Digital Thermometer", "Basic Healthcare", 250, 190, 30),
    ("PHAR-002", "Digital BP Monitor", "Basic Healthcare", 1800, 1450, 10),
    ("PHAR-003", "Medical Cotton 100g", "Basic Healthcare", 90, 65, 40),
    ("PHAR-004", "Adhesive Bandage Pack", "Basic Healthcare", 60, 40, 50),

    # First Aid
    ("PHAR-005", "Antiseptic Solution Demo", "First Aid", 120, 85, 25),
    ("PHAR-006", "Sterile Gauze Pad Pack", "First Aid", 100, 70, 30),
    ("PHAR-007", "Medical Tape", "First Aid", 50, 30, 40),
    ("PHAR-008", "First Aid Kit", "First Aid", 450, 350, 15),

    # Personal Care
    ("PHAR-009", "Hand Sanitizer 250ml", "Personal Care", 120, 85, 35),
    ("PHAR-010", "Liquid Hand Wash 250ml", "Personal Care", 130, 95, 30),
    ("PHAR-011", "Baby Diapers Pack", "Personal Care", 550, 450, 15),
    ("PHAR-012", "Baby Wet Wipes", "Personal Care", 150, 110, 25),

    # Vitamins & Wellness (Demo)
    ("PHAR-013", "Vitamin C Tablets Demo", "Vitamins & Wellness", 120, 90, 20),
    ("PHAR-014", "Multivitamin Tablets Demo", "Vitamins & Wellness", 180, 135, 20),
    ("PHAR-015", "ORS Sachet Demo", "Vitamins & Wellness", 10, 6, 100),
    ("PHAR-016", "Zinc Tablets Demo", "Vitamins & Wellness", 60, 45, 30),

    # Healthcare Accessories
    ("PHAR-017", "Hot Water Bag", "Healthcare Accessories", 350, 270, 12),
    ("PHAR-018", "Blood Glucose Meter", "Healthcare Accessories", 900, 720, 10),
    ("PHAR-019", "Disposable Face Mask Pack", "Healthcare Accessories", 120, 85, 40),
    ("PHAR-020", "Disposable Medical Gloves", "Healthcare Accessories", 180, 130, 30),
]


class Command(BaseCommand):
    help = "Create demo Pharmacy products and stock safely."

    @transaction.atomic
    def handle(self, *args, **options):
        try:
            category = Category.objects.get(
                name="Pharmacy",
                is_active=True,
            )

            vendor = Vendor.objects.get(
                name="HealthCare Pharmacy",
                is_active=True,
            )
        except (Category.DoesNotExist, Vendor.DoesNotExist) as exc:
            raise CommandError(
                "Active Pharmacy category or HealthCare Pharmacy vendor not found."
            ) from exc

        if vendor.vendor_type.name != "Pharmacy":
            raise CommandError(
                "HealthCare Pharmacy does not belong to Pharmacy vendor type."
            )

        created_products = 0
        existing_products = 0
        created_stocks = 0
        existing_stocks = 0

        for sku, name, group, selling, cost, quantity in PRODUCTS:
            product, created = Product.objects.get_or_create(
                sku=sku,
                defaults={
                    "name": name,
                    "category": category,
                    "vendor": vendor,
                    "description": (
                        f"Demo catalog item for LocalHub testing. "
                        f"Group: {group}. Not for medical advice."
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
                    "available_quantity": quantity,
                    "reserved_quantity": 0,
                    "reorder_level": 5,
                },
            )

            if stock_created:
                created_stocks += 1
            else:
                existing_stocks += 1

        self.stdout.write(self.style.SUCCESS("Pharmacy demo seeding completed!"))
        self.stdout.write(f"Products created: {created_products}")
        self.stdout.write(f"Products already existed: {existing_products}")
        self.stdout.write(f"Stocks created: {created_stocks}")
        self.stdout.write(f"Stocks already existed: {existing_stocks}")
