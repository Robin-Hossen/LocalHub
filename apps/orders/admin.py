from django.contrib import admin
from apps.orders.models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = [
        'product_name',
        'product_sku',
        'quantity',
        'unit_selling_price',
        'unit_estimated_cost',
        'line_total',
        'line_estimated_cost',
    ]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'order_number',
        'customer',
        'status',
        'payment_method',
        'payment_status',
        'total_amount',
        'created_at',
    ]

    list_filter = [
        'status',
        'payment_method',
        'payment_status',
        'created_at',
    ]

    search_fields = [
        'order_number',
        'customer__email',
        'recipient_name',
        'recipient_phone',
    ]

    readonly_fields = [
        'order_number',
        'customer',
        'delivery_address',
        'recipient_name',
        'recipient_phone',
        'delivery_area_name',
        'delivery_address_line',
        'delivery_landmark',
        'subtotal',
        'delivery_fee',
        'discount',
        'total_amount',
        'created_at',
        'updated_at',
    ]

    inlines = [OrderItemInline]


admin.site.register(OrderItem)