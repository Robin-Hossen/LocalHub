from django.urls import path

from apps.vendor_accounts.views import (
    VendorBalanceAPIView,
    VendorLedgerListAPIView,
    VendorPaymentListCreateAPIView,
    VendorAdjustmentAPIView,
)

urlpatterns = [
    path(
        'vendors/<int:vendor_id>/balance/',
        VendorBalanceAPIView.as_view(),
        name='vendor-balance',
    ),

    path(
        'ledger/',
        VendorLedgerListAPIView.as_view(),
        name='vendor-ledger-list',
    ),

    path(
        'payments/',
        VendorPaymentListCreateAPIView.as_view(),
        name='vendor-payment-list-create',
    ),
    path(
        'adjustments/',
        VendorAdjustmentAPIView.as_view(),
        name='vendor-adjustment'
    ),
]