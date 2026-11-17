from django.db import transaction

from .models import (
    Vendor,
    VendorFacility,
    VendorCommercialSettings,
)


@transaction.atomic
def apply_vendor_defaults(vendor):
    # Copy enabled default facilities from VendorType
    default_facilities = vendor.vendor_type.default_facilities.filter(
        enabled_by_default=True,
        facility__is_active=True,
    ).select_related('facility')

    for item in default_facilities:
        VendorFacility.objects.get_or_create(
            vendor=vendor,
            facility=item.facility,
            defaults={'is_enabled': True},
        )

    # Create commercial settings
    VendorCommercialSettings.objects.get_or_create(
        vendor=vendor,
        defaults={
            'allow_credit_purchase': True,
            'credit_limit': 0,
            'payment_term_days': 30,
        },
    )


@transaction.atomic
def create_vendor_with_defaults(**vendor_data):
    vendor = Vendor.objects.create(**vendor_data)
    apply_vendor_defaults(vendor)
    return vendor