from django.contrib import admin
from apps.audit_logs.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'user',
        'action',
        'model_name',
        'object_id',
        'ip_address',
        'created_at',
    )

    list_filter = (
        'action',
        'model_name',
        'created_at',
    )

    search_fields = (
        'description',
        'model_name',
        'object_id',
        'user__email',
    )

    readonly_fields = (
        'user',
        'action',
        'model_name',
        'object_id',
        'description',
        'old_values',
        'new_values',
        'ip_address',
        'created_at',
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False