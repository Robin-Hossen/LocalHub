from django.urls import path

from apps.vendors.views import (
    VendorListCreateAPIView,
    VendorDetailAPIView,
    VendorTypeListAPIView,
)

urlpatterns = [
    path(
        '',
        VendorListCreateAPIView.as_view(),
        name='vendor-list-create',
    ),
    path(
        '<int:pk>/',
        VendorDetailAPIView.as_view(),
        name='vendor-detail',
    ),
    path(
        'types/',
        VendorTypeListAPIView.as_view(),
        name='vendor-type-list',
    ),
]