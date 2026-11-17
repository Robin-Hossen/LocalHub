
from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Review(models.Model):

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='reviews'
    )

    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.PROTECT,
        related_name='reviews'
    )

    product = models.ForeignKey(
        'catalog.Product',
        on_delete=models.PROTECT,
        related_name='reviews'
    )

    rating = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5)
        ]
    )

    comment = models.TextField(blank=True)

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.APPROVED
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

        constraints = [
            models.UniqueConstraint(
                fields=['order', 'product'],
                name='unique_review_per_order_product'
            ),
            models.CheckConstraint(
                condition=models.Q(rating__gte=1, rating__lte=5),
                name='review_rating_between_1_and_5'
            )
        ]

        indexes = [
            models.Index(
                fields=['product', 'status'],
                name='review_product_status_idx'
            )
        ]

    def __str__(self):
        return f'{self.product.name} - {self.rating}/5'
