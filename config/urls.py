from django.contrib import admin
from django.urls import path
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/locations/", include("apps.locations.urls")),
    path("api/vendors/", include("apps.vendors.urls")),
    path("api/catalog/", include("apps.catalog.urls")),
    path("api/inventory/", include("apps.inventory.urls")),
    path("api/orders/", include("apps.orders.urls")),
    path("api/cod/", include("apps.cod.urls")),
    path("api/procurement/", include("apps.procurement.urls")),
    path("api/vendor-accounts/", include("apps.vendor_accounts.urls")),
    path("api/dashboard/", include("apps.dashboard.urls")),
    path("api/reports/", include("apps.reports.urls")),
    path("api/audit-logs/", include("apps.audit_logs.urls")),
    path("api/delivery/", include("apps.delivery.urls")),
    path("api/cart/", include("apps.carts.urls")),
    path("api/banners/", include("apps.banners.urls")),
    path("api/reviews/", include("apps.reviews.urls")),
    path("api/accounts/", include("apps.accounts.urls")),
    # JWT Authentication
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    
    # AI Assistant
    path(
        "api/ai/",
        include("apps.ai_assistant.urls"),
    ),
    # API Documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )
