
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
import logging

from apps.orders.models import Order
from apps.delivery.models import (
    Delivery,
    DeliveryAssignmentHistory,
)

from apps.orders.services import mark_order_delivered
from apps.emails.services import send_delivery_assignment_email


logger = logging.getLogger(__name__)


def _send_assignment_email_safely(delivery):
    try:
        send_delivery_assignment_email(delivery)
    except Exception:
        logger.exception(
            "Failed to send delivery assignment email for order %s",
            delivery.order.order_number,
        )


@transaction.atomic
def assign_delivery(order_id, delivery_staff, assigned_by, notes=''):
    order = Order.objects.select_for_update().get(id=order_id)

    if order.status != 'SHIPPED':
        raise ValidationError(
            'Only shipped orders can be assigned for delivery.'
        )

    if not delivery_staff.is_active:
        raise ValidationError(
            'Inactive delivery staff cannot be assigned.'
        )

    if delivery_staff.role != 'DELIVERY':
        raise ValidationError(
            'Only delivery staff can be assigned.'
        )

    if Delivery.objects.filter(order=order).exists():
        raise ValidationError(
            'This order already has a delivery assignment.'
        )

    delivery = Delivery.objects.create(
        order=order,
        delivery_staff=delivery_staff,
        assigned_by=assigned_by,
        notes=notes,
    )

    DeliveryAssignmentHistory.objects.create(
        delivery=delivery,
        delivery_staff=delivery_staff,
        assigned_by=assigned_by,
        notes=notes,
    )

    transaction.on_commit(
        lambda: _send_assignment_email_safely(delivery)
    )

    return delivery





@transaction.atomic
def update_delivery_status(
    delivery_id,
    delivery_staff,
    new_status,
    failed_reason='',
):
    delivery = Delivery.objects.select_for_update().get(
        id=delivery_id,
        delivery_staff=delivery_staff,
    )

    allowed_transitions = {
        Delivery.Status.ASSIGNED: [
            Delivery.Status.PICKED_UP,
            Delivery.Status.FAILED,
        ],
        Delivery.Status.PICKED_UP: [
            Delivery.Status.IN_TRANSIT,
            Delivery.Status.FAILED,
        ],
        Delivery.Status.IN_TRANSIT: [
            Delivery.Status.DELIVERED,
            Delivery.Status.FAILED,
        ],
    }

    allowed_statuses = allowed_transitions.get(
        delivery.status, []
    )

    if new_status not in allowed_statuses:
        raise ValidationError(
            f'Cannot change delivery status from '
            f'{delivery.status} to {new_status}.'
        )

    if new_status == Delivery.Status.FAILED and not failed_reason.strip():
        raise ValidationError(
            'Failed reason is required.'
        )

    if new_status == Delivery.Status.PICKED_UP:
        delivery.picked_up_at = timezone.now()

    if new_status == Delivery.Status.DELIVERED:
        mark_order_delivered(
            order_id=delivery.order_id,
            performed_by=delivery_staff,
        )
        delivery.delivered_at = timezone.now()

    
    if new_status == Delivery.Status.FAILED:
        delivery.failed_reason = failed_reason

    # Close the active assignment history
    if new_status in [
        Delivery.Status.FAILED,
        Delivery.Status.DELIVERED,
    ]:
        history = DeliveryAssignmentHistory.objects.filter(
            delivery=delivery,
            ended_at__isnull=True,
            outcome=DeliveryAssignmentHistory.Outcome.ACTIVE,
        ).first()

        if history:
            history.ended_at = timezone.now()
            history.outcome = new_status

            if new_status == Delivery.Status.FAILED:
                history.failed_reason = failed_reason

            history.save(update_fields=[
                'ended_at',
                'outcome',
                'failed_reason',
            ])

    delivery.status = new_status
    delivery.save()

    return delivery


@transaction.atomic
def reassign_failed_delivery(
    delivery_id,
    new_delivery_staff,
    assigned_by,
    notes=''
):
    delivery = Delivery.objects.select_for_update().get(
        id=delivery_id
    )

    if delivery.status != Delivery.Status.FAILED:
        raise ValidationError(
            'Only failed deliveries can be reassigned.'
        )

    if not new_delivery_staff.is_active:
        raise ValidationError(
            'Delivery staff must be active.'
        )

    if new_delivery_staff.role != 'DELIVERY':
        raise ValidationError(
            'Selected user is not a delivery staff.'
        )

    if delivery.order.status != Order.Status.SHIPPED:
        raise ValidationError(
            'Only shipped orders can be reassigned.'
        )

    delivery.delivery_staff = new_delivery_staff
    delivery.assigned_by = assigned_by
    delivery.status = Delivery.Status.ASSIGNED
    delivery.assigned_at = timezone.now()
    delivery.picked_up_at = None
    delivery.delivered_at = None
    delivery.failed_reason = ''
    
    delivery.notes = notes

    delivery.save()

    # Create a new assignment history
    DeliveryAssignmentHistory.objects.create(
        delivery=delivery,
        delivery_staff=new_delivery_staff,
        assigned_by=assigned_by,
        notes=notes,
    )

    transaction.on_commit(
        lambda: _send_assignment_email_safely(delivery)
    )

    return delivery

