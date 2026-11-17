from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.catalog.models import Product
from apps.inventory.models import Stock


@receiver(post_save, sender=Product)
def create_product_stock(sender, instance, created, **kwargs):
    if created:
        Stock.objects.get_or_create(product=instance)