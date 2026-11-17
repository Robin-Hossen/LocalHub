from django.urls import path

from .views import (
    CartAPIView,
    AddToCartAPIView,
    CartItemDetailAPIView,
    ClearCartAPIView,
    CheckoutAPIView,
)

urlpatterns = [
    path('', CartAPIView.as_view(), name='my-cart'),
    path('add/', AddToCartAPIView.as_view(), name='add-to-cart'),
    path(
        'items/<int:pk>/',
        CartItemDetailAPIView.as_view(),
        name='cart-item-detail'
    ),
    path('clear/', ClearCartAPIView.as_view(), name='clear-cart'),
    path('checkout/', CheckoutAPIView.as_view(), name='checkout'),
]