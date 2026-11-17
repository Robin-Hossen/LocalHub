from rest_framework import serializers

from apps.catalog.models import Product
from apps.catalog.models import Category
from apps.vendors.models import Vendor
from drf_spectacular.utils import extend_schema


class ProductSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(
    required=False,
    allow_null=True
   )

    class Meta:
        model = Product

        fields = [
            'id',
            'sku',
            'name',
            'category',
            'vendor',
            'description',
            'selling_price',
            'cost_price',
            'image',
            'is_available',
            'is_active',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
        ]

    def validate_category(self, value):
        if not value.is_active:
            raise serializers.ValidationError(
                "This category is inactive."
            )
        return value

    def validate_vendor(self, value):
        if not value.is_active:
            raise serializers.ValidationError(
                "This vendor is inactive."
            )
        return value
    
    def validate_image(self, value):
        if value:
            # Maximum file size: 5 MB
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError(
                    "Image size cannot exceed 5 MB."
                )

            # Allowed image formats
            allowed_extensions = ['jpg', 'jpeg', 'png', 'webp']
            extension = value.name.rsplit('.', 1)[-1].lower()

            if extension not in allowed_extensions:
                raise serializers.ValidationError(
                    "Only JPG, JPEG, PNG and WEBP images are allowed."
                )

        return value
    def validate_image(self, value):
        if value:
            # Maximum file size: 5 MB
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError(
                    "Image size cannot exceed 5 MB."
                )

            # Allowed image formats
            allowed_extensions = ['jpg', 'jpeg', 'png', 'webp']
            extension = value.name.rsplit('.', 1)[-1].lower()

            if extension not in allowed_extensions:
                raise serializers.ValidationError(
                    "Only JPG, JPEG, PNG and WEBP images are allowed."
                )

        return value
