from django.urls import path

from apps.orders.views import (
    CustomerOrderCreateAPIView,
    CustomerOrderListAPIView,
    CustomerOrderDetailAPIView,
    CustomerOrderCancelAPIView,
    StaffOrderListAPIView,
    StaffOrderDetailAPIView,
    StaffOrderStatusUpdateAPIView,
)


urlpatterns = [

    # Customer APIs
    path(
        '',
        CustomerOrderListAPIView.as_view(),
        name='customer-order-list'
    ),

    path(
        'create/',
        CustomerOrderCreateAPIView.as_view(),
        name='customer-order-create'
    ),

    path(
        '<int:pk>/',
        CustomerOrderDetailAPIView.as_view(),
        name='customer-order-detail'
    ),

    # Staff APIs
    path(
        'staff/',
        StaffOrderListAPIView.as_view(),
        name='staff-order-list'
    ),

    path(
        'staff/<int:pk>/',
        StaffOrderDetailAPIView.as_view(),
        name='staff-order-detail'
    ),

    path(
        '<int:pk>/cancel/',
        CustomerOrderCancelAPIView.as_view(),
        name='customer-order-cancel'
    ),

    path(
        'staff/<int:pk>/status/',
        StaffOrderStatusUpdateAPIView.as_view(),
        name='staff-order-status-update'
    ),

]