from rest_framework import serializers

from apps.vendors.models import Vendor
from apps.locations.models import Area
from apps.vendors.models import VendorType
from apps.vendors.services import create_vendor_with_defaults

class VendorSerializer(serializers.ModelSerializer):

    class Meta:
        model = Vendor
        fields = [
            'id',
            'name',
            'vendor_type',
            'contact_person',
            'phone',
            'email',
            'address',
            'area',
            'is_active',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
        ]

    def validate_vendor_type(self, value):
        if not value.is_active:
            raise serializers.ValidationError(
                "This vendor type is inactive."
            )
        return value

    def validate_area(self, value):
        if not value.is_active:
            raise serializers.ValidationError(
                "This area is inactive."
            )
        return value

    def create(self, validated_data):
        return create_vendor_with_defaults(**validated_data)