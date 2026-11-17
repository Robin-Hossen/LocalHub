from django.conf import settings
from django.db import models


class AuditLog(models.Model):

    class Action(models.TextChoices):
        CREATE = 'CREATE', 'Create'
        UPDATE = 'UPDATE', 'Update'
        DELETE = 'DELETE', 'Delete'
        STATUS_CHANGE = 'STATUS_CHANGE', 'Status Change'
        LOGIN = 'LOGIN', 'Login'
        LOGOUT = 'LOGOUT', 'Logout'
        OTHER = 'OTHER', 'Other'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )

    action = models.CharField(
        max_length=20,
        choices=Action.choices
    )

    model_name = models.CharField(max_length=100)

    object_id = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    description = models.TextField()

    old_values = models.JSONField(
        null=True,
        blank=True
    )

    new_values = models.JSONField(
        null=True,
        blank=True
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['action', 'created_at']),
            models.Index(fields=['model_name', 'object_id']),
            models.Index(fields=['user', 'created_at']),
        ]

    def __str__(self):
        return f'{self.action} - {self.model_name} ({self.object_id})'