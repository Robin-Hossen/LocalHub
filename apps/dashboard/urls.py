from django.urls import path

from apps.dashboard.views import (
    OrderDashboardSummaryAPIView,
    InventoryDashboardSummaryAPIView,
    CustomerDashboardSummaryAPIView,
    ProcurementDashboardSummaryAPIView,
    VendorDashboardSummaryAPIView,
    CODDashboardSummaryAPIView,
    DashboardOverviewAPIView,
    )



urlpatterns = [
    path(
        'orders/summary/',
        OrderDashboardSummaryAPIView.as_view(),
        name='order-dashboard-summary'
    ),
    path(
        'inventory/summary/',
        InventoryDashboardSummaryAPIView.as_view(),
        name='inventory-dashboard-summary'
    ),
    path(
        'customers/summary/',
        CustomerDashboardSummaryAPIView.as_view(),
        name='customer-dashboard-summary'
    ),
    path(
        'procurement/summary/',
        ProcurementDashboardSummaryAPIView.as_view(),
        name='procurement-dashboard-summary'
    ),
    path(
        'vendors/summary/',
        VendorDashboardSummaryAPIView.as_view(),
        name='vendor-dashboard-summary'
    ),
    path(
        'cod/summary/',
        CODDashboardSummaryAPIView.as_view(),
        name='cod-dashboard-summary'
    ),
    path(
        'overview/',
        DashboardOverviewAPIView.as_view(),
        name='dashboard-overview'
    ),
]