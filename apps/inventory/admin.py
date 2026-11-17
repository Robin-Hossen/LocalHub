from django.contrib import admin
from .models import Stock, StockMovement


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'product',
        'available_quantity',
        'reserved_quantity',
        'reorder_level',
        'updated_at',
    )

    search_fields = ('product__name', 'product__sku')

    readonly_fields = (
        'product',
        'available_quantity',
        'reserved_quantity',
        'reorder_level',
        'updated_at',
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'product',
        'movement_type',
        'quantity',
        'reference',
        'created_by',
        'created_at',
    )

    list_filter = ('movement_type', 'created_at')

    search_fields = (
        'product__name',
        'product__sku',
        'reference',
    )

    readonly_fields = (
        'product',
        'movement_type',
        'quantity',
        'reference',
        'notes',
        'created_by',
        'created_at',
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False