from rest_framework import serializers
from apps.inventory.models import Stock, StockMovement


class StockSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(
        source='product.name',
        read_only=True
    )

    product_sku = serializers.CharField(
        source='product.sku',
        read_only=True
    )

    sellable_quantity = serializers.IntegerField(
        read_only=True
    )

    class Meta:
        model = Stock
        fields = [
            'id',
            'product',
            'product_name',
            'product_sku',
            'available_quantity',
            'reserved_quantity',
            'sellable_quantity',
            'reorder_level',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'product',
            'product_name',
            'product_sku',
            'available_quantity',
            'reserved_quantity',
            'sellable_quantity',
            'updated_at',
        ]

    sellable_quantity = serializers.SerializerMethodField()

    def get_sellable_quantity(self, obj)->int:
        return obj.available_quantity - obj.reserved_quantity


class StockMovementSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(
        source='product.name',
        read_only=True
    )

    class Meta:
        model = StockMovement
        fields = [
            'id',
            'product',
            'product_name',
            'movement_type',
            'quantity',
            'reference',
            'notes',
            'created_by',
            'created_at',
        ]
        read_only_fields = fields


class StockOperationSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(
        queryset=__import__(
            'apps.catalog.models',
            fromlist=['Product']
        ).Product.objects.filter(is_active=True)
    )
    quantity = serializers.IntegerField(min_value=1)
    reference = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True
    )

class StockRemoveSerializer(StockOperationSerializer):
    movement_type = serializers.ChoiceField(
        choices=[
            ('DAMAGE', 'Damage'),
            ('ADJUSTMENT_OUT', 'Adjustment Out'),
        ]
    )

class StockReserveSerializer(StockOperationSerializer):
    pass    


class StockReleaseSerializer(StockOperationSerializer):
    pass

class StockConsumeSerializer(StockOperationSerializer):
    pass