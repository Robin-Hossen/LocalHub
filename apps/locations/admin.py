from django.contrib import admin
from .models import Area, DeliveryCharge, CustomerAddress


@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)


@admin.register(DeliveryCharge)
class DeliveryChargeAdmin(admin.ModelAdmin):
    list_display = (
        'area',
        'fee',
        'minimum_order_amount',
        'is_active',
    )
    list_filter = ('is_active',)
    search_fields = ('area__name',)


@admin.register(CustomerAddress)
class CustomerAddressAdmin(admin.ModelAdmin):
    list_display = (
        'recipient_name',
        'customer',
        'phone',
        'area',
        'is_default',
    )
    list_filter = ('address_type', 'area')
    search_fields = (
        'recipient_name',
        'phone',
        'customer__email',
    )