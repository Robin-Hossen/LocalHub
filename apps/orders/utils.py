from django.db import connection, transaction
from django.utils import timezone

from apps.orders.models import Order


@transaction.atomic
def generate_order_number():

    today = timezone.localdate()
    date_part = today.strftime('%Y%m%d')

    prefix = f'LH-{date_part}-'

    # Lock order number generation for this date
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT pg_advisory_xact_lock(hashtext(%s))",
            [f'localhub-order-{date_part}']
        )

    existing_numbers = Order.objects.filter(
        order_number__startswith=prefix
    ).values_list('order_number', flat=True)

    last_sequence = max(
        (int(number.split('-')[-1]) for number in existing_numbers),
        default=0
    )

    new_sequence = last_sequence + 1

    return f'{prefix}{new_sequence:04d}'