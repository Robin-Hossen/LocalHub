from django.db import models
from django.core.validators import MinValueValidator
from django.db.models import F, Q


class Stock(models.Model):

    product = models.OneToOneField(
        'catalog.Product',
        on_delete=models.PROTECT,
        related_name='stock'
    )

    available_quantity = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )

    reserved_quantity = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )

    reorder_level = models.PositiveIntegerField(
        default=5,
        validators=[MinValueValidator(0)]
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Stock'
        verbose_name_plural = 'Stocks'

        constraints = [
            models.CheckConstraint(
                condition=Q(
                    available_quantity__gte=F('reserved_quantity')
                ),
                name='stock_reserved_lte_available'
            )
        ]    

    def __str__(self):
        return f"{self.product.name} - {self.available_quantity}"



class StockMovement(models.Model):

    class MovementType(models.TextChoices):
        PURCHASE = 'PURCHASE', 'Purchase'
        SALE = 'SALE', 'Sale'
        CUSTOMER_RETURN = 'CUSTOMER_RETURN', 'Customer Return'
        DAMAGE = 'DAMAGE', 'Damage'
        ADJUSTMENT_IN = 'ADJUSTMENT_IN', 'Adjustment In'
        ADJUSTMENT_OUT = 'ADJUSTMENT_OUT', 'Adjustment Out'
        RESERVE = 'RESERVE', 'Reserve'
        RELEASE = 'RELEASE', 'Release'

    product = models.ForeignKey(
        'catalog.Product',
        on_delete=models.PROTECT,
        related_name='stock_movements'
    )

    movement_type = models.CharField(
        max_length=20,
        choices=MovementType.choices
    )

    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )

    reference = models.CharField(
        max_length=100,
        blank=True
    )

    notes = models.TextField(blank=True)

    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stock_movements'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Stock Movement'
        verbose_name_plural = 'Stock Movements'

    def __str__(self):
        return f"{self.product.name} - {self.movement_type} - {self.quantity}"