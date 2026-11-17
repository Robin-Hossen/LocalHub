from django.db import models

# Create your models here.
from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator


class Cart(models.Model):
    customer = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cart'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Cart - {self.customer.email}"

    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())

    @property
    def subtotal(self):
        return sum(
            (item.subtotal for item in self.items.all()),
            start=0
        )


class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name='items'
    )

    product = models.ForeignKey(
        'catalog.Product',
        on_delete=models.PROTECT,
        related_name='cart_items'
    )

    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['cart', 'product'],
                name='unique_product_per_cart'
            ),
            models.CheckConstraint(
                condition=models.Q(quantity__gte=1),
                name='cart_item_quantity_gte_one'
            ),
        ]

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"

    @property
    def subtotal(self):
        return self.product.selling_price * self.quantity