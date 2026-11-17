from django.urls import path

from apps.procurement.views import (
    PurchaseOrderCreateAPIView,
    PurchaseOrderListAPIView,
    PurchaseOrderDetailAPIView,
    PurchaseOrderConfirmAPIView,
    PurchaseOrderReceiveAPIView,
    PurchaseReceiptListAPIView,
)

urlpatterns = [
    path(
        '',
        PurchaseOrderListAPIView.as_view(),
        name='purchase-order-list'
    ),
    path(
        'create/',
        PurchaseOrderCreateAPIView.as_view(),
        name='purchase-order-create'
    ),
    path(
        '<int:pk>/',
        PurchaseOrderDetailAPIView.as_view(),
        name='purchase-order-detail'
    ),
    path(
        '<int:pk>/confirm/',
        PurchaseOrderConfirmAPIView.as_view(),
        name='purchase-order-confirm',
    ),
    path(
        '<int:pk>/receive/',
        PurchaseOrderReceiveAPIView.as_view(),
        name='purchase-order-receive',
    ),
    path(
        'receipts/',
        PurchaseReceiptListAPIView.as_view(),
        name='purchase-receipt-list',
    ),
]