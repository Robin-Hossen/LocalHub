from rest_framework import serializers
from .models import Area, DeliveryCharge
from .models import CustomerAddress


class AreaSerializer(serializers.ModelSerializer):

    class Meta:
        model = Area
        fields = [
            'id',
            'name',
            'parent',
        ]


class DeliveryChargeSerializer(serializers.ModelSerializer):

    area_name = serializers.CharField(
        source='area.name',
        read_only=True
    )

    class Meta:
        model = DeliveryCharge
        fields = [
            'id',
            'area',
            'area_name',
            'fee',
            'minimum_order_amount',
        ]


class CustomerAddressSerializer(serializers.ModelSerializer):

    area_name = serializers.CharField(
        source='area.name',
        read_only=True
    )

    class Meta:
        model = CustomerAddress
        fields = [
            'id',
            'address_type',
            'recipient_name',
            'phone',
            'area',
            'area_name',
            'address_line',
            'landmark',
            'is_default',
            'created_at',
        ]

        read_only_fields = ['id', 'created_at']

    def validate_area(self, value):
        if not value.is_active:
            raise serializers.ValidationError(
                "This delivery area is currently unavailable."
            )

        return value