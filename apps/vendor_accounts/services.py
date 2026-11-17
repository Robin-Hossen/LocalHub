from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Sum, Q

from apps.vendors.models import Vendor
from apps.procurement.models import PurchaseOrder
from apps.vendor_accounts.models import VendorPayment, VendorLedger




@transaction.atomic
def create_purchase_credit(purchase_order_id, created_by):

    purchase_order = PurchaseOrder.objects.select_for_update().get(
        id=purchase_order_id
    )

    # Lock the same Vendor row used by record_vendor_payment().
    vendor = Vendor.objects.select_for_update().get(
        id=purchase_order.vendor_id
    )

    if purchase_order.status != PurchaseOrder.Status.RECEIVED:
        raise ValidationError(
            'Purchase order must be fully received before creating credit.'
        )

    if VendorLedger.objects.filter(
        purchase_order=purchase_order,
        transaction_type=VendorLedger.TransactionType.PURCHASE
    ).exists():
        raise ValidationError(
            'Purchase credit already exists for this purchase order.'
        )

    if purchase_order.subtotal <= 0:
        raise ValidationError(
            'Purchase order amount must be greater than zero.'
        )

    ledger_entry = VendorLedger.objects.create(
        vendor=vendor,
        transaction_type=VendorLedger.TransactionType.PURCHASE,
        amount=purchase_order.subtotal,
        purchase_order=purchase_order,
        created_by=created_by,
        reference=purchase_order.purchase_number,
        notes='Purchase order credit created after goods receiving.'
    )

    return ledger_entry




def get_vendor_balance(vendor_id):

    if not Vendor.objects.filter(id=vendor_id).exists():
        raise ValidationError('Vendor does not exist.')

    totals = VendorLedger.objects.filter(
        vendor_id=vendor_id
    ).aggregate(
        total_credit=Sum(
            'amount',
            filter=Q(transaction_type='PURCHASE')
        ),
        adjustment_credit=Sum(
            'amount',
            filter=Q(transaction_type='ADJUSTMENT_CREDIT')
        ),
        adjustment_debit=Sum(
            'amount',
            filter=Q(transaction_type='ADJUSTMENT_DEBIT')
        ),
        total_payment=Sum(
            'amount',
            filter=Q(transaction_type='PAYMENT')
        ),
    )

    total_credit = totals['total_credit'] or Decimal('0.00')
    adjustment_credit = totals['adjustment_credit'] or Decimal('0.00')
    adjustment_debit = totals['adjustment_debit'] or Decimal('0.00')
    total_payment = totals['total_payment'] or Decimal('0.00')

    total_adjustment = adjustment_credit - adjustment_debit

    outstanding = (
        total_credit
        + adjustment_credit
        - adjustment_debit
        - total_payment
    )

    return {
        'vendor_id': vendor_id,
        'total_credit': total_credit,
        'adjustment_credit': adjustment_credit,
        'adjustment_debit': adjustment_debit,
        'total_adjustment': total_adjustment,
        'total_payment': total_payment,
        'outstanding_balance': outstanding,
    }


@transaction.atomic
def record_vendor_payment(
    vendor_id,
    amount,
    payment_method,
    paid_by,
    reference='',
    notes=''
):
    vendor = Vendor.objects.select_for_update().filter(
        id=vendor_id
    ).first()

    if vendor is None:
        raise ValidationError('Vendor does not exist.')

    amount = Decimal(str(amount))

    if amount <= 0:
        raise ValidationError('Payment amount must be greater than zero.')

    balance = get_vendor_balance(vendor.id)

    if amount > balance['outstanding_balance']:
        raise ValidationError(
            'Payment amount cannot exceed outstanding balance.'
        )

    payment = VendorPayment.objects.create(
        vendor=vendor,
        amount=amount,
        payment_method=payment_method,
        reference=reference,
        notes=notes,
        paid_by=paid_by,
    )

    VendorLedger.objects.create(
        vendor=vendor,
        transaction_type=VendorLedger.TransactionType.PAYMENT,
        amount=amount,
        payment=payment,
        created_by=paid_by,
        reference=reference,
        notes=notes or 'Vendor payment recorded.',
    )

    return payment



@transaction.atomic
def create_vendor_adjustment(
    vendor_id,
    amount,
    adjustment_type,
    created_by,
    reference='',
    notes=''
):
    vendor = Vendor.objects.select_for_update().filter(
        id=vendor_id
    ).first()

    if vendor is None:
        raise ValidationError('Vendor does not exist.')

    amount = Decimal(str(amount))

    if amount <= 0:
        raise ValidationError(
            'Adjustment amount must be greater than zero.'
        )

    allowed_types = [
        VendorLedger.TransactionType.ADJUSTMENT_CREDIT,
        VendorLedger.TransactionType.ADJUSTMENT_DEBIT,
    ]

    if adjustment_type not in allowed_types:
        raise ValidationError('Invalid adjustment type.')

    balance = get_vendor_balance(vendor.id)

    if (
        adjustment_type == VendorLedger.TransactionType.ADJUSTMENT_DEBIT
        and amount > balance['outstanding_balance']
    ):
        raise ValidationError(
            'Adjustment debit cannot exceed outstanding balance.'
        )

    ledger_entry = VendorLedger.objects.create(
        vendor=vendor,
        transaction_type=adjustment_type,
        amount=amount,
        created_by=created_by,
        reference=reference,
        notes=notes,
    )

    return ledger_entry
