
from decimal import Decimal

from django.db.models import Count, Sum, Q,F
from django.utils import timezone

from apps.orders.models import Order


from apps.catalog.models import Product
from apps.inventory.models import Stock
from apps.accounts.models import User
from apps.procurement.models import PurchaseOrder
from apps.vendors.models import Vendor
from apps.vendor_accounts.models import VendorLedger
from apps.cod.models import CODCollection


def get_order_dashboard_summary():

    summary = Order.objects.aggregate(
        total_orders=Count('id'),

        pending_orders=Count(
            'id',
            filter=Q(status=Order.Status.PENDING)
        ),

        confirmed_orders=Count(
            'id',
            filter=Q(status=Order.Status.CONFIRMED)
        ),

        processing_orders=Count(
            'id',
            filter=Q(status=Order.Status.PROCESSING)
        ),

        shipped_orders=Count(
            'id',
            filter=Q(status=Order.Status.SHIPPED)
        ),

        delivered_orders=Count(
            'id',
            filter=Q(status=Order.Status.DELIVERED)
        ),

        cancelled_orders=Count(
            'id',
            filter=Q(status=Order.Status.CANCELLED)
        ),

        total_order_value=Sum('total_amount'),

        delivered_sales=Sum(
            'total_amount',
            filter=Q(status=Order.Status.DELIVERED)
        ),
    )

    summary['total_order_value'] = (
        summary['total_order_value'] or Decimal('0.00')
    )

    summary['delivered_sales'] = (
        summary['delivered_sales'] or Decimal('0.00')
    )

    return summary




def get_inventory_dashboard_summary():

    total_products = Product.objects.filter(
        is_active=True
    ).count()

    stock_summary = Stock.objects.filter(
        product__is_active=True
    ).aggregate(
        total_available_quantity=Sum('available_quantity'),

        total_reserved_quantity=Sum('reserved_quantity'),

        total_sellable_quantity=Sum(
            F('available_quantity') - F('reserved_quantity')
        ),

        sellable_products=Count(
            'id',
            filter=Q(
                available_quantity__gt=F('reserved_quantity')
            )
        ),

        low_stock_products=Count(
            'id',
            filter=(
                Q(available_quantity__gt=F('reserved_quantity'))
                & Q(
                    available_quantity__lte=(
                        F('reserved_quantity') + F('reorder_level')
                    )
                )
            )
        ),

        out_of_stock_products=Count(
            'id',
            filter=Q(
                available_quantity=F('reserved_quantity')
            )
        ),
    )

    return {
        'total_products': total_products,
        'total_available_quantity': (
            stock_summary['total_available_quantity'] or 0
        ),
        'total_reserved_quantity': (
            stock_summary['total_reserved_quantity'] or 0
        ),
        'total_sellable_quantity': (
            stock_summary['total_sellable_quantity'] or 0
        ),
        'sellable_products': stock_summary['sellable_products'],
        'low_stock_products': stock_summary['low_stock_products'],
        'out_of_stock_products': stock_summary['out_of_stock_products'],
    }





def get_customer_dashboard_summary():
    today = timezone.localdate()

    customers = User.objects.filter(
        role=User.Role.CUSTOMER
    )

    return {
        'total_customers': customers.count(),

        'active_customers': customers.filter(
            is_active=True
        ).count(),

        'new_customers_today': customers.filter(
            date_joined__date=today
        ).count(),
    }


def get_procurement_dashboard_summary():

    summary = PurchaseOrder.objects.aggregate(
        total_purchase_orders=Count('id'),

        draft_orders=Count(
            'id',
            filter=Q(status=PurchaseOrder.Status.DRAFT)
        ),

        confirmed_orders=Count(
            'id',
            filter=Q(status=PurchaseOrder.Status.CONFIRMED)
        ),

        partially_received_orders=Count(
            'id',
            filter=Q(status=PurchaseOrder.Status.PARTIALLY_RECEIVED)
        ),

        received_orders=Count(
            'id',
            filter=Q(status=PurchaseOrder.Status.RECEIVED)
        ),

        cancelled_orders=Count(
            'id',
            filter=Q(status=PurchaseOrder.Status.CANCELLED)
        ),

        total_purchase_value=Sum('subtotal')
    )

    summary['total_purchase_value'] = (
        summary['total_purchase_value'] or Decimal('0.00')
    )

    return summary


def get_vendor_dashboard_summary():

    vendor_summary = Vendor.objects.aggregate(
        total_vendors=Count('id'),
        active_vendors=Count(
            'id',
            filter=Q(is_active=True)
        ),
        inactive_vendors=Count(
            'id',
            filter=Q(is_active=False)
        )
    )

    ledger_summaries = VendorLedger.objects.values(
        'vendor_id'
    ).annotate(
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
        )
    )

    total_outstanding = Decimal('0.00')
    vendors_with_outstanding = 0

    for ledger in ledger_summaries:

        outstanding = (
            (ledger['total_credit'] or Decimal('0.00'))
            + (ledger['adjustment_credit'] or Decimal('0.00'))
            - (ledger['adjustment_debit'] or Decimal('0.00'))
            - (ledger['total_payment'] or Decimal('0.00'))
        )

        if outstanding > 0:
            total_outstanding += outstanding
            vendors_with_outstanding += 1

    return {
        **vendor_summary,
        'vendors_with_outstanding': vendors_with_outstanding,
        'total_outstanding_balance': total_outstanding
    }


def get_cod_dashboard_summary():

    today = timezone.localdate()

    summary = CODCollection.objects.aggregate(
        total_cod_collections=Count('id'),

        total_amount_collected=Sum('amount_collected'),

        today_collections=Count(
            'id',
            filter=Q(collected_at__date=today)
        ),

        today_amount_collected=Sum(
            'amount_collected',
            filter=Q(collected_at__date=today)
        )
    )

    summary['total_amount_collected'] = (
        summary['total_amount_collected'] or Decimal('0.00')
    )

    summary['today_amount_collected'] = (
        summary['today_amount_collected'] or Decimal('0.00')
    )

    return summary


def get_dashboard_overview():

    return {
        'orders': get_order_dashboard_summary(),

        'inventory': get_inventory_dashboard_summary(),

        'customers': get_customer_dashboard_summary(),

        'procurement': get_procurement_dashboard_summary(),

        'vendors': get_vendor_dashboard_summary(),

        'cod': get_cod_dashboard_summary(),
    }