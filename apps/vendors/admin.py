from django.contrib import admin

from .models import (
    Facility,
    VendorType,
    VendorTypeFacility,
    Vendor,
    VendorFacility,
    VendorCommercialSettings,
)
from .services import apply_vendor_defaults


class VendorTypeFacilityInline(admin.TabularInline):
    model = VendorTypeFacility
    extra = 1


@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'is_active')
    search_fields = ('name', 'code')
    list_filter = ('is_active',)


@admin.register(VendorType)
class VendorTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active')
    search_fields = ('name',)
    list_filter = ('is_active',)
    inlines = [VendorTypeFacilityInline]


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'vendor_type',
        'phone',
        'area',
        'is_active',
    )
    search_fields = ('name', 'phone', 'email')
    list_filter = ('vendor_type', 'area', 'is_active')

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)

        # Apply defaults only when creating a new vendor
        if not change:
            apply_vendor_defaults(obj)


@admin.register(VendorFacility)
class VendorFacilityAdmin(admin.ModelAdmin):
    list_display = ('vendor', 'facility', 'is_enabled')
    list_filter = ('facility', 'is_enabled')
    search_fields = ('vendor__name', 'facility__name')


@admin.register(VendorCommercialSettings)
class VendorCommercialSettingsAdmin(admin.ModelAdmin):
    list_display = (
        'vendor',
        'allow_credit_purchase',
        'credit_limit',
        'payment_term_days',
    )
    search_fields = ('vendor__name',)