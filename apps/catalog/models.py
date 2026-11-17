from django.db import models
from django.core.validators import MinValueValidator
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=150, unique=True)

    slug = models.SlugField(
        max_length=170,
        unique=True,
    )

    description = models.TextField(blank=True)

    image = models.ImageField(
        upload_to='categories/',
        blank=True,
        null=True,
    )

    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subcategories',
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name



class Product(models.Model):

    sku = models.CharField(
        max_length=100,
        unique=True,
    )

    name = models.CharField(max_length=200)

    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='products',
    )

    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.PROTECT,
        related_name='products',
    )

    description = models.TextField(blank=True)

    selling_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )

    cost_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )

    image = models.ImageField(
        upload_to='products/',
        blank=True,
        null=True,
    )

    is_available = models.BooleanField(default=True)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name    