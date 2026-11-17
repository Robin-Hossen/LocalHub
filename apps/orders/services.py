from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.orders.models import Order, OrderItem
from apps.catalog.models import Product
from apps.locations.models import CustomerAddress, DeliveryCharge
from apps.inventory.models import Stock
from apps.inventory.services import reserve_stock
from apps.orders.utils import generate_order_number
from apps.inventory.services import release_stock


from apps.inventory.services import consume_reserved_stock
from apps.audit_logs.models import AuditLog
from apps.audit_logs.services import create_audit_log


def calculate_order_subtotal(items):
    subtotal = Decimal('0.00')

    for item in items:
        subtotal += item['unit_selling_price'] * item['quantity']

    return subtotal


@transaction.atomic
def create_order(customer, address_id, items_data, notes=''):

    if not items_data:
        raise ValidationError('Order must contain at least one product.')

    # 1. Validate customer address
    try:
        address = CustomerAddress.objects.select_related(
            'area'
        ).get(
            id=address_id,
            customer=customer
        )
    except CustomerAddress.DoesNotExist:
        raise ValidationError('Invalid delivery address.')

    # 2. Validate products and quantities
    product_ids = [item['product_id'] for item in items_data]

    if len(product_ids) != len(set(product_ids)):
        raise ValidationError('Duplicate products are not allowed.')

    products = Product.objects.filter(
        id__in=product_ids,
        is_active=True,
        is_available=True,
        vendor__is_active=True,
        category__is_active=True
    ).select_related('vendor').order_by('id')

    product_map = {product.id: product for product in products}

    if len(product_map) != len(product_ids):
        raise ValidationError('One or more products are unavailable.')

    # 3. Validate same vendor
    vendors = {product.vendor_id for product in product_map.values()}

    if len(vendors) != 1:
        raise ValidationError(
            'Products from different vendors cannot be ordered together.'
        )

    vendor = next(iter(product_map.values())).vendor

    # 4. Validate quantities
    order_items = []

    for item in items_data:
        product = product_map[item['product_id']]
        quantity = item['quantity']

        if isinstance(quantity, bool) or not isinstance(quantity, int) or quantity <= 0:
            raise ValidationError('Product quantity must be a positive integer.')

        order_items.append({
            'product': product,
            'quantity': quantity,
            'unit_selling_price': product.selling_price,
            'unit_estimated_cost': product.cost_price,
        })

    # 5. Lock stock rows and validate availability
    stock_map = {
        stock.product_id: stock
        for stock in Stock.objects.select_for_update().filter(
            product_id__in=product_ids
        ).order_by('product_id')
    }

    for item in order_items:
        product = item['product']
        quantity = item['quantity']

        stock = stock_map.get(product.id)

        if stock is None:
            raise ValidationError(
                f'Stock record missing for {product.name}.'
            )

        sellable_quantity = (
            stock.available_quantity - stock.reserved_quantity
        )

        if quantity > sellable_quantity:
            raise ValidationError(
                f'Insufficient stock for {product.name}. '
                f'Available: {sellable_quantity}.'
            )

    # 6. Calculate subtotal
    subtotal = calculate_order_subtotal(order_items)

    # 7. Calculate delivery fee
    try:
        delivery_charge = DeliveryCharge.objects.select_for_update().get(
            area=address.area,
            is_active=True
        )
    except DeliveryCharge.DoesNotExist:
        raise ValidationError('Delivery service is unavailable for this area.')

    if (
        delivery_charge.minimum_order_amount is not None
        and subtotal < delivery_charge.minimum_order_amount
    ):
        raise ValidationError('Minimum order amount not reached.')

    delivery_fee = delivery_charge.fee
    discount = Decimal('0.00')
    total_amount = subtotal + delivery_fee - discount

    # 8. Create order
    order = Order.objects.create(
        order_number=generate_order_number(),
        customer=customer,
        vendor=vendor,
        delivery_address=address,
        recipient_name=address.recipient_name,
        recipient_phone=address.phone,
        delivery_area_name=address.area.name,
        delivery_address_line=address.address_line,
        delivery_landmark=address.landmark,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        discount=discount,
        total_amount=total_amount,
        notes=notes
    )

    # 9. Create order items and reserve stock
    for item in order_items:

        product = item['product']
        quantity = item['quantity']

        order_item = OrderItem.objects.create(
            order=order,
            product=product,
            product_name=product.name,
            product_sku=product.sku,
            quantity=quantity,
            reserved_quantity=quantity,
            unit_selling_price=item['unit_selling_price'],
            unit_estimated_cost=item['unit_estimated_cost'],
            line_total=item['unit_selling_price'] * quantity,
            line_estimated_cost=item['unit_estimated_cost'] * quantity
        )

        reserve_stock(
            product=product,
            quantity=quantity,
            created_by=customer,
            reference=order.order_number,
            notes=f'Reservation for order {order.order_number}'
        )

    return order

@transaction.atomic
def cancel_order(order_id, cancelled_by):
    order = Order.objects.select_for_update().get(
        id=order_id
    )

    if order.status != Order.Status.PENDING:
        raise ValidationError(
            'Only pending orders can be cancelled.'
        )

    order_items = OrderItem.objects.select_for_update().filter(
        order=order,
        reserved_quantity__gt=0
    ).select_related('product').order_by('id')

    for item in order_items:
        quantity_to_release = item.reserved_quantity

        release_stock(
            product=item.product,
            quantity=quantity_to_release,
            created_by=cancelled_by,
            reference=order.order_number,
            notes=f'Order cancelled: {order.order_number}'
        )

        item.reserved_quantity = 0
        item.save(update_fields=['reserved_quantity'])

    order.status = Order.Status.CANCELLED
    order.save(update_fields=['status', 'updated_at'])

    return order




@transaction.atomic
def mark_order_delivered(order_id, performed_by, ip_address=None):

    order = Order.objects.select_for_update().get(
        id=order_id
    )

    if order.status != Order.Status.SHIPPED:
        raise ValidationError(
            'Only shipped orders can be marked as delivered.'
        )

    old_status = order.status

    order_items = OrderItem.objects.select_for_update().filter(
        order=order,
        reserved_quantity__gt=0
    ).select_related('product').order_by('id')

    for item in order_items:
        quantity = item.reserved_quantity

        consume_reserved_stock(
            product=item.product,
            quantity=quantity,
            created_by=performed_by,
            reference=order.order_number,
            notes=f'Order delivered: {order.order_number}'
        )

        item.reserved_quantity = 0
        item.save(update_fields=['reserved_quantity'])

    order.status = Order.Status.DELIVERED
    order.save(update_fields=['status', 'updated_at'])

    create_audit_log(
        user=performed_by,
        action=AuditLog.Action.STATUS_CHANGE,
        model_name=order._meta.label,
        object_id=order.pk,
        description=(
            f'Order {order.order_number} status changed '
            f'from {old_status} to DELIVERED'
        ),
        old_values={
            'status': old_status,
        },
        new_values={
            'status': Order.Status.DELIVERED,
        },
        ip_address=ip_address,
    )

    return order
