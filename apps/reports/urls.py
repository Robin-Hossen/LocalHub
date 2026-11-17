from django.urls import path

from apps.reports.views import (
    SalesSummaryAPIView,
    DailySalesReportAPIView,
    MonthlySalesReportAPIView,
    ProductSalesReportAPIView,
    VendorPurchaseReportAPIView,
    InventoryReportAPIView,
    DeliveryPerformanceReportAPIView,
)

urlpatterns = [
    path("sales/summary/", SalesSummaryAPIView.as_view(), name="sales-summary"),
    path("sales/daily/", DailySalesReportAPIView.as_view(), name="daily-sales-report"),
    path(
        "sales/monthly/",
        MonthlySalesReportAPIView.as_view(),
        name="monthly-sales-report",
    ),
    path(
        "sales/products/",
        ProductSalesReportAPIView.as_view(),
        name="product-sales-report",
    ),
    path(
        "purchases/vendors/",
        VendorPurchaseReportAPIView.as_view(),
        name="vendor-purchase-report",
    ),
    path("inventory/", InventoryReportAPIView.as_view(), name="inventory-report"),
    path(
        "delivery/performance/",
        DeliveryPerformanceReportAPIView.as_view(),
        name="delivery-performance-report",
    ),
]
