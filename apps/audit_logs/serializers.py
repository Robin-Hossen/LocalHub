from rest_framework import serializers
from apps.audit_logs.models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):

    user_email = serializers.EmailField(
        source='user.email',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = AuditLog
        fields = [
            'id',
            'user',
            'user_email',
            'action',
            'model_name',
            'object_id',
            'description',
            'old_values',
            'new_values',
            'ip_address',
            'created_at',
        ]

        read_only_fields = fields