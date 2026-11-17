from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator
from django.db.models import Q
from decimal import Decimal

class VendorPayment(models.Model):

    class PaymentMethod(models.TextChoices):
        CASH = 'CASH', 'Cash'
        BANK = 'BANK', 'Bank Transfer'
        MOBILE_BANKING = 'MOBILE_BANKING', 'Mobile Banking'

    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.PROTECT,
        related_name='payments'
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices
    )

    reference = models.CharField(
        max_length=100,
        blank=True
    )

    notes = models.TextField(blank=True)

    paid_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='vendor_payments'
    )

    paid_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-paid_at']

    def __str__(self):
        return f'{self.vendor.name} - {self.amount}'


class VendorLedger(models.Model):

    class TransactionType(models.TextChoices):
        PURCHASE = 'PURCHASE', 'Purchase Credit'
        PAYMENT = 'PAYMENT', 'Vendor Payment'
        ADJUSTMENT_CREDIT = 'ADJUSTMENT_CREDIT', 'Adjustment Credit'
        ADJUSTMENT_DEBIT = 'ADJUSTMENT_DEBIT', 'Adjustment Debit'

    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.PROTECT,
        related_name='ledger_entries'
    )

    transaction_type = models.CharField(
        max_length=20,
        choices=TransactionType.choices
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )

    purchase_order = models.ForeignKey(
        'procurement.PurchaseOrder',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='ledger_entries'
    )

    payment = models.ForeignKey(
        VendorPayment,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='ledger_entries'
    )

    reference = models.CharField(
        max_length=100,
        blank=True
    )

    notes = models.TextField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='vendor_ledger_entries'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    
    class Meta:
        ordering = ['-created_at']

        constraints = [
            models.CheckConstraint(
                condition=Q(amount__gt=0),
                name='vendor_ledger_amount_positive'
            ),

            models.UniqueConstraint(
                fields=['purchase_order'],
                condition=Q(
                    transaction_type='PURCHASE',
                    purchase_order__isnull=False
                ),
                name='unique_vendor_purchase_credit',
            ),

            models.UniqueConstraint(
                fields=['payment'],
                condition=Q(
                    transaction_type='PAYMENT',
                    payment__isnull=False
                ),
                name='unique_vendor_payment_ledger',
            ),

            models.CheckConstraint(
                condition=(
                    Q(
                        transaction_type='PURCHASE',
                        purchase_order__isnull=False,
                        payment__isnull=True
                    )
                    |
                    Q(
                        transaction_type='PAYMENT',
                        payment__isnull=False,
                        purchase_order__isnull=True
                    )
                    |
                    Q(
                        transaction_type='ADJUSTMENT_CREDIT',
                        purchase_order__isnull=True,
                        payment__isnull=True
                    )
                    |
                    Q(
                        transaction_type='ADJUSTMENT_DEBIT',
                        purchase_order__isnull=True,
                        payment__isnull=True
                    )
                ),
                name='vendor_ledger_valid_reference'
            ),
        ]


    def __str__(self):
        return f'{self.vendor.name} - {self.transaction_type} - {self.amount}'