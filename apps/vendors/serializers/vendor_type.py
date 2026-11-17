from rest_framework import serializers
from apps.vendors.models import VendorType


class VendorTypeSerializer(serializers.ModelSerializer):

    class Meta:
        model = VendorType
        fields = [
            'id',
            'name',
            'description',
            'is_active',
        ]