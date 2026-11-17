from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator
from django.db.models import F, Q
from decimal import Decimal


class PurchaseOrder(models.Model):

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED', 'Partially Received'
        RECEIVED = 'RECEIVED', 'Received'
        CANCELLED = 'CANCELLED', 'Cancelled'

    purchase_number = models.CharField(
        max_length=30,
        unique=True
    )

    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.PROTECT,
        related_name='purchase_orders'
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )

    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    notes = models.TextField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='created_purchase_orders'
    )

    confirmed_at = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.purchase_number

class PurchaseOrderItem(models.Model):

    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name='items'
    )

    product = models.ForeignKey(
        'catalog.Product',
        on_delete=models.PROTECT,
        related_name='purchase_order_items'
    )

    product_name = models.CharField(max_length=255)

    product_sku = models.CharField(max_length=100)

    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )

    received_quantity = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )

    unit_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )

    line_total = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    class Meta:
        ordering = ['id']

        constraints = [
            models.UniqueConstraint(
                fields=['purchase_order', 'product'],
                name='unique_product_per_purchase_order'
            ),
            models.CheckConstraint(
                condition=Q(received_quantity__lte=F('quantity')),
                name='received_qty_lte_ordered_qty'
            ),
            models.CheckConstraint(
                condition=Q(line_total__gte=0),
                name='purchase_line_total_nonnegative'
            ),
        ]

    def __str__(self):
        return f'{self.product_name} - {self.quantity}' 


class PurchaseReceipt(models.Model):

    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.PROTECT,
        related_name='receipts'
    )

    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='purchase_receipts'
    )

    notes = models.TextField(blank=True)

    received_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-received_at']

    def __str__(self):
        return f'Receipt - {self.purchase_order.purchase_number}'


class PurchaseReceiptItem(models.Model):

    receipt = models.ForeignKey(
        PurchaseReceipt,
        on_delete=models.CASCADE,
        related_name='items'
    )

    purchase_order_item = models.ForeignKey(
        PurchaseOrderItem,
        on_delete=models.PROTECT,
        related_name='receipt_items'
    )

    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )

    unit_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    line_total = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f'{self.purchase_order_item.product_name} - {self.quantity}'