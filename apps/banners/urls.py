
from django.urls import path

from .views import (
    PublicBannerListAPIView,
    PublicBannerDetailAPIView,
    StaffBannerListCreateAPIView,
    StaffBannerDetailAPIView,
)

urlpatterns = [
    # Public APIs
    path('', PublicBannerListAPIView.as_view(), name='public-banner-list'),
    path('<int:pk>/', PublicBannerDetailAPIView.as_view(), name='public-banner-detail'),

    # Staff APIs
    path('staff/', StaffBannerListCreateAPIView.as_view(), name='staff-banner-list-create'),
    path('staff/<int:pk>/', StaffBannerDetailAPIView.as_view(), name='staff-banner-detail'),
]
