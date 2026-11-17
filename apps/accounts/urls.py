from django.urls import path

from .views import (
    CustomerRegistrationView,
    CustomerProfileView,
    DeliveryStaffListAPIView,
    DeliveryStaffManagementListCreateAPIView,
    DeliveryStaffManagementDetailAPIView,
)

urlpatterns = [
    path("register/", CustomerRegistrationView.as_view(), name="customer-register"),
    path("profile/", CustomerProfileView.as_view(), name="customer-profile"),
    path(
        "delivery-staff/",
        DeliveryStaffListAPIView.as_view(),
        name="delivery-staff-list",
    ),
    path(
        "delivery-staff/management/",
        DeliveryStaffManagementListCreateAPIView.as_view(),
        name="delivery-staff-management",
    ),
    path(
        "delivery-staff/management/<int:pk>/",
        DeliveryStaffManagementDetailAPIView.as_view(),
        name="delivery-staff-management-detail",
    ),
]
