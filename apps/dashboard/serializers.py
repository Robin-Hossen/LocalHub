from rest_framework import serializers


class OrderDashboardSummarySerializer(serializers.Serializer):
    total_orders = serializers.IntegerField()
    pending_orders = serializers.IntegerField()
    confirmed_orders = serializers.IntegerField()
    processing_orders = serializers.IntegerField()
    shipped_orders = serializers.IntegerField()
    delivered_orders = serializers.IntegerField()
    cancelled_orders = serializers.IntegerField()

    total_order_value = serializers.DecimalField(
        max_digits=14,
        decimal_places=2
    )

    delivered_sales = serializers.DecimalField(
        max_digits=14,
        decimal_places=2
    )


class InventoryDashboardSummarySerializer(serializers.Serializer):

    total_products = serializers.IntegerField()

    total_available_quantity = serializers.IntegerField()

    total_reserved_quantity = serializers.IntegerField()

    total_sellable_quantity = serializers.IntegerField()

    sellable_products = serializers.IntegerField()

    low_stock_products = serializers.IntegerField()

    out_of_stock_products = serializers.IntegerField()


class CustomerDashboardSummarySerializer(serializers.Serializer):
    total_customers = serializers.IntegerField()
    active_customers = serializers.IntegerField()
    new_customers_today = serializers.IntegerField()


class ProcurementDashboardSummarySerializer(serializers.Serializer):
    total_purchase_orders = serializers.IntegerField()
    draft_orders = serializers.IntegerField()
    confirmed_orders = serializers.IntegerField()
    partially_received_orders = serializers.IntegerField()
    received_orders = serializers.IntegerField()
    cancelled_orders = serializers.IntegerField()
    total_purchase_value = serializers.DecimalField(
        max_digits=14,
        decimal_places=2
    )


class VendorDashboardSummarySerializer(serializers.Serializer):
    total_vendors = serializers.IntegerField()
    active_vendors = serializers.IntegerField()
    inactive_vendors = serializers.IntegerField()
    vendors_with_outstanding = serializers.IntegerField()
    total_outstanding_balance = serializers.DecimalField(
        max_digits=14,
        decimal_places=2
    )


class CODDashboardSummarySerializer(serializers.Serializer):
    total_cod_collections = serializers.IntegerField()
    total_amount_collected = serializers.DecimalField(
        max_digits=14,
        decimal_places=2
    )
    today_collections = serializers.IntegerField()
    today_amount_collected = serializers.DecimalField(
        max_digits=14,
        decimal_places=2
    )

class DashboardOverviewSerializer(serializers.Serializer):
    orders = OrderDashboardSummarySerializer()
    inventory = InventoryDashboardSummarySerializer()
    customers = CustomerDashboardSummarySerializer()
    procurement = ProcurementDashboardSummarySerializer()
    vendors = VendorDashboardSummarySerializer()
    cod = CODDashboardSummarySerializer()    
