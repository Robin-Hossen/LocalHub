
from django.contrib import admin
from .models import Delivery, DeliveryAssignmentHistory


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'order',
        'delivery_staff',
        'status',
        'assigned_by',
        'assigned_at',
        'delivered_at',
    )

    list_filter = (
        'status',
        'assigned_at',
        'delivered_at',
    )

    search_fields = (
        'order__order_number',
        'delivery_staff__email',
        'assigned_by__email',
    )

    readonly_fields = (
        'assigned_at',
        'picked_up_at',
        'delivered_at',
        'created_at',
        'updated_at',
    )

    ordering = ('-assigned_at',)


@admin.register(DeliveryAssignmentHistory)
class DeliveryAssignmentHistoryAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'delivery',
        'delivery_staff',
        'assigned_by',
        'outcome',
        'assigned_at',
        'ended_at',
    )

    list_filter = (
        'outcome',
        'assigned_at',
        'ended_at',
    )

    search_fields = (
        'delivery__order__order_number',
        'delivery_staff__email',
        'assigned_by__email',
        'failed_reason',
    )

    readonly_fields = (
        'delivery',
        'delivery_staff',
        'assigned_by',
        'assigned_at',
        'ended_at',
        'outcome',
        'failed_reason',
        'notes',
    )

    ordering = ('-assigned_at',)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
