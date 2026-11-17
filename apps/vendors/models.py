from django.db import models
from django.core.validators import MinValueValidator


class Facility(models.Model):

    code = models.CharField(
        max_length=50,
        unique=True
    )

    name = models.CharField(max_length=100)

    description = models.TextField(blank=True)

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class VendorType(models.Model):

    name = models.CharField(
        max_length=100,
        unique=True
    )

    description = models.TextField(blank=True)

    is_active = models.BooleanField(default=True)

    facilities = models.ManyToManyField(
        Facility,
        through='VendorTypeFacility',
        related_name='vendor_types'
    )

    def __str__(self):
        return self.name


class VendorTypeFacility(models.Model):

    vendor_type = models.ForeignKey(
        VendorType,
        on_delete=models.CASCADE,
        related_name='default_facilities'
    )

    facility = models.ForeignKey(
        Facility,
        on_delete=models.PROTECT,
        related_name='vendor_type_defaults'
    )

    enabled_by_default = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['vendor_type', 'facility'],
                name='unique_vendor_type_facility'
            )
        ]

    def __str__(self):
        return f"{self.vendor_type} - {self.facility}"

class Vendor(models.Model):

    name = models.CharField(max_length=200)

    vendor_type = models.ForeignKey(
        VendorType,
        on_delete=models.PROTECT,
        related_name='vendors'
    )

    contact_person = models.CharField(max_length=150)

    phone = models.CharField(max_length=20)

    email = models.EmailField(blank=True)

    address = models.TextField()

    area = models.ForeignKey(
        'locations.Area',
        on_delete=models.PROTECT,
        related_name='vendors'
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name  

class VendorFacility(models.Model):

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name='facilities'
    )

    facility = models.ForeignKey(
        Facility,
        on_delete=models.PROTECT,
        related_name='vendor_facilities'
    )

    is_enabled = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['vendor', 'facility'],
                name='unique_vendor_facility'
            )
        ]

    def __str__(self):
        return f"{self.vendor} - {self.facility}"


class VendorCommercialSettings(models.Model):

    vendor = models.OneToOneField(
        Vendor,
        on_delete=models.CASCADE,
        related_name='commercial_settings'
    )

    allow_credit_purchase = models.BooleanField(default=True)

    credit_limit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )

    payment_term_days = models.PositiveIntegerField(default=30)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Commercial Settings - {self.vendor.name}"    
