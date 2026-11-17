from decimal import Decimal

from rest_framework import serializers

from apps.procurement.models import PurchaseOrder, PurchaseOrderItem,PurchaseReceiptItem,PurchaseReceipt


class PurchaseOrderItemInputSerializer(serializers.Serializer):

    product_id = serializers.IntegerField(min_value=1)

    quantity = serializers.IntegerField(min_value=1)

    unit_cost = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal('0.01')
    )


class PurchaseOrderCreateSerializer(serializers.Serializer):

    vendor_id = serializers.IntegerField(min_value=1)

    items = PurchaseOrderItemInputSerializer(many=True)

    notes = serializers.CharField(
        required=False,
        allow_blank=True
    )

    def validate_items(self, value):

        if not value:
            raise serializers.ValidationError(
                'Purchase order must contain at least one item.'
            )

        product_ids = [
            item['product_id']
            for item in value
        ]

        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError(
                'Duplicate products are not allowed.'
            )

        return value


class PurchaseOrderItemResponseSerializer(serializers.ModelSerializer):

    class Meta:
        model = PurchaseOrderItem
        fields = [
            'id',
            'product',
            'product_name',
            'product_sku',
            'quantity',
            'received_quantity',
            'unit_cost',
            'line_total',
        ]
        read_only_fields = fields


class PurchaseOrderResponseSerializer(serializers.ModelSerializer):

    vendor_name = serializers.CharField(
        source='vendor.name',
        read_only=True
    )

    created_by_email = serializers.CharField(
        source='created_by.email',
        read_only=True
    )

    items = PurchaseOrderItemResponseSerializer(many=True, read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            'id',
            'purchase_number',
            'vendor',
            'vendor_name',
            'status',
            'subtotal',
            'notes',
            'created_by',
            'created_by_email',
            'confirmed_at',
            'items',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class PurchaseReceiptItemInputSerializer(serializers.Serializer):

    purchase_order_item_id = serializers.IntegerField(min_value=1)

    quantity = serializers.IntegerField(min_value=1)


class PurchaseReceiptCreateSerializer(serializers.Serializer):

    items = PurchaseReceiptItemInputSerializer(many=True)

    notes = serializers.CharField(
        required=False,
        allow_blank=True
    )

    def validate_items(self, value):

        if not value:
            raise serializers.ValidationError(
                'At least one receiving item is required.'
            )

        item_ids = [
            item['purchase_order_item_id']
            for item in value
        ]

        if len(item_ids) != len(set(item_ids)):
            raise serializers.ValidationError(
                'Duplicate purchase order items are not allowed.'
            )

        return value


class PurchaseReceiptItemResponseSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(
        source='purchase_order_item.product_name',
        read_only=True
    )

    product_sku = serializers.CharField(
        source='purchase_order_item.product_sku',
        read_only=True
    )

    class Meta:
        model = PurchaseReceiptItem
        fields = [
            'id',
            'purchase_order_item',
            'product_name',
            'product_sku',
            'quantity',
            'unit_cost',
            'line_total',
        ]
        read_only_fields = fields


class PurchaseReceiptResponseSerializer(serializers.ModelSerializer):

    purchase_number = serializers.CharField(
        source='purchase_order.purchase_number',
        read_only=True
    )

    received_by_email = serializers.EmailField(
        source='received_by.email',
        read_only=True
    )

    items = PurchaseReceiptItemResponseSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = PurchaseReceipt
        fields = [
            'id',
            'purchase_order',
            'purchase_number',
            'received_by',
            'received_by_email',
            'notes',
            'items',
            'received_at',
        ]
        read_only_fields = fields