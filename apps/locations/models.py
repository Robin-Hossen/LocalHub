from django.db import models
from django.conf import settings


class Area(models.Model):

    name = models.CharField(max_length=100)

    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sub_areas'
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Areas'

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} - {self.name}"
        return self.name


class DeliveryCharge(models.Model):

    area = models.OneToOneField(
        Area,
        on_delete=models.PROTECT,
        related_name='delivery_charge'
    )

    fee = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    minimum_order_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.area.name} - {self.fee}"


class CustomerAddress(models.Model):

    class AddressType(models.TextChoices):
        HOME = 'HOME', 'Home'
        OFFICE = 'OFFICE', 'Office'
        OTHER = 'OTHER', 'Other'

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='addresses'
    )

    address_type = models.CharField(
        max_length=10,
        choices=AddressType.choices,
        default=AddressType.HOME
    )

    recipient_name = models.CharField(max_length=150)

    phone = models.CharField(max_length=20)

    area = models.ForeignKey(
        Area,
        on_delete=models.PROTECT,
        related_name='customer_addresses'
    )

    address_line = models.TextField()

    landmark = models.CharField(
        max_length=255,
        blank=True
    )

    is_default = models.BooleanField(default=False)
    is_saved = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.recipient_name} - {self.area.name}"