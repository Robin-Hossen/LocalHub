from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal

class CODCollection(models.Model):

    order = models.OneToOneField(
        'orders.Order',
        on_delete=models.PROTECT,
        related_name='cod_collection'
    )

    amount_collected = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )

    collected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='cod_collections'
    )

    notes = models.TextField(blank=True)

    collected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-collected_at']

    def __str__(self):
        return f'{self.order.order_number} - {self.amount_collected}'