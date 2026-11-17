from django.urls import path
from .views import (
    AreaListAPIView,
    DeliveryChargeListAPIView,
)

from .views import (
    AreaListAPIView,
    DeliveryChargeListAPIView,
    CustomerAddressListCreateAPIView,
    CustomerAddressDetailAPIView,
)


urlpatterns = [
    path('areas/', AreaListAPIView.as_view(), name='area-list'),

    path(
        'delivery-charges/',
        DeliveryChargeListAPIView.as_view(),
        name='delivery-charge-list'
    ),

    path(
        'addresses/',
        CustomerAddressListCreateAPIView.as_view(),
        name='customer-address-list-create'
    ),

    path(
        'addresses/<int:pk>/',
        CustomerAddressDetailAPIView.as_view(),
        name='customer-address-detail'
    ),
]