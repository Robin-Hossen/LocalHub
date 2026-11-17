from django.contrib import admin

from apps.vendor_accounts.models import VendorPayment, VendorLedger


@admin.register(VendorPayment)
class VendorPaymentAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'vendor',
        'amount',
        'payment_method',
        'paid_by',
        'paid_at',
    )

    list_filter = ('payment_method', 'paid_at')

    search_fields = (
        'vendor__name',
        'reference',
        'paid_by__email',
    )

    readonly_fields = (
        'vendor',
        'amount',
        'payment_method',
        'reference',
        'notes',
        'paid_by',
        'paid_at',
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(VendorLedger)
class VendorLedgerAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'vendor',
        'transaction_type',
        'amount',
        'purchase_order',
        'payment',
        'created_by',
        'created_at',
    )

    list_filter = ('transaction_type', 'created_at')

    search_fields = (
        'vendor__name',
        'reference',
        'purchase_order__purchase_number',
    )

    readonly_fields = (
        'vendor',
        'transaction_type',
        'amount',
        'purchase_order',
        'payment',
        'reference',
        'notes',
        'created_by',
        'created_at',
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False