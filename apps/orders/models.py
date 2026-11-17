from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone


class Order(models.Model):

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        PROCESSING = 'PROCESSING', 'Processing'
        SHIPPED = 'SHIPPED', 'Shipped'
        DELIVERED = 'DELIVERED', 'Delivered'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class PaymentMethod(models.TextChoices):
        COD = 'COD', 'Cash on Delivery'

    class PaymentStatus(models.TextChoices):
        UNPAID = 'UNPAID', 'Unpaid'
        PAID = 'PAID', 'Paid'
        REFUNDED = 'REFUNDED', 'Refunded'

    order_number = models.CharField(
        max_length=30,
        unique=True
    )

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='orders'
    )

    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.PROTECT,
        related_name='orders',
        null=True,
        blank=True
    )

    delivery_address = models.ForeignKey(
        'locations.CustomerAddress',
        on_delete=models.PROTECT,
        related_name='orders'
    )

    recipient_name = models.CharField(max_length=150)
    recipient_phone = models.CharField(max_length=20)
    delivery_area_name = models.CharField(max_length=150)
    delivery_address_line = models.TextField()
    delivery_landmark = models.CharField(max_length=255, blank=True)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    payment_method = models.CharField(
        max_length=10,
        choices=PaymentMethod.choices,
        default=PaymentMethod.COD
    )

    payment_status = models.CharField(
        max_length=10,
        choices=PaymentStatus.choices,
        default=PaymentStatus.UNPAID
    )

    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    delivery_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    discount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items'
    )

    product = models.ForeignKey(
        'catalog.Product',
        on_delete=models.PROTECT,
        related_name='order_items'
    )

    product_name = models.CharField(max_length=255)
    product_sku = models.CharField(max_length=100)

    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )

    reserved_quantity = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )

    unit_selling_price = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    unit_estimated_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    line_total = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    line_estimated_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.product_name} - {self.quantity}"