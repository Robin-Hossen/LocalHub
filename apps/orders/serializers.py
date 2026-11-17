from rest_framework import serializers
from apps.orders.models import Order, OrderItem

from decimal import Decimal

from apps.orders.models import Order
class OrderItemInputSerializer(serializers.Serializer):

    product_id = serializers.IntegerField(min_value=1)

    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):

    address_id = serializers.IntegerField(min_value=1)

    items = OrderItemInputSerializer(many=True)

    notes = serializers.CharField(
        required=False,
        allow_blank=True
    )

    def validate_items(self, value):

        if not value:
            raise serializers.ValidationError(
                'Order must contain at least one product.'
            )

        product_ids = [item['product_id'] for item in value]

        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError(
                'Duplicate products are not allowed.'
            )

        return value





class OrderItemResponseSerializer(serializers.ModelSerializer):

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product',
            'product_name',
            'product_sku',
            'quantity',
            'unit_selling_price',
            'line_total',
        ]
        read_only_fields = fields


class CustomerOrderSerializer(serializers.ModelSerializer):

    items = OrderItemResponseSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'status',
            'payment_method',
            'payment_status',
            'recipient_name',
            'recipient_phone',
            'delivery_area_name',
            'delivery_address_line',
            'delivery_landmark',
            'subtotal',
            'delivery_fee',
            'discount',
            'total_amount',
            'notes',
            'items',
            'created_at',
        ]
        read_only_fields = fields


class StaffOrderItemSerializer(serializers.ModelSerializer):

    estimated_profit = serializers.SerializerMethodField()

    def get_estimated_profit(self, obj)->Decimal:
        return obj.line_total - obj.line_estimated_cost

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product',
            'product_name',
            'product_sku',
            'quantity',
            'unit_selling_price',
            'unit_estimated_cost',
            'line_total',
            'line_estimated_cost',
            'estimated_profit',
            'reserved_quantity',
        ]
        read_only_fields = fields


class StaffOrderSerializer(serializers.ModelSerializer):

    items = StaffOrderItemSerializer(many=True, read_only=True)
    vendor_name = serializers.CharField(
        source='vendor.name',
        read_only=True
    )

    estimated_cost_total = serializers.SerializerMethodField()
    estimated_profit = serializers.SerializerMethodField()

    def get_estimated_cost_total(self, obj)->Decimal:
        return sum(
            (item.line_estimated_cost for item in obj.items.all()),
            start=0
        )

    def get_estimated_profit(self, obj)->Decimal:
        return obj.subtotal - self.get_estimated_cost_total(obj)

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'customer',
            'vendor',
            'vendor_name',
            'status',
            'payment_method',
            'payment_status',
            'recipient_name',
            'recipient_phone',
            'delivery_area_name',
            'delivery_address_line',
            'delivery_landmark',
            'subtotal',
            'delivery_fee',
            'discount',
            'total_amount',
            'estimated_cost_total',
            'estimated_profit',
            'notes',
            'items',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class StaffOrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=Order.Status.choices
    )

    def validate_status(self, value):
        order = self.context.get('order')

        allowed_transitions = {
            Order.Status.PENDING: [
                Order.Status.CONFIRMED,
            ],
            Order.Status.CONFIRMED: [
                Order.Status.PROCESSING,
            ],
            Order.Status.PROCESSING: [
                Order.Status.SHIPPED,
            ],
            Order.Status.SHIPPED: [
                Order.Status.DELIVERED,
            ],
        }

        allowed_statuses = allowed_transitions.get(
            order.status, []
        )

        if value not in allowed_statuses:
            raise serializers.ValidationError(
                f"Cannot change order status from "
                f"{order.status} to {value}."
            )

        return value