from rest_framework import serializers


class SalesSummarySerializer(serializers.Serializer):
    total_orders = serializers.IntegerField()
    delivered_orders = serializers.IntegerField()
    cancelled_orders = serializers.IntegerField()
    gross_sales = serializers.DecimalField(max_digits=14, decimal_places=2)
    delivery_revenue = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_discounts = serializers.DecimalField(max_digits=14, decimal_places=2)
    net_sales = serializers.DecimalField(max_digits=14, decimal_places=2)


class DailySalesReportSerializer(serializers.Serializer):
    report_date = serializers.DateField()
    total_orders = serializers.IntegerField()
    delivered_orders = serializers.IntegerField()
    cancelled_orders = serializers.IntegerField()
    gross_sales = serializers.DecimalField(max_digits=14, decimal_places=2)
    delivery_revenue = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_discounts = serializers.DecimalField(max_digits=14, decimal_places=2)
    net_sales = serializers.DecimalField(max_digits=14, decimal_places=2)


class MonthlySalesReportSerializer(serializers.Serializer):
    report_month = serializers.CharField()
    total_orders = serializers.IntegerField()
    delivered_orders = serializers.IntegerField()
    cancelled_orders = serializers.IntegerField()
    gross_sales = serializers.DecimalField(max_digits=14, decimal_places=2)
    delivery_revenue = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_discounts = serializers.DecimalField(max_digits=14, decimal_places=2)
    net_sales = serializers.DecimalField(max_digits=14, decimal_places=2)


class ProductSalesReportSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    product_name = serializers.CharField()
    product_sku = serializers.CharField()
    total_quantity = serializers.IntegerField()
    total_orders = serializers.IntegerField()
    gross_sales = serializers.DecimalField(max_digits=14, decimal_places=2)
    estimated_cost = serializers.DecimalField(max_digits=14, decimal_places=2)
    estimated_gross_profit = serializers.DecimalField(max_digits=14, decimal_places=2)


class VendorPurchaseReportSerializer(serializers.Serializer):
    vendor_id = serializers.IntegerField()
    vendor__name = serializers.CharField()
    total_purchase_orders = serializers.IntegerField()
    received_purchase_orders = serializers.IntegerField()
    pending_purchase_orders = serializers.IntegerField()
    total_purchase_quantity = serializers.IntegerField()
    total_received_quantity = serializers.IntegerField()
    total_purchase_value = serializers.DecimalField(max_digits=14, decimal_places=2)


class InventoryReportSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    product_name = serializers.CharField()
    product_sku = serializers.CharField()
    vendor_name = serializers.CharField()

    available_quantity = serializers.IntegerField()
    reserved_quantity = serializers.IntegerField()
    sellable_quantity = serializers.IntegerField()
    reorder_level = serializers.IntegerField()

    is_low_stock = serializers.BooleanField()
    is_out_of_stock = serializers.BooleanField()


class DeliveryPerformanceReportSerializer(serializers.Serializer):
    total_deliveries = serializers.IntegerField()
    delivered_deliveries = serializers.IntegerField()
    failed_deliveries = serializers.IntegerField()

    assigned_deliveries = serializers.IntegerField()
    picked_up_deliveries = serializers.IntegerField()
    in_transit_deliveries = serializers.IntegerField()

    delivery_success_rate = serializers.FloatField()
