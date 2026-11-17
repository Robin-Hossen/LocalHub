from rest_framework import generics
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.audit_logs.models import AuditLog
from apps.audit_logs.serializers import AuditLogSerializer
from apps.audit_logs.permissions import IsAdminOrOperations


class AuditLogListAPIView(generics.ListAPIView):

    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminOrOperations]

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    filterset_fields = [
        'user',
        'action',
        'model_name',
    ]

    search_fields = [
        'description',
        'model_name',
        'object_id',
        'user__email',
    ]

    ordering_fields = [
        'created_at',
        'action',
        'model_name',
    ]

    ordering = ['-created_at']

    def get_queryset(self):
        return AuditLog.objects.select_related('user').all()