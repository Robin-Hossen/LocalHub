from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.orders.models import Order
from apps.cod.models import CODCollection


@transaction.atomic
def collect_cod_payment(order_id, collected_by, amount_collected, notes=''):

    order = Order.objects.select_for_update().get(id=order_id)

    if order.payment_method != Order.PaymentMethod.COD:
        raise ValidationError('This order is not a COD order.')

    if order.status != Order.Status.DELIVERED:
        raise ValidationError('Only delivered orders can have COD collection.')

    if order.payment_status != Order.PaymentStatus.UNPAID:
        raise ValidationError('Payment is not pending for this order.')

    amount_collected = Decimal(str(amount_collected))

    if amount_collected != order.total_amount:
        raise ValidationError(
            f'Collected amount must be exactly {order.total_amount}.'
        )

    collection = CODCollection.objects.create(
        order=order,
        amount_collected=amount_collected,
        collected_by=collected_by,
        notes=notes
    )

    order.payment_status = Order.PaymentStatus.PAID
    order.save(update_fields=['payment_status', 'updated_at'])

    return collection