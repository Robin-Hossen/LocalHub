from django.urls import path
from apps.audit_logs.views import AuditLogListAPIView


urlpatterns = [
    path(
        '',
        AuditLogListAPIView.as_view(),
        name='audit-log-list'
    ),
]