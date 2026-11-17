from django.urls import path

from apps.inventory.views import (
    StockListAPIView,
    StockDetailAPIView,
    StockMovementListAPIView,
    StockAddAPIView,
    StockRemoveAPIView,
    StockReserveAPIView,
    StockReleaseAPIView,
    StockConsumeAPIView,
)



urlpatterns = [
    path(
        'stock/',
        StockListAPIView.as_view(),
        name='stock-list'
    ),

    path(
        'stock/<int:pk>/',
        StockDetailAPIView.as_view(),
        name='stock-detail'
    ),

    path(
        'movements/',
        StockMovementListAPIView.as_view(),
        name='stock-movement-list'
    ),

    path('stock/add/', StockAddAPIView.as_view(), name='stock-add'),
    path('stock/remove/', StockRemoveAPIView.as_view(), name='stock-remove'),
    path('stock/reserve/', StockReserveAPIView.as_view(), name='stock-reserve'),
    path('stock/release/', StockReleaseAPIView.as_view(), name='stock-release'),
    path('stock/consume/', StockConsumeAPIView.as_view(), name='stock-consume'),
]