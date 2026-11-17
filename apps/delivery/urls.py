from django.urls import path

from apps.delivery.views import (
    DeliveryAssignmentListCreateAPIView,
    DeliveryAssignmentDetailAPIView,
    DeliveryAssignmentHistoryAPIView,
    MyDeliveryListAPIView,
    DeliveryStatusUpdateAPIView,
    DeliveryReassignAPIView,
    DutyStartAPIView,
    DutyEndAPIView,
    DutyStatusAPIView,
    AdminDutyMonitoringAPIView,
)

urlpatterns = [
    path(
        "assignments/",
        DeliveryAssignmentListCreateAPIView.as_view(),
        name="delivery-assignment-list-create",
    ),
    path(
        "assignments/<int:pk>/",
        DeliveryAssignmentDetailAPIView.as_view(),
        name="delivery-assignment-detail",
    ),
    path(
        "assignments/<int:pk>/history/",
        DeliveryAssignmentHistoryAPIView.as_view(),
        name="delivery-assignment-history",
    ),
    path(
        "assignments/<int:pk>/reassign/",
        DeliveryReassignAPIView.as_view(),
        name="delivery-reassign",
    ),
    path(
        "my-deliveries/",
        MyDeliveryListAPIView.as_view(),
        name="my-deliveries",
    ),
    path(
        "my-deliveries/<int:pk>/status/",
        DeliveryStatusUpdateAPIView.as_view(),
        name="delivery-status-update",
    ),
    path("duty/start/", DutyStartAPIView.as_view(), name="duty-start"),
    path("duty/end/", DutyEndAPIView.as_view(), name="duty-end"),
    path("duty/status/", DutyStatusAPIView.as_view(), name="duty-status"),
    path(
        "duty/monitoring/",
        AdminDutyMonitoringAPIView.as_view(),
        name="admin-duty-monitoring",
    ),
]
