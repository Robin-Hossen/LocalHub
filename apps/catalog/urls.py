from django.urls import path

from apps.catalog.views import (
    CategoryListAPIView,
    CustomerProductListAPIView,
    CustomerProductDetailAPIView,
    StaffCategoryListCreateAPIView,
    StaffCategoryDetailAPIView,
)
from apps.catalog.views import (
    CategoryListAPIView,
    CustomerProductListAPIView,
    CustomerProductDetailAPIView,
    StaffProductListCreateAPIView,
    StaffProductDetailAPIView,
)

from apps.catalog.views import (
    BulkProductImageUploadAPIView,
)

urlpatterns = [
    path(
        "categories/",
        CategoryListAPIView.as_view(),
        name="category-list",
    ),
    path(
        "products/",
        CustomerProductListAPIView.as_view(),
        name="customer-product-list",
    ),
    path(
        "products/<int:pk>/",
        CustomerProductDetailAPIView.as_view(),
        name="customer-product-detail",
    ),
    # Staff APIs
    path(
        "staff/products/",
        StaffProductListCreateAPIView.as_view(),
        name="staff-product-list-create",
    ),
    path(
        "staff/products/<int:pk>/",
        StaffProductDetailAPIView.as_view(),
        name="staff-product-detail",
    ),
    # Staff Category APIs
    path(
        "staff/categories/",
        StaffCategoryListCreateAPIView.as_view(),
        name="staff-category-list-create",
    ),
    path(
        "staff/categories/<int:pk>/",
        StaffCategoryDetailAPIView.as_view(),
        name="staff-category-detail",
    ),
    path(
        "staff/products/bulk-image-upload/",
        BulkProductImageUploadAPIView.as_view(),
        name="staff-product-bulk-image-upload",
    ),
]
