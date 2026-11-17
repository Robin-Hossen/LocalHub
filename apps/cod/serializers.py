from rest_framework import serializers

from apps.cod.models import CODCollection

from decimal import Decimal

class CODCollectionCreateSerializer(serializers.Serializer):

    order_id = serializers.IntegerField(min_value=1)

    amount_collected = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal('0.01')
    )

    notes = serializers.CharField(
        required=False,
        allow_blank=True
    )


class CODCollectionResponseSerializer(serializers.ModelSerializer):

    order_number = serializers.CharField(
        source='order.order_number',
        read_only=True
    )

    collected_by_email = serializers.CharField(
        source='collected_by.email',
        read_only=True
    )

    class Meta:
        model = CODCollection
        fields = [
            'id',
            'order',
            'order_number',
            'amount_collected',
            'collected_by',
            'collected_by_email',
            'notes',
            'collected_at',
        ]
        read_only_fields = fields