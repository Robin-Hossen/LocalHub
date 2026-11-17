from django.contrib import admin

from apps.procurement.models import (
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseReceipt,
    PurchaseReceiptItem,
)


class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 0
    readonly_fields = (
        'product_name',
        'product_sku',
        'quantity',
        'received_quantity',
        'unit_cost',
        'line_total',
    )
    can_delete = False


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = (
        'purchase_number',
        'vendor',
        'status',
        'subtotal',
        'created_by',
        'created_at',
    )
    list_filter = ('status', 'created_at')
    search_fields = (
        'purchase_number',
        'vendor__name',
        'created_by__email',
    )
    readonly_fields = (
        'purchase_number',
        'vendor',
        'status',
        'subtotal',
        'created_by',
        'confirmed_at',
        'created_at',
        'updated_at',
    )
    inlines = [PurchaseOrderItemInline]
    list_per_page = 20

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class PurchaseReceiptItemInline(admin.TabularInline):
    model = PurchaseReceiptItem
    extra = 0
    readonly_fields = (
        'purchase_order_item',
        'quantity',
        'unit_cost',
        'line_total',
    )
    can_delete = False


@admin.register(PurchaseReceipt)
class PurchaseReceiptAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'purchase_order',
        'received_by',
        'received_at',
    )
    list_filter = ('received_at',)
    search_fields = (
        'purchase_order__purchase_number',
        'received_by__email',
        'notes',
    )
    readonly_fields = (
        'purchase_order',
        'received_by',
        'notes',
        'received_at',
    )
    inlines = [PurchaseReceiptItemInline]
    list_per_page = 20

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False