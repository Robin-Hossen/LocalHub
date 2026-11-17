from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from django.db.models import F

from apps.vendors.models import Vendor
from apps.catalog.models import Product
from apps.procurement.utils import generate_purchase_number

from apps.inventory.services import add_stock
from apps.vendor_accounts.services import create_purchase_credit

from apps.procurement.models import (
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseReceipt,
    PurchaseReceiptItem,
)


@transaction.atomic
def create_purchase_order(
    vendor_id,
    items_data,
    created_by,
    notes=''
):

    if not items_data:
        raise ValidationError('Purchase order must contain at least one item.')

    vendor = Vendor.objects.select_for_update().filter(
        id=vendor_id,
        is_active=True
    ).first()

    if vendor is None:
        raise ValidationError('Invalid or inactive vendor.')

    product_ids = [item['product_id'] for item in items_data]

    if len(product_ids) != len(set(product_ids)):
        raise ValidationError('Duplicate products are not allowed.')

    products = Product.objects.select_for_update().filter(
        id__in=product_ids,
        vendor=vendor,
        is_active=True
    ).order_by('id')

    product_map = {product.id: product for product in products}

    if len(product_map) != len(product_ids):
        raise ValidationError(
            'One or more products are invalid or do not belong to this vendor.'
        )

    prepared_items = []
    subtotal = Decimal('0.00')

    for item in items_data:

        product = product_map[item['product_id']]
        quantity = item['quantity']
        unit_cost = Decimal(str(item['unit_cost']))

        if isinstance(quantity, bool) or not isinstance(quantity, int) or quantity < 1:
            raise ValidationError('Quantity must be a positive integer.')

        if unit_cost <= 0:
            raise ValidationError('Unit cost must be greater than zero.')

        line_total = unit_cost * quantity
        subtotal += line_total

        prepared_items.append({
            'product': product,
            'product_name': product.name,
            'product_sku': product.sku,
            'quantity': quantity,
            'unit_cost': unit_cost,
            'line_total': line_total,
        })

    purchase_order = PurchaseOrder.objects.create(
        purchase_number=generate_purchase_number(),
        vendor=vendor,
        created_by=created_by,
        subtotal=subtotal,
        notes=notes,
    )

    PurchaseOrderItem.objects.bulk_create([
        PurchaseOrderItem(
            purchase_order=purchase_order,
            **item
        )
        for item in prepared_items
    ])

    return purchase_order

@transaction.atomic
def confirm_purchase_order(purchase_order_id):

    purchase_order = PurchaseOrder.objects.select_for_update().filter(
        id=purchase_order_id
    ).first()

    if purchase_order is None:
        raise ValidationError('Purchase order not found.')

    if purchase_order.status != PurchaseOrder.Status.DRAFT:
        raise ValidationError(
            'Only draft purchase orders can be confirmed.'
        )

    purchase_order.status = PurchaseOrder.Status.CONFIRMED
    purchase_order.confirmed_at = timezone.now()

    purchase_order.save(
        update_fields=[
            'status',
            'confirmed_at',
            'updated_at',
        ]
    )

    return purchase_order


@transaction.atomic
def receive_purchase_order(
    purchase_order_id,
    items_data,
    received_by,
    notes=''
):
    if not items_data:
        raise ValidationError(
            'At least one item is required for receiving.'
        )

    purchase_order = PurchaseOrder.objects.select_for_update().filter(
        id=purchase_order_id
    ).first()

    if purchase_order is None:
        raise ValidationError('Purchase order not found.')

    if purchase_order.status not in [
        PurchaseOrder.Status.CONFIRMED,
        PurchaseOrder.Status.PARTIALLY_RECEIVED,
    ]:
        raise ValidationError(
            'Only confirmed or partially received purchase orders can receive goods.'
        )

    item_ids = [
        item['purchase_order_item_id']
        for item in items_data
    ]

    if len(item_ids) != len(set(item_ids)):
        raise ValidationError(
            'Duplicate purchase order items are not allowed.'
        )

    order_items = PurchaseOrderItem.objects.select_for_update().filter(
        purchase_order=purchase_order,
        id__in=item_ids
    )

    item_map = {
        item.id: item
        for item in order_items
    }

    if len(item_map) != len(item_ids):
        raise ValidationError(
            'One or more items do not belong to this purchase order.'
        )

    prepared_items = []

    for item_data in items_data:
        order_item = item_map[item_data['purchase_order_item_id']]
        quantity = item_data['quantity']

        if (
            isinstance(quantity, bool)
            or not isinstance(quantity, int)
            or quantity < 1
        ):
            raise ValidationError(
                'Receiving quantity must be a positive integer.'
            )

        remaining_quantity = (
            order_item.quantity - order_item.received_quantity
        )

        if quantity > remaining_quantity:
            raise ValidationError(
                f'Cannot receive more than the remaining quantity '
                f'for {order_item.product_name}. '
                f'Remaining: {remaining_quantity}.'
            )

        prepared_items.append({
            'order_item': order_item,
            'quantity': quantity,
            'unit_cost': order_item.unit_cost,
            'line_total': order_item.unit_cost * quantity,
        })

    receipt = PurchaseReceipt.objects.create(
        purchase_order=purchase_order,
        received_by=received_by,
        notes=notes,
    )

    for item in prepared_items:
        order_item = item['order_item']
        quantity = item['quantity']

        PurchaseReceiptItem.objects.create(
            receipt=receipt,
            purchase_order_item=order_item,
            quantity=quantity,
            unit_cost=item['unit_cost'],
            line_total=item['line_total'],
        )

        add_stock(
            product=order_item.product,
            quantity=quantity,
            movement_type='PURCHASE',
            created_by=received_by,
            reference=purchase_order.purchase_number,
            notes=f'Goods received against {purchase_order.purchase_number}',
        )

        order_item.received_quantity += quantity
        order_item.save(update_fields=['received_quantity'])

    all_items_received = not PurchaseOrderItem.objects.filter(
        purchase_order=purchase_order,
        received_quantity__lt=F('quantity')
    ).exists()

    if all_items_received:
        purchase_order.status = PurchaseOrder.Status.RECEIVED
    else:
        purchase_order.status = PurchaseOrder.Status.PARTIALLY_RECEIVED

    purchase_order.save(
        update_fields=['status', 'updated_at']
    )

# Create vendor credit only after full goods receiving
    if purchase_order.status == PurchaseOrder.Status.RECEIVED:
        create_purchase_credit(
            purchase_order_id=purchase_order.id,
            created_by=received_by
        )

    return receipt



@transaction.atomic
def update_purchase_order(
    purchase_order_id,
    vendor_id,
    items_data,
    notes=''
):
    purchase_order = PurchaseOrder.objects.select_for_update().filter(
        id=purchase_order_id
    ).first()

    if purchase_order is None:
        raise ValidationError('Purchase order not found.')

    if purchase_order.status != PurchaseOrder.Status.DRAFT:
        raise ValidationError(
            'Only draft purchase orders can be updated.'
        )

    if not items_data:
        raise ValidationError(
            'Purchase order must contain at least one item.'
        )

    vendor = Vendor.objects.select_for_update().filter(
        id=vendor_id,
        is_active=True
    ).first()

    if vendor is None:
        raise ValidationError('Invalid or inactive vendor.')

    product_ids = [item['product_id'] for item in items_data]

    if len(product_ids) != len(set(product_ids)):
        raise ValidationError('Duplicate products are not allowed.')

    products = Product.objects.select_for_update().filter(
        id__in=product_ids,
        vendor=vendor,
        is_active=True
    ).order_by('id')

    product_map = {product.id: product for product in products}

    if len(product_map) != len(product_ids):
        raise ValidationError(
            'One or more products are invalid or do not belong to this vendor.'
        )

    prepared_items = []
    subtotal = Decimal('0.00')

    for item in items_data:
        product = product_map[item['product_id']]
        quantity = item['quantity']
        unit_cost = Decimal(str(item['unit_cost']))

        if quantity < 1:
            raise ValidationError(
                'Quantity must be a positive integer.'
            )

        if unit_cost <= 0:
            raise ValidationError(
                'Unit cost must be greater than zero.'
            )

        line_total = unit_cost * quantity
        subtotal += line_total

        prepared_items.append(
            PurchaseOrderItem(
                purchase_order=purchase_order,
                product=product,
                product_name=product.name,
                product_sku=product.sku,
                quantity=quantity,
                unit_cost=unit_cost,
                line_total=line_total,
            )
        )

    purchase_order.vendor = vendor
    purchase_order.notes = notes
    purchase_order.subtotal = subtotal

    purchase_order.save(
        update_fields=[
            'vendor',
            'notes',
            'subtotal',
            'updated_at',
        ]
    )

    purchase_order.items.all().delete()

    PurchaseOrderItem.objects.bulk_create(prepared_items)

    return purchase_order
