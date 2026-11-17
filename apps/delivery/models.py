from django.conf import settings
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone


class Delivery(models.Model):

    class Status(models.TextChoices):
        ASSIGNED = 'ASSIGNED', 'Assigned'
        PICKED_UP = 'PICKED_UP', 'Picked Up'
        IN_TRANSIT = 'IN_TRANSIT', 'In Transit'
        DELIVERED = 'DELIVERED', 'Delivered'
        FAILED = 'FAILED', 'Failed'

    order = models.OneToOneField(
        'orders.Order',
        on_delete=models.PROTECT,
        related_name='delivery'
    )

    delivery_staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='assigned_deliveries',
        limit_choices_to={'role': 'DELIVERY'}
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ASSIGNED
    )

    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='created_delivery_assignments'
    )

    assigned_at = models.DateTimeField(auto_now_add=True)
    picked_up_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    failed_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.delivery_staff_id:
            if self.delivery_staff.role != 'DELIVERY':
                raise ValidationError({
                    'delivery_staff': 'Only delivery staff can be assigned.'
                })

    def __str__(self):
        return f'{self.order.order_number} - {self.status}'


class DeliveryAssignmentHistory(models.Model):

    class Outcome(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        FAILED = 'FAILED', 'Failed'
        DELIVERED = 'DELIVERED', 'Delivered'

    delivery = models.ForeignKey(
        Delivery,
        on_delete=models.CASCADE,
        related_name='assignment_history'
    )

    delivery_staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='delivery_assignment_history'
    )

    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='created_delivery_history'
    )

    assigned_at = models.DateTimeField(default=timezone.now)
    ended_at = models.DateTimeField(null=True, blank=True)

    outcome = models.CharField(
        max_length=20,
        choices=Outcome.choices,
        default=Outcome.ACTIVE
    )

    failed_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['assigned_at', 'id']
        constraints = [
            models.UniqueConstraint(
                fields=['delivery'],
                condition=models.Q(ended_at__isnull=True),
                name='unique_active_delivery_assignment'
            )
        ]

    def __str__(self):
        return (
            f'{self.delivery.order.order_number} - '
            f'{self.delivery_staff.email} - {self.outcome}'
        )


class DutySession(models.Model):

    delivery_staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="duty_sessions",
        limit_choices_to={"role": "DELIVERY"},
    )

    started_at = models.DateTimeField(default=timezone.now)
    ended_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-started_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["delivery_staff"],
                condition=models.Q(ended_at__isnull=True),
                name="unique_active_duty_session",
            )
        ]

    @property
    def is_active(self):
        return self.ended_at is None

    def __str__(self):
        return f"{self.delivery_staff.email} - " f"{self.started_at}"
