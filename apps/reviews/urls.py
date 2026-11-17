
from django.urls import path

from .views import (
    PublicReviewListAPIView,
    CustomerReviewListCreateAPIView,
    CustomerReviewDetailAPIView,
    StaffReviewListAPIView,
    StaffReviewModerationAPIView,
)

urlpatterns = [
    # Public
    path(
        'public/',
        PublicReviewListAPIView.as_view(),
        name='public-review-list'
    ),

    # Customer
    path(
        'my-reviews/',
        CustomerReviewListCreateAPIView.as_view(),
        name='customer-review-list-create'
    ),
    path(
        'my-reviews/<int:pk>/',
        CustomerReviewDetailAPIView.as_view(),
        name='customer-review-detail'
    ),

    # Staff
    path(
        'staff/',
        StaffReviewListAPIView.as_view(),
        name='staff-review-list'
    ),
    path(
        'staff/<int:pk>/moderate/',
        StaffReviewModerationAPIView.as_view(),
        name='staff-review-moderate'
    ),
]
