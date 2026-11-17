from django.db import connection, transaction
from django.utils import timezone

from apps.procurement.models import PurchaseOrder


@transaction.atomic
def generate_purchase_number():

    today = timezone.localdate()
    date_part = today.strftime('%Y%m%d')

    prefix = f'LH-PO-{date_part}-'

    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT pg_advisory_xact_lock(hashtext(%s))",
            [f'localhub-purchase-{date_part}']
        )

    existing_numbers = PurchaseOrder.objects.filter(
        purchase_number__startswith=prefix
    ).values_list('purchase_number', flat=True)

    last_sequence = max(
        (
            int(number.split('-')[-1])
            for number in existing_numbers
        ),
        default=0
    )

    new_sequence = last_sequence + 1

    return f'{prefix}{new_sequence:04d}'