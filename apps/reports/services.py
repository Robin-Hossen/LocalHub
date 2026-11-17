from decimal import Decimal

from django.db.models import Count, Sum, Q
from django.utils import timezone
from django.db.models.functions import TruncDate, TruncMonth

from apps.orders.models import Order, OrderItem
from apps.procurement.models import PurchaseOrder, PurchaseOrderItem
from apps.inventory.models import Stock
from apps.delivery.models import Delivery


def get_sales_summary(start_date=None, end_date=None):

    orders = Order.objects.all()

    if start_date:
        orders = orders.filter(created_at__date__gte=start_date)

    if end_date:
        orders = orders.filter(created_at__date__lte=end_date)

    summary = orders.aggregate(
        total_orders=Count('id'),

        delivered_orders=Count(
            'id',
            filter=Q(status=Order.Status.DELIVERED)
        ),

        cancelled_orders=Count(
            'id',
            filter=Q(status=Order.Status.CANCELLED)
        ),

        gross_sales=Sum(
            'subtotal',
            filter=Q(status=Order.Status.DELIVERED)
        ),

        delivery_revenue=Sum(
            'delivery_fee',
            filter=Q(status=Order.Status.DELIVERED)
        ),

        total_discounts=Sum(
            'discount',
            filter=Q(status=Order.Status.DELIVERED)
        ),
    )

    gross_sales = summary['gross_sales'] or Decimal('0.00')
    delivery_revenue = summary['delivery_revenue'] or Decimal('0.00')
    total_discounts = summary['total_discounts'] or Decimal('0.00')

    summary['gross_sales'] = gross_sales
    summary['delivery_revenue'] = delivery_revenue
    summary['total_discounts'] = total_discounts

    summary['net_sales'] = (
        gross_sales + delivery_revenue - total_discounts
    )

    return summary


def get_daily_sales_report(start_date=None, end_date=None):

    orders = Order.objects.all()

    if start_date:
        orders = orders.filter(created_at__date__gte=start_date)

    if end_date:
        orders = orders.filter(created_at__date__lte=end_date)

    daily_reports = (
        orders
        .annotate(
            report_date=TruncDate(
                'created_at',
                tzinfo=timezone.get_current_timezone()
            )
        )
        .values('report_date')
        .annotate(
            total_orders=Count('id'),

            delivered_orders=Count(
                'id',
                filter=Q(status=Order.Status.DELIVERED)
            ),

            cancelled_orders=Count(
                'id',
                filter=Q(status=Order.Status.CANCELLED)
            ),

            gross_sales=Sum(
                'subtotal',
                filter=Q(status=Order.Status.DELIVERED)
            ),

            delivery_revenue=Sum(
                'delivery_fee',
                filter=Q(status=Order.Status.DELIVERED)
            ),

            total_discounts=Sum(
                'discount',
                filter=Q(status=Order.Status.DELIVERED)
            ),
        )
        .order_by('report_date')
    )

    results = []

    for report in daily_reports:

        gross_sales = report['gross_sales'] or Decimal('0.00')
        delivery_revenue = report['delivery_revenue'] or Decimal('0.00')
        total_discounts = report['total_discounts'] or Decimal('0.00')

        report['gross_sales'] = gross_sales
        report['delivery_revenue'] = delivery_revenue
        report['total_discounts'] = total_discounts

        report['net_sales'] = (
            gross_sales + delivery_revenue - total_discounts
        )

        results.append(report)

    return results


def get_monthly_sales_report(start_date=None, end_date=None):

    orders = Order.objects.all()

    if start_date:
        orders = orders.filter(created_at__date__gte=start_date)

    if end_date:
        orders = orders.filter(created_at__date__lte=end_date)

    monthly_reports = (
        orders
        .annotate(
            report_month=TruncMonth(
                'created_at',
                tzinfo=timezone.get_current_timezone()
            )
        )
        .values('report_month')
        .annotate(
            total_orders=Count('id'),

            delivered_orders=Count(
                'id',
                filter=Q(status=Order.Status.DELIVERED)
            ),

            cancelled_orders=Count(
                'id',
                filter=Q(status=Order.Status.CANCELLED)
            ),

            gross_sales=Sum(
                'subtotal',
                filter=Q(status=Order.Status.DELIVERED)
            ),

            delivery_revenue=Sum(
                'delivery_fee',
                filter=Q(status=Order.Status.DELIVERED)
            ),

            total_discounts=Sum(
                'discount',
                filter=Q(status=Order.Status.DELIVERED)
            ),
        )
        .order_by('report_month')
    )

    results = []

    for report in monthly_reports:

        gross_sales = report['gross_sales'] or Decimal('0.00')
        delivery_revenue = report['delivery_revenue'] or Decimal('0.00')
        total_discounts = report['total_discounts'] or Decimal('0.00')

        report['gross_sales'] = gross_sales
        report['delivery_revenue'] = delivery_revenue
        report['total_discounts'] = total_discounts

        report['net_sales'] = (
            gross_sales + delivery_revenue - total_discounts
        )

        report['report_month'] = (
            report['report_month'].strftime('%Y-%m')
        )

        results.append(report)

    return results


def get_product_sales_report(start_date=None, end_date=None):

    items = OrderItem.objects.filter(
        order__status=Order.Status.DELIVERED
    )

    if start_date:
        items = items.filter(
            order__created_at__date__gte=start_date
        )

    if end_date:
        items = items.filter(
            order__created_at__date__lte=end_date
        )

    product_reports = (
        items
        .values(
            'product_id',
            'product_name',
            'product_sku'
        )
        .annotate(
            total_quantity=Sum('quantity'),

            total_orders=Count(
                'order',
                distinct=True
            ),

            gross_sales=Sum('line_total'),

            estimated_cost=Sum('line_estimated_cost'),
        )
        .order_by('-gross_sales')
    )

    results = []

    for report in product_reports:

        gross_sales = report['gross_sales'] or Decimal('0.00')
        estimated_cost = report['estimated_cost'] or Decimal('0.00')

        report['gross_sales'] = gross_sales
        report['estimated_cost'] = estimated_cost

        report['estimated_gross_profit'] = (
            gross_sales - estimated_cost
        )

        results.append(report)

    return results


def get_vendor_purchase_report(start_date=None, end_date=None):

    purchase_orders = PurchaseOrder.objects.exclude(
        status=PurchaseOrder.Status.CANCELLED
    )

    if start_date:
        purchase_orders = purchase_orders.filter(
            created_at__date__gte=start_date
        )

    if end_date:
        purchase_orders = purchase_orders.filter(
            created_at__date__lte=end_date
        )

    vendor_reports = (
        purchase_orders
        .values('vendor_id', 'vendor__name')
        .annotate(
            total_purchase_orders=Count('id'),

            received_purchase_orders=Count(
                'id',
                filter=Q(status=PurchaseOrder.Status.RECEIVED)
            ),

            pending_purchase_orders=Count(
                'id',
                filter=Q(status__in=[
                    PurchaseOrder.Status.DRAFT,
                    PurchaseOrder.Status.CONFIRMED,
                    PurchaseOrder.Status.PARTIALLY_RECEIVED,
                ])
            ),

            total_purchase_value=Sum('subtotal'),
        )
        .order_by('-total_purchase_value')
    )

    # Calculate quantities separately to avoid duplicate
    # purchase value caused by joining multiple order items.
    items = PurchaseOrderItem.objects.filter(
        purchase_order__in=purchase_orders
    )

    quantity_reports = (
        items
        .values('purchase_order__vendor_id')
        .annotate(
            total_purchase_quantity=Sum('quantity'),
            total_received_quantity=Sum('received_quantity'),
        )
    )

    quantity_map = {
        item['purchase_order__vendor_id']: item
        for item in quantity_reports
    }

    results = []

    for report in vendor_reports:
        quantities = quantity_map.get(report['vendor_id'], {})

        report['total_purchase_quantity'] = (
            quantities.get('total_purchase_quantity') or 0
        )

        report['total_received_quantity'] = (
            quantities.get('total_received_quantity') or 0
        )

        report['total_purchase_value'] = (
            report['total_purchase_value'] or Decimal('0.00')
        )

        results.append(report)

    return results


def get_inventory_report():
    stocks = (
        Stock.objects.select_related("product", "product__vendor")
        .filter(product__is_active=True)
        .order_by("available_quantity", "product__name")
    )

    results = []

    for stock in stocks:
        sellable_quantity = stock.available_quantity - stock.reserved_quantity

        results.append(
            {
                "product_id": stock.product_id,
                "product_name": stock.product.name,
                "product_sku": stock.product.sku,
                "vendor_name": stock.product.vendor.name,
                "available_quantity": stock.available_quantity,
                "reserved_quantity": stock.reserved_quantity,
                "sellable_quantity": sellable_quantity,
                "reorder_level": stock.reorder_level,
                "is_low_stock": (sellable_quantity <= stock.reorder_level),
                "is_out_of_stock": sellable_quantity == 0,
            }
        )

    return results


def get_delivery_performance_report(start_date=None, end_date=None):
    deliveries = Delivery.objects.all()

    if start_date:
        deliveries = deliveries.filter(created_at__date__gte=start_date)

    if end_date:
        deliveries = deliveries.filter(created_at__date__lte=end_date)

    summary = deliveries.aggregate(
        total_deliveries=Count("id"),
        delivered_deliveries=Count("id", filter=Q(status=Delivery.Status.DELIVERED)),
        failed_deliveries=Count("id", filter=Q(status=Delivery.Status.FAILED)),
        assigned_deliveries=Count("id", filter=Q(status=Delivery.Status.ASSIGNED)),
        picked_up_deliveries=Count("id", filter=Q(status=Delivery.Status.PICKED_UP)),
        in_transit_deliveries=Count("id", filter=Q(status=Delivery.Status.IN_TRANSIT)),
    )

    total = summary["total_deliveries"]
    delivered = summary["delivered_deliveries"]

    summary["delivery_success_rate"] = (
        round((delivered / total) * 100, 2) if total else 0
    )

    return summary
